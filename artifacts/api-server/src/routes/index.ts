import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import investorRouter from "./investor";
import settingsRouter from "./settings";
import purchasesRouter from "./purchases";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import certificateRouter from "./certificate";
import alertsRouter from "./alerts";
import priceRouter from "./price";
import logosRouter from "./logos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(investorRouter);
router.use(settingsRouter);
router.use(purchasesRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(certificateRouter);
router.use(alertsRouter);
router.use(priceRouter);
router.use(logosRouter);

export default router;
