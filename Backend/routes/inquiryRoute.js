import express from 'express';
import { createInquiry, createPublicInquiry, deleteInquiry, getAllInquiry, getInquiryById, updateInquiry, replyInquiry, getUserInquiries, userReplyInquiry, generateInquiryReport } from '../controller/inquiryController.js';

const inqRouter = express.Router();

inqRouter.post('/submit', createInquiry);
inqRouter.post('/public-submit', createPublicInquiry);
inqRouter.get('/viewAll', getAllInquiry);
inqRouter.put('/update/:inquiry_id', updateInquiry);
inqRouter.delete('/delete/:inquiry_id', deleteInquiry);
inqRouter.get('/user', getUserInquiries);
inqRouter.get('/:inquiry_id', getInquiryById);
inqRouter.post('/reply/:inquiry_id', replyInquiry);
inqRouter.post('/user-reply/:inquiry_id', userReplyInquiry);
inqRouter.post('/report', generateInquiryReport);

export default inqRouter;