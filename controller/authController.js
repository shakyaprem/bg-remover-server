import User from '../model/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import transporter from '../config/nodeMailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE, EMAIL_SEND_TEMPLATE } from '../config/emailTemplates.js'

export const register = async (req, res) => {
    const secretKey = process.env.SECRET_KEY;
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false,  message: 'missing all details' });
    }
    try {
        const userExist = await User.findOne({ email });
        const userNameExist = await User.findOne({ name });
        if (userExist || userNameExist) {
            return res.status(400).json({ success: false, message: 'user already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new User({ name, email, password:hashedPassword });
        await user.save();
        const token = jwt.sign({id: user._id} , secretKey, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
            'none' : 'strict',
            maxAge: 7 * 60 * 60 * 1000 });

            const mailOptions = {
                from: 'pkshakya9854@gmail.com',
                to: email,
                subject: 'Welcome! Your registration details are here',
                // text: ` <h1>Please click on given link to activate your account</h1> `
                html: EMAIL_SEND_TEMPLATE.replace("{{email}}", user.email).replace("{{email}}", user.email).replace("{{name}}", user.name)
            };
            await transporter.sendMail(mailOptions);

            return res.status(201).json({ success: true, message: "Register successfully"});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const login = async (req, res) => {
    const secretKey = process.env.SECRET_KEY;
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'missing all details' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'user does not exist' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'invalid credentials' });
        }
        const token = jwt.sign({id: user._id} , secretKey, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
            'none' : 'strict',
            maxAge: 7 * 60 * 60 * 1000 });
        return res.status(200).json({ success: true, message: "Login Successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const getAuthToken = async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.SECRET_KEY, // Ensure you have a secret key in your environment variables
            { expiresIn: '1h' } // Token expiration time
        );

        return res.status(200).json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const logout = async (req, res) => {
    res.clearCookie('token', {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ?
        'none' : 'strict',
    });
    return res.status(200).json({ success: true, message: "Logged out Success"});
}

export const sendVerifyOtp = async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (user.isAccountVerified) {
            return res.status(400).json({ success: false, message: 'Account already verified' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        user.verifyOtp = otp;
        user.verifyOtpExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();
        const mailOptions = {
            from: 'pkshakya9854@gmail.com',
            to: user.email,
            subject: 'Account Verification OTP',
            // text: `<h1>Your OTP is ${otp} verify your account using this otp.</h1>`
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}", user.email)
        };
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: "OTP sent successfully"});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        return res.status(400).json({ success: false, message: 'missing all details' });
    }
    try {
        const user = await User.findById(userId);
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        if (user.verifyOtpExpiresAt < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpiresAt = 0;
        await user.save();
        return res.status(200).json({ success: true, message: "Account verified successfully"});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const isAuthenticated = async (req, res) => {
    try {
        return res.status(200).json({ success: true, message: "is Authenticated"});
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const resetPasswordOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'missing Email id' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Please Valid Email' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        user.resetOtp = otp;
        user.resetOtpExpiresAt = Date.now() + 10 * 60 * 1000;
        await user.save();
        const mailOptions = {
            from: 'pkshakya9854@gmail.com',
            to: user.email,
            subject: 'Password Reset OTP',
            // text: `<h1>Your OTP for resetting your password is ${otp} Use this OTP to proceed with resetting your password.</h1>`
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}", user.email)
        };
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: "OTP sent to your email please check email. OTP expires in 10 minutes"});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'missing all details' });
    }
    try {
        const user = await User.findOne({ email });
        if (user.resetOtp === '' || user.resetOtp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        if (user.resetOtpExpiresAt < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpiresAt = 0;
        await user.save();
        return res.status(200).json({ success: true, message: "Password reset successfully"});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
