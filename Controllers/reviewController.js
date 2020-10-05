const Review = require('../Models/reviewModel')
const catchAsync= require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

exports.setUserIDs= (req,res,next)=>{
    req.body.user= req.body.user? req.body.user : req.user._id;
    req.body.tour= req.body.tour? req.body.tour : req.params.tourId;
    next()
}

exports.getAllReview= factory.getAll(Review);
exports.getReview= factory.getOne(Review);
exports.postReview =factory.createOne(Review)
exports.updateReview= factory.updateOne(Review)
exports.deleteReview= factory.deleteOne(Review)