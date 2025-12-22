import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import  router  from './src/router/auth.js';
import files from './src/router/upload.js';
import { connectDB } from './src/config/db.js';
import chalk from 'chalk';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
const app = express();


app.use(cors({
  origin: 'http://localhost:5173', // Specific frontend URL
  credentials: true                // Allow cookies
}));

// app.use(cors());


app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended : true}))
app.use(helmet());
app.use(cookieParser());
// const upload = multer(); 

await connectDB();

app.use('/user', router);
app.use('/', files);


// // import { imgHandler } from './src/router/upload.js';
// app.use('/', imgHandler, (req, res) => {
//   console.log('Done');
// })



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
