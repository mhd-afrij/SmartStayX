import { response } from "express";
import Hotel from "../models/Hotel.js";
import {v2 as cloudinary} from "cloudinary"
import Room from "../models/Room.js";


//Api To create a new room for a hotel
export const createRoom = async (req,res)=>{
    try{
        const{roomType,pricePerNight,amenities}=req.body;
        const auth = await req.auth();
        const hotel =await Hotel.findOne({owner:auth.userId})

        if(!hotel)return res.json({success:false,message:"No Hotel Found"});

        //upload images to cloudinary
        let images = [];
        if(req.files && req.files.length > 0){
            const uploadImages= req.files.map(async (file)=>{
                const response = await cloudinary.uploader.upload(file.path);
                return response.secure_url;
            })
            images=await Promise.all(uploadImages)
        }

        await Room.create({
            hotel: hotel._id.toString(),
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
        const auth = await req.auth();
        const hotelData =await Hotel.findOne({owner:auth.userId})
        if(!hotelData) return res.json({success:false,message:"No Hotel Found"});
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