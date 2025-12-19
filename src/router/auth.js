import express from 'express';
const router = express.Router();
import { createUser } from '../controllers/userController.js';
import { transformLogin } from '../middleware/transform.js';
import { validateUserInput } from '../middleware/validator.js';
import { sanitized } from '../middleware/validator.js';
import { userAuth } from '../controllers/userController.js';
import rateLimit from 'express-rate-limit';
import { generateTokenAndSetCookie } from '../middleware/generateToken.js';

console.log('TYpes :: tranformLogin ::', typeof transformLogin);

// rateLimit, for production test


router.post('/register', createUser, generateTokenAndSetCookie, (req, res) => {
    
    res.status(200).send('Succesfully created an account');
});


router.post('/login',  transformLogin,
    // body('email').isEmail(),
    // body('password').isLength({ min: 5 }),
    validateUserInput().isEmail(),
    validateUserInput().isPassLength(),
    sanitized,
    userAuth,
    (req, res) => {
        res.status(200).send('Hello world');
        console.log('After sanitation :: ', req.body);

    }
)






router.get('/refreshToken', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.status(401).send('Not authenticated');

    jwt.verify(refreshToken, "REFRESH_SECRET", (err, user) => {
        if (err) return res.status(403).send('Token invalid');

        const newAccess = jwt.sign({ username: user.username }, 'ACCESS_SECRET', { expiresIn: '7d' });

        res.cookie('access_token', newAccess, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.send('Access token refreshed');
    })
})






export default router;