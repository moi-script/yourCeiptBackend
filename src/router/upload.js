// server.js

import chalk from 'chalk';
import express from 'express';
import multer from 'multer';
import path, { dirname } from 'path';
import fs from 'fs';
const files = express.Router();
import uploadDir from '../utils/uploadDir.js';
import { clearFolder } from '../utils/getKey.js';
import { deleteCloudImage, uploadCloudImage } from '../controllers/cloudinaryController.js';




const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    limits: { fileSize: 2000000 },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image file (jpg, jpeg, or png)'));
        }

        cb(undefined, true);
    },

    filename: (req, file, cb) => {
        const newFile = Date.now() + '-' + file.originalname.replaceAll(" ", "");
        
        // change the file extension to .png
        cb(null, newFile.replaceAll(new RegExp(path.parse(newFile).ext, "g"), ".png")); 
    }
});


const upload = multer({ storage: storage });

files.post('/upload', upload.array('myImages'), (req, res) => {
    console.log('Handling uploads');
    try {

        console.log(req.files);
        
        const filePath = req.files.map(file => file.path);
        res.send(`File uploaded successfully! Path: ${filePath}`);
    } catch (error) {
        res.status(400).send('Error uploading file');
    }
});

export const imgHandler = (req, res) => {

    const filename = req.params.filename; // Gets "image.jpg" from the URL
    const filePath = path.join(uploadDir, filename);

    if (!filePath.startsWith(uploadDir)) {
        return res.status(403).send('Access denied');
    }

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
};

files.get('/uploads/:filename', imgHandler);

files.get('/clearUploads', (req, res) => {
    clearFolder(uploadDir);
    res.status(200).json({message : "Deleted Successfuly", code : 200})
})

files.delete('/image', deleteCloudImage, async (req, res) => {
        res.status(200).json({ message: "Deleted successfully", result : req.result });
});




files.post('/image', upload.single('image'), uploadCloudImage, (req, res) => {
    res.json({ url: req.secure_url, public_url : req.public_url });
})




export default files;