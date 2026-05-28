# News App — Docker Compose 部署說明

本專案使用 Docker Compose 管理三個服務：PostgreSQL 資料庫、Node.js 後端（水平擴展），以及 Nginx 反向代理。

---

## 專案架構

```
.
├── docker-compose.yml
├── database/          # 自訂 PostgreSQL Dockerfile
├── backend/           # 後端應用程式
└── reverse-proxy/     # Nginx 反向代理設定
```

### 服務說明

| 服務 | Image | 說明 |
|------|-------|------|
| `db` | `my_custom_database:v1.0` | 自訂 PostgreSQL 資料庫 |
| `backend` | （由 `./backend` 建置） | 後端 API，預設啟動 3 個 replica |
| `reverse-proxy` | `reverse_proxy:v1.0` | Nginx 反向代理，對外開放 port 5000 |

### Volume 說明

| Volume | 名稱 | 用途 |
|--------|------|------|
| `postgres_data` | `database_postgres_data` | 資料庫持久化儲存 |
| `shared_images` | `shared_images` | 後端與反向代理共用的圖片目錄 |

---

## 環境變數設定

在專案根目錄建立 `.env` 檔案，並填入以下變數：

```env
POSTGRES_PASSWORD=your_postgres_password
JWT_SECRET=your_jwt_secret
```

> ⚠️ 請勿將 `.env` 提交至版本控制系統，務必加入 `.gitignore`。

---

## 快速開始

### 前置需求

- [Docker](https://docs.docker.com/get-docker/) >= 20.10
- [Docker Compose](https://docs.docker.com/compose/) >= 2.0

### 啟動服務

```bash
# 建置所有 image 並在背景啟動
docker compose up -d --build

# 查看各服務狀態
docker compose ps

# 查看即時 log
docker compose logs -f
```

### 停止服務

```bash
# 停止所有服務（保留 volume）
docker compose down

# 停止並移除所有 volume（資料將清空）
docker compose down -v
```

---

## 服務細節

### db（資料庫）

- 基於 `./database` 目錄的自訂 Dockerfile 建置
- 資料存放於 `database_postgres_data` volume，容器重啟後資料不會流失
- 資料庫連線資訊：
  - Host（容器內部）：`db`
  - Port：`5432`
  - User：`postgres`
  - Database：`news_db`

### backend（後端）

- 預設以 **3 個 replica** 運行，由反向代理進行負載平衡
- 透過 `depends_on` 確保資料庫啟動後才啟動
- 圖片檔案存放於 `shared_images` volume（路徑：`/app/public/images`）

### reverse-proxy（反向代理）

- 對外開放 **port 5000**，可透過 `http://localhost:5000` 存取
- 將請求轉發至後端的 3 個 replica
- 同步掛載 `shared_images` volume 以直接提供靜態圖片（路徑：`/usr/share/nginx/html/images`）

---

## 常用指令

```bash
# 重新建置特定服務的 image
docker compose build backend

# 查看特定服務的 log
docker compose logs -f backend

# 進入資料庫容器
docker exec -it news_database_container psql -U postgres -d news_db

# 手動調整 backend replica 數量
docker compose up -d --scale backend=5
```

---

## 注意事項

- `backend` 服務因使用 `replicas: 3`，**不可設定固定的 `container_name`**，否則會衝突
- 修改 `.env` 後需重新啟動服務才會生效（`docker compose up -d`）
- `shared_images` volume 由 `backend` 寫入、由 `reverse-proxy` 讀取，請確保 Nginx 設定有對應的靜態檔案路由