const express = require('express');
const tourController = require('../Controllers/tourController')
const authController= require('../Controllers/authController')
//const reviewController= require('../Controllers/reviewController')
const reviewRoutes= require('../routes/reviewRoutes')

const router = express.Router();

//router.param('id',tourController.checkID)
//router.route('/:tourId/reviews').post(authController.protect,authController.restrictTo('user'),reviewController.postReview)
router.use('/:tourId/reviews',reviewRoutes)

router.route('/top-5-cheap').get(tourController.aliasTopTours,tourController.getAllTours)
router.route('/tour-stats').get(tourController.getToursStats)
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)
router.get('/tours-within/:distance/center/:latlng/unit/:unit',tourController.getTourWithin)
router.get('/distances/:latlng/unit/:unit',tourController.getDistances);
router.route('/').get(tourController.getAllTours).post(authController.protect,authController.restrictTo('lead-guide','admin'),tourController.postTour)
router.route('/:id').get(tourController.getTour)
                    .patch(authController.protect,authController.restrictTo('lead-guide','admin'),
                     tourController.UploadTourPhoto,tourController.resizeTourImage,tourController.updateTour)
                    .delete(authController.protect,authController.restrictTo('admin','lead-guide'), tourController.deleteTour)


module.exports = router