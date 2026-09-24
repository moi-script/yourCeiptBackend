import express from 'express';
import multer from 'multer';
const router = express.Router();
import { createUser, getUserManualReceipts, getUserReceipts, 
    resetPassword, sendOTP, updateCurrency, updateFullName, updateNearLimit, 
    updateNickname, updateOverSpending, updateProfilePic,
     updateTheme, verifyOTP } from '../controllers/userController.js';
     
import { transformLogin } from '../middleware/transform.js';
import { validateUserInput } from '../middleware/validator.js';
import { sanitized } from '../middleware/validator.js';
import { userAuth } from '../controllers/userController.js';
import rateLimit from 'express-rate-limit';
import { generateTokenAndSetCookie } from '../middleware/generateToken.js';
import { verifyToken } from '../middleware/verifyToken.js';
import chalk from 'chalk';
import { clearAuthCookies, changePassword, deleteAccount, exportMyData, getSecurity, handleSecondFactor, signOutEverywhere, updateSecurity, verifyLoginCode } from '../controllers/securityController.js';

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
    handleSecondFactor,   // may stop here and email a code instead
    generateTokenAndSetCookie,
    (req, res) => {
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
    res.status(200).json({success : true, contents : req.receipts})
})

router.post('/logout', (req, res) => {
    // Must match the attributes the cookies were set with, or the browser
    // keeps them (this used to clear with sameSite: 'lax' and did nothing).
    clearAuthCookies(res);
    return res.status(200).json({ message: 'Logged out successfully' });
});



router.post('/theme', updateTheme, (req, res) => {
    res.status(200).json({message : "Update Done", code : 200});
})

router.post('/currency', updateCurrency, (req, res) => {
    res.status(200).json({message : "Update Done", code : 200});
})

router.post('/overSpending', updateOverSpending, (req, res) => {
    res.status(200).json({message : "Update Done", code : 200});
})

router.post('/nearLimit', updateNearLimit, (req, res) => {
    res.status(200).json({message : "Update Done", code : 200});
})

router.post('/fullname', updateFullName, (req, res) => {
    res.status(200).json({message : 'Updated'});
})

router.post('/nickname', updateNickname, (req, res) => {
    res.status(200).json({message : 'Updated'});
})

router.post('/image_profile', updateProfilePic, (req, res) => {
    res.status(200).json({message : "Update Done", code : 200, public_url : req.public_url});
})

router.delete('/delete-account', verifyToken, deleteAccount);

// Two-step sign-in: second half of /login when the account has it switched on.
router.post('/login/verify-code', verifyLoginCode, generateTokenAndSetCookie, (req, res) => {
    res.status(200).json({ message: "Succesfully login", status: 200, _id: req.userId, ...req.user });
});

// Privacy & security (session cookie required)
router.get('/security', verifyToken, getSecurity);
router.post('/security', verifyToken, updateSecurity);
router.post('/change-password', verifyToken, changePassword, generateTokenAndSetCookie, (req, res) => {
    res.status(200).json({ message: "Password changed. Other devices have been signed out." });
});
router.post('/signout-all', verifyToken, signOutEverywhere);
router.get('/export', verifyToken, exportMyData);


router.post('/send-otp', sendOTP);
router.post('/reset-password', resetPassword);
router.post('/verify-otp', verifyOTP);



export default router;