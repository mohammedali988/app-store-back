import { Router } from "express";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { checkUserActive, getAllUsers, getUserById, toggleUserStatus } from "../control/admin.control.js";
import { getAllOrders } from "../control/order.controll.js";

const adminRouter = Router()

adminRouter.put("/:id",autharication,authrazation("admin"),toggleUserStatus)
adminRouter.get("/profile",autharication,checkUserActive)
adminRouter.get("/",autharication,authrazation("admin"),getAllUsers)
adminRouter.get("/:id",autharication,authrazation("admin"),getUserById)
adminRouter.get("/", autharication, authrazation("admin"), getAllOrders);

export {adminRouter}