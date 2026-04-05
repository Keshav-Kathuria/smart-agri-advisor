import os, io, json
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.dirname(BASE_DIR)
DISEASE_DIR = os.path.join(ROOT_DIR, "disease_detection")

class ResidualBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, stride, 1, bias=False)
        self.bn1   = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, 1, 1, bias=False)
        self.bn2   = nn.BatchNorm2d(out_channels)
        self.skip  = nn.Sequential()
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
            nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(3, 2, 1)
        )
        self.stage1 = nn.Sequential(ResidualBlock(64, 64), ResidualBlock(64, 64))
        self.stage2 = nn.Sequential(ResidualBlock(64, 128, 2), ResidualBlock(128, 128))
        self.stage3 = nn.Sequential(ResidualBlock(128, 256, 2), ResidualBlock(256, 256))
        self.stage4 = nn.Sequential(ResidualBlock(256, 512, 2), ResidualBlock(512, 512))
        self.gap     = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier = nn.Sequential(
            nn.Dropout(0.4), nn.Linear(512, 256), nn.ReLU(),
            nn.Dropout(0.3), nn.Linear(256, num_classes)
        )
    def forward(self, x):
        x = self.initial(x)
        x = self.stage1(x); x = self.stage2(x)
        x = self.stage3(x); x = self.stage4(x)
        x = self.gap(x)
        x = x.view(x.size(0), -1)
        return self.classifier(x)

device        = torch.device("cuda" if torch.cuda.is_available() else "cpu")
disease_model = CustomCNN(num_classes=38).to(device)
disease_model.load_state_dict(
    torch.load(os.path.join(DISEASE_DIR, "models", "plant_disease_model_v2.pt"), map_location=device),
    strict=False
)
disease_model.eval()

import pandas as pd
def _safe_csv(path):
    try: return pd.read_csv(path, encoding="cp1252")
    except: return None

disease_info    = _safe_csv(os.path.join(DISEASE_DIR, "data", "disease_info.csv"))
supplement_info = _safe_csv(os.path.join(DISEASE_DIR, "data", "supplement_info.csv"))

with open(os.path.join(DISEASE_DIR, "class_mapping.json")) as f:
    idx_to_class = {int(k): v for k, v in json.load(f).items()}

CONFIDENCE_THRESHOLD = 65.0
disease_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

app = FastAPI(title="Disease Detection Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root(): return {"service": "disease-detection", "status": "ok"}

@app.get("/disease/health")
def health(): return {"status": "ok", "classes": len(idx_to_class)}

@app.get("/disease/classes")
def classes():
    if disease_info is None: raise HTTPException(500, "CSV not loaded")
    return [{"index": int(r["index"]), "disease_name": str(r["disease_name"])} for _, r in disease_info.iterrows()]

@app.post("/disease/predict")
async def predict(image: UploadFile = File(...)):
    if image.content_type not in {"image/jpeg","image/png","image/jpg"}:
        raise HTTPException(400, "Only JPEG or PNG supported")
    img_bytes = await image.read()
    img    = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    tensor = disease_transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        probs = F.softmax(disease_model(tensor), dim=1)[0]
    top_probs, top_idx = torch.topk(probs, 3)
    preds = [{"class_index": int(i), "class_name": idx_to_class.get(int(i),"Unknown").replace("_"," "), "confidence": round(float(p)*100,2)} for p,i in zip(top_probs.cpu(), top_idx.cpu())]
    top = preds[0]
    if top["confidence"] < CONFIDENCE_THRESHOLD:
        return {"status": "uncertain", "message": "Could not confidently identify disease.", "top3": preds}
    idx = top["class_index"]
    drow = disease_info[disease_info["index"]==idx].iloc[0] if disease_info is not None else None
    srow = supplement_info[supplement_info["index"]==idx].iloc[0] if supplement_info is not None else None
    return {
        "status": "success", "prediction": top, "top3": preds,
        "disease_info": {"disease_name": str(drow["disease_name"]), "description": str(drow["description"]), "possible_steps": str(drow["Possible Steps"])} if drow is not None else {},
        "supplement": {"supplement_name": str(srow["supplement name"]), "buy_link": str(srow["buy link"])} if srow is not None else {}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)