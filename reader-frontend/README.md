# 新聞閱讀器前端 (News Reader Frontend)

一個以 React 建構的新聞閱讀器網站前端，支援分類瀏覽、關鍵字搜尋與文章詳細頁面。

---

## 專案結構

```
src/
├── App.css
├── App.jsx                     # 根元件，負責資料獲取與路由
├── main.css
├── main.jsx                    # 應用程式入口
├── assets/
│   └── search-icon.svg
└── component/
    ├── TopFixedBlock.jsx       # 頂部固定導覽列（搜尋 + 分類）
    ├── TopFixedBlock.css
    ├── NewsList.jsx            # 新聞列表頁面
    ├── NewsList.css
    ├── ArticlePage.jsx         # 文章詳細內容頁面
    └── ArticlePage.module.css
```

---

## 路由結構

| 路徑 | 元件 | 說明 |
|------|------|------|
| `/news/list` | `NewsList` | 新聞列表（分類或搜尋結果） |
| `/news/content?newsid={id}` | `ArticlePage` | 單篇文章詳細頁面 |

---

## 元件說明

### `App.jsx`

應用程式根元件，負責：

- 管理 `readerRequestCollector` 狀態，統一收集來自子元件的請求參數（分類或搜尋）。
- 根據 `distinguisher` 欄位（`"categoryList"` / `"searchList"`）組裝對應的 API 請求 URL。
- 以 `useEffect` 監聽請求參數變化，發送 fetch 請求並更新 `newsList`。
- 支援分頁追加：`page === 0` 時重置列表，否則累加至現有列表。

**狀態：**

| 狀態 | 型別 | 說明 |
|------|------|------|
| `readerRequestCollector` | Object | 請求參數集合（類型、分類、頁碼、關鍵字、URL 前綴） |
| `newsList` | Array | 當前顯示的新聞列表 |

---

### `TopFixedBlock.jsx`

頂部固定導覽列，包含：

- **搜尋欄**：輸入關鍵字後點擊搜尋圖示，觸發關鍵字搜尋。
- **分類按鈕**：最新 / 政治 / 體育 / 財經，點擊後切換分類並導向 `/news/list`。

**Props：**

| Prop | 型別 | 說明 |
|------|------|------|
| `setReaderRequestCollector` | Function | 更新根元件的請求參數狀態 |

**API 前綴常數：**

```js
const categoryListRequestPrefix = "/api/reader/news/list/category";
const searchListRequestPrefix   = "/api/reader/news/list/search";
```

---

### `NewsList.jsx`

新聞列表頁面，負責：

- 渲染 `newsList` 中的每筆新聞卡片（封面圖、標題、時間）。
- 點擊卡片導向 `/news/content?newsid={id}`。
- 點擊「更多新聞」按鈕將 `page` 加一，觸發根元件載入下一頁。

**Props：**

| Prop | 型別 | 說明 |
|------|------|------|
| `setReaderRequestCollector` | Function | 更新頁碼以觸發分頁載入 |
| `newsList` | Array | 欲渲染的新聞列表資料 |

---

### `ArticlePage.jsx`

文章詳細頁面，負責：

- 從 URL query string 取得 `newsid`。
- 呼叫 `/api/reader/news/content?newsid={newsid}` 取得文章資料。
- 渲染封面圖、標題（HTML）、作者名、發布時間（UTC+8）。
- 渲染多段內容（每段含內文圖片與 HTML 內文）。
- 資料尚未載入時顯示 `loading....`。

---

## API 端點

| 方法 | 端點 | 參數 | 說明 |
|------|------|------|------|
| GET | `/api/reader/news/list/category` | `category`, `page` | 依分類取得新聞列表 |
| GET | `/api/reader/news/list/search` | `keyword`, `page` | 依關鍵字搜尋新聞列表 |
| GET | `/api/reader/news/content` | `newsid` | 取得單篇文章完整內容 |

### 回應格式範例

**新聞列表（`/api/reader/news/list/...`）**
```json
{
  "news_list": [
    {
      "id": 1,
      "title": "<b>新聞標題</b>",
      "cover_image_path": "path/to/image.jpg",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**文章內容（`/api/reader/news/content`）**
```json
{
  "cover": {
    "title": "<b>文章標題</b>",
    "cover_image_path": "path/to/cover.jpg",
    "authorname": "記者姓名",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "content": [
    {
      "id": 1,
      "content_image_path": "path/to/image.jpg",
      "content": "<p>內文...</p>"
    }
  ]
}
```

---

## 資料流

```
使用者操作（選擇分類 / 搜尋）
    ↓
TopFixedBlock 呼叫 setReaderRequestCollector
    ↓
App.jsx useEffect 監聽到變化 → 組裝 URL → fetch API
    ↓
更新 newsList → 傳入 NewsList 渲染
    ↓
使用者點擊「更多新聞」→ page + 1 → 追加更多資料
    ↓
使用者點擊卡片 → 導向 /news/content?newsid={id}
    ↓
ArticlePage 獨立 fetch 文章內容並渲染
```

---

## 靜態資源

封面圖與內文圖片皆透過 `/images/{path}` 路徑存取，需由後端或靜態伺服器提供對應的圖片資源。

---

## 技術棧

| 套件 | 用途 |
|------|------|
| React | UI 框架 |
| React Router DOM | 前端路由（`Routes`, `Route`, `useNavigate`, `useSearchParams`） |
| lodash (`isEqual`) | 深度比較物件，判斷文章資料是否已載入 |

---
