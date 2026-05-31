# 更新紀錄（Changelog）


## [2.2.0] - 2026-06-01 

### 新增 (Added)
- **管理員後台介面 (Administrator Panel)**：新增 `administrator-panel` 前端專案，提供管理者專屬的視覺化操作介面，大幅提升系統管理的便利性與直覺性。

## [2.1.0] - 2026-05-29

### 新增（Added）
- 新增 `audit_log` 資料表，用於全系統操作行為追蹤
- 新增 `audit_log_target_information` 資料表，用於記錄受影響的資料實體（target entities）
- 新增認證流程的操作紀錄：
  - 使用者註冊
  - 使用者登入
- 新增 writer 相關操作紀錄：
  - 新聞建立
  - 新聞更新
  - 新聞刪除
- 新增新聞相關操作紀錄，包括：
  - 中繼資料（metadata）變更
  - 段落內容（passage/content）更新

### 調整（Changed）
- 強化後端 middleware，支援透過 `response.on("finish")` 在 response 結束後進行 audit log 紀錄
- 統一 audit payload 結構，使用 `response.locals.audit` 傳遞資料

### 說明（Notes）
- 所有 audit log 皆為非同步記錄，於 response 完成後寫入資料庫
- target information 採用關聯式設計，用於記錄操作影響的資料表與資料 ID

### 安全性（Security）
- audit log 包含使用者識別資訊、IP 位址與 User-Agent，用於操作追蹤與安全審計

---

## [2.0.1] - 2026-05-28

### 修正（Fixed）
- 修正 writer/list 點擊新聞後無法正常跳轉的問題
- 修正 writer/update 頁面無法顯示既有封面圖片的問題