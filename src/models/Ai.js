import mongoose from "mongoose";

const aiModelScheme = new mongoose.Schema({
    userId : {
        type : String,
        required : true
    },
    model_name : {
        type : String,
        required : true
    }
}, { timestamps: true })

export default mongoose.model('user_aiModel', aiModelScheme);
