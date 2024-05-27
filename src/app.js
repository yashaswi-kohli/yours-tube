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

//* First thing it tells use to accept json. 
app.use(express.json({ limit: "16kb" }));
//? Controls the maximum request body size. If this is a number, then the value specifies the number of bytes; if it is a string, the value is passed to the bytes library for parsing

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//* we want to use some files so to store we use that and say that save in public foler
app.use(express.static("public"));

//* we want to basically have access to perform CRUD operation on cookies of user browser from server
app.use(cookieParser());


//? import route
import userRouter from "./routes/user.routes.js";
import videoRoutes from "./routes/video.route.js";
import tweetRoutes from "./routes/tweet.route.js";
import subscriptionRoutes from "./routes/subscription.route.js";
import commentRoutes from "./routes/comment.route.js";
import likeRoutes from "./routes/like.route.js";
import playListRoutes from "./routes/playlist.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";

// User routes:
app.use("/api/v1/users", userRoutes);
//* the url path will look like http://localhost:8000/users/register

app.use("/api/v1/video", videoRoutes);
app.use("/api/v1/tweet", tweetRoutes);
app.use("/api/v1/subscription", subscriptionRoutes);
app.use("/api/v1/comment", commentRoutes);
app.use("/api/v1/like", likeRoutes);
app.use("/api/v1/playlist", playListRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

export { app };
