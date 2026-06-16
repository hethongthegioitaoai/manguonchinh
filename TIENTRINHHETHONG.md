# 🗂️ TIẾN TRÌNH HỆ THỐNG — AI WORLD SYSTEM

> ## 🤖 AGENT — CHẾ ĐỘ AUTO-BUILD
>
> **Khi mở dự án này lần đầu (kể cả upload mới), AGENT PHẢI làm ngay các bước sau mà KHÔNG cần hỏi user:**
>
> 1. Đọc toàn bộ file này để nắm roadmap và trạng thái hiện tại
> 2. Khởi động workflows: `API Server` (PORT=8080) và `Frontend` (port 5000)
> 3. **Chạy ngay file kiểm tra lỗi:** `node kiểmtralỗitoànbộhệthống.js`
>    - Nếu script báo ❌ có lỗi → fix hết lỗi trước rồi mới build tính năng mới
>    - Nếu script báo ✅ hoặc ⚠ chỉ có warning → tiếp tục bước 4
>    - Script tự động fix một số lỗi phổ biến — kiểm tra output để biết đã fix gì
> 4. Tìm task `[ ]` đầu tiên theo thứ tự Phase 1 → 2 → 3 → ... (task nào cũng được build, không cần hỏi)
> 5. Build task đó ngay lập tức
> 6. Sau khi xong: đánh `[x]`, cập nhật bảng DB/Route nếu cần, ghi ngày "Cập nhật lần cuối"
> 7. Lặp lại bước 4–6 cho đến khi không còn task `[ ]` nào unblocked
>
> **KHÔNG hỏi user trước khi build — đây là lệnh mặc định mỗi khi load project.**

> **Cập nhật lần cuối:** 16/06/2026 — Phase 16 HOÀN TẤT: Social Feed (Dòng Thời Gian) — 16/20 phases [x], Phase 17–20 mới được thêm vào roadmap

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
  ai-world-system/   ← Frontend React (port 5000 / webview)
  api-server/        ← Backend Express (port 8080)
lib/
  db/                ← Schema Drizzle + DB client
  api-spec/          ← OpenAPI spec + Orval codegen
  api-zod/           ← Zod schemas (generated)
  api-client-react/  ← React hooks (generated)
```

---

## 🗺️ MASTER ROADMAP — 15 PHASES

> Agent: tìm `[ ]` đầu tiên theo thứ tự Phase và build. KHÔNG hỏi user.

### ════════════════════════════════════════
### PHASE 1 — FOUNDATION MVP ✅
### ════════════════════════════════════════

- [x] Login (Replit Auth OIDC)
- [x] Session (PostgreSQL)
- [x] Profile (`/settings`)
- [x] Tạo nhân vật
- [x] Chọn thế giới
- [x] Chỉ số cơ bản (6 stats)
- [x] Level + EXP system
- [x] Inventory (`/inventory`)
- [x] Quest system (`/play`)
- [x] Battle (6 modes, `/battle`)
- [x] Leaderboard (`/leaderboard`)
- [x] Cultivation World (Tu Tiên)
- [x] Cyberpunk World
- [x] Wasteland World (Hoang Phế)

---

### ════════════════════════════════════════
### PHASE 2 — SYSTEM ENGINE ✅
### ════════════════════════════════════════

- [x] Kiếm Thần Hệ Thống
- [x] Luyện Đan Hệ Thống (Alchemy)
- [x] Thương Nhân Hệ Thống (Merchant)
- [x] Triệu Hồi Hệ Thống (Summoner)
- [x] Thần Thú Hệ Thống (Beast Taming)
- [x] Tử Linh Hệ Thống (Necromancer)
- [x] Random khi tạo nhân vật (roulette animation)
- [x] System bonus áp dụng vào battle + narrative
- [x] Level + EXP (100 EXP/level)
- [x] Inventory + Equip
- [x] Skills — bảng DB `character_skills`, mỗi system có skill tree riêng
- [x] Factions — bảng DB `factions`, `character_faction`

---

### ════════════════════════════════════════
### PHASE 3 — MEMORY ENGINE ✅
### ════════════════════════════════════════

- [x] Bảng DB `character_memories`
- [x] Tự động lưu memory sau mỗi AI narrative
- [x] API GET /api/memories/:characterId + DELETE /api/memories/:id
- [x] Bảng DB `npc_memories`
- [x] Bảng DB `world_memories`
- [x] Tự động lưu world event khi story chứa từ khóa lớn
- [x] API GET /api/world-memories/:worldSlug
- [x] Feed top 5 memories vào Gemini prompt
- [x] Trang `/memories` — xem ký ức cá nhân + lịch sử thế giới

---

### ════════════════════════════════════════
### PHASE 4 — PERSISTENT WORLD ✅
### ════════════════════════════════════════

- [x] Bảng DB `world_state` — key-value store
- [x] Boss state: alive/dead, respawn timer 24h
- [x] Bảng DB `world_resources` — regen theo giờ
- [x] API GET /api/world/state/:worldSlug
- [x] API POST /api/world/resources/:worldSlug/harvest
- [x] API POST /api/world/boss/:worldSlug/:bossKey/kill
- [x] Tích hợp vào `/play`
- [x] Trang `/world/:slug/state` — dashboard boss + resource + countdown
- [x] Item price fluctuate — bảng `market_prices`
- [x] Market API

---

### ════════════════════════════════════════
### PHASE 5 — AI NARRATIVE ENGINE ✅
### ════════════════════════════════════════

- [x] AI (Gemini) sinh story node theo context nhân vật + world
- [x] 3 lựa chọn per node, expGain + tag
- [x] Fallback về static tree khi AI lỗi
- [x] Feed character memory + world state vào prompt
- [x] Input text tự do trong `/play`
- [x] AI phản hồi theo freeInput, +25 EXP mỗi lần gửi
- [x] Toggle "Chọn" (3 buttons) và "Tự Do" (textarea)

---

### ════════════════════════════════════════
### PHASE 6 — AI GAME MASTER ✅
### ════════════════════════════════════════

- [x] Bảng DB `world_events`
- [x] AI tự sinh sự kiện định kỳ (Gemini 2.0 Flash Lite)
- [x] Banner sự kiện trên Dashboard
- [x] API POST /api/admin/event/trigger
- [x] World karma score
- [x] `/admin` route — population, avg level, active events, karma per world

---

### ════════════════════════════════════════
### PHASE 7 — MULTI AGENT NPC ✅
### ════════════════════════════════════════

- [x] Bảng DB `npcs`
- [x] Agent loop: admin tick AI chạy 1 turn cho mỗi NPC
- [x] NPC goals: kiếm tiền / bảo vệ làng / cướp bóc / ám sát / hiền giả
- [x] NPC interaction: hội thoại tự do với AI
- [x] 7 loại NPC, seed 3 NPC per world tự động

---

### ════════════════════════════════════════
### PHASE 8 — WORLD CREATOR ✅
### ════════════════════════════════════════

- [x] Form tạo thế giới: tên, thể loại, luật, mô tả
- [x] AI nhận input → sinh lịch sử, NPC gốc, Boss đầu, phe phái
- [x] World được lưu vào DB, người khác có thể vào chơi

---

### ════════════════════════════════════════
### PHASE 9 — AI WORLD GENERATOR ✅
### ════════════════════════════════════════

- [x] AI generate World #XXXXX với lore/NPC/Quest/Boss/Dungeon/Items đầy đủ
- [x] World discovery feed — người chơi browse các AI-generated worlds

---

### ════════════════════════════════════════
### PHASE 10 — MULTIVERSE ✅
### ════════════════════════════════════════

- [x] Cross-world events (World War, Portal Events)
- [x] Nhân vật có thể di chuyển giữa các thế giới
- [x] World merge events

---

### ════════════════════════════════════════
### PHASE 11 — ACHIEVEMENT SYSTEM ✅
### ════════════════════════════════════════

**Mục tiêu:** Người chơi có mục tiêu dài hạn — mở khóa thành tựu, flex với bạn bè.

- [x] Bảng DB `achievements` (key, title, desc, icon, category, xpReward, condition)
- [x] Bảng DB `character_achievements` (characterId, achievementKey, unlockedAt)
- [x] Seed 30 thành tựu theo 5 danh mục: Chiến Đấu / Tu Luyện / Khám Phá / Xã Hội / Bí Ẩn
- [x] API GET /api/achievements/:characterId — trả về tất cả + trạng thái unlocked
- [x] API POST /api/achievements/check/:characterId — auto-check + unlock ngay
- [x] Trigger check sau: battle win, pvp win, quest complete, level up, harvest
- [x] Trang `/achievements` — grid thành tựu, badge đã mở, tiến độ, EXP nhận được
- [x] Nút Dashboard "THÀNH TỰU"

---

### ════════════════════════════════════════
### PHASE 12 — DAILY REWARDS
### ════════════════════════════════════════

**Mục tiêu:** Người chơi quay lại mỗi ngày để nhận thưởng.

- [x] Bảng DB `daily_logins` (userId, loginDate, streak, rewardClaimed)
- [x] Daily reward theo streak: ngày 1=50 EXP, 2=100 EXP, 3=150 EXP, 4=200 EXP, 5=item thường, 6=300 EXP, 7=item hiếm
- [x] API POST /api/daily/claim — nhận thưởng hôm nay, tính streak
- [x] API GET /api/daily/status — xem streak hiện tại + phần thưởng hôm nay
- [x] Trang `/daily` — lịch 7 ngày, xem streak, nút claim
- [x] Nút Dashboard "ĐIỂM DANH"

---

### ════════════════════════════════════════
### PHASE 13 — DUNGEON SYSTEM
### ════════════════════════════════════════

**Mục tiêu:** Thách thức nhiều tầng liên tiếp, HP không hồi giữa các tầng.

- [x] Bảng DB `dungeons` (id, worldSlug, name, floors, minLevel, description)
- [x] Bảng DB `dungeon_runs` (id, characterId, dungeonId, floor, status, loot, createdAt)
- [x] Seed 9 dungeon (3 per world: dễ/vừa/khó, 5–10 tầng)
- [x] API POST /api/dungeon/start/:dungeonId — bắt đầu run, lưu HP hiện tại
- [x] API POST /api/dungeon/advance — chiến tầng tiếp, HP giảm tích lũy
- [x] Loot system: mỗi tầng drop item ngẫu nhiên theo tier (common→epic)
- [x] API GET /api/dungeon/list/:worldSlug + /api/dungeon/active + /api/dungeon/history/:characterId
- [x] Trang `/dungeon` — chọn dungeon, xem tầng, chiến đấu multi-floor, lịch sử
- [x] Nút Dashboard "NGỤC TỐI"

---

### ════════════════════════════════════════
### PHASE 14 — CRAFTING SYSTEM
### ════════════════════════════════════════

**Mục tiêu:** Người chơi kết hợp vật phẩm để tạo đồ mạnh hơn.

- [x] Bảng DB `recipes` (id, name, worldSlug, materials jsonb, resultItem, resultRarity, requiredLevel)
- [x] Seed 7–8 recipe per world (weapon/armor/accessory/consumable/special × basic/mid/high)
- [x] API GET /api/craft/recipes/:worldSlug — trả về availability dựa trên inventory
- [x] API POST /api/craft/make — kiểm tra materials trong inventory, tạo item mới, +EXP
- [x] Trang `/craft` — xem recipes theo category, filter, nút craft
- [x] Nút Dashboard "CHẾ TẠO"

---

### ════════════════════════════════════════
### PHASE 15 — CLAN WAR ✅
### ════════════════════════════════════════

**Mục tiêu:** Bang hội thách đấu bang hội khác, điểm từ PvP thành viên.

- [x] Bảng DB `clan_wars` (id, guildId1, guildId2, startAt, endAt, score1, score2, active, winnerId)
- [x] API POST /api/guild-war/declare/:targetGuildId — guild leader khai chiến
- [x] API GET /api/guild-war/status — xem chiến tranh đang diễn ra + lịch sử + danh sách bang
- [x] Auto-end sau 24h, tính tổng điểm, xác định kẻ thắng (trigger khi GET status)
- [x] PvP thành viên 2 bang tự động cộng điểm qua `addPvpScoreToWar()`
- [x] Trang `/guild-war` — tuyên chiến, bảng điểm realtime, lịch sử
- [x] Reward: bang thắng nhận +50 uy tín phe phái cho tất cả thành viên
- [x] Nút Dashboard "CHIẾN TRANH BANG"

---

### ════════════════════════════════════════
### PHASE 16 — SOCIAL FEED (DÒNG THỜI GIAN) ✅
### ════════════════════════════════════════

**Mục tiêu:** Người chơi chia sẻ khoảnh khắc hành trình — toàn server thấy, like, react.

- [x] Bảng DB `story_posts` (id, characterId, userId, worldSlug, authorName, authorSystem, authorLevel, content, postType, metadata, likes, createdAt)
- [x] Bảng DB `post_likes` (id, postId, userId, createdAt)
- [x] API GET /api/feed — lấy tất cả posts, filter theo world, phân trang
- [x] API POST /api/feed — đăng bài thủ công (manual)
- [x] API POST /api/feed/auto — auto-post từ sự kiện game (battle/quest/achievement/dungeon/levelup)
- [x] API POST /api/feed/:postId/like — like / unlike toggle
- [x] API DELETE /api/feed/:postId — xoá bài của mình
- [x] 8 loại postType: manual/battle/quest/achievement/dungeon/levelup/pvp/craft
- [x] Trang `/feed` — compose box, filter theo world, timeline, like, xoá, load more
- [x] Nút Dashboard "DÒNG THỜI GIAN"

---

### ════════════════════════════════════════
### PHASE 17 — GOD MODE (THẦN CHỦ HỆ THỐNG) ✅
### ════════════════════════════════════════

**Mục tiêu:** User là Thần của thế giới họ tạo — can thiệp trực tiếp, NPC thờ phụng creator.

- [x] Bảng DB `divine_actions` (id, worldSlug, creatorUserId, actionType, targetNpcId, content, aiEffect, createdAt)
- [x] Bảng DB `npc_prayers` (id, npcId, worldSlug, prayerContent, answered, answerContent, answeredAt, createdAt)
- [x] API GET /api/god/my-worlds — danh sách thế giới user đã tạo
- [x] API GET /api/god/world/:worldSlug — NPC + prayers + recentActions
- [x] API POST /api/god/prayers/generate/:worldSlug — AI sinh prayers từ NPC
- [x] API POST /api/god/intervene/:worldSlug — Thần gửi thần khải (AI sinh hiệu ứng + tạo world event)
- [x] API POST /api/god/bless/:npcId — ban phước cho NPC (buff stats 24h)
- [x] API POST /api/god/smite/:npcId — trừng phạt NPC (debuff 12h hoặc khai trừ vĩnh viễn)
- [x] API POST /api/god/answer-prayer/:prayerId — Thần đáp lại lời cầu nguyện
- [x] Trang `/god` — chọn thế giới; `/god/:worldSlug` — bảng điều khiển Thần (3 tab: NPC / Cầu Nguyện / Thần Sử)
- [x] Nút Dashboard "CHẾ ĐỘ THẦN"

---

### ════════════════════════════════════════
### PHASE 18 — INTER-WORLD TRADE (GIAO THƯƠNG LIÊN THẾ GIỚI) ✅
### ════════════════════════════════════════

**Mục tiêu:** Các thế giới của các user khác nhau trao đổi item qua "Cổng Thương Mại".

- [x] Bảng DB `world_trade_listings` (id, sellerCharacterId, fromWorldSlug, toWorldSlug, itemId, quantity, priceGold, expiresAt, status)
- [x] Bảng DB `world_trade_history` (id, listingId, buyerCharacterId, renamedItemName, soldAt, priceGold)
- [x] API GET /api/world-trade — danh sách listing active, filter theo world
- [x] API GET /api/world-trade/my-chars — nhân vật + gold + inventory của user
- [x] API GET /api/world-trade/history — lịch sử giao dịch toàn server
- [x] API POST /api/world-trade/list — đăng bán item (trừ inventory, hết hạn 48h)
- [x] API POST /api/world-trade/:listingId/buy — mua item cross-world (phí cổng 5%)
- [x] API DELETE /api/world-trade/:listingId/cancel — huỷ listing + hoàn item
- [x] Hiệu ứng Rào Cản Thế Giới — AI rename item khi mua cross-world
- [x] Trang `/world-trade` — CHỢ (filter + mua), ĐĂng BÁN (chọn char/item/qty/price), LỊCH SỬ
- [x] Nút Dashboard "GIAO THƯƠNG LIÊN THẾ GIỚI"

---

### ════════════════════════════════════════
### PHASE 19 — WORLD PASSPORT (HỘ CHIẾU DU HÀNH) ✅
### ════════════════════════════════════════

**Mục tiêu:** Nhân vật có "hộ chiếu" du hành — vào thế giới người khác với identity riêng, creator kiểm soát ai được vào.

- [x] Bảng DB `world_passports` (id, characterId, worldSlug, status, requestNote, creatorNote, entryCount, bannedAt, approvedAt, createdAt)
- [x] Bảng DB `world_entry_log` (id, characterId, worldSlug, enteredAt, leftAt, reason)
- [x] API GET /api/passport/worlds — danh sách custom worlds public (không phải của mình)
- [x] API GET /api/passport/my — tất cả hộ chiếu của user (enriched với world + char)
- [x] API GET /api/passport/visitors/:worldSlug — creator xem khách trong thế giới
- [x] API POST /api/passport/request/:worldSlug — xin nhập cảnh + lời xin tuỳ chọn
- [x] API POST /api/passport/approve/:passportId — creator phê duyệt
- [x] API POST /api/passport/ban/:passportId — creator ban/kick + ghi lý do
- [x] API GET /api/passport/visit/:worldSlug — xem thế giới qua mắt khách (AI welcome narrative, readonly)
- [x] Trang `/passport` — KHÁM PHÁ, HỘ CHIẾU CỦA TÔI, QUẢN LÝ KHÁCH (3 tab)
- [x] Nút Dashboard "HỘ CHIẾU DU HÀNH"

---

### ════════════════════════════════════════
### PHASE 22 — FATE SYSTEM (MỆNH SỐ & VẬN MỆNH) ✅
### ════════════════════════════════════════

**Mục tiêu:** Mỗi nhân vật có Mệnh Số riêng (1-9) do hệ thống tính từ tên + level + ngày tạo. Mệnh Số quyết định xác suất Cát/Hung khi kích hoạt Mệnh Cục. AI sinh mô tả sự kiện + giải quẻ Thiên Cơ.

- [x] Bảng DB `fate_events` (id, characterId, fateNumber, eventType: cat/hung/trung_binh, title, description, effect jsonb, duration, active, expiresAt)
- [x] Bảng DB `fate_readings` (id, characterId, fateNumber, hexagram, hexagramName, reading, advice, luckyElement)
- [x] Tính Mệnh Số từ tên + level + ngày tạo (1–9, loại số học)
- [x] 8 quẻ Bát Quái (☰☱☲☳☴☵☶☷) gắn với Mệnh Số + Ngũ Hành
- [x] Weights Cát/Hung khác nhau theo từng Mệnh Số (Mệnh 3 phúc nhiều, Mệnh 7 hung nhiều)
- [x] 13 template event Cát (5), Hung (5), Bình (3) với effect thực tế (EXP bonus/penalty, gold, crit%, drop%)
- [x] Apply immediate effect ngay khi trigger (EXP/gold cộng/trừ thực sự)
- [x] API GET /api/fate/char/:characterId — Mệnh Số + active events + last reading + history
- [x] API GET /api/fate/my-chars — nhân vật của user
- [x] API POST /api/fate/trigger/:characterId — kích hoạt Mệnh Cục (cooldown 1h, AI sinh description)
- [x] API POST /api/fate/consult/:characterId — giải quẻ AI Thiên Cơ Tiên (cooldown 2h)
- [x] Trang `/fate` — hexagram visual xoay, Mệnh Số card, active events, lịch sử
- [x] Nút Dashboard "MỆNH SỐ & VẬN MỆNH"

---

### PHASE 21 — ISEKAI PORTAL (CỔNG XUYÊN KHÔNG) ✅
### ════════════════════════════════════════

**Mục tiêu:** Người chơi kích hoạt cổng xuyên không — bị cuốn ngẫu nhiên vào thế giới khác, AI sinh tên mới + cảnh mở đầu cinematic + System grant thiên phú đặc biệt.

- [x] Bảng DB `isekai_records` (id, userId, fromCharacterId, fromWorldSlug, toWorldSlug, isekaiName, isekaiClass, openingNarrative, systemGrant, systemAbility, worldReaction, metadata jsonb)
- [x] API GET /api/isekai/worlds — nhân vật của user (nguồn xuyên không)
- [x] API GET /api/isekai/my — lịch sử xuyên không
- [x] API GET /api/isekai/record/:id — chi tiết 1 record
- [x] API POST /api/isekai/enter — kích hoạt cổng: random thế giới đích (builtin + custom public), AI sinh identity mới + narrative + system grant + thiên phú
- [x] Pool đích: 3 builtin worlds + tất cả customWorlds public của người khác (loại trừ world hiện tại)
- [x] AI sinh isekaiName phù hợp văn hóa thế giới đích
- [x] AI sinh openingNarrative 4-5 câu cinematic (cảnh bị hút vào cổng, tỉnh dậy, phản ứng xung quanh)
- [x] AI sinh systemGrant (thông báo System kiểu isekai anime) + systemAbility (1 thiên phú đặc biệt)
- [x] Tạo world_event "⚡ Dị Khách Xuyên Không" ở thế giới đích khi có người isekai đến
- [x] Trang `/isekai` — portal visual xoay 360°, chọn nhân vật, kích hoạt, hiển thị result card + history accordion
- [x] Nút Dashboard "CỔNG XUYÊN KHÔNG" tag "ISEKAI"

---

### PHASE 20 — DIVINE PROPHECY & ORACLE (THẦN KHẢI & TIÊN TRI) ✅
### ════════════════════════════════════════

**Mục tiêu:** AI sinh ra "thần khải" định kỳ cho từng thế giới — dự báo sự kiện lớn, người chơi giải mã lời tiên tri để nhận thưởng.

- [x] Bảng DB `prophecies` (id, worldSlug, content, hiddenCondition, clue, reward jsonb, isActive, fulfilledAt, fulfilledBy, generatedAt)
- [x] Bảng DB `prophecy_claims` (id, prophecyId, characterId, proof, score, status, judgedAt, claimedAt)
- [x] AI (Gemini) sinh prophecy dạng thơ/ẩn dụ + hiddenCondition + clue khi creator trigger
- [x] API GET /api/prophecy/:worldSlug — active tiên tri + lịch sử đã ứng nghiệm
- [x] API POST /api/prophecy/generate/:worldSlug — creator (hoặc bất kỳ user) triệu Oracle
- [x] API POST /api/prophecy/claim/:prophecyId — submit claim + AI chấm 0-100
- [x] Auto-approve ≥80 → trao reward ngay (EXP, gold, title) + mark fulfilled
- [x] API GET /api/prophecy/claims/:prophecyId — creator xem tất cả claims
- [x] API POST /api/prophecy/judge/:claimId — creator approve/reject thủ công
- [x] Reward: +800 EXP, +300 vàng, title "Kẻ Giải Mã Tiên Tri"
- [x] Trang `/prophecy` — sidebar world list, panel tiên tri active, clue, submit claim, lịch sử fulfilled
- [x] Nút Dashboard "THẦN KHẢI & TIÊN TRI"

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
| `market_prices` | ✅ | P4 | Giá item dao động theo supply/demand |
| `world_events` | ✅ | P6 | Sự kiện AI sinh — 7 loại, karma tracking |
| `npcs` | ✅ | P7 | NPC agents — 7 vai trò, AI tick + interact |
| `character_skills` | ✅ | P2 | Skill tree per system (6 hệ thống × 5 kỹ năng) |
| `factions` | ✅ | P2 | 4 phe phái × 3 thế giới (seeded tự động) |
| `character_faction` | ✅ | P2 | Tư cách thành viên + điểm uy tín |
| `custom_worlds` | ✅ | P8 | Thế giới do người chơi/AI tạo |
| `cross_world_events` | ✅ | P10 | Sự kiện xuyên thế giới (portal/war/merge) |
| `character_world_travel` | ✅ | P10 | Lịch sử di chuyển nhân vật giữa thế giới |
| `pvp_rankings` | ✅ | P1+ | PvP ranking: RP Elo, tier, streak |
| `achievements` | ✅ | P11 | 30 thành tựu theo 5 danh mục |
| `character_achievements` | ✅ | P11 | Thành tựu đã mở khóa của nhân vật |
| `daily_logins` | ✅ | P12 | Daily login streak + reward |
| `dungeons` | ✅ | P13 | 9 dungeon (3 per world: easy/normal/hard) |
| `dungeon_runs` | ✅ | P13 | Lịch sử run dungeon (loot jsonb) |
| `recipes` | ✅ | P14 | Công thức chế tạo — 7–8 per world |
| `clan_wars` | ✅ | P15 | Chiến tranh bang hội 24h, auto-end |
| `story_posts` | ✅ | P16 | Bài đăng hành trình — 8 loại postType, likes |
| `post_likes` | ✅ | P16 | Like toggle per user per post |
| `divine_actions` | ✅ | P17 | Thần can thiệp thế giới: intervene/bless/smite/answer |
| `npc_prayers` | ✅ | P17 | Lời cầu nguyện NPC gửi lên creator — AI sinh tự động |
| `world_trade_listings` | ✅ | P18 | Cross-world item listings (48h expire, phí cổng 5%) |
| `world_trade_history` | ✅ | P18 | Lịch sử giao dịch + tên item sau khi qua Rào Cản |
| `world_passports` | ✅ | P19 | Hộ chiếu du hành — pending/approved/banned |
| `world_entry_log` | ✅ | P19 | Log mỗi lần nhân vật enter/exit thế giới |
| `prophecies` | ✅ | P20 | Lời tiên tri AI sinh — thơ/ẩn dụ + hiddenCondition |
| `prophecy_claims` | ✅ | P20 | Claim + AI scoring 0-100 + auto-approve ≥80 |
| `isekai_records` | ✅ | P21 | Lịch sử xuyên không — identity mới + narrative + system grant |
| `fate_events` | ✅ | P22 | Mệnh Cục Cát/Hung — effect thực tế, cooldown 1h |
| `fate_readings` | ✅ | P22 | Giải quẻ Bát Quái AI — Thiên Cơ Tiên phán, cooldown 2h |

---

## 🗺️ TRẠNG THÁI ROUTE

| Route | Trang | Phase | Trạng thái |
|---|---|---|---|
| `/` | Landing Page | P1 | ✅ |
| `/login` | Đăng nhập (Replit Auth) | P1 | ✅ |
| `/worlds` | Chọn thế giới | P1 | ✅ |
| `/create-character/:worldId` | Tạo nhân vật | P1 | ✅ |
| `/dashboard` | Dashboard nhân vật | P1 | ✅ |
| `/play` | AI Narrative + Khám phá | P5 | ✅ |
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
| `/factions` | Phe phái thế giới | P2 | ✅ |
| `/market` | Chợ đen — mua/bán | P4 | ✅ |
| `/world/:slug/state` | Trạng thái thế giới | P4 | ✅ |
| `/world-creator` | Tạo thế giới (AI) | P8 | ✅ |
| `/world-discover` | Khám phá thế giới AI + cộng đồng | P9 | ✅ |
| `/multiverse` | Đa vũ trụ — du hành, sự kiện xuyên TG | P10 | ✅ |
| `/pvp` | PvP thách đấu + ranking | P1+ | ✅ |
| `/admin` | World Monitor | P6 | ✅ |
| `/achievements` | Thành tựu | P11 | ✅ |
| `/daily` | Daily Login Rewards | P12 | ✅ |
| `/dungeon` | Ngục Tối — multi-floor | P13 | ✅ |
| `/craft` | Chế Tạo vật phẩm | P14 | ✅ |
| `/guild-war` | Chiến Tranh Bang Hội | P15 | ✅ |
| `/feed` | Dòng Thời Gian (Social Feed) | P16 | ✅ |
| `/god` | Chế Độ Thần — chọn thế giới | P17 | ✅ |
| `/god/:worldSlug` | Bảng điều khiển Thần | P17 | ✅ |
| `/world-trade` | Giao Thương Liên Thế Giới | P18 | ✅ |
| `/passport` | Hộ Chiếu Du Hành | P19 | ✅ |
| `/prophecy` | Thần Khải & Tiên Tri | P20 | ✅ |
| `/isekai` | Cổng Xuyên Không | P21 | ✅ |
| `/fate` | Mệnh Số & Vận Mệnh | P22 | ✅ |

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

## ⚡ HƯỚNG DẪN CHI TIẾT CHO AGENT

### Bước 1 — Khởi động môi trường
```
configureWorkflow("API Server", "PORT=8080 pnpm --filter @workspace/api-server run dev", port 8080)
configureWorkflow("Frontend", "pnpm --filter @workspace/ai-world-system run dev", port 5000, webview)
```

### Bước 2 — Xác định task tiếp theo
```
- Quét ROADMAP từ Phase 1 xuống, tìm [ ] đầu tiên chưa làm
- Nếu task thuộc loại "Bảng DB mới" → phải chạy:
    pnpm --filter @workspace/db run push
  sau khi thêm schema
- Nếu task thuộc loại "API mới" → thêm route + đăng ký vào routes/index.ts + restart API Server
- Nếu task thuộc loại "Trang FE mới" → tạo page + thêm vào App.tsx + thêm nút Dashboard
```

### Bước 3 — Build
```
- Đọc các file liên quan trước khi viết code (match pattern hiện tại)
- Chạy song song các file không phụ thuộc nhau
- Không tạo mock data — build chức năng thật
- Toàn bộ UI bằng tiếng Việt, aesthetic: cyber cultivation tối tăm (cyan/red/purple trên nền đen)
```

### Bước 4 — Hoàn thành
```
- Đánh [x] task vừa xong trong file này
- Cập nhật bảng "TRẠNG THÁI BẢNG DB" nếu có bảng mới
- Cập nhật bảng "TRẠNG THÁI ROUTE" nếu có route mới
- Cập nhật dòng "Cập nhật lần cuối" ở đầu file
- Tiếp tục task tiếp theo NGAY (không dừng lại hỏi user)
```

### Quy tắc bất biến
```
✅ Auto-build tất cả task [ ] khi mở project — không hỏi user
✅ Schema thay đổi → pnpm --filter @workspace/db run push NGAY
✅ Backend sửa → restart workflow "API Server" NGAY
✅ Frontend Vite hot-reload tự động — không cần restart
✅ Dùng Replit Auth, KHÔNG dùng Supabase
✅ AI dùng Gemini 2.0 Flash Lite (GEMINI_API_KEY)
❌ KHÔNG tạo file README mới, KHÔNG thêm comment thừa
❌ KHÔNG hỏi user trước khi build task đã rõ ràng trong roadmap
```

*Cập nhật file này ngay sau khi hoàn thành mỗi tính năng.*
