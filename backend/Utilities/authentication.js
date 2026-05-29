import jwt from "jsonwebtoken";

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