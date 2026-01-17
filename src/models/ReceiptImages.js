import mongoose from "mongoose";


const ReceiptImgScheme = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    image_profile: {
        type: String,
    },
    image_public_url: {
        type: String
    },
}, { timestamps: true });



export default mongoose.model('receiptImage', ReceiptImgScheme);