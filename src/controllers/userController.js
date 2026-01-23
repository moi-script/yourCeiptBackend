import User from '../models/User.js'; // Import the model to talk to the DB
import Receipt from '../models/Receipt.js';
import Manual from '../models/Manual.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import nodemailer from 'nodemailer';''
import { getPASS, getEMAIL } from '../utils/getKey.js';

dotenv.config();

// const delay = (res) => {
//   return new Promise((acc, rej) => {

//     setTimeout(() => {
//       console.log('After delay');
//       acc(() => res.status(201).json({ message: 'account created successfully' }))
//     }, 5000);
//   })
// }

export const createUser = async (req, res, next) => {

  console.log('Creating user :: ');
  const { nickname, fullname, email, password, overSpending, currency, image_profile, image_public_url, theme, nearLimit } = req.body;

  // console.log(nickname, fullname, email, password, overSpending, currency, image_profile, image_public_url, theme, nearLimit)

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid password' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  try {
    // console.log('User id :: ', req.userId);
    const newUser = await User.create({
      nickname,
      fullname,
      email,
      overSpending,
      currency,
      image_profile,
      theme,
      nearLimit,
      image_public_url,
      password: hashPassword
    });

    req.userId = newUser._id;
    next();
    // const status = await delay(res);
    // status();

  } catch (error) {
    console.log('There was an error creating an account');
    res.status(500).json({ error: error.message });
  }
};


export const getUserReceipts = async (req, res, next) => {
  const { userId } = req.body;

  // console.log("User id :: ", userId);
  const receipts = await Receipt.find({ userId: userId });
  // console.log('Receipts :: ', receipts);
  req.receipts = receipts;
  next();
}



export const getUserManualReceipts = async (req, res, next) => {
  const { userId } = req.body;

  // console.log("User id :: ", userId);
  const receipts = await Manual.find({ userId: userId });
  // console.log('Receipts :: ', receipts);
  req.receipts.push(receipts);
  next();
}



export const userAuth = async (req, res, next) => { // needed to parse the incomming request in userAuth
  console.log('User auth email :: ', req.body.email);
  console.log('User auth password:: ', req.body.password);

  const user = await User.findOne({ email: req.body.email });

  // console.log("User result :: ", user);
  if (user.checkPassword) {
    const isMatch = await user.checkPassword(req.body.password);
    if (isMatch) {

      // populate userId from db to passed for jwt
      req.userId = user._id;
      req.user = await User.findOne({ _id: user._id }).select('fullname nickname email _id, currency theme nearLimit overSpending image_profile image_public_url').lean();
      console.log('Req user for user auth ::', req.user);
      next();

    } else {
      res.status(404).json({ message: 'Invalid email or password', status: 404 });
    }
  }
  else res.status(500).send('Internal server error');

}


export const updateTheme = async (req, res, next) => {
  const { preferences, userId } = req.body;
  console.log('Preferences ::', preferences);
  console.log('User id  ::', userId);

  try {

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          theme: preferences,
        }
      },
      { new: true, runValidators: true }).select('theme');

    console.log('Updated user :: ', updatedUser);
    next();

  } catch (err) {
    res.status(404).json({ message: 'Invalid user', status: 404 });

  }

}


export const updateCurrency = async (req, res, next) => {
  const { currency, userId } = req.body;
  console.log('Preferences ::', currency);
  console.log('User id  ::', userId);

  try {

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          currency: currency.toUpperCase(),
        }
      },
      { new: true, runValidators: true }).select('currency');

    console.log('Updated user :: ', updatedUser);
    next();

  } catch (err) {
    res.status(404).json({ message: 'Invalid user', status: 404 });

  }

}




export const updateOverSpending = async (req, res, next) => {
  const { overSpending, userId } = req.body;
  console.log('Preferences ::', overSpending);
  console.log('User id  ::', userId);

  try {

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          overSpending: overSpending
        }
      },
      { new: true, runValidators: true }).select('overSpending');

    next();

  } catch (err) {
    res.status(404).json({ message: 'Invalid user', status: 404 });

  }

}



export const updateNearLimit = async (req, res, next) => {
  const { nearLimit, userId } = req.body;
  console.log('near limit  ::', nearLimit);
  console.log('User id  ::', userId);

  try {

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          nearLimit: nearLimit
        }
      },
      { new: true, runValidators: true }).select('nearLimit');

    next();

  } catch (err) {
    res.status(404).json({ message: 'Invalid user', status: 404 });

  }

}






export const updateProfileUrl = async (req, res, next) => {
  const { image_profile, userId } = req.body;
  console.log('image_profile  ::', image_profile);
  console.log('User id  ::', userId);

  try {

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          image_profile: image_profile
        }
      },
      { new: true, runValidators: true }).select('image_profile');
    next();

  } catch (err) {
    res.status(404).json({ message: 'Invalid user', status: 404 });

  }

}

export const updateFullName = async (req, res, next) => {
  const { fullname, userId } = req.body;
  console.log('Fullname  ::', fullname);
  console.log('User id  ::', userId);

  try {

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          fullname: fullname
        }
      },
      { new: true, runValidators: true }).select('fullname');
    next();

  } catch (err) {
    res.status(404).json({ message: 'Invalid user', status: 404 });

  }
}


export const updateNickname = async (req, res, next) => {
  const { nickname, userId } = req.body;
  console.log('Fullname  ::', nickname);
  console.log('User id  ::', userId);

  try {

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          nickname: nickname
        }
      },
      { new: true, runValidators: true }).select('nickname');
    next();

  } catch (err) {
    res.status(404).json({ message: 'Invalid user', status: 404 });

  }
}

export const updateProfilePic = async (req, res, next) => {
  const { image_source, image_public_url, userId } = req.body;
  
  console.log('Image source  ::', image_source);
  console.log('Image public url  ::', image_public_url);

  console.log('User id  ::', userId);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          image_profile: image_source,
          image_public_url : image_public_url
        }
      },
      { new: true, runValidators: true }).select('image_public_url image_profile');
    next();

  } catch (err) {
    res.status(404).json({ message: 'Invalid user', status: 404 });

  }

}

export const deleteUserAccount = async (req, res, next) => {
  const { userId, password } = req.body;

  try {
    const deleteAccount = await User.findOne({ _id: userId });
    if (deleteAccount.checkPassword) {
      const isMatch = await deleteAccount.checkPassword(password);

      if (isMatch) {
        const deleteAccount = await User.deleteOne({ _id: userId });
        req.deleteAccount = deleteAccount;
        next();
      }
    }

  } catch (err) {
    console.err(err)
  }
}



const USER_PASSWORD = getPASS();
const USER_EMAIL = getEMAIL();

// Nodemailer Config (Same as before)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: USER_EMAIL,
    pass: USER_PASSWORD, // App Password
  },
});

// --- 1. SEND OTP ---
export const sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB (Expires in 10 mins)
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send Email
    await transporter.sendMail({
      from: getEMAIL(),
      to: email,
      subject: "Your Password Reset OTP",
      text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error('Unable to send otp :: ', err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- 2. VERIFY OTP (For UI Feedback) ---
export const verifyOTP = async (req, res) => {
  console.log("OTP value :: ", req.body.otp);
  console.log("Email value :: ", req.body.email);


  const { email, otp } = req.body;
  console.log('Again ::', email, otp)
  try {
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpires: { $gt: Date.now() } 
    });



    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    res.json({ message: "OTP Verified" });
  } catch (err) {
    console.error('Unable to verify otp :: ', err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- 3. RESET PASSWORD ---
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    // We check the OTP again here for security
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error('Unable to reset password :: ', err);
    res.status(500).json({ message: "Server error" });
  }
};