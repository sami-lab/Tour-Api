const catchAsync= require('../utils/catchAsync');
const AppError= require('../utils/appError');
const APIFeatures = require('../utils/ApiFeatures')

exports.deleteOne =Model=> catchAsync(async (req,res,next)=>{
    const doc =  await Model.findByIdAndDelete(req.params.id);
    if(!doc){
        return next(AppError('Requested Id not found',404))
    }
    res.status(204).json({
        status: 'success',
        data: 'deleted Successfully'
    })
})
exports.updateOne =Model=>  catchAsync(async (req,res,next)=>{
    const doc = await Model.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    })
    if(!doc){
        return next(AppError('requested Id not found',404))
    }
     res.status(200).json({
        status: 'success',
        data:{
            doc
        } 
    })
})
exports.createOne=Model=> catchAsync(async (req,res,next)=>{
    const doc = await Model.create(req.body)
        res.status(201).json({
            status:"success",
            data:{ 
               doc
            }
        })
});
exports.getOne= (Model,populateOptions)=>  catchAsync(async (req,res,next)=>{
    //Tour.find({_id:req.params.id})
    let query= Model.findById(req.params.id)
    if(populateOptions) query= query.populate(populateOptions);
    const doc = await query
    if(!doc){
        return next(AppError('requested Id not found',404))
    }
    res.status(200).json({
        status: 'success',
        data: {doc}
    })
})
exports.getAll = Model =>catchAsync(async (req,res,next)=>{ 
    { /* 
               Build Query 
               1A)Filtering
               const queryObj= {...req.query};
               const excludeFields = ['page','sort','limit','fields']
               excludeFields.forEach(el=> delete queryObj[el])
   
               //1B)Advance Filtering
               let queryStr = JSON.stringify(queryObj); //for exact match use \b
               queryStr= queryStr.replace(/\b(gt|ls|gte|lte)\b/g,match=>`$${match}`)
   
               let query = Tour.find(JSON.parse(queryStr));
   
               SORTING  //Use - before query(Postman) for desc sort
               if(req.query.sort){
                   const sortby = req.query.sort.split(',').join(" ");
                   query = query.sort(sortby)
               }
               else{
                   query = query.sort('-createdAt')
               }
               Field Limit
               if(req.query.fields){
                   const fields = req.query.fields.split(',').join(' ')
                   query = query.select(fields);
               }else{
                   query = query.select(-'__v');
               }
   
               Pagination
               const page = +req.query.page || 1;
               const limit = +req.query.limit || 100;
               const skip = (page-1)*limit
               query = query.skip(skip).limit(limit);
               if(req.query.page){
                   const numTours =await Tour.countDocuments();
                   if(skip >= numTours) throw new Error('This Page Does not exist')
               }
               const tours= await query;
       */}
       //Allowing Nested Routes
       let filter={}
       if(req.params.tourId) filter={tour:req.params.tourId}
          // EXECUTE QUERY
       const features = new APIFeatures(Model.find(filter), req.query)
       .filter()
       .sort()
       .limitFields()
       .paginate();
     const doc = await features.query;
          res.status(200).json({
              status: 'success',
              result: doc.length,
              data: {doc}
          })
   })