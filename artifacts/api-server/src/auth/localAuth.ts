import bcrypt from "bcryptjs";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: sessionTtl,
    },
  });
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body as {
        username?: string;
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
      };

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Tên đăng nhập, email và mật khẩu là bắt buộc" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
      }

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.email, email), eq(users.username, username)))
        .limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ message: "Tên đăng nhập hoặc email đã tồn tại" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [user] = await db
        .insert(users)
        .values({ email, username, passwordHash, firstName: firstName ?? username, lastName: lastName ?? "" })
        .returning();

      (req.session as any).userId = user.id;
      return res.status(201).json({ id: user.id, email: user.email, username: user.username, firstName: user.firstName });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { login, password } = req.body as { login?: string; password?: string };

      if (!login || !password) {
        return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập/email và mật khẩu" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(or(eq(users.email, login), eq(users.username, login)))
        .limit(1);

      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
      }

      (req.session as any).userId = user.id;
      return res.json({ id: user.id, email: user.email, username: user.username, firstName: user.firstName });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  (req as any).userId = userId;
  return next();
};

export async function getAuthUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user;
}
