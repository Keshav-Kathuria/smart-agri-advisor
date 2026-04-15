# 🌾 Smart Agriculture Advisory Platform

> An AI-driven platform providing real-time, personalized guidance to farmers enabling predictive crop management, disease detection, and resource optimization.

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?logo=pytorch)](https://pytorch.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-FF6F00?logo=tensorflow)](https://tensorflow.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-Latest-189AB4)](https://xgboost.readthedocs.io)

---

## 📌 Overview

Farmers face significant challenges in modern agriculture — crop diseases, unpredictable weather, inefficient fertilizer usage, and uncertain yield forecasts. Traditional advisory methods are often manual, delayed, or generic, limiting the ability to make timely, data-driven decisions.

The **Smart Agriculture Advisory Platform** integrates four AI-powered modules into a unified system to bridge this gap:

| Module | Description | Status |
|--------|-------------|--------|
|  **Crop Disease Detection** | CNN-based image analysis for early disease identification | ✅ Deployed |
|  **Weather-Based Advisory** | Real-time meteorological guidance for crop planning | ✅ Deployed |
|  **Fertilizer Recommendation** | Optimized fertilizer suggestions with integrated soil type detection | ✅ Deployed |
|  **Yield Prediction** | XGBoost + SHAP-based crop output forecasting | ✅ Deployed |

---

## 🏗️ Architecture

```
smart-agriculture-platform/
├── yield-prediction/          # Yield forecasting — XGBoost + SHAP explainability
│   ├── model/
│   ├── train.py
│   └── predict.py
│
├── disease-detection/         # CNN crop disease classifier (PyTorch)
│   ├── model/
│   ├── train.py
│   └── inference.py
│
├── fertilizer-recommend/      # Fertilizer recommendation + Soil Type Detection
│   ├── model/
│   ├── soil_type_detector/    # Added module: classifies soil type from input
│   ├── train.py
│   └── recommend.py
│
├── weather-advisory/          # Weather-based advisory engine
│   ├── engine.py
│   └── advisory_rules.py
│
├── api/                       # Backend API (FastAPI)
│   ├── service-tf/            # TensorFlow-based inference service
│   │   └── main.py
│   └── service-torch/         # PyTorch-based inference service
│       └── main.py
│
└── frontend/                  # Web Interface
    └── ...
```

---

## 🧠 Modules

###  1. Crop Disease Detection

Identifies crop diseases from leaf images using a **Convolutional Neural Network (CNN)** trained on plant disease datasets.

- **Framework:** PyTorch
- **Input:** Leaf image (JPG/PNG)
- **Output:** Disease name + confidence score + treatment suggestion
- **Served via:** `service-torch`

---

###  2. Weather-Based Advisory

Provides actionable, real-time farming recommendations based on current and forecasted meteorological data.

- **Input:** Location / weather parameters (temperature, humidity, rainfall, wind)
- **Output:** Contextual advice (e.g., irrigation scheduling, frost warnings, pesticide timing)
- **Served via:** `service-tf`

---

###  3. Fertilizer Recommendation

Recommends optimal fertilizer type and quantity based on crop type, soil nutrients (N, P, K), and environmental conditions.

#### Soil Type Detection (Added Module)

A dedicated sub-module within Fertilizer Recommendation that **automatically identifies soil type** from input parameters — so farmers who don't know their soil type can still get accurate recommendations.

- **Input:** Crop type, soil nutrient levels (N, P, K), temperature, humidity, pH, rainfall
- **Soil Type Detection:** Classifies soil (Sandy, Loamy, Clay, Black, Red, etc.) from measurable properties
- **Output:** Recommended fertilizer + NPK ratio + application guidance
- **Served via:** `service-tf`

---

### 📈 4. Yield Prediction

Forecasts crop yield using an **XGBoost regression model** with **SHAP-based explainability** to surface the most influential features.

- **Framework:** XGBoost + Scikit-learn + SHAP
- **Input:** Crop type, soil properties, rainfall, temperature, fertilizer usage, area
- **Output:** Predicted yield (kg/hectare) + SHAP feature importance chart
- **Served via:** `service-tf`

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|------------|
| **ML / DL** | XGBoost, CNN (PyTorch), Scikit-learn, SHAP, TensorFlow |
| **Backend** | FastAPI |
| **Deployment** | Two services — `service-tf` (TensorFlow) and `service-torch` (PyTorch) |
| **Frontend** | React / (your frontend stack) |
| **Data** | Pandas, NumPy |
| **Visualization** | SHAP, Matplotlib |

---

## 🚀 Deployment

The backend is deployed as **two independent FastAPI services**, split by ML framework:

### `service-tf` — TensorFlow Service
Handles: Weather Advisory, Fertilizer Recommendation (+ Soil Detection), Yield Prediction

```bash
cd api/service-tf
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### `service-torch` — PyTorch Service
Handles: Crop Disease Detection

```bash
cd api/service-torch
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

---

## 📡 API Endpoints

### `service-tf` (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict/yield` | Predict crop yield |
| `POST` | `/recommend/fertilizer` | Get fertilizer recommendation |
| `POST` | `/detect/soil` | Detect soil type |
| `GET` | `/advisory/weather` | Get weather-based advice |

### `service-torch` (Port 8001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/detect/disease` | Detect crop disease from image |

---

## 🔬 Key Design Decisions

- **Split backend services** — TF and Torch models have conflicting CUDA dependencies; separating them avoids version conflicts and allows independent scaling.
- **Soil Type Detection embedded in Fertilizer module** — reduces friction for farmers who may not know their soil type, making the recommendation pipeline self-contained.
- **SHAP explainability on Yield Prediction** — makes ML outputs interpretable and trustworthy for farmers and agronomists.
- **FastAPI** — chosen for async support, auto-generated OpenAPI docs, and easy model serving.

---

## 🛠️ Local Setup

### Prerequisites

- Python 3.10+
- pip / conda
- Node.js (for frontend)

### Clone & Install

```bash
git clone https://github.com/your-username/smart-agriculture-platform.git
cd smart-agriculture-platform
```

```bash
# Install TF service dependencies
cd api/service-tf && pip install -r requirements.txt

# Install Torch service dependencies
cd ../service-torch && pip install -r requirements.txt
```

### Run Both Services

```bash
# Terminal 1
cd api/service-tf && uvicorn main:app --reload --port 8000

# Terminal 2
cd api/service-torch && uvicorn main:app --reload --port 8001
```

Visit `http://localhost:8000/docs` and `http://localhost:8001/docs` for interactive API documentation.

---

## 📁 Dataset References

- [PlantVillage Dataset](https://www.kaggle.com/datasets/emmarex/plantdisease) — Disease Detection
- [Crop Recommendation Dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset) — Fertilizer & Yield
- Weather data via OpenWeatherMap API / local meteorological sources

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/new-module`)
3. Commit your changes (`git commit -m 'Add new module'`)
4. Push to the branch (`git push origin feature/new-module`)
5. Open a Pull Request

---

## 👨‍💻 Author

Built as part of an AI-driven Smart Agriculture initiative.  
Feel free to reach out for collaborations or queries.

---

> 🌱 *"Empowering farmers with the intelligence of data."*