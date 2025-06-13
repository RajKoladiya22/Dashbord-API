import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import { requestLogger } from "./core/middleware/logs/requestLogger";
import { errorHandler } from "./core/middleware/logs/errorHandler";
import Router from "./routes/v1";
import { checkStaticToken } from "./core/middleware/key/checkStaticToken";
import  "./core/job/planStatus"
// import path from "path";
// import fs from "fs";

const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "https://dashbord-seven-sigma.vercel.app"], // your frontend URL
  credentials: true, // <— allow cookies
};

app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

app.use(express.json());

// app.use('/uploads',express.static(path.join(__dirname,'../uploads')));
app.use(requestLogger);
app.use(checkStaticToken);
app.use(cookieParser(/* optional secret for signed cookies */));
app.use("/api/v1", Router);
app.use(errorHandler);

export default app;
