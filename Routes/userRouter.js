import express from "express";
import {
  changePassword,
  deleteUser,
  forgotPassword,
  getUser,
  getUsers,
  loginStatus,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  sendAutomatedEmail,
  upgradeRole,
} from "../Controllers/userController.js";
import { protect, superAdminOnly } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/getUser", protect, getUser);
router.delete("/:id", protect, superAdminOnly, deleteUser);
router.get("/getUsers", protect, superAdminOnly, getUsers);
router.get("/loginStatus", loginStatus);
router.post("/upgradeRole", protect, superAdminOnly, upgradeRole);
router.post("/sendAutomatedEmail", protect, sendAutomatedEmail);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:resetToken", resetPassword);
router.patch("/changePassword", protect, changePassword);

export default router;
