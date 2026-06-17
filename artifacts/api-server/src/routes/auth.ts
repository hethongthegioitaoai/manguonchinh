import { Router } from "express";
import { isAuthenticated, getAuthUser } from "../auth/localAuth.js";

const router = Router();

router.get("/auth/user", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.userId;
    const user = await getAuthUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

export default router;
