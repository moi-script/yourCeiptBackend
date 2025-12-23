import { readParrallelAi, readOcrResponseTask, runParallelOcrTask} from "../service/runAi.js";
import uploadDir from "../../uploads/uploadDir.js";
import { filterDirlist } from "../utils/getKey.js";
import { jsonToObjOutput } from "../utils/jsonHandler.js";
import chalk from "chalk";
import ora from 'ora';


export async function extractText(req, res, next) {
   const spinner = ora('Scanning document...').start();
   spinner.color = 'blue';

    const resObject =await runParallelOcrTask(uploadDir);
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


