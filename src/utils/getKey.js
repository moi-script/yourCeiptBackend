import path, { dirname } from "path";
import { fileURLToPath } from 'url';
// import from '../../.env'
import chalk from "chalk";
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


// import uploadDir from "../../uploads/uploadDir";ls
// cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA5L3JtNTY3LXJtNTU5LWUtbW9ja3VwLWVsZW1lbnQtMDUuanBn

export const getUrl = (msg) => {
    console.log(chalk.red('Msg form source ::: ' + msg.path));

    return `http://localhost:${process.env.PORT}/uploads/${msg.path}.png`;
}

export const getServerPort = () => {
    return process.env.PORT;
}

export const getAiKey = () => {
    return process.env.AI_KEY;
}

export const filterDirlist = (pathUrl) => {
    return fs.readdirSync(pathUrl).filter((file) => path.parse(file).ext !== '.js');
}


export const clearFolder = async (pathUrl) => {
    try {
        const files =  fs.readdirSync(pathUrl);
        for (const file of files) {
            const fullPath = path.join(pathUrl, file);

            console.log('Full path :: ', fullPath);

             fs.unlinkSync(fullPath);
            console.log(`Deleted: ${file}`);
        }

        console.log(chalk.green('Deleted Successfully'));

    } catch (error) {
        console.error("Error clearing folder:", error);
    }
}

export const getTravilyKey = () => process.env.TRAVILY_KEY;


export const getCloudName = () => process.env.CLOUD_NAME;

export const getAzureUrl = () => process.env.AZURE_URL;

export const getAzureKey = () => process.env.AZURE_KEY1;



export const getEMAIL = () => process.env.EMAIL_USER;

export const getPASS = () => process.env.EMAIL_PASS;


export const getDefaultModel = () => process.env.DEFAULT_MODEL;


export const getGeminiKey =() => process.env.GEMINI_KEY;
// clearFolder(uploadDir);

// console.log(process.cwd())