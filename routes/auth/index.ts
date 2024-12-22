import express from "express";
import * as authcontroller from "../../controllers/auth";
import { authorizeBearerToken } from "../../middlewares/auth";

const router = express.Router();

router.post("/register", authcontroller.register);
router.post("/login", authcontroller.login);
router.post("/verify-Email", authcontroller.Emailverify);
router.post("/resend-email", authcontroller.resendEmail);
router.get("/checkUser", authorizeBearerToken, authcontroller.checkUser);

module.exports = router;
