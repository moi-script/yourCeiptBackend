import mongoose, { mongo } from "mongoose";

const ItemSchema = new mongoose.Schema({
    description : String,
    upc : String,
    type : String,
    category : String,
    price : Number,
    quantity : Number,
})


const ReceiptSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
        store : String,
        slogan : String,
        contact :String,
        manager : String,

    address : {
        street : String,
        city : String,
        state : String,
        zip : String,
    },

    transaction : {
        store_number : String,
        operator_number : String,
        terminal_number : String,
        transaction_number : String,
    },

    
    items : [ItemSchema],
    subtotal : String,
    tax_rate : String,
    tax_amount : String,
    total : String,
    payment_method :String,
    amount_paid : String,
    metadata : {
        currency : String,
        datetime : String,
        notes : String,
        source_type : String,
        type : { type : String},
        image_source : String,
    }
}, { timestamps: true })



export default mongoose.model('receipt', ReceiptSchema);