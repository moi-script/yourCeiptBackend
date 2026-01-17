import config from '../config/config.js';

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
        if (!req.file) throw Error('No file path sent');


        console.log('Req.file --> ', req.file.path);

        const result = await config.cloudinary.uploader.upload(req.file.path, {
            folder: "user_profile", // Optional: Organize in a folder
        });

        console.log("Secure URL:", result.secure_url);
        console.log("Publi URL:", result.public_id);

        req.public_url = result.public_id;
        req.secure_url = result.secure_url;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).send("Upload failed");
    }
};


export const getCloudImage = async() => {
    
}