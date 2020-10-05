const express = require('express')
const userController= require('../Controllers/userController')
const authController = require('../Controllers/authController');


const router = express.Router()

router.post('/Signup',authController.signUp)
router.post('/login',authController.login)
router.post('/forgetpassword',authController.forgotPassword)
router.patch('/resetPassword/:token',authController.resetPassword)

router.use(authController.protect)
router.patch('/updatePassword',authController.updatePassword)
router.get('/me',userController.getMe,userController.getUser)
router.patch('/updateMe',userController.uploadUserPhoto,userController.resizeImage,userController.updateMe)
router.patch('/deleteMe',userController.deleteMe)


router.use(authController.restrictTo('admin'))
router.route('/').get(userController.getalluser)              
router.route('/:id').get(userController.getUser) 
.patch(userController.updateUser)
.delete(authController.restrictTo('admin'),userController.deleteUser)
module.exports = router