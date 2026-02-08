import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerAPI } from '../utils/api';

function OwnerLogin() {
    // State management
    const [phoneNum, setPhoneNum] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [currentStep, setCurrentStep] = useState(1); // 1: phone, 2: OTP
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const navigate = useNavigate();

    // Function: Send OTP to phone
    const handleSendOTP = async () => {
        // Clear previous error
        setErrorMsg('');

        // Validate phone number
        if (!phoneNum) {
            setErrorMsg('Please enter phone number');
            return;
        }

        if (!phoneNum.startsWith('+')) {
            setErrorMsg('Phone number must start with country code (e.g., +84)');
            return;
        }

        if (phoneNum.length < 10) {
            setErrorMsg('Invalid phone number');
            return;
        }

        setIsLoading(true);

        try {
            const response = await ownerAPI.createOTPCode(phoneNum);

            if (response.data.success) {
                alert('OTP code has been sent to your phone!');
                setCurrentStep(2); // Move to step 2
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

        // Validate OTP
        if (!otpValue) {
            setErrorMsg('Please enter OTP code');
            return;
        }

        if (otpValue.length !== 6) {
            setErrorMsg('OTP must be 6 digits');
            return;
        }

        setIsLoading(true);

        try {
            const response = await ownerAPI.validateOTPCode(phoneNum, otpValue);

            if (response.data.success) {
                // Save to localStorage
                localStorage.setItem('userPhone', phoneNum);
                localStorage.setItem('userRole', 'owner');

                // Navigate to dashboard
                navigate('/owner/dashboard');
            }

        } catch (error) {
            console.error('Error verifying OTP:', error);
            setErrorMsg(error.response?.data?.message || 'Invalid OTP code');
        } finally {
            setIsLoading(false);
        }
    };

    // Function: Go back to step 1
    const handleGoBack = () => {
        setCurrentStep(1);
        setOtpValue('');
        setErrorMsg('');
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Owner Login</h1>

                {/* Error message */}
                {errorMsg && (
                    <div style={styles.errorBox}>
                        {errorMsg}
                    </div>
                )}

                {/* STEP 1: Enter phone number */}
                {currentStep === 1 && (
                    <div>
                        <h3 style={styles.subtitle}>Step 1: Enter Phone Number</h3>

                        <input
                            type="tel"
                            placeholder="+84901234567"
                            value={phoneNum}
                            onChange={(e) => setPhoneNum(e.target.value)}
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
                    </div>
                )}

                {/* STEP 2: Enter OTP */}
                {currentStep === 2 && (
                    <div>
                        <h3 style={styles.subtitle}>Step 2: Enter OTP Code</h3>
                        <p style={styles.info}>OTP sent to: <strong>{phoneNum}</strong></p>

                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))} // Only numbers
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

// Inline styles
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
        backgroundColor: '#4CAF50',
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
        marginBottom: '15px'
    }
};

export default OwnerLogin;