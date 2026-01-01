import { response } from "express";
import mongoose from "mongoose";
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
            try {
                const uploadImages= req.files.map(async (file)=>{
                    try {
                        const response = await cloudinary.uploader.upload(file.path, {
                            timeout: 60000, // 60 second timeout per image
                        });
                        return response.secure_url;
                    } catch (uploadError) {
                        console.error(`Error uploading image ${file.originalname}:`, uploadError);
                        throw new Error(`Failed to upload image: ${uploadError.message}`);
                    }
                });
                images = await Promise.all(uploadImages);
            } catch (uploadError) {
                console.error("Error uploading images:", uploadError);
                return res.json({success:false, message: `Image upload failed: ${uploadError.message}`});
            }
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
        // Wait for connection if it's in progress (readyState 2 = connecting)
        if (mongoose.connection.readyState === 2) {
            // Connection in progress, wait up to 5 seconds
            let waitTime = 0;
            while (mongoose.connection.readyState === 2 && waitTime < 5000) {
                await new Promise(resolve => setTimeout(resolve, 500));
                waitTime += 500;
            }
        }
        
        // If still not connected, return error
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: "Database is not connected. Please wait a moment and refresh."
            });
        }

        let rooms = await Room.find({isAvailable:true})
            .sort({createdAt:-1})
            .maxTimeMS(10000); // 10 second timeout
        
        // Manually populate hotel since it's stored as String
        const roomsWithHotel = await Promise.all(
            rooms.map(async (room) => {
                try {
                    const roomObj = room.toObject(); // Convert mongoose document to plain object
                    if (room.hotel) {
                        const hotel = await Hotel.findById(room.hotel).maxTimeMS(5000);
                        roomObj.hotel = hotel;
                    }
                    return roomObj;
                } catch (err) {
                    console.error(`Error populating hotel for room ${room._id}:`, err);
                    return null;
                }
            })
        );
        
        // Filter out rooms without valid hotels and null values
        const validRooms = roomsWithHotel.filter(room => room && room.hotel);
        
        res.json({success:true, rooms:validRooms})
    }catch(error){
        console.error("Error fetching rooms:", error);
        let errorMessage = "Failed to fetch rooms";
        
        if (error.name === 'MongoServerSelectionError' || error.name === 'MongoTimeoutError') {
            errorMessage = "Database connection timeout. Please check your MongoDB connection and ensure MONGODB_URI is set in your .env file.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(500).json({success:false, message: errorMessage});
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

//Api To update a room
export const updateRoom = async (req,res)=>{
    try{
        const {roomId} = req.params;
        const {roomType,pricePerNight,amenities} = req.body;
        const auth = await req.auth();
        
        // Find the hotel for this owner
        const hotel = await Hotel.findOne({owner:auth.userId});
        if(!hotel) return res.json({success:false,message:"No Hotel Found"});

        // Find the room and verify it belongs to this hotel
        const room = await Room.findById(roomId);
        if(!room) return res.json({success:false,message:"Room not found"});
        
        if(room.hotel !== hotel._id.toString()) {
            return res.json({success:false,message:"Unauthorized to update this room"});
        }

        // Upload new images to cloudinary if provided
        let images = room.images || []; // Keep existing images by default
        if(req.files && req.files.length > 0){
            try {
                const uploadImages = req.files.map(async (file)=>{
                    try {
                        const response = await cloudinary.uploader.upload(file.path, {
                            timeout: 60000, // 60 second timeout per image
                        });
                        return response.secure_url;
                    } catch (uploadError) {
                        console.error(`Error uploading image ${file.originalname}:`, uploadError);
                        throw new Error(`Failed to upload image: ${uploadError.message}`);
                    }
                });
                const newImages = await Promise.all(uploadImages);
                
                // If new images are uploaded, replace all existing images
                if(newImages.length > 0) {
                    images = newImages;
                }
            } catch (uploadError) {
                console.error("Error uploading images:", uploadError);
                return res.json({success:false, message: `Image upload failed: ${uploadError.message}`});
            }
        }

        // Update room fields
        room.roomType = roomType || room.roomType;
        room.pricePerNight = pricePerNight ? +pricePerNight : room.pricePerNight;
        if(amenities) room.amenities = JSON.parse(amenities);
        room.images = images; // Update images (either new or existing)

        await room.save();
        res.json({success:true,message: "Room updated successfully"})

    } catch(error){
         res.json({success:false,message:error.message})
    }
}