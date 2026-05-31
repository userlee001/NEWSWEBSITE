# Writer Frontend 專案說明文件

## 專案概述

本專案為新聞網站微服務架構中的「作者端後台」模組 (B2B / CMS)。專為記者與專欄作家設計，提供完整的內容管理系統功能，包含身份驗證、新聞列表分頁檢視、多段落圖文編輯器，以及針對現有新聞的修改與刪除功能。本專案以 React 構建，並深度整合 FormData API 處理複雜的多媒體檔案上傳。

## 技術架構

* 核心框架：React.js
* 建置工具：Vite
* 進階編譯：配置 `@rolldown/plugin-babel` 並啟用 React Compiler (`reactCompilerPreset`)，以達到自動最佳化渲染效能的目的。
* 路由管理：React Router v6 (react-router-dom)
* 樣式管理：CSS Modules (例如 `UpdateNews.module.css`)，確保樣式隔離。
* 視覺特效：jQuery 搭配 `jquery.ripples` 實作登入與註冊頁面的水波紋互動背景。
* 網路請求：原生 Fetch API 搭配 FormData 處理圖文混排表單。

## 核心機制與技術亮點

### 1. 動態圖文編輯器狀態管理 (WriteNews)
在撰寫新聞頁面中，文章結構被拆分為「主標題區塊」與「動態段落區塊」。
* **主標題狀態 (`mainTitle`)**：包含 `content` (標題文字)、`category` (分類代碼)、`imageFile` (封面圖片檔案)。
* **段落陣列狀態 (`blockList`)**：這是一個陣列，允許使用者透過「加一段」或「減一段」動態調整長度。每個段落皆會透過 `crypto.randomUUID()` 賦予唯一的 ID，並包含獨立的 `content` 與 `imageFile` 狀態。
* **FormData 封裝上傳**：發布時，系統會將純文字資料（如段落的文字內容）轉換為 JSON 字串並附加至 `blocksInformation` 欄位；針對圖片檔案，則動態生成 `image_${block.id}` 的鍵值附加至 FormData 中，確保後端能精準對應每一段落的圖片。

### 2. 舊有圖片資源的 Blob 轉換與回填機制 (UpdateNews)
這是本專案在實作編輯功能時的一大亮點。為了讓「更新」與「新增」共用相同的 FormData 上傳邏輯，當使用者進入修改頁面時，系統會執行以下流程：
1. 透過 API 獲取文章的 Metadata 與舊有圖片路徑 (`cover_image_path` 與 `content_image_path`)。
2. 針對每一張圖片，前端主動發起 Fetch 請求至 `/images/...`。
3. 取得 Response 後，將其轉換為 `Blob` 格式。
4. 透過 `new File([blob], filename, { type: blob.type })` 將 Blob 封裝回 File 物件。
5. 將這些重構的 File 物件設定回 React 狀態中。如此一來，即使使用者沒有更換圖片，表單送出時依然會攜帶完整的圖片實體檔案，完美對接後端的覆寫邏輯。

### 3. jQuery 特效的生命週期管理 (Login / Register)
登入與註冊頁面使用了基於 jQuery 的 `jquery.ripples` 特效。為避免在 React SPA 架構中引發記憶體洩漏 (Memory Leak)，專案在 `useEffect` 中嚴格控管了特效的生命週期：
* **掛載時**：透過 `useRef` 取得背景 DOM 節點，並呼叫 `jQuery(backgroundRef.current).ripples({...})` 初始化特效。
* **卸載時**：在 `useEffect` 的清理函數 (Cleanup Function) 中，確實呼叫 `jQuery(backgroundRef.current).ripples('destroy')` 銷毀特效實體，確保切換路由時釋放記憶體。

### 4. 路由與微服務適配
* Vite 的 `base` 被設定為 `/writer/`。
* `main.jsx` 中的 `BrowserRouter` 設定了 `basename="/writer"`。
這確保了前端編譯後的資源路徑與路由切換，皆能與反向代理伺服器 (Reverse Proxy) 的路由分發規則完美契合。

## 目錄結構與模組解析

### 頁面元件 (src/page/)
* `LoginWriter.jsx` / `RegisterWriter.jsx`：處理作者的身份驗證，包含密碼顯示/隱藏切換機制與水波紋背景。API 請求採用 `application/json` 格式傳遞帳號密碼。
* `ListNews.jsx`：作者專屬的新聞管理列表。實作了精確的受控表單分頁機制 (Pagination)，包含「上一頁/下一頁」按鈕以及輸入特定頁碼跳轉 (`pageNumberInputValue`) 的功能。
* `WriteNews.jsx`：全新新聞的撰寫頁面，負責調度 `MainTitleEditor` 與 `ContentEditor`，並處理最終的 `POST` 發布邏輯。
* `UpdateNews.jsx`：既有新聞的編輯與刪除頁面。負責在初始化時載入遠端資料與圖片 Blob，並處理 `PATCH` 更新與 `DELETE` 刪除邏輯。

### 共用 UI 元件 (src/component/)
* `MainTitleEditor.jsx`：專責處理文章標題、分類選單與封面圖片上傳的受控元件。
* `ContentEditor.jsx`：專責處理單一段落的文字輸入與附圖上傳的受控元件。

## API 依賴規範

本前端專案強烈依賴後端提供以下 API 端點與跨域設定（需處理 HttpOnly Cookie 狀態）：

1. 身份驗證 API (傳遞 JSON)
   * `POST /api/authentication/login`
   * `POST /api/authentication/register`
2. 內容管理 API (需要驗證狀態)
   * `GET /api/writer/listnews/?page_number={page}`：獲取作者歷史文章。
   * `GET /api/writer/newscontent/{newsid}`：獲取特定文章詳細內容。
   * `DELETE /api/writer/delete/news/{newsid}`：刪除特定文章。
3. 內容發布與更新 API (傳遞 Multipart/form-data)
   * `POST /api/writer/write`：發布新文章。
   * `PATCH /api/writer/update/news/{newsid}`：覆寫舊文章。
4. 靜態圖片服務
   * `GET /images/{image_path}`：供編輯頁面讀取舊圖片並轉換為 Blob 使用。

## 開發與啟動指南

### 1. 環境要求
請確保開發環境具備 Node.js (建議 v18+) 與 npm。

### 2. 安裝相依套件
在 writer-frontend 目錄下執行：
```bash
npm install