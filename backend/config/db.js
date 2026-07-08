const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;
  if (!uri || !dbName) {
    throw new Error('MONGO_URL and DB_NAME must be set in environment');
  }
  await mongoose.connect(uri, { dbName });
  console.log(`[db] connected to ${dbName}`);
};

module.exports = connectDB;
