from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
import shap

# --------------------------
# Load trained model and encoders
# --------------------------
model = joblib.load("fertilizer_model.pkl")
le_soil = joblib.load("soil_encoder.pkl")
le_crop = joblib.load("crop_encoder.pkl")
le_fert = joblib.load("fertilizer_encoder.pkl")

# Initialize SHAP TreeExplainer
explainer = shap.TreeExplainer(model)

# --------------------------
# API input schema
# --------------------------
class FertilizerInput(BaseModel):
    Temperature: float
    Humidity: float
    Moisture: float
    Soil_Type: str
    Crop_Type: str
    Nitrogen: float
    Potassium: float
    Phosphorous: float

app = FastAPI(title="Fertilizer Recommendation API with SHAP")

# --------------------------
# Prediction endpoint
# --------------------------
@app.post("/predict")
def predict(data: FertilizerInput):
    try:
        # --------------------------
        # Encode categorical values first
        # --------------------------
        soil_encoded = le_soil.transform([str(data.Soil_Type)])[0]
        crop_encoded = le_crop.transform([str(data.Crop_Type)])[0]

        # --------------------------
        # Build DataFrame with numeric features
        # --------------------------
        df = pd.DataFrame([{
            "Temperature": data.Temperature,
            "Humidity": data.Humidity,
            "Moisture": data.Moisture,
            "Soil Type": soil_encoded,
            "Crop Type": crop_encoded,
            "Nitrogen": data.Nitrogen,
            "Potassium": data.Potassium,
            "Phosphorous": data.Phosphorous
        }])

        # Align columns with model features
        X_columns = model.feature_names_in_
        for col in X_columns:
            if col not in df.columns:
                df[col] = 0
        df = df[X_columns]

        # Predict
        pred_encoded = model.predict(df)[0]
        pred = le_fert.inverse_transform([pred_encoded])[0]

        # SHAP explanation
        shap_values = explainer.shap_values(df)
        if isinstance(shap_values, list):
            shap_class_values = shap_values[pred_encoded]
        else:
            shap_class_values = shap_values
        explanation = {feature: float(shap_class_values[0][i]) for i, feature in enumerate(X_columns)}

        # Human-readable reasoning
        reason = []
        for feature, value in explanation.items():
            if value > 0:
                reason.append(f"{feature} contributes positively")
            elif value < 0:
                reason.append(f"{feature} contributes negatively")

        return {
            "predicted_fertilizer": pred,
            "explanation": explanation,
            "reason": reason
        }

    except Exception as e:
        return {"error": str(e)}
