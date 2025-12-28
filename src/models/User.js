import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const accountSchema = new mongoose.Schema({
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
  image_profile : {
    type : String,
  },
  currency : {
    type : String,
  },
  theme : {
    type : String,
  },
  overSpending : {
    type : Boolean,
  },
  nearLimit : {
    type : Boolean,
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


accountSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);  
}


accountSchema.methods.checkId = async function(userId) {
  return this._id === userId
}

export default mongoose.model('accounts', accountSchema);