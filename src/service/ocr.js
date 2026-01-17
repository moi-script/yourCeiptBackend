// --- 1. FIXED IMPORTS ---
// We import the entire module as 'AzureVision' to handle the compatibility issue
import AzureVision from '@azure-rest/ai-vision-image-analysis';
import fs from 'fs';
import chalk from "chalk";
import dotenv from "dotenv";
import ora from 'ora';
dotenv.config();
import path, { dirname } from "path";
import { fileURLToPath } from 'url';
import uploadDir from '../utils/uploadDir.js';
import { clearFolder, getAzureKey, getAzureUrl } from '../utils/getKey.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createClient = AzureVision.default;
const isUnexpected = AzureVision.isUnexpected;

const endpoint =  getAzureUrl();
const key = getAzureKey();

const credential = { key: key };
const client = createClient(endpoint, credential);

// const localPath = __dirname + '/long.jpg';
// console.log('Local path :; ', localPath);
// const buff = fs.readFileSync(localPath);


// handle multiple files and combined into single arrays
export const processImages = async (buffer) => {

    // const { img } = req.body;
    let contents = [];
    console.log('Img buffer --> ', buffer);
    const fileList = fs.readdirSync(uploadDir);
    console.log('File list ::', fileList);
    
    const scanLocalImage = async (contents, file) => {
        console.log("Reading local file...");

        const imageBuffer = buffer ?? fs.readFileSync(path.join(uploadDir, file));
        console.log('path local :: ', path.join(uploadDir, file));
        console.log('Buffer result ::' +  Buffer.from(imageBuffer));
        console.log("Uploading to Azure...");

        const result = await client.path('/imageanalysis:analyze').post({
            body: new Uint8Array(imageBuffer),
            queryParameters: {
                features: ['read'],
                language: 'en'
            },
            contentType: 'application/octet-stream'
        });
        console.log('eror here');

        if (isUnexpected(result)) {
            console.error("Error:", result.body.error);
            return;
        }

        const readResult = result.body.readResult;

        if (readResult && readResult.blocks.length > 0) {
            console.log("\n--- TEXT FROM LOCAL FILE ---");
            readResult.blocks.forEach(block => {
                block.lines.forEach(line => {
                    console.log("Line for text --> ", line.text);

                    contents.push(line.text);
                });
            });
        } else {
            console.log("No text found.");
        }
    }

    if (!(fileList.length > 0)) {
        throw new Error('Does not have local file exist');
    }

    // const spinner = ora('Scanning Documents').start();
    // spinner.color = 'blue';

    for (let i = 0; i < fileList.length; i++) {
            console.log('Top this ::', i);

        try {

            await scanLocalImage(contents, fileList[i]);
            console.log('Process this ::', i);
        } catch (err) {
            console.error('Unable to scan image :: ', err);
        }
    }

    // spinner.color = 'green';
    // spinner.succeed("Done extracting text");

    console.log('Contents -> processImages ', contents);
    clearFolder(uploadDir);
    return contents;
}



// const scanLocalImage = async (file) => {
//     console.log("Reading local file...");

//     const imageBuffer = fs.readFileSync(path.join(__dirname, file));

//     console.log("Uploading to Azure...");

//     const result = await client.path('/imageanalysis:analyze').post({
//         body: imageBuffer,
//         queryParameters: {
//             features: ['read'],
//             language: 'en'
//         },
//         contentType: 'application/octet-stream'
//     });

//     if (isUnexpected(result)) {
//         console.error("Error:", result.body.error);
//         return;
//     }

//     const readResult = result.body.readResult;

//     if (readResult && readResult.blocks.length > 0) {
//         console.log("\n--- TEXT FROM LOCAL FILE ---");
//         readResult.blocks.forEach(block => {
//             block.lines.forEach(line => {
//                 console.log(line.text);

//             });
//         });
//     } else {
//         console.log("No text found.");
//     }
// }

// scanLocalImage();