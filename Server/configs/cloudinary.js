// IMPORTANT: lodash must be imported BEFORE cloudinary
// Cloudinary internally uses require('lodash/extend'), and in ES module environments,
// lodash needs to be in the module cache before Cloudinary is imported
// This import ensures lodash is loaded and available for Cloudinary's internal requires
import _ from 'lodash';

// Now import Cloudinary - lodash is already in the module cache
import {v2 as cloudinary} from "cloudinary";

const connectCloudinary = () => {
    try {
        // Only configure if environment variables are present
        if (!process.env.CLOUDINARY_CLOUD_NAME || 
            !process.env.CLOUDINARY_API_KEY || 
            !process.env.CLOUDINARY_API_SECRET) {
            console.warn('⚠️  Cloudinary environment variables not set - Cloudinary features disabled');
            return;
        }

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        console.log('✅ Cloudinary configured successfully');
    } catch (error) {
        console.error('❌ Cloudinary configuration error:', error.message);
        // Don't throw - allow app to continue without Cloudinary
        // Routes that use Cloudinary will handle errors individually
    }
};

export default connectCloudinary;