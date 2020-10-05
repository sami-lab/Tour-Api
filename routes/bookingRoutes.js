const express = require('express');
const bookingController = require('../Controllers/bookingController')
const authController= require('../Controllers/authController')
const router = express.Router({mergeParams:true});

router.use(authController.protect)

router.get('/checkout-session/:tourId',bookingController.getCheckoutSession);
router.get('/my-tour',bookingController.getAllBooking)




router.use(authController.restrictTo('lead-guide','admin'))
router.route('/').get(bookingController.getAllBooking).post(bookingController.createBooking)
router.route('/:id').get(bookingController.getBooking).patch(bookingController.updateBooking).delete(bookingController.deleteBooking)
module.exports = router