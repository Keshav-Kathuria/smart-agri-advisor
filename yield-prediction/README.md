# 🌾 Yield Prediction Module

Predicts crop yield (kg/ha) for Indian crops using machine learning models 
trained on 63 years of agricultural, climate, and soil data (1961–2024).

---

## 📂 Dataset

**Source:** FAO (Food and Agriculture Organization of the United Nations)  
**Coverage:** India | 1961–2024  
**Size:** 5,084 rows × 10 columns  

### Features
| Feature | Description |
|---|---|
| `crop` | Crop name |
| `crop_category` | Category (Cereals, Fruits, Vegetables etc.) |
| `year` | Year of record |
| `area_harvested_ha` | Area under cultivation (hectares) |
| `production_tonnes` | Total production (excluded — leakage) |
| `rainfall_mm` | Annual rainfall (mm) |
| `avg_temp_c` | Mean annual temperature (°C) |
| `fertilizer_npk_kg_ha` | NPK fertilizer usage (kg/ha) |
| `cropland_mha` | National cropland (million hectares) |

### Engineered Features
| Feature | Description |
|---|---|
| `decade` | Era-level pattern (1960s, 1970s...) |
| `log_area` | Log transform of area (handles skew) |
| `rainfall_category` | Drought / Below Normal / Normal / Above Normal |
| `crop_encoded` | Label encoded crop name |
| `crop_category_encoded` | Label encoded crop category |
| `rainfall_category_encoded` | Label encoded rainfall category |

> ⚠️ `production_tonnes` excluded from all models; it is mathematically 
> derived from yield × area, including it would cause data leakage.

---

## 🔍 Exploratory Data Analysis

Key findings from EDA:
- Yield is **highly right-skewed**: sugar cane and vegetables dominate high yields
- Clear **upward trend** in yield post Green Revolution (1966)
- **Fertilizer usage** has grown consistently since 1960s, strongly correlated with yield
- **Rainfall** shows weak direct correlation: crop type matters more
- High variance across crop categories: vegetables yield far more than pulses

---

## ⚙️ Preprocessing

- No missing values in dataset
- No duplicate rows
- Outliers **kept intentionally** : high yield crops (sugar cane etc.) are valid data points, tree-based models handle them naturally
- Time-based train/test split to prevent data leakage:
  - **Train:** 1961–2015 (4,336 rows)
  - **Test:** 2016–2024 (748 rows)
- StandardScaler applied for Linear Regression only

---

## 🤖 Models

Four models trained and evaluated:

| Model | R² | MAE (kg/ha) | RMSE (kg/ha) | CV R² |
|---|---|---|---|---|
| **XGBoost** | **0.9032** | **1,859** | **3,687** | 0.2983 |
| Random Forest | 0.8653 | 1,793 | 4,350 | 0.0593 |
| Decision Tree | 0.5740 | 3,629 | 7,735 | -0.3004 |
| Linear Regression | 0.0101 | 8,139 | 11,791 | -0.1335 |

### Why XGBoost?
- Highest R² (0.9032); explains 90% of yield variance
- Lowest RMSE (3,687 kg/ha)
- Best cross-validation score (0.2983)
- Handles non-linear relationships and outliers naturally
- Fast inference: suitable for API deployment

### Hyperparameters
```python
XGBRegressor(
    n_estimators   = 300,
    learning_rate  = 0.05,
    max_depth      = 6,
    subsample      = 0.8,
    colsample_bytree = 0.8,
    random_state   = 42
)
```

---

## 💡 Explainability — SHAP

SHAP (SHapley Additive exPlanations) used to explain individual predictions.

**Key findings:**
- `crop_category` and `crop_encoded` are the most dominant features
- `area_harvested_ha` and `log_area` are the strongest continuous predictors
- `year` captures the technology/modernization trend over time
- `fertilizer_npk_kg_ha` has consistent positive impact on yield

SHAP will also be integrated into the API to return human-readable 
explanations alongside each prediction.

---

## 📁 Files
```
yield-prediction/
├── data/
│   └── india_yield_final_dataset.csv
├── models/
│   ├── xgboost_model.pkl
│   ├── le_crop.pkl
│   ├── le_category.pkl
│   └── le_rainfall_category.pkl
├── plots/
│   └── *.png
└── crop_yield_model.ipynb
```

---

## 🔮 Next Steps
- Integrate with backend API (`predict.py` + `app.py`)
- Return SHAP explanation alongside prediction in API response
- Connect to frontend for farmer-facing interface