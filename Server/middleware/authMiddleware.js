import User from "../models/User.js";

export const protect = async (req, res, next) => {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const userId = auth?.userId;

    if (!userId) {
        return res.json({ success: false, message: "not authenticated" });
    }

    const user = await User.findById(userId);
    req.user = user;
    next();
};
