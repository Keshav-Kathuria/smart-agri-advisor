import os
import io
import json
import uuid
import traceback

import numpy as np
import pandas as pd
import joblib
import shap
import torch
import torch.nn as nn
import torch.nn.functional as F
import requests

from PIL import Image
from torchvision import transforms
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

# ─────────────────────────────────────────────
# Paths — all relative to this file
# api/main.py sits one level above the module folders
# ─────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.dirname(BASE_DIR)   # project root

DISEASE_DIR     = os.path.join(ROOT_DIR, "disease_detection")
FERTILIZER_DIR  = os.path.join(ROOT_DIR, "fertilizer_recommend")
YIELD_DIR       = os.path.join(ROOT_DIR, "yield_prediction")
WEATHER_DIR     = os.path.join(ROOT_DIR, "weather_advisory")


# ═════════════════════════════════════════════
# DISEASE DETECTION  (PyTorch)
# ═════════════════════════════════════════════

class ResidualBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, stride, 1, bias=False)
        self.bn1   = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, 1, 1, bias=False)
        self.bn2   = nn.BatchNorm2d(out_channels)
        self.skip  = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.skip = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 1, stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        identity = self.skip(x)
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return self.relu(out + identity)


class CustomCNN(nn.Module):
    def __init__(self, num_classes=38):
        super().__init__()
        self.initial = nn.Sequential(
            nn.Conv2d(3, 64, 7, 2, 3, bias=False),
            nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(3, 2, 1)
        )
        self.stage1 = nn.Sequential(ResidualBlock(64, 64),   ResidualBlock(64, 64))
        self.stage2 = nn.Sequential(ResidualBlock(64, 128, 2), ResidualBlock(128, 128))
        self.stage3 = nn.Sequential(ResidualBlock(128, 256, 2), ResidualBlock(256, 256))
        self.stage4 = nn.Sequential(ResidualBlock(256, 512, 2), ResidualBlock(512, 512))
        self.gap     = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier = nn.Sequential(
            nn.Dropout(0.4), nn.Linear(512, 256), nn.ReLU(),
            nn.Dropout(0.3), nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.initial(x)
        x = self.stage1(x); x = self.stage2(x)
        x = self.stage3(x); x = self.stage4(x)
        x = self.gap(x)
        x = x.view(x.size(0), -1)
        return self.classifier(x)


device       = torch.device("cuda" if torch.cuda.is_available() else "cpu")
disease_model = CustomCNN(num_classes=38).to(device)

try:
    disease_model.load_state_dict(
        torch.load(os.path.join(DISEASE_DIR, "models", "plant_disease_model_v2.pt"), map_location=device),
        strict=False
    )
    disease_model.eval()
    print("[INFO] Disease model loaded")
except Exception as e:
    print(f"[ERROR] Disease model: {e}")


def _safe_csv(path):
    try:
        return pd.read_csv(path, encoding="cp1252")
    except Exception as e:
        print(f"[ERROR] CSV {path}: {e}")
        return None

disease_info    = _safe_csv(os.path.join(DISEASE_DIR, "data", "disease_info.csv"))
supplement_info = _safe_csv(os.path.join(DISEASE_DIR, "data", "supplement_info.csv"))

try:
    with open(os.path.join(DISEASE_DIR, "class_mapping.json")) as f:
        idx_to_class = {int(k): v for k, v in json.load(f).items()}
    print(f"[INFO] class_mapping loaded: {len(idx_to_class)} classes")
except Exception as e:
    idx_to_class = {}
    print(f"[ERROR] class_mapping: {e}")

CONFIDENCE_THRESHOLD = 65.0

disease_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


def _predict_disease(image_bytes: bytes, top_k=3):
    image  = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = disease_transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        probs = F.softmax(disease_model(tensor), dim=1)[0]
    top_probs, top_idx = torch.topk(probs, top_k)
    return [
        {
            "class_index": int(i),
            "class_name":  idx_to_class.get(int(i), "Unknown").replace("_", " "),
            "confidence":  round(float(p) * 100, 2),
        }
        for p, i in zip(top_probs.cpu(), top_idx.cpu())
    ]


def _disease_info(class_index):
    if disease_info is None: return {}
    row = disease_info[disease_info["index"] == class_index]
    if row.empty: return {}
    row = row.iloc[0]
    return {
        "disease_name":   str(row.get("disease_name", "")),
        "description":    str(row.get("description", "")),
        "possible_steps": str(row.get("Possible Steps", "")),
        "image_url":      str(row.get("image_url", "")),
    }


def _supplement_info(class_index):
    if supplement_info is None: return {}
    row = supplement_info[supplement_info["index"] == class_index]
    if row.empty: return {}
    row = row.iloc[0]
    return {
        "supplement_name":  str(row.get("supplement name", "")),
        "supplement_image": str(row.get("supplement image", "")),
        "buy_link":         str(row.get("buy link", "")),
    }


# ═════════════════════════════════════════════
# FERTILIZER RECOMMENDATION  (sklearn + TF CNN)
# ═════════════════════════════════════════════

fert_model = joblib.load(os.path.join(FERTILIZER_DIR, "models", "fertilizer_model.pkl"))
le_soil    = joblib.load(os.path.join(FERTILIZER_DIR, "models", "soil_encoder.pkl"))
le_crop    = joblib.load(os.path.join(FERTILIZER_DIR, "models", "crop_encoder.pkl"))
le_fert    = joblib.load(os.path.join(FERTILIZER_DIR, "models", "fertilizer_encoder.pkl"))
fert_shap  = shap.TreeExplainer(fert_model)

import tensorflow as tf
soil_cnn = tf.keras.models.load_model(os.path.join(FERTILIZER_DIR, "models", "cnn_80_plus_model.h5"))
print("[INFO] Fertilizer + soil CNN models loaded")

CNN_CLASSES = ["alluvial", "black", "chalk", "clay", "laterite", "loamy", "peat", "red", "sandy", "silt"]

CNN_TO_FERT_SOIL = {
    "alluvial": "Loamy", "black": "Black", "chalk": "Sandy",
    "clay":     "Black", "laterite": "Red", "loamy": "Loamy",
    "peat":     "Loamy", "red": "Red",     "sandy": "Sandy", "silt": "Loamy",
}


# ═════════════════════════════════════════════
# YIELD PREDICTION  (XGBoost + sklearn)
# ═════════════════════════════════════════════
import sys
sys.path.insert(0, YIELD_DIR)
from predict import predict_yield, le_crop as yield_le_crop, le_category, RAINFALL_MAP
print("[INFO] Yield prediction module loaded")


# ═════════════════════════════════════════════
# WEATHER ADVISORY
# ═════════════════════════════════════════════
sys.path.insert(0, WEATHER_DIR)
from advisory import generate_advisory

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")


def _get_weather(city: str):
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
    return requests.get(url).json()


def _get_forecast(city: str):
    url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={WEATHER_API_KEY}&units=metric"
    return requests.get(url).json()


# ═════════════════════════════════════════════
# FastAPI App
# ═════════════════════════════════════════════

app = FastAPI(
    title       = "Smart Agriculture Platform API",
    description = "Unified API — disease detection, fertilizer recommendation, yield prediction, weather advisory",
    version     = "2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


@app.get("/")
def root():
    return {
        "message": "Smart Agriculture Platform API",
        "modules": {
            "disease":    ["/disease/predict", "/disease/classes", "/disease/health"],
            "fertilizer": ["/fertilizer/options", "/fertilizer/predict-soil", "/fertilizer/predict"],
            "yield":      ["/yield/crops", "/yield/predict"],
            "weather":    ["/weather/advisory"],
        }
    }


# ─────────────────────────────────────────────
# DISEASE routes
# ─────────────────────────────────────────────

@app.get("/disease/health")
def disease_health():
    return {
        "status":               "ok",
        "device":               str(device),
        "model_loaded":         len(idx_to_class) > 0,
        "num_classes":          len(idx_to_class),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
    }


@app.get("/disease/classes")
def disease_classes():
    if disease_info is None:
        raise HTTPException(500, "disease_info.csv not loaded")
    return [
        {
            "index":        int(row["index"]),
            "disease_name": str(row["disease_name"]),
            "class_key":    idx_to_class.get(int(row["index"]), "Unknown"),
        }
        for _, row in disease_info.iterrows()
    ]


@app.post("/disease/predict")
async def disease_predict(image: UploadFile = File(...)):
    allowed = {"image/jpeg", "image/png", "image/jpg"}
    if image.content_type not in allowed:
        raise HTTPException(400, "Only JPEG or PNG images are supported.")

    image_bytes = await image.read()

    try:
        preds = _predict_disease(image_bytes)
    except Exception as e:
        raise HTTPException(500, str(e))

    top = preds[0]
    if top["confidence"] < CONFIDENCE_THRESHOLD:
        return {
            "status":  "uncertain",
            "message": "Could not confidently identify a plant disease. Please upload a clear, well-lit leaf image.",
            "top3":    preds,
        }

    idx = top["class_index"]
    return {
        "status":       "success",
        "prediction":   top,
        "top3":         preds,
        "disease_info": _disease_info(idx),
        "supplement":   _supplement_info(idx),
    }


# ─────────────────────────────────────────────
# FERTILIZER routes
# ─────────────────────────────────────────────

class FertilizerInput(BaseModel):
    Temperature : float
    Humidity    : float
    Moisture    : float
    Soil_Type   : str
    Crop_Type   : str
    Nitrogen    : float
    Potassium   : float
    Phosphorous : float


@app.get("/fertilizer/options")
def fertilizer_options():
    return {
        "soil_types": CNN_CLASSES,
        "crop_types": list(le_crop.classes_),
    }


@app.post("/fertilizer/predict-soil")
async def fertilizer_predict_soil(file: UploadFile = File(...)):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Only JPEG, PNG, or WEBP images are supported.")

    image_bytes = await file.read()
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Could not decode image.")

    arr        = np.expand_dims(np.array(img.resize((224, 224)), dtype=np.float32) / 255.0, axis=0)
    preds      = soil_cnn.predict(arr, verbose=0)
    class_idx  = int(np.argmax(preds[0]))
    confidence = float(np.max(preds[0]))

    detected      = CNN_CLASSES[class_idx]
    mapped_soil   = CNN_TO_FERT_SOIL[detected]
    top3_idx      = np.argsort(preds[0])[::-1][:3]

    return {
        "detected_soil": detected,
        "soil_type":     mapped_soil,
        "confidence":    round(confidence, 4),
        "approximation": detected.lower() != mapped_soil.lower(),
        "top3": [
            {
                "soil_type":       CNN_CLASSES[i],
                "fertilizer_soil": CNN_TO_FERT_SOIL[CNN_CLASSES[i]],
                "confidence":      round(float(preds[0][i]), 4),
            }
            for i in top3_idx
        ],
    }


@app.post("/fertilizer/predict")
def fertilizer_predict(data: FertilizerInput):
    try:
        if data.Crop_Type not in le_crop.classes_:
            raise HTTPException(400, f"Unknown Crop_Type '{data.Crop_Type}'.")

        if data.Soil_Type in CNN_TO_FERT_SOIL:
            fertilizer_soil = CNN_TO_FERT_SOIL[data.Soil_Type]
        elif data.Soil_Type in le_soil.classes_:
            fertilizer_soil = data.Soil_Type
        else:
            raise HTTPException(400, f"Unknown Soil_Type '{data.Soil_Type}'.")

        soil_encoded = int(le_soil.transform([fertilizer_soil])[0])
        crop_encoded = int(le_crop.transform([data.Crop_Type])[0])

        raw = {
            "Temperature": data.Temperature, "Temparature": data.Temperature,
            "Humidity":    data.Humidity,    "Moisture":    data.Moisture,
            "Soil Type":   soil_encoded,     "Crop Type":   crop_encoded,
            "Nitrogen":    data.Nitrogen,    "Potassium":   data.Potassium,
            "Phosphorous": data.Phosphorous,
        }

        X_columns    = list(fert_model.feature_names_in_)
        df           = pd.DataFrame([{col: raw.get(col, 0) for col in X_columns}])
        pred_encoded = int(fert_model.predict(df)[0])
        pred         = le_fert.inverse_transform([pred_encoded])[0]

        shap_vals  = fert_shap.shap_values(df)
        shap_arr   = np.array(shap_vals)
        if shap_arr.ndim == 3:
            class_shap = shap_arr[0, :, min(pred_encoded, shap_arr.shape[2] - 1)]
        elif shap_arr.ndim == 2:
            class_shap = shap_arr[0, :]
        else:
            class_shap = shap_arr.flatten()[:len(X_columns)]

        explanation = {col: round(float(class_shap[i]), 4) for i, col in enumerate(X_columns)}
        sorted_exp  = sorted(explanation.items(), key=lambda x: abs(x[1]), reverse=True)
        reason = [
            f"{f} is {'high' if v > 0 else 'low'} — {'pushing towards' if v > 0 else 'reducing need for'} {pred}"
            for f, v in sorted_exp[:5] if v != 0
        ]

        return {"predicted_fertilizer": pred, "explanation": explanation, "reason": reason}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail={"error": str(e), "trace": traceback.format_exc()})


# ─────────────────────────────────────────────
# YIELD routes
# ─────────────────────────────────────────────

class YieldRequest(BaseModel):
    crop                 : str
    crop_category        : str
    year                 : int
    rainfall_label       : str
    avg_temp_c           : float
    fertilizer_npk_kg_ha : float


@app.get("/yield/crops")
def yield_crops():
    return {
        "crops":            list(yield_le_crop.classes_),
        "categories":       list(le_category.classes_),
        "rainfall_options": list(RAINFALL_MAP.keys()),
    }


@app.post("/yield/predict")
def yield_predict(req: YieldRequest):
    try:
        result = predict_yield(
            crop                 = req.crop,
            crop_category        = req.crop_category,
            year                 = req.year,
            rainfall_label       = req.rainfall_label,
            avg_temp_c           = req.avg_temp_c,
            fertilizer_npk_kg_ha = req.fertilizer_npk_kg_ha,
        )
        return result
    except Exception as e:
        raise HTTPException(500, detail={"error": str(e), "trace": traceback.format_exc()})


# ─────────────────────────────────────────────
# WEATHER routes
# ─────────────────────────────────────────────

class WeatherRequest(BaseModel):
    city: str
    crop: str

@app.post("/weather/advisory")
def weather_advisory(req: WeatherRequest):
    try:
        print(f"[WEATHER] API_KEY loaded: {bool(WEATHER_API_KEY)}")
        if not WEATHER_API_KEY:
            raise HTTPException(500, "WEATHER_API_KEY not set in environment.")

        current  = _get_weather(req.city)
        print(f"[WEATHER] current response: {current.get('cod')}")
        forecast = _get_forecast(req.city)

        if current.get("cod") != 200:
            raise HTTPException(400, f"City not found: {req.city}")

        advice = generate_advisory(current, forecast, req.crop)

        return {
            "city":        req.city,
            "crop":        req.crop,
            "temperature": current["main"]["temp"],
            "humidity":    current["main"]["humidity"],
            "wind":        current["wind"]["speed"],
            "advice":      advice,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WEATHER ERROR] {traceback.format_exc()}")
        raise HTTPException(500, str(e))

# ─────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)