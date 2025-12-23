// server.js

import chalk from 'chalk';
import express from 'express';
import multer from 'multer';
import path, { dirname } from 'path';
import fs from 'fs';
const files = express.Router();
import uploadDir from '../../uploads/uploadDir.js';
// const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 'uploads/' is the folder name. Ensure this folder exists!
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

        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, Date.now() + '-' + file.originalname.replaceAll(" ", ""));// + '-' + uniqueSuffix + path.extname(file.originalname)
    }
});

// 1766464398436-Screenshot 2025-12-16 220838
// 1766464301325-Screenshot 2025-12-16 220838
// 1766464774997-Screenshot2025-12-16220838

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


// const UPLOADS_DIR = path.join( dirname, 'uploads');

// 2. Your custom Image Handler
export const imgHandler = (req, res) => {

    // console.log(chalk.green("Upload dir :: ", uploadDir));
    const filename = req.params.filename; // Gets "image.jpg" from the URL
    const filePath = path.join(uploadDir, filename);

    // Security Check: Prevent users from requesting files outside uploads folder
    if (!filePath.startsWith(uploadDir)) {
        return res.status(403).send('Access denied');
    }

    // Check if file actually exists
    if (fs.existsSync(filePath)) {
        // Serve the file (or do your custom logic here)
        // console.log('File existed');
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
};



files.get('/uploads/:filename', imgHandler);
// files.get('/test', (req, res) => {
//     console.log('Sending dummy ');

//     res.sendFile(path.join(uploadDir, 'myImage.png'));
// })

export default files;