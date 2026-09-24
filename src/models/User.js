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
  otp: {
    type: String,
    required: false // Not required initially
  },
  otpExpires: {
    type: Date,
    required: false // Not required initially
  },
  image_profile : {
    type : String,
  },
  image_public_url : {
    type : String
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
  },

  // Privacy & security settings
  twoFactor: { type: Boolean, default: false },          // email code on every sign-in
  keepReceiptImages: { type: Boolean, default: true },   // store the original photo
  loginOtp: { type: String },
  loginOtpExpires: { type: Date },
  loginOtpAttempts: { type: Number, default: 0 },
  // Bumped by "sign out everywhere"; tokens carry the version they were issued with.
  tokenVersion: { type: Number, default: 0 },
  lastLoginAt: { type: Date },
  lastLoginDevice: { type: String },
});


accountSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);  
}


accountSchema.methods.checkId = async function(userId) {
  return this._id === userId
}

export default mongoose.model('accounts', accountSchema);