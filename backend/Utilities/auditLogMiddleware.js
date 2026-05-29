import { pool } from "./pool.js";

export const auditLogMiddleware = () => {
    return (request, response, next) => {
        response.on("finish", async () => {
            let client;
            try {
                const audit = response.locals.audit;

                if (!audit) {
                    return;
                }

                const shouldRecord = audit.shouldRecord;

                if (!shouldRecord) {
                    return;
                }

                client = await pool.connect();

                if (!client) {
                    return;
                }

                await client.query("BEGIN");

                const ip =
                    request.headers["x-forwarded-for"]?.split(",")[0] ||
                    request.socket.remoteAddress ||
                    request.ip ||
                    null;
                const insert_audit_log_result = await client.query(
                    `
                        INSERT INTO audit_log (user_id, action, api_path, request_method, status_code, ip, user_agent)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING id
                    `
                    , [request.jwtToken?.id || null, audit.action, request.originalUrl, request.method, response.statusCode, ip, request.headers["user-agent"] || null]
                );

                const auditLogId = insert_audit_log_result.rows[0].id;

                if (Array.isArray(audit.target)) {
                    for (const t of audit.target) {
                        await client.query(
                            `
                                INSERT INTO audit_log_target_information (audit_log_id, target_table, target_data_id)
                                VALUES ($1,$2,$3)
                            `
                            , [auditLogId, t.table, t.id]
                        );
                    }
                }

                await client.query("COMMIT");
            } catch (err) {
                console.error(err);
                if (client) {
                    await client.query("ROLLBACK");
                }
                return;
            } finally {
                if (client) {
                    client.release();
                }
            }
        });
        next();
    }
}