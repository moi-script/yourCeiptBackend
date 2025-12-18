import { body, validationResult } from 'express-validator';




// 1st rules needs to invoke
export const validateUserInput = () => {
    return {
        isEmail : () => body('email').isEmail(),
        isPassLength : () => body('password').isLength({ min: 5 })
    }
} 


export const sanitized = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
      return res.status(400).json({ errors: errors.array() });
    }
    next();
}