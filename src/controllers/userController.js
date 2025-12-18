import User from '../models/User.js'; // Import the model to talk to the DB
import bcrypt from 'bcryptjs';



const delay = (res) => {
  return new Promise((acc, rej) => {

    setTimeout(() => {
      console.log('After delay');
      acc(() => res.status(201).json({ message: 'account created successfully' }))
    }, 5000);
  }) 
}


export const createUser = async (req, res) => {
  console.log('Creating user :: ');

  const { nickname, fullname, email, password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid password' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  try {

    await User.create({
      nickname,
      fullname,
      email,
      password: hashPassword
    });

    const status = await delay(res);
    status();

  } catch (error) {
    console.log('There was an error creating an account');
    res.status(500).json({ error: error.message });
  }
};


export const checkPassword = async (loginEmail, password) => {
  const user = User.findOne({email : loginEmail});

  const isMatch = await user.checkPassword(password);

  if(isMatch) {
    console.log('User exist');
  }
} 


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};