import express from "express";

import { contactUs, getMessage } from "../Controllers/messageController.js";

const router = express.Router();
router.post("/contactUs", contactUs);
router.get("/getMessages", getMessage);

export default router;
