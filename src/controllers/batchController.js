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
    const result = await readDescriptionAi(data);
    spinner.clear();
    return result;
}


export async function extractText(req, res, next) {
    const spinner = ora('Scanning document...').start();
    spinner.color = 'blue';

    const resObject = await runParallelOcrTask(uploadDir);
    spinner.color = 'red';
    spinner.text = 'Analyzing text with AI...';

    const attempts = async () => {
        try {
            const dataOutput = await readParrallelAi(await readOcrResponseTask(resObject));
            console.log('to json --> ', dataOutput, ' type ', typeof dataOutput);

            if (!dataOutput ||  (Array.isArray(dataOutput) && dataOutput.length === 0)){
                // console.log('!dataOutput :', !dataOutput);
                // console.log('!jsonToObjOutput :', !(typeof jsonToObjOutput(dataOutput)));
                // console.log('!dataOutput?.length :', dataOutput?.length < 1);

                 throw Error('Null value');
            }

            try {
                spinner.color = 'yellow';
                spinner.text = 'Finalizing object';
                // console.log('to json --> ', dataOutput, ' type ', typeof dataOutput);
                const toObjectParse = jsonToObjOutput(dataOutput);
                req.extractedText = toObjectParse;
                spinner.color = 'green';
                spinner.succeed('Text extracted');

                next();
            } catch (err) {
                console.error('Failed json conversion');
                attempts();
            }

        } catch (err) {
            console.error(err);
            attempts();
        }
    }
    attempts();





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



export async function quickParseText(req, res, next) {
    console.log('Req body :: ', req.body);
    const { quickText } = req.body;

    if (quickText) {
        const spinner = ora('Scanning text description').start();
        const attempts = async () => {
            try {
                const struct = await readDescriptionByAi(spinner, quickText);
                if (!struct || !(typeof jsonToObjOutput(struct))) throw Error('Null result');
                else {
                    spinner.color = 'green';
                    spinner.succeed('Text extracted');

                    try {
                        req.output = jsonToObjOutput(struct);
                        next();

                    } catch (err) {
                        console.log('Error json conversion');
                        attempts();
                    }
                }
            } catch (err) {
                console.error('Failed read quick text', err);
                attempts();
            }
        }
        attempts();

    } else {
        console.error('No Quick text contents');
    }
}

