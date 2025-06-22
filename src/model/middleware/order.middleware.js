import { Errorhandler, sendError } from "../../service/errorHandler.js";

export const passUserId = Errorhandler(async(req,res,next)=>{
    if(req.params.id){
        req.body.userId=req.params.id;
        next();
    }else{
        throw new sendError(400,"user ID is required")
    }
})