import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        const auth = typeof req.auth === "function" ? req.auth() : req.auth;
        const userId = auth?.userId;

        if (!userId) {
            return res.json({ success: false, message: "not authenticated" });
        }

        let user = await User.findById(userId);

        // Auto-provision missing users so protected flows (hotel registration, bookings)
        // keep working even if webhook delivery is delayed.
        if (!user) {
            const claims = auth?.sessionClaims || {};
            const emailClaim =
                claims?.email ||
                claims?.email_address ||
                (Array.isArray(claims?.email_addresses) && claims.email_addresses[0]?.email_address);

            const email = emailClaim || `${userId}@placeholder.local`;

            const fullName =
                claims?.fullName ||
                [claims?.firstName, claims?.lastName].filter(Boolean).join(" ") ||
                claims?.username ||
                "Guest";

            user = await User.create({
                _id: userId,
                name: fullName,
                username: claims?.username || fullName,
                email,
                image: claims?.imageUrl || claims?.picture || "https://via.placeholder.com/150",
                recentSearchedCities: [],
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error.message);
        return res.status(500).json({ success: false, message: "Authentication setup failed" });
    }
};
