import os
import json
import uuid
import torch
import torch.nn as nn
import torch.nn.functional as F
import pandas as pd

from torchvision import transforms
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename


# -------------------------------------------------------
# Model Architecture
# -------------------------------------------------------
class ResidualBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()

        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, stride, 1, bias=False)
        self.bn1   = nn.BatchNorm2d(out_channels)

        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, 1, 1, bias=False)
        self.bn2   = nn.BatchNorm2d(out_channels)

        self.skip = nn.Sequential()
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
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(3, 2, 1)
        )

        self.stage1 = nn.Sequential(ResidualBlock(64, 64), ResidualBlock(64, 64))
        self.stage2 = nn.Sequential(ResidualBlock(64, 128, 2), ResidualBlock(128, 128))
        self.stage3 = nn.Sequential(ResidualBlock(128, 256, 2), ResidualBlock(256, 256))
        self.stage4 = nn.Sequential(ResidualBlock(256, 512, 2), ResidualBlock(512, 512))

        self.gap = nn.AdaptiveAvgPool2d((1, 1))

        self.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.initial(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.stage4(x)
        x = self.gap(x)
        x = x.view(x.size(0), -1)
        return self.classifier(x)


# -------------------------------------------------------
# Load Model
# -------------------------------------------------------
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"[INFO] Using device: {device}")

model = CustomCNN(num_classes=38).to(device)

try:
    model.load_state_dict(
        torch.load('models/plant_disease_model_v2.pt', map_location=device),
        strict=False
    )
    model.eval()
    print("[INFO] Model loaded successfully")
except Exception as e:
    print(f"[ERROR] Model loading failed: {e}")


# -------------------------------------------------------
# Load CSVs
# -------------------------------------------------------
def safe_read_csv(path):
    try:
        return pd.read_csv(path, encoding='cp1252')
    except Exception as e:
        print(f"[ERROR] Failed loading {path}: {e}")
        return None


disease_info    = safe_read_csv('data/disease_info.csv')
supplement_info = safe_read_csv('data/supplement_info.csv')

if disease_info is not None:
    print(f"[INFO] disease_info loaded: {len(disease_info)} rows")
if supplement_info is not None:
    print(f"[INFO] supplement_info loaded: {len(supplement_info)} rows")


# -------------------------------------------------------
# Load Class Mapping
# -------------------------------------------------------
try:
    with open('class_mapping.json') as f:
        raw = json.load(f)
        idx_to_class = {int(k): v for k, v in raw.items()}
    print(f"[INFO] class_mapping loaded: {len(idx_to_class)} classes")
except Exception as e:
    idx_to_class = {}
    print(f"[ERROR] class_mapping.json not loaded: {e}")


# -------------------------------------------------------
# Config
# -------------------------------------------------------
# The model is a closed-world classifier — it always picks one of 38 classes.
# Images below this threshold are rejected instead of returning a wrong prediction.
# Tuned against test accuracy of 97%: real leaf images consistently score above
# this, random/non-plant images tend to spread confidence and rarely exceed it.
CONFIDENCE_THRESHOLD = 65.0

transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# -------------------------------------------------------
# Prediction
# -------------------------------------------------------
def predict(image_path, top_k=3):
    image  = Image.open(image_path).convert('RGB')
    tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(tensor)
        probs  = F.softmax(output, dim=1)[0]

    top_probs, top_indices = torch.topk(probs, top_k)

    results = []
    for p, i in zip(top_probs.cpu(), top_indices.cpu()):
        results.append({
            "class_index": int(i),
            "class_name":  idx_to_class.get(int(i), "Unknown").replace("_", " "),
            "confidence":  round(float(p) * 100, 2)
        })

    return results


# -------------------------------------------------------
# Lookup Helpers
# -------------------------------------------------------
def get_disease_info(class_index):
    if disease_info is None:
        return {}
    row = disease_info[disease_info["index"] == class_index]
    if row.empty:
        return {}
    row = row.iloc[0]
    return {
        "disease_name":   str(row.get("disease_name", "")),
        "description":    str(row.get("description", "")),
        "possible_steps": str(row.get("Possible Steps", "")),
        "image_url":      str(row.get("image_url", ""))
    }


def get_supplement_info(class_index):
    if supplement_info is None:
        return {}
    row = supplement_info[supplement_info["index"] == class_index]
    if row.empty:
        return {}
    row = row.iloc[0]
    return {
        "supplement_name":  str(row.get("supplement name", "")),
        "supplement_image": str(row.get("supplement image", "")),
        "buy_link":         str(row.get("buy link", ""))
    }


# -------------------------------------------------------
# Flask App
# -------------------------------------------------------
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


@app.route('/')
def home():
    return jsonify({
        "message": "Plant Disease Detection API",
        "endpoints": {
            "GET  /health":  "Check API + model status",
            "GET  /classes": "List all 38 classes",
            "POST /predict": "Upload a leaf image, get diagnosis"
        }
    })


@app.route('/health')
def health():
    return jsonify({
        "status":                "ok",
        "device":                str(device),
        "model_loaded":          len(idx_to_class) > 0,
        "num_classes":           len(idx_to_class),
        "confidence_threshold":  CONFIDENCE_THRESHOLD
    })


@app.route('/classes')
def classes():
    if disease_info is None:
        return jsonify({"error": "disease_info.csv not loaded"}), 500

    data = []
    for _, row in disease_info.iterrows():
        data.append({
            "index":        int(row["index"]),
            "disease_name": str(row["disease_name"]),
            "class_key":    idx_to_class.get(int(row["index"]), "Unknown")
        })

    return jsonify(data)


@app.route('/predict', methods=['POST'])
def predict_api():

    if 'image' not in request.files:
        return jsonify({"error": "Send file with key 'image'"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: jpg, jpeg, png"}), 400

    filename = str(uuid.uuid4()) + "_" + secure_filename(file.filename)
    path     = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(path)

    try:
        preds = predict(path)
        top   = preds[0]

        # Reject low-confidence predictions.
        # The model cannot output "unknown" — it always picks a class.
        # When confidence is spread thinly (non-plant image), top-1
        # stays low, so we catch it here before returning bad results.
        if top["confidence"] < CONFIDENCE_THRESHOLD:
            return jsonify({
                "status":  "uncertain",
                "message": "Could not confidently identify a plant disease. "
                           "Please upload a clear, well-lit image of a plant leaf.",
                "top3":    preds
            }), 200

        idx = top["class_index"]

        return jsonify({
            "status":       "success",
            "prediction":   top,
            "top3":         preds,
            "disease_info": get_disease_info(idx),
            "supplement":   get_supplement_info(idx)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(path):
            os.remove(path)


# -------------------------------------------------------
# Run
# -------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)