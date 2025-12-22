import path, { dirname} from "path";
import { fileURLToPath } from 'url';
// import from '../../.env'
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });



export const getUrl = (msg) => {
    console.log(chalk.red('Msg form source ::: ' + msg.path));
    return  `http://localhost:${process.env.SERVER_PORT}/getImg/${msg.path}.png`; 
}

export const getServerPort = () => {
    return process.env.SERVER_PORT;
}

export const getAiKey = () => {
    return process.env.AI_KEY;
}



