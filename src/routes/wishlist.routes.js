import { Router } from "express"
import { autharication } from "../middleware/auth.middleware.js"
import { excuteMiddleware } from "../middleware/excute.middleware.js"
import { filterMiddleware } from "../middleware/feature.middleware.js"
import { addMiddleware, deleteMiddleware, getMiddleware } from "../middleware/query.midlleware.js"
import { passUserId } from "../model/middleware/order.middleware.js"
import { whislistModel } from "../model/wishlist.model.js"

const whishlistRouter = Router({mergeParams:true})

whishlistRouter.post("/",autharication,passUserId,addMiddleware(whislistModel),excuteMiddleware)
whishlistRouter.delete("/:id",autharication,deleteMiddleware(whislistModel),filterMiddleware("_id","id"),excuteMiddleware)
whishlistRouter.delete("/",autharication,deleteMiddleware(whislistModel),excuteMiddleware)
whishlistRouter.get("/",getMiddleware(whislistModel),filterMiddleware("userId","id"),excuteMiddleware)

export {whishlistRouter}