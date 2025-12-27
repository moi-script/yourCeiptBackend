import mongoose, { mongo } from "mongoose";
import bcrypt from "bcryptjs";

//  const format = {
//         "store": null,
//         "slogan": null,
//         "contact": null,
//         "manager": null,
//         "address": {
//             "street": null,
//             "city": null,
//             "state": null,
//             "zip": null
//         },
//         "transaction": {
//             "store_number": null,
//             "operator_number": null,
//             "terminal_number": null,
//             "transaction_number": null
//         },
//         "items": [
//             {
//                 "description": null,
//                 "upc": null,
//                 "type": null,
//                 "price": null,
//                 "quantity": null
//             }
//         ],
//         "subtotal": null,
//         "tax_rate": null,
//         "tax_amount": null,
//         "total": null,
//         "payment_method": null,
//         "amount_paid": null,

//         "metadata": {
//             "currency": null,
//             "datetime": null,
//             "notes": null,
//             "source_type": null
//         }
//     }

const ItemSchema = new mongoose.Schema({
    description : String,
    upc : String,
    type : String,
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
        image_source : String
    }
}, { timestamps: true })



export default mongoose.model('receipt', ReceiptSchema);