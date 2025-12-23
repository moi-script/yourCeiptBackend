import User from '../models/User.js'; // Import the model to talk to the DB
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
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
  const { nickname, fullname, email, password } = req.body;

  
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
      next();
      
    } else {
      res.status(404).send('Not found');
    }
  }
  else res.status(500).send('Internal server error');

}

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};