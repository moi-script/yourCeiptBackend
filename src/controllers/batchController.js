import {  readDescriptionAi } from "../service/runAi.js"; // runParallelOcrTask readOcrResponseTask, readParrallelAi 
import uploadDir from "../utils/uploadDir.js";
import { jsonToObjOutput } from "../utils/jsonHandler.js";
import ora from 'ora';
import { getDefaultModel } from "../utils/getKey.js";

const readDescriptionByAi = async (spinner, data, activeModelName = getDefaultModel()) => {
    spinner.color = 'red';
    spinner.text = 'Analyzing text with AI...';
    const result = await readDescriptionAi(data, activeModelName);
    spinner.clear();
    return result;
}

// needs to fix the repitiion and just return pure json object form ai
export async function quickParseText(req, res, next) {
    // console.log('Req body :: ', req.body);
    const { quickText, activeModelName } = req.body;

    if (quickText) {
        const spinner = ora('Scanning text description').start();
        const attempts = async () => {
            try {
                const struct = await readDescriptionByAi(spinner, quickText, activeModelName);
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

