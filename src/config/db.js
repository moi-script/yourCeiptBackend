import 'dotenv/config';
import path from 'path';
// dotenv.config({ path: path.resolve('../../env') });
import mongoose from 'mongoose';

// console.log(process.env.MONGO_URI);
export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log('Mongo connected. ', conn.connection.host);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

await connectDB();