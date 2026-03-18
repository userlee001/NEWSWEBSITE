# NESWEBSITE - 高可用性新聞發佈系統 

### 專案背景
聽完趨勢科技的徵才說明會之後，想要爭取 **趨勢科技 (Trend Micro) 暑期實習生** 職位，花了一周從0開始建構這個專案。目標是建立一個具備負載平衡、容器化部署與安全驗證的新聞平台。

---

## 系統架構圖 (System Architecture)

本系統部署於 **Google Cloud Platform (GCP)** 上的 VM，採用 **微服務容器化** 架構，共運行 5 個 Docker 容器：

- **1 * NGINX**: 作為 Reverse Proxy 與負載平衡器，同時負責靜態資源處理。
- **3 * ExpressJS**: 後端 API Server 集群，負責業務邏輯處理。
- **1 * PostgreSQL**: 關係型資料庫，儲存新聞與使用者資料。

---

## 🛠 技術亮點與實作細節

### 1. 網路安全與網域管理 (Networking & Security)
- **SSL/TLS 佈署**: 透過 NameCheap 購買網域 `reports.baby`，手動產生 **CSR (Certificate Signing Request)** 並配置 **CRT/CA Bundle**，在 Nginx 層實現 HTTPS 加密傳輸。
- **身分驗證 (Auth)**: 
    - 實作 **JWT (JSON Web Token)** 驗證機制。
    - 登入後將 Token 儲存於瀏覽器 **Cookie** 中，並在敏感操作透過 authMiddleware 進行合法性校驗。
- **防範資安漏洞**: 在 `DELETE` 接口中強制檢查「新聞 ID + 作者 ID」，有效防止 **IDOR (不安全直接物件參照)** 攻擊。

### 2. 負載平衡與效能優化 (Load Balancing & Optimization)
- **流量分流**: 使用 Nginx 的 **Round Robin** 演算法將 API 請求均勻分配至三個後端實例，實現初步的水平擴展（Horizontal Scaling）。
- **靜態資源加速**: 
    - 前端 React 建置檔與新聞圖片直接由 Nginx 處理，不經過後端 Express，降低延遲並減輕後端 I/O 負擔。
    - 使用 **Docker Shared Volume** 實現 Nginx 與後端容器間的圖片資源共享。

### 3. 前端架構設計 (Frontend Design)
- **讀者端 (Reader UI)**: 使用 **React.js** 構建，強調組件化開發與良好的使用者互動體驗。
- **寫手端 (Writer UI)**: 採用原生 HTML/CSS/JS 輕量化實作，專注於文章編輯與管理功能。

### 4. RESTful API 設計 (Backend API)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/login` | 寫手登入並核發 JWT，將JWT存在使用者瀏覽器的cookie。 |
| `POST` | `/api/write` | 新聞提交（包含 JWT 驗證與圖片上傳處理）。 |
| `GET` | `/api/newslist/:category/:page` | 分類分頁抓取新聞（category:0代表不分類、1代表政治、2代表體育、3代表財經）。 |
| `GET` | `/api/search/:page` | 標題關鍵字模糊搜尋。 |
| `GET` | `/api/writer/listarticle` | 獲取該寫手名下所有文章（權限校驗）。 |
| `DELETE` | `/api/writer/delete/:newsid` | 安全刪除新聞（驗證作者 ID 匹配）。 |

---

## 部署說明 (Deployment)

本專案完全容器化，確保開發環境與生產環境一致。  
要有.env檔案，內容請參考.env.example
```bash
# 啟動所有服務 (Nginx *1, Backend *3, DB *1)
docker compose up -d
```

## 分支與環境管理 (Branching & Environments)


專案採用分支管理來隔離開發與生產環境的配置差異：

* **`master` Branch (開發環境)**: 
    * 預設為本地端或測試環境使用，會有開發的完整檔案。
    * **Nginx 配置**: 僅作為 Reverse Proxy 處理內部容器轉發，並開啟 5000 埠口，**未包含** 網域、SSL/TLS 憑證與 HTTPS 強制跳轉邏輯。
* **`online` Branch (生產環境)**: 
    * 用於 GCP VM 的實際部署，僅剩佈署所需的檔案，冗餘檔案會刪除。
    * **Nginx 配置**: 包含 `reports.baby` 網域處理、CSR 換發之 CRT/CA Bundle 憑證掛載，並開啟 80 、 443 埠口提供加密傳輸服務。
