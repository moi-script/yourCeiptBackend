import express from 'express';
import { uploadParseText } from '../controllers/receiptController.js';
import { extractText, quickParseText } from '../controllers/batchController.js';
const trigger = express.Router();


trigger.get('/getText', extractText, (req, res) => {
    console.log('Extracted text :: ', req.extractedText);
    res.status(200).json({contents : req.extractedText, status : 200});
})


trigger.post('/quickText', quickParseText, uploadParseText, (req, res) => {
    console.log('Quick text succesfully uploaded', req.output);

    res.status(200).json({message : 'Upload success', status : 200});

})

export default trigger;
