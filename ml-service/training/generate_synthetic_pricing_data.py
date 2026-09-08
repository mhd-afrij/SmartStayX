import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import DATASETS_DIR  # noqa: E402

np.random.seed(42)
n = 2000

data = {
    "basePrice": np.random.uniform(3000, 50000, n),
    "occupancy": np.random.uniform(0.1, 1.0, n),
    "leadTimeDays": np.random.exponential(30, n).clip(0, 365),
    "season_encoded": np.random.choice([0, 1, 2, 3], n),
    "isWeekend": np.random.choice([0, 1], n),
    "amenitiesCount": np.random.randint(1, 20, n),
    "roomType_encoded": np.random.choice([0, 1, 2, 3, 4, 5, 6], n),
    "isReturningGuest": np.random.choice([0, 1], n, p=[0.7, 0.3]),
}

df = pd.DataFrame(data)

base = df["basePrice"]
occ = df["occupancy"]
lead = df["leadTimeDays"]
season = df["season_encoded"]
weekend = df["isWeekend"]
amenities = df["amenitiesCount"]
room_type = df["roomType_encoded"]
returning = df["isReturningGuest"]

price = (
    base
    * (1 + 0.35 * season / 3)
    * (1 + 0.18 * weekend)
    * (1 + 0.25 * occ)
    * (1 - 0.12 * np.clip(lead / 90, 0, 1))
    * (1 + 0.025 * amenities)
    * (1 + 0.06 * room_type / 6)
    * (1 - 0.05 * returning)
    * np.random.uniform(0.85, 1.18, n)
)

noise = np.random.normal(0, price.std() * 0.06, n)
df["finalPrice"] = (price + noise).clip(lower=base * 0.4, upper=base * 2.2)

os.makedirs(DATASETS_DIR, exist_ok=True)
out_path = os.path.join(DATASETS_DIR, "synthetic_pricing_training.csv")
df.to_csv(out_path, index=False)

print(f"SYNTHETIC dataset — formula-generated, does NOT represent real hotel behaviour")
print(f"Generated {n} rows -> {out_path}")
print(f"Columns: {list(df.columns)}")
print(f"Range: {df['finalPrice'].min():.0f} - {df['finalPrice'].max():.0f}")
print(f"Mean:  {df['finalPrice'].mean():.0f}")
