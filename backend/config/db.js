const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/razorpaykyc';
const atlasUri = process.env.MONGODB_URI;
const uri = atlasUri || DEFAULT_LOCAL_URI;

if (!atlasUri) {
  console.warn('⚠️ MONGODB_URI is not set. Falling back to local MongoDB:', DEFAULT_LOCAL_URI);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (atlasUri && atlasUri.startsWith('mongodb+srv://')) {
      console.warn('⚠️ Atlas SRV failed. Trying local MongoDB fallback...');
      try {
        const conn = await mongoose.connect(DEFAULT_LOCAL_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        console.log(`✅ Fallback MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`❌ Local MongoDB fallback failed: ${fallbackError.message}`);
      }
    }

    process.exit(1);
  }
};

module.exports = connectDB;