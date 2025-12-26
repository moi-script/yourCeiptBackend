import express from 'express';
const router = express.Router();
import { createUser, getUserManualReceipts, getUserReceipts } from '../controllers/userController.js';
import { transformLogin } from '../middleware/transform.js';
import { validateUserInput } from '../middleware/validator.js';
import { sanitized } from '../middleware/validator.js';
import { userAuth } from '../controllers/userController.js';
import rateLimit from 'express-rate-limit';
import { generateTokenAndSetCookie } from '../middleware/generateToken.js';
import { verifyToken } from '../middleware/verifyToken.js';
import chalk from 'chalk';
import { getFastFreeModel } from '../service/getFreeModels.js';

// rateLimit, for production test


router.post('/register', createUser, generateTokenAndSetCookie, (req, res) => {
    
    res.status(200).json({message : 'Account succefully created', status : 200});
});

router.post('/login',  transformLogin,
    // body('email').isEmail(),
    // body('password').isLength({ min: 5 }),
    validateUserInput().isEmail(),
    validateUserInput().isPassLength(),
    sanitized,
    userAuth,
    generateTokenAndSetCookie,
    (req, res) => {
        console.log(chalk.blue('User login successfulyy ::', req.userId));
        console.log(('Login logggss', {...req.user}));
        res.status(200).json({message : "Succesfully login", status : 200, _id : req.userId, ...req.user});
        // console.log('After sanitation :: ', req.body);
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


// A simple route that just returns user info if the token/cookie is valid
router.get('/verify', verifyToken, (req, res) => {
    // If the middleware passes, req.user should be populated
    res.status(200).json({ 
        status: 200, 
        user: req.user, 
        message: "Session valid" 
    });
});



router.post('/receipts', getUserReceipts, getUserManualReceipts, (req, res) => {
    setTimeout(() => {
    res.status(200).json({success : true, contents : req.receipts})

    }, 800);
})

router.post('/logout', (req, res) => {
    // Clear the cookie named 'token' (or whatever you named your JWT cookie)
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: false, 
        path: '/',
        sameSite: 'lax' 
    });
     res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false, 
        path: '/',
        sameSite: 'lax' 
    });
    
    return res.status(200).json({ message: 'Logged out successfully' });
});

// router.post('/manualresceipt', getUserManualReceipts, (req, res) => {
//     res.status(200).json({success : true, contents : req.receipts})
// })


export default router;