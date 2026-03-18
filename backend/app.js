import express, { request, response } from "express";
import pg from "pg";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const { Pool } = pg;
const pool = new Pool({
    max: 20,
    connectionString: process.env.DATABASE_URL
});

app.use(express.json());
app.use(cookieParser());

app.post("/api/login", async (request, response) => {
    console.log(request.body);
    const { username, password } = request.body;
    try {
        const result = await pool.query(
            "SELECT * FROM writer WHERE authorname=$1 AND password=$2",
            [username, password]
        );

        if (result.rowCount === 0) {
            return response.status(401).send({ massage: "fail" });
        }

        const writer = result.rows[0];
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
        console.log(err);
        return response.status(500).send({ message: "fail" });
    }
});

const authMiddleware = (request, response, next) => {
    try {
        const token = request.cookies.token;
        if (!token) {
            return response.status(401).json({ "message": "no token" });
        }
        console.log(token);
        request.jwtToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log("a writer login.");
        next();
    } catch (err) {
        console.log(err);
        return response.status(401).json({ "message": "Invalid or expired token" });
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/")
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })

app.post("/api/write",
    authMiddleware,
    upload.single("photo"),
    async (request, response) => {
        try {
            const { title, content, category } = request.body;
            const cover_image_path = request.file.filename;
            const author_id = request.jwtToken.id;

            const result = await pool.query(
                `INSERT INTO news (title, author_id, category, cover_image_path, content) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [title, author_id, category, cover_image_path, content]
            );


            return response.json({ message: "上傳成功", data: result.rows[0] });

        }
        catch (err) {
            console.log(err);
            const filePath = "/app/public/images/" + cover_image_path;
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('刪除失敗:', err);
                } else {
                    console.log('檔案刪除成功');
                }
            });
            return response.status(500).send({ message: "伺服器出錯" });
        }


    }
);

app.get("/api/newslist/:category/:page", async (request, response) => {
    try {
        const { category, page } = request.params;
        if (/^[1-9]\d*$/.test(page) === false) {
            return response.sendStatus(404);
        }
        let result;
        const pageFinish = parseInt(page, 10) * 10;
        if (category === "0") {
            result = await pool.query(
                `SELECT id, title, created_at, cover_image_path FROM news ORDER BY created_at DESC OFFSET 0 LIMIT $1`,
                [pageFinish]
            );
        } else {
            result = await pool.query(
                `SELECT id, title, created_at, cover_image_path FROM news WHERE category = $1 ORDER BY created_at DESC OFFSET 0 LIMIT $2`,
                [category, pageFinish]
            );
        }

        if (result.rows.length === 0) {
            return response.json({ data: [] });
        }
        return response.json({ data: result.rows });
    }
    catch (err) {
        console.log(err);
        return response.sendStatus(500);
    }
});

app.get("/api/content/:newsid", async (request, response) => {
    try {
        const { newsid } = request.params;
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(newsid) === false) {
            return response.sendStatus(404);
        }
        const result = await pool.query(
            `SELECT news.title, news.created_at, writer.authorname , news.cover_image_path ,news.content 
         FROM news INNER JOIN writer ON news.author_id = writer.id 
         WHERE news.id = $1`,
            [newsid]
        );
        if (result.rows.length === 0) {
            return response.sendStatus(404);
        }
        return response.json({ data: result.rows[0] });
    } catch (err) {
        console.log(err);
        return response.sendStatus(500);
    }
});

app.get("/api/search/:page", async (request, response) => {

    const { page } = request.params;
    if (/^[1-9]\d*$/.test(page) === false) {
        return response.sendStatus(404);
    }
    const pageFinish = parseInt(page, 10) * 10;
    const { keyword } = request.query;
    if (!keyword) {
        return response.json({ data: [] });;
    }
    const normalizedKeyword = keyword.replace(/[，。！？,.!?]/g, "");
    try {
        const result = await pool.query(
            `SELECT id, title, created_at, cover_image_path 
             FROM news 
             WHERE title ILIKE '%' || $1 || '%'
             ORDER BY created_at DESC 
             OFFSET 0 LIMIT $2`,
            [normalizedKeyword, pageFinish]
        );
        return response.json({ data: result.rows });
    } catch (err) {
        console.log(err);
        return response.sendStatus(500);
    }
});

app.get("/api/writer/listarticle",
    authMiddleware,
    async (request, response) => {
        try {
            const author_id = request.jwtToken.id;
            const result = await pool.query(
                `SELECT id, title, created_at, cover_image_path 
                 FROM news 
                 WHERE author_id = $1
                 ORDER BY created_at DESC `,
                [author_id]
            );
            return response.json({ data: result.rows })
        } catch (err) {
            console.log(err);
            return response.sendStatus(500);
        }
    }
)

app.delete("/api/writer/delete/:newsid",
    authMiddleware,
    async (request, response) => {
        try {
            const { newsid } = request.params;
            const author_id = request.jwtToken.id;
            const result = await pool.query(
                `DELETE FROM news 
                 WHERE author_id = $1 AND id = $2
                 RETURNING cover_image_path`,
                [author_id, newsid]
            );
            if (result.rows.length > 0) {
                const deletedImagePath = result.rows[0].cover_image_path;
                const filePath = "/app/public/images/" + deletedImagePath;
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('刪除失敗:', err);
                    } else {
                        console.log('檔案刪除成功');
                    }
                });
            }
            return response.json({ data: result.rowCount })
        } catch (err) {
            console.log(err);
            return response.sendStatus(500);
        }
    }
)



app.listen(3000, () => {
    console.log("listening on 3000 port.")
}) 