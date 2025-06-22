import { Router } from "express";
import { autharication } from "../middleware/auth.middleware.js";
import { passUserId } from "../model/middleware/order.middleware.js";
import { makeOrder } from "../control/order.controll.js";
import { getMiddleware } from "../middleware/query.midlleware.js";
import { filterMiddleware } from "../middleware/feature.middleware.js";
import { excuteMiddleware } from "../middleware/excute.middleware.js";


const orderRouter = Router({mergeParams:true})

orderRouter.post("/",autharication,passUserId,makeOrder)
orderRouter.get("/",autharication,getMiddleware(orderRouter),filterMiddleware("userId","id"),excuteMiddleware)

export{orderRouter}