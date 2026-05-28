export const getNewsListErrorHandler = (error, request, response, next) => {
    console.error("讀者讀取新聞時發生錯誤:", error.message);
    const clientErrorMessages = [
        "無效頁數編號",
        "無效的分類代碼",
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}

export const getContentErrorHandler = (error, request, response, next) => {
    console.error("讀者讀取新聞內容時發生錯誤:", error.message);
    const clientErrorMessages = [
        "不正確的newsid格式",
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}

export const searchNewsErrorHandler = (error, request, response, next) => {
    console.error("讀者搜尋新聞時發生錯誤:", error.message);
    const clientErrorMessages = [
        "頁數格式錯誤",
        "沒有關鍵字",
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}