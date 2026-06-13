// userController.js — User profile, search history, and preferences
// Guest profile retrieval, recent-search storage, and preference management.
export const getUserData = async (req, res) => {
  try {
    const role = req.user.role;
    const recentSearchedCities = req.user.recentSearchedCities;
    const profile = req.user.profile || {
      phone: "",
      dateOfBirth: "",
      country: "",
      preferredLanguage: "en",
      preferredCurrency: "USD",
      preferences: {
        roomType: "",
        amenities: [],
        destinations: [],
        travelPurpose: "",
        specialRequests: "",
      },
    };

    res.json({
      success: true,
      role,
      recentSearchedCities,
      profile,
      user: {
        id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        image: req.user.image,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Store a small recent-search history for the user.
export const storeRecentSearchedCities = async (req, res) => {
  try {
    const { recentSearchedCity } = req.body;
    const user = req.user;

    if (user.recentSearchedCities.length < 3) {
      user.recentSearchedCities.push(recentSearchedCity);
    } else {
      user.recentSearchedCities.shift();
      user.recentSearchedCities.push(recentSearchedCity);
    }

    await user.save();
    res.json({ success: true, message: "City added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update the guest profile with typed preferences.
export const upsertGuestProfile = async (req, res) => {
  try {
    const user = req.user;
    const {
      phone,
      dateOfBirth,
      country,
      preferredLanguage,
      preferredCurrency,
      preferences = {},
    } = req.body || {};

    const safeList = (value) => {
      if (!Array.isArray(value)) return [];
      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 12);
    };

    user.profile = {
      phone: String(phone || "").trim(),
      dateOfBirth: String(dateOfBirth || "").trim(),
      country: String(country || "").trim(),
      preferredLanguage: String(preferredLanguage || "en").trim() || "en",
      preferredCurrency: String(preferredCurrency || "USD").trim() || "USD",
      preferences: {
        roomType: String(preferences.roomType || "").trim(),
        amenities: safeList(preferences.amenities),
        destinations: safeList(preferences.destinations),
        travelPurpose: String(preferences.travelPurpose || "").trim(),
        specialRequests: String(preferences.specialRequests || "").trim().slice(0, 500),
      },
    };

    await user.save();

    return res.json({
      success: true,
      message: "Guest profile updated",
      profile: user.profile,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
