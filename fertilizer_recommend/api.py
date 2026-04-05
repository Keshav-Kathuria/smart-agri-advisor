from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import shap
import os
import traceback
import numpy as np
from PIL import Image
import io

# ── Paths ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Load fertilizer model and encoders ──
model   = joblib.load(os.path.join(BASE_DIR, 'models', 'fertilizer_model.pkl'))
le_soil = joblib.load(os.path.join(BASE_DIR, 'models', 'soil_encoder.pkl'))
le_crop = joblib.load(os.path.join(BASE_DIR, 'models', 'crop_encoder.pkl'))
le_fert = joblib.load(os.path.join(BASE_DIR, 'models', 'fertilizer_encoder.pkl'))

# ── Load CNN soil image classifier ──
import tensorflow as tf
cnn_model = tf.keras.models.load_model(os.path.join(BASE_DIR, 'models', 'cnn_80_plus_model.h5'))

# CNN was trained on 10 soil classes (folder names, alphabetical order).
# These MUST match your training dataset folder names exactly.
CNN_CLASSES = ['alluvial', 'black', 'chalk', 'clay', 'laterite', 'loamy', 'peat', 'red', 'sandy', 'silt']

# The fertilizer model only knows 4 soil types (le_soil.classes_).
# Map every CNN class → nearest agronomic equivalent for fertilizer prediction.
# The UI will show BOTH — the real detected type AND the mapped type used for prediction.
CNN_TO_FERTILIZER_SOIL = {
    'alluvial' : 'Loamy',   # fine sediment, closest to loamy texture
    'black'    : 'Black',
    'chalk'    : 'Sandy',   # light, free-draining, low nutrients like sandy
    'clay'     : 'Black',   # heavy, moisture-retaining like black soil
    'laterite' : 'Red',     # leached, iron-rich — same profile as red
    'loamy'    : 'Loamy',
    'peat'     : 'Loamy',   # high organic matter, closest to loamy
    'red'      : 'Red',
    'sandy'    : 'Sandy',
    'silt'     : 'Loamy',   # fine-textured, moderate fertility like loamy
}

# ── SHAP ──
explainer = shap.TreeExplainer(model)

# ── App ──
app = FastAPI(title="Fertilizer Recommendation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Input schema ──
class FertilizerInput(BaseModel):
    Temperature : float
    Humidity    : float
    Moisture    : float
    Soil_Type   : str
    Crop_Type   : str
    Nitrogen    : float
    Potassium   : float
    Phosphorous : float

# ── Routes ──
@app.get("/")
def root():
    return {"message": "Fertilizer Recommendation API is running"}

@app.get("/options")
def get_options():
    return {
        "soil_types" : CNN_CLASSES,          # all 10 — shown in dropdown
        "crop_types" : list(le_crop.classes_),
    }

# ── Soil Type Detection from Image (local CNN) ──
@app.post("/predict-soil")
async def predict_soil(file: UploadFile = File(...)):
    """
    Upload a soil photo → CNN classifies it → returns a soil_type
    that maps directly to one of le_soil.classes_ for the fertilizer model.
    """
    ALLOWED = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WEBP images are supported.")

    image_bytes = await file.read()

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode the uploaded image.")

    # Preprocess: resize to 224x224, scale to [0,1] — matches training pipeline exactly
    img_resized = img.resize((224, 224))
    arr = np.array(img_resized, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)   # (1, 224, 224, 3)

    preds      = cnn_model.predict(arr, verbose=0)   # (1, num_classes)
    class_idx  = int(np.argmax(preds[0]))
    confidence = float(np.max(preds[0]))

    detected_class  = CNN_CLASSES[class_idx]                     # e.g. "laterite"
    fertilizer_soil = CNN_TO_FERTILIZER_SOIL[detected_class]    # e.g. "Red"

    # Top-3 for frontend confidence bars
    top3_indices = np.argsort(preds[0])[::-1][:3]
    top3 = [
        {
            "soil_type"       : CNN_CLASSES[i],
            "fertilizer_soil" : CNN_TO_FERTILIZER_SOIL[CNN_CLASSES[i]],
            "confidence"      : round(float(preds[0][i]), 4),
        }
        for i in top3_indices
    ]

    return {
        "detected_soil" : detected_class,    # actual CNN label shown in UI
        "soil_type"     : fertilizer_soil,   # mapped value — auto-fills the dropdown
        "confidence"    : round(confidence, 4),
        "top3"          : top3,
        "approximation" : detected_class.lower() != fertilizer_soil.lower(),
    }

# ── Fertilizer Prediction ──
@app.post("/predict")
def predict(data: FertilizerInput):
    try:
        # ── Validate crop ──
        if data.Crop_Type not in le_crop.classes_:
            return {"error": f"Unknown Crop_Type '{data.Crop_Type}'. Valid: {list(le_crop.classes_)}"}

        # ── Map soil: accept all 10 CNN types, silently approximate to the 4 fertilizer classes ──
        if data.Soil_Type in CNN_TO_FERTILIZER_SOIL:
            fertilizer_soil = CNN_TO_FERTILIZER_SOIL[data.Soil_Type]
        elif data.Soil_Type in le_soil.classes_:
            fertilizer_soil = data.Soil_Type
        else:
            return {"error": f"Unknown Soil_Type '{data.Soil_Type}'."}

        if fertilizer_soil not in le_soil.classes_:
            return {"error": f"Mapped soil '{fertilizer_soil}' not in encoder classes."}

        # ── Encode ──
        soil_encoded = int(le_soil.transform([fertilizer_soil])[0])
        crop_encoded = int(le_crop.transform([data.Crop_Type])[0])

        # Covers both correct spelling and the common training typo variant
        raw = {
            "Temperature" : data.Temperature,
            "Temparature" : data.Temperature,
            "Humidity"    : data.Humidity,
            "Moisture"    : data.Moisture,
            "Soil Type"   : soil_encoded,
            "Crop Type"   : crop_encoded,
            "Nitrogen"    : data.Nitrogen,
            "Potassium"   : data.Potassium,
            "Phosphorous" : data.Phosphorous,
        }

        X_columns = list(model.feature_names_in_)
        df = pd.DataFrame([{col: raw.get(col, 0) for col in X_columns}])

        # ── Predict ──
        pred_encoded = int(model.predict(df)[0])
        pred         = le_fert.inverse_transform([pred_encoded])[0]

        # ── SHAP — handles 2-D (binary) and 3-D (multi-class) arrays ──
        shap_vals = explainer.shap_values(df)
        shap_arr  = np.array(shap_vals)

        if shap_arr.ndim == 3:
            class_idx  = min(pred_encoded, shap_arr.shape[2] - 1)
            class_shap = shap_arr[0, :, class_idx]
        elif shap_arr.ndim == 2:
            class_shap = shap_arr[0, :]
        else:
            class_shap = shap_arr.flatten()[:len(X_columns)]

        explanation = {
            col: round(float(class_shap[i]), 4)
            for i, col in enumerate(X_columns)
        }

        # ── Natural language reasons ──
        sorted_exp = sorted(explanation.items(), key=lambda x: abs(x[1]), reverse=True)
        reason = []
        for feature, value in sorted_exp[:5]:
            if value > 0:
                reason.append(f"{feature} is high — pushing towards {pred}")
            elif value < 0:
                reason.append(f"{feature} is low — reducing need for {pred}")

        return {
            "predicted_fertilizer" : pred,
            "explanation"          : explanation,
            "reason"               : reason,
        }

    except Exception as e:
        return {
            "error" : str(e),
            "trace" : traceback.format_exc(),
        }