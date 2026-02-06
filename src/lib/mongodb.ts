import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ddsequence';

const isLocalEnv = !process.env.VERCEL && 
                   (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV);

if (isLocalEnv && typeof dns.setServers === 'function') {
  try {
    const googleDNS = ['8.8.8.8', '8.8.4.4'];
    const cloudflareDNS = ['1.1.1.1', '1.0.0.1'];
    dns.setServers([...googleDNS, ...cloudflareDNS]);
  } catch (error) {
    console.warn('DNS 서버 설정 실패:', error);
  }
}

const mongooseOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  w: 'majority',
  directConnection: false,
  family: 4,
};

async function dbConnect() {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
      }
      
      if (mongoose.connection.readyState === 2) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('연결 타임아웃'));
          }, 30000);
          
          mongoose.connection.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          mongoose.connection.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
        return mongoose.connection;
      }
      
      await mongoose.connect(MONGODB_URI, mongooseOptions);
      console.log('MongoDB에 연결되었습니다');
      return mongoose.connection;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`MongoDB 연결 시도 ${attempt}/${maxRetries} 실패:`, lastError.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('MongoDB 연결 실패');
}

export default dbConnect; 