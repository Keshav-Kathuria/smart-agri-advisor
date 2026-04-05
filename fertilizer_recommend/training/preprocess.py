# Import libraries
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# 1 Load dataset
df = pd.read_csv("fertilizer_dataset_10000_rows.csv")

# 2 Display first rows
print(df.head())

# 3 Dataset information
print(df.info())

# 4 Check missing values
print(df.isnull().sum())

# 5 Encode categorical columns
le_soil = LabelEncoder()
le_crop = LabelEncoder()
le_fertilizer = LabelEncoder()

df["Soil Type"] = le_soil.fit_transform(df["Soil Type"])
df["Crop Type"] = le_crop.fit_transform(df["Crop Type"])
df["Fertilizer Name"] = le_fertilizer.fit_transform(df["Fertilizer Name"])

# 6 Separate features and target
X = df.drop("Fertilizer Name", axis=1)
y = df["Fertilizer Name"]

# 7 Train test split (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# 8 Print dataset shapes
print("Training data:", X_train.shape)
print("Testing data:", X_test.shape)

# 9 Check fertilizer distribution
print(df["Fertilizer Name"].value_counts())
