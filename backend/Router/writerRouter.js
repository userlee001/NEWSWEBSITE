import express, { Router } from "express";
import { authMiddleware } from "../Utilities/authentication.js";
import multer from "multer";
import path from "path";
import {
    writeNews,
    listNews,
    getContentOfNews,
    updateNews,
    deleteNews
} from "../Controller/writerController.js";
import {
    writeNewsErrorHandler,
    listNewsErrorHandler,
    getContentOfNewsErrorHandler,
    updateNewsErrorHandler,
    deleteNewsErrorHandler
} from "../ErrorHandler/writerErrorHandler.js";
import { recordActionTypeMiddleware } from "../Utilities/recordActionType.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images/")
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
});

const upload = multer({ storage: storage });

router.post("/write", recordActionTypeMiddleware("Write News."), authMiddleware, upload.any(), writeNews, writeNewsErrorHandler);
router.delete("/delete/news/:newsid", recordActionTypeMiddleware("Delete News"), authMiddleware, deleteNews, deleteNewsErrorHandler);
router.get("/listnews", authMiddleware, listNews, listNewsErrorHandler);
router.get("/newscontent/:newsid", authMiddleware, getContentOfNews, getContentOfNewsErrorHandler);
router.patch("/update/news/:newsid", recordActionTypeMiddleware("UpdateNews"), authMiddleware, upload.any(), updateNews, updateNewsErrorHandler);

export default router;