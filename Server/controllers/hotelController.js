import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

export const registerHotel= async (req,res)=>{
    try{
        const {name,address,contact,city} =req.body;
        const owner=req.user._id

        // Check if User Already Registered
        const hotel= await Hotel.findOne({owner})
        if(hotel){
            return res.json({ success: false, message: "Hotel Already Registered"})
        }


        await Hotel.create({name,address,contact,city,owner});

        await User.findByIdAndUpdate(owner,{role:"hotelOwner"});

        res.json({success: true, message:"Hotel Registered Successfully"})

    }catch(error){
        res.json({success: false, message:error.message})

    }
}

// Get hotel data for owner
export const getOwnerHotel = async (req, res) => {
    try {
        const auth = typeof req.auth === "function" ? req.auth() : req.auth;
        const userId = auth?.userId;
        const hotel = await Hotel.findOne({ owner: userId });
        if (!hotel) {
            return res.json({ success: false, message: "No hotel found" });
        }
        res.json({ success: true, hotel });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get all hotels (for admin or listing purposes)
export const getAllHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find({});
        res.json({ success: true, hotels });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}