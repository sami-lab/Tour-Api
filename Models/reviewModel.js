const mongoose = require('mongoose');
const Tour = require('./tourModel')
const reviewSchema= mongoose.Schema({
    reviewDescription:{
        type:String,
        trim: true
    },
    rating: {
        type: Number,
        required: [true, 'A Review must have a Ratting'],
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0']
    },
    createdAt:{
        type:Date,
        default: Date.now()
    },
    user: {
        type:mongoose.Schema.ObjectId,
        ref: 'User',
        require: [true,'Review Must have a author']
    },
    tour:{
        type:mongoose.Schema.ObjectId,
        ref: 'Tour',
        require:[true,'Review Must belong to a tour']
    }
},
{
    toJSON:{virtuals:true},
    toObject: {virtuals:true}
})
reviewSchema.index({tour:1,user:1},{unique:true});

reviewSchema.pre(/^find/,function(next){
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // })
    this.populate({
           path: 'user',        
          select: 'name photo'
         })
    next()
})

reviewSchema.statics.calAvgRating = async function(tourId){
      const stat= await this.aggregate([
          {
              $match:{tour:tourId}
          },
          {
            $group:{
                __id: '$tour',
                nRating: {$sum: 1},
                avgRating: {$avg: '$rating'}    
            }
          }
      ]);
      if(stat.length > 0){
          await Tour.findByIdAndUpdate(tourId,{
            ratingQuantity: stat[0].nRating,
            ratingAverage: stat[0].avgRating
          })    
      }else{ 
        await Tour.findByIdAndUpdate(tourId,{
            ratingQuantity: 0,
            ratingAverage: 4.5
          })    
      }
}
//using pre the current review is not in collection yet 
//review already save in db(calculating after saving )
reviewSchema.post('save',function(){
    //this points to current document and constructor point the model who created that document
    this.constructor.calAvgRating(this.tour)
})
//findbyIdAndUpdate and findbyIdAndDelete
//we cant use post here since post dont have access to query
//because query already been executed
reviewSchema.pre(/^findOneAnd/,async function(next){
    //finding Current Document With query to get id field
    this.r = await this.findOne(); 
    next();
})
reviewSchema.pre(/^findOneAnd/,async function(){
   //Now review has updated and we have 
   //also access of current docment by field we set(r)
     await this.r.constructor.calAvgRating(this.r.tour)
})
const Review = mongoose.model('Review',reviewSchema);

module.exports= Review;