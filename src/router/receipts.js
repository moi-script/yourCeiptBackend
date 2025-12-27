import express from 'express';
import { createReceipt } from '../controllers/receiptController.js';
import { createManual } from '../controllers/manualController.js';
import { deleteReceiptsMiddleware } from '../middleware/delete.js';
import { clearFolder } from '../utils/getKey.js';
import uploadDir from '../utils/uploadDir.js';
const receipt = express.Router();


receipt.post('/upload', createReceipt, (req, res) => {
    console.log("Uploaded");
    clearFolder(uploadDir);
    res.status(201).json({message : 'uploaded succesfully', status : 200});
})

receipt.post('/uploadManual', createManual, (req, res) => {
    console.log('Uploaded');    
    res.status(201).json({message : 'uploaded succesfully', status : 200});
})

// receipt -> http://localhost:3000/receipt/delete?id=id123&type=smart
receipt.delete('/delete', deleteReceiptsMiddleware);


export default receipt;