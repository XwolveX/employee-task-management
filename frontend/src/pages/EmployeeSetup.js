import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI } from '../utils/api';

function EmployeeSetup() {
    // get token from URL
    const { token } = useParams();
    const navigate = useNavigate();

    // State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Function: Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        // Validate username
        if (formData.username.length < 4) {
            setErrorMsg('Username must be at least 4 characters');
            return;
        }

        // Validate password
        if (formData.password.length < 6) {
            setErrorMsg('Password must be at least 6 characters');
            return;
        }

        // Check password match
        if (formData.password !== formData.confirmPassword) {
            setErrorMsg('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const response = await employeeAPI.setupAccount(
                token,
                formData.username,
                formData.password
            );

            if (response.data.success) {
                alert('Account created successfully! Please login.');
                navigate('/employee/login');
            }

        } catch (error) {
            console.error('Error setting up account:', error);
            setErrorMsg(error.response?.data?.message || 'Failed to setup account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Setup Your Account</h1>
                <p style={styles.subtitle}>Create your login credentials</p>

                {errorMsg && (
                    <div style={styles.errorBox}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            placeholder="Choose a username (min 4 characters)"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            style={styles.input}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            placeholder="Choose a password (min 6 characters)"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            style={styles.input}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            style={styles.input}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={styles.submitButton}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div style={styles.footer}>
                    Already have an account?{' '}
                    <a href="/employee/login" style={styles.link}>Login here</a>
                </div>
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
        maxWidth: '450px'
    },
    title: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '10px'
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: '30px',
        fontSize: '14px'
    },
    errorBox: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '12px',
        borderRadius: '5px',
        marginBottom: '20px',
        border: '1px solid #ef5350'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#555',
        fontWeight: 'bold',
        fontSize: '14px'
    },
    input: {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        boxSizing: 'border-box'
    },
    submitButton: {
        width: '100%',
        padding: '14px',
        fontSize: '16px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginTop: '10px'
    },
    footer: {
        textAlign: 'center',
        marginTop: '25px',
        color: '#666',
        fontSize: '14px'
    },
    link: {
        color: '#2196F3',
        textDecoration: 'none',
        fontWeight: 'bold'
    }
};

export default EmployeeSetup;