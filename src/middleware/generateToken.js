import chalk from 'chalk';
import jwt from 'jsonwebtoken';


export const generateTokenAndSetCookie = (req, res, next) => {

    const { userId } = req.body;

    const token = jwt.sign({userId}, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });
    const refreshToken = jwt.sign({userId}, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
    
    res.cookie('accessToken', token, {
        httpOnly: true, // Prevent XSS (JS cannot read this)
        sameSite: 'lax', // Protect against CSRF
        // secure: process.env.NODE_ENV !== 'development', // Use HTTPS in production
        secure : false,
        maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax', // Protect against CSRF
        // secure: process.env.NODE_ENV !== 'development', // Use HTTPS in production
        secure : false,

        maxAge: 15 * 60 * 1000
    });
    console.log('Cookie access ::', token);
    console.log('Cookie refresh ::', refreshToken);

    console.log('Cookie settled');

    next();
    // Optional: You can return the token if you want to send it in JSON too
    //   return token;
};
