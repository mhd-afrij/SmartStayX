import numpy as np
import pandas as pd

SEASON_MAP = {"off-peak": 0, "shoulder": 1, "peak": 2, "holiday": 3}
ROOM_TYPE_MAP = {"single": 0, "double": 1, "luxury": 2, "suite": 3, "deluxe": 4, "family": 5, "penthouse": 6}

def encode_season(season_str):
    return SEASON_MAP.get(str(season_str).lower().strip(), 0)

def encode_room_type(room_type_str):
    return ROOM_TYPE_MAP.get(str(room_type_str).lower().strip(), 0)

def preprocess_features(raw):
    features = {
        "basePrice": float(raw.get("basePrice", 0)),
        "occupancy": float(raw.get("occupancy", 0)),
        "leadTimeDays": float(raw.get("leadTimeDays", 0)),
        "season_encoded": encode_season(raw.get("season", "off-peak")),
        "isWeekend": int(bool(raw.get("isWeekend", False))),
        "competitorPrice": float(raw.get("competitorPrice", 0)),
        "amenitiesCount": int(raw.get("amenitiesCount", 0)),
        "roomType_encoded": encode_room_type(raw.get("roomType", "standard")),
        "isReturningGuest": int(bool(raw.get("isReturningGuest", False))),
    }
    return features

def build_feature_vector(raw):
    pf = preprocess_features(raw)
    return np.array([[
        pf["basePrice"],
        pf["occupancy"],
        pf["leadTimeDays"],
        pf["season_encoded"],
        pf["isWeekend"],
        pf["competitorPrice"],
        pf["amenitiesCount"],
        pf["roomType_encoded"],
        pf["isReturningGuest"],
    ]])

FEATURE_NAMES = [
    "basePrice", "occupancy", "leadTimeDays", "season_encoded",
    "isWeekend", "competitorPrice", "amenitiesCount",
    "roomType_encoded", "isReturningGuest",
]

def generate_sample_training_data(n_samples=500):
    np.random.seed(42)
    data = {
        "basePrice": np.random.uniform(3000, 50000, n_samples),
        "occupancy": np.random.uniform(0.1, 1.0, n_samples),
        "leadTimeDays": np.random.exponential(30, n_samples).clip(0, 365),
        "season_encoded": np.random.choice([0, 1, 2, 3], n_samples),
        "isWeekend": np.random.choice([0, 1], n_samples),
        "competitorPrice": np.random.uniform(3000, 50000, n_samples),
        "amenitiesCount": np.random.randint(1, 20, n_samples),
        "roomType_encoded": np.random.choice([0, 1, 2, 3, 4, 5, 6], n_samples),
        "isReturningGuest": np.random.choice([0, 1], n_samples),
    }
    df = pd.DataFrame(data)

    base = df["basePrice"]
    occ = df["occupancy"]
    lead = df["leadTimeDays"]
    season = df["season_encoded"]
    weekend = df["isWeekend"]
    comp = df["competitorPrice"]
    amenities = df["amenitiesCount"]
    room_type = df["roomType_encoded"]
    returning = df["isReturningGuest"]

    price = (
        base
        * (1 + 0.3 * season / 3)
        * (1 + 0.15 * weekend)
        * (1 + 0.2 * occ)
        * (1 - 0.1 * np.clip(lead / 90, 0, 1))
        * (1 + 0.02 * amenities)
        * (1 + 0.05 * room_type / 6)
        * (1 - 0.05 * returning)
        * np.random.uniform(0.85, 1.15, n_samples)
    )

    noise = np.random.normal(0, price.std() * 0.08, n_samples)
    df["finalPrice"] = (price + noise).clip(lower=base * 0.5, upper=base * 2.0)

    return df
