import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

//*     we will use :- use keyword, for eg
//*     app.use(cors())
//*     the use keyword is used for middleware

app.use(
  cors({
    //* this is telling that from this domain only our backend should respond
    origin: process.env.CORS_ORIGIN,

    //*
    credentials: true,
  })
);

//* Controls the maximum request body size. If this is a number, then the value specifies the number of bytes; if it is a string, the value is passed to the bytes library for parsing
app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//* we want to use some files so to store we use that and say that save in public foler
app.use(express.static("public"));

//* we want to basically have access to perform CRUD operation on cookies of user browser from server
app.use(cookieParser());


//Todo  -------------------------------------------------------------------------------------------


//! now we will do routing
//? import route
import userRouter from "./routes/user.routes.js";

//? routing
app.use("/users", userRouter)
//* the url path will look like http://localhost:8000/users/register

export { app };
