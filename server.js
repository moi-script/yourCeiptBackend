import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
// import multer from 'multer';
import  router  from './src/router/auth.js';
import { connectDB } from './src/config/db.js';
import 'dotenv/config';

const app = express();


app.use(cors({
  origin: 'http://localhost:3000/user', // Specific frontend URL
  credentials: true                // Allow cookies
}));

// does not working in cookies
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended : true}))
app.use(helmet());
// const upload = multer(); 

await connectDB();

app.use('/user', router);
// app.use('/test', router);



// app.post('/login', 
//     (req, res) => {
//         res.status(200).send('Hello world');
//         console.log('After sanitation :: ', req.body);

//     }
// )

app.listen(process.env.PORT, () => console.log('Server is running at port :: ' + process.env.PORT));
