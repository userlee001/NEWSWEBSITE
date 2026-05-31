# Reverse Proxy 說明文件

## 概述

這個部分為新聞網站微服務架構中的「反向代理伺服器 (Reverse Proxy) 與靜態資源伺服器」。它扮演著整個系統的「單一對外入口點 (API Gateway / Single Entry Point)」，隱藏了後端微服務的複雜網路拓撲。所有來自外部的流量（包含前端網頁存取、後端 API 請求以及靜態圖片載入）皆由本服務統一接收，並根據 URL 路徑精準分發至對應的內部容器。

本模組透過精密的 Nginx 設定與 Docker 多階段建置 (Multi-stage Build)，將三個獨立的前端專案打包並與 Nginx 伺服器完美整合。

---

## 技術架構與核心配置

* 核心伺服器：Nginx 1.29.6 (基於輕量化的 Alpine Linux)
* 建置環境：Node.js 22 (用於前端專案編譯)
* 部署方式：Docker 容器化部署
* 對外通訊埠：5000

---

## 核心機制與技術亮點

### 1. Docker 多階段建置 (Multi-stage Build)

本專案的 `Dockerfile` 實作了高效的多階段建置流程，將編譯與運行環境徹底分離：

* 編譯階段：
  分別建立 `writer-builder`、`reader-builder` 與 `admin-builder` 三個 Node.js 22 執行個體，於容器內部執行 `npm install` 與 `npm run build`，將原始碼編譯為靜態檔案 (`dist` 目錄)。

* 運行階段：
  最終僅取用 `nginx:1.29.6-alpine` 映像檔，並透過 `COPY --from=...` 將三個編譯好的靜態目錄搬移至 `/usr/share/nginx/html/` 底下。

* 優勢：
  此做法保證了本地開發環境無需安裝任何 Node.js 依賴，且最終的 Nginx 映像檔極度輕量，完全不包含原始碼與 `node_modules`，大幅提升部署速度與安全性。

---

### 2. 單頁應用程式 (SPA) 路由支援

React 專案屬於單頁應用程式，若使用者在子路由（例如 `/reader/news/list`）直接重新整理網頁，Nginx 預設會尋找該路徑的實體檔案，從而導致 404 錯誤。

* 解決方案：

  在 Nginx 設定中，針對每個前端應用配置了：

```nginx
try_files $uri /<對應路徑>/index.html;
```

這會引導 Nginx 在找不到實體檔案時，統一回傳 `index.html`，將路由的控制權交還給前端的 `react-router-dom` 進行解析。

---

### 3. API 動態轉發與檔案上傳支援

#### 檔案大小限制 (`client_max_body_size`)

因應作者後台有上傳多張高畫質圖片的需求，Nginx 全域設定了：

```nginx
client_max_body_size 20M;
```

放寬預設的 1MB 限制，避免上傳文章時發生 `413 Payload Too Large` 錯誤。

#### 內部 DNS 解析 (`resolver 127.0.0.11`)

在轉發至後端 API 時，使用了 Docker 內部的 DNS 解析器。這確保了即使 `backend` 容器重啟導致內部 IP 改變，Nginx 依然能透過服務名稱動態解析到正確的位置，防止 `502 Bad Gateway`。

#### 標頭保留 (`proxy_set_header`)

轉發時攜帶了：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
```

讓 Node.js 後端能夠在 `auditLogMiddleware` 中正確紀錄客戶端的真實 IP，而非 Nginx 容器的內部 IP。

---

### 4. 靜態資源動態掛載與 I/O 卸載

為了減輕 Node.js 後端伺服器處理靜態檔案的負擔，所有使用者上傳的圖片皆由 Nginx 直接伺服。

* 透過 `docker-compose.yml` 中的 `shared_images` Volume 共享機制，後端上傳至硬碟的圖片，Nginx 可以直接從 `/usr/share/nginx/html/images` 讀取並回傳給客戶端。

* 若圖片不存在，則配置：

```nginx
try_files $uri =404;
```

快速阻斷請求，提升系統效能。

---

## 目錄結構與檔案解析

```text
reverse-proxy/
├── Dockerfile      # 統整前端編譯與 Nginx 環境的多階段建置檔
├── nginx.conf      # Nginx 核心路由轉發與伺服器設定檔
└── README.md       # 本部分說明文件
```

---

# Nginx 路由規則詳細說明 (Routing Rules)

整個系統對外皆透過 Port 5000 進行存取，Nginx 會依據 URI 前綴進行以下流量分派：

---

## 1. 後端微服務 API (Backend API)

### 攔截路徑

```nginx
location /api
```

### 處理方式

轉發 (`proxy_pass`) 至內部網路的：

```nginx
http://backend:3000
```

### 應用場景

所有前端對資料庫的 CRUD 請求、會員登入驗證、文章發布等。

---

## 2. 讀者前台 (Reader Frontend)

### 攔截路徑

```nginx
location /reader
```

### 處理方式

靜態檔案伺服。使用 `alias` 將請求映射至：

```nginx
/usr/share/nginx/html/reader-frontend/
```

### 應用場景

一般大眾瀏覽新聞的入口。

---

## 3. 作者後台 (Writer Frontend)

### 攔截路徑

```nginx
location /writer
```

### 處理方式

靜態檔案伺服。使用 `alias` 將請求映射至：

```nginx
/usr/share/nginx/html/writer-frontend/
```

### 應用場景

新聞工作者發布與管理文章的入口。

---

## 4. 系統管理後台 (Administrator Panel)

### 攔截路徑

```nginx
location /administrator
```

### 處理方式

靜態檔案伺服。使用 `alias` 將請求映射至：

```nginx
/usr/share/nginx/html/administrator-panel/
```

### 應用場景

管理員監控系統日誌與強制下架違規內容的入口。

---

## 5. 共用靜態圖片 (Images)

### 攔截路徑

```nginx
location /images
```

### 處理方式

靜態檔案伺服。將請求對應至容器內的：

```nginx
/usr/share/nginx/html/images
```

該目錄與 backend 共享 Volume。

### 應用場景

載入新聞封面與段落附圖。
