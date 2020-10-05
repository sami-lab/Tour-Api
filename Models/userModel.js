const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const Userschema = mongoose.Schema(
 {
     name:{
         type: String,
         required: [true, 'A User must have a name'],
         trim: true
     },
     email:{
        type: String,
        required: [true, 'A User must have a email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail,'Please Provide a Valid Email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role:{
        type:String,
        enum: ['user','guide','lead-guide','admin'],
        default: 'user'
    },
    password:{
        type: String,
        required: [true, 'A User must have a Password'],
        minlength: [5, 'A User Password must have more or equal then 5 characters'],
        select: false
    },
    confirmPassword:{
        type:String,
        required: [true,'Please Enter Confirm Password'],
        validate:{ //Only work For Create or Save
            validator:function(val){
                 return val ===this.password;
            },
            message: 'Confirm Password Did not match with Password!!!'
        }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    changedPasswordAt : Date,
    active: {
        type:Boolean,
        default: true,
        select: false
    }

 }
)
Userschema.pre('save',async function(next){//hashing password
        if(!this.isModified('password')) return next()
        this.password = await bcrypt.hash(this.password,12)
        this.confirmPassword= undefined
        next()
})
Userschema.pre('save', function(next){ //reset change password date
    if(!this.isModified('password') || this.isNew) return next()
    this.changedPasswordAt= Date.now()-1000;
    next()
})//query Middleware
Userschema.pre(/^find/,function(next){
    this.find({active:{$ne:false}})
    next()
})
Userschema.methods.correctPassword= async function(candidatePassword,userPassword){
   return await bcrypt.compare(candidatePassword,userPassword)
}
Userschema.methods.changedPasswordAfter = function(JWTtimestamp){
    if(this.changedPasswordAt){
        const changedTime= parseInt(this.changedPasswordAt.getTime()/1000,10)
        return JWTtimestamp< changedTime  //token_issued < changed time(mean Pass changed time)
    }
    return false; //Not Changed
}
Userschema.methods.createResetPasswordToken= function(){
     const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken=  crypto.createHash('Sha256').update(resetToken).digest('hex');
    this.passwordResetExpires= Date.now() + 30*60*1000
    return resetToken
}
const User = mongoose.model('User',Userschema);


module.exports= User;