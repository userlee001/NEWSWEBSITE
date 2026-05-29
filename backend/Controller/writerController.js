import { pool } from "../Utilities/pool.js";
import { handleDeletePreStoredImage } from "../Utilities/deletePreStoredImage.js"
import fs from "fs";

export const writeNews = async (request, response, next) => {
    let client;
    try {
        const mainTitleText = request.body.mainTitleText;
        if (!mainTitleText) {
            throw new Error("沒有標題");
        }
        const blocksInformation = JSON.parse(request.body.blocksInformation || "[]");
        if (!blocksInformation || blocksInformation.length === 0) {
            throw new Error("沒有內文")
        }
        const cover_image = (request.files.find((item) => { return item.fieldname === "mainTitleImageFile" }));
        if (!cover_image) {
            throw new Error("沒有封面照片");
        }
        const cover_image_path = cover_image.filename;
        const author_id = request.jwtToken.id;
        if (!author_id) {
            throw new Error("沒有作者帳號");
        }
        let category = request.body.category;
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

        await client.query('BEGIN');

        const insert_news_metadata_result = await client.query(
            `
                INSERT INTO news_metadata (title, author_id, category, cover_image_path) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
            `,
            [mainTitleText, author_id, category, cover_image_path]
        );

        let news_id = insert_news_metadata_result.rows[0].id;

        if (!news_id) {
            throw new Error("沒有新聞id");
        }

        response.locals.audit.target = [{ table: "news_metadata", id: news_id }];

        let passage_number = 1;

        for (const block of blocksInformation) {

            const passage_image_path = (request.files.find((item) => { return item.fieldname === `image_${block.id}` }))?.filename || null;

            const content = block.content;

            const insert_passage_content_result = await client.query(
                `
                INSERT INTO passage_content (content_image_path, content, number, news_id) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
                `,
                [passage_image_path, content, passage_number, news_id]
            );

            response.locals.audit.target.push({ table: "passage_content", id: insert_passage_content_result.rows[0].id });

            passage_number += 1;
        }

        await client.query('COMMIT');

        return response.status(200).json({ message: "上傳成功" });
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');
            response.locals.audit.target = [];
        }
        next(err);
    } finally {
        if (client) {
            client.release();
        }
    }
}

export const listNews = async (request, response, next) => {
    let client;
    try {
        const author_id = request.jwtToken?.id;
        if (!author_id) {
            throw new Error("沒有作者帳號");
        }
        let page_number = request.query.page_number;
        page_number = parseInt(page_number, 10);
        if (!Number.isInteger(page_number) || page_number < 0) {
            throw new Error("無效頁數編號");
        }
        page_number *= 5;
        client = await pool.connect();
        if (!client) {
            throw new Error("資料庫連線失敗");
        }
        const result = await client.query(
            `
                SELECT id, title, created_at, category, cover_image_path 
                FROM news_metadata 
                WHERE author_id = $1
                ORDER BY created_at DESC 
                LIMIT 5 OFFSET $2
            `,
            [author_id, page_number]
        );
        return response.status(200).json({ news_list: result.rows })
    } catch (err) {
        next(err);
    } finally {
        if (client) {
            client.release();
        }
    }
}

export const getContentOfNews = async (request, response, next) => {
    let client;
    try {
        const authorId = request.jwtToken?.id;
        if (!authorId) {
            throw new Error("沒有作者帳號");
        }
        const newsId = request.params.newsid;
        if (typeof newsId !== 'string') {
            throw new Error("新聞id格式錯誤");
        }
        client = await pool.connect();
        if (!client) {
            throw new Error("資料庫連線錯誤")
        }
        const coverResult = await client.query(
            `
                SELECT cover_image_path, title, category
                FROM news_metadata
                WHERE author_id = $1 AND id = $2 
            `
            , [authorId, newsId]);
        if (coverResult.rowCount === 0) {
            throw new Error("找不到資料");
        }
        const contentResult = await client.query(
            `   
                SELECT content_image_path, content 
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

export const updateNews = async (request, response, next) => {
    let client;
    try {
        const authorId = request.jwtToken?.id;

        if (!authorId) {
            throw new Error("沒有作者帳號");
        }

        const { newsid: newsId } = request.params;

        if (!newsId) {
            throw new Error("找不到新聞id");
        }

        const mainTitleText = request.body.mainTitleText;

        if (!mainTitleText) {
            throw new Error("沒有標題");
        }

        const blocksInformation = JSON.parse(request.body.blocksInformation || "[]");

        if (!blocksInformation || blocksInformation.length === 0) {
            throw new Error("沒有內文")
        }

        const coverImage = (request.files.find((item) => { return item.fieldname === "mainTitleImageFile" }));

        if (!coverImage) {
            throw new Error("沒有封面照片");
        }

        const coverImagePath = coverImage.filename;

        if (!coverImagePath) {
            throw new Error("沒有封面照片路徑");
        }

        let category = request.body.category;

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

        await client.query('BEGIN');

        let oldCoverImagePath = await client.query(
            `
                SELECT cover_image_path
                FROM news_metadata
                WHERE author_id = $1 AND id = $2 
                FOR UPDATE
            `
            , [authorId, newsId]
        );

        if (oldCoverImagePath.rowCount === 0 || !oldCoverImagePath.rows[0]["cover_image_path"]) {
            throw new Error("找不到舊版的封面照片");
        }

        oldCoverImagePath = oldCoverImagePath.rows[0]["cover_image_path"];

        const updateNewsMetadataResult = await client.query(
            `
                UPDATE news_metadata 
                SET title = $3, category = $4, cover_image_path = $5
                WHERE author_id = $1 AND id = $2
                RETURNING *
            `,
            [authorId, newsId, mainTitleText, category, coverImagePath]
        );

        if (updateNewsMetadataResult.rowCount === 0) {
            throw new Error("無可以被更新的資料");
        }

        response.locals.audit.target = [{ table: "news_metadata", id: newsId }];

        const deletePassageContentResult = await client.query(
            `
                DELETE 
                FROM passage_content
                WHERE news_id = $1
                RETURNING *
            `
            ,
            [newsId]
        );

        if (deletePassageContentResult.rowCount === 0) {
            throw new Error("無可刪除的新聞內容");
        }

        for (let i = 0; i < deletePassageContentResult.rowCount; i++) {
            response.locals.audit.target.push({ table: "passage_content", id: deletePassageContentResult.rows[i].id });
        }

        let oldContentImagePath = deletePassageContentResult.rows.map((element) => {
            return element["content_image_path"];
        });

        let passageNumber = 1;

        for (const block of blocksInformation) {

            const passage_image_path = (request.files.find((item) => { return item.fieldname === `image_${block.id}` }))?.filename || null;
            
            const content = block.content;
            
            const insertPassageContentResult = await client.query(
                `
                INSERT INTO passage_content (content_image_path, content, number, news_id) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *
                `,
                [passage_image_path, content, passageNumber, newsId]
            );

            response.locals.audit.target.push({ table: "passage_content", id: insertPassageContentResult.rows[0].id })
            
            passageNumber += 1;
        }

        await client.query('COMMIT');

        try {
            handleDeletePreStoredImage([...oldContentImagePath, oldCoverImagePath].filter(Boolean));
        } catch (err) {
            console.error("刪除照片時遇到錯誤: ", err.message);
        }
        return response.status(200).json({ message: "更新成功" });
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK');

            response.locals.audit.target = [];
        }
        next(err);
    } finally {
        if (client) {
            client.release();
        }
    }
}

export const deleteNews = async (request, response, next) => {
    let client;
    try {
        const authorId = request.jwtToken?.id;
        if (!authorId) {
            throw new Error("沒有作者帳號");
        }
        const { newsid: newsId } = request.params;
        if (!newsId) {
            throw new Error("找不到新聞id");
        }
        client = await pool.connect();
        await client.query("BEGIN");
        const deleteNewsMetadataResult = await client.query(
            `
                DELETE 
                FROM news_metadata 
                WHERE author_id = $1 AND id = $2
                RETURNING cover_image_path
            `
            ,
            [authorId, newsId]
        );
        if (deleteNewsMetadataResult.rowCount === 0) {
            throw new Error("沒有可以刪除的新聞");
        }
        const oldCoverImagePath = deleteNewsMetadataResult.rows[0]["cover_image_path"];
        const deletePassageContentResult = await client.query(
            `
                DELETE 
                FROM passage_content
                WHERE news_id = $1
                RETURNING content_image_path
            `
            ,
            [newsId]
        );
        if (deletePassageContentResult.rowCount === 0) {
            throw new Error("沒有可以刪除的新聞")
        }
        const oldContentImagePath = deletePassageContentResult.rows.map((element) => {
            return element["content_image_path"];
        });
        await client.query("COMMIT");

        response.locals.audit.target = [{ table: "news_metadata", id: newsId }];

        for (let i = 0; i < deletePassageContentResult.rowCount; i++) {
            response.locals.audit.target.push({ table: "passage_content", id: deletePassageContentResult.rows[i].id })
        }

        try {
            handleDeletePreStoredImage([...oldContentImagePath, oldCoverImagePath].filter(Boolean));
        } catch (err) {
            console.error("刪除照片時遇到錯誤: ", err.message);
        }
        return response.status(200).json({ message: "刪除成功" });

    } catch (err) {
        if (client) {
            await client.query("ROLLBACK");
        }
        next(err);
    } finally {
        if (client) {
            client.release();
        }
    }
}