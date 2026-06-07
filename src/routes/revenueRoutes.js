import { Router } from "express";
import { autharication, authrazation } from "../middleware/auth.middleware.js";
import { getRevenue } from "../control/revenue.control.js";

const revenueRouter = Router();

revenueRouter.get("/", autharication, authrazation("admin"), getRevenue);

export { revenueRouter };
