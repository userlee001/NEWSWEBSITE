import jwt from "jsonwebtoken";
import { pool } from "./pool.js";

export const authMiddleware = (request, response, next) => {
    try {
        const token = request.cookies.token;
        if (!token) {
            return response.status(401).json({ "message": "no token" });
        }
        request.jwtToken = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        console.log(err);
        return response.status(401).json({ "message": "Invalid or expired token" });
    }
}

export const administratorExclusiveAuthMiddleware = async (request, response, next) => {
    try {
        const token = request.cookies.token;
        
        if (!token) {
            throw new Error("No Token");
        }

        request.jwtToken = jwt.verify(token, process.env.JWT_SECRET);
        
        const isAdministrator = await pool.query(
            `
                SELECT 1
                FROM writer
                WHERE id = $1 AND role = 'Admin'
            `,
            [request.jwtToken.id]
        )

        if(isAdministrator.rowCount === 0){
            throw new Error("Not administrator");
        }

        next();
    } catch (err) {
        next(err);
    }

}