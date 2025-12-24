import express from 'express';
import { createReceipt } from '../controllers/receiptController.js';

const receipt = express.Router();


receipt.post('/upload', createReceipt, (req, res) => {
    console.log("Uploaded")
    res.status(201).json({message : 'uploaded succesfully', status : 200});
})


export default receipt;