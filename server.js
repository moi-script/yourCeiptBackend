import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
// import multer from 'multer';
import  router  from './src/router/user.js';
import { connectDB } from './src/config/db.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : true}))
app.use(helmet());
// const upload = multer(); 

await connectDB();

app.use('/register', router);

app.listen(process.env.PORT, () => console.log('Server is running'));
