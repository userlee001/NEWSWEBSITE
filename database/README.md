# 資料庫 Schema 說明

本文件說明新聞系統的 PostgreSQL 資料庫結構，包含自訂型別與三張資料表的欄位定義、關聯與約束。

---

## 自訂型別（ENUM）

### `user_role`

使用者角色，用於區分系統權限。

| 值 | 說明 |
|----|------|
| `writer` | 一般撰稿人（預設值） |
| `Admin` | 管理員 |

### `category`

新聞分類。

| 值 | 說明 |
|----|------|
| `politics` | 政治 |
| `sports` | 體育 |
| `finance` | 財經 |

---

## 資料表

### `writer`（作者）

儲存系統使用者帳號資訊。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | `UUID` | 主鍵，自動產生 |
| `authorname` | `TEXT` | 作者名稱，不可重複 |
| `password` | `TEXT` | 密碼（應儲存雜湊值） |
| `role` | `user_role` | 角色，預設為 `writer` |

---

### `news_metadata`（新聞元資料）

儲存每篇新聞的基本資訊與封面。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | `UUID` | 主鍵，自動產生 |
| `title` | `TEXT` | 新聞標題 |
| `author_id` | `UUID` | 外鍵，關聯 `writer(id)` |
| `created_at` | `TIMESTAMPTZ` | 建立時間，預設為當前時間 |
| `category` | `category` | 新聞分類 |
| `cover_image_path` | `TEXT` | 封面圖片路徑 |

**關聯：** `author_id` → `writer(id)`，作者刪除時新聞一併刪除（`ON DELETE CASCADE`）

---

### `passage_content`（新聞段落）

儲存新聞的段落內文，一篇新聞可對應多個段落。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | `UUID` | 主鍵，自動產生 |
| `content_image_path` | `TEXT` | 段落配圖路徑 |
| `content` | `TEXT` | 段落文字內容 |
| `number` | `INT` | 段落順序編號 |
| `news_id` | `UUID` | 外鍵，關聯 `news_metadata(id)` |

**關聯：** `news_id` → `news_metadata(id)`，新聞刪除時段落一併刪除（`ON DELETE CASCADE`）

**唯一約束：** `(number, news_id)` 組合不可重複，確保同一篇新聞的段落編號不重疊

---

## ER Diagram

```
writer
  │
  │ 1
  │
  ▼ N
news_metadata
  │
  │ 1
  │
  ▼ N
passage_content
```

- 一位 `writer` 可以撰寫多篇 `news_metadata`
- 一篇 `news_metadata` 可以包含多個 `passage_content`（依 `number` 排序）

---

## 注意事項

- **密碼儲存**：`writer.password` 欄位應儲存已經過雜湊處理的密碼（bcrypt）
- **ENUM 大小寫**：`user_role` 中的 `Admin` 為大寫開頭，查詢或插入時需注意大小寫完全吻合
- **段落排序**：取得新聞段落時，請依 `number` 欄位排序（`ORDER BY number ASC`）以確保正確顯示順序
- **圖片路徑**：`cover_image_path` 與 `content_image_path` 儲存的是相對路徑，對應至 Docker 環境中 `shared_images` volume 掛載的目錄