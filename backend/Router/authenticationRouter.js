import express from "express";
import { login, register } from "../Controller/authenticationController.js";
import { loginErrorHandler, registerErrorHandler } from "../ErrorHandler/authenticationErrorHandler.js";
const router = express.Router();

router.post("/login", login, loginErrorHandler);
router.post("/register", register, registerErrorHandler);

export default router;