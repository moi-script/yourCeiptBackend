import path from 'path';
import { fileURLToPath } from 'url';

// 1. Get the directory of THIS file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Resolve the path relative to THIS file
// "From this file's folder, go up one (..), then into uploads"
const uploadDir = path.join(__dirname, '../../uploads'); 

export default uploadDir;