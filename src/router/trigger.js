import express from 'express';
import { uploadParseText } from '../controllers/receiptController.js';
import {  quickParseText } from '../controllers/batchController.js'; // extractText,
import { getAiModels, getUserModel, saveAiModel } from '../controllers/getAiModelsController.js';
import { generatingSanitizePrompts, getImageItemUrl, getUploadImages, producingJsonOutput, validateFormat } from '../controllers/ocrController.js';
import DemoReceipts from '../models/DemoReceipts.js'; // Import the new model
import { getRandomMock } from '../utils/mockData.js';
// import { getUploadImages } from '../controllers/ocrController.js'; // Reuse your existing upload
import multer from 'multer';



const upload = multer();

const trigger = express.Router();


// trigger.get('/getText', extractText, (req, res) => {
//     console.log('Extracted text :: ', req.extractedText);
//     res.status(200).json({contents : req.extractedText, status : 200});
// })


trigger.post('/quickText', quickParseText, (req, res) => {
    console.log('Quick text succesfully extracted', req.output);

    res.status(200).json({message : 'Upload success', status : 200, output : req.output});

})

trigger.post('/uploadQuick', uploadParseText, (req, res) => {
    console.log('Quick text succesfully uploaded', req.output);

    res.status(200).json({message : 'Upload success', status : 200, output : req.output});

})

trigger.post('/azure',upload.single("image_buffer"), getUploadImages, getImageItemUrl, generatingSanitizePrompts, producingJsonOutput, validateFormat, (req, res) => {
    res.status(200).json({message : "Done extracting text", code : 200, contents : req.jsonResult});
});



trigger.post('/mockazure', getUploadImages, getImageItemUrl, generatingSanitizePrompts, producingJsonOutput, validateFormat, (req, res) => {
    res.status(200).json({message : "Done extracting text", code : 200, contents : req.jsonResult});
});



trigger.get('/getModels', getAiModels, (req ,res) => {
    // console.log('Model list :: ', req.models);

    res.status(200).json({models : req.models});
} )


trigger.post('/postModel', saveAiModel);
trigger.get('/getUserModel', getUserModel);



// Middleware to Attach Mock Data
const attachMockData = async (req, res, next) => {
    try {
        // 1. Get a random template
        const mockTemplate = getRandomMock();
        
        // 2. Attach the ACTUAL uploaded image URL (if your getUploadImages middleware sets it)
        // Assuming req.contents contains the uploaded path/url from your existing middleware
        const uploadedImageUrl = req.contents && req.contents.length > 0 ? req.contents[0] : null;

        // 3. Create the object
        const demoData = {
            ...mockTemplate,
            metadata: {
                ...mockTemplate.metadata,
                datetime: new Date().toISOString(),
                image_source: uploadedImageUrl // Use the real image user uploaded
            }
        };

        req.jsonResult = demoData;
        next();
    } catch (error) {
        res.status(500).json({ message: "Mock generation failed" });
    }
};

// Middleware to Save to Demo DB
const saveDemoToDb = async (req, res, next) => {
    try {
        const newDemo = new DemoReceipt(req.jsonResult);
        const saved = await newDemo.save();
        req.savedId = saved._id; // Pass ID to frontend if needed
        next();
    } catch (error) {
        console.error("Demo Save Error", error);
        // We don't block response if save fails, just log it
        next();
    }
};

// THE MOCK ROUTE
trigger.post('/mockazure', 
    getUploadImages, // 1. Upload the file to your server/cloud
    attachMockData,  // 2. Generate the fake data
    saveDemoToDb,    // 3. Save to DB (Auto-deletes in 60s)
    (req, res) => {
        // Return exactly what your frontend expects
        res.status(200).json({
            message: "Done extracting text", 
            code: 200, 
            contents: req.jsonResult,
            demoId: req.savedId 
        });
    }
);


export default trigger;
