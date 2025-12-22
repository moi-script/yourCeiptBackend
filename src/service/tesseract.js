// import { createWorker } from 'tesseract.js';
import { parentPort } from 'node:worker_threads';
// import { getUrl } from '../source/urlSource.js';
// import { getUrl } from '../middleware/source.js';
import { getUrl } from '../utils/getKey.js';
import { createWorker } from 'tesseract.js';




parentPort.on('message', async (msg) => { 
    console.log('Message from the parent :: ', msg.status, msg.path);

    const worker = await createWorker('eng');
    const ret = await worker.recognize(getUrl(msg));
    await worker.terminate();

    parentPort.postMessage({worker : 'tesseract', data : ret.data.text});

})




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


