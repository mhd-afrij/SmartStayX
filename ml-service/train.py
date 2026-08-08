import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
from preprocess import generate_sample_training_data, FEATURE_NAMES

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "historical_bookings.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")


def load_data():
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        required = set(FEATURE_NAMES + ["finalPrice"])
        if required.issubset(df.columns):
            return df
    print("No training data found. Generating sample data...")
    df = generate_sample_training_data(1000)
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    df.to_csv(DATA_PATH, index=False)
    return df


def train():
    df = load_data()

    X = df[FEATURE_NAMES].values
    y = df["finalPrice"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=20,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print(f"Model trained successfully.")
    print(f"Test MAE:  {mae:.2f}")
    print(f"Test RMSE: {rmse:.2f}")
    print(f"R² Score:  {model.score(X_test, y_test):.4f}")

    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return model


if __name__ == "__main__":
    train()
