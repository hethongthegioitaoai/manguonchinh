import { Router } from "express";
import { isAuthenticated, getAuthUser } from "../auth/replitAuth.js";

const router = Router();

router.get("/auth/user", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await getAuthUser(userId);
    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

export default router;
