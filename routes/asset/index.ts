import express from "express";
import * as assetController from "../../controllers/asset";

const router = express.Router();

router.get("/init", assetController.init);
router.post("/insert", assetController.insert);

module.exports = router;
