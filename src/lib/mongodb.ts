import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ddsequence';

async function dbConnect() {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB에 연결되었습니다');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB 연결 오류:', error);
    throw error;
  }
}

export default dbConnect; 