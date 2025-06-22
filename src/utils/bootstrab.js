import cors from "cors"
import env from "dotenv"
import { v1Router } from "./v1Router.js"
import { dbconnection } from "./dbconnection.js"
import express from "express"; 
import path from "path";
import { fileURLToPath } from "url";

env.config()  
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "../../public");
 
export const bootstrap = async(app)=>{
  
// Handle Cors
const corsConnfig = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Allowed methods
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Access-Control-Allow-Origin",
  ],
  credentials: true, // Allow credentials
};
   app.options("", cors(corsConnfig));
   app.use(cors(corsConnfig));
    app.use(express.static(publicPath));

    app.use(express.urlencoded({ extended: true }));

    app.get("/", (req, res) => {
    res.send("welcome!");
  });
    app.get("/pp", (req, res) => {
      res.sendFile(path.join(publicPath, "pp.html"));
    });
    app.use("/api/v1/",v1Router)
    app.use((error,req,res,next)=>{
        const status = error.status || 500
        const message = error.message || 'Internal server Error'
        res.status(status).json({status,message})
    })
    await dbconnection();
    app.listen(process.env.PORT,()=>{
        console.log(`server is runing ${process.env.PORT}`)
    })
}
