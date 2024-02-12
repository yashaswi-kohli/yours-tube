import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//* number of request we want to store
app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(cookieParser());

export { app };

//*     we will use :- use keyword, for eg
//*     app.use(cors())
//*     the use keyword is used for middleware
