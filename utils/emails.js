const nodemailer = require('nodemailer');
const pug = require('pug')
const htmlToText= require('html-to-text')
module.exports= class SendEmail {
    constructor(user,url){
        this.to= user.email,
        this.firstName= user.name.split(' ')[0]
        this.url= url,
        this.from = `Sami <${process.env.EMAIL_FROM}>`
    }
    createTransport(){
        //   if(process.env.NODE_ENV==='production'){
              return nodemailer.createTransport({
                  service: 'SendGrid',
                  auth:{
                      user:process.env.SEND_GRID_EMAIL,
                      pass:process.env.SEND_GRID_PASSWORD
                  }
              })
         // }
            // return nodemailer.createTransport({
            // host:process.env.EMAIL_HOST,
            // port:process.env.EMAIL_PORT,
            // auth:{
            //     user:process.env.EMAIL_FROM,
            //     pass: process.EMAIL_PASSWORD
            // }
        //});
    }
    //send Actual email
    async send(template,subject){
        //Render Hml base Template
         const html = pug.renderFile(`${__dirname}/../views/base.pug`,{
             firstName: this.firstName,
             url:this.url,
             subject
         })
        //Email Option
        const mailOptions = {
            from: this.from,
            to : this.to,
            subject: subject,
            html: html,
            text: htmlToText.fromString(html),
        }
        //send Email
        await this.createTransport().sendMail(mailOptions)
    }
    async sendWelcome(){
        await this.send('welcome','Welcome To Natours Family')
    }
    async sendPasswordReset(){
        await this.send('passwordReset','Your Password Reset Token')
    }
}

