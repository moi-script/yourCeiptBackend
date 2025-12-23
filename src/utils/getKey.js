import path, { dirname} from "path";
import { fileURLToPath } from 'url';
// import from '../../.env'
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


export const getUrl = (msg) => {
    // console.log(chalk.red('Msg form source ::: ' + msg.path));
    return  `http://localhost:${process.env.PORT}/uploads/${msg.path}.png`; 
}

export const getServerPort = () => {
    return process.env.PORT;
}

export const getAiKey = () => {
    return process.env.AI_KEY;
}

export const filterDirlist = (filelist) => {
    return fs.readdirSync(filelist).filter((file) => path.parse(file).ext !== '.js');
}



