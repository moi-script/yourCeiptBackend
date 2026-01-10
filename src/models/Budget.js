import mongoose from "mongoose";

const budgetScheme = new mongoose.Schema({
    userId : {
        type : String,
        required : true
    },
    category : {
        type : String,
        required : true
    },
    budgetName : {
        type : String,
        required : true
    },
    budgetAmount : {
        type : Number,
        required : true
    },
    spent : {
        type : Number
    },
    color : {
        type : String,
        required : true
    },
    target : {
        type : Number
    }
})

export default mongoose.model('budget', budgetScheme);

//  { id: 1, category: 'groceries', name: 'Groceries', budget: 15000, spent: 12500, color: '#059669' }, // Emerald-600
