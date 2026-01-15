
// packages
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import trigger from './src/router/trigger.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// routes
import  router  from './src/router/auth.js';
import files from './src/router/upload.js';
import receipt from './src/router/receipts.js';
import budget from './src/router/budget.js';
import notification from './src/router/notification.js';

// path

import uploadDir from './src/utils/uploadDir.js';

// db
import { connectDB } from './src/config/db.js';
import chalk from 'chalk';
import { clearFolder } from './src/utils/getKey.js';


// import mongoSanitize from 'express-mongo-sanitize';
const app = express();
dotenv.config({ quiet: true });

app.use(cors({
  origin: ['http://localhost:5173', "https://recepta-phi.vercel.app"], // Specific frontend URL
  credentials: true                // Allow cookies
}));

// app.use(cors());

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended : true}))
app.use(helmet());
app.use(cookieParser());
// app.use(mongoSanitize())
// const upload = multer(); 

await connectDB();

// for user auth or validation
app.use('/user', router);

// accepts uploading data input
app.use('/', files);

// processing text extraction features
app.use('/extract', trigger);
app.use('/receipt', receipt);
// receipt/upload

// budget route
app.use('/', budget);


app.use('/notification', notification);


app.get('/user/register', (req, res) => {
  console.log("Cookie exist :: ", req.cookies);

  res.status(200).json({message : req.cookies.jwt, status : 200});
})

// app.post('/login', 
//     (req, res) => {
//         res.status(200).send('Hello world');
//         console.log('After sanitation :: ', req.body);

//     }
// )





app.listen(process.env.PORT, () => console.log('Server is running at port :: ' + process.env.PORT));


process.on('SIGINT', async () => {
  console.log(chalk.red("Closing the server down"));
  console.log(chalk.red('Clearing uploads memory '));
  clearFolder(uploadDir);
  process.exit(0);
})