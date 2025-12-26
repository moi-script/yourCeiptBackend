import { OpenRouter } from "@openrouter/sdk";
import fs from 'fs';
import { createWriteStream } from "fs";
import path from "path";
// import { runParallelWorkers } from "../parseImage/main.js";
import { runParallelWorkers } from "../middleware/workers.js";
// import { jsonToObjOutput } from "./jsonHandler.js";
// import { allInputPrompts, aiPrompt } from "./aiPrompts.js";
import { jsonToObjOutput, allInputPrompts, aiPrompt } from "../utils/jsonHandler.js";
import { getAiKey, filterDirlist } from "../utils/getKey.js";
import chalk from "chalk";


// get ai key env
const AI_KEY = getAiKey();
// test output txt for ai response 
const aiOutput = createWriteStream('./outputAI.txt');


function readTextAi(prompts) {
    let body = '';
    return async function () {

        const openrouter = new OpenRouter({
            apiKey: AI_KEY
        });

        const stream = await openrouter.chat.send({
            model: "xiaomi/mimo-v2-flash:free",
            user: 'test',
            messages: [
                {
                    "role": "user",
                    "content": prompts
                }
            ],

            stream: true
        });
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                aiOutput.write(content);
                body += content.toString();
                // process.stdout.write(content);
                // return jsonToObjOutput(content);
            }
        }
        return body;
    }
}

// console.log('Ai ::',  await readTextAi('Hello how are you?')());

// initialize a parallel worker for both scribe and tesseract
function workerParallelProcessList(source) {
    const fileList = filterDirlist(source);
    // console.log('File list --> ', fileList);

    return Array.from({ length: fileList.length }, (_, i) => runParallelWorkers(path.parse(fileList[i]).name))
}

// run both different worker  
export async function runParallelOcrTask(source) {
    return await Promise.all(workerParallelProcessList(source))
}

// get the text from worker that was parse using OCR alg
// console.log(chalk.blue('Processing file list --> ',typeof filterDirlist(uploadDir)));
// const responseObject = await runParallelOcrTask(uploadDir) // turn on later



// console.log('Response Object ::: ', responseObject);

// integrate ai prompts from parsed text from workers 
export function readOcrResponseTask(response) {
    return new Promise((acc, rej) => {
        const prompList = Array.from({ length: response.length }, (_, i) => {
            const { scribe, tesseract } = response[i];
            return aiPrompt(scribe.data, tesseract.data);
        })
        acc(prompList); 
    })
}


export function descriptionWithPrompt(description) {
    const prompt =  aiPrompt(description);
    console.log(chalk.blue('Prompt --> ', prompt));
    return prompt;
}

export async function readDescriptionAi(prompt) {
    const readingText = readTextAi(descriptionWithPrompt(prompt));
    return await readingText();
}
// get the iterable promp list with a parse text 
// const iterablePromptList = await readOcrResponseTask(responseObject); // turn on later





export async function readParrallelAi(iterablePrompts) {
    const aiTask = Array.from(({ length: iterablePrompts.length }), (_, i) => {
        const initAiTask = readTextAi(iterablePrompts[i]);
        return initAiTask();
    });
    return await Promise.all(aiTask);
}


// compute time taken -> for performance test; // turn on later
// await time('Time taken -', async () => {
//     const dataOutput = await readParrallelAi(await readOcrResponseTask(responseObject)) 
//     console.log("Data result  :: ", jsonToObjOutput(dataOutput));

//     process.exit(1);

// })








// accepts multiple files sequentially 
// async function runAiTask() {
//     const source = '../cut';
//     for await (const worker of workerAsyncIterable(source)) {
//         const { scribe, tesseract } = worker;
//         const prompts = aiPrompt(scribe, tesseract);
//         await readTextAi(prompts); // needs to adjust this
//     }
//     process.exit(1);
// }



