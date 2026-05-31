import { request, response } from "express";
import { pool } from "../Utilities/pool.js";

export const checkAuditLog = async (request, response, next) => {

    try {
        const auditlogResult = await pool.query(
            `
            SELECT  
                    AL.id AS "id",
                    AL.user_id AS "user_id", 
                    W.authorname AS "author_name", 
                    AL.action AS "action", 
                    AL.api_path AS "api_path", 
                    AL.request_method AS "request_method", 
                    AL.created_at AS "created_at", 
                    AL.status_code AS "status_code", 
                    AL.ip AS "ip",
                    AL.user_agent AS "user_agent", 
                    ALTI.target_table AS "target_table", 
                    ALTI.target_data_id AS "target_data_id"             
            FROM audit_log AS AL 
            LEFT JOIN audit_log_target_information AS ALTI ON AL.id = ALTI.audit_log_id
            LEFT JOIN writer AS W ON AL.user_id = W.id
            `,
            []
        );

        return response.status(200).json({ audit_log_data: auditlogResult.rows, audit_log_data_count: auditlogResult.rowCount });

    } catch (err) {
        next(err);
    }
}

export const listUser = async (request, response, next) => {
    try {
        const userListResult = await pool.query(
            `
                SELECT 
                    id, 
                    authorname, 
                    role
                FROM writer
            `
            , []
        );

        return response.status(200).json({ user_data: userListResult.rows, total_user_number: userListResult.rowCount });
    } catch (err) {
        next(err);
    }

}

export const revokeUserAccount = async (request, response, next) => {
    try {

        const { user_id: userId } = request.query;

        if (!userId) {
            throw new Error("No account provided");
        }

        const deregistrationUserAccountResult = await pool.query(
            `
                DELETE FROM writer
                WHERE id = $1
            `
            , [userId]
        );

        if (deregistrationUserAccountResult.rowCount === 0) {
            throw new Error("Account provided is incorrect");
        }

        return response.status(200).json({ message: "success" });
    } catch (err) {
        next(err);
    }
}

export const listNewsTitleOfOneUser = async (request, response, next) => {
    try {
        const { user_id: userId } = request.query;

        if (!userId) {
            throw new Error("No account provided");
        }

        const newsListResult = await pool.query(
            `
                SELECT id, title, created_at, category
                FROM news_metadata 
                WHERE author_id = $1
            `
            , [userId]
        );

        return response.status(200).json({ user_news_list: newsListResult.rows, user_news_list_count: newsListResult.rowCount });
    } catch (err) {
        next(err);
    }
}

export const takeDownAPieceOfNewsOfOneUser = async (request, response, next) => {
    try {
        const { news_id: newsId } = request.query;

        if (!newsId) {
            throw new Error("No news provided");
        }

        const deleteNewsResult = await pool.query(
            `
                DELETE FROM news_metadata
                WHERE id = $1 
            `
            , [newsId]
        );

        if (deleteNewsResult.rowCount === 0) {
            throw new Error("News provided is incorrect");
        }

        return response.status(200).json({ message: "success" });

    } catch (err) {
        next(err);
    }
}