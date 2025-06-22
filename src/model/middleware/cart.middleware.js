import { Errorhandler } from "../../service/errorHandler.js";

export const passUserMiddleware = Errorhandler(async(req,res,next)=>{
    const{_id}=req.docodedToken;
    req.body.userId=_id;
    next()
})