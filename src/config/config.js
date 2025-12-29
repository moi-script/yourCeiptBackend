import 'dotenv/config'; // Load env vars once here
// const cloudinary = require('cloudinary').v2;
import {v2 as cloudinary} from 'cloudinary';


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
  secure : true,
});




const config = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    db: {
        uri: process.env.NODE_ENV === 'development' ?  'mongodb://localhost:27017/project' : process.env.MONGO_URI,
    },
    cloudinary : cloudinary,
    jwtSecret: process.env.JWT_SECRET,
};


if (!config.db.uri) {
    throw new Error('FATAL ERROR: MONGO_URI is not defined in .env');
}

export default config;