import { Router } from "express";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { checkUserActive, getAllUsers, getUserById, toggleUserRole, toggleUserStatus } from "../control/admin.control.js";
import { getAllOrders } from "../control/order.controll.js";
import { userModel } from "../model/user.model.js";
import { paganationMiddlewearefilter, userFilter } from "../middleware/feature.middleware.js";
import { orderModel } from "../model/orderId.model.js";

const adminRouter = Router()

adminRouter.put("/:id",autharication,authrazation("admin"),toggleUserStatus)
adminRouter.put("/role/:id",autharication,authrazation("admin"),toggleUserRole)
adminRouter.get("/profile",autharication,checkUserActive)
adminRouter.get("/",autharication,authrazation("admin"),getAllUsers)
adminRouter.get("/:id",autharication,authrazation("admin"),getUserById)

adminRouter.get("/getOrder/:id", autharication, authrazation("admin"),paganationMiddlewearefilter(orderModel),getAllOrders);

export {adminRouter}