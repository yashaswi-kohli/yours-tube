//* require('dotenv').config({path: './env'})    this is same as line 2 and 6
//? second thing we try to import dotenv first so that all environment variables can be distributed before someone calls it

import dotenv from "dotenv";
import connectDB from "./db/index.js";
// import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

//* this will return a promise so we will check on it
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

/* //? this is not a bad way, but we only want to clean the code so we will write the same thing in
?      in seperate db folder and the call the function will make the code clean that's it

...
.
.
.
.


import express from "express"
const app = express()

*coz the database is always in another environment, so it can take time that's why async
( async () => {
    try {
      * coz we want to wait for data to receieve
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

      ! to check whether the database get's connected to server or there is any error
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

      ? now out database is connected, we are just letting it know that our which port it works 
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/
