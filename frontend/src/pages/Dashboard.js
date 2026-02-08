import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerAPI } from '../utils/api';
import Chat from '../components/Chat';

function Dashboard() {
    // State management
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskData, setTaskData] = useState({ title: '', description: '', deadline: '' });
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        department: ''
    });

    const navigate = useNavigate();
    const userPhone = localStorage.getItem('userPhone');

    // Load employees when component mount
    useEffect(() => {
        // Check login
        if (!userPhone) {
            navigate('/owner/login');
            return;
        }

        fetchEmployees();
    }, []);

    // Function: get list of employees
    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const response = await ownerAPI.getAllEmployees();

            if (response.data.success) {
                setEmployees(response.data.employees);
            }

        } catch (error) {
            console.error('Error fetching employees:', error);
            alert('Failed to load employees');
        } finally {
            setIsLoading(false);
        }
    };

    // Function: add employee
    const handleAddEmployee = async (e) => {
        e.preventDefault();

        // Validate
        if (!formData.name || !formData.email || !formData.department) {
            alert('Please fill all fields');
            return;
        }

        try {
            const response = await ownerAPI.createEmployee(
                formData.name,
                formData.email,
                formData.department
            );

            if (response.data.success) {
                alert('Employee created successfully!\nSetup link: ' + response.data.setupLink);

                // Reset form
                setFormData({ name: '', email: '', department: '' });
                setShowAddForm(false);

                // Reload employees
                fetchEmployees();
            }

        } catch (error) {
            console.error('Error creating employee:', error);
            alert(error.response?.data?.message || 'Failed to create employee');
        }
    };

    // Function: delete employee
    const handleDeleteEmployee = async (employeeId, employeeName) => {
        if (!window.confirm(`Are you sure you want to delete ${employeeName}?`)) {
            return;
        }

        try {
            const response = await ownerAPI.deleteEmployee(employeeId);

            if (response.data.success) {
                alert('Employee deleted successfully');
                fetchEmployees();
            }

        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Failed to delete employee');
        }
    };
    const handleAssignTask = async (e) => {
        e.preventDefault();
        try {
            const response = await ownerAPI.assignTask(
                selectedEmployee.employeeId,
                taskData.title,
                taskData.description,
                taskData.deadline
            );

            if (response.data.success) {
                alert('Task assigned successfully!');
                setShowTaskForm(false);
                setTaskData({ title: '', description: '', deadline: '' });
                fetchEmployees();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to assign task');
        }
    };
    // Function: open edit form
    const handleEditClick = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            name: employee.name,
            email: employee.email,
            department: employee.department
        });
    };

    // Function: Update employee
    const handleUpdateEmployee = async (e) => {
        e.preventDefault();

        try {
            const response = await ownerAPI.updateEmployee(
                editingEmployee.employeeId,
                formData.name,
                formData.email,
                formData.department
            );

            if (response.data.success) {
                alert('Employee updated successfully');

                // Reset
                setEditingEmployee(null);
                setFormData({ name: '', email: '', department: '' });

                // Reload
                fetchEmployees();
            }

        } catch (error) {
            console.error('Error updating employee:', error);
            alert(error.response?.data?.message || 'Failed to update employee');
        }
    };

    // Function: Logout
    const handleLogout = () => {
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userRole');
        navigate('/owner/login');
    };
    // Function: Search
    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1>Employee Management Dashboard</h1>
                <div>
                    <span style={styles.userInfo}>👤 {userPhone}</span>
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div style={styles.actions}>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={styles.addButton}
                >
                    {showAddForm ? '✕ Cancel' : '+ Add Employee'}
                </button>
                <input
                    type="text"
                    placeholder="🔍 Search name, e   mail or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
                <button
                    onClick={fetchEmployees}
                    style={styles.refreshButton}
                >
                    🔄 Refresh
                </button>
            </div>
            {/* showTask Form */}
            {showTaskForm && (
                <div style={styles.formCard}>
                    <h3>Assign Task to: {selectedEmployee?.name}</h3>
                    <form onSubmit={handleAssignTask} style={styles.formLayout}>
                        <input
                            type="text"
                            placeholder="Task Title"
                            value={taskData.title}
                            onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                            style={styles.input}
                            required
                        />
                        <textarea
                            placeholder="Task Description"
                            value={taskData.description}
                            onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                            style={{...styles.input, minHeight: '80px'}}
                        />
                        <input
                            type="date"
                            value={taskData.deadline}
                            onChange={(e) => setTaskData({...taskData, deadline: e.target.value})}
                            style={styles.input}
                            required
                        />
                        <div style={styles.buttonGroup}>
                            <button type="submit" style={styles.submitButton}>Assign Task</button>
                            <button type="button" onClick={() => setShowTaskForm(false)} style={styles.cancelButton}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
            {/* Add Employee Form */}
            {showAddForm && (
                <div style={styles.formCard}>
                    <h3>Add New Employee</h3>
                    <form onSubmit={handleAddEmployee} style={styles.formLayout}>
                        <div style={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                style={styles.input}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                style={styles.input}
                            />
                            <input
                                type="text"
                                placeholder="Department"
                                value={formData.department}
                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                style={styles.input}
                            />
                        </div>
                        <button type="submit" style={styles.submitButtonInline}>
                            Create Employee
                        </button>
                    </form>
                </div>
            )}

            {/* Edit Employee Form */}
            {editingEmployee && (
                <div style={styles.formCard}>
                    <h3>Edit Employee: {editingEmployee.name}</h3>
                    <form onSubmit={handleUpdateEmployee}>
                        <input
                            type="text"
                            placeholder="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            style={styles.input}
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            style={styles.input}
                        />

                        <input
                            type="text"
                            placeholder="Department"
                            value={formData.department}
                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                            style={styles.input}
                        />

                        <div style={styles.buttonGroup}>
                            <button type="submit" style={styles.submitButton}>
                                Update
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingEmployee(null);
                                    setFormData({ name: '', email: '', department: '' });
                                }}
                                style={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Employee List */}
            <div style={styles.tableContainer}>
                <h2>Employees ({employees.length})</h2>

                {isLoading ? (
                    <p>Loading...</p>
                ) : employees.length === 0 ? (
                    <p style={styles.emptyMessage}>No employees yet. Click "Add Employee" to create one.</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                        <tr>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Department</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Created</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredEmployees.map((emp) => (
                            <tr key={emp.employeeId} style={styles.tr}>
                                <td style={styles.td}>{emp.name}</td>
                                <td style={styles.td}>{emp.email}</td>
                                <td style={styles.td}>{emp.department}</td>
                                <td style={styles.td}>
                    <span style={emp.isSetup ? styles.statusActive : styles.statusPending}>
                      {emp.isSetup ? '✓ Active' : '⏳ Pending Setup'}
                    </span>
                                </td>
                                <td style={styles.td}>
                                    {new Date(emp.createdAt).toLocaleDateString()}
                                </td>
                                <td style={styles.td}>
                                    <button
                                        onClick={() => handleEditClick(emp)}
                                        style={styles.editButton}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmployee(emp.employeeId, emp.name)}
                                        style={styles.deleteButton}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedEmployee(emp);
                                            setShowChat(true);
                                        }}
                                        style={styles.chatButton}
                                    >
                                        💬
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedEmployee(emp);
                                            setShowTaskForm(true);
                                        }}
                                        style={styles.assignButton}
                                    >
                                        📝
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
            {/* Chat Modal */}
            {showChat && selectedEmployee && (
                <div style={styles.chatModal}>
                    <div style={styles.chatModalContent}>
                        <button
                            onClick={() => setShowChat(false)}
                            style={styles.closeButton}
                        >
                            ✕ Close
                        </button>

                        <Chat
                            roomId={`chat_room_${selectedEmployee.employeeId}`}
                            currentUserId={userPhone}
                            currentUserName="Owner"
                            otherUserName={selectedEmployee.name}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Styles
const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    },
    userInfo: {
        marginRight: '15px',
        color: '#666'
    },
    logoutButton: {
        padding: '8px 16px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    actions: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
    },
    addButton: {
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    refreshButton: {
        padding: '10px 20px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    formCard: {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        marginBottom: '20px'
    },
    submitButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px'
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
    tableContainer: {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    },
    emptyMessage: {
        textAlign: 'center',
        color: '#999',
        padding: '40px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderBottom: '2px solid #ddd',
        fontWeight: 'bold'
    },
    tr: {
        borderBottom: '1px solid #eee'
    },
    td: {
        padding: '12px'
    },
    statusActive: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '14px'
    },
    statusPending: {
        backgroundColor: '#fff3e0',
        color: '#f57c00',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '14px'
    },
    editButton: {
        padding: '6px 12px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '5px'
    },
    deleteButton: {
        padding: '6px 12px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    searchInput: {
        flex: 1,
        padding: '10px 15px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '16px',
        outline: 'none'
    },
    formLayout: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    inputGroup: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    },
    input: {
        width: '100%',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color 0.3s',
    },
    submitButtonInline: {
        alignSelf: 'flex-end',
        padding: '12px 30px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        width: 'fit-content'
    },
    chatButton: {
        padding: '6px 12px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginLeft: '5px'
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
        position: 'relative'
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
    },
    assignButton:{
        padding: '6px 12px',
        backgroundColor: '#FFA500',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginLeft: '5px'
    },
};

export default Dashboard;