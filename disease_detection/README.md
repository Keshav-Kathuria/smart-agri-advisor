# Disease Detection

Crop disease detection module for the Smart Agriculture Platform. Accepts a leaf image and returns a disease diagnosis, treatment steps, and supplement recommendation.

Built with a custom CNN (ResNet-inspired architecture) trained on the PlantVillage dataset.

---

## Model

- **Architecture:** Custom CNN with residual (skip) connections
- **Dataset:** PlantVillage — 38 disease classes across 14 crops
- **Input:** 224 × 224 RGB leaf image
- **Accuracy:** 97.09% on test set

The model file (`plant_disease_model_v2.pt`) is not tracked in git due to size. Download it separately and place it in the `models/` folder.

---

## Folder Structure

```
disease-detection/
├── data/
│   ├── disease_info.csv        # disease descriptions and treatment steps
│   └── supplement_info.csv     # supplement recommendations and buy links
├── models/
│   └── plant_disease_model_v2.pt   # trained model weights (not in git)
├── plots/
│   ├── confusion_matrix.png
│   └── training_curves.png
├── app.py                      # Flask API
├── class_mapping.json          # index → class name mapping
├── crop_disease_model.ipynb    # training notebook
└── requirements.txt
```

---

## Setup

```bash
pip install -r requirements.txt
python app.py
```

Server runs at `http://localhost:5000`.

---

## API

### `POST /predict`

Upload a leaf image and get a disease prediction.

**Request**
```
Content-Type: multipart/form-data
Key: image
Value: <image file — jpg or png>
```

**Response — success**
```json
{
  "status": "success",
  "prediction": {
    "class_index": 1,
    "class_name": "Apple Black rot",
    "confidence": 99.02
  },
  "top3": [...],
  "disease_info": {
    "disease_name": "Apple : Black Rot",
    "description": "...",
    "possible_steps": "...",
    "image_url": "..."
  },
  "supplement": {
    "supplement_name": "Magic FungiX For Fungal disease",
    "supplement_image": "...",
    "buy_link": "..."
  }
}
```

**Response — uncertain** (non-plant image or unclear photo)
```json
{
  "status": "uncertain",
  "message": "Could not confidently identify a plant disease. Please upload a clear, well-lit image of a plant leaf.",
  "top3": [...]
}
```

Predictions below 65% confidence are rejected and return `"status": "uncertain"`. This prevents the model from returning results on non-plant images.

---

### `GET /health`

Check if the API and model are loaded correctly.

```json
{
  "status": "ok",
  "device": "cpu",
  "model_loaded": true,
  "num_classes": 38,
  "confidence_threshold": 65.0
}
```

### `GET /classes`

List all 38 supported disease classes.

---

## Supported Crops

Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato

