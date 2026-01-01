import User from "../models/User.js";

export const protect =async (req,res,next)=>{
    try {
        const auth = await req.auth();
        const {userId} = auth;
        if(!userId){
            return res.json({success:false,message:"not authenticated"})
        }
        
        let user=await User.findById(userId);
        
        // If user doesn't exist, automatically create a basic user record
        // This handles cases where webhook didn't fire or user was created before webhook setup
        if(!user){
            try {
                // Fetch user data from Clerk API if CLERK_SECRET_KEY is available
                let clerkUserData = null;
                if (process.env.CLERK_SECRET_KEY) {
                    try {
                        const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
                            headers: {
                                'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (response.ok) {
                            clerkUserData = await response.json();
                        }
                    } catch (fetchError) {
                        console.log("Could not fetch user from Clerk API, creating with minimal data");
                    }
                }
                
                // Create user with available data
                const email = clerkUserData?.email_addresses?.[0]?.email_address || 
                             clerkUserData?.primary_email_address_id || 
                             `${userId}@temp.clerk`;
                const firstName = clerkUserData?.first_name || '';
                const lastName = clerkUserData?.last_name || '';
                const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || 'User';
                
                const userData = {
                    _id: userId,
                    email: email,
                    username: clerkUserData?.username || fullName,
                    name: fullName,
                    image: clerkUserData?.image_url || clerkUserData?.profile_image_url || '',
                    role: 'user',
                    recentSearchedCities: []
                };
                
                user = await User.create(userData);
                console.log(`✅ Auto-created user in database: ${userId} (${email})`);
            } catch (createError) {
                console.error("❌ Error auto-creating user:", createError.message);
                // If creation fails, return helpful error
                return res.json({
                    success:false,
                    message:"User profile not found and could not be created automatically. Please sign out and sign in again, or ensure the Clerk webhook is properly configured."
                })
            }
        }
        
        req.user= user;
        next()
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.json({success:false,message:error.message})
    }
}
