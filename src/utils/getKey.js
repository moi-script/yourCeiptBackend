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



export const getUrl = (msg) => {
    // console.log(chalk.red('Msg form source ::: ' + msg.path));
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


// clearFolder(uploadDir);

// console.log(process.cwd())