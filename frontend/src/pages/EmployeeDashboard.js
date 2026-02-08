import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../utils/api';
import Chat from '../components/Chat';
function EmployeeDashboard() {
    // State
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        department: ''
    });

    const navigate = useNavigate();
    const employeeId = localStorage.getItem('employeeId');
    const employeeName = localStorage.getItem('employeeName');

    // Load profile
    useEffect(() => {
        if (!employeeId) {
            navigate('/employee/login');
            return;
        }

        fetchProfile();
    }, []);

    // Function: Fetch profile
    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const response = await employeeAPI.getProfile(employeeId);

            if (response.data.success) {
                const emp = response.data.employee;
                setProfile(emp);
                setFormData({
                    name: emp.name,
                    email: emp.email,
                    department: emp.department
                });
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
            alert('Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    // Function: Update profile
    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        try {
            const response = await employeeAPI.updateProfile(
                employeeId,
                formData.name,
                formData.email,
                formData.department
            );

            if (response.data.success) {
                alert('Profile updated successfully');

                // Update localStorage
                localStorage.setItem('employeeName', formData.name);
                localStorage.setItem('employeeEmail', formData.email);

                setIsEditing(false);
                fetchProfile();
            }

        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.message || 'Failed to update profile');
        }
    };

    // Function: Cancel edit
    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormData({
            name: profile.name,
            email: profile.email,
            department: profile.department
        });
    };

    // Function: Logout
    const handleLogout = () => {
        localStorage.removeItem('employeeId');
        localStorage.removeItem('employeeName');
        localStorage.removeItem('employeeEmail');
        localStorage.removeItem('userRole');
        navigate('/employee/login');
    };

    if (isLoading) {
        return (
            <div style={styles.container}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1>Employee Dashboard</h1>
                <button onClick={handleLogout} style={styles.logoutButton}>
                    Logout
                </button>
            </div>

            {/* Welcome Card */}
            <div style={styles.welcomeCard}>
                <h2>Welcome, {employeeName}! 👋</h2>
                <p style={styles.welcomeText}>
                    Manage your profile and view your information below.
                </p>
            </div>

            {/* Profile Card */}
            <div style={styles.profileCard}>
                <div style={styles.profileHeader}>
                    <h3>My Profile</h3>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={styles.editButton}
                        >
                            ✏️ Edit Profile
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    // View Mode
                    <div style={styles.profileView}>
                        <div style={styles.infoRow}>
                            <span style={styles.label}>👤 Name:</span>
                            <span style={styles.value}>{profile.name}</span>
                        </div>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>✉️ Email:</span>
                            <span style={styles.value}>{profile.email}</span>
                        </div>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>🏢 Department:</span>
                            <span style={styles.value}>{profile.department}</span>
                        </div>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>🆔 Username:</span>
                            <span style={styles.value}>{profile.username}</span>
                        </div>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>📅 Joined:</span>
                            <span style={styles.value}>
                {new Date(profile.createdAt).toLocaleDateString()}
              </span>
                        </div>

                        {profile.lastLogin && (
                            <div style={styles.infoRow}>
                                <span style={styles.label}>🕐 Last Login:</span>
                                <span style={styles.value}>
                  {new Date(profile.lastLogin).toLocaleString()}
                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    // Edit Mode
                    <form onSubmit={handleUpdateProfile}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Department</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.buttonGroup}>
                            <button type="submit" style={styles.saveButton}>
                                💾 Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                style={styles.cancelButton}
                            >
                                ✕ Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Tasks Card (Placeholder) */}
            <div style={styles.tasksCard}>
                <h3>My Tasks</h3>
                <p style={styles.emptyMessage}>
                    📋 No tasks assigned yet.
                </p>
            </div>
            {/* Chat Button */}
            <div style={styles.chatSection}>
                <button
                    onClick={() => setShowChat(!showChat)}
                    style={styles.chatToggleButton}
                >
                    {showChat ? '✕ Close Chat' : '💬 Chat with Owner'}
                </button>
            </div>
            {/* Chat Modal */}
            {showChat && (
                <div style={styles.chatModal}>
                    <div style={styles.chatModalContent}>
                        <button
                            onClick={() => setShowChat(false)}
                            style={styles.closeButton}
                        >
                            ✕ Close
                        </button>

                        <Chat
                            roomId={`chat_room_${employeeId}`}
                            currentUserId={employeeId}
                            currentUserName={employeeName}
                            otherUserName="Owner"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    },
    logoutButton: {
        padding: '10px 20px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    welcomeCard: {
        backgroundColor: '#e3f2fd',
        padding: '30px',
        borderRadius: '10px',
        marginBottom: '20px',
        textAlign: 'center'
    },
    welcomeText: {
        color: '#666',
        marginTop: '10px'
    },
    profileCard: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        marginBottom: '20px'
    },
    profileHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
    },
    editButton: {
        padding: '8px 16px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    profileView: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    infoRow: {
        display: 'flex',
        padding: '12px',
        backgroundColor: '#f9f9f9',
        borderRadius: '5px'
    },
    label: {
        fontWeight: 'bold',
        minWidth: '150px',
        color: '#555'
    },
    value: {
        color: '#333',
        flex: 1
    },
    formGroup: {
        marginBottom: '20px'
    },
    formLabel: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: 'bold',
        color: '#555'
    },
    input: {
        width: '100%',
        padding: '12px',
        fontSize: '16px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        boxSizing: 'border-box'
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px'
    },
    saveButton: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    cancelButton: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#ccc',
        color: '#333',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    tasksCard: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    },
    emptyMessage: {
        textAlign: 'center',
        color: '#999',
        padding: '20px'
    },
    chatSection: {
        marginTop: '20px'
    },
    chatToggleButton: {
        width: '100%',
        padding: '15px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold'
    },
    chatContainer: {
        marginTop: '20px'
    },
    chatModal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    chatModalContent: {
        backgroundColor: 'white',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '600px',
        position: 'relative',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        padding: '8px 12px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        zIndex: 1001
    }
};

export default EmployeeDashboard;