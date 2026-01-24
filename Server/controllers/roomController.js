import { response } from "express";
import Hotel from "../models/Hotel.js";
import {v2 as cloudinary} from "cloudinary"
import Room from "../models/Room.js";


//Api To create a new room for a hotel
export const createRoom = async (req,res)=>{
    try{
        const{roomType,pricePerNight,amenities}=req.body;
        const auth = typeof req.auth === "function" ? req.auth() : req.auth;
        const userId = auth?.userId;
        const hotel =await Hotel.findOne({owner:userId})

        if(!hotel)return res.json({success:false,message:"No Hotel Found"});

        //upload images to cloudinary
        const uploadImages= req.files.map(async (file)=>{
            const response = await cloudinary.uploader.upload(file.path);
            return response.secure_url;
        })

        const images=await Promise.all(uploadImages)


        await Room.create({
            hotel: hotel. id,
            roomType,
            pricePerNight: +pricePerNight,
            amenities: JSON.parse(amenities),
            images,

        })
        res.json({success:true,message: "Room Created successfully"})

    } catch(error){
         res.json({success:true,message:error.message})

    }

}

//Api To get all rooms
export const getRooms = async (req,res)=>{
    try {
        const rooms= await Room.find({isAvailable:true}).populate({

            path: 'hotel',
            populate: {
            path: 'owner' ,
            select:'image'
            }
        }).sort({createdAt:-1})
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
        const hotelData =await Hotel.findOne({owner:userId})
        const rooms =await Room.find({hotel:hotelData._id.toString()}).populate("hotel");
        res.json({success:true,rooms});
    } catch (error) {
        res.json({success:false,message:error.message});
    }
    
}


//Api To toggle toggle Availability of a room
export const toggleRoomAvailability = async (req,res)=>{
    try {
        const {roomId} =req.body;
        const roomData = await Room.findById(roomId);
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
        const auth = typeof req.auth === "function" ? req.auth() : req.auth;
        const userId = auth?.userId;
        const { id } = req.params;

        const room = await Room.findById(id).populate("hotel");
        if (!room) return res.json({ success: false, message: "Room not found" });

        const ownerHotel = await Hotel.findOne({ owner: userId });
        if (!ownerHotel || room.hotel._id.toString() !== ownerHotel._id.toString()) {
            return res.json({ success: false, message: "Not authorized to delete this room" });
        }

        await Room.findByIdAndDelete(id);
        res.json({ success: true, message: "Room deleted" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}