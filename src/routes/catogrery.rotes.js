import { Router } from "express";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { addMiddleware, deleteMiddleware, getMiddleware, ubdateMiddleware } from "../middleware/query.midlleware.js";
import { Categorymodel } from "../model/category.model.js";
import { excuteMiddleware } from "../middleware/excute.middleware.js";
import { filterMiddleware, paganationMiddleweare } from "../middleware/feature.middleware.js";

const categoryRouter = Router({mergeParams:true})
categoryRouter.post("/",autharication,authrazation("admin"),
addMiddleware(Categorymodel),excuteMiddleware)

categoryRouter.put("/:id",autharication,authrazation("admin"),ubdateMiddleware(Categorymodel),
filterMiddleware("_id","id"),excuteMiddleware)

categoryRouter.delete("/:id",autharication,authrazation("admin"),deleteMiddleware(Categorymodel),
filterMiddleware("_id","id"),excuteMiddleware)

categoryRouter.delete("/",autharication,authrazation("admin"),deleteMiddleware(Categorymodel),excuteMiddleware)

categoryRouter.get("/",autharication,getMiddleware(Categorymodel),
filterMiddleware("userId","id"),paganationMiddleweare(),excuteMiddleware)

export{categoryRouter}