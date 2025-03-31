import express from "express";

import { userAuth } from "../middleware/userAuth.js";
import { changeName, changeProfilePic, checkCreditBalance, deleteAccount, paymentRazorpay, userDetails, verifyPayment } from "../controller/userController.js";
import { uploadProfilePic } from "../middleware/profile-multer.js";

const userRouter = express.Router();

userRouter.get("/profile", userAuth, userDetails);
userRouter.get("/profile", userAuth, checkCreditBalance);
userRouter.post("/profile", uploadProfilePic.single('profilePic'), userAuth, changeProfilePic);
userRouter.post("/profile/change-name", userAuth, changeName);
userRouter.delete("/profile/user", userAuth, deleteAccount);
userRouter.post("/pay-razorpay", userAuth, paymentRazorpay);
userRouter.post("/verify-razorpay", userAuth, verifyPayment);

export { userRouter };