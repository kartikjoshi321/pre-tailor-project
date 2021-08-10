const bcrypt = require("bcrypt");
const saltRounds = 10;
// var base64ToImage = require('base64-to-image');
var path = require("path");
var express = require('express');
var twilio = require('twilio');
var FCM = require('fcm-node');

const { accountSid,authToken,twilio_no } = require('../config/config');

// var nodemailer = require("nodemailer");
// var mandrillTransport = require('nodemailer-mandrill-transport');
// var request = require('request');

exports.encryptText = async (plaintext) => {
    let encryptedPass = await bcrypt.hash(plaintext, saltRounds);
    return encryptedPass;
}

exports.compare = async (plaintext, encryptText) => {
    let matched = await bcrypt.compare(plaintext, encryptText);
    return matched;
}

exports.randomStringGenerator = () => {
    return Math.floor(10000 + Math.random() * 90000);
};

exports.randomreferralCode = () => {
    return Math.random().toString(36).substring(7);
};

exports.sendotp = async (varification_code, mobile_number) => {
    
    //var accountSid = accountSid; Your Account SID from www.twilio.com/console
    //var authToken = authToken;   Your Auth Token from www.twilio.com/console
    //console.log("AccountSid :",twilio_no );
    var client = new twilio(accountSid, authToken);
    await client.messages.create({
        body: "your one time password(OTP) is  " + varification_code + "  valid for 2 days do not disclose it",
        to: mobile_number, // Text this number
        from: twilio_no // From a valid Twilio number
    }).then(async (message) => {
        return message.sid;
    }).catch(async(error)=>{
        // Handle any error from any of the steps...
        console.error('Buying the number failed. Reason: ',error);
        if(error.code == 21614 || error.code == 21211)
            {throw new Error(`${mobile_number} not a valid mobile Number`)};
        throw new Error(error.message);
    });
}

exports.sendmail = function (email_id, subject, message) {
    // var nodemailer = require("nodemailer");
    // var smtpTransport = require("nodemailer-smtp-transport");

    // var smtpTransport = nodemailer.createTransport(mandrillTransport({
    //     auth: {
    //         apiKey: config.mail_key
    //     }
    // }));
    // let mailData = {
    //     from: 'api@elanapp.com',
    //     cc: "2701himanshu@gmail.com",
    //     to: email_id,
    //     subject: subject,
    //     html: message
    // };
    // smtpTransport.sendMail(mailData, function (error, response) {
    //     if (error) {
    //         throw new Error("Error in sending email");
    //     }
    //     console.log("Message sent: " + JSON.stringify(response));
    // });

    var mail_config = {
        "SMTP_HOST": "smtp.mandrillapp.com",
        "SMTP_PORT": 587,
        "SMTP_USER": "elanapp", //default
        "SMTP_PASS": "XiP8fWlOdE_I4tA7wRcceg"
        //"SMTP_PASS" : mail_config.SMTP_PASS
    }
    var mailer = nodemailer.createTransport({
        // service: 'SendGrid',
        host: mail_config.SMTP_HOST,
        port: mail_config.SMTP_PORT,
        auth: {
            user: mail_config.SMTP_USER,
            pass: mail_config.SMTP_PASS
        }
    });
    mailer.sendMail({
        from: "api@elanapp.com",
        to: email_id,
        cc: "kartik.joshi@fluper.in",
        // cc: "anchal.goyal@fluper.in",
        subject: subject,
        template: "text",
        html: message
    }, (error, response) => {

        if (error) {
            console.log(error);
            //  res.send({ message: "Email not send " });
        } else {
            console.log(response);
            // resolve({ message: "Email send successfully" });
        }
        mailer.close();
        //res.send("Response send successfully");
    });
}

// exports.convertBase64ToFile = async (base64, For) => {
//     var path = 'public/images/';
//     let fileName;
//     if (For == 'admin') {
//         fileName = "admin-profile-image";
//     } else {
//         fileName = For ? For : new Date().getTime();
//     }
//     var imageInfo = base64ToImage(
//         base64,
//         path,
//         { fileName: fileName, type: 'png' }
//     );
//     return "images/" + imageInfo.fileName;
// }

// exports.getAddressByPostalCode = async (postalCode) => {
//     return new Promise((res, rej) => {
//         request(`https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode}&key=AIzaSyB6XxbBO6mWn2CxFqo7kgUXTFSK9le406Y`, function (error, response, body) {
//             if (error) {
//                 rej(error);
//             } else {
//                 let response = JSON.parse(body);
//                 if(response.status == "ZERO_RESULTS"){
//                     res(response.status);
//                     return;
//                 }
//                 res(response.results[0].address_components);
//             }
//         });
//     })

// }

exports.sendPushNotification = function (serverKey, token, device_type, payload, notify) {
    // let notify = {
    //   // "content-available": 1,
    //     title: title,
    //     body: body,
    //     // click_action: "FCM_PLUGIN_ACTIVITY",
    //     "color": "#f95b2c",
    //     "sound": true,
    //     // "badge": "0",
    //     // "alert" : "",
    // }
    console.log("send notification Android calling");
    var fcm = new FCM(serverKey);
    var message = {
        to: token,
        collapse_key: 'your_collapse_key',
        notification: notify,
        data: payload,
    };
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("=======================Android error comming===================")
            console.log(null, err);
        } else {
            console.log("=======================Android===================")
            console.log(null, response);            
        }
    });
}