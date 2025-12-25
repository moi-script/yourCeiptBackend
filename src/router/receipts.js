import express from 'express';
import { createReceipt } from '../controllers/receiptController.js';
import { createManual } from '../controllers/manualController.js';
const receipt = express.Router();


receipt.post('/upload', createReceipt, (req, res) => {
    console.log("Uploaded")
    res.status(201).json({message : 'uploaded succesfully', status : 200});
})

receipt.post('/uploadManual', createManual, (req, res) => {
    console.log('Uploaded');    
    res.status(201).json({message : 'uploaded succesfully', status : 200});
})




export default receipt;