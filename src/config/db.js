import 'dotenv/config';
import chalk from 'chalk';
import mongoose from 'mongoose';
import config from './config.js';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.db.uri);
        // console.log('URI used :: ', config.db.uri);
        console.log(chalk.green('Mongo connected. ' + conn.connection.host));
        return true;
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

// await connectDB();