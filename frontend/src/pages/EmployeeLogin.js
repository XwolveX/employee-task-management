import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../utils/api';

function EmployeeLogin() {
    // State
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [currentStep, setCurrentStep] = useState(1); // 1: email, 2: OTP
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const navigate = useNavigate();

    // Function: Send OTP to email
    const handleSendOTP = async () => {
        setErrorMsg('');

        // Validate email
        if (!email) {
            setErrorMsg('Please enter your email');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMsg('Invalid email format');
            return;
        }

        setIsLoading(true);

        try {
            const response = await employeeAPI.loginEmail(email);

            if (response.data.success) {
                alert('OTP code has been sent to your email!');
                setCurrentStep(2);
            }

        } catch (error) {
            console.error('Error sending OTP:', error);
            setErrorMsg(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    // Function: Verify OTP
    const handleVerifyOTP = async () => {
        setErrorMsg('');

        if (!otpCode) {
            setErrorMsg('Please enter OTP code');
            return;
        }

        if (otpCode.length !== 6) {
            setErrorMsg('OTP must be 6 digits');
            return;
        }

        setIsLoading(true);

        try {
            const response = await employeeAPI.validateOTP(email, otpCode);

            if (response.data.success) {
                // Save employee info to localStorage
                const { token, data } = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('employeeId', data.employeeId);
                localStorage.setItem('employeeName', data.name);
                localStorage.setItem('employeeEmail', data.email);
                localStorage.setItem('userRole', 'employee');

                // Navigate to employee dashboard
                navigate('/employee/dashboard');
            }

        } catch (error) {
            console.error('Error verifying OTP:', error);
            setErrorMsg(error.response?.data?.message || 'Invalid OTP code');
        } finally {
            setIsLoading(false);
        }
    };

    // Function: Go back
    const handleGoBack = () => {
        setCurrentStep(1);
        setOtpCode('');
        setErrorMsg('');
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Employee Login</h1>

                {errorMsg && (
                    <div style={styles.errorBox}>
                        {errorMsg}
                    </div>
                )}

                {/* STEP 1: Enter email */}
                {currentStep === 1 && (
                    <div>
                        <h3 style={styles.subtitle}>Step 1: Enter Your Email</h3>

                        <input
                            type="email"
                            placeholder="your-email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            disabled={isLoading}
                        />

                        <button
                            onClick={handleSendOTP}
                            disabled={isLoading}
                            style={styles.button}
                        >
                            {isLoading ? 'Sending...' : 'Send OTP Code'}
                        </button>

                        <div style={styles.footer}>
                            Need to setup account?{' '}
                            <span style={styles.info}>Check your email for setup link</span>
                        </div>
                    </div>
                )}

                {/* STEP 2: Enter OTP */}
                {currentStep === 2 && (
                    <div>
                        <h3 style={styles.subtitle}>Step 2: Enter OTP Code</h3>
                        <p style={styles.info}>OTP sent to: <strong>{email}</strong></p>

                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            style={styles.input}
                            disabled={isLoading}
                        />

                        <button
                            onClick={handleVerifyOTP}
                            disabled={isLoading}
                            style={styles.button}
                        >
                            {isLoading ? 'Verifying...' : 'Verify & Login'}
                        </button>

                        <button
                            onClick={handleGoBack}
                            disabled={isLoading}
                            style={styles.backButton}
                        >
                            ← Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
    },
    card: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
    },
    title: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '30px'
    },
    subtitle: {
        color: '#666',
        marginBottom: '20px'
    },
    input: {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        marginBottom: '15px',
        boxSizing: 'border-box'
    },
    button: {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginBottom: '10px'
    },
    backButton: {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        backgroundColor: '#ccc',
        color: '#333',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    errorBox: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '12px',
        borderRadius: '5px',
        marginBottom: '15px',
        border: '1px solid #ef5350'
    },
    info: {
        color: '#666',
        fontSize: '14px'
    },
    footer: {
        textAlign: 'center',
        marginTop: '20px',
        color: '#666',
        fontSize: '14px'
    }
};

export default EmployeeLogin;