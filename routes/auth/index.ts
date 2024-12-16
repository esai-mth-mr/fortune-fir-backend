import express from "express";
import * as authcontroller from "../../controllers/auth";

const router = express.Router();

router.post("/register", authcontroller.register);
router.post("/login", authcontroller.login);
router.post("/verify-Email", authcontroller.Emailverify);
router.post("/insertData", authcontroller.AssetData);

module.exports = router;
