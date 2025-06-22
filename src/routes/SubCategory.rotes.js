import { Router } from "express";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { passUserId } from "../model/middleware/order.middleware.js";
import { addMiddleware, deleteMiddleware, getMiddleware, ubdateMiddleware } from "../middleware/query.midlleware.js";
import { excuteMiddleware } from "../middleware/excute.middleware.js";
import { filterMiddleware, paganationMiddleweare } from "../middleware/feature.middleware.js";
import { subCategorymodel } from "../model/subCategory.model.js";

const subcategoryRouter = Router({mergeParams:true})
subcategoryRouter.post("/",autharication,authrazation("admin"),
addMiddleware(subCategorymodel),excuteMiddleware)

subcategoryRouter.put("/:id",autharication,authrazation("admin"),ubdateMiddleware(subCategorymodel),
filterMiddleware("_id","id"),excuteMiddleware)

subcategoryRouter.delete("/:id",autharication,authrazation("admin"),deleteMiddleware(subCategorymodel),
filterMiddleware("_id","id"),excuteMiddleware)

subcategoryRouter.delete("/",autharication,authrazation("admin"),deleteMiddleware(subCategorymodel),excuteMiddleware)

subcategoryRouter.get("/",autharication,getMiddleware(subCategorymodel),
filterMiddleware("userId","id"),paganationMiddleweare(),excuteMiddleware)

export{subcategoryRouter}