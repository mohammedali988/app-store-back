import { Router } from "express";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { checkUserActive, getAllUsers, getMaintenance, getUserById, handleMaintenance, toggleUserRole, toggleUserStatus } from "../control/admin.control.js";
import { getAllOrders, getOneOrder } from "../control/order.controll.js";
import { userModel } from "../model/user.model.js";
import { paganationMiddlewearefilter, userFilter } from "../middleware/feature.middleware.js";
import { orderModel } from "../model/orderId.model.js";

const adminRouter = Router()

adminRouter.put("/role/:id", autharication, authrazation("admin"), toggleUserRole);
adminRouter.put("/:id", autharication, authrazation("admin"), toggleUserStatus);

adminRouter.get("/profile", autharication, checkUserActive);
adminRouter.get("/", autharication, authrazation("admin"), getAllUsers);

adminRouter.get("/maintenance", autharication, getMaintenance);
adminRouter.post("/maintenance", autharication, authrazation("admin"), handleMaintenance);

adminRouter.get("/getOrder/:id", autharication, authrazation("admin"), paganationMiddlewearefilter(orderModel), getAllOrders);
adminRouter.get("/getOneOrder/:orderId", autharication, authrazation("admin"), paganationMiddlewearefilter(orderModel), getOneOrder);

adminRouter.get("/:id", autharication, authrazation("admin"), getUserById);

export {adminRouter}