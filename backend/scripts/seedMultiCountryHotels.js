// seedMultiCountryHotels.js — Idempotently backfills the demo hotel portfolio
// with real, database-anchored geographic data across the Trip Planner's
// supported countries. Run: npm run seed:hotels
//
// The coordinates below are stored in GeoJSON order [lng, lat] (schema default)
// and are the single source of truth for the Trip Planner origin — the
// frontend never supplies origin coordinates.
import mongoose from "mongoose";
import dotenv from "dotenv";
import Hotel from "../models/Hotel.js";

dotenv.config();

const DEMO_OWNER_ID = "demo-owner-id";

const MULTI_COUNTRY_HOTELS = [
  {
    name: "Grand Ocean Resort Colombo",
    address: "1 Galle Face Terrace",
    city: "Colombo",
    country: "Sri Lanka",
    currency: "LKR",
    timezone: "Asia/Colombo",
    coordinates: [79.8431, 6.9271],
  },
  {
    name: "Mountain View Lodge Kandy",
    address: "35 Peradeniya Road",
    city: "Kandy",
    country: "Sri Lanka",
    currency: "LKR",
    timezone: "Asia/Colombo",
    coordinates: [80.6337, 7.2906],
  },
  {
    name: "Heritage City Hotel Galle",
    address: "46 Lighthouse Street",
    city: "Galle",
    country: "Sri Lanka",
    currency: "LKR",
    timezone: "Asia/Colombo",
    coordinates: [80.2177, 6.0269],
  },
  {
    name: "Maldives Ocean Retreat",
    address: "Boduthakurufaanu Magu",
    city: "Malé",
    country: "Maldives",
    currency: "MVR",
    timezone: "Indian/Maldives",
    coordinates: [73.5093, 4.1755],
  },
  {
    name: "Burj Views Hotel Dubai",
    address: "1 Sheikh Mohammed bin Rashid Boulevard",
    city: "Dubai",
    country: "United Arab Emirates",
    currency: "AED",
    timezone: "Asia/Dubai",
    coordinates: [55.2744, 25.2048],
  },
  {
    name: "Bali Ubud Boutique Hotel",
    address: "Jalan Raya Ubud",
    city: "Ubud, Bali",
    country: "Indonesia",
    currency: "IDR",
    timezone: "Asia/Makassar",
    coordinates: [115.2625, -8.5069],
  },
  {
    name: "Tokyo Skyline Hotel",
    address: "1-1-1 Marunouchi, Chiyoda",
    city: "Tokyo",
    country: "Japan",
    currency: "JPY",
    timezone: "Asia/Tokyo",
    coordinates: [139.7671, 35.6812],
  },
  {
    name: "Matterhorn View Hotel",
    address: "Bahnhofstrasse 21",
    city: "Zermatt",
    country: "Switzerland",
    currency: "CHF",
    timezone: "Europe/Zurich",
    coordinates: [7.7487, 46.0207],
  },
  {
    name: "Manhattan Central Hotel",
    address: "700 7th Avenue",
    city: "New York",
    country: "United States",
    currency: "USD",
    timezone: "America/New_York",
    coordinates: [-73.984, 40.7614],
  },
  {
    name: "Marina Bay Hotel Singapore",
    address: "10 Bayfront Avenue",
    city: "Singapore",
    country: "Singapore",
    currency: "SGD",
    timezone: "Asia/Singapore",
    coordinates: [103.853, 1.2832],
  },
  {
    name: "Eiffel View Hotel Paris",
    address: "15 Avenue de Suffren",
    city: "Paris",
    country: "France",
    currency: "EUR",
    timezone: "Europe/Paris",
    coordinates: [2.295, 48.8552],
  },
];

const run = async () => {
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) throw new Error("MONGODB_URI is not set in .env");
  await mongoose.connect(baseUri, { dbName: "SmartStayX" });

  let upserted = 0;
  for (const h of MULTI_COUNTRY_HOTELS) {
    const key = { name: h.name };
    const update = {
      $set: {
        owner: DEMO_OWNER_ID,
        address: h.address,
        city: h.city,
        country: h.country,
        currency: h.currency,
        timezone: h.timezone,
        description: `Trip Planner location seed for ${h.city}, ${h.country}.`,
        approvalStatus: "approved",
        location: { type: "Point", coordinates: h.coordinates },
      },
    };
    const doc = await Hotel.findOneAndUpdate(key, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`${doc.name} → ${doc.location.coordinates[1]}, ${doc.location.coordinates[0]} (${doc.country})`);
    upserted += 1;
  }

  await mongoose.connection.close();
  console.log(`\nSeeded/verified ${upserted} multi-country hotels.`);
};

run().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});