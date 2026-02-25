const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const Nexmo = require('nexmo');
const { generateToken, requireOwner } = require('../middleware/auth');

// Setup Nexmo (Legacy Vonage)
const nexmo = new Nexmo({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET
});

// setup twilio
// const twilioClient = twilio(
//     process.env.TWILIO_SID,
//     process.env.TWILIO_AUTH_TOKEN
// );

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
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            wrongAttempts: 0,
            blocked: false
        });

        // await twilioClient.messages.create({
        //     body: `your otp code is: ${otpCode}. it will expire in 5 minutes.`,
        //     from: process.env.TWILIO_PHONE,
        //     to: phoneNumber
        // });

        // Send SMS via Nexmo
        const cleanPhone = phoneNumber.replace('+', '');

        nexmo.message.sendSms(
            'EmpManager',
            cleanPhone,
            `Your verify code is: ${otpCode}. Valid for 5 minutes.`,
            (err, responseData) => {
                if (err) {
                    console.error('[Nexmo SMS Error]:', err);
                    console.log('[FALLBACK - MOCK SMS]');
                    console.log('To:', phoneNumber);
                    console.log('Code:', otpCode);
                } else {
                    if (responseData.messages[0]['status'] === "0") {
                        console.log('[Nexmo SMS] Sent Successfully');
                        console.log('To:', phoneNumber);
                        console.log('Code:', otpCode);
                        console.log('Message ID:', responseData.messages[0]['message-id']);
                    } else {
                        console.error('[Nexmo Error]:', responseData.messages[0]['error-text']);
                        console.log('[FALLBACK - MOCK SMS]');
                        console.log('To:', phoneNumber);
                        console.log('Code:', otpCode);
                    }
                }
            }
        );

        res.json({
            success: true,
            message: 'OTP code has been sent to your phone'
        });

    } catch (error) {
        console.error('[CreateOTPCode Error]:', error);
        res.status(500).json({
            success: false,
            message: 'something went wrong',
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
        if (ownerData.blocked) {
            return res.status(403).json({ success: false, message: 'your account has been blocked.' });
        }

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
            //generate Token
            const token = generateToken({
                phoneNumber: phoneNumber,
                role: 'owner'
            });
        return res.json({
            success: true,
            message: 'login successfully',
            token: token,
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
                OTPCode: '',
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

router.post('/CreateEmployee', requireOwner, async (req, res) => {
    try {
        // Get data from request
        const { name, email, department} = req.body;
        const ownerId = req.user.phoneNumber;

        // Validate required fields
        if (!name || !email || !department) {
            return res.status(400).json({
                success: false,
                message: 'missing required information (name, email, department)'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'invalid email format'
            });
        }

        // Check if email already exists
        const emailCheck = await db.collection('employees')
            .where('email', '==', email.toLowerCase())
            .get();

        if (!emailCheck.empty) {
            return res.status(400).json({
                success: false,
                message: 'email already exists in system'
            });
        }

        // Generate unique IDs
        const employeeId = uuidv4();
        const setupToken = uuidv4();

        // Save employee to Firebase
        await db.collection('employees').doc(employeeId).set({
            employeeId: employeeId,
            ownerId: ownerId,
            name: name.trim(),
            email: email.toLowerCase(),
            department: department.trim(),
            setupToken: setupToken,
            isSetup: false,
            createdAt: new Date().toISOString(),
            tasks: []
        });

        // Create setup link
        const setupLink = `http://localhost:3000/employee/setup/${setupToken}`;

        // Send email (MOCK for testing)
        await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome! Setup your account',
            html: `
                <h2>Welcome ${name}!</h2>
                <p>You have been added to Employee Management System.</p>
                <p>Click the link below to setup your account:</p>
                <a href="${setupLink}">Setup Account</a>
                <p>Department: ${department}</p>
            `
        });

        console.log(`[MOCK EMAIL] To: ${email}`);
        console.log(`Setup Link: ${setupLink}`);
        console.log(`[CreateEmployee] Created: ${name} (${email})`);

        res.json({
            success: true,
            employeeId: employeeId,
            message: 'employee created and setup email sent',
            setupLink: setupLink // For testing only
        });

    } catch (error) {
        console.error('[CreateEmployee Error]:', error);
        res.status(500).json({
            success: false,
            message: 'error when creating employee',
            error: error.message
        });
    }
});
router.post('/GetEmployee', requireOwner,async (req, res) => {
    try {
        const { employeeId } = req.body;

        if (!employeeId) {
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

        // Remove sensitive data
        delete employeeData.password;
        delete employeeData.OTPCode;
        delete employeeData.setupToken;

        res.json({
            success: true,
            employee: employeeData
        });

    } catch (error) {
        console.error('[GetEmployee Error]:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/GetAllEmployees', requireOwner,async (req, res) => {
    try {
        const ownerId = req.user.phoneNumber;
        if (!ownerId) {
            return res.status(400).json({
                success: false,
                message: 'ownerId is required'
            });
        }

        const snapshot = await db.collection('employees')
            .where('ownerId', '==', ownerId)
            .get();

        const employees = [];

        snapshot.forEach(doc => {
            const data = doc.data();

            // Remove sensitive information
            delete data.password;
            delete data.OTPCode;
            delete data.setupToken;

            employees.push(data);
        });

        console.log(`[GetAllEmployees] Found ${employees.length} employees`);

        res.json({
            success: true,
            employees: employees,
            count: employees.length
        });

    } catch (error) {
        console.error('[GetAllEmployees Error]:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/DeleteEmployee', requireOwner, async (req, res) => {
    try {
        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'employeeId is missing'
            });
        }

        // Check if employee exists
        const doc = await db.collection('employees').doc(employeeId).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'employee not found'
            });
        }

        // Delete document
        await db.collection('employees').doc(employeeId).delete();

        console.log(`[DeleteEmployee] Deleted: ${employeeId}`);

        res.json({
            success: true,
            message: 'employee deleted successfully'
        });

    } catch (error) {
        console.error('[DeleteEmployee Error]:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/UpdateEmployee', requireOwner,async (req, res) => {
    try {
        const { employeeId, name, email, department } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'employeeId is missing'
            });
        }

        // Check if employee exists
        const doc = await db.collection('employees').doc(employeeId).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'employee not found'
            });
        }

        // Build update object
        const updateData = {};

        if (name) {
            if (name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'name must have at least 2 characters'
                });
            }
            updateData.name = name.trim();
        }

        if (email) {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'invalid email format'
                });
            }

            // Check duplicate email (exclude current employee)
            const emailCheck = await db.collection('employees')
                .where('email', '==', email.toLowerCase())
                .get();

            if (!emailCheck.empty && emailCheck.docs[0].id !== employeeId) {
                return res.status(400).json({
                    success: false,
                    message: 'email already exists'
                });
            }

            updateData.email = email.toLowerCase();
        }

        if (department) {
            updateData.department = department.trim();
        }

        updateData.updatedAt = new Date().toISOString();

        // Check if there's anything to update
        if (Object.keys(updateData).length === 1) {
            return res.status(400).json({
                success: false,
                message: 'no data to update'
            });
        }

        // Update in Firebase
        await db.collection('employees').doc(employeeId).update(updateData);

        console.log(`[UpdateEmployee] Updated: ${employeeId}`);

        res.json({
            success: true,
            message: 'employee updated successfully'
        });

    } catch (error) {
        console.error('[UpdateEmployee Error]:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.get('/test', (req, res) => {
    res.json({ message: 'Owner routes working!' });
});
router.get('/chat-history/:roomId',requireOwner, async (req, res) => {
    try {
        const { roomId } = req.params;
        const snapshot = await db.collection('chats')
            .doc(roomId)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();

        const history = [];
        snapshot.forEach(doc => {
            history.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json({
            success: true,
            history: history
        });
    } catch (error) {
        console.error('[ChatHistory Error]:', error);
        res.status(500).json({
            success: false,
            message: 'can not download history chat',
            error: error.message
        });
    }
});
router.post('/AssignTask', requireOwner,async (req, res) => {
    try {
        const { employeeId, title, description, deadline } = req.body;

        // Validation
        if (!employeeId || !title || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: employeeId, title, or deadline'
            });
        }

        const newTask = {
            taskId: uuidv4(),
            title: title.trim(),
            description: description ? description.trim() : '',
            deadline: deadline,
            status: 'pending', // Default status
            assignedAt: new Date().toISOString(),
            assignedBy: req.user.phoneNumber
        };

        const employeeRef = db.collection('employees').doc(employeeId);
        const doc = await employeeRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Update tasks array in employee document
        const currentTasks = doc.data().tasks || [];
        await employeeRef.update({
            tasks: [...currentTasks, newTask]
        });

        res.json({
            success: true,
            message: 'Task assigned successfully',
            task: newTask
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});
module.exports = router;