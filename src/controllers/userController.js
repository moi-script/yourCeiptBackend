import User from '../models/User.js'; // Import the model to talk to the DB
import bcrypt from 'bcryptjs';

export const createUser = async (req, res) => {
    console.log('Creating user :: ');

    const { nickname, fullname, email, password} = req.body;

    if(!password || typeof password !== 'string') {
        return res.status(400).json({error : 'Invalid password'});
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
  try {

    const newUser = await User.create({
        nickname,
        fullname, 
        email,
        password : hashPassword
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.log('There was an error creating an account');
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};