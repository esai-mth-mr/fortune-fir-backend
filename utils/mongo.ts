import mongoose from 'mongoose';

const connectionString = process.env.MONGO_URI as string;

if (!connectionString) {
  throw new Error('MONGO_URI environment variable not set');
}

const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1); // Exit the process with failure
  }
};

export default connectToDatabase;
