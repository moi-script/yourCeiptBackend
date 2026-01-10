import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
    description: String,
    category: String,
    price: Number,
    quantity: Number,
});

const DemoReceiptSchema = new mongoose.Schema({
    store: String,
    total: Number,
    items: [ItemSchema],
    metadata: {
        type: String,
        datetime: String,
        image_source: String, // We will store the uploaded URL here
    },
    // TTL INDEX: This document will self-destruct 60 seconds after creation
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 60 
    }
});

export default mongoose.model('DemoReceipt', DemoReceiptSchema);