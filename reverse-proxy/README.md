# 專案架構說明

## 概覽

本專案使用 **Nginx** 作為反向代理與靜態資源伺服器，統一對外提供服務，並將 API 請求轉發至後端服務。

---

## 服務架構

```
Client
  │
  ▼
Nginx (port 5000)
  ├── /api      →  proxy → backend:3000 (後端 API 服務)
  ├── /reader   →  靜態前端（Reader 閱讀端）
  ├── /writer   →  靜態前端（Writer 編輯端）
  └── /images   →  靜態圖片資源
```

---

## 路由說明

| 路徑 | 類型 | 說明 |
|------|------|------|
| `/api` | 反向代理 | 將請求轉發至後端服務 `http://backend:3000` |
| `/reader` | 靜態資源 | Reader 前端應用，SPA 模式 |
| `/writer` | 靜態資源 | Writer 前端應用，SPA 模式 |
| `/images` | 靜態資源 | 圖片檔案服務 |

---

## Nginx 設定細節

### 監聽埠

- **Port：** `5000`

### 上傳限制

- **最大請求 Body：** `20MB`（`client_max_body_size 20M`）

### `/api` — 後端 API 代理

- 使用 Docker 內部 DNS（`127.0.0.11`）動態解析後端服務名稱，DNS 快取有效期 10 秒
- 後端目標：`http://backend:3000`
- 轉發 Header：
  - `Host`：保留原始主機名稱
  - `X-Real-IP`：傳遞客戶端真實 IP

### `/reader` — Reader 前端

- 靜態檔案根目錄：`/usr/share/nginx/html/reader-frontend/`
- SPA 回退：找不到對應檔案時，統一回傳 `/reader/index.html`

### `/writer` — Writer 前端

- 靜態檔案根目錄：`/usr/share/nginx/html/writer-frontend/`
- SPA 回退：找不到對應檔案時，統一回傳 `/writer/index.html`

### `/images` — 圖片資源

- 根目錄：`/usr/share/nginx/html`
- 完整路徑為 `/usr/share/nginx/html/images/`
- 找不到圖片時回傳 `404`

---

## 靜態資源目錄結構

```
/usr/share/nginx/html/
├── reader-frontend/     # Reader 前端建置產物
│   └── index.html
├── writer-frontend/     # Writer 前端建置產物
│   └── index.html
└── images/              # 圖片靜態資源
```

---

## 後端服務

| 項目 | 說明 |
|------|------|
| 服務名稱 | `backend`（Docker Compose service name）|
| 監聽埠 | `3000` |
| 存取方式 | 僅供 Nginx 內部代理，不對外暴露 |

---

## 注意事項

- Nginx 使用 Docker 內建 DNS Resolver（`127.0.0.11`）解析服務名稱，請確保在 Docker Compose 環境下運行。
- 若後端服務名稱異動，需同步更新 Nginx 設定中的 `$backend_servers` 變數。
- 前端應用皆為 SPA（Single Page Application），路由回退已設定完畢，無需額外設定。