
const fs = require('fs')
const Tour = require('../../Models/tourModel')
const User = require('../../Models/userModel')
const Review = require('../../Models/reviewModel')
const dotenv = require('dotenv')
const mongoose = require('mongoose');
dotenv.config({path: './config.env'})


const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)

//mongoose.connect(process.env.LOCAL_DB,...)
mongoose.connect(DB,{
useNewUrlParser:true,
useCreateIndex:true,
useFindAndModify:false
}).then(()=>console.log('DB connection Success'))

const tour = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'))
const user = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'))

const importdata=async()=>{
    try{
           await Tour.create(tour)
           await User.create(user,{validateBeforeSave: false})
           await Review.create(reviews)
           console.log('data Added')
           process.exit()
    }
    catch(err){
          console.log(err)
    }
}
const deletedata=async()=>{
    try{
           await Tour.deleteMany()
           await User.deleteMany()
           await Review.deleteMany()
           console.log('data deleted')
           process.exit()
    }
    catch(err){
          console.log(err)
    }
}

//To Read Data from Command Line
if(process.argv[2]=='--import'){
    importdata()
}
else if(process.argv[2]=='--delete'){
    deletedata()
}