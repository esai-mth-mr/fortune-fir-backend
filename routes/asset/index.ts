import express from "express";
import * as assetController from "../../controllers/asset";
import { authorizeBearerToken } from "../../middlewares/auth";

const router = express.Router();

router.get("/init", authorizeBearerToken, assetController.init);
router.post("/insert", assetController.insert);

module.exports = router;
