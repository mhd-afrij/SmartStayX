import User from "../models/User.js";

export const protect =async (req,res,next)=>{
    try {
        const {userId} = req.auth;
        if(!userId){
            return res.json({success:false,message:"not authenticated"})
        }
        
        const user=await User.findById(userId);
        
        // If user doesn't exist, return error
        // User should be created via Clerk webhook when they sign up
        if(!user){
            return res.json({
                success:false,
                message:"User profile not found. The user may not have been created in the database yet. Please ensure the Clerk webhook is properly configured."
            })
        }
        
        req.user= user;
        next()
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.json({success:false,message:error.message})
    }
}
