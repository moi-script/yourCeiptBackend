import express from 'express';
import { uploadParseText } from '../controllers/receiptController.js';
import { extractText, quickParseText } from '../controllers/batchController.js';
import { getAiModels } from '../controllers/getAiModelsController.js';
import { generatingSanitizePrompts, getImageItemUrl, getUploadImages, producingJsonOutput, validateFormat } from '../controllers/ocrController.js';
const trigger = express.Router();


trigger.get('/getText', extractText, (req, res) => {
    console.log('Extracted text :: ', req.extractedText);
    res.status(200).json({contents : req.extractedText, status : 200});
})


trigger.post('/quickText', quickParseText, (req, res) => {
    console.log('Quick text succesfully extracted', req.output);

    res.status(200).json({message : 'Upload success', status : 200, output : req.output});

})

trigger.post('/uploadQuick', uploadParseText, (req, res) => {
    console.log('Quick text succesfully uploaded', req.output);

    res.status(200).json({message : 'Upload success', status : 200, output : req.output});

})

trigger.get('/azure', getUploadImages, getImageItemUrl, generatingSanitizePrompts, producingJsonOutput, validateFormat, (req, res) => {
    res.status(200).json({message : "Done extracting text", code : 200, contents : req.jsonResult});
});


trigger.get('/getModels', getAiModels, (req ,res) => {
    // console.log('Model list :: ', req.models);

    res.status(200).json({models : req.models});
} )


export default trigger;
