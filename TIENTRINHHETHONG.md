# 🗂️ TIẾN TRÌNH HỆ THỐNG — AI WORLD SYSTEM

> **⚠️ AGENT — ĐỌC FILE NÀY TRƯỚC TIÊN KHI MỞ DỰ ÁN**
> 1. Đọc phần **ROADMAP** để nắm toàn bộ kế hoạch
> 2. Tìm task `[ ]` đầu tiên theo thứ tự Phase 1 → 2 → 3...
> 3. Build xong → đánh `[x]` → cập nhật bảng trạng thái → ghi ngày cập nhật

> **Cập nhật lần cuối:** 16/06/2026 — Phase 2 Skills System xong (bảng character_skills, skill tree 6 hệ thống × 5 kỹ năng, API unlock, trang /skills, nút Dashboard)

---

## 🌐 TỔNG QUAN DỰ ÁN

**Tên:** AI World System
**Tầm nhìn:** Nền tảng nơi người dùng tạo thế giới riêng, AI tự sinh NPC/Quest/Boss/Lịch sử, AI quản trị như Game Master, mỗi người chơi nhận Hệ Thống khác nhau. Thế giới tồn tại ngay cả khi không có người chơi online. Sau này hỗ trợ 3D, VR, AR, MR, XR.

**Stack thực tế:**
- Frontend: React 19 + Vite 7 + TypeScript + Tailwind CSS v4 + Framer Motion + Wouter + shadcn/ui
- Backend: Express 5 (Node.js 24) — port 8080
- Database: PostgreSQL + Drizzle ORM (`DATABASE_URL` secret, Replit managed)
- Auth: **Replit Auth** (OIDC — `openid-client` + `passport`) — KHÔNG dùng Supabase
- AI: **Gemini 2.0 Flash Lite** (`@google/generative-ai`, key `GEMINI_API_KEY`)
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

## 🗺️ MASTER ROADMAP — 12 PHASES

> Agent: tìm `[ ]` đầu tiên theo thứ tự Phase và build.

### ════════════════════════════════════════
### PHASE 1 — FOUNDATION MVP ✅
### ════════════════════════════════════════

**Mục tiêu:** Người chơi đăng nhập và bắt đầu cuộc phiêu lưu đầu tiên.

#### Auth
- [x] Login (Replit Auth OIDC)
- [x] Session (PostgreSQL)
- [x] Profile (`/settings`)

#### Character
- [x] Tạo nhân vật
- [x] Chọn thế giới
- [x] Chỉ số cơ bản (6 stats)
- [x] Level + EXP system

#### Core Systems
- [x] Inventory (`/inventory`)
- [x] Quest system (`/play`)
- [x] Battle (6 modes, `/battle`)
- [x] Leaderboard (`/leaderboard`)

#### Worlds
- [x] Cultivation World (Tu Tiên)
- [x] Cyberpunk World
- [x] Wasteland World (Hoang Phế)

---

### ════════════════════════════════════════
### PHASE 2 — SYSTEM ENGINE ✅
### ════════════════════════════════════════

**Mục tiêu:** Mỗi người chơi có trải nghiệm khác nhau.

#### System Database
- [x] Kiếm Thần Hệ Thống
- [x] Luyện Đan Hệ Thống (Alchemy)
- [x] Thương Nhân Hệ Thống (Merchant)
- [x] Triệu Hồi Hệ Thống (Summoner)
- [x] Thần Thú Hệ Thống (Beast Taming)
- [x] Tử Linh Hệ Thống (Necromancer) — icon 💀, desc, SYSTEM_ICONS, SYSTEM_DESC, narrative flavor

#### System Assignment
- [x] Random khi tạo nhân vật (roulette animation)
- [x] System bonus áp dụng vào battle + narrative

#### Rule Engine
- [x] Level + EXP (100 EXP/level)
- [x] Inventory + Equip
- [x] Skills — bảng DB `character_skills`, mỗi system có skill tree riêng
- [ ] Factions — bảng DB `factions`, `character_faction`

---

### ════════════════════════════════════════
### PHASE 3 — MEMORY ENGINE ⬅️ BUILD TIẾP
### ════════════════════════════════════════

**Mục tiêu:** Thế giới nhớ người chơi.

#### Character Memory
- [x] Bảng DB `character_memories` (id, characterId, memoryType, content, importance, createdAt)
- [x] Tự động lưu memory sau mỗi AI narrative (fire-and-forget, keywords: giết/chết/boss/đột phá/cứu/phản bội...)
- [x] API `GET /api/memories/:characterId` — lấy memories, `DELETE /api/memories/:id`

#### NPC Memory
- [x] Bảng DB `npc_memories` (id, npcKey, characterId, relationship, lastInteraction, notes)

#### World Memory
- [x] Bảng DB `world_memories` (id, worldSlug, eventType, content, happenedAt)
- [x] Tự động lưu world event khi story chứa từ khóa lớn (boss bị tiêu diệt/đại chiến...)
- [x] API `GET /api/world-memories/:worldSlug`

#### AI Integration
- [x] Feed top 5 memories quan trọng nhất vào Gemini prompt (sorted by importance + createdAt)
- [x] AI sinh story có tham chiếu tự nhiên đến ký ức người chơi

#### UI
- [x] Trang `/memories` — xem ký ức cá nhân + lịch sử thế giới, xóa ký ức
- [x] Dashboard button "KÝ ỨC" → `/memories`

---

### ════════════════════════════════════════
### PHASE 4 — PERSISTENT WORLD
### ════════════════════════════════════════

**Mục tiêu:** Thế giới không reset.

#### World State
- [x] Bảng DB `world_state` (worldSlug, key, value, updatedAt) — key-value store
- [x] Boss state: alive/dead, respawn timer (24h auto-respawn)
- [x] Resource nodes: linh_thach/linh_thao/moc_ban/thiet_quang — bị khai thác thì giảm, hồi dần theo giờ

#### Resource System
- [x] Bảng DB `world_resources` (worldSlug, resourceType, quantity, maxQuantity, regenRatePerHour)
- [x] API `GET /api/world/state/:worldSlug` — lấy trạng thái thế giới hiện tại
- [x] API `POST /api/world/resources/:worldSlug/harvest` — thu thập tài nguyên
- [x] API `POST /api/world/boss/:worldSlug/:bossKey/kill` — đánh dấu boss chết
- [x] Tích hợp vào `/play` — AI phản hồi dựa trên boss alive/dead + resource level
- [x] Trang `/world/:slug/state` — dashboard boss + resource với countdown hồi sinh

#### Economy System
- [ ] Item price fluctuate theo supply/demand
- [ ] Market API — xem giá hiện tại

---

### ════════════════════════════════════════
### PHASE 5 — AI NARRATIVE ENGINE ⚠️ PARTIAL
### ════════════════════════════════════════

**Mục tiêu:** Quest và cốt truyện được AI sinh động.

#### Dynamic Story
- [x] AI (Gemini) sinh story node theo context nhân vật + world
- [x] 3 lựa chọn per node, expGain + tag
- [x] Fallback về static tree khi AI lỗi
- [x] Feed character memory + world state vào prompt

#### Free Exploration
- [x] Input text tự do trong `/play` — người chơi gõ "Tôi muốn vào rừng phía Bắc"
- [x] AI phản hồi theo `freeInput`, sinh tiếp story, +25 EXP mỗi lần gửi
- [x] Toggle giữa "Chọn" (3 buttons) và "Tự Do" (textarea + Enter/Gửi) trong nav bar

---

### ════════════════════════════════════════
### PHASE 6 — AI GAME MASTER
### ════════════════════════════════════════

**Mục tiêu:** AI quản trị thế giới.

#### Dynamic Events
- [ ] Bảng DB `world_events` (worldSlug, type, title, description, startAt, endAt, active)
- [ ] AI tự sinh sự kiện định kỳ (thiên tai, boss xuất hiện, bí cảnh mở)
- [ ] Banner sự kiện trên Dashboard

#### Reward/Punishment System
- [ ] API `POST /api/admin/event/trigger` — AI trigger event dựa trên hành động người chơi
- [ ] World karma score — thưởng/phạt dựa trên hành vi cộng đồng

#### World Monitoring Dashboard
- [ ] `/admin` route — thống kê economy, PvP, Guild, population per world
- [ ] Chỉ admin (user đầu tiên) mới vào được

---

### ════════════════════════════════════════
### PHASE 7 — MULTI AGENT NPC
### ════════════════════════════════════════

**Mục tiêu:** NPC tự sống.

- [ ] Bảng DB `npcs` (id, worldSlug, name, role, goals, personality, currentState)
- [ ] Agent loop: mỗi 5 phút AI chạy 1 turn cho mỗi NPC active
- [ ] NPC goals: kiếm tiền / bảo vệ làng / cướp bóc
- [ ] NPC interaction: mua bán, chiến đấu, liên minh
- [ ] NPC xuất hiện trong `/play` narrative

---

### ════════════════════════════════════════
### PHASE 8 — WORLD CREATOR
### ════════════════════════════════════════

**Mục tiêu:** Người chơi tạo thế giới riêng.

- [ ] Form tạo thế giới: tên, thể loại, luật, mô tả
- [ ] AI nhận input → sinh lịch sử, NPC gốc, Boss đầu, phe phái
- [ ] World được lưu vào DB, người khác có thể vào chơi

---

### ════════════════════════════════════════
### PHASE 9 — AI WORLD GENERATOR
### ════════════════════════════════════════

**Mục tiêu:** AI tự tạo thế giới hoàn chỉnh không cần input.

- [ ] AI generate World #XXXXX với lore/NPC/Quest/Boss/Dungeon/Items đầy đủ
- [ ] World discovery feed — người chơi browse các AI-generated worlds

---

### ════════════════════════════════════════
### PHASE 10 — MULTIVERSE
### ════════════════════════════════════════

**Mục tiêu:** Nhiều thế giới cùng tồn tại trên một nền tảng.

- [ ] Cross-world events (World War, Portal Events)
- [ ] Nhân vật có thể di chuyển giữa các thế giới
- [ ] World merge events

---

### ════════════════════════════════════════
### PHASE 11 — 3D WORLD
### ════════════════════════════════════════

- [ ] Unity hoặc Unreal Engine 5 client
- [ ] AI vẫn điều khiển NPC, Quest, Story, Events qua API

---

### ════════════════════════════════════════
### PHASE 12 — VR / AR / MR / XR
### ════════════════════════════════════════

- [ ] Meta Quest / Vision Pro / Android XR support
- [ ] AI đóng vai Thiên Đạo / Chủ Thần / Hệ Thống trực tiếp trong VR

---

## 📦 TRẠNG THÁI BẢNG DB

| Bảng | Trạng thái | Phase | Mô tả |
|---|---|---|---|
| `users` | ✅ | P1 | Profile Replit user |
| `sessions` | ✅ | P1 | Server-side sessions |
| `worlds` | ✅ | P1 | 3 thế giới |
| `characters` | ✅ | P1 | Nhân vật người chơi |
| `quests` | ✅ | P1 | Nhiệm vụ |
| `battles` | ✅ | P1 | Lịch sử chiến đấu |
| `items` | ✅ | P1 | Vật phẩm (24 templates × 3 worlds) |
| `inventory` | ✅ | P1 | Túi đồ nhân vật |
| `guilds` | ✅ | P1+ | Bang hội |
| `guild_members` | ✅ | P1+ | Thành viên bang hội |
| `character_memories` | ✅ | P3 | Ký ức nhân vật |
| `npc_memories` | ✅ | P3 | NPC nhớ người chơi |
| `world_memories` | ✅ | P3 | Lịch sử thế giới |
| `world_state` | ✅ | P4 | Boss alive/dead + respawn timer |
| `world_resources` | ✅ | P4 | Tài nguyên thế giới + regen tự động |
| `world_events` | ❌ | P6 | Sự kiện AI sinh |
| `npcs` | ❌ | P7 | NPC agents |
| `character_skills` | ✅ | P2 | Skill tree per system (6 hệ thống × 5 kỹ năng) |
| `factions` | ❌ | P2 | Phe phái |

---

## 🗺️ TRẠNG THÁI ROUTE

| Route | Trang | Phase | Trạng thái |
|---|---|---|---|
| `/` | Landing Page | P1 | ✅ |
| `/login` | Đăng nhập (Replit Auth) | P1 | ✅ |
| `/worlds` | Chọn thế giới | P1 | ✅ |
| `/create-character/:worldId` | Tạo nhân vật | P1 | ✅ |
| `/dashboard` | Dashboard nhân vật | P1 | ✅ |
| `/play` | AI Narrative + Khám phá | P5 | ✅ (AI mode) |
| `/character/:id` | Hồ sơ nhân vật | P1 | ✅ |
| `/leaderboard` | Bảng xếp hạng | P1 | ✅ |
| `/battle` | Chiến trường (6 mode) | P1 | ✅ |
| `/battle/history` | Lịch sử chiến đấu | P1 | ✅ |
| `/inventory` | Túi đồ / Trang bị | P1 | ✅ |
| `/settings` | Cài đặt tài khoản | P1 | ✅ |
| `/cultivate` | Tu Luyện chỉ số | P2 | ✅ |
| `/guilds` | Danh sách bang hội | P1+ | ✅ |
| `/guilds/:id` | Chi tiết bang hội | P1+ | ✅ |
| `/memories` | Ký ức hành trình | P3 | ✅ |
| `/skills` | Cây kỹ năng hệ thống | P2 | ✅ |
| `/world/:slug/state` | Trạng thái thế giới | P4 | ❌ |
| `/pvp` | PvP thách đấu | P1+ | ❌ |
| `/admin` | World Monitor | P6 | ❌ |

---

## 📝 GHI CHÚ KỸ THUẬT

- **Auth:** Replit Auth OIDC — KHÔNG dùng Supabase. Cookie session qua `express-session`.
- **DB:** Drizzle ORM + PostgreSQL. Schema thay đổi → `pnpm --filter @workspace/db run push`
- **AI:** Gemini 2.0 Flash Lite — model `gemini-2.0-flash-lite`, key `GEMINI_API_KEY`
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
3. Tìm task [ ] đầu tiên trong ROADMAP theo thứ tự Phase 1 → 2 → 3...
4. Build task đó (không cần hỏi user nếu task rõ ràng)
5. Sau khi xong:
   - Đánh [x] vào task đã hoàn thành
   - Cập nhật bảng DB và bảng Route nếu cần
   - Ghi ngày "Cập nhật lần cuối" ở đầu file
6. Tiếp tục task tiếp theo cho đến khi không còn task nào unblocked
```

*Cập nhật file này ngay sau khi hoàn thành mỗi tính năng.*
