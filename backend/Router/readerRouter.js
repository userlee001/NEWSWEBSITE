import express, { Router } from "express";
import {
    getNewsList,
    getContent,
    searchNews
} from "../Controller/readerController.js";
import {
    getNewsListErrorHandler,
    getContentErrorHandler,
    searchNewsErrorHandler
} from "../ErrorHandler/readerErrorHandler.js";

const router = express.Router();

router.get("/news/list/category", getNewsList, getNewsListErrorHandler);
router.get("/news/list/search", searchNews, searchNewsErrorHandler);
router.get("/news/content", getContent, getContentErrorHandler);

export default router;