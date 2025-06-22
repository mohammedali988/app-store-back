import { Router } from "express";
import { autharication } from "../middleware/auth.middleware.js";
import { passUserMiddleware } from "../model/middleware/cart.middleware.js";
import { addMiddleware, deleteMiddleware, getMiddleware, ubdateMiddleware } from "../middleware/query.midlleware.js";
import { cartModel } from "../model/cart.model.js";
import { excuteMiddleware } from "../middleware/excute.middleware.js";
import { filterMiddleware } from "../middleware/feature.middleware.js";


const cartRouter = Router({mergeParams:true})

cartRouter.post("/",autharication,passUserMiddleware,addMiddleware(cartModel),excuteMiddleware)
cartRouter.put("/:id",autharication,ubdateMiddleware(cartModel),filterMiddleware("_id","id"),excuteMiddleware)
cartRouter.delete("/:id",autharication,deleteMiddleware(cartModel),filterMiddleware("_id","id"),excuteMiddleware)
cartRouter.delete("/",autharication,deleteMiddleware(cartModel),excuteMiddleware)

//get all cart specific user(filtration depend on user id)
cartRouter.get("/:id",autharication,getMiddleware(cartModel),filterMiddleware("userId","id"),excuteMiddleware)
export{cartRouter}