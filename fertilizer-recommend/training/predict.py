import pandas as pd
import joblib

# Load saved model
model = joblib.load("fertilizer_model.pkl")

# Load encoders
le_soil = joblib.load("soil_encoder.pkl")
le_crop = joblib.load("crop_encoder.pkl")
le_fert = joblib.load("fertilizer_encoder.pkl")

print("\nFERTILIZER RECOMMENDATION SYSTEM\n")

# User input
temperature = float(input("Enter Temperature: "))
humidity = float(input("Enter Humidity: "))
moisture = float(input("Enter Moisture: "))
soil = input("Enter Soil Type: ")
crop = input("Enter Crop Type: ")
nitrogen = float(input("Enter Nitrogen value: "))
phosphorus = float(input("Enter Phosphorus value: "))
potassium = float(input("Enter Potassium value: "))

# Encode categorical values
soil_encoded = le_soil.transform([soil])[0]
crop_encoded = le_crop.transform([crop])[0]

# Create dataframe with EXACT dataset column names
input_data = pd.DataFrame(
    [[temperature, humidity, moisture, soil_encoded, crop_encoded, nitrogen, potassium, phosphorus]],
    columns=[
        "Temparature",
        "Humidity",
        "Moisture",
        "Soil Type",
        "Crop Type",
        "Nitrogen",
        "Potassium",
        "Phosphorous"
    ]
)

# Predict fertilizer
prediction = model.predict(input_data)

# Decode fertilizer name
fertilizer = le_fert.inverse_transform(prediction)

print("\n--------------------------------")
print("Recommended Fertilizer:", fertilizer[0])
print("--------------------------------")
