# Authentication API

## 1. 作者註冊

### Request

```http id="ef6j2n"
POST /api/auth/register
Content-Type: application/json
```

---

### Request Body

```json id="vv6s0d"
{
    "username": "testuser",
    "password": "123456"
}
```

---

### Validation Rules

| Field    | Rule      |
| -------- | --------- |
| username | 長度至少 6 字元 |
| password | 長度至少 6 字元 |
| username | 不可重複      |

---

### Password Security

密碼會使用：

```text id="i3t1oc"
bcrypt.hash(password, 10)
```

進行加密儲存。

---

### Success Response

```json id="2l8vk7"
{
    "message": "success"
}
```

---

### Error Response

```json id="nhnlx7"
{
    "message": "帳號名稱重複"
}
```

---

### Possible Error Messages

| Message |
| ------- |
| 帳號名稱太短  |
| 帳號名稱重複  |
| 密碼太短    |

---

## 2. 作者登入

### Request

```http id="0cnplw"
POST /api/auth/login
Content-Type: application/json
```

---

### Request Body

```json id="8w1h31"
{
    "username": "testuser",
    "password": "123456"
}
```

---

### Login Flow

1. 查詢 writer table
2. 驗證帳號是否存在
3. 使用 bcrypt.compare 驗證密碼
4. 建立 JWT token
5. 設定 httpOnly cookie
6. 回傳 writer 資訊

---

### JWT Payload

```json id="u0t3ns"
{
    "id": 1,
    "role": "writer"
}
```

---

### JWT Config

| Option    | Value |
| --------- | ----- |
| algorithm | HS256 |
| expiresIn | 1d    |

---

### Cookie Config

```javascript id="qit8f2"
{
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000
}
```

---

### Cookie Notes

| Option             | Description               |
| ------------------ | ------------------------- |
| httpOnly           | 前端 JavaScript 無法存取 cookie |
| sameSite: "strict" | 防止 CSRF                   |
| maxAge             | 1 天                       |
| secure: false      | 開發環境設定                    |

---

### Success Response

```json id="3v9h11"
{
    "writer": {
        "name": "testuser",
        "role": "writer"
    },
    "message": "success"
}
```

---

### Error Response

```json id="n6v4ql"
{
    "message": "密碼錯誤"
}
```

---

### Possible Error Messages

| Message |
| ------- |
| 帳號錯誤    |
| 密碼錯誤    |

---

## Database Table

### writer

| Column     |
| ---------- |
| id         |
| authorname |
| password   |
| role       |

---

## Security Features

| Feature                  | Status                |
| ------------------------ | --------------------- |
| Password Hashing         | ✅ bcrypt              |
| JWT Authentication       | ✅                     |
| httpOnly Cookie          | ✅                     |
| SQL Injection Prevention | ✅ parameterized query |
| CSRF Basic Protection    | ✅ sameSite strict     |

---

## Important Notes

### Development Environment

目前設定：

```javascript id="y4k8n1"
secure: false
```

正式環境建議改為：

```javascript id="1xkp83"
secure: true
```

並搭配 HTTPS。

---

### Authentication Method

登入後：

* JWT 會儲存在 cookie
* 後續 API 透過 middleware 驗證 token
* middleware 會將 payload 存入：

```javascript id="u4bo4v"
request.jwtToken
```

<br>
<br>

# Public News API

## 1. 取得新聞列表

### Request

```http id="6rj5hx"
GET /api/news/list?category={category}&page={page}
```

---

### Query Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| category  | string | ✅        | 新聞分類代碼      |
| page      | number | ✅        | 頁數（從 0 開始）  |

---

### category Mapping

| Value | Category |
| ----- | -------- |
| `"0"` | 全部新聞     |
| `"1"` | politics |
| `"2"` | sports   |
| `"3"` | finance  |

---

### Pagination Rule

每頁固定回傳：

```text id="m4ux8y"
5 筆資料
```

offset 計算：

```text id="ph3z4o"
offset = page * 5
```

---

### Success Response

```json id="8qav6q"
{
    "news_list": [
        {
            "id": "uuid",
            "title": "新聞標題",
            "created_at": "2026-05-28T12:00:00.000Z",
            "cover_image_path": "cover.jpg"
        }
    ]
}
```

---

### Sort Rule

新聞依照建立時間排序：

```sql id="ek5l0n"
ORDER BY created_at DESC
```

---

### Error Response

```json id="8cx7fd"
{
    "message": "無效頁數編號"
}
```

---

## 2. 搜尋新聞

### Request

```http id="qejm79"
GET /api/news/search?keyword={keyword}&page={page}
```

---

### Query Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| keyword   | string | ✅        | 搜尋關鍵字       |
| page      | number | ✅        | 頁數（從 0 開始）  |

---

### Search Rule

搜尋使用：

```sql id="4w4md7"
ILIKE '%' || keyword || '%'
```

支援：

* 不分大小寫
* 模糊搜尋

---

### Keyword Normalization

搜尋前會移除：

```text id="3z0v0x"
，。！？,.!?
```

Example:

```text id="8k6gl2"
"台積電！"
→
"台積電"
```

---

### Pagination Rule

每頁固定：

```text id="o4h6r6"
5 筆資料
```

---

### Success Response

```json id="5s2i7y"
{
    "news_list": [
        {
            "id": "uuid",
            "title": "新聞標題",
            "created_at": "2026-05-28T12:00:00.000Z",
            "cover_image_path": "cover.jpg"
        }
    ]
}
```

---

### Error Response

```json id="2uwyje"
{
    "message": "沒有關鍵字"
}
```

---

## 3. 取得單篇新聞內容

### Request

```http id="2n8m3x"
GET /api/news/content?newsid={newsid}
```

---

### Query Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| newsid    | uuid | ✅        | 新聞 id       |

---

### UUID Validation

newsid 必須符合 UUID 格式：

```regex id="8qq9vw"
^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
```

---

### Success Response

```json id="65s0rx"
{
    "cover": {
        "cover_image_path": "cover.jpg",
        "title": "新聞標題",
        "created_at": "2026-05-28T12:00:00.000Z",
        "authorname": "testuser"
    },
    "content": [
        {
            "id": "uuid",
            "content_image_path": "image1.jpg",
            "content": "第一段內容"
        },
        {
            "id": "uuid",
            "content_image_path": null,
            "content": "第二段內容"
        }
    ]
}
```

---

### Content Order

段落依照 number 排序：

```sql id="3xv1h7"
ORDER BY number ASC
```

---

### Database Join

作者名稱透過：

```sql id="twm2dx"
INNER JOIN writer
```

取得。

---

## Common Error Responses

```json id="jlwm28"
{
    "message": "錯誤訊息"
}
```

---

### Possible Error Messages

| Message      |
| ------------ |
| 無效頁數編號       |
| 無效的分類代碼      |
| 沒有關鍵字        |
| 不正確的newsid格式 |
| 資料庫連線失敗      |
| 無法連線到資料庫     |

---

## Security Notes

### SQL Injection Prevention

所有 SQL 均使用：

```javascript id="s9iqqf"
$1, $2 ...
```

parameterized query。

---

## Pagination Notes

目前系統：

```text id="w9sbhm"
固定每頁 5 筆
```

若未來需要擴充，可新增：

```text id="kg3tf6"
limit query parameter
```
  
<br>
<br>

# Write News API

## 1. 作者新增一則新聞

### Request

```http
POST /api/writer/write
Content-Type: multipart/form-data
Authorization: Bearer <JWT_TOKEN>
```

---

### Form Data Fields

| Field              | Type         | Required | Description |
| ------------------ | ------------ | -------- | ----------- |
| mainTitleText      | string       | ✅        | 新聞主標題       |
| mainTitleImageFile | file         | ✅        | 新聞封面圖片      |
| category           | string       | ✅        | 新聞分類代碼      |
| blocksInformation  | string(JSON) | ✅        | 新聞段落資料      |
| image_{blockId}    | file         | ❌        | 對應段落圖片      |

---

### category Mapping

| Value | Category |
| ----- | -------- |
| `"1"` | politics |
| `"2"` | sports   |
| `"3"` | finance  |

---

### blocksInformation Format

`blocksInformation` 必須使用 `JSON.stringify()` 後傳送。

Example:

```json
[
    {
        "id": "block1",
        "content": "第一段內容"
    },
    {
        "id": "block2",
        "content": "第二段內容"
    }
]
```

---

### Image Mapping Rule

段落圖片需使用以下格式：

```text
image_{blockId}
```

Example:

```text
image_block1
image_block2
```

後端會依照 `block.id` 自動對應圖片。

---

### Example Request

```javascript
const formData = new FormData();

formData.append("mainTitleText", "台積電最新消息");
formData.append("mainTitleImageFile", file);
formData.append("category", "3");

formData.append(
    "blocksInformation",
    JSON.stringify([
        {
            id: "block1",
            content: "第一段內容"
        },
        {
            id: "block2",
            content: "第二段內容"
        }
    ])
);

formData.append("image_block1", image1);
formData.append("image_block2", image2);
```

---

### Success Response

```json
{
    "message": "上傳成功"
}
```

---

### Error Response

```json
{
    "message": "錯誤訊息"
}
```

## 2. 作者取得新聞列表

### Request

```http id="cwt1sq"
GET /api/writer/list?page_number={page_number}
Authorization: Bearer <JWT_TOKEN>
```

---

### Query Parameters

| Parameter   | Type   | Required | Description |
| ----------- | ------ | -------- | ----------- |
| page_number | number | ✅        | 頁數（從 0 開始）  |

---

### Pagination Rule

每頁固定回傳：

```text id="3guhif"
5 筆新聞資料
```

offset 計算方式：

```text id="z5ukc7"
offset = page_number * 5
```

---

### Success Response

```json id="yofqpd"
{
    "news_list": [
        {
            "id": 1,
            "title": "新聞標題",
            "created_at": "2026-05-28T12:00:00.000Z",
            "category": "finance",
            "cover_image_path": "image.jpg"
        }
    ]
}
```

---

### Sort Rule

新聞依照建立時間排序：

```sql id="n6s6o7"
ORDER BY created_at DESC
```

---

## 3. 作者取得單篇新聞內容

### Request

```http id="v9o0xu"
GET /api/writer/content/:newsid
Authorization: Bearer <JWT_TOKEN>
```

---

### Path Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| newsid    | string | 新聞 id       |

---

### Success Response

```json id="l2pq8o"
{
    "cover": {
        "cover_image_path": "cover.jpg",
        "title": "新聞標題",
        "category": "finance"
    },
    "content": [
        {
            "content_image_path": "image1.jpg",
            "content": "第一段內容"
        },
        {
            "content_image_path": null,
            "content": "第二段內容"
        }
    ]
}
```

---

### Content Order

內文會依照段落順序排序：

```sql id="md6s0o"
ORDER BY number ASC
```

---

## 4. 作者更新新聞

### Request

```http id="s17htm"
PUT /api/writer/update/:newsid
Content-Type: multipart/form-data
Authorization: Bearer <JWT_TOKEN>
```

---

### Path Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| newsid    | string | 新聞 id       |

---

### Form Data Fields

| Field              | Type         | Required | Description |
| ------------------ | ------------ | -------- | ----------- |
| mainTitleText      | string       | ✅        | 新聞標題        |
| mainTitleImageFile | file         | ✅        | 新封面圖片       |
| category           | string       | ✅        | 分類代碼        |
| blocksInformation  | string(JSON) | ✅        | 新段落內容       |
| image_{blockId}    | file         | ❌        | 段落圖片        |

---

### Update Behavior

更新流程：

1. 更新新聞 metadata
2. 刪除舊 passage_content
3. 重新建立新的 passage_content
4. transaction commit 後刪除舊圖片

---

### Important Notes

更新時：

* 必須重新上傳封面圖片
* 舊段落內容會全部刪除後重建
* 舊圖片檔案會自動刪除

---

### Success Response

```json id="aj7e93"
{
    "message": "更新成功"
}
```

---

## 5. 作者刪除新聞

### Request

```http id="59p6dx"
DELETE /api/writer/delete/:newsid
Authorization: Bearer <JWT_TOKEN>
```

---

### Path Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| newsid    | string | 新聞 id       |

---

### Delete Behavior

刪除流程：

1. 刪除 news_metadata
2. 刪除 passage_content
3. transaction commit
4. 刪除舊圖片檔案

---

### Success Response

```json id="1g3j2r"
{
    "message": "刪除成功"
}
```

---

## Common Error Responses

```json id="z6z5z1"
{
    "message": "錯誤訊息"
}
```

---

### Possible Error Messages

| Message   |
| --------- |
| 沒有作者帳號    |
| 無效頁數編號    |
| 找不到新聞id   |
| 沒有標題      |
| 沒有內文      |
| 沒有封面照片    |
| 無效的分類代碼   |
| 找不到資料     |
| 沒有可以刪除的新聞 |
| 資料庫連線失敗   |

---

## Database Tables

### news_metadata

| Column           |
| ---------------- |
| id               |
| title            |
| author_id        |
| category         |
| cover_image_path |
| created_at       |

---

### passage_content

| Column             |
| ------------------ |
| id                 |
| news_id            |
| number             |
| content            |
| content_image_path |

```
```