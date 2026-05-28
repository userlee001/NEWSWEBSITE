export const loginErrorHandler = (error, request, response, next) => {
    console.error("作者登入時發生錯誤:", error.message);
    const clientErrorMessages = [
        "帳號錯誤",
        "密碼錯誤"
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: fail });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}

export const registerErrorHandler = (error, request, response, next) => {
    console.error("作者註冊時發生錯誤:", error.message);
    const clientErrorMessages = [
        "帳號名稱重複",
        "密碼太短"
    ];
    if (clientErrorMessages.includes(error.message)) {
        return response.status(400).json({ message: fail });
    }
    return response.status(500).json({ message: "伺服器出錯" });
}