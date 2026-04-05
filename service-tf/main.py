import os, io, sys, json, traceback
import numpy as np
import pandas as pd
import joblib
import shap
import requests
from PIL import Image
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR        = os.path.dirname(BASE_DIR)
FERTILIZER_DIR  = os.path.join(ROOT_DIR, "fertilizer_recommend")
YIELD_DIR       = os.path.join(ROOT_DIR, "yield_prediction")
WEATHER_DIR     = os.path.join(ROOT_DIR, "weather_advisory")

# ── Fertilizer + Soil models ──
fert_model = joblib.load(os.path.join(FERTILIZER_DIR, "models", "fertilizer_model.pkl"))
le_soil    = joblib.load(os.path.join(FERTILIZER_DIR, "models", "soil_encoder.pkl"))
le_crop    = joblib.load(os.path.join(FERTILIZER_DIR, "models", "crop_encoder.pkl"))
le_fert    = joblib.load(os.path.join(FERTILIZER_DIR, "models", "fertilizer_encoder.pkl"))
fert_shap  = shap.TreeExplainer(fert_model)

import tensorflow as tf
soil_cnn = tf.keras.models.load_model(os.path.join(FERTILIZER_DIR, "models", "cnn_80_plus_model.h5"))
print("[INFO] Fertilizer + Soil CNN loaded")

CNN_CLASSES = ["alluvial","black","chalk","clay","laterite","loamy","peat","red","sandy","silt"]
CNN_TO_FERT_SOIL = {
    "alluvial":"Loamy","black":"Black","chalk":"Sandy",
    "clay":"Black","laterite":"Red","loamy":"Loamy",
    "peat":"Loamy","red":"Red","sandy":"Sandy","silt":"Loamy",
}

# ── Yield prediction ──
sys.path.insert(0, YIELD_DIR)
from predict import predict_yield, le_crop as yield_le_crop, le_category, RAINFALL_MAP
print("[INFO] Yield module loaded")

# ── Weather ──
sys.path.insert(0, WEATHER_DIR)
from advisory import generate_advisory
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

def _get_weather(city):
    return requests.get(f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric").json()

def _get_forecast(city):
    return requests.get(f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={WEATHER_API_KEY}&units=metric").json()

# ── App ──
app = FastAPI(title="TF Service — Fertilizer / Yield / Weather")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root(): return {"service": "tf-service", "status": "ok"}

# ── Fertilizer ──
class FertilizerInput(BaseModel):
    Temperature: float; Humidity: float; Moisture: float
    Soil_Type: str;     Crop_Type: str
    Nitrogen: float;    Potassium: float; Phosphorous: float

@app.get("/fertilizer/options")
def fertilizer_options():
    return {"soil_types": CNN_CLASSES, "crop_types": list(le_crop.classes_)}

@app.post("/fertilizer/predict-soil")
async def predict_soil(file: UploadFile = File(...)):
    img  = Image.open(io.BytesIO(await file.read())).convert("RGB")
    arr  = np.expand_dims(np.array(img.resize((224,224)), dtype=np.float32)/255.0, axis=0)
    pred = soil_cnn.predict(arr, verbose=0)
    idx  = int(np.argmax(pred[0]))
    conf = float(np.max(pred[0]))
    detected = CNN_CLASSES[idx]
    top3_idx = np.argsort(pred[0])[::-1][:3]
    return {
        "detected_soil": detected,
        "soil_type": CNN_TO_FERT_SOIL[detected],
        "confidence": round(conf, 4),
        "top3": [{"soil_type": CNN_CLASSES[i], "confidence": round(float(pred[0][i]),4)} for i in top3_idx]
    }

@app.post("/fertilizer/predict")
def fertilizer_predict(data: FertilizerInput):
    try:
        fertilizer_soil = CNN_TO_FERT_SOIL.get(data.Soil_Type, data.Soil_Type)
        soil_encoded = int(le_soil.transform([fertilizer_soil])[0])
        crop_encoded = int(le_crop.transform([data.Crop_Type])[0])
        raw = {
            "Temperature": data.Temperature, "Temparature": data.Temperature,
            "Humidity": data.Humidity, "Moisture": data.Moisture,
            "Soil Type": soil_encoded, "Crop Type": crop_encoded,
            "Nitrogen": data.Nitrogen, "Potassium": data.Potassium, "Phosphorous": data.Phosphorous,
        }
        X_columns = list(fert_model.feature_names_in_)
        df = pd.DataFrame([{col: raw.get(col,0) for col in X_columns}])
        pred_encoded = int(fert_model.predict(df)[0])
        pred = le_fert.inverse_transform([pred_encoded])[0]
        shap_vals = fert_shap.shap_values(df)
        shap_arr  = np.array(shap_vals)
        if shap_arr.ndim == 3:
            class_shap = shap_arr[0,:,min(pred_encoded, shap_arr.shape[2]-1)]
        elif shap_arr.ndim == 2:
            class_shap = shap_arr[0,:]
        else:
            class_shap = shap_arr.flatten()[:len(X_columns)]
        explanation = {col: round(float(class_shap[i]),4) for i,col in enumerate(X_columns)}
        sorted_exp  = sorted(explanation.items(), key=lambda x: abs(x[1]), reverse=True)
        reason = [f"{f} is {'high' if v>0 else 'low'}" for f,v in sorted_exp[:5] if v!=0]
        return {"predicted_fertilizer": pred, "explanation": explanation, "reason": reason}
    except Exception as e:
        raise HTTPException(500, detail=str(e))

# ── Yield ──
class YieldRequest(BaseModel):
    crop: str; crop_category: str; year: int
    rainfall_label: str; avg_temp_c: float; fertilizer_npk_kg_ha: float

@app.get("/yield/crops")
def yield_crops():
    return {"crops": list(yield_le_crop.classes_), "categories": list(le_category.classes_), "rainfall_options": list(RAINFALL_MAP.keys())}

@app.post("/yield/predict")
def yield_predict(req: YieldRequest):
    try:
        return predict_yield(crop=req.crop, crop_category=req.crop_category, year=req.year,
                             rainfall_label=req.rainfall_label, avg_temp_c=req.avg_temp_c,
                             fertilizer_npk_kg_ha=req.fertilizer_npk_kg_ha)
    except Exception as e:
        raise HTTPException(500, detail=str(e))

# ── Weather ──
class WeatherRequest(BaseModel):
    city: str; crop: str

@app.post("/weather/advisory")
def weather_advisory(req: WeatherRequest):
    try:
        if not WEATHER_API_KEY:
            raise HTTPException(500, "WEATHER_API_KEY not set")
        current  = _get_weather(req.city)
        forecast = _get_forecast(req.city)
        if current.get("cod") != 200:
            raise HTTPException(400, f"City not found: {req.city}")
        return {
            "city": req.city, "crop": req.crop,
            "temperature": current["main"]["temp"],
            "humidity": current["main"]["humidity"],
            "wind": current["wind"]["speed"],
            "advice": generate_advisory(current, forecast, req.crop)
        }
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(500, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)