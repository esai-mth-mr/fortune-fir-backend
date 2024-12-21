import express from "express";
import * as contactcontroller from "../../controllers/contact";

const router = express.Router();

router.post("/sendData", contactcontroller.sendData);


module.exports = router;
