import dotenv from 'dotenv';
import path from 'node:path';

// Check both local cwd and monorepo root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import mongoose from 'mongoose';
import app from './app';
import { setMongoEnabled } from './store';

const port=Number(process.env.PORT||5000);
async function start(){
  if(process.env.MONGODB_URI){
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      setMongoEnabled(true);
      console.log('MongoDB Atlas connection established.');
    } catch (error) {
      console.warn('MongoDB Atlas connection failed; falling back to in-memory demo storage.');
      console.warn('To fix Atlas connection: In MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access from Anywhere (0.0.0.0/0).');
      setMongoEnabled(false);
    }
  } else {
    console.warn('MONGODB_URI is not configured: using in-memory demo storage. Data will not persist after restart.');
  }
  app.listen(port,'0.0.0.0',()=>console.log(`OutsideFix API listening on ${port}`));
}
start().catch(error=>{console.error('Server startup failed:',error);process.exit(1);});

