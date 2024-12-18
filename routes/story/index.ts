import express from "express";
import * as storyController from "../../controllers/story";
import { authorizeBearerToken } from "../../middlewares/auth";

const router = express.Router();

router.post("/add-story", authorizeBearerToken, storyController.addStory);
router.get("/get-totalStory", authorizeBearerToken, storyController.getTotalStory);
