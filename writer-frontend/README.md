# Writer Frontend

新聞寫作後台系統的前端專案，提供記者與編輯進行新聞撰寫、更新與管理的操作介面。

---

## 專案結構

```
src/
│ App.jsx                  # 根元件，定義所有路由
│ App.module.css
│ main.css
│ main.jsx                 # 應用程式進入點
│
├─ assets/                 # 靜態資源
│   login-background.jpg
│   monkey-close-eye.svg
│   monkey-open-eye.svg
│   testimg1.png
│
├─ component/              # 可重用元件
│   ContentEditor.jsx      # 文章段落編輯器（含 Quill 富文本 + 圖片上傳）
│   ContentEditor.module.css
│   MainTitleEditor.jsx    # 主標題編輯器（含封面圖片 + 分類標籤）
│   MainTitleEditor.module.css
│
└─ page/                   # 頁面元件
    ListNews.jsx            # 新聞列表頁（含翻頁功能）
    ListNews.module.css
    LoginWriter.jsx         # 登入頁
    LoginWriter.module.css
    RegisterWriter.jsx      # 註冊頁
    RegisterWriter.module.css
    UpdateNews.jsx          # 新聞更新頁
    UpdateNews.module.css
    WriteNews.jsx           # 新聞撰寫頁
    WriteNews.module.css
```

---

## 路由結構

| 路徑 | 元件 | 說明 |
|---|---|---|
| `/list` | `ListNews` | 顯示新聞列表，支援翻頁與跳頁 |
| `/login` | `LoginWriter` | 帳號密碼登入 |
| `/register` | `RegisterWriter` | 建立新帳號 |
| `/write` | `WriteNews` | 撰寫並發布新新聞 |
| `/update/:newsid` | `UpdateNews` | 依 ID 更新或刪除指定新聞 |

---

## 頁面說明

### ListNews — 新聞列表

- 透過 `GET /api/writer/listnews/?page_number={n}` 取得新聞清單
- 顯示封面圖片、標題、分類標籤與建立時間
- 支援「上一頁 / 下一頁」按鈕，以及直接跳轉至指定頁碼（輸入數字後按 Enter）

### LoginWriter — 登入

- 輸入帳號與密碼後，呼叫 `POST /api/authentication/login`
- 登入成功跳轉至 `/write`，失敗顯示錯誤提示
- 頁面背景套用 jQuery Ripples 水波紋特效
- 帳號與密碼欄位皆有「顯示 / 隱藏」切換按鈕（猴子圖示）

### RegisterWriter — 註冊

- 與登入頁介面相同，呼叫 `POST /api/authentication/register`
- 註冊成功跳轉至 `/login`
- 同樣支援水波紋背景與眼睛切換按鈕

### WriteNews — 撰寫新聞

- 包含一個 `MainTitleEditor`（主標題 + 封面圖片 + 分類）
- 可動態新增 / 刪除 `ContentEditor` 段落區塊
- 發布時將所有資料以 `FormData` 送出至 `POST /api/writer/write`

### UpdateNews — 更新新聞

- 進入頁面時自動從 `GET /api/writer/newscontent/:newsid` 載入現有資料
- 封面圖片與段落圖片會從伺服器下載並轉為 `File` 物件，以便重新上傳
- 可修改標題、封面、分類與各段落內容，送出至 `PATCH /api/writer/update/news/:newsid`
- 提供刪除新聞功能，呼叫 `DELETE /api/writer/delete/news/:newsid`

---

## 元件說明

### MainTitleEditor

主標題區塊編輯器，Props 如下：

| Prop | 型別 | 說明 |
|---|---|---|
| `onContentChange` | `(html: string) => void` | 標題內容變更回調 |
| `onImageFileChange` | `(file: File \| null) => void` | 封面圖片變更回調 |
| `onCategoryChange` | `(value: string) => void` | 分類標籤變更回調（`"1"` 政治 / `"2"` 體育 / `"3"` 財經）|
| `initialSetting` | `{ content, category, imageFile }` | 初始值（用於更新頁面的資料預填）|

### ContentEditor

段落內容編輯器，Props 如下：

| Prop | 型別 | 說明 |
|---|---|---|
| `onContentChange` | `(html: string) => void` | 段落內容變更回調 |
| `onImageFileChange` | `(file: File \| null) => void` | 段落圖片變更回調 |
| `initialSetting` | `{ content, imageFile }` | 初始值（用於更新頁面的資料預填）|

兩個編輯器皆基於 **Quill** 富文本編輯器，提供以下功能：

- 字體大小選擇（10px ～ 128px），並支援手動輸入任意 px 值
- 粗體、斜體、底線、刪除線
- 文字顏色與背景顏色
- 清除格式
- 圖片預覽與刪除

---

## API 對應整理

| 方法 | 路徑 | 用途 |
|---|---|---|
| `POST` | `/api/authentication/login` | 登入 |
| `POST` | `/api/authentication/register` | 註冊 |
| `GET` | `/api/writer/listnews/` | 取得新聞列表（分頁） |
| `GET` | `/api/writer/newscontent/:newsid` | 取得單篇新聞內容 |
| `POST` | `/api/writer/write` | 發布新新聞 |
| `PATCH` | `/api/writer/update/news/:newsid` | 更新指定新聞 |
| `DELETE` | `/api/writer/delete/news/:newsid` | 刪除指定新聞 |

---

## 主要技術依賴

| 套件 | 用途 |
|---|---|
| React + React Router | 頁面框架與路由管理 |
| Quill | 富文本編輯器 |
| jQuery + jquery.ripples | 登入 / 註冊頁背景水波紋特效 |
| CSS Modules | 元件樣式隔離 |