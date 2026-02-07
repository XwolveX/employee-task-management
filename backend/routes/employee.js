const express = require('express');
const router = express.Router();

const {db} = require('../config/firebase');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

//setup mail
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
router.post('/SetupAccount', async (req,res) => {
    try {
        const { setupToken, username, password } = req.body;
        //Validate input
        if (!setupToken || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'missing requirement information'
            });
        }
        if (username.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Username must have more than 4 character'
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must have more than 6 character'
            });
        }
        const snapshot = await db.collection('employees')
            .where('setupToken', '==', setupToken)
            .get();
        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                message: 'setup link is not available'
            });
        }
        const employeeDoc = snapshot.docs[0]; //take the first employee from list
        const employeeData = employeeDoc.data();

        if (employeeData.isSetup) {
            return res.status(400).json({
                success: false,
                message: 'This account is already setup. Please move to login.'
            });
        }
        const usernameCheck = await db.collection('employees')
            .where('username', '==', username)
            .get();

        if (!usernameCheck.empty) {
            return res.status(400).json({
                success: false,
                message: 'Username is existed. please choose another username.'
            });
        }
        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        //update employee information
        await db.collection('employees').doc(employeeDoc.id).update({
            username: username,
            password: hashedPassword,
            isSetup: true,
            setupToken: '',
            setupDate: new Date().toISOString()
        });
        console.log(`[SetupAccount] Employee setup: ${username}`);//check log
        res.json({
            success: true,
            message: 'Account is Created successfully. You can login right now'
        });
    }catch (error) {
        console.error('[SetupAccount Error]:', error);
        res.status(500).json({
            success: false,
            message: 'something when wrong',
            error: error.message
        });
    }
});

router.post('/LoginEmail', async (req,res) => {
    try {
        const {email} = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'email missing'
            });
        }
        const snapshot = await db.collection('employees')
            .where('email', '==', email)
            .get();
        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                message: 'Email is not exist'
            });
        }
        const employeeDoc = snapshot.docs[0];
        const employeeData = employeeDoc.data();
        if (!employeeData.isSetup) {
            return res.status(400).json({
                success: false,
                message: 'please set up the account first. check your email to get the setup link.'
            });
        }
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await db.collection('employees').doc(employeeDoc.id).update({
            OTPCode: otpCode,
            codeCreatedAt: new Date().toISOString(),
            codeExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        });
        //sent mail
        // await emailTransporter.sendMail({    });
        console.log(`[MOCK EMAIL] To: ${email}, Code: ${otpCode}`); //testing
        res.json({
            success: true,
            message: 'validate code has been sent to your mail'
        });
    } catch (error) {
        console.error('[LoginEmail Error]:', error);
        res.status(500).json({
            success: false,
            message: 'error when sent mail',
            error: error.message
        });
    }
});

router.get('/test', (req, res) => {
    res.json({ message: 'Employee routes working' });
});

module.exports = router;