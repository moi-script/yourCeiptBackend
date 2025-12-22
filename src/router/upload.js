// server.js

import chalk from 'chalk';
import express from 'express';
import multer from 'multer';
import path, { dirname} from 'path';
import fs from 'fs';
const files = express.Router();
import uploadDir from '../../uploads/uploadDir.js';
// const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 'uploads/' is the folder name. Ensure this folder exists!
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {

        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + path.parse(file.originalname).ext); // + '-' + uniqueSuffix + path.extname(file.originalname)
    }
});

const upload = multer({ storage: storage });

files.post('/upload', upload.single('myImage'), (req, res) => {
    console.log('Handling uploads');
    try {

        console.log(req.file);

        res.send(`File uploaded successfully! Path: ${req.file.path}`);
    } catch (error) {
        res.status(400).send('Error uploading file');
    }
});


// const UPLOADS_DIR = path.join( dirname, 'uploads');

// 2. Your custom Image Handler
export const imgHandler = (req, res) => {

    console.log(chalk.green("Upload dir :: ", uploadDir));
    const filename = req.params.filename; // Gets "image.jpg" from the URL
    const filePath = path.join(uploadDir, filename);

    // Security Check: Prevent users from requesting files outside uploads folder
    if (!filePath.startsWith(uploadDir)) {
        return res.status(403).send('Access denied');
    }

    // Check if file actually exists
    if (fs.existsSync(filePath)) {
        // Serve the file (or do your custom logic here)
        console.log('File existed');
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
};

// 3. The Route Definition
// This replaces your entire loop. It matches /uploads/ANYTHING



files.get('/uploads/:filename', imgHandler);
// files.get('/test', (req, res) => {
//     console.log('Sending dummy ');

//     res.sendFile(path.join(uploadDir, 'myImage.png'));
// })

export default files;