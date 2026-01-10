import { OpenRouter } from "@openrouter/sdk";
import fs from 'fs';
import { createWriteStream } from "fs";
import path from "path";
import { runParallelWorkers } from "../middleware/workers.js";
import { jsonToObjOutput, allInputPrompts, aiPrompt, quickPrompt, filterItemsAiPrompt, reducedTextPromptTavily, findImagesWithTavily } from "../utils/jsonHandler.js";
import { getAiKey, filterDirlist } from "../utils/getKey.js";
import chalk from "chalk";



// flow
// runParallelOcrTask -> readOcrResponseTask ->  readParrallelAi -> output





const AI_KEY = getAiKey();
const aiOutput = createWriteStream('./outputAI.txt');


export function readTextAi(prompts, req, activeModelName = "kwaipilot/kat-coder-pro:free") {

    console.log(chalk.blue("Using Model ---> " + activeModelName));

    let body = '';
    return async function () {

        const openrouter = new OpenRouter({
            apiKey: AI_KEY
        });

        // nvidia/nemotron-3-nano-30b-a3b:free
        // xiaomi/mimo-v2-flash:free
        const stream = await openrouter.chat.send({
            model:  activeModelName,
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


// initialize a parallel worker for both scribe and tesseract
function workerParallelProcessList(source) {
    const fileList = filterDirlist(source);
    // console.log('File list --> ', fileList);

    return Array.from({ length: fileList.length }, (_, i) => runParallelWorkers(path.parse(fileList[i]).name))
}

// run both different worker  
// const responseObject = await runParallelOcrTask(uploadDir) // turn on later
export async function runParallelOcrTask(source) {
    return await Promise.all(workerParallelProcessList(source))
}

// get the text from worker that was parse using OCR alg
// console.log(chalk.blue('Processing file list --> ',typeof filterDirlist(uploadDir)));




// integrate ai prompts from parsed text from workers 
// console.log('Response Object ::: ', responseObject);
// const iterablePromptList = await readOcrResponseTask(responseObject); // turn on later

export async function readOcrResponseTask(response) {
        let promptList = [];
        for(let i = 0; i < response.length; i++){
           const { scribe, tesseract } = response[i];
           const imageTerm = await readTextAi(reducedTextPromptTavily(scribe.data))();
           const imageSearchQuery = await findImagesWithTavily(imageTerm);
           console.log('Image seach query --> ', imageSearchQuery);
           promptList.push(aiPrompt(scribe.data, tesseract.data, (imageSearchQuery?.images || imageSearchQuery)))
        }       
        return promptList;
}



export async function descriptionWithPrompt(description) {
    const imageQuery = await findImagesWithTavily(description);
    console.log('Image query ::', imageQuery);
    const prompt =  await quickPrompt(description, (imageQuery || null));

    console.log(chalk.blue('Prompt --> ', prompt));
    return prompt;
}

export async function readDescriptionAi(prompt, activeModelName) {
    const readingText = readTextAi(await descriptionWithPrompt(prompt), null, activeModelName);
    return await readingText();
}
// get the iterable promp list with a parse text 




// const iterablePromptList = await readOcrResponseTask(responseObject); // turn on later
export async function readParrallelAi(iterablePrompts) {
    let taskList = [];

    for(let i = 0; i < iterablePrompts.length; i++){
        // console.log(readTextAi(await iterablePrompts[i]));
        taskList.push(readTextAi(await iterablePrompts[i])());
    }
    return await Promise.all(taskList);
}
