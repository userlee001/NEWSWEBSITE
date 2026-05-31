# Database 說明文件

## 概述

此部分為新聞網站微服務架構中的「資料庫服務層」。作為全站資料持久化的核心核心，本模組不僅負責儲存系統中的所有實體資料，更透過嚴謹的關聯式資料庫設計 (Relational Database Design)、自訂列舉型別 (ENUM) 與各項約束條件 (Constraints)，在資料庫底層強制保證資料的一致性與完整性。

此部分完全容器化，並利用 PostgreSQL 官方映像檔的特性，實現了「開箱即用、自動初始化」的無縫部署體驗。

---

# 技術架構與核心配置

* 核心資料庫引擎：PostgreSQL 18 (基於輕量化的 alpine Linux)
* 部署與運行環境：Docker (`postgres:18-alpine` 映像檔)
* 主鍵生成機制：全面採用 `gen_random_uuid()` 作為預設值，利用 UUID (v4) 取代傳統自增整數 (Serial)，以提升分散式架構下的安全性並防止 ID 猜測攻擊。
* 時間處理：使用 `TIMESTAMPTZ` (Timestamp with Time Zone)，確保所有寫入資料庫的時間皆帶有時區資訊，精準記錄發布與操作時間。

---

# 資料庫結構深度解析 (Database Schema)

本系統的初始化腳本 (`init.sql`) 共定義了 2 個自訂型別與 5 張核心資料表：

## 1. 系統自訂列舉型別 (Custom ENUM Types)

透過在資料庫層級定義 ENUM，可以防止應用程式寫入非預期的無效字串。

* `user_role`

  * 限制系統角色僅能為 `'writer'` 或 `'Admin'`

* `category`

  * 限制新聞分類僅能為：

    * `'politics'` (政治)
    * `'sports'` (體育)
    * `'finance'` (財經)

---

## 2. 帳號與權限管理 (writer)

儲存所有註冊作者與系統管理員的核心表。

* `id`

  * UUID，主鍵

* `authorname`

  * TEXT
  * 設定為 `NOT NULL UNIQUE`
  * 保證系統中不會出現重複的帳號名稱

* `password`

  * TEXT
  * 用於儲存經過 bcrypt 雜湊處理後的密碼字串

* `role`

  * `user_role` 型別
  * 預設值為 `'writer'`
  * 確保新建帳號預設為一般作者權限

---

## 3. 新聞內容管理 (news_metadata & passage_content)

採用「主從表 (Master-Detail)」架構，完美支援新聞的：

```text
一張封面搭配無限多段圖文
```

需求。

### news_metadata (新聞元資料表)

* `id`

  * UUID，主鍵

* `title`

  * 新聞主標題

* `author_id`

  * UUID
  * 設定：

```sql
REFERENCES writer(id) ON DELETE CASCADE
```

當作者帳號被強制註銷刪除時，該作者發表的所有新聞也會被資料庫自動級聯刪除，不會留下孤兒資料。

* `category`

  * `category` 型別
  * 紀錄新聞分類

* `cover_image_path`

  * TEXT
  * 紀錄封面圖片實體檔案的路徑或檔名

---

### passage_content (新聞段落內容表)

* `id`

  * UUID，主鍵

* `news_id`

  * UUID
  * 設定：

```sql
REFERENCES news_metadata(id) ON DELETE CASCADE
```

當某篇新聞被刪除時，該新聞底下的所有段落也會被自動清除。

* `content / content_image_path`

  * 該特定段落的文字內容與附圖路徑

* `number`

  * INT
  * 紀錄該段落的排序順序

### 完整性約束

特別設定：

```sql
UNIQUE (number, news_id)
```

這項聯合唯一約束確保了：

```text
同一篇新聞內，絕對不會出現兩個順序編號相同的段落
```

從底層避免前端渲染順序錯亂。

---

## 4. 系統審計追蹤 (audit_log & audit_log_target_information)

為了滿足企業級後台的稽核需求，將單次 API 請求與其影響的資料列進行一對多拆分紀錄。

### audit_log (操作日誌主表)

紀錄單次 HTTP 請求的宏觀資訊，包含：

* `user_id`

  * 若為訪客則為 NULL

* `action`

  * 動作名稱

* `api_path`

  * 請求路徑

* `request_method`

  * GET / POST / PATCH / DELETE

* `status_code`

  * 回應狀態碼

* `ip`

* `user_agent`

---

### audit_log_target_information (受影響目標明細表)

* `audit_log_id`

  * UUID
  * 關聯至主日誌
  * 具備：

```sql
ON DELETE CASCADE
```

* `target_table`

  * 紀錄該次操作異動了哪一張資料表
  * 例如：

```text
news_metadata
```

* `target_data_id`

  * 紀錄被異動的資料列具體 UUID

此設計允許單一 API 請求（如發布新聞）在一筆 `audit_log` 下，關聯多筆 `target_information`：

* 一筆 metadata
* 多筆 passage_content

實現極細粒度的操作追蹤。

---

# 容器化與自動初始化機制

## Dockerfile 配置

`Dockerfile` 極度精簡且高效：

```dockerfile
FROM postgres:18-alpine

ENV POSTGRES_DB=news_db

COPY init.sql /docker-entrypoint-initdb.d/
```

### `ENV POSTGRES_DB=news_db`

指示 PostgreSQL 在啟動時預設建立名為：

```text
news_db
```

的資料庫。

---

### `COPY init.sql /docker-entrypoint-initdb.d/`

PostgreSQL 官方映像檔具有特殊初始化機制：

在首次啟動（且資料目錄為空）時，會自動：

1. 掃描 `/docker-entrypoint-initdb.d/`
2. 執行其中所有 `.sql` 腳本

因此此部分只需將：

```text
init.sql
```

放入該目錄，即可在容器初始化時自動完成：

* ENUM 建立
* 資料表建立
* 外鍵建立
* Constraints 建立
* 預設值建立

完全不需要人工手動執行 SQL。

