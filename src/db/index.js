import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

//* this is our async function we have made to connect with out database
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

//* we have export so that out main file(index.js) will call whenever we want
export default connectDB;
