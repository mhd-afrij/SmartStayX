import { response } from "express";
import Hotel from "../models/Hotel.js";
import {v2 as cloudinary} from "cloudinary"
import Room from "../models/Room.js";

const getAuthUserId = (req) => {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    return auth?.userId;
};

const isRoomOwnedByUser = async (room, userId) => {
    const ownerHotels = await Hotel.find({ owner: userId });
    const ownerHotelIds = ownerHotels.map((h) => h._id.toString());
    return ownerHotelIds.includes(room.hotel._id.toString());
};


//Api To create a new room for a hotel
export const createRoom = async (req,res)=>{
    try{
        const{roomType,pricePerNight,amenities,hotelId}=req.body;
        const auth = typeof req.auth === "function" ? req.auth() : req.auth;
        const userId = auth?.userId;

        if(!hotelId){
            return res.json({success:false,message:"Please select a hotel"});
        }

        const hotel = await Hotel.findById(hotelId);
        if(!hotel) return res.json({success:false,message:"No Hotel Found"});
        if(hotel.owner !== userId){
            return res.json({success:false,message:"Not authorized to add room to this hotel"});
        }

        //upload images to cloudinary
        const uploadImages= req.files.map(async (file)=>{
            const response = await cloudinary.uploader.upload(file.path);
            return response.secure_url;
        })

        const images=await Promise.all(uploadImages)

        await Room.create({
            hotel: hotel._id,
            roomType,
            pricePerNight: +pricePerNight,
            amenities: JSON.parse(amenities),
            images,
        })
        res.json({success:true,message: "Room Created successfully"})

    } catch(error){
         res.json({success:false,message:error.message})

    }

}

//Api To get all rooms
export const getRooms = async (req,res)=>{
    try {
        // --- Room Sorting/Recommendation Algorithm ---
        // Scores rooms based on popularity (booking history) and value (amenities/price ratio)
        const roomsData = await Room.aggregate([
            { $match: { isAvailable: true } },
            {
                $lookup: {
                    from: "bookings",
                    localField: "_id",
                    foreignField: "room",
                    as: "roomBookings"
                }
            },
            {
                $addFields: {
                    popularityScore: { $size: "$roomBookings" },
                    valueScore: {
                        $divide: [
                            { $size: { $ifNull: ["$amenities", []] } },
                            { $max: ["$pricePerNight", 1] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    // Weighted scoring: Popularity * 5 + Value * 1000
                    recommendationScore: {
                        $add: [
                            { $multiply: ["$popularityScore", 5] },
                            { $multiply: ["$valueScore", 1000] }
                        ]
                    }
                }
            },
            { $sort: { recommendationScore: -1, createdAt: -1 } },
            { $project: { roomBookings: 0 } } // Exclude raw booking data to save bandwidth
        ]);

        // Mongoose aggregate does not automatically populate, so we populate manually
        const rooms = await Room.populate(roomsData, {
            path: 'hotel',
            populate: {
                path: 'owner' ,
                select: 'image'
            }
        });

        res.json({success:true,rooms})
    }catch(error){
        res.json({success:false,message:error.message});
    }
}

//Api To get all rooms for a specific hotel
export const getOwnerRooms = async (req,res)=>{
    try {
        const auth = typeof req.auth === "function" ? req.auth() : req.auth;
        const userId = auth?.userId;
        
        if (!userId) {
            return res.json({success:false,message:"Not authenticated"});
        }
        
        const hotels = await Hotel.find({owner:userId});
        
        if (hotels.length === 0) {
            return res.json({success:true,rooms:[]});
        }
        
        const hotelIds = hotels.map(h => h._id);
        const rooms = await Room.find({hotel: { $in: hotelIds }}).populate("hotel");
        
        res.json({success:true,rooms});
    } catch (error) {
        res.json({success:false,message:error.message});
    }
    
}


//Api To toggle toggle Availability of a room
export const toggleRoomAvailability = async (req,res)=>{
    try {
        const {roomId} =req.body;
        const userId = getAuthUserId(req);

        const roomData = await Room.findById(roomId).populate("hotel");
        if (!roomData) {
            return res.json({success:false, message:"Room not found"});
        }

        if (!(await isRoomOwnedByUser(roomData, userId))) {
            return res.json({ success: false, message: "Not authorized to update this room" });
        }

        roomData.isAvailable =!roomData.isAvailable;
        await roomData.save();
        res.json({success:true,message:"Room availability updated"})
    } catch (error) {
        res.json({success:false,message:error.message});
    }
}

//Api To delete a room (only by the hotel's owner)
export const deleteRoom = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;

        console.log('deleteRoom called - userId:', userId, 'roomId:', id);

        const room = await Room.findById(id).populate("hotel");
        if (!room) {
            console.log('Room not found');
            return res.json({ success: false, message: "Room not found" });
        }

        console.log('Room found, hotel:', room.hotel._id.toString());

        if (!(await isRoomOwnedByUser(room, userId))) {
            console.log('Not authorized - room hotel not in owner hotels');
            return res.json({ success: false, message: "Not authorized to delete this room" });
        }

        console.log('Authorization passed, deleting room');
        await Room.findByIdAndDelete(id);
        res.json({ success: true, message: "Room deleted" });
    } catch (error) {
        console.error('Error in deleteRoom:', error);
        res.json({ success: false, message: error.message });
    }
}

//Api to get a single room by ID
export const getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findById(id).populate({
            path: "hotel",
            populate: { path: "owner", select: "image name username" },
        });

        if (!room) return res.json({ success: false, message: "Room not found" });

        res.json({ success: true, room });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

//Api to update room details (only by the hotel's owner)
export const updateRoom = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { id } = req.params;
        const { roomType, pricePerNight, amenities, isAvailable } = req.body;

        const room = await Room.findById(id).populate("hotel");
        if (!room) {
            return res.json({ success: false, message: "Room not found" });
        }

        if (!(await isRoomOwnedByUser(room, userId))) {
            return res.json({ success: false, message: "Not authorized to edit this room" });
        }

        if (roomType !== undefined) {
            room.roomType = roomType;
        }

        if (pricePerNight !== undefined) {
            const parsedPrice = Number(pricePerNight);
            if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
                return res.json({ success: false, message: "Price per night must be a valid number" });
            }
            room.pricePerNight = parsedPrice;
        }

        if (amenities !== undefined) {
            if (!Array.isArray(amenities)) {
                return res.json({ success: false, message: "Amenities must be an array" });
            }
            room.amenities = amenities;
        }

        if (isAvailable !== undefined) {
            room.isAvailable = Boolean(isAvailable);
        }

        await room.save();
        return res.json({ success: true, message: "Room updated successfully", room });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}