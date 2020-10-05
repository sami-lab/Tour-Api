const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require('../Models/tourModel')
const Booking= require('../Models/bookingModel')
const catchAsync= require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

exports.getCheckoutSession= catchAsync( async (req,res,next)=>{
    //1 Get the currently booked tour 
    const tour= await Tour.findById(req.params.tourId);
       
    //2 Create Checkout Session
      const session = await stripe.checkout.sessions.create({
           payment_method_types: ['card'],
           success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
           cancel_url : `${req.protocol}://${req.get('host')}/tour`,
           customer_email : req.user.email,
           client_reference_id: req.params.tourId,
           line_items: [ //this is about product Information
               {
                   name: `${tour.name} Tour`,
                   description: tour.summary,
                   images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                   amount: tour.price*100,
                   currency: 'usd',
                   quantity: 1
               }
           ]
       })
    //3 Create Session as Response
    res.status(200).json({
        status: 'sucess',
        session
    })
})


exports.createBookingCheckout=catchAsync(async (req,res,next)=>{
    const {tour,user,price}= req.query;
    if(!tour && !user && !price) next() 
     await Booking.create(({tour,user,price}))
     res.redirect(req.originalUrl.split('?')[0])
})

exports.getAllBooking= catchAsync(async (req,res,next)=>{
    //1 Find All Booking
    const bookings=await Booking.find({user:req.user.id});

    //2)Find Tour With Return  Id
    const tourIDs = bookings.map(el => el.tour)
    const Tours= await Tour.find({_id:{$in:tourIDs}});

    res.status(200).json({
        status: 'Success',
        Tours
    })
})

exports.createBooking= factory.createOne(Booking);
exports.getAllBooking= factory.getAll(Booking);
exports.getBooking= factory.getOne(Booking);
exports.updateBooking= factory.updateOne(Booking);
exports.deleteBooking= factory.deleteOne(Booking);
