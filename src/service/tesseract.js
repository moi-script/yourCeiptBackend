// import { createWorker } from 'tesseract.js';
import { parentPort } from 'node:worker_threads';
// import { getUrl } from '../source/urlSource.js';
// import { getUrl } from '../middleware/source.js';
import { getUrl } from '../utils/getKey.js';
import { createWorker } from 'tesseract.js';
import chalk from 'chalk';


parentPort.on('message', async (msg) => {

    // const worker = await createWorker('eng');

    const worker = await createWorker('eng', 1, {
        logger: m => { } // Empty function silences the progress logs
    });

    await worker.setParameters({
        tessedit_pageseg_mode: '3',
    });
    try {
        
    const ret = await worker.recognize(getUrl(msg));
    await worker.terminate();

    parentPort.postMessage({ worker: 'tesseract', data: ret.data.text });
    } catch(err){
        console.log(chalk.red("Tesseract terminated"));
        process.exit(1);
    }

})



//  async function getTextByTesseract() {
//     const worker = await createWorker('eng');
//     const ret = await worker.recognize(`http://localhost:3000/uploads/waltermart.png`);
//     await worker.terminate();
//     return ret.data.text;
// }

// console.log('Tesseract result :: ', await getTextByTesseract());



// export async function runOCR() {
//   const worker = await createWorker('eng');

//   const result = await worker.recognize('http://localhost:3000/getImg/grocery.png');

//   console.log(result.data.text);        // Extracted text
//   console.log(result.data.confidence);  // Page confidence
//   console.log(result.data.words);       // Each word + confidence
//   await worker.terminate();

//   return {output :  result.data.text, confidence : result.data.confidence}
// }


// export async function getTextByTesseract() {
//     const worker = await createWorker('eng');
//     const ret = await worker.recognize('http://localhost:5000/getImg/grocery.png');
//     await worker.terminate();
//     return ret.data.text;
// }


