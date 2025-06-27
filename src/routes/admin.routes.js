import { Router } from "express";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { checkUserActive, getAllUsers, getUserById, toggleUserStatus } from "../control/admin.control.js";
import { getAllOrders } from "../control/order.controll.js";
import { userModel } from "../model/user.model.js";
import { paganationMiddlewearefilter } from "../middleware/feature.middleware.js";
import { orderModel } from "../model/orderId.model.js";

const adminRouter = Router()

adminRouter.put("/:id",autharication,authrazation("admin"),toggleUserStatus)
adminRouter.get("/profile",autharication,checkUserActive)
adminRouter.get("/",autharication,authrazation("admin"), paganationMiddlewearefilter(userModel),getAllUsers)
adminRouter.get("/:id",autharication,authrazation("admin"),getUserById)

adminRouter.get("/getOrder/:id", autharication, authrazation("admin"),paganationMiddlewearefilter(orderModel),getAllOrders);

export {adminRouter}