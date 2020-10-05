const multer = require('multer')
const sharp = require('sharp')
const Tour = require('../Models/tourModel')
const catchAsync= require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')


const multerStorage = multer.memoryStorage();
const multerFilter = (req,file,cb)=>{
  if(file.mimetype.startWith('image')){
         cb(null,true)
  }else{
      cb(new AppError('Not an image',400),false)
  }
}
const upload = multer({storage:multerStorage,fileFilter:multerFilter})
exports.UploadTourPhoto = upload.fields([
    {name: 'imageCover',maxCount: 1},
    {name: 'images',maxCount: 3}
])
//upload.single('image') //req.file
//upload.array('images',5) //req.files
 exports.resizeTourImage = catchAsync(async (req,res,next)=>{
     if(!req.files.imageCover || !req.files.images) return next()
     //1) Cover Image
      req.body.imageCover= `tour-${req.params.id}-${Data.now()}-cover.jpeg`
     await sharp(req.file.imageCover[0].buffer)
     .resize(2000,1333)
     .toFormat('jpeg')
     .jpeg({quality:90})
     .toFile(`public/img/tours/${req.body.imageCover}`)

     //Images
     req.body.images=[];
     promise.All(req.files.images.map(async (file,i) => {
         const filename= `tour-${req.params.id}-${Data.now()}-${i+1}.jpeg`;
         await sharp(file.buffer)
         .resize(2000,1333)
         .toFormat('jpeg')
         .jpeg({quality:90})
         .toFile(`public/img/tours/${filename}`)
         req.body.images.push(filename);
     }));
    next();
 });

exports.aliasTopTours = (req,res,next)=>{
    req.query.limit ='5',
    req.query.sort= '-ratingsAverage,price',
    req.query.fields= 'name,price,ratingsAverage,summary,difficulty'
    next()
}

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour,{path: 'reviews'})
exports.postTour = factory.createOne(Tour)
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour);

exports.getToursStats= catchAsync(async (req,res,next)=>{
        const stats  = await Tour.aggregate([
            {
               $match: {ratingAverage: { $gte: 4.5} }
            },
            {
                $group: {
                    // '_id':'{$toUpper : $difficulty'},
                   // _id:'$ratingAverage',
                    _id:'$difficulty',
                    numTours: {$sum: 1},
                    numRatings:{$sum: '$ratingQuantity'},
                    avgRating:{$avg: '$ratingAverage'},
                    avgPrice: {$avg: '$price'},
                    minPrice: {$min: '$price'},
                    maxPrice: {$max: '$price'}
                }
            },
            {
                $sort:{avgPrice:1}
            }
            // {
            //     $match:{_id :{$ne:'EASY' } }
            // }
        ])
        res.status(200).json({
            status:'success',
            data:{
                stats:stats
            }
        })
})
exports.getMonthlyPlan= catchAsync(async (req,res,next)=>{
        const year = req.params.year*1;
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates' //making array of dates into single object
            },
            {
                $match: {
                    startDates:{
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group:{
                    _id: { $month: '$startDates'},
                    numsTourStart: {$sum:1},//count
                    tours: {$push: '$name' }
                }
            },
            {
                $addFields:{ month: '$_id'}
            },
            {
                $project:{
                    _id:0 //hiding Field
                }
            },
            {
                $sort:{numsTourStart: -1}
            },
            {
                $limit: 12
            }
        ]);
        res.status(200).json({
            status:'success',
            data:{
                plan
            }
        })
})
exports.getTourWithin= catchAsync(async (req,res,next)=>{
    const {distance,latlng,unit}= req.params;
    const [lat,lng]= latlng.split(',');
    const radius = unit ==='mi'? distance/3963.2: distance/6378.1;
    if(!lat || !lng){
        next(new AppError('Please Provide Latitude and Longitude in a format of lat,lon',400))
    } 
    const tours = Tour.find({
        startLocation: {$geoWitthin:{$centerSphere:[[lng,lat],radius ]}}
    });
    res.status(200).json({
        status:'Success',
        result: tours.length,
        data:{
            tours
        }
    })
})

exports.getDistances = catchAsync(async (req,res,next)=>{
    const {latlng,unit}= req.params;
    const [lat,lng]= latlng.split(',');
   
    if(!lat || !lng){
        next(new AppError('Please Provide Latitude and Longitude in a format of lat,lon',400))
    } 
    const multiplier = unit === 'mi'?0.000621317:0.001
    const distances =await Tour.aggregate([
        {
            //must be first one in the pipeline and require one geospecial index.
            $geoNear:{
              near:{
                  type:'Point',
                  coordinates:[lng*1,lat*1]
              },
              distanceField: 'distance',
              distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance : 1,
                name:1
            }
        }
    ])
    res.status(200).json({
        status:'Success',
        data:{
            distances
        }
    })
})