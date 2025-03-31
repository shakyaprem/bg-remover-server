import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import User from '../model/User.js'
export const removeImageBackground = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: 'user not found' });
        }
        if (user.creditBalance === 0) {
            return res.status(400).json({ success: false, message: user.message, creditBalance: user.creditBalance });
        }
        const imagePath = req.file.path;
        const imageFile = fs.createReadStream(imagePath);
        const formdata = new FormData();
        formdata.append('image_file', imageFile);
        const {data} = await axios.post('https://clipdrop-api.co/remove-background/v1', formdata, {
            headers: {
                'x-api-key': process.env.CLIP_DROP_API,
            },
            responseType: 'arraybuffer'
        });
        const base64Image = Buffer.from(data, 'binary').toString('base64');
        const resultImage = `data:${req.file.mimetype};base64,${base64Image}`
        await User.findByIdAndUpdate(user._id, {creditBalance: user.creditBalance - 1 });
        res.json({ success: true, resultImage, creditBalance: user.creditBalance - 1, message: 'Background Removed'});
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}