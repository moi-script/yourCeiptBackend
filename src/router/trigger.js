import express from 'express';
import multer from 'multer';
import { uploadParseText } from '../controllers/receiptController.js';
import { quickParseText } from '../controllers/batchController.js';
import { getAiModels, getUserModel, saveAiModel } from '../controllers/getAiModelsController.js';
import { attachProductImage, extractReceiptJson, getUploadImages, sendReceipt } from '../controllers/ocrController.js';

// Azure Read accepts up to 20 MB; the frontend downsizes photos well below that.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype) || file.mimetype === 'application/octet-stream'),
});

const trigger = express.Router();

trigger.post('/quickText', quickParseText, (req, res) => {
    res.status(200).json({ message: 'Upload success', status: 200, output: req.output, model: req.modelUsed, timings: req.timings });
});

trigger.post('/uploadQuick', uploadParseText, (req, res) => {
    res.status(200).json({ message: 'Upload success', status: 200, output: req.output });
});

trigger.post('/azure', upload.single("image_buffer"), getUploadImages, extractReceiptJson, attachProductImage, sendReceipt);

trigger.get('/getModels', getAiModels);
trigger.post('/postModel', saveAiModel);
trigger.get('/getUserModel', getUserModel);

export default trigger;
