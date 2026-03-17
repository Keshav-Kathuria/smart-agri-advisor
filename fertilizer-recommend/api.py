from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import shap
import os
import traceback

# ── Paths ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Load model and encoders ──
model   = joblib.load(os.path.join(BASE_DIR, 'models', 'fertilizer_model.pkl'))
le_soil = joblib.load(os.path.join(BASE_DIR, 'models', 'soil_encoder.pkl'))
le_crop = joblib.load(os.path.join(BASE_DIR, 'models', 'crop_encoder.pkl'))
le_fert = joblib.load(os.path.join(BASE_DIR, 'models', 'fertilizer_encoder.pkl'))

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
        "soil_types" : list(le_soil.classes_),
        "crop_types" : list(le_crop.classes_),
    }

@app.post("/predict")
def predict(data: FertilizerInput):
    try:
        # ── Encode categoricals ──
        soil_encoded = le_soil.transform([data.Soil_Type])[0]
        crop_encoded = le_crop.transform([data.Crop_Type])[0]

        # ── Build input df ──
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

        # ── SHAP ──
        shap_vals  = explainer.shap_values(df)
        class_idx  = min(pred_encoded, shap_vals.shape[2] - 1)
        class_shap = shap_vals[0, :, class_idx]

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
            "reason"               : reason
        }

    except Exception as e:
        return {
            "error" : str(e),
            "trace" : traceback.format_exc()
        }