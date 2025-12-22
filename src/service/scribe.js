import scribe from 'scribe.js-ocr';
import path from 'path';
import { getFileList } from '../parseImage/util.js';
import { parentPort } from 'node:worker_threads';

// import { getServerPort, getUrl } from '../middleware/source.js';
import { getUrl } from '../utils/getKey.js';
import chalk from 'chalk';


parentPort.on('message', async (msg) => {
    console.log('Message from the parent :: ', msg.status, msg.path);

    try {
        const res = await scribe.extractText([getUrl(msg)]);
        parentPort.postMessage({ worker: 'scribe', data: res });

    } catch (err) {
        console.error(chalk.red('Erorr in scribe worker ::' + err));
    }


})

// function searchFiles(source, target) { // we can use the value of original file list before cut

//     const originalFiles = getFileList(source);
//     const splittedFile = getFileList(target);

//     const fileMap = new Map();

//     originalFiles.forEach((item, i) => {
//         const pattern = new RegExp(path.parse(item).name, 'g');
//         fileMap.set(i, splittedFile.filter(files => files.match(pattern)));
//     })
//     return fileMap;
// }



// export async function getText(file) {
//     let body = '', index = 0;
//     const fileList = getFileList(file);

//     const task = Array.from({ length: fileList.length }, () => scribe.extractText);
//     for await (const t of task) {
//         const res = await t([`http://localhost:${getServerPort()}/getImg/${fileList[index]}`]);

//         console.log('Response --> ', res);
//         body += res;
//         index++;
//     }
//     console.log('Body --> ', body);
//     return body;
// }

