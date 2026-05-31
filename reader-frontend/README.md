# Reader Frontend 說明文件

## 概述

此部分為新聞網站微服務架構中的「讀者端前端」模組 (B2C)。主要提供一般大眾瀏覽最新新聞、根據特定分類篩選新聞、關鍵字搜尋，以及閱讀單篇文章的圖文內容。以 React 構建，強調單頁應用程式 (SPA) 的流暢體驗，並透過集中式的狀態管理來控制 API 請求與分頁載入。

## 技術架構

* 核心框架：React.js
* 建置工具：Vite
* 路由管理：React Router v6 (react-router-dom)
* 樣式管理：純 CSS 與 CSS Modules (如 ArticlePage.module.css)
* 網路請求：原生 Fetch API
* 時間處理：原生 Date 物件，轉換為 Asia/Taipei 時區顯示
* 深層比較：Lodash (isEqual) 用於判斷物件狀態

## 核心機制與狀態管理

採用高度集中的請求狀態管理機制，所有關於新聞列表的查詢參數皆由 `App.jsx` 中的 `readerRequestCollector` 狀態統一控管。

### 1. 請求收集器 (readerRequestCollector)
這是一個 Object，負責收集來自導覽列或搜尋框的過濾條件，其資料結構包含：
* `distinguisher`: 用於區分當前是「分類查詢 (categoryList)」還是「搜尋查詢 (searchList)」。
* `category`: 分類代碼 (0: 最新, 1: 政治, 2: 體育, 3: 財經)。
* `keyword`: 使用者輸入的搜尋字串。
* `page`: 當前載入的頁數 (從 0 開始)。
* `requestUrlPrefix`: 該次請求對應的 API 基礎路徑。

### 2. 無縫分頁載入 (Pagination & Load More)
在 `App.jsx` 的 `useEffect` 中會監聽 `readerRequestCollector` 的變化：
* 當 `page === 0` 時：代表使用者進行了全新的查詢（例如點擊了新的分類或重新搜尋），此時會將獲取到的新聞列表完全覆蓋舊有的 `newsList`。
* 當 `page > 0` 時：代表使用者點擊了「更多新聞」，此時會將新獲取的資料透過 Spread Operator (`[...previousNewsList, ...newFetchedNewsList]`) 附加到現有列表的末端，實現無縫載入。

### 3. 微服務路由適配 (Base URL)
為了配合反向代理 (Reverse Proxy) 的設定，Vite 的 `base` 被設定為 `/reader/`，且 `main.jsx` 中的 `BrowserRouter` 也設定了 `basename="/reader"`。這確保了前端路由與後端 API 路由在反向代理分發時不會產生衝突。

## 目錄結構與模組解析

### 進入點與全域設定
* `vite.config.js`: Vite 打包設定檔，定義部署的基礎路徑。
* `src/main.jsx`: 應用程式進入點，負責將 React 掛載至 DOM 並注入 BrowserRouter。
* `src/App.jsx`: 核心邏輯層與路由總管。定義了 `/news/list` 與 `/news/content` 兩個主要路由，並處理 API 資料的非同步獲取。

### UI 元件 (src/component/)
* `TopFixedBlock.jsx`: 頂部導覽列元件。
  * 包含網站的 Logo 區塊與全域搜尋框。
  * 提供「最新」、「政治」、「體育」、「財經」四個快捷分類按鈕。
  * 點擊搜尋或分類時，會更新 `readerRequestCollector` 並導航至列表頁。
* `NewsList.jsx`: 新聞列表渲染元件。
  * 接收 `newsList` 並將其映射渲染為多個新聞卡片 (包含封面圖、標題與轉換為台灣時間的發布日期)。
  * 提供「更多新聞」按鈕，點擊時僅修改 `readerRequestCollector` 的 `page` 屬性使其 +1，觸發 App.jsx 載入下一頁資料。
* `ArticlePage.jsx`: 單篇文章閱讀元件。
  * 透過 URL 的 Query String (`?newsid=...`) 取得文章 UUID。
  * 獨立發起 API 請求獲取單篇文章的完整 Metadata (封面區塊) 與內容段落 (Content Blocks)。
  * 使用 `dangerouslySetInnerHTML` 解析後端回傳的富文本 HTML 字串，並渲染對應的段落圖片。

## API 依賴規範

本前端預期後端提供以下 RESTful API 端點（前端代碼中已實作這些請求路徑）：

1. 獲取分類新聞列表
   * 端點：`GET /api/reader/news/list/category`
   * 參數：`category` (數字 ID), `page` (分頁索引)
2. 搜尋新聞列表
   * 端點：`GET /api/reader/news/list/search`
   * 參數：`keyword` (字串), `page` (分頁索引)
3. 獲取單篇文章內容
   * 端點：`GET /api/reader/news/content`
   * 參數：`newsid` (文章的 UUID)
4. 靜態圖片資源
   * 端點：`/images/{image_path}`
   * 用途：載入新聞封面圖 (`cover_image_path`) 與段落附圖 (`content_image_path`)。

## 開發與啟動指南

### 環境要求
確保本地端已安裝 Node.js (建議版本 18 以上) 與 npm。

### 安裝相依套件
在 reader-frontend 目錄下執行：
```bash
npm install