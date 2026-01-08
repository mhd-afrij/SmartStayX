// Import lodash before Cloudinary to ensure it's available for Cloudinary's internal requires
// Cloudinary uses require('lodash/extend') internally, so we need lodash loaded first
import _ from 'lodash';
import {v2 as cloudinary} from "cloudinary";

const connectCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
};

export default connectCloudinary;