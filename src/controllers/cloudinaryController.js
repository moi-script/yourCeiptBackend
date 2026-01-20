import config from '../config/config.js';
import streamifier from 'streamifier';
import { Readable } from 'stream';
export const deleteCloudImage = async (req, res, next) => {
    const { public_id } = req.body;

    if (public_id) {
        try {
            const result = await config.cloudinary.uploader.destroy(public_id);
            next();
            req.result = result;
        } catch (error) {
            console.error("Deletion failed:", error);
            res.status(500).json({ error: "Failed to delete image" });
        }
    } else {
        res.status(500).json({message : 'No public Id presented'});
        next();
    }

}


// Inside your route handler
export const uploadCloudImage = async (req, res, next) => {
    const { public_url } = req.body;

    if(public_url){
         await config.cloudinary.uploader.destroy(public_url);
    }

      try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = config.cloudinary.uploader.upload_stream(
                    { folder: 'user_profile' },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                // Convert buffer to readable stream and pipe to cloudinary
                Readable.from(fileBuffer).pipe(stream);
            });
        };

        // Now we can await the upload just like before
        const result = await streamUpload(req.file.buffer);

        // No need to delete files (fs.unlink) because nothing was saved to disk!

        res.json({ 
            message: "Upload successful", 
            imageUrl: result.secure_url 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Image upload failed" });
    }
};


// const streamifier = require('streamifier'); // Optional: npm install streamifier OR see native node solution below

// We create a helper to upload from buffer
// export const uploadFromBuffer = (buffer) => {

//     return new Promise((resolve, reject) => {

//         let cld_upload_stream = config.cloudinary.uploader.upload_stream(
//             {
//                 folder: "user_profile"
//             },
//             (error, result) => {
//                 if (result) {
//                     resolve(result);
//                 } else {
//                     reject(error);
//                 }
//             }
//         );

//         // Convert the buffer to a stream and pipe it to Cloudinary
//         // If you don't want to install 'streamifier', use standard Node streams (shown in the main block below)
//         streamifier.createReadStream(buffer).pipe(cld_upload_stream);
//     });

// };



export const uploadCloudImageStream = async(req, res) => {
      try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided" });
        }

        const streamUpload = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = config.cloudinary.uploader.upload_stream(
                    { folder: 'user_receipt_image' },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                // Convert buffer to readable stream and pipe to cloudinary
                Readable.from(fileBuffer).pipe(stream);
            });
        };

        // Now we can await the upload just like before
        const result = await streamUpload(req.file.buffer);

        // No need to delete files (fs.unlink) because nothing was saved to disk!

        res.json({ 
            message: "Upload successful", 
            imageUrl: result.secure_url 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Image upload failed" });
    }
}