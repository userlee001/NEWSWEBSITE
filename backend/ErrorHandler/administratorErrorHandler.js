export const checkAuditLogErrorHandler = (error, request, response, next) => {
    console.error("管理者查詢審計日誌時發生錯誤: ", error.message);

    const administratorErrorMessages = [
        "No Token",
        "Not administrator",
    ];

    if (administratorErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: "fail" });
    }

    return response.status(500).json({ message: "伺服器出錯" });

}

export const listUserErrorHandler = (error, request, response, next) => {
    console.error("管理者列出用戶名單時發生錯誤: ", error.message);

    const administratorErrorMessages = [
        "No Token",
        "Not administrator",
    ];

    if (administratorErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: "fail" });
    }

    return response.status(500).json({ message: "伺服器出錯" });

}

export const revokeUserAccountErrorHandler = (error, request, response, next) => {
    console.error("管理者強制註銷用戶時發生錯誤: ", error.message);

    const administratorErrorMessages = [
        "No Token",
        "Not administrator",
        "No account provided",
        "Account provided is incorrect"
    ];

    if (administratorErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: "fail" });
    }

    return response.status(500).json({ message: "伺服器出錯" });

}

export const listNewsTitleOfOneUserErrorHandler = (error, request, response, next) => {
    console.error("管理者列出用戶寫的新聞時發生錯誤: ", error.message);

    const administratorErrorMessages = [
        "No Token",
        "Not administrator",
        "No account provided"
    ];

    if (administratorErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: "fail" });
    }

    return response.status(500).json({ message: "伺服器出錯" });

}

export const takeDownAPieceOfNewsOfOneUserErrorHandler = (error, request, response, next) => {
    console.error("管理者列出用戶寫的新聞時發生錯誤: ", error.message);

    const administratorErrorMessages = [
        "No Token",
        "Not administrator",
        "No news provided",
        "News provided is incorrect"
    ];

    if (administratorErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: "fail" });
    }

    return response.status(500).json({ message: "伺服器出錯" });

}


