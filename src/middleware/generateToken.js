import chalk from 'chalk';
import jwt from 'jsonwebtoken';


export const generateTokenAndSetCookie = (req, res, next) => {

    // tv = token version; "sign out everywhere" bumps it so older tokens stop working.
    const claims = { userId : req.userId, tv : req.tokenVersion ?? 0 };
    const token = jwt.sign(claims, process.env.JWT_SECRET_KEY, { expiresIn: '7hr' });
    const refreshToken = jwt.sign(claims, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
    
    res.cookie('accessToken', token, {
        httpOnly: true, // Prevent XSS (JS cannot read this)
        sameSite: 'none', // Protect against CSRF
        // secure: process.env.NODE_ENV !== 'development', // Use HTTPS in production
        secure : true,
        path : '/',
        maxAge: 7 * 60 * 60 * 1000 // 1hr
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none', // Protect against CSRF
        // secure: process.env.NODE_ENV !== 'development', // Use HTTPS in production
        secure : true,
        path : '/',
        maxAge: 60 * 60 * 1000 // 1hr
    });

    next();
    // Optional: You can return the token if you want to send it in JSON too
    //   return token;
};
