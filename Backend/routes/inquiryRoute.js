import express from 'express';
import { createInquiry, deleteInquiry, getAllInquiry, getInquiryById, updateInquiry, replyInquiry, getUserInquiries } from '../controller/inquiryController.js';

const inqRouter = express.Router();

inqRouter.post('/submit', createInquiry);
inqRouter.get('/viewAll', getAllInquiry);
inqRouter.put('/update/:inquiry_id', updateInquiry);
inqRouter.delete('/delete/:inquiry_id', deleteInquiry);
inqRouter.get('/user', getUserInquiries); // user fetch own inquiries
inqRouter.get('/:inquiry_id', getInquiryById);

// New endpoints
inqRouter.post('/reply/:inquiry_id', replyInquiry); // admin reply
inqRouter.get('/user', getUserInquiries); // user fetch own inquiries


export default inqRouter;