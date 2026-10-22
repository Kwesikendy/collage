import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import dashboardRouter from "./dashboard";
import documentsRouter from "./documents";
import { requireCollatAdmin } from "../middlewares/requireCollatAdmin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireCollatAdmin);
router.use(clientsRouter);
router.use(dashboardRouter);
router.use(documentsRouter);

export default router;
