import express, { Router } from "express";
import { administratorExclusiveAuthMiddleware } from "../Utilities/authentication.js";
import { checkAuditLog, listUser, revokeUserAccount, listNewsTitleOfOneUser, takeDownAPieceOfNewsOfOneUser } from "../Controller/administratorController.js";
import { checkAuditLogErrorHandler, listUserErrorHandler, revokeUserAccountErrorHandler, listNewsTitleOfOneUserErrorHandler, takeDownAPieceOfNewsOfOneUserErrorHandler } from "../ErrorHandler/administratorErrorHandler.js"

const router = express.Router();

router.get("/check/audit_log", administratorExclusiveAuthMiddleware, checkAuditLog, checkAuditLogErrorHandler);
router.get("/check/user_list", administratorExclusiveAuthMiddleware, listUser, listUserErrorHandler);
router.delete("/revoke/user_account", administratorExclusiveAuthMiddleware, revokeUserAccount, revokeUserAccountErrorHandler);
router.get("/check/user/news_list", administratorExclusiveAuthMiddleware, listNewsTitleOfOneUser, listNewsTitleOfOneUserErrorHandler);
router.delete("/takedown/user/news", administratorExclusiveAuthMiddleware, takeDownAPieceOfNewsOfOneUser, takeDownAPieceOfNewsOfOneUserErrorHandler);



export default router;