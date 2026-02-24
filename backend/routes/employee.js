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
        // sent OTP mail
        await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'OTP verify login',
            text: `Your OTP code is: ${otpCode}. code will expired in 10 minutes.`
        });
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
router.post('/ValidateOTPCode', async (req, res) => {
    try {
        const {email, OTPCode} = req.body;
        //validate email
        if (!email || !OTPCode) {
            return res.status(400).json({
                success: false,
                message: 'missing email or OTP code'
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
        //check OTP code is expired or not
        const now = new Date();
        const expiresAt = new Date(employeeData.codeExpiresAt);
        if (now > expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'OTP code is expired. please resend the OTP code.'
            });
        }
        if (employeeData.OTPCode === OTPCode) {
            await db.collection('employees').doc(employeeDoc.id).update({
                OTPCode: '',
                lastLogin: new Date().toISOString()
            });
            console.log(`[EmployeeLogin] Login successfully: ${email}`);// test log
            return res.json({
                success: true,
                message: 'Login successfully',
                data: {
                    employeeId: employeeData.employeeId,
                    name: employeeData.name,
                    email: employeeData.email,
                    department: employeeData.department,
                    role: 'employee'
                }
            });

    }   else {
            return res.status(400).json({
                success: false,
                message: 'OTP code is not correct'
            });
        }
        } catch (error) {
            console.error(' [ValidateOTPCode Error]:', error);
            res.status(500).json({
                success: false,
                message: 'Something Wrong when validate',
                error: error.message
            });
        }
    });

router.post('/GetProfile', async (req, res) => {
    try {
        const { employeeId } = req.body;

        if (!employeeId ) {
            return res.status(400).json({
                success: false,
                message: 'employeeId is missing'
            });
        }
        const doc = await db.collection('employees').doc(employeeId).get();
        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'employee not found'
            });
        }
        const employeeData = doc.data();
        //object for employee
        const profileData = {
            employeeId: employeeData.employeeId,
            name: employeeData.name,
            email: employeeData.email,
            department: employeeData.department,
            username: employeeData.username,
            isSetup: employeeData.isSetup,
            createdAt: employeeData.createdAt,
            lastLogin: employeeData.lastLogin || null,
            tasks: employeeData.tasks || []
        };
        console.log(`[GetProfile] Employee: ${employeeId}`);
        res.json({
            success: true,
            employee: profileData
        });
    } catch (error) {
        console.error('[GetProfile Error]:', error);
        res.status(500).json({
            success: false,
            message: 'error when get employee profile',
            error: error.message
        });
    }
});

router.post('/UpdateProfile', async (req, res) => {
    try {
        const { employeeId, name, email, department } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'employeeId is missing'
            });
        }
        //check if employee is exits or not
        const doc = await db.collection('employees').doc(employeeId).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'employee not found'
            });
        }

        const updateData = {};// just update the field which we change, not null

        if (name) {
            if (name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'name must have more than 2 character'
                });
            }
            updateData.name = name.trim();
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email not available'
                });
            }
            // check if mail is exits
            const emailCheck = await db.collection('employees')
                .where('email', '==', email)
                .get();

            if (!emailCheck.empty && emailCheck.docs[0].id !== employeeId) {
                return res.status(400).json({
                    success: false,
                    message: 'The email is already in use by another employee'
                });
            }

            updateData.email = email.toLowerCase();
        }

        if (department) {
            updateData.department = department.trim();
        }
        updateData.updatedAt = new Date().toISOString();

        if (Object.keys(updateData).length === 1) {
            return res.status(400).json({
                success: false,
                message: 'nothing update'
            });
        }

        // update on firebase
        await db.collection('employees').doc(employeeId).update(updateData);

        console.log(`[UpdateProfile] Employee ${employeeId} updated:`, updateData);//log check

        res.json({
            success: true,
            message: 'update successfully',
            updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
        });

    } catch (error) {
        console.error('[UpdateProfile Error]:', error);
        res.status(500).json({
            success: false,
            message: 'error when update profile',
            error: error.message
        });
    }
});
router.get('/test', (req, res) => {
    res.json({ message: 'Employee routes working' });
});
// Get all tasks for a specific employee
router.post('/GetTasks', async (req, res) => {
    try {
        const { employeeId } = req.body;
        if (!employeeId) {
            return res.status(400).json({ success: false, message: 'Missing employeeId' });
        }

        const doc = await db.collection('employees').doc(employeeId).get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const tasks = doc.data().tasks || [];
        res.json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update status of a specific task
router.post('/UpdateTaskStatus', async (req, res) => {
    try {
        const { employeeId, taskId, status } = req.body;

        const employeeRef = db.collection('employees').doc(employeeId);
        const doc = await employeeRef.get();

        if (!doc.exists) return res.status(404).json({ success: false, message: 'Employee not found' });

        let tasks = doc.data().tasks || [];
        const taskIndex = tasks.findIndex(t => t.taskId === taskId);

        if (taskIndex === -1) return res.status(404).json({ success: false, message: 'Task not found' });

        // Update status and timestamp
        tasks[taskIndex].status = status;
        tasks[taskIndex].updatedAt = new Date().toISOString();

        await employeeRef.update({ tasks });
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router;