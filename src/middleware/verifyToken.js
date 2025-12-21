import jwt from 'jsonwebtoken';
import User from '../models/User.js';


export const verifyToken = async (req, res, next) => {

    console.log('Verifying token for refresh page');
    try {
        // 1. GET THE TOKEN
        // We look inside req.cookies for the cookie named 'jwt' (or whatever you named it)
        const token = req.cookies.accessToken;
        console.log('token -> ', req.cookies.accessToken);

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        console.log('Decoded object ::', decoded);

        try {
            req.user = await User.find({_id : decoded._id });

        } catch (err) {
            console.error('Unable to find in db..', err)
        }
        if (!req.user) {
            return res.status(401).json({ message: "User not found" });
        }

        // 4. MOVE TO NEXT STEP
        // Now that req.user is populated, we let the request continue to the route.
        next();

    } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Not authorized, token failed" });
    }
};