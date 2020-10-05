const multer = require('multer')
const sharp = require('sharp')
const User = require('../Models/userModel')
const catchAsync= require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

// const multerStorage = multer.diskStorage({
//     destination: (req,file,cb)=>{
//         cb(null,'public/img/users')
//     },
//     filename:(req,file,cb)=>{
//         const ext = file.mimetype.split('/')[1]
//         cb(null,`user-${req.user.id}-${Data.now()}.${ext}`)
//     }
// })
//saving image as buffer
const multerStorage = multer.memoryStorage();
const multerFilter = (req,file,cb)=>{
  if(file.mimetype.startWith('image')){
         cb(null,true)
  }else{
      cb(new AppError('Not an image',400),false)
  }
}
const upload = multer({storage:multerStorage,fileFilter:multerFilter})
exports.uploadUserPhoto = upload.single('photo')

exports.resizeImage= catchAsync(async(req,res,next)=>{
    if(!req.file) return next();
    req.file.filename = `user-${req.user.id}-${Data.now()}.jpeg`
    sharp(req.file.buffer)
    .resize(500,500)
    .toFormat('jpeg')
    .jpeg({quality:90})
    .toFile(`public/img/users/${req.file.filename}`)
    next()
});

const filterObj = (obj,...allowed)=>{
    const newObj = {};
    Object.keys(obj).filter(el =>{
        if(allowed.includes(el)) newObj[el] = obj[el];
    })
    return newObj
}

exports.getMe= (req,res,next)=>{
    req.params.id= req.user.id;
    next()    
}
exports.updateMe = catchAsync(async (req,res,next)=>{
    //1) Create error if user Post Password
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for Updating Password',400))
    }
    //update User Document 
    const filterBody = filterObj(req.body,'name','email')//filtering unwanted Field
    if(req.file) filterBody.photo= req.file.filename;
    const updatedUser= await User.findByIdAndUpdate(req.user.id,filterBody,{
        new:true,
        runValidators:true
    });
    res.status(200).json({
        status: 'success',
        data:{
            updatedUser
        }
    })
})
exports.deleteMe = catchAsync(async (req,res,next)=>{
   await User.findByIdAndUpdate(req.user.id,{active:false})

   res.status(204).json({
       status: "sucess",
       data: null
   })
})

exports.getalluser = factory.getAll(User)
exports.getUser= factory.getOne(User)
//Do not Update Password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser= factory.deleteOne(User)