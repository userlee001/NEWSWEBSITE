import express, { request, response } from "express";
import cookieParser from "cookie-parser";
import authenticationRouter from "./Router/authenticationRouter.js";
import readerRouter from "./Router/readerRouter.js";
import writerRouter from "./Router/writerRouter.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/authentication", authenticationRouter);
app.use("/api/reader", readerRouter);
app.use("/api/writer", writerRouter);

app.listen(3000, () => {
    console.log("listening on 3000 port.")
}) 