import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import charactersRouter from "./characters.js";
import questsRouter from "./quests.js";
import leaderboardRouter from "./leaderboard.js";
import battleRouter from "./battle.js";
import inventoryRouter from "./inventory.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(charactersRouter);
router.use(questsRouter);
router.use(leaderboardRouter);
router.use(battleRouter);
router.use(inventoryRouter);

export default router;
