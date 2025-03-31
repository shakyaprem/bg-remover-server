import express from "express";
import { isAuthenticated, getAuthToken, login, logout, register, resetPassword, resetPasswordOtp, sendVerifyOtp, verifyEmail } from "../controller/authController.js";
import { userAuth } from "../middleware/userAuth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.get("/token", userAuth, getAuthToken);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/send-verify-otp", userAuth, sendVerifyOtp);
authRouter.post("/verify-email", userAuth, verifyEmail);
authRouter.get("/verify-account", userAuth, isAuthenticated);
authRouter.post("/send-reset-otp", resetPasswordOtp);
authRouter.post("/reset-password", resetPassword);

export { authRouter };