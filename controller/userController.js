import transactionModel from '../model/transaction.model.js';
import User from '../model/User.js';
import razorpay from 'razorpay';

export const userDetails = async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(400).json({ success: false, message: 'user not found' });
        }
        return res.json({
            userDetail: {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePic: user.profilePic,
                isAccountVerified: user.isAccountVerified,
                creditBalance: user.creditBalance
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const checkCreditBalance = async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findById(userId).select('-password');
        if (user.creditBalance === 0) {
            return res.status(400).json({ success: false, message: 'your credit balance ' + user.creditBalance});
        }
        return res.status(200).json({
            creditBalance: user.creditBalance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const changeName = async (req, res) => {
    const { userId, name } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: 'user not found' });
        }
        if (user.name === name) {
            return res.status(400).json({ success: false, message: 'Name already exists' });
        }
        user.name = name;
        await user.save();
        return res.status(200).json({ success: true, message: 'Name updated successfully', userDetail: { name: user.name } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const changeProfilePic =  async (req, res) => {
    try {
        const { userId } = req.body;
        const profilePic = req.file ? req.file.filename : '';
        const user = await User.findById(userId)
        if (!user) {
            return res.status(400).json({ success: false, message: 'user not found' });
        }
        user.profilePic = profilePic;
        await user.save();
        return res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            userDetail: { profilePic: user.profilePic }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export const deleteAccount = async (req, res) => {
    const { userId, email, name } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user.email === email || !user.name === name) {
            return res.status(400).json({ success: false, message: 'Account Information Not Available'})
        }
        if (!user) {
            return res.status(400).json({ success: false, message: 'user not found' });
        }
        await User.findByIdAndDelete(userId);
        res.clearCookie('token', {
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
        });
        return res.status(200).json({ success: true, message: 'Your Account Deleted Successfully'});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

const razorpayInstance = new razorpay({
    key_id: 'rzp_test_srZF93tLbz1thr',
    key_secret: 'Zu3m836yMxfV86E0ORjeVCoy'
});

export const paymentRazorpay = async (req, res) => {
    try {
        const { userId, planId } = req.body;
        const user = await User.findById(userId);
        if (!user || !planId) {
            return res.status(400).json({ success: false, message: 'Invalid Credentials' });
        }
        if (!user.isAccountVerified) {
            return res.status(400).json({ success: false, message: 'Account not verified' });
        }
        let credits, plan, amount, date;

        switch (planId) {
            case 'Basic':
                plan = 'Basic';
                credits = 100;
                amount = 10;
                break;
            case 'Advanced':
                plan = 'Advanced';
                credits = 500;
                amount = 50;
                break;
            case 'Business':
                plan = 'Business';
                credits = 5000;
                amount = 250;
                break;
            default:
                break;
        }
        date = new Date();
        const newTransaction = new transactionModel({
            credits,
            userId,
            amount,
            plan,
            date
        });
        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: newTransaction._id
        };
        razorpayInstance.orders.create(options, (err, order) => {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            res.status(200).json({ success: true, order, transaction: newTransaction });
        })
        await newTransaction.save();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
        if (orderInfo.status === 'paid') {
            const transactionData = await transactionModel.findById(orderInfo.receipt);
            if (transactionData.payment) {
                return res.status(400).json({ success: false, message: 'Payment Failed' });
            }
            var user_id = transactionData.userId;
            const user = await User.findById(user_id);
            const creditBalance = user.creditBalance + transactionData.credits;
            await User.findByIdAndUpdate(user._id, { creditBalance });
            await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true });
            return res.status(200).json({ success: true, message: 'Payment Successful' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}