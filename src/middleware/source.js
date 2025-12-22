import chalk from "chalk";
import dotenv from "dotenv";
import path, { dirname} from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const getUrl = (msg) => {
    console.log(chalk.red('Msg form source ::: ' + msg.path));
    return  `http://localhost:${process.env.PORT}/getImg/${msg.path}.png`; 
}

export const getServerPort = () => {
    return process.env.PORT;
}


