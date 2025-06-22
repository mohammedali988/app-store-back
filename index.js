
import express from "express";
import { bootstrap } from "./src/utils/bootstrab.js";

const app = express();
app.use(express.json())
bootstrap(app) 

export default app; 