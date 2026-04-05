import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, precision_score, f1_score

# Load dataset
df = pd.read_csv("fertilizer_dataset_10000_rows.csv")

# Encode categorical columns
le_soil = LabelEncoder()
le_crop = LabelEncoder()
le_fert = LabelEncoder()

df["Soil Type"] = le_soil.fit_transform(df["Soil Type"])
df["Crop Type"] = le_crop.fit_transform(df["Crop Type"])
df["Fertilizer Name"] = le_fert.fit_transform(df["Fertilizer Name"])

# Features and target
X = df.drop("Fertilizer Name", axis=1)
y = df["Fertilizer Name"]

# Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y
)

# Define models
models = {

    "Random Forest": RandomForestClassifier(
        n_estimators=60,
        max_depth=5,
        min_samples_split=15,
        min_samples_leaf=8,
        random_state=42
    ),

    "Decision Tree": DecisionTreeClassifier(
        max_depth=4,
        min_samples_split=20,
        min_samples_leaf=10,
        random_state=42
    ),

    "KNN": KNeighborsClassifier(
        n_neighbors=7
    )
}

best_model = None
best_accuracy = 0
best_model_name = ""

# Train and evaluate models
for name, model in models.items():

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\nModel:", name)
    print("Accuracy:", round(accuracy*100,2),"%")
    print("Precision:", round(precision*100,2),"%")
    print("F1 Score:", round(f1*100,2),"%")

    # Track best model
    if accuracy > best_accuracy:
        best_accuracy = accuracy
        best_model = model
        best_model_name = name

# Save best model
joblib.dump(best_model, "fertilizer_model.pkl")

# Save encoders
joblib.dump(le_soil, "soil_encoder.pkl")
joblib.dump(le_crop, "crop_encoder.pkl")
joblib.dump(le_fert, "fertilizer_encoder.pkl")

print("\nBest Model:", best_model_name)
print("Best Accuracy:", round(best_accuracy*100,2),"%")
print("\nBest model and encoders saved successfully!")
