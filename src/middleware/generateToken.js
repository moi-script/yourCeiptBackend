import jwt from 'jsonwebtoken';


export const generateTokenAndSetCookie = (req, res, next) => {

    const {nickname, fullname, email} = req.body;
    const token = jwt.sign({username: nickname, fullname : fullname, email : email }, process.env.JWT_SECRET_KEY, { expiresIn: '1m' });
    const refreshToken = jwt.sign({ username: nickname, fullname : fullname, email : email }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });

    res.cookie('accessToken', token, {
        httpOnly: true, // Prevent XSS (JS cannot read this)
        sameSite: 'lax', // Protect against CSRF
        secure: process.env.NODE_ENV !== 'development', // Use HTTPS in production
        maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax', // Protect against CSRF
        secure: process.env.NODE_ENV !== 'development', // Use HTTPS in production
        maxAge: 15 * 60 * 1000
    });
    console.log('Cookie access ::', token);
    console.log('Cookie refresh ::', refreshToken);

    console.log('Cookie settled');

    next();
    // Optional: You can return the token if you want to send it in JSON too
    //   return token;
};
