from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from predict import predict_yield

app = FastAPI(
    title       = "Smart Agriculture API",
    description = "Crop yield prediction with SHAP explainability",
    version     = "1.0.0"
)

#CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# Request model
class YieldRequest(BaseModel):
    crop                 : str
    crop_category        : str
    year                 : int
    rainfall_label       : str
    avg_temp_c           : float
    fertilizer_npk_kg_ha : float

#Routes
@app.get("/")
def root():
    return {"message": "Smart Agriculture API is running"}

@app.get("/crops")
def get_crops():
    from predict import le_crop, le_category, RAINFALL_MAP
    return {
        "crops"            : list(le_crop.classes_),
        "categories"       : list(le_category.classes_),
        "rainfall_options" : list(RAINFALL_MAP.keys())
    }

@app.post("/predict/yield")
def yield_prediction(request: YieldRequest):
    result = predict_yield(
        crop                 = request.crop,
        crop_category        = request.crop_category,
        year                 = request.year,
        rainfall_label       = request.rainfall_label,
        avg_temp_c           = request.avg_temp_c,
        fertilizer_npk_kg_ha = request.fertilizer_npk_kg_ha
    )
    return result