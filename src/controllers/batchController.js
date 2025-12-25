import { readParrallelAi, readOcrResponseTask, runParallelOcrTask, readDescriptionAi } from "../service/runAi.js";
// import uploadDir from "../../uploads/uploadDir.js";
import uploadDir from "../utils/uploadDir.js";
// const uploadDir = '../../uploads/';

import { filterDirlist } from "../utils/getKey.js";
import { jsonToObjOutput } from "../utils/jsonHandler.js";
import chalk from "chalk";
import ora from 'ora';



const readDescriptionByAi = async (spinner, data) => {
    spinner.color = 'red';
    spinner.text = 'Analyzing text with AI...';
    return await readDescriptionAi(data);
}


export async function extractText(req, res, next) {
    const spinner = ora('Scanning document...').start();
    spinner.color = 'blue';

    const resObject = await runParallelOcrTask(uploadDir);
    spinner.color = 'red';
    spinner.text = 'Analyzing text with AI...';

    const dataOutput = await readParrallelAi(await readOcrResponseTask(resObject));

    spinner.color = 'yellow';
    spinner.text = 'Finalizing object';
    const toObjectParse = jsonToObjOutput(dataOutput);
    req.extractedText = toObjectParse;
    spinner.color = 'green';
    spinner.succeed('Text extracted');

    next();
}




// export async function extractText(req, res, next) {
//     const spinner = ora('Scanning document...').start();
//     spinner.color = 'blue';

//     const resObject = await runParallelOcrTask(uploadDir);

//     const dataOutput = await readOcrResponseTask(resObject);

//     const struct = await readByAi(spinner, dataOutput);

//     spinner.color = 'yellow';
//     spinner.text = 'Finalizing object';
//     const toObjectParse = jsonToObjOutput(struct);
//     req.extractedText = toObjectParse;
//     spinner.color = 'green';
//     spinner.succeed('Text extracted');
//     next();
// }


const maxRetry = 5;
let tries = 0;


function delay() {
    return new Promise((acc, rej) => setTimeout(() => acc({test : 'Done'}), 3000));
}


export async function quickParseText(req, res, next) {
    console.log('Req body :: ', req.body);
    const { quickText } = req.body;

    if (quickText) {
        try {
            const spinner = ora('Scanning text description').start();


            const struct = await readDescriptionByAi(spinner, quickText);

            if (tries < maxRetry) throw Error('Null result');
            else {
                spinner.color = 'green';
                spinner.succeed('Text extracted');
                spinner.clear();
                next();
            }

            // req.output = jsonToObjOutput(struct);

        } catch (err) {
            console.error('Failed read quick text', err);
            tries++;

            const spinner = ora("Retrying...").start();
            spinner.color = "red";
            spinner.text = "Retrying";
            spinner.clear();

            await delay();
            quickParseText(req, res, next);

            // spinner.color = "green";
            // spinner.succeed('Parsed succedded');
        }
    } else {
        console.error('No Quick text contents');
    }
}

