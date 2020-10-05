const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const {promisify} = require('util')
const User = require('../Models/userModel');
//const APIFeatures = require('../utils/ApiFeatures')
const catchAsync= require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Email = require('../utils/emails')

    const createResetToken =(user,statusCode,req,res)=>{
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn: process.env.JWT_EXPIRES_IN})
        const cookieOptions= {
            expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
            // secure: true,//only https
            httpOnly: true, //to prevent xss
            secure: req.secure || req.headers['x-forwarded-proto']==='https' 
        }
        //if(process.env.NODE_ENV=== 'production') cookieOptions.secure= true;
        res.cookie('jwt',token,cookieOptions)
        user.password= undefined //not saving
        res.status(statusCode).json({
            status:"Success",
            token,
            data:{ 
                User:user
            }
        })
    }
exports.signUp = catchAsync(async (req,res,next)=>{
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password:req.body.password,
            confirmPassword: req.body.confirmPassword,
            role: req.body.role
        })
        const url = `${req.protocol}://${req.get('host')}/me`;
        await new Email(newUser,url).sendWelcome();
        createResetToken(newUser,201,req,res);
    })
exports.login= catchAsync(async (req,res,next)=>{
        const {email,password}= req.body;
        if(!email || !password){
            return  next(new AppError('Please Provide Email and password',400))
        }
        const user = await User.findOne({email}).select('+password')
        //Comparing password
        if(!user || !( await  user.correctPassword(password,user.password))){
            return  next(new AppError('Incorrect Email or password',401))
        }
        createResetToken(user,200,req,res);
    })

    //Middleware
exports.protect= catchAsync(async (req,res,next)=>{
    //1 getting Token and check if there
    let token ;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token){
        return next(new AppError('You are not logged in',401))
    }
    //verifying Token
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)

    //checking User Really Exist
    const freshUser = await User.findById(decoded.id)
    if(!freshUser) return next(new AppError('The User Belonging to this Token does no longer Exist',401))

    //checking if user changed password 
    if(freshUser.changedPasswordAfter(decoded.iat)){//will return true if password changed
        return next(new AppError('User recently changed password! Please Log in again',401))
    }

    req.user= freshUser;
    next(); //Allowing Access to 
    
})
//MiddleWare
exports.restrictTo= (...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError('you Dont have Permission for this route',403))
        }
        next();
    };
};

exports.forgotPassword= catchAsync(async (req,res,next)=>{
    //Get User Based on Email
    const user= await User.findOne({email: req.body.email})
    if(!user){
        return next(new AppError('There is No User with These Email',404))
    }
    //Generate Random Token
    const resetToken= user.createResetPasswordToken();
    await user.save({validateBeforeSave:false}) //Saving only 2 Fields

    //Sending Email
    //const resettoken = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // const message= `Forget Your Password? Submit a patch request with your new Password and confirm Password to: \n
    //                 ${resettoken} \n If You didnot forget your password, Please ignore this`;
        try{
            await new Email(user,resetToken).sendPasswordReset();
            res.status(200).json({
                status:'success',
                message:'Token Sent to Email'
            })     
        }catch(err){
            user.passwordResetToken= undefined;
            user.passwordResetExpires= undefined;
            await user.save({validateBeforeSave:false})
            return next(new AppError('There was an error sending an email, Try Again Later',500))
        }
                 
})
exports.resetPassword=catchAsync(async (req,res,next)=>{
     //Comparing Token 
    const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
   const user = await user.findOne({passwordResetToken:hashToken,passwordResetExpires:{$gt:Date.now()}})
    if(!user) return next(new AppError('Token is Invalid or expired',400))
    //Updating Field if there token verifies 
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires= undefined;
    await user.save();
     //update passwordChangedAt property
    //Login To the User
    createResetToken(user,200,req,res);
})

exports.updatePassword= catchAsync(async(req,res,next)=>{
     //1 Get User From Collection
     const user= await User.findById(req.user.id).select('+password');
     //2 Check If Posted Current Password is Correct
     if(!user || !(await user.correctPassword(req.body.passwordCurrent,user.password))){
        return next(new AppError('Your Current Password is Wrong',401))
     }
     //3 If So, Update Password
     user.password= req.body.password;
     user.confirmPassword= req.body.passwordConfirm
     await user.save(); //User.findByIdAndUpdate will not work here
     //4 Log User in,send JWT 
     createResetToken(user,200,req,res);
})