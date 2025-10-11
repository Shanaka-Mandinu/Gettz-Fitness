import express from 'express';
import {
  submitFeedback,
  getAllFeedback,
  getPublicFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  getFeedbackStats,
  deleteFeedback
} from '../controller/feedbackController.js';

const router = express.Router();


router.post('/submit', submitFeedback);
router.get('/public', getPublicFeedback); 

router.get('/all', getAllFeedback);
router.get('/stats', getFeedbackStats);
router.get('/:id', getFeedbackById);
router.put('/:id', updateFeedbackStatus);
router.delete('/:id', deleteFeedback);

export default router;
