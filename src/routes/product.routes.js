import { Router } from "express";
import { addMiddleware, deleteMiddleware, getMiddleware, ubdateMiddleware } from "../middleware/query.midlleware.js";
import { excuteMiddleware } from "../middleware/excute.middleware.js";
import { filterMiddleware, paganationMiddlewearefilter } from "../middleware/feature.middleware.js";
import { productModel } from "../model/product.model.js";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { getMiddlewarefilter } from "../control/product.control.js";
import { getAllProducts } from "../middleware/getallproduct.middleware.js";


const productRouter = Router()
productRouter.post("/",autharication,authrazation("admin"),addMiddleware(productModel),excuteMiddleware)
productRouter.get("/",getMiddlewarefilter(productModel),paganationMiddlewearefilter(productModel),getAllProducts)
//use by ID
productRouter.get("/:id",getMiddleware(productModel),filterMiddleware("_id","id"),excuteMiddleware)
productRouter.put("/:id",autharication,authrazation("admin"),ubdateMiddleware(productModel),
filterMiddleware("_id","id"),excuteMiddleware)
productRouter.delete("/:id",autharication,authrazation("admin"),deleteMiddleware(productModel),filterMiddleware("_id","id"),
excuteMiddleware)
export {productRouter}
 