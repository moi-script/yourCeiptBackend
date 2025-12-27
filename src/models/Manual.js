import mongoose from "mongoose";

// transaction type

// ammount

// description 

// category 

// date 

// notes



const ManualScheme = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    transaction_type: String,
    amount: String,
    description: String,
    category: String,
    date: String,
    currency : String,
    notes: String
}, {timestamps : true});


export default mongoose.model('manual', ManualScheme);