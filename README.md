# 全端微服務新聞網站 (Microservices News Website) 完整系統技術說明文件

---

# 第一章：專案總覽與架構核心 (Project Overview & Architecture)

本專案是一個基於微服務架構 (Microservices Architecture) 開發的現代化全端新聞發布與閱讀平台。系統的設計目標是為了實現高擴展性、職責分離，以及嚴謹的資料與存取權限控管。

透過將傳統的單體式應用程式 (Monolithic Application) 拆分為多個獨立運作的模組，本系統能夠針對不同的使用者角色（一般讀者、新聞作者、系統管理員）提供專屬的使用者介面與應用程式邏輯。

整個系統建構於 Docker 與 Docker Compose 的容器化生態系之上，這意味著無論是在本地開發環境或正式生產伺服器上，都能夠透過單一指令實現「開箱即用」的部署體驗，徹底解決環境依賴問題。

---

## 1.1 系統角色與模組拆分

系統主要被劃分為六大核心微服務模組：

| 模組名稱                | 說明                         |
| ------------------- | -------------------------- |
| Reader Frontend     | 面向一般讀者的新聞瀏覽前台              |
| Writer Frontend     | 提供新聞作者撰寫與管理文章的 CMS 後台      |
| Administrator Panel | 系統管理員的監控與審核平台              |
| Backend API         | Node.js + Express 核心後端服務   |
| Database            | PostgreSQL 關聯式資料庫          |
| Reverse Proxy       | Nginx API Gateway 與靜態資源伺服器 |

---

## 1.2 系統網路拓撲與資料流向

在 Docker Bridge Network 中，所有服務皆透過 Docker DNS 名稱進行通訊。

### 外部請求流向

| 類型     | 流向                              |
| ------ | ------------------------------- |
| 前端頁面請求 | Browser → Nginx → React 靜態檔案    |
| API 請求 | Browser → Nginx → Backend       |
| 資料庫操作  | Backend → PostgreSQL            |
| 圖片存取   | Browser → Nginx → Shared Volume |

### 核心架構特性

* 所有外部流量統一進入 Nginx Port `5000`
* Backend 不直接對外暴露
* PostgreSQL 僅允許內部網路存取
* 圖片透過 Docker Volume 共用
* Nginx 負責靜態資源 I/O 卸載

---

# 第二章：資料庫服務層 (Database Layer)

本系統完全依賴 PostgreSQL 關聯式資料庫。

資料庫設計重點：

* ACID 交易一致性
* UUID 主鍵設計
* ENUM 型別限制
* Foreign Key 關聯完整性
* ON DELETE CASCADE 級聯刪除

---

## 2.1 容器化與自動初始化設計

### Dockerfile

```dockerfile
FROM postgres:18-alpine

ENV POSTGRES_DB=news_db

COPY init.sql /docker-entrypoint-initdb.d/
```

### 自動初始化機制

當 PostgreSQL 容器首次啟動且資料目錄為空時：

1. PostgreSQL 自動掃描 `/docker-entrypoint-initdb.d/`
2. 執行所有 `.sql` 腳本
3. 建立：

   * 資料表
   * ENUM 型別
   * 關聯約束
   * 初始 Schema

此設計確保系統可以完全自動化初始化。

---

## 2.2 Schema 結構與關聯設計

---

### 2.2.1 自訂 ENUM 型別

```sql
CREATE TYPE user_role AS ENUM ('writer', 'Admin');

CREATE TYPE category AS ENUM ('politics', 'sports', 'finance');
```

| ENUM 名稱     | 用途     |
| ----------- | ------ |
| `user_role` | 限制帳號角色 |
| `category`  | 限制新聞分類 |

---

### 2.2.2 帳號與權限資料表 (`writer`)

```sql
CREATE TABLE writer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    authorname TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role user_role DEFAULT 'writer'
);
```

### 設計重點

| 欄位           | 說明          |
| ------------ | ----------- |
| `id`         | UUID 主鍵     |
| `authorname` | 唯一帳號名稱      |
| `password`   | bcrypt Hash |
| `role`       | 使用者角色       |

### 安全性設計

* UUID 防止遍歷攻擊
* 密碼不儲存明文
* Admin 權限需手動提升

---

### 2.2.3 新聞元資料表 (`news_metadata`)

```sql
CREATE TABLE news_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author_id UUID REFERENCES writer(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    category category NOT NULL,
    cover_image_path TEXT NOT NULL
);
```

### 核心特性

| 特性                | 說明          |
| ----------------- | ----------- |
| Foreign Key       | 關聯 writer   |
| ON DELETE CASCADE | 刪除作者時自動刪除文章 |
| TIMESTAMPTZ       | 具備時區資訊      |

---

### 2.2.4 新聞段落內容表 (`passage_content`)

```sql
CREATE TABLE passage_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_image_path TEXT NOT NULL,
    content TEXT NOT NULL,
    number INT NOT NULL,
    news_id UUID REFERENCES news_metadata(id) ON DELETE CASCADE,
    UNIQUE (number, news_id)
);
```

### 架構設計

本系統採用：

* 一篇文章 → 多個段落
* 一對多主從表設計
* 支援圖文混排

### 聯合唯一約束

```sql
UNIQUE (number, news_id)
```

此約束可保證：

* 同一篇文章不會有重複段落順序
* 防止前端渲染順序錯亂

---

### 2.2.5 系統審計日誌表 (`audit_log`)

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL,
    action TEXT NOT NULL,
    api_path TEXT NOT NULL,
    request_method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    status_code INTEGER NOT NULL,
    ip TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
);
```

### 日誌紀錄內容

| 欄位               | 說明          |
| ---------------- | ----------- |
| `action`         | API 操作名稱    |
| `api_path`       | 請求路徑        |
| `request_method` | HTTP Method |
| `status_code`    | HTTP 狀態碼    |
| `ip`             | 客戶端 IP      |
| `user_agent`     | 瀏覽器資訊       |

---

### 2.2.6 審計日誌目標資訊表 (`audit_log_target_information`)

```sql
CREATE TABLE audit_log_target_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_log_id UUID REFERENCES audit_log(id) ON DELETE CASCADE,
    target_table TEXT NOT NULL,
    target_data_id UUID NOT NULL
);
```

### 設計目的

此表用於：

* 記錄單次 API 操作實際影響的資料列
* 支援多表異動追蹤
* 實現 Row-level Tracking

### 使用案例

發布文章時：

* 新增 `news_metadata`
* 新增多筆 `passage_content`

此表可完整追蹤所有異動目標。

---

# 第三章：核心後端服務 (Backend API)

Backend 是整個系統的核心。

主要負責：

* 商業邏輯
* JWT 驗證
* Transaction 控制
* 圖片上傳
* 權限管理
* 日誌記錄

技術棧：

| 技術           | 用途            |
| ------------ | ------------- |
| Node.js      | Runtime       |
| Express.js   | Web Framework |
| Multer       | 檔案上傳          |
| jsonwebtoken | JWT 驗證        |
| bcrypt       | 密碼加密          |

---

## 3.1 目錄結構與架構模式

Backend 採用 MVC 架構變體。

| 目錄              | 職責     |
| --------------- | ------ |
| `app.js`        | 應用程式入口 |
| `Router/`       | 路由定義   |
| `Controller/`   | 商業邏輯   |
| `ErrorHandler/` | 錯誤攔截   |
| `Utilities/`    | 共用工具   |

---

## 3.2 權限與身份驗證機制

系統採用 JWT + HttpOnly Cookie。

### 安全性優勢

| 機制              | 作用     |
| --------------- | ------ |
| HttpOnly Cookie | 防止 XSS |
| JWT             | 無狀態驗證  |
| RBAC            | 角色權限控管 |

---

### 3.2.1 一般作者驗證 (`authMiddleware`)

流程：

1. 讀取 `request.cookies.token`
2. 驗證 JWT
3. 驗證有效期限
4. 將 Payload 寫入 `request.jwtToken`

失敗則回傳：

```http
401 Unauthorized
```

---

### 3.2.2 管理員驗證 (`administratorExclusiveAuthMiddleware`)

除了 JWT 驗證外，還會額外查詢資料庫：

```sql
SELECT 1
FROM writer
WHERE id = $1
AND role = 'Admin'
```

### 設計目的

解決 JWT 無法即時撤銷問題。

即使：

* Token 尚未過期
* 使用者曾經是 Admin

只要資料庫角色被移除：

* 系統立即拒絕操作

---

## 3.3 系統審計日誌攔截器

此為後端最核心的架構設計之一。

---

### 運作流程

| 階段    | 說明                 |
| ----- | ------------------ |
| 標記階段  | Router 設定 Action   |
| 收集階段  | Controller 記錄異動資料  |
| 非同步寫入 | finish event 後背景寫入 |

---

### 核心特性

* 不阻塞 API Response
* 背景非同步寫入
* 自動紀錄：

  * Status Code
  * IP
  * User-Agent
  * 操作資料列

---

## 3.4 檔案生命週期與垃圾回收

圖片儲存於：

```text
public/images/
```

---

### Multer 上傳命名策略

```javascript
Date.now() + '-' + Math.round(Math.random() * 1E9)
```

### 優點

* 防止檔名衝突
* 防止覆蓋
* 提高安全性

---

### 自動垃圾回收機制

觸發時機：

| 情境   | 行為       |
| ---- | -------- |
| 更新文章 | 刪除舊圖片    |
| 刪除文章 | 刪除所有關聯圖片 |
| 上傳失敗 | 清除殘留圖片   |

---

## 3.5 Transaction 管理

重要操作皆使用 PostgreSQL Transaction。

### 標準流程

```javascript
BEGIN
UPDATE
DELETE
INSERT
COMMIT
```

若任一步驟失敗：

```javascript
ROLLBACK
```

### 保證

* 原子性
* 一致性
* 不會出現半完成資料

---

# 第四章：RESTful API 規格參考手冊

---

## 4.1 通用系統規則

| 項目         | 說明                     |
| ---------- | ---------------------- |
| Base URL   | `http://<server>:5000` |
| API Prefix | `/api`                 |
| 預設格式       | `application/json`     |
| 上傳格式       | `multipart/form-data`  |

---

## 標準錯誤回應

### 業務邏輯錯誤

```json
{
    "message": "錯誤的具體原因描述"
}
```

### 系統錯誤

```json
{
    "message": "伺服器出錯"
}
```

---

# 第五章：前端客戶端實作細節

系統包含三個 React SPA：

| 專案                  | 用途     |
| ------------------- | ------ |
| Reader Frontend     | 讀者瀏覽   |
| Writer Frontend     | 作者 CMS |
| Administrator Panel | 系統管理   |

建置工具：

```text
Vite
```

---

## 5.1 讀者前端

### 核心狀態管理

```javascript
{
    distinguisher: "categoryList",
    category: 1,
    page: 0,
    requestUrlPrefix: "/api/reader/news/list/category"
}
```

---

### Load More 無縫載入

```javascript
setNewsList((previousNewsList) => {
    return [...previousNewsList, ...newFetchedNewsList];
});
```

---

### 富文本渲染

```javascript
dangerouslySetInnerHTML={{ __html: content }}
```

---

## 5.2 作者前端

---

### 動態圖文編輯器

核心 State：

```javascript
blockList
```

每個 Block 包含：

| 欄位          | 用途      |
| ----------- | ------- |
| `id`        | 唯一識別    |
| `content`   | HTML 內容 |
| `imageFile` | 圖片檔案    |

---

### Blob → File 重建技術

流程：

1. Fetch 舊圖片
2. 轉換 Blob
3. 建立 File
4. 寫回 State

```javascript
new File([blob], filename, {
    type: blob.type
})
```

### 技術價值

實現：

* 更新 API 與新增 API 完全一致
* 舊圖片可重新提交
* multipart/form-data 完整統一

---

### jQuery 特效與記憶體管理

```javascript
useEffect(() => {
    return () => {
        jQuery(...).ripples('destroy');
    };
}, []);
```

### 解決問題

* 防止 Memory Leak
* React 與 jQuery 共存

---

## 5.3 管理員後台

技術框架：

```text
react-admin
```

---

### CustomizedDataProvider

主要負責：

| 功能               | 說明            |
| ---------------- | ------------- |
| getList          | 列表查詢          |
| getManyReference | 關聯展開          |
| delete           | 強制刪除          |
| credentials      | 傳遞 JWT Cookie |

---

### 安全性限制

以下操作被刻意禁止：

```javascript
create()
update()
```

避免管理後台直接修改資料。

---

# 第六章：反向代理與系統整合

---

## 6.1 Docker 多階段建置

### 四階段建置流程

| 階段             | 用途                 |
| -------------- | ------------------ |
| writer-builder | 編譯 Writer Frontend |
| reader-builder | 編譯 Reader Frontend |
| admin-builder  | 編譯 Admin Panel     |
| nginx runtime  | 最終部署               |

---

### 最終優勢

* 映像檔輕量化
* 無原始碼
* 無 node_modules
* 更高安全性

---

## 6.2 Nginx 核心路由設定

---

### 全域設定

```nginx
listen 5000;

client_max_body_size 20M;
```

---

### API 反向代理

```nginx
location /api {
    resolver 127.0.0.11 valid=10s;

    set $backend_servers http://backend:3000;

    proxy_pass $backend_servers;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

### Docker DNS 動態解析

避免：

* Backend 重啟
* IP 改變
* Nginx 快取舊 IP
* 產生 502

---

### SPA 路由支援

```nginx
location /reader {
    alias /usr/share/nginx/html/reader-frontend/;

    try_files $uri /reader/index.html;
}
```

### 解決問題

支援：

* React Router
* HTML5 History API
* F5 Refresh 不會 404

---

### 靜態資源 I/O 卸載

```nginx
location /images {
    root /usr/share/nginx/html;

    try_files $uri =404;
}
```

### 架構優勢

* Nginx 直接讀取圖片
* 不經過 Node.js
* 大幅提升吞吐量

---

# 第七章：部署與運行指南

---

## 7.1 環境準備

需安裝：

| 軟體                | 用途         |
| ----------------- | ---------- |
| Docker Engine     | 容器 Runtime |
| Docker Compose V2 | 容器編排       |

---

## 7.2 `.env` 環境變數

```env
POSTGRES_PASSWORD=your_super_secret_database_password

JWT_SECRET=your_super_secret_jwt_signature_key
```

---

## 7.3 compose.yml 架構解析

---

### Database Service

```yaml
db:
  build: ./database
```

### 特性

* Volume 持久化
* 自動初始化

---

### Backend Service

```yaml
backend:
  deploy:
    replicas: 3
```

### 核心能力

| 功能            | 說明   |
| ------------- | ---- |
| replicas      | 橫向擴展 |
| depends_on    | 啟動順序 |
| shared_images | 圖片共享 |

---

### Reverse Proxy

```yaml
reverse-proxy:
  ports:
    - "5000:5000"
```

### 功能

* 單一入口
* API Gateway
* 靜態資源伺服器

---

## 7.4 系統啟動與停止

---

### 建置並啟動

```bash
docker compose up -d --build
```

---

### 查看日誌

```bash
docker compose logs -f
```

---

### 停止系統

```bash
docker compose down
```

---

### 完全重置系統

```bash
docker compose down -v
```

---
