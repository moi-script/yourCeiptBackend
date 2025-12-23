import express from 'express';
import { extractText } from '../controllers/batchController.js';
const trigger = express.Router();


trigger.get('/getText', extractText, (req, res) => {
    console.log('Extracted text :: ', req.extractedText);
    res.status(200).json({contents : req.extractedText, status : 200});
})


export default trigger;
