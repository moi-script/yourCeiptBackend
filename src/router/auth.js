import express from 'express';
const router = express.Router();
import { createUser } from '../controllers/userController.js';
import { transformLogin } from '../middleware/transform.js';
import { validateUserInput } from '../middleware/validator.js';
import { sanitized } from '../middleware/validator.js';
import { body, validationResult } from 'express-validator';


console.log('TYpes :: tranformLogin ::', typeof transformLogin);


router.post('/register', createUser);
router.post('/login', transformLogin,
    // body('email').isEmail(),
    // body('password').isLength({ min: 5 }),
    validateUserInput().isEmail(),
    validateUserInput().isPassLength(),
    sanitized,
    (req, res) => {
        res.status(200).send('Hello world');
        console.log('After sanitation :: ', req.body);

    }
)




export default router;