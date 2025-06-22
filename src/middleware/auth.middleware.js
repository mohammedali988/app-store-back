import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
import { Errorhandler, sendError } from '../service/errorHandler.js';
dotenv.config()

export const autharication= Errorhandler(async(req,res,next)=>{
    const token = req.headers.token
    if(!token)throw new sendError(400,"token is invalid")

    await jwt.verify(token,process.env.SECRET_KEY,async(error,docodedToken)=>{
        if(error)throw new sendError(400,"token is invalid")
            req.docodedToken= docodedToken
        next();
    });
    
})



export const authrazation = (Role)=>{
    return  Errorhandler(async(req,res,next)=>{
        const token = req.headers.token
        if (!token) throw new sendError(400,"token not found")  
        await jwt.verify(token,process.env.SECRET_KEY,async(error,decodedToken)=>{
        if (error) throw new sendError(498,"invalid token");
            if(decodedToken?.role === Role){
                next();
            }else{
                throw new sendError(401,"youre not authrazations")
            }
           
        })
    })
    
}
