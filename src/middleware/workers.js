import { Worker } from 'node:worker_threads';
import path from "node:path";
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// "../worker/scribe.js"

function extractByScribe(url) {
    return new Promise((acc, res) => {
        const workerPath = path.resolve(__dirname, '../worker/tesseract.js')
        const scibe = new Worker(workerPath);
        
        scibe.on('message', msg => {
            console.log('Msg -> ', msg);  // goal -> knowing the accuracy of output 
        }) 
        scibe.on('error', err => console.error(err))
        scibe.postMessage({status : 'Scribe is starting', path : url});
    })
}



function promiseWorker(result, filePath, urlPath) {
    return new Promise((acc, rej) => {
        const workerPath = path.resolve(__dirname, filePath);

        const worker = new Worker(workerPath);
        worker.on('message', message => {
            if (message.worker === 'tesseract') {
                result.tesseract.data = message.data;
                result.tesseract.isDone = true;
            } else {
                result.scribe.data = message.data;
                result.scribe.isDone = true;
            }

            worker.terminate();
            acc(true);

        })
        worker.on("error", (err) => {
            worker.terminate();
            console.error("Worker error:", err);
            rej(err);

        });

        worker.on('exit', code =>{
            // if(code !== 0 && (result.scribe.isDone === result.tesseract.isDone)) {
            //     console.error(`Crashed :: ${urlPath} code - ${code}`);
            // } 
            if(code === 0) {
                console.log('Finish normally');
            }
        }) 
        
        worker.postMessage({ status: 'Starting the ' + filePath, path: urlPath });

    })
}

function initWorkers(result, workerIndex, pathUrl) {
    return Array.from({ length: workerIndex.length }, (_, i) => promiseWorker(result, workerIndex[i], pathUrl))
}

export async function runParallelWorkers(pathUrl) {
    const workerIndex = ['../service/scribe.js', '../service/tesseract.js'];
    let result = { scribe: { data: null, isDone: false }, tesseract: { data: null, isDone: false } }

    return new Promise((acc, rej) => {
        Promise.all(initWorkers(result, workerIndex, pathUrl))
            .then(res => {
                // console.log('Done?? for workers');
                // if (result.scribe.isDone && result.tesseract.isDone) {
                //     console.log('Both is done');

                // }
                if(res) {
                acc(result);
                }
            }).catch(err => rej(err));
    })

}
