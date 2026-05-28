import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../Database/pool.js";

export const login = async (request, response, next) => {
    console.log(request.body);
    const { username, password } = request.body;
    try {
        const result = await pool.query(
            "SELECT * FROM writer WHERE authorname=$1",
            [username]
        );

        if (result.rowCount === 0) {
            throw new Error("帳號錯誤");
        }

        const writer = result.rows[0];

        const isMatch = await bcrypt.compare(
            password,
            writer.password
        )

        if (!isMatch) {
            throw new Error("密碼錯誤");
        }

        const payload = {
            id: writer.id,
            role: writer.role
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1d"
        });


        response.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000
        })

        return response.json({
            writer: { name: writer.name, role: writer.role },
            message: "success"
        });

    } catch (err) {
        return next(err);
    }
}

export const register = async (request, response, next) => {
    console.log(request.body);
    const { username, password } = request.body;
    try {
        if (username.length < 6) {
            throw new Error("帳號名稱太短");
        }

        const result = await pool.query(
            "SELECT * FROM writer WHERE authorname=$1",
            [username]
        );

        if (result.rowCount !== 0) {
            throw new Error("帳號名稱重複");
        }

        if (password.length < 6) {
            throw new Error("密碼太短")
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insert_username_hashedPassword_result = await pool.query(
            `
                INSERT INTO writer (authorname, password)
                VALUES ($1, $2)
                RETURNING *`,
            [username, hashedPassword]
        );

        return response.status(200).json({ message: "success" });

    } catch (err) {
        return next(err);
    } 
}