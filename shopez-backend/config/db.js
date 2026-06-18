const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URI = "mongodb://mohitvarmaaa24:Password@ac-5mvj4jm-shard-00-00.s5pesbw.mongodb.net:27017,ac-5mvj4jm-shard-00-01.s5pesbw.mongodb.net:27017,ac-5mvj4jm-shard-00-02.s5pesbw.mongodb.net:27017/shopez?ssl=true&replicaSet=atlas-j6j0g7-shard-0&authSource=admin&appName=Cluster0";
    
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;