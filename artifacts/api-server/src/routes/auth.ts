import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated, getAuthUser } from "../auth/replitAuth.js";

const router = Router();

router.get("/auth/user", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.userId;
    const user = await getAuthUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      emailVerified: user.emailVerified,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

router.post("/auth/change-password", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || !user.passwordHash) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return res.json({ message: "Đổi mật khẩu thành công!" });
  } catch {
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

export default router;
