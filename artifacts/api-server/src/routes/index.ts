import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import charactersRouter from "./characters.js";
import questsRouter from "./quests.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(charactersRouter);
router.use(questsRouter);

export default router;
