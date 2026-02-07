const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

//setup twilio
const twilioClient = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
);
//setup mail
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
//Creat OTP code
router.post('/CreateNewOTPCode', async (req, res) => {
    try {
        const {phoneNumber} = req.body;
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'missing phone number'
            });
        }
        //check phone format
        if (!phoneNumber.startsWith('+') || phoneNumber.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'phone number is incorrect. It must be +84xxxxxxxxx'
            });
        }
        //create a ramdom 6 number otp
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        //overwrite on firebase
        await db.collection('owners').doc(phoneNumber).set({
            phoneNumber: phoneNumber,
            OTPCode: otpCode,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });
        // await twilioClient.messages.create({
        //     body: `your otp code is: ${otpCode}. it will expire in 5 minutes.`,
        //     from: process.env.TWILIO_PHONE, //sent from twilio number
        //     to: phoneNumber // sent to user number
        // });
        console.log(`📱 [MOCK SMS] To: ${phoneNumber}, Code: ${otpCode}`);
        res.json({
            success: true,
            message: 'the Otp code has sent to your phone'
        });
    } catch (error) {
        if (error.code === 21211) {
            return res.status(400).json({
                success: false,
                message: 'your phone number is not available'
            });
        }
        res.status(500).json({
            success: false,
            message: 'something when wrong',
            error: error.message
        });
    }
    });

//validate OTP code
router.post('/ValidateOTPCode',async (req,res)=> {
    try {
        const { phoneNumber, OTPCode } = req.body;
        if (!phoneNumber || !OTPCode) {
            return res.status(400).json({
                success: false,
                message: 'missing phone number or OTP code'
            });
        }
        if (OTPCode.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'OTP code must be 6 number'
            });
        }
        //check data from firebase
        const docSnapshot = await db.collection('owners').doc(phoneNumber).get();
        if (!docSnapshot.exists) {
            return res.status(404).json({
                success: false,
                message: 'your phone number is not exits. please input another phone number.'
            });
        }
        const ownerData = docSnapshot.data();
        // check if OTP code is expire
        const now = new Date();
        const expiresAt = new Date(ownerData.expiresAt);
        if (now > expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'your OTP code is expired. please sent OTP code again.'
            });
        }
        if (ownerData.OTPCode === OTPCode) {
            await db.collection('owners').doc(phoneNumber).update({
                OTPCode: '',
                lastLogin: new Date().toISOString() //save the login time
            });
        return res.json({
            success: true,
            message: 'login successfully',
            data: {
                phoneNumber: phoneNumber,
                role: 'owner'
            }
        });
    } else{
        // block if input the incorrect number in 5 time.
        const wrongAttempts = (ownerData.wrongAttempts || 0) + 1;
        await db.collection('owners').doc(phoneNumber).update({
            wrongAttempts: wrongAttempts
        });
        if (wrongAttempts >= 5) {
            await db.collection('owners').doc(phoneNumber).update({
                accessCode: '',
                blocked: true,
                blockedAt: new Date().toISOString()
            });
        return res.status(403).json({
            success: false,
            message: 'your account has been blocked'
            });
        }
        return res.status(400).json({
            success: false,
            message: `OTP code is not correct. ${5 - wrongAttempts} attempts left.`
            });
        }
    } catch (error) {
    console.error('[ValidateOTP Error]:', error);
    res.status(500).json({
        success: false,
        message: 'something when wrong',
        error: error.message
    });
    }
});


router.get('/test', (req, res) => {
    res.json({ message: 'Owner routes working!' });
});


module.exports = router;