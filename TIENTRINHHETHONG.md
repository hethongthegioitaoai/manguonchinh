# 🗂️ TIẾN TRÌNH HỆ THỐNG — AI WORLD SYSTEM

> **Mục đích:** Mỗi khi mở dự án, đọc file này trước để biết đang ở đâu, cần Build gì tiếp theo, và còn thiếu gì.
>
> **Cập nhật lần cuối:** 15/06/2026

---

## 🌐 TỔNG QUAN DỰ ÁN

**Tên:** AI World System
**Mô tả:** Web app nhập vai phong cách cyber cultivation tối tăm — người chơi đăng nhập, chọn thế giới do AI dẫn dắt, tạo nhân vật với hệ thống năng lực ngẫu nhiên, rồi phiêu lưu trong thế giới đó.

**Stack:**
- Frontend: React + Vite + TypeScript + Tailwind CSS v4 + Framer Motion
- Backend: Express 5 (Node.js 24)
- Database: Supabase (PostgreSQL + Auth + RLS)
- AI: Chưa tích hợp
- Routing: Wouter
- UI: shadcn/ui + Radix UI

---

## ✅ ĐÃ HOÀN THÀNH

### 🎨 Frontend — Giao diện
- [x] **Trang Chủ** (`/`) — Landing page với logo animation, nút "Vào Thế Giới"
- [x] **Trang Đăng Nhập** (`/login`) — Email + password, tự động signup nếu chưa có tài khoản
- [x] **Trang Chọn Thế Giới** (`/worlds`) — 3 thế giới: Tu Tiên / Cyberpunk / Vùng Hoang Phế
- [x] **Trang Tạo Nhân Vật** (`/create-character/:worldId`) — Nhập tên, roulette chọn Hệ Thống ngẫu nhiên
- [x] **Trang 404** — Not Found page

### 🔐 Xác thực
- [x] **AuthContext** — Quản lý session Supabase toàn app
- [x] **Bảo vệ route** — Tự redirect về `/login` nếu chưa đăng nhập
- [x] **Supabase Auth** — signIn + signUp tự động

### 🗄️ Cơ sở dữ liệu (Schema SQL đã viết)
- [x] Bảng `users` — profile công khai, trigger tự tạo khi có auth user mới
- [x] Bảng `worlds` — 3 thế giới (seed sẵn)
- [x] Bảng `characters` — lưu nhân vật với tên, worldId, JSONB stats
- [x] **Row Level Security (RLS)** — bật cho tất cả bảng

### ⚙️ Backend
- [x] **API Server Express** — cấu trúc cơ bản (src/app.ts, src/index.ts)
- [x] **Health route** (`/health`) — kiểm tra server còn sống
- [x] **Logger middleware** — ghi log request

### 🏗️ Hạ tầng
- [x] pnpm monorepo workspace cấu hình xong
- [x] TypeScript config (base + references)
- [x] Cấu trúc thư mục chuẩn

---

## ❌ CÒN THIẾU — CẦN BUILD

> Sắp xếp theo **thứ tự ưu tiên** — build từ trên xuống.

---

### 🔴 ƯU TIÊN 1 — BẮT BUỘC ĐỂ APP CHẠY ĐƯỢC

#### 1.1 Cấu hình Workflow ✅
- [x] Workflow **Frontend** — `PORT=19734 BASE_PATH=/ pnpm --filter @workspace/ai-world-system run dev`
- [x] Workflow **API Server** — `PORT=8080 pnpm --filter @workspace/api-server run dev`

#### 1.2 Biến môi trường Supabase ✅
- [x] `SUPABASE_URL` — đã set (`https://wyxisszfooqaxjpbicoc.supabase.co`)
- [x] `SUPABASE_ANON_KEY` — đã set (secret)

#### 1.3 Chạy SQL setup Supabase ✅
- [x] Vào Supabase Dashboard → SQL Editor
- [x] Chạy file `artifacts/ai-world-system/supabase-setup.sql`
- [x] 3 bảng đã tồn tại: `users`, `worlds`, `characters`

---

### 🟠 ƯU TIÊN 2 — GAMEPLAY CORE (App có nhưng chưa chơi được)

#### 2.1 Trang Dashboard Nhân Vật (`/dashboard`) ✅
- [x] Hiển thị thông tin nhân vật (tên, thế giới, hệ thống, cảnh giới/realm)
- [x] Stats panel (STR, INT, AGI, LCK) + thanh EXP
- [x] Nút hành động: CHIẾN ĐẤU, KHÁM PHÁ (→ `/play`), TU LUYỆN, TÚI ĐỒ
- [x] World lore panel + badge thế giới
- [x] Nút tạo nhân vật mới + chuyển đổi nhân vật
- [x] Sau khi tạo nhân vật → redirect về `/dashboard` thay vì `/worlds`
- [x] **Toàn bộ Việt hóa** — Dashboard, CharacterCreation, Worlds, Landing

#### 2.2 Hệ thống Narrative (Trái tim của game!) ✅ PHASE 1
- [x] `lib/narrative.ts` — 3 cây chuyện đầy đủ (Tu Tiên + Cyberpunk + Hoang Phế)
  - Tu Tiên: 15 node, nhiều nhánh, kết thúc khác nhau
  - Cyberpunk: 14 node, Project GENESIS arc, nhiều lựa chọn
  - Hoang Phế: 13 node, sinh tồn + Nexus arc
- [x] `PlayPage.tsx` (`/play`) — giao diện narrative hoàn chỉnh
  - Typewriter effect cho story text
  - Highlight chữ *in nghiêng* màu thế giới
  - Hệ thống lựa chọn A/B/C với EXP + tag
  - Bonus EXP theo hệ thống nhân vật (Kiếm Thần +combat, Thương Nhân +trade, Bất Tử +wisdom)
  - Flash EXP animation
  - Lịch sử hành động mờ dần
  - Kết thúc + nút chơi lại
- [x] Dashboard "KHÁM PHÁ" → `/play` kết nối xong
- [ ] **PHASE 2:** Tích hợp Gemini AI (khi có key) để sinh story động

#### 2.3 Hệ thống Quest / Nhiệm vụ ✅
- [x] Bảng DB: `quests` (id, character_id, world_slug, title, description, status, exp_reward, quest_type, created_at, completed_at)
- [x] API routes: `GET /api/quests/:characterId`, `POST /api/quests/generate/:characterId`, `POST /api/quests/:questId/complete`
- [x] UI: Danh sách quest trong Dashboard (tối đa 3 active), nút hoàn thành, EXP flash animation
- [x] 5 quest template per thế giới (Tu Tiên / Cyberpunk / Hoang Phế), tự động generate khi chưa đủ 3

#### 2.4 Hệ thống Tiến trình / Level ✅
- [x] Cột mới trong `characters`: `level` (integer, default 1), `exp` (integer, default 0)
- [x] Công thức: mỗi 100 EXP = 1 level, level = floor(totalExp / 100) + 1
- [x] Animation thăng cấp trên Dashboard (overlay fullscreen)
- [x] EXP được lưu DB khi: hoàn thành quest, chọn lựa trong PlayPage
- [x] API: `POST /api/characters/:characterId/exp` — cộng EXP + tự tính level
- [x] Danh hiệu/cảnh giới theo thế giới đã có sẵn (REALM_TITLES trong worlds.ts)

---

### 🟡 ƯU TIÊN 3 — TÍNH NĂNG NÂNG CAO

#### 3.1 Trang Hồ Sơ Nhân Vật (`/character/:id`)
- [ ] Xem đầy đủ thông tin nhân vật
- [ ] Lịch sử quest đã hoàn thành
- [ ] Stats dạng chart / bar
- [ ] Đổi tên nhân vật (nếu cho phép)

#### 3.2 Hệ thống Chiến Đấu
- [ ] Bảng DB: `battles` (id, character_id, enemy, result, timestamp)
- [ ] API: `POST /api/battle/start`, `POST /api/battle/action`
- [ ] Cơ chế turn-based hoặc auto-battle
- [ ] AI sinh enemy phù hợp với thế giới + level

#### 3.3 Hệ thống Vật Phẩm / Trang Bị
- [ ] Bảng DB: `items`, `inventory` (character_id, item_id, quantity)
- [ ] Phần thưởng quest có thể là item
- [ ] Trang bị ảnh hưởng stats

#### 3.4 Bảng Xếp Hạng (`/leaderboard`)
- [ ] Top nhân vật theo level trong từng thế giới
- [ ] Reset định kỳ (tuần/tháng)?

#### 3.5 Cài đặt & Hồ sơ Người Dùng (`/settings`)
- [ ] Đổi username
- [ ] Đổi mật khẩu
- [ ] Xoá tài khoản
- [ ] Tuỳ chỉnh giao diện (nếu cần)

---

### 🟢 ƯU TIÊN 4 — HOÀN THIỆN & TRIỂN KHAI

#### 4.1 API Routes Backend (Hiện chỉ có /health)
- [ ] `GET /api/characters` — lấy nhân vật của user
- [ ] `POST /api/characters` — tạo nhân vật mới (hiện đang gọi Supabase trực tiếp từ FE)
- [ ] `GET /api/worlds` — lấy danh sách thế giới
- [ ] `GET /api/quests` — lấy quest
- [ ] `POST /api/ai/narrative` — AI kể chuyện
- [ ] Middleware xác thực JWT Supabase cho tất cả routes

#### 4.2 Xử lý lỗi toàn diện
- [ ] Error boundary React
- [ ] Toast thông báo khi lỗi network
- [ ] Loading skeleton cho tất cả trang
- [ ] Offline state handling

#### 4.3 Responsive / Mobile
- [ ] Kiểm tra giao diện trên mobile
- [ ] Điều chỉnh layout cho màn hình nhỏ

#### 4.4 Triển khai (Deploy)
- [ ] Cấu hình deployment trên Replit
- [ ] Kiểm tra biến môi trường production
- [ ] Test end-to-end trước khi publish

---

## 📦 BẢNG DB HIỆN TẠI vs CẦN THÊM

| Bảng | Trạng thái | Mô tả |
|---|---|---|
| `users` | ✅ Có SQL | Profile người dùng |
| `worlds` | ✅ Có SQL | 3 thế giới |
| `characters` | ✅ Có SQL | Nhân vật người chơi |
| `quests` | ❌ Chưa có | Nhiệm vụ / quest |
| `battles` | ❌ Chưa có | Lịch sử chiến đấu |
| `items` | ❌ Chưa có | Vật phẩm |
| `inventory` | ❌ Chưa có | Túi đồ nhân vật |
| `game_events` | ❌ Chưa có | Log sự kiện narrative AI |
| `sessions` | ❌ Chưa có | Phiên chơi (cho AI context) |

---

## 🗺️ CÁC TRANG HIỆN TẠI vs CẦN THÊM

| Route | Trang | Trạng thái |
|---|---|---|
| `/` | Landing Page | ✅ Xong |
| `/login` | Đăng nhập | ✅ Xong |
| `/worlds` | Chọn thế giới | ✅ Xong |
| `/create-character/:worldId` | Tạo nhân vật | ✅ Xong |
| `/dashboard` | Dashboard nhân vật | ✅ Xong |
| `/play` | Màn chơi / Narrative (Phase 1) | ✅ Xong |
| `/quest/:id` | Chi tiết quest | ❌ Chưa có |
| `/character/:id` | Hồ sơ nhân vật | ❌ Chưa có |
| `/battle` | Chiến đấu | ❌ Chưa có |
| `/leaderboard` | Bảng xếp hạng | ❌ Chưa có |
| `/settings` | Cài đặt | ❌ Chưa có |

---

## ⚡ KHI MỞ DỰ ÁN — LÀM NGAY THEO THỨ TỰ NÀY

```
1. Kiểm tra workflow đã chạy chưa (Frontend + API Server)
2. Kiểm tra SUPABASE_URL và SUPABASE_ANON_KEY đã set chưa
3. Nhìn vào cột "Trạng thái" ở trên → tìm ❌ gần nhất ở Ưu tiên thấp nhất
4. Build tính năng đó
5. Cập nhật file này sau khi xong
```

---

## 📝 GHI CHÚ KỸ THUẬT

- **Supabase client** được init tại `artifacts/ai-world-system/src/lib/supabase.ts`
- **World constants** (danh sách hệ thống, mô tả thế giới) tại `artifacts/ai-world-system/src/lib/worlds.ts`
- **Hiện tại FE gọi Supabase trực tiếp** — cần chuyển dần sang API Server để bảo mật hơn
- **Narrative data** tại `artifacts/ai-world-system/src/lib/narrative.ts` — 3 cây chuyện ~40 node tổng, pure frontend, không cần AI key
- **AI Integration** — Replit AI Integration yêu cầu nâng cấp tài khoản. Thay thế miễn phí: Google AI Studio → https://aistudio.google.com (lấy Gemini API key free) → set secret `GEMINI_API_KEY` → tích hợp vào `/api/narrative`
- **Font chữ**: Orbitron (tiêu đề), Rajdhani (nội dung) — cyber aesthetic

---

*File này cần được cập nhật mỗi khi hoàn thành một tính năng mới.*
