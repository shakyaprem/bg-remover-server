import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    profilePic: { type: String, default: '../uploads/default.png' },
    creditBalance: { type: Number, default: 5},
    verifyOtp: {type: String, default: ""},
    verifyOtpExpiresAt: {type: Number, default: 0},
    isAccountVerified: {type: Boolean, default: false},
    resetOtp: {type: String, default: ""},
    resetOtpExpiresAt: {type: Number, default: 0},
});

const userModel = mongoose.models.user || mongoose.model('user', UserSchema);

export default userModel;