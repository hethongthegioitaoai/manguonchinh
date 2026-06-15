# 🗂️ TIẾN TRÌNH HỆ THỐNG — AI WORLD SYSTEM

> **⚠️ AGENT — ĐỌC FILE NÀY TRƯỚC TIÊN KHI MỞ DỰ ÁN**
> Tìm tính năng đầu tiên còn `[ ]` theo thứ tự ưu tiên → build → đánh dấu `[x]` → cập nhật bảng trạng thái.

> **Cập nhật lần cuối:** 15/06/2026 (battle/history xong)

---

## 🌐 TỔNG QUAN DỰ ÁN

**Tên:** AI World System
**Mô tả:** Web app nhập vai phong cách cyber cultivation tối tăm — người chơi đăng nhập (Replit Auth), chọn thế giới, tạo nhân vật với hệ thống năng lực ngẫu nhiên, chiến đấu, nhận quest, và phiêu lưu.

**Stack thực tế (KHÔNG dùng Supabase):**
- Frontend: React 19 + Vite 7 + TypeScript + Tailwind CSS v4 + Framer Motion + Wouter + shadcn/ui
- Backend: Express 5 (Node.js 24) — port 8080
- Database: PostgreSQL + Drizzle ORM (Replit managed, `DATABASE_URL` secret)
- Auth: **Replit Auth** (OIDC via `openid-client` + `passport`) — KHÔNG dùng Supabase Auth
- Session: `express-session` + `connect-pg-simple` (lưu vào bảng `sessions`)
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

## ✅ ĐÃ HOÀN THÀNH

### 🏗️ Hạ tầng & Auth
- [x] pnpm monorepo workspace
- [x] TypeScript config (base + references)
- [x] **Replit Auth** — OIDC login/logout/callback, session PostgreSQL
- [x] Bảng `sessions` — lưu server-side session
- [x] Bảng `users` — upsert khi login, lưu email/firstName/lastName/profileImageUrl
- [x] `isAuthenticated` middleware — kiểm tra + tự refresh token hết hạn
- [x] Workflow Frontend (port 19734) + Workflow API Server (port 8080)
- [x] `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID` — secrets đã set

### 🗄️ Database (Drizzle ORM — đã push schema)
- [x] Bảng `worlds` — 3 thế giới (cultivation / cyberpunk / zombie)
- [x] Bảng `characters` — nhân vật (userId, worldId, name, stats JSONB, level, exp)
- [x] Bảng `quests` — nhiệm vụ (characterId, worldSlug, title, description, status, expReward, questType)
- [x] Bảng `battles` — chiến đấu (characterId, enemyName, enemyLevel, battleMode, result, expGained, hpLeft, duration, metadata JSONB)

### 🎨 Frontend — Các trang
- [x] `/` — Landing Page (logo animation, nút vào thế giới)
- [x] `/login` — Replit Auth login
- [x] `/worlds` — Chọn thế giới (Tu Tiên / Cyberpunk / Hoang Phế)
- [x] `/create-character/:worldId` — Tạo nhân vật, roulette chọn Hệ Thống
- [x] `/dashboard` — Dashboard chính: stats, quests, level/EXP, hành động
- [x] `/play` — Narrative/Khám phá: cây chuyện 3 thế giới, typewriter, lựa chọn, EXP
- [x] `/character/:id` — Hồ sơ nhân vật: radar chart 6 chỉ số, lịch sử quest, lộ trình cảnh giới
- [x] `/leaderboard` — Bảng xếp hạng top 20, lọc theo thế giới
- [x] `/battle` — **Chiến trường: 6 chế độ + màn hình kết quả + EXP**
- [x] `/404` — Not Found page

### ⚙️ Backend API Routes
- [x] `GET /health`
- [x] `GET /api/auth/user` — thông tin user đang login
- [x] `GET /api/login`, `GET /api/callback`, `GET /api/logout` — Replit Auth flow
- [x] `GET /api/characters` — danh sách nhân vật của user
- [x] `POST /api/characters` — tạo nhân vật mới
- [x] `POST /api/characters/:characterId/exp` — cộng EXP thủ công
- [x] `GET /api/quests/:characterId` — lấy quest
- [x] `POST /api/quests/generate/:characterId` — sinh tối đa 3 quest active
- [x] `POST /api/quests/:questId/complete` — hoàn thành quest, nhận EXP
- [x] `GET /api/leaderboard` — top 20 nhân vật
- [x] `POST /api/battle/start` — sinh enemy + mode → trả về cho FE
- [x] `POST /api/battle/finish` — lưu kết quả, cộng EXP, level-up

### 🎮 Gameplay Systems
- [x] **Enemy Generator** (`lib/enemies.ts`) — 18 enemy template × 3 thế giới, stats ±20% theo level
- [x] **6 Battle Modes:**
  - [x] Turn-Based (`TurnBased.tsx`) — lượt chiến Tấn Công / Kỹ Năng / Phòng Thủ / Bỏ Chạy
  - [x] Real-Time (`RealTime.tsx`) — nhấn nhanh trong 20s
  - [x] Auto Battle (`AutoBattle.tsx`) — tự chạy, chỉnh tốc độ 1×/2×/3×
  - [x] Puzzle (`PuzzleBattle.tsx`) — ghi nhớ chuỗi màu, 5 vòng
  - [x] Narrative (`NarrativeBattle.tsx`) — chọn hành động theo câu chuyện
  - [x] Dice (`DiceBattle.tsx`) — 6 hiệp lăn xúc xắc, chí mạng = 6
- [x] Màn hình kết quả chiến đấu: thắng/thua/hòa, EXP flash, level-up animation
- [x] **Quest system** — 5 template/thế giới, tự generate khi < 3 active, EXP khi hoàn thành
- [x] **Level/EXP system** — 100 EXP/level, animation thăng cấp, cảnh giới theo thế giới
- [x] **Narrative system** — 3 cây chuyện (~40 node), typewriter effect, bonus EXP theo hệ thống

---

## ❌ CẦN BUILD — ƯU TIÊN THEO THỨ TỰ

> **Agent:** Lấy task đầu tiên chưa hoàn thành, build xong rồi đánh `[x]` và cập nhật bảng trạng thái bên dưới.

---

### 🟠 ƯU TIÊN 2 — GAMEPLAY NÂNG CAO

#### 2.1 Trang Lịch Sử Chiến Đấu (`/battle/history`) ✅
- [x] Danh sách các trận đã đánh (từ bảng `battles`)
- [x] Thống kê: tổng trận / win / lose / draw + tổng EXP
- [x] Win-rate bar chart tổng + breakdown theo từng mode
- [x] Filter theo mode (6 loại) và kết quả (thắng/thua/hòa)
- [x] API `GET /api/battle/history/:characterId` với stats server-side
- [x] Link từ BattlePage result screen (nút "Lịch Sử")

#### 2.2 Hệ thống Vật Phẩm / Trang Bị
- [ ] Bảng DB: `items` (id, name, type, rarity, stats JSONB, worldSlug, description, icon)
- [ ] Bảng DB: `inventory` (id, characterId, itemId, quantity, equippedSlot)
- [ ] API: `GET /api/inventory/:characterId`, `POST /api/inventory/equip`
- [ ] Drop item sau khi thắng battle (tỉ lệ theo rarity)
- [ ] Trang `/inventory` — hiển thị item, nút trang bị, tác động stats

#### 2.3 AI Narrative (Phase 2 — cần Gemini API key)
- [ ] Set secret `GEMINI_API_KEY` (Google AI Studio free)
- [ ] `POST /api/narrative/generate` — sinh story node động từ context nhân vật
- [ ] PlayPage dùng AI khi chọn "Khám phá tự do"

#### 2.4 Trang Cài đặt (`/settings`)
- [ ] Hiển thị thông tin tài khoản Replit (từ `/api/auth/user`)
- [ ] Chọn nhân vật mặc định
- [ ] Xoá nhân vật (với confirm dialog)

---

### 🟡 ƯU TIÊN 3 — HOÀN THIỆN UX

#### 3.1 Error Handling toàn diện
- [ ] React Error Boundary bao toàn app
- [ ] Toast khi lỗi network (đã có `sonner` cài sẵn)
- [ ] Loading skeleton cho Dashboard + Battle + Leaderboard

#### 3.2 Mobile Responsive
- [ ] Kiểm tra và fix layout trên màn hình nhỏ (< 375px)
- [ ] Battle components — đảm bảo tap target đủ lớn

---

### 🟢 ƯU TIÊN 4 — TRIỂN KHAI

#### 4.1 Deploy / Publish
- [ ] Verify tất cả env vars đúng cho production
- [ ] Test end-to-end sau khi publish
- [ ] Cấu hình domain tùy chỉnh (nếu cần)

---

## 📦 TRẠNG THÁI BẢNG DB

| Bảng | Trạng thái | Mô tả |
|---|---|---|
| `users` | ✅ Trong DB | Profile Replit user |
| `sessions` | ✅ Trong DB | Server-side sessions |
| `worlds` | ✅ Trong DB | 3 thế giới |
| `characters` | ✅ Trong DB | Nhân vật người chơi |
| `quests` | ✅ Trong DB | Nhiệm vụ |
| `battles` | ✅ Trong DB | Lịch sử chiến đấu |
| `items` | ❌ Chưa có | Vật phẩm |
| `inventory` | ❌ Chưa có | Túi đồ nhân vật |

---

## 🗺️ TRẠNG THÁI ROUTE

| Route | Trang | Trạng thái |
|---|---|---|
| `/` | Landing Page | ✅ Xong |
| `/login` | Đăng nhập (Replit Auth) | ✅ Xong |
| `/worlds` | Chọn thế giới | ✅ Xong |
| `/create-character/:worldId` | Tạo nhân vật | ✅ Xong |
| `/dashboard` | Dashboard nhân vật | ✅ Xong |
| `/play` | Narrative / Khám phá | ✅ Xong |
| `/character/:id` | Hồ sơ nhân vật | ✅ Xong |
| `/leaderboard` | Bảng xếp hạng | ✅ Xong |
| `/battle` | Chiến trường (6 mode) | ✅ Xong |
| `/battle/history` | Lịch sử chiến đấu | ✅ Xong |
| `/inventory` | Túi đồ / Trang bị | ❌ Chưa có |
| `/settings` | Cài đặt tài khoản | ❌ Chưa có |

---

## 📝 GHI CHÚ KỸ THUẬT (QUAN TRỌNG)

- **Auth:** Replit Auth OIDC — KHÔNG dùng Supabase. Cookie session qua `express-session`.
- **DB:** Drizzle ORM + PostgreSQL. Schema thay đổi → chạy `pnpm --filter @workspace/db run push`.
- **API codegen:** Thay đổi OpenAPI spec → chạy `pnpm --filter @workspace/api-spec run codegen`.
- **World constants:** `artifacts/ai-world-system/src/lib/worlds.ts`
- **Enemy templates:** `artifacts/ai-world-system/src/lib/enemies.ts`
- **Narrative data:** `artifacts/ai-world-system/src/lib/narrative.ts` — 3 cây chuyện ~40 node
- **EXP formula:** 100 EXP = 1 level. `level = floor(totalExp / 100) + 1`
- **Battle EXP:** win = enemyLevel × 10, draw = ×3, lose = 0

---

## ⚡ HƯỚNG DẪN AGENT KHI MỞ DỰ ÁN

```
1. Đọc file này (TIENTRINHHETHONG.md) trước tiên
2. Kiểm tra workflow Frontend + API Server đang chạy
3. Tìm task [ ] đầu tiên theo thứ tự ưu tiên (2 → 3 → 4)
4. Build task đó
5. Sau khi xong: đánh [x], cập nhật bảng DB và bảng Route nếu cần
6. Ghi ngày cập nhật ở đầu file
```

*Cập nhật file này ngay sau khi hoàn thành mỗi tính năng.*
