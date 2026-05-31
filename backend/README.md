# Backend 微服務核心後端說明文件

## 概述

本專案為新聞網站微服務架構中的「核心 API 伺服器」。負責處理系統所有的商業邏輯、執行複雜的關聯式資料庫操作、管理系統的身份驗證 (JWT) 與角色權限 (RBAC)，並同時提供讀者端、作者端與管理員後台所需的 RESTful API 端點。此外，本專案實作了企業級的「系統審計日誌 (Audit Log)」，確保持續監控與追蹤系統內部所有具備高敏感度的資料異動。

## 技術架構與核心套件

* 執行環境：Node.js (配置為 node:25-alpine 進行容器化部署)
* 核心框架：Express.js (Port: 3000)
* 資料庫操作：pg (node-postgres)，透過 Pool 實作連線池管理。
* 身份驗證與授權：jsonwebtoken (JWT) 搭配 bcrypt 進行密碼雜湊，透過 HttpOnly Cookie 傳遞。
* 檔案上傳解析：multer (處理 multipart/form-data 格式，並將靜態檔案存入本地 /public/images/ 目錄)。

## 核心機制與技術亮點

### 1. 角色存取控制與 JWT 驗證 (RBAC & Authentication)
專案的權限管理分為三個層級，並透過特定的 Middleware 進行攔截：
* 公開存取 (Reader)：無需驗證，可直接存取新聞列表與搜尋功能。
* 作者權限 (authMiddleware)：解析 Request Cookie 中的 token。若驗證成功，將解析出的 payload (包含 id 與 role) 注入 request.jwtToken 中供後續 Controller 使用。
* 管理員權限 (administratorExclusiveAuthMiddleware)：除了驗證 JWT 簽章外，更會主動發起資料庫查詢，確保該使用者在資料庫中仍具備 Admin 角色，防止權限遭拔除後依然能操作後台。

### 2. 全域審計日誌系統 (Audit Log System)
這是一套獨立運作的日誌追蹤系統，能精確記錄 API 呼叫與資料列級別 (Row-level) 的異動：
* 動作標記 (recordActionTypeMiddleware)：在 Router 層級為特定的 API 請求注入 response.locals.audit。
* 攔截寫入 (auditLogMiddleware)：監聽 Express Response 的 finish 事件，於背景啟動資料庫連線，寫入操作者 ID、API 路徑、HTTP 方法、狀態碼、IP 與 User-Agent。
* 目標追蹤：Controller 會將被異動的資料表名稱與 ID 推入陣列，Middleware 會將其寫入 audit_log_target_information 關聯表。

### 3. 資料庫交易與 ACID 保證 (Database Transaction)
應對新聞發布時需同時寫入「新聞 Metadata」與「多個段落內容」，專案大量使用了 PostgreSQL 的 Transaction 機制 (BEGIN, COMMIT, ROLLBACK)。若在迴圈寫入段落或上傳圖片過程中發生任何錯誤，系統將強制 ROLLBACK，徹底避免資料庫產生孤兒資料。

### 4. 檔案生命週期與垃圾回收機制
* 圖片上傳：Multer 會擷取 Request 中的檔案，產生隨機後綴字串 (Date.now + 隨機數) 防止檔名衝突。
* 資源回收 (deletePreStoredImage.js)：當使用者更新新聞替換舊圖片，或刪除整篇新聞，系統會利用原生的 fs.unlink 非同步刪除伺服器硬碟中的舊圖片實體，有效防止硬碟空間耗盡。

---

<br><br>

# 系統後端 API 規格詳細說明文件 (API Specification)

本文件基於後端原始碼之 Controller、Router 與 Error Handler 邏輯，詳細列出所有對外開放之 API 端點規格，包含請求方法、參數格式、驗證需求以及所有可能的 HTTP 狀態碼與 JSON 回應結構。

## 全局通訊規範

* **基礎路徑**：所有 API 請求路徑皆位於 `/api/` 之下。
* **資料格式**：除有特別標註為 `multipart/form-data` 的上傳介面外，其餘請求 (Request) 與回應 (Response) 的 Content-Type 皆為 `application/json`。
* **通用錯誤狀態碼**：
    * `400 Bad Request`：客戶端傳遞的參數有誤、格式不符或權限不足（於 Error Handler 內比對攔截）。
    * `401 Unauthorized`：未提供 JWT Token、Token 無效或過期。
    * `500 Internal Server Error`：伺服器未預期錯誤，或 Controller 拋出的錯誤未被 Error Handler 的允許清單攔截。

---

## 模組一：身份驗證 API (`/api/authentication`)

本模組不需任何 JWT 憑證即可存取。

### 1. 使用者登入
* **Endpoint**: `POST /api/authentication/login`
* **Content-Type**: `application/json`
* **Request Body**:
    * `username` (字串, 必填): 註冊之帳號名稱。
    * `password` (字串, 必填): 登入密碼。
* **Success Response (200 OK)**:
    * 說明：驗證成功後，伺服器會在 Response Header 寫入 `Set-Cookie: token=...; HttpOnly; Max-Age=86400000; SameSite=strict`。
    * Body: 
        ```json
        {
          "writer": {
            "name": null, 
            "role": "writer"
          },
          "message": "success"
        }
        ```
        *(註：依據程式碼 `writer.name` 取值，因資料庫欄位為 `authorname`，此處 `name` 欄位實際可能為 `undefined`)*
* **Error Response (400 Bad Request)**:
    * 情境：帳號不存在、或密碼經 bcrypt 比對錯誤。
    * Body: `{"message": "fail"}`
* **Error Response (500 Internal Server Error)**:
    * Body: `{"message": "伺服器出錯"}`

### 2. 使用者註冊
* **Endpoint**: `POST /api/authentication/register`
* **Content-Type**: `application/json`
* **Request Body**:
    * `username` (字串, 必填): 帳號名稱，長度必須 >= 6。
    * `password` (字串, 必填): 密碼，長度必須 >= 6。
* **Success Response (200 OK)**:
    * Body: `{"message": "success"}`
* **Error Response (400 Bad Request)**:
    * 情境：帳號名稱與資料庫中現有資料重複、或密碼長度小於 6。
    * Body: `{"message": "fail"}`
* **Error Response (500 Internal Server Error)**:
    * 情境：若傳入之 `username` 長度小於 6，Controller 會拋出「帳號名稱太短」，但因 Error Handler 僅攔截「帳號名稱重複」與「密碼太短」，此情況將穿透為 500 錯誤。
    * Body: `{"message": "伺服器出錯"}`

---

## 模組二：讀者端 API (`/api/reader`)

本模組提供一般讀者存取，不需任何 JWT 憑證。

### 1. 取得分類新聞列表
* **Endpoint**: `GET /api/reader/news/list/category`
* **Query Parameters**:
    * `category` (字串, 必填): 欲查詢之分類代碼。"0" = 最新(全部分類), "1" = politics, "2" = sports, "3" = finance。
    * `page` (整數, 必填): 分頁索引。數值必須 >= 0。後端會自動乘上 5 作為 OFFSET。
* **Success Response (200 OK)**:
    * Body:
        ```json
        {
          "news_list": [
            {
              "id": "uuid",
              "title": "新聞標題",
              "created_at": "2026-05-31T...",
              "cover_image_path": "檔名.jpg"
            }
          ]
        }
        ```
* **Error Response (400 Bad Request)**:
    * Body: `{"message": "無效頁數編號"}` 或 `{"message": "無效的分類代碼"}`

### 2. 關鍵字搜尋新聞
* **Endpoint**: `GET /api/reader/news/list/search`
* **Query Parameters**:
    * `keyword` (字串, 必填): 欲搜尋的標題關鍵字。
    * `page` (整數, 必填): 分頁索引。數值必須 >= 0。
* **Success Response (200 OK)**:
    * Body: `{"news_list": [ ... ]}` (結構同上)
* **Error Response (400 Bad Request)**:
    * 情境：未傳遞關鍵字。
    * Body: `{"message": "沒有關鍵字"}`
* **Error Response (500 Internal Server Error)**:
    * 情境：若 `page` 格式錯誤，Controller 拋出「無效頁數編號」，但 Error Handler 預期攔截的是「頁數格式錯誤」，因此會直接落入 500。

### 3. 取得單篇文章詳細內容
* **Endpoint**: `GET /api/reader/news/content`
* **Query Parameters**:
    * `newsid` (字串, 必填): 目標新聞之 UUID。
* **Success Response (200 OK)**:
    * Body:
        ```json
        {
          "cover": {
            "cover_image_path": "封面檔名.jpg",
            "title": "主標題",
            "created_at": "時間字串",
            "authorname": "作者名稱"
          },
          "content": [
            {
              "id": "段落uuid",
              "content_image_path": "段落圖檔名.jpg",
              "content": "段落HTML內容"
            }
          ]
        }
        ```
* **Error Response (400 Bad Request)**:
    * 情境：傳入之 `newsid` 未通過正規表達式 UUID 格式驗證。
    * Body: `{"message": "不正確的newsid格式"}`

---

## 模組三：作者端 API (`/api/writer`)

本模組內所有 API 皆要求 Request 必須帶有 Cookie `token`，並由 `authMiddleware` 進行 JWT 驗證。驗證失敗皆回傳 `401 Unauthorized`。

### 1. 發布新文章
* **Endpoint**: `POST /api/writer/write`
* **Content-Type**: `multipart/form-data`
* **Form Data Fields**:
    * `mainTitleText` (字串, 必填): 文章主標題。
    * `category` (字串, 必填): 分類代碼 ("1", "2", "3")。
    * `blocksInformation` (JSON 字串, 必填): 段落結構，必須解析為陣列。範例：`[{"id":"123","content":"內文"}]`。
* **Files (二進位)**:
    * `mainTitleImageFile` (File, 必填): 封面照片。
    * `image_{id}` (File, 選填): 與 `blocksInformation` 中的 id 相對應的段落附圖。
* **Success Response (200 OK)**:
    * Body: `{"message": "上傳成功"}`
* **Error Response (400 Bad Request)**:
    * 情境包含：缺少標題、缺少內文陣列、未上傳封面、分類代碼無效。
    * Body: 
        * `{"message": "沒有標題"}`
        * `{"message": "沒有內文"}`
        * `{"message": "沒有封面照片"}`
        * `{"message": "無效的分類代碼"}`
        * `{"message": "沒有作者帳號"}`

### 2. 取得個人文章列表
* **Endpoint**: `GET /api/writer/listnews`
* **Query Parameters**:
    * `page_number` (整數, 必填): 分頁索引。
* **Success Response (200 OK)**:
    * Body: `{"news_list": [ { id, title, created_at, category, cover_image_path } ] }`
* **Error Response (400 Bad Request)**:
    * Body: `{"message": "無效頁數編號"}` 或 `{"message": "沒有作者帳號"}`

### 3. 獲取編輯所需之原始資料
* **Endpoint**: `GET /api/writer/newscontent/:newsid`
* **Path Parameters**:
    * `newsid` (字串, 必填): 欲編輯之新聞 UUID。
* **Success Response (200 OK)**:
    * Body: (結構同 `/api/reader/news/content`，但 `cover` 包含的是 `category` 而非 `authorname`)
        ```json
        {
          "cover": { "cover_image_path": "...", "title": "...", "category": "..." },
          "content": [ { "content_image_path": "...", "content": "..." } ]
        }
        ```
* **Error Response (400 Bad Request)**:
    * Body: `{"message": "新聞id格式錯誤"}` 或 `{"message": "找不到資料"}` (查無此文或非本人文章)

### 4. 更新現有文章
* **Endpoint**: `PATCH /api/writer/update/news/:newsid`
* **Path Parameters**:
    * `newsid` (字串, 必填): 目標新聞 UUID。
* **Content-Type**: `multipart/form-data`
* **Form Data / Files**:
    * 完全與 `POST /api/writer/write` 相同，為整篇覆寫機制。
* **Success Response (200 OK)**:
    * 說明：成功後，系統會在背景刪除舊有的實體圖片檔案。
    * Body: `{"message": "更新成功"}`
* **Error Response (400 Bad Request)**:
    * Body (依據錯誤原因):
        * `{"message": "找不到新聞id"}`
        * `{"message": "沒有標題"}`
        * `{"message": "找不到舊版的封面照片"}`
        * `{"message": "無可以被更新的資料"}`
        * `{"message": "無可刪除的新聞內容"}` (等其他表單驗證錯誤)

### 5. 刪除新聞
* **Endpoint**: `DELETE /api/writer/delete/news/:newsid`
* **Path Parameters**:
    * `newsid` (字串, 必填): 欲刪除之新聞 UUID。
* **Success Response (200 OK)**:
    * 說明：資料刪除後，連帶清理伺服器上關聯的所有實體圖檔。
    * Body: `{"message": "刪除成功"}`
* **Error Response (400 Bad Request)**:
    * Body: `{"message": "找不到新聞id"}` 或 `{"message": "沒有可以刪除的新聞"}`

---

## 模組四：系統管理員 API (`/api/Administrator`)

本模組內所有 API 皆要求 Request 必須帶有 Cookie `token`，並由 `administratorExclusiveAuthMiddleware` 驗證。此驗證不僅解析 JWT，更會往資料庫確認該帳號具備 `role = 'Admin'`。

**管理員端共用錯誤處置**：
凡是 JWT 驗證失敗、查無 Admin 權限，或參數缺失觸發 Controller 拋出預期錯誤時，Error Handler (`checkAuditLogErrorHandler` 等) 皆會攔截並統一回傳 `400 Bad Request`，且 Body 固定為 `{"message": "fail"}`。

### 1. 查詢系統審計日誌
* **Endpoint**: `GET /api/Administrator/check/audit_log`
* **Parameters**: 無
* **Success Response (200 OK)**:
    * Body:
        ```json
        {
          "audit_log_data": [
            {
              "id": "uuid",
              "user_id": "uuid",
              "author_name": "使用者名稱",
              "action": "API 動作標籤",
              "api_path": "請求路徑",
              "request_method": "POST/GET...",
              "created_at": "時間",
              "status_code": 200,
              "ip": "IP位址",
              "user_agent": "瀏覽器資訊",
              "target_table": "異動資料表名稱",
              "target_data_id": "異動資料之 UUID"
            }
          ],
          "audit_log_data_count": 總筆數
        }
        ```

### 2. 獲取全站使用者清單
* **Endpoint**: `GET /api/Administrator/check/user_list`
* **Parameters**: 無
* **Success Response (200 OK)**:
    * Body:
        ```json
        {
          "user_data": [
            {
              "id": "uuid",
              "authorname": "帳號名稱",
              "role": "writer 或 Admin"
            }
          ],
          "total_user_number": 總筆數
        }
        ```

### 3. 強制註銷使用者帳號
* **Endpoint**: `DELETE /api/Administrator/revoke/user_account`
* **Query Parameters**:
    * `user_id` (字串, 必填): 欲註銷之帳號 UUID。
* **Success Response (200 OK)**:
    * 說明：將觸發 PostgreSQL cascade，連帶刪除該帳號的所有文章。
    * Body: `{"message": "success"}`
* **Error Response (400 Bad Request)**:
    * Body: `{"message": "fail"}` (包含未提供 user_id 或帳號不存在等情境)

### 4. 查詢特定使用者的發文紀錄
* **Endpoint**: `GET /api/Administrator/check/user/news_list`
* **Query Parameters**:
    * `user_id` (字串, 必填): 目標作者的 UUID。
* **Success Response (200 OK)**:
    * Body:
        ```json
        {
          "user_news_list": [
            {
              "id": "uuid",
              "title": "新聞標題",
              "created_at": "時間",
              "category": "分類"
            }
          ],
          "user_news_list_count": 總筆數
        }
        ```
* **Error Response (400 Bad Request)**:
    * Body: `{"message": "fail"}`

### 5. 強制下架違規新聞
* **Endpoint**: `DELETE /api/Administrator/takedown/user/news`
* **Query Parameters**:
    * `news_id` (字串, 必填): 欲刪除之新聞 UUID。
* **Success Response (200 OK)**:
    * Body: `{"message": "success"}`
* **Error Response (400 Bad Request)**:
    * Body: `{"message": "fail"}`

