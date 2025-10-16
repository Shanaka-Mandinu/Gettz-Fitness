import User from '../model/user.js';
import Member from '../model/memberModel.js';
import Trainer from '../model/trainer.js';
import Feedback from '../model/feedback.js';


export const getPublicStats = async (req, res) => {
  try {
    
    const totalMembers = await User.countDocuments({ 
      role: 'member', 
      isDisabled: false 
    });

    
    const activeMembers = await User.countDocuments({ 
      role: 'member', 
      isDisabled: false 
    });

    
    const totalTrainers = await Trainer.countDocuments({ 
      isActive: true, 
      isDisabled: false 
    });

    
    const totalReviews = await Feedback.countDocuments({ 
      status: { $in: ['pending', 'reviewed'] } 
    });

  
    const avgRatingResult = await Feedback.aggregate([
      { $match: { status: { $in: ['pending', 'reviewed'] } } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    const averageRating = avgRatingResult[0]?.average || 0;

    
    const membershipStats = await User.aggregate([
      { $match: { role: 'member', isDisabled: false } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMembers = await User.countDocuments({
      role: 'member',
      isDisabled: false,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        totalTrainers,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, 
        recentMembers
      }
    });

  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


export const getDetailedStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const [
      totalUsers,
      totalMembers,
      activeMembers,
      totalTrainers,
      totalFeedback,
      avgRating,
      monthlyStats
    ] = await Promise.all([
      User.countDocuments({ isDisabled: false }),
      User.countDocuments({ role: 'member', isDisabled: false }),
      User.countDocuments({ role: 'member', isDisabled: false }),
      Trainer.countDocuments({ isActive: true, isDisabled: false }),
      Feedback.countDocuments(),
      Feedback.aggregate([
        { $group: { _id: null, average: { $avg: '$rating' } } }
      ]),
      User.aggregate([
        {
          $match: {
            role: 'member',
            isDisabled: false,
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalMembers,
        activeMembers,
        totalTrainers,
        totalFeedback,
        averageRating: avgRating[0]?.average || 0,
        monthlyStats
      }
    });

  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
