import express from "express";
import * as storyController from "../../controllers/story";
import { authorizeBearerToken } from "../../middlewares/auth";

const router = express.Router();

router.post("/add-month_story", authorizeBearerToken, storyController.addMonthStory);
router.post("/add-year-story", authorizeBearerToken, storyController.addYearStory);
router.get("/show-story", authorizeBearerToken, storyController.showStory);
router.post("/regeneration", authorizeBearerToken, storyController.regeneration);
router.post("/upgradeRound", authorizeBearerToken, storyController.upgradeRound);

module.exports = router;