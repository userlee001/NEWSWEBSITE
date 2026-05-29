import { pool } from "../Utilities/pool.js";

export const getNewsList = async (request, response, next) => {
    let client;
    try {
        let { category, page: pageNumber } = request.query;
        pageNumber = parseInt(pageNumber, 10);
        if (!Number.isInteger(pageNumber) || pageNumber < 0) {
            throw new Error("無效頁數編號");
        }
        pageNumber *= 5;

        if (category === "0") {
            client = await pool.connect();
            if (!client) {
                throw new Error("資料庫連線失敗");
            }
            const result = await client.query(
                `
                SELECT id, title, created_at, cover_image_path 
                FROM news_metadata
                ORDER BY created_at DESC 
                LIMIT 5 OFFSET $1
            `,
                [pageNumber]
            );
            return response.status(200).json({ news_list: result.rows });
        }

        switch (category) {
            case "1":
                category = "politics";
                break;
            case "2":
                category = "sports";
                break
            case "3":
                category = "finance";
                break
            default:
                throw new Error("無效的分類代碼");
        }
        client = await pool.connect();
        if (!client) {
            throw new Error("資料庫連線失敗");
        }
        const result = await client.query(
            `
                SELECT id, title, created_at, cover_image_path 
                FROM news_metadata 
                WHERE category = $1 
                ORDER BY created_at DESC 
                LIMIT 5 OFFSET $2
            `,
            [category, pageNumber]
        );
        return response.status(200).json({ news_list: result.rows });
    } catch (err) {
        next(err);
    } finally {
        if (client) {
            client.release();
        }
    }
}

export const searchNews = async (request, response, next) => {
    let client;
    try {
        let { page: pageNumber } = request.query;
        pageNumber = parseInt(pageNumber, 10);
        if (!Number.isInteger(pageNumber) || pageNumber < 0) {
            throw new Error("無效頁數編號");
        }
        pageNumber *= 5;
        const { keyword } = request.query;
        if (!keyword) {
            throw new Error("沒有關鍵字");
        }
        const normalizedKeyword = keyword.replace(/[，。！？,.!?]/g, "");
        client = await pool.connect();
        if (!client) {
            throw new Error("無法連線到資料庫");
        }
        const result = await client.query(
            `
                SELECT id, title, created_at, cover_image_path 
                FROM news_metadata
                WHERE title ILIKE '%' || $1 || '%'
                ORDER BY created_at DESC 
                OFFSET $2 LIMIT 5
            `
            ,
            [normalizedKeyword, pageNumber]
        );
        return response.status(200).json({ news_list: result.rows })
    } catch (err) {
        return next(err);
    } finally {
        if (client) {
            client.release();
        }
    }
}

export const getContent = async (request, response, next) => {
    let client;
    try {
        const { newsid: newsId } = request.query;
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(newsId) === false) {
            throw new Error("不正確的newsid格式");
        }
        client = await pool.connect();
        if (!client) {
            throw new Error("資料庫連線失敗");
        }


        const coverResult = await client.query(
            `
                SELECT N.cover_image_path, N.title, N.created_at, W.authorname
                FROM news_metadata as N 
                INNER JOIN writer AS W
                ON N.author_id = W.id
                WHERE N.id = $1
            `
            ,
            [newsId]
        );
        const contentResult = await client.query(
            `   
                SELECT id, content_image_path, content 
                FROM passage_content
                WHERE news_id = $1
                ORDER BY number ASC 
            `
            , [newsId]);
        return response.status(200).json({
            cover: coverResult.rows[0],
            content: contentResult.rows
        })

    } catch (err) {
        return next(err);
    } finally {
        if (client) {
            client.release();
        }
    }
}