export const Errorhandler = (fn)=>{
    return(req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch(next)
    
    }
    }
    export class sendError extends Error{
        constructor(status,message){
            super(message)
            this.status = status
        }
    
    }