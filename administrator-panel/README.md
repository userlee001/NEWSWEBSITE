# Administrator Panel 說明文件

## 概述

此部分為新聞網站微服務架構中的「系統管理後台」模組 (B2B / Internal)。專門提供給具備 Admin 權限的系統管理員使用。其核心目標在於監控系統安全性、追蹤全站操作日誌 (Audit Log)，以及對平台上的作者與新聞內容進行最高權限的控管與審查（包含帳號註銷與新聞強制下架）。

## 技術架構

* 核心框架：React.js
* 後台框架：react-admin (建構於 Material-UI 之上，提供高度模組化的後台 UI 與資料狀態管理)
* 建置工具：Vite
* 進階編譯：配置 @rolldown/plugin-babel 並啟用 React Compiler (reactCompilerPreset)，優化底層渲染效能。
* 資料串接：客製化的 CustomizedDataProvider，封裝原生 fetch 並設定 `credentials: 'same-origin'` 以確保 JWT Cookie 得以正確傳遞。

## 核心機制與技術亮點

本專案的最大亮點在於捨棄了 react-admin 預設的 REST/GraphQL Data Provider，改為自行實作符合微服務架構的 `CustomizedDataProvider`。

### 1. 客製化資料供應器 (CustomizedDataProvider)
在 `App.jsx` 中，整個應用程式被包裹在 `<Admin dataProvider={CustomizedDataProvider}>` 之中。這個 Provider 攔截了 react-admin 內部所有的資料請求，並精準映射到本專案獨特的後端 API 端點：
* **列表獲取 (getList)**：
  * 當資源為 `audit_log` 時，映射至 `/api/Administrator/check/audit_log`。
  * 當資源為 `writer` 時，映射至 `/api/Administrator/check/user_list`。
  * 自動將後端回傳的 `..._data` 與總數 `..._data_count` 轉換為 react-admin 要求的 `{ data, total }` 格式。
* **關聯查詢 (getManyReference)**：
  * 用於解決一對多關係。當請求 `news_metadata` 且目標為 `user_id` 時，映射至 `/api/Administrator/check/user/news_list?user_id={id}`，藉此獲取特定作者發布的所有新聞。
* **刪除操作 (delete)**：
  * 當資源為 `writer` 時，呼叫 `DELETE /api/Administrator/revoke/user_account` 強制註銷使用者。
  * 當資源為 `news_metadata` 時，呼叫 `DELETE /api/Administrator/takedown/user/news` 強制下架新聞。
* **安全性阻斷 (Security Constraints)**：
  * 本後台的定位為「審查與監控」，因此在 Provider 中明確定義了 `create`、`update` 與 `getMany` 會回傳 `Promise.reject`，從前端底層徹底阻斷任何嘗試修改或新增資料的行為。

### 2. 巢狀展開視圖與關聯資料 (Writer.jsx)
在作者管理介面中，實作了複雜的關聯資料展示：
* 主畫面使用 `<Datagrid>` 列出所有使用者 (UUID、作者名稱、系統角色)。
* 透過設定 `expand={<WriterNewsPanel />}`，管理員可以點擊特定作者的列，向下展開一個子面板。
* `WriterNewsPanel` 內部使用了 `<ReferenceManyField reference="news_metadata" target="user_id">`。這會觸發 `CustomizedDataProvider` 中的 `getManyReference` 方法，動態載入並顯示該名作者所撰寫的所有新聞列表。
* 管理員可以直接在展開的子面板中，針對單篇違規新聞點擊 `<DeleteButton>` 執行強制下架，且設定為悲觀更新 (`mutationMode="pessimistic"`)，確保後端真實刪除後前端才更新畫面。

### 3. 系統審計日誌 (AuditLog.jsx)
提供唯讀的 `<Datagrid>` 表格，幫助管理員監控系統的每一次 API 呼叫。顯示的欄位包含：
* 操作時間 (轉換為本地時間顯示)。
* 操作者名稱 (若未登入則顯示「無名氏/系統」)。
* 執行的動作類型與 API 路徑。
* HTTP 請求方法與回應狀態碼。
* 目標資料表 (`target_table`) 與目標資料 ID (`target_data_id`)，精確追蹤哪一筆資料被更動。

### 4. 路由與微服務適配
* Vite 的 `base` 被設定為 `/administrator/`。
* 此設定確保當反向代理伺服器 (Reverse Proxy) 將 `domain.com/administrator/` 的流量導向此前端容器時，所有的靜態資源 (JS, CSS) 皆能正確加載。

## 資源註冊結構 (Resources)

在 `App.jsx` 中，註冊了三個核心 Resource，這些名稱對應了 Data Provider 中的邏輯判斷：
1. `<Resource name="audit_log" />`：系統審計日誌模組。
2. `<Resource name="writer" />`：作者管理模組。
3. `<Resource name="news_metadata" />`：無獨立頁面，專門作為關聯查詢 (ReferenceManyField) 與刪除特定新聞時的底層資源。

## API 依賴規範

此部分強烈依賴後端提供以下 API 端點（前端在請求時會自動攜帶 credentials 以傳送 HttpOnly Token，由後端的 administratorExclusiveAuthMiddleware 進行權限驗證）：

1. 資料檢視 API (GET)
   * `/api/Administrator/check/audit_log`
   * `/api/Administrator/check/user_list`
   * `/api/Administrator/check/user/news_list?user_id={id}`
2. 管理刪除 API (DELETE)
   * `/api/Administrator/revoke/user_account?user_id={id}`
   * `/api/Administrator/takedown/user/news?news_id={id}`

## 開發與啟動指南

### 1. 環境要求
請確保開發環境具備 Node.js (建議 v18+) 與 npm。

### 2. 安裝相依套件
在 administrator-panel 目錄下執行：
```bash
npm install