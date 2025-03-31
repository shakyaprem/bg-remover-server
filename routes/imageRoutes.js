import express from 'express';
import { removeImageBackground } from '../controller/imageController.js';
import upload from '../middleware/multer.js';
import { userAuth } from '../middleware/userAuth.js';

const imageRouter = express.Router();

imageRouter.post('/remove-img-bg', upload.single('image'),userAuth,removeImageBackground);

export {imageRouter};