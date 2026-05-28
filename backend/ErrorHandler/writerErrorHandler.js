import { request } from "http";
import { handleDeletePreStoredImage } from "../Utilities/deletePreStoredImage.js"
import { response } from "express";

export const writeNewsErrorHandler = (error, request, response, next) => {
    console.error("作者寫入新聞發生錯誤:", error.message);
    let needDeletedImage = request.files.map((element) => {
        return element.filename;
    })
    handleDeletePreStoredImage(needDeletedImage);
    const clientErrorMessages = [
        "沒有標題",
        "沒有內文",
        "沒有封面照片",
        "沒有作者帳號",
        "無效的分類代碼"
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}

export const listNewsErrorHandler = (error, request, response, next) => {
    console.error("作者列出新聞時發生錯誤:", error.message);
    const clientErrorMessages = [
        "沒有作者帳號",
        "無效頁數編號"
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}

export const getContentOfNewsErrorHandler = (error, request, response, next) => {
    console.error("作者列出新聞詳細內容時發生錯誤:", error.message);
    const clientErrorMessages = [
        "新聞id格式錯誤",
        "找不到資料"
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}

export const updateNewsErrorHandler = (error, request, response, next) => {
    console.error("作者更新新聞時發生錯誤:", error.message);
    const clientErrorMessages = [
        "沒有作者帳號",
        "找不到新聞id",
        "沒有標題",
        "沒有內文",
        "沒有封面照片",
        "沒有封面照片路徑",
        "無效的分類代碼",
        "找不到舊版的封面照片",
        "無可以被更新的資料",
        "無可刪除的新聞內容",
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}

export const deleteNewsErrorHandler = (error, request, response, next) => {
    console.error("作者刪除新聞時發生錯誤:", error.message);
    const clientErrorMessages = [
        "沒有作者帳號",
        "找不到新聞id",
        "沒有可以刪除的新聞",
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}