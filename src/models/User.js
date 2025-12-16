import mongoose from "mongoose";



const userSchema = new mongoose.Schema({
  nickname: { 
    type: String, 
    required: true 
  },
  fullname : {
    type: String, 
    required : true,
  },
  password : {
    type : String,
    required : true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('accounts', userSchema);