import joblib
import numpy as np
import pandas as pd
import shap
import os 

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

#Load model and encoders 
xgb_model  = joblib.load(os.path.join(BASE_DIR, 'models', 'xgboost_model.pkl'))
le_crop     = joblib.load(os.path.join(BASE_DIR, 'models', 'le_crop.pkl'))
le_category = joblib.load(os.path.join(BASE_DIR, 'models', 'le_category.pkl'))
le_rainfall = joblib.load(os.path.join(BASE_DIR, 'models', 'le_rainfall_category.pkl'))

FEATURES = [
    'crop_encoded', 'crop_category_encoded', 'year', 'decade',
    'area_harvested_ha', 'log_area', 'rainfall_mm',
    'rainfall_category_encoded', 'avg_temp_c',
    'fertilizer_npk_kg_ha', 'cropland_mha'
]

FEATURE_LABELS = {
    'crop_encoded'              : 'crop type',
    'crop_category_encoded'     : 'crop category',
    'year'                      : 'year',
    'decade'                    : 'decade',
    'area_harvested_ha'         : 'harvested area',
    'log_area'                  : 'harvested area (log)',
    'rainfall_mm'               : 'rainfall',
    'rainfall_category_encoded' : 'rainfall category',
    'avg_temp_c'                : 'temperature',
    'fertilizer_npk_kg_ha'      : 'fertilizer usage',
    'cropland_mha'              : 'total cropland'
}

# Crop area defaults (national averages in hectares)
CROP_AREA_DEFAULTS = {
    "Wheat"           : 31000000,
    "Rice"            : 44000000,
    "Maize (corn)"    : 9000000,
    "Barley"          : 700000,
    "Millet"          : 14000000,
    "Sorghum"         : 5000000,
    "Potatoes"        : 2200000,
    "Tomatoes"        : 800000,
    "Onions and shallots, dry (excluding dehydrated)": 1200000,
    "Sugar cane"      : 5000000,
    "Soya beans"      : 11000000,
    "Groundnuts, excluding shelled": 6000000,
    "Cotton"          : 13000000,
    "Bananas"         : 900000,
    "Mangoes, guavas and mangosteens": 2500000,
}
DEFAULT_AREA      = 5000000   # fallback for crops not in list
DEFAULT_CROPLAND  = 169.0     # national cropland mha fixed

# Rainfall dropdown mapping
RAINFALL_MAP = {
    "Low (Drought)"    : 700,
    "Below Normal"     : 875,
    "Normal Monsoon"   : 1000,
    "Heavy Rainfall"   : 1200,
}

# SHAP explainer
explainer = shap.TreeExplainer(xgb_model)


def get_rainfall_category(rainfall_mm):
    if rainfall_mm < 800:
        return 'Drought'
    elif rainfall_mm < 950:
        return 'Below Normal'
    elif rainfall_mm < 1100:
        return 'Normal'
    else:
        return 'Above Normal'


def predict_yield(crop, crop_category, year,rainfall_label, avg_temp_c,fertilizer_npk_kg_ha):

    # Map rainfall label to mm 
    rainfall_mm = RAINFALL_MAP.get(rainfall_label, 1000)

    # Get area from defaults 
    area_harvested_ha = CROP_AREA_DEFAULTS.get(crop, DEFAULT_AREA)
    cropland_mha      = DEFAULT_CROPLAND

    
    try:
        crop_encoded     = le_crop.transform([crop])[0]
    except ValueError:
        return {"error": f"Unknown crop: '{crop}'. Check spelling."}

    try:
        category_encoded = le_category.transform([crop_category])[0]
    except ValueError:
        return {"error": f"Unknown crop category: '{crop_category}'."}

    rainfall_cat      = get_rainfall_category(rainfall_mm)
    rainfall_encoded  = le_rainfall.transform([rainfall_cat])[0]

    # ── Feature engineering ──
    decade   = (year // 10) * 10
    log_area = np.log1p(area_harvested_ha)

    # ── Build input dataframe ──
    input_df = pd.DataFrame([{
        'crop_encoded'              : crop_encoded,
        'crop_category_encoded'     : category_encoded,
        'year'                      : year,
        'decade'                    : decade,
        'area_harvested_ha'         : area_harvested_ha,
        'log_area'                  : log_area,
        'rainfall_mm'               : rainfall_mm,
        'rainfall_category_encoded' : rainfall_encoded,
        'avg_temp_c'                : avg_temp_c,
        'fertilizer_npk_kg_ha'      : fertilizer_npk_kg_ha,
        'cropland_mha'              : cropland_mha
    }])

    predicted_yield = float(xgb_model.predict(input_df)[0])

    # ── SHAP explanation ──
    exp          = explainer(input_df)
    base_value   = float(exp.base_values[0])
    shap_values  = exp.values[0]

    contributions = pd.DataFrame({
        'feature' : FEATURES,
        'shap'    : shap_values
    }).sort_values('shap', key=abs, ascending=False)

    up       = contributions[contributions['shap'] > 0]
    down     = contributions[contributions['shap'] < 0]

    explanation_parts = []

    if not down.empty:
        top_down = down.iloc[0]
        explanation_parts.append(
            f"'{crop}' belongs to '{crop_category}' which pulled the prediction "
            f"down by {abs(top_down['shap']):,.0f} kg/ha."
        )

    if not up.empty:
        top_up      = up.head(2)
        up_features = ' and '.join([FEATURE_LABELS.get(f, f) for f in top_up['feature'].tolist()])
        up_combined = top_up['shap'].sum()
        explanation_parts.append(
            f"However, {up_features} helped push it up "
            f"by {up_combined:,.0f} kg/ha combined."
        )

    explanation_parts.append(
        f"Final predicted yield is {predicted_yield:,.0f} kg/ha "
        f"vs baseline average of {base_value:,.0f} kg/ha."
    )

    explanation = " ".join(explanation_parts)

    return {
        "crop"            : crop,
        "crop_category"   : crop_category,
        "year"            : year,
        "predicted_yield" : round(predicted_yield, 2),
        "unit"            : "kg/ha",
        "baseline"        : round(base_value, 2),
        "rainfall_category": rainfall_cat,
        "explanation"     : explanation,
        "top_factors"     : [
            {
                "feature" : FEATURE_LABELS.get(row['feature'], row['feature']),
                "impact"    : round(row['shap'], 2),
                "direction" : "up" if row['shap'] > 0 else "down"
            }
            for _, row in contributions.head(5).iterrows()
        ]
    }

if __name__ == "__main__":
    result = predict_yield(
        crop                 = "Wheat",
        crop_category        = "Cereal",
        year                 = 2023,
        rainfall_label       = "Normal Monsoon",
        avg_temp_c           = 25.0,
        fertilizer_npk_kg_ha = 150.0
    )

    print(f"\n🌾 Crop             : {result['crop']} ({result['crop_category']})")
    print(f"📊 Predicted Yield  : {result['predicted_yield']:,} {result['unit']}")
    print(f"📈 Baseline average : {result['baseline']:,} {result['unit']}")
    print(f"🌧  Rainfall        : {result['rainfall_category']}")
    print(f"\n💡 Explanation:")
    print(f"   {result['explanation']}")
    print(f"\n📋 Top Factors:")
    for f in result['top_factors']:
        arrow = "▲" if f['direction'] == 'up' else "▼"
        print(f"   {arrow} {f['feature']:<30} : {f['impact']:>+,.1f} kg/ha")