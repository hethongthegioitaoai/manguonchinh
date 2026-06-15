# 🗂️ TIẾN TRÌNH HỆ THỐNG — AI WORLD SYSTEM

> **⚠️ AGENT — ĐỌC FILE NÀY TRƯỚC TIÊN KHI MỞ DỰ ÁN**
> 1. Đọc phần **ROADMAP** để nắm toàn bộ kế hoạch
> 2. Tìm task `[ ]` đầu tiên theo thứ tự ưu tiên (P1 → P2 → P3 → P4)
> 3. Build xong → đánh `[x]` → cập nhật bảng trạng thái → ghi ngày cập nhật

> **Cập nhật lần cuối:** 15/06/2026 — Tu Luyện System xong (/cultivate, cultivation energy, 6 base stats)

---

## 🌐 TỔNG QUAN DỰ ÁN

**Tên:** AI World System
**Mô tả:** Web app nhập vai phong cách cyber cultivation tối tăm — người chơi đăng nhập (Replit Auth), chọn thế giới, tạo nhân vật với hệ thống năng lực ngẫu nhiên, chiến đấu, nhận quest, và phiêu lưu.

**Stack thực tế:**
- Frontend: React 19 + Vite 7 + TypeScript + Tailwind CSS v4 + Framer Motion + Wouter + shadcn/ui
- Backend: Express 5 (Node.js 24) — port 8080
- Database: PostgreSQL + Drizzle ORM (`DATABASE_URL` secret, Replit managed)
- Auth: **Replit Auth** (OIDC — `openid-client` + `passport`) — KHÔNG dùng Supabase
- Session: `express-session` + `connect-pg-simple` (bảng `sessions`)
- Monorepo: pnpm workspaces

**Cấu trúc thư mục:**
```
artifacts/
  ai-world-system/   ← Frontend React (port 19734)
  api-server/        ← Backend Express (port 8080)
lib/
  db/                ← Schema Drizzle + DB client
  api-spec/          ← OpenAPI spec + Orval codegen
  api-zod/           ← Zod schemas (generated)
  api-client-react/  ← React hooks (generated)
```

---

## 🗺️ ROADMAP ĐẦY ĐỦ

> Đây là bản đồ toàn bộ tính năng dự kiến của dự án — từ MVP đến hoàn chỉnh.
> Agent: tìm `[ ]` đầu tiên theo thứ tự P1 → P2 → P3 → P4 và build.

### ─────────────────────────────────────────
### P1 — MVP CỐT LÕI (Đã xong ✅)
### ─────────────────────────────────────────

#### [INFRA] Hạ tầng & Auth
- [x] pnpm monorepo workspace
- [x] TypeScript config (base + references)
- [x] Replit Auth OIDC (login/logout/callback + session PostgreSQL)
- [x] Bảng `sessions`, `users` trong DB
- [x] `isAuthenticated` middleware + auto refresh token
- [x] Workflow Frontend (port 19734) + API Server (port 8080)
- [x] `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID` đã set

#### [DB] Database Schema
- [x] Bảng `worlds` — 3 thế giới
- [x] Bảng `characters` — nhân vật (userId, worldId, name, stats JSONB, level, exp)
- [x] Bảng `quests` — nhiệm vụ
- [x] Bảng `battles` — lịch sử chiến đấu
- [x] Bảng `items` — 24 template vật phẩm × 3 worlds
- [x] Bảng `inventory` — túi đồ nhân vật

#### [FE] Các trang cơ bản
- [x] `/` — Landing Page
- [x] `/login` — Đăng nhập Replit Auth
- [x] `/worlds` — Chọn thế giới
- [x] `/create-character/:worldId` — Tạo nhân vật + roulette hệ thống
- [x] `/dashboard` — Dashboard chính
- [x] `/play` — Narrative / Khám phá
- [x] `/character/:id` — Hồ sơ nhân vật + radar chart
- [x] `/leaderboard` — Bảng xếp hạng top 20
- [x] `/battle` — Chiến trường 6 chế độ
- [x] `/battle/history` — Lịch sử chiến đấu + stats
- [x] `/inventory` — Túi đồ + trang bị
- [x] `/404` — Not Found

#### [BE] API Routes cơ bản
- [x] `GET /health`
- [x] `GET /api/auth/user`
- [x] `GET/POST /api/characters`, `DELETE /api/characters/:id`
- [x] `POST /api/characters/:characterId/exp`
- [x] `GET/POST /api/quests/:characterId`, `POST /api/quests/:questId/complete`
- [x] `GET /api/leaderboard`
- [x] `POST /api/battle/start`, `POST /api/battle/finish`
- [x] `GET /api/battle/history/:characterId`
- [x] `GET/POST /api/inventory/:characterId`, `POST /api/inventory/equip`

#### [GAME] Gameplay cốt lõi
- [x] Enemy Generator — 18 template × 3 worlds, stats ±20% random
- [x] 6 Battle Modes: Turn-Based, Real-Time, Auto, Puzzle, Narrative, Dice
- [x] Quest system — 5 template/world, auto generate, EXP reward
- [x] Level/EXP system — 100 EXP/level, animation thăng cấp, cảnh giới
- [x] Narrative system — 3 cây chuyện ~40 node, typewriter, EXP bonus

### ─────────────────────────────────────────
### P2 — GAMEPLAY NÂNG CAO
### ─────────────────────────────────────────

#### [UX] Trang Cài đặt & Error Handling
- [x] `/settings` — Thông tin tài khoản, danh sách nhân vật, xoá nhân vật
- [x] React Error Boundary bao toàn app
- [x] QueryClient retry config

#### [AI] AI Narrative — sinh story động
- [ ] Set secret `GEMINI_API_KEY` (hoặc dùng Replit AI integration)
- [ ] `POST /api/narrative/generate` — sinh story node từ context nhân vật + world
- [ ] PlayPage: option "Khám phá tự do" gọi AI endpoint
- [ ] Fallback về static tree nếu AI lỗi / chưa có key

#### [GAME] Tu Luyện System
- [x] Trang `/cultivate` — màn hình tu luyện nhân vật
- [x] API `GET/POST /api/cultivate/:characterId` — đọc và đầu tư năng lượng vào chỉ số (STR/INT/AGI/LCK/END/SPR)
- [x] Hệ thống cost: `floor(currentValue/10) × 10 + 10` năng lượng mỗi điểm (progressive)
- [x] Năng lượng tu luyện (`cultivationEnergy`) lưu trong `stats` JSONB — +20 win / +10 draw / +15 quest
- [x] Cập nhật `characters.stats.baseStats` với 6 chỉ số riêng
- [x] Hiển thị real baseStats trong radar chart ở `/character/:id`
- [x] Dashboard: bỏ "SẮP RA MẮT", route tới `/cultivate`

#### [SOCIAL] Guild / Clan System
- [ ] Bảng DB `guilds` (id, name, worldSlug, leaderId, memberCount, totalExp)
- [ ] Bảng DB `guild_members` (guildId, characterId, role, joinedAt)
- [ ] API `GET/POST /api/guilds`, `POST /api/guilds/:id/join`
- [ ] Trang `/guilds` — danh sách guild theo world, top guild xếp hạng
- [ ] Trang `/guilds/:id` — thành viên, tổng EXP, leader

### ─────────────────────────────────────────
### P3 — HOÀN THIỆN UX
### ─────────────────────────────────────────

#### [UX] Mobile & Loading
- [ ] Loading skeleton cho Dashboard, Battle, Leaderboard (dùng `shadcn/ui Skeleton`)
- [ ] Mobile responsive: kiểm tra layout < 375px, battle tap target ≥ 44px
- [ ] Sonner toast khi lỗi network (wrap fetch calls trong lib utility)

#### [UX] Onboarding Flow
- [ ] Tooltip hướng dẫn lần đầu (chỉ hiện 1 lần, lưu localStorage)
- [ ] Màn hình "Chào mừng" sau khi tạo nhân vật đầu tiên

#### [GAME] Daily Bonus & Streak
- [ ] Bảng DB `daily_logins` (characterId, date)
- [ ] API `POST /api/daily-checkin/:characterId` — nhận EXP mỗi ngày
- [ ] UI trong Dashboard: streak counter, nút check-in hàng ngày

#### [SOCIAL] PvP — Thách Đấu
- [ ] Bảng DB `pvp_challenges` (challengerId, defenderId, status, result, battleLog)
- [ ] API `POST /api/pvp/challenge/:targetCharacterId`
- [ ] Trang `/pvp` — giao diện thách đấu, lịch sử PvP
- [ ] Leaderboard PvP riêng

### ─────────────────────────────────────────
### P4 — TRIỂN KHAI & MỞ RỘNG
### ─────────────────────────────────────────

#### [OPS] Deploy
- [ ] Verify tất cả env vars đúng cho production
- [ ] Test end-to-end sau khi publish
- [ ] Cấu hình custom domain (nếu cần)

#### [GAME] Season System
- [ ] Mùa giải 30 ngày — reset xếp hạng, giữ nhân vật
- [ ] Phần thưởng cuối mùa (item đặc biệt, title)
- [ ] Bảng `season_records` lưu lịch sử từng mùa

#### [GAME] World Events
- [ ] Sự kiện ngẫu nhiên theo giờ (boss xuất hiện, bonus EXP 2×)
- [ ] Bảng `world_events` (worldSlug, type, startAt, endAt, metadata)
- [ ] Banner sự kiện trên Dashboard

---

## 📦 TRẠNG THÁI BẢNG DB

| Bảng | Trạng thái | Mô tả |
|---|---|---|
| `users` | ✅ | Profile Replit user |
| `sessions` | ✅ | Server-side sessions |
| `worlds` | ✅ | 3 thế giới |
| `characters` | ✅ | Nhân vật người chơi |
| `quests` | ✅ | Nhiệm vụ |
| `battles` | ✅ | Lịch sử chiến đấu |
| `items` | ✅ | Vật phẩm (24 templates × 3 worlds) |
| `inventory` | ✅ | Túi đồ nhân vật |
| `guilds` | ❌ Chưa có | Guild system (P2) |
| `guild_members` | ❌ Chưa có | Thành viên guild (P2) |
| `daily_logins` | ❌ Chưa có | Daily check-in (P3) |
| `pvp_challenges` | ❌ Chưa có | PvP thách đấu (P3) |
| `season_records` | ❌ Chưa có | Season system (P4) |
| `world_events` | ❌ Chưa có | World events (P4) |

---

## 🗺️ TRẠNG THÁI ROUTE

| Route | Trang | Trạng thái |
|---|---|---|
| `/` | Landing Page | ✅ |
| `/login` | Đăng nhập (Replit Auth) | ✅ |
| `/worlds` | Chọn thế giới | ✅ |
| `/create-character/:worldId` | Tạo nhân vật | ✅ |
| `/dashboard` | Dashboard nhân vật | ✅ |
| `/play` | Narrative / Khám phá | ✅ |
| `/character/:id` | Hồ sơ nhân vật | ✅ |
| `/leaderboard` | Bảng xếp hạng | ✅ |
| `/battle` | Chiến trường (6 mode) | ✅ |
| `/battle/history` | Lịch sử chiến đấu | ✅ |
| `/inventory` | Túi đồ / Trang bị | ✅ |
| `/settings` | Cài đặt tài khoản | ✅ |
| `/cultivate` | Tu Luyện chỉ số | ✅ |
| `/guilds` | Danh sách guild | ❌ P2 |
| `/guilds/:id` | Chi tiết guild | ❌ P2 |
| `/pvp` | PvP thách đấu | ❌ P3 |

---

## 📝 GHI CHÚ KỸ THUẬT

- **Auth:** Replit Auth OIDC — KHÔNG dùng Supabase. Cookie session qua `express-session`.
- **DB:** Drizzle ORM + PostgreSQL. Schema thay đổi → `pnpm --filter @workspace/db run push`
- **API codegen:** OpenAPI spec thay đổi → `pnpm --filter @workspace/api-spec run codegen`
- **Backend rebuild:** Không hot-reload — restart workflow "API Server" sau mỗi lần sửa
- **EXP formula:** `level = floor(totalExp / 100) + 1`
- **Battle EXP:** win = `enemyLevel × 10`, draw = `×3`, lose = `0`
- **World constants:** `artifacts/ai-world-system/src/lib/worlds.ts`
- **Enemy templates:** `artifacts/ai-world-system/src/lib/enemies.ts`
- **Narrative data:** `artifacts/ai-world-system/src/lib/narrative.ts`

---

## ⚡ HƯỚNG DẪN AGENT KHI MỞ DỰ ÁN

```
1. Đọc file này (TIENTRINHHETHONG.md) TRƯỚC TIÊN
2. Kiểm tra workflow "Start application" + "API Server" đang chạy
3. Tìm task [ ] đầu tiên trong ROADMAP theo thứ tự P2 → P3 → P4
4. Build task đó (không cần hỏi user nếu task rõ ràng)
5. Sau khi xong:
   - Đánh [x] vào task đã hoàn thành
   - Cập nhật bảng DB và bảng Route nếu cần
   - Ghi ngày "Cập nhật lần cuối" ở đầu file
6. Tiếp tục task tiếp theo cho đến khi không còn task nào unblocked
```

*Cập nhật file này ngay sau khi hoàn thành mỗi tính năng.*
