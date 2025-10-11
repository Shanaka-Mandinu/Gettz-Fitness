import Feedback from '../model/feedback.js';

const generateFeedbackId = () => {
  return 'FB' + Math.floor(100000 + Math.random() * 900000);
};


export const submitFeedback = async (req, res) => {
  try {
    const { email, name, rating, feedback_type, feedback_message, is_anonymous } = req.body;
    
    
    if (!email || !rating || !feedback_type || !feedback_message) {
      return res.status(400).json({
        success: false,
        message: 'Email, rating, feedback type, and message are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const feedback_id = generateFeedbackId();
    let userId = null;

    
    try {
      userId = req.user?.id || null;
    } catch (error) {
      
    }

    const feedback = new Feedback({
      feedback_id,
      userId,
      email: email.trim().toLowerCase(),
      name: name?.trim() || '',
      rating: parseInt(rating),
      feedback_type,
      feedback_message: feedback_message.trim(),
      is_anonymous: is_anonymous || false
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback_id: feedback.feedback_id
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, feedback_type, rating } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (feedback_type) filter.feedback_type = feedback_type;
    if (rating) filter.rating = parseInt(rating);

    const feedbacks = await Feedback.find(filter)
      .populate('userId', 'name email')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: feedbacks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const getPublicFeedback = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    
    const filter = {
      status: { $in: ['pending', 'reviewed'] }
    };

    const feedbacks = await Feedback.find(filter)
      .populate('userId', 'name email')
      .sort({ created_at: -1 })
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: feedbacks,
      total
    });

  } catch (error) {
    console.error('Error fetching public feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await Feedback.findById(id).populate('userId', 'name email');
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_response } = req.body;

    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    if (status) feedback.status = status;
    if (admin_response) feedback.admin_response = admin_response;

    await feedback.save();

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const getFeedbackStats = async (req, res) => {
  try {
    const total = await Feedback.countDocuments();
    const avgRating = await Feedback.aggregate([
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    const ratingDistribution = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const typeDistribution = await Feedback.aggregate([
      { $group: { _id: '$feedback_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const statusDistribution = await Feedback.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        averageRating: avgRating[0]?.average || 0,
        ratingDistribution,
        typeDistribution,
        statusDistribution
      }
    });

  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await Feedback.findByIdAndDelete(id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
