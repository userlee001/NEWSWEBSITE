import express from "express";
import { login, register } from "../Controller/authenticationController.js";
import { loginErrorHandler, registerErrorHandler } from "../ErrorHandler/authenticationErrorHandler.js";
import { recordActionTypeMiddleware } from "../Utilities/recordActionType.js";

const router = express.Router();

router.post("/login", recordActionTypeMiddleware("Login"), login, loginErrorHandler);
router.post("/register", recordActionTypeMiddleware("Register"), register, registerErrorHandler);

export default router;