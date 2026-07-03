import { Router, type IRouter } from "express";
import healthRouter from "./health";
import itemsRouter from "./items";
import agoraRouter from "./agora";

const router: IRouter = Router();

router.use(healthRouter);
router.use(itemsRouter);
router.use(agoraRouter);

export default router;
