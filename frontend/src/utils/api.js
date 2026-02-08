// Import axios
import axios from 'axios';

//Backend base URL
const API_BASE_URL = 'http://localhost:5000/api';

// OWNER APIs
export const ownerAPI = {
    // Generate OTP and send SMS
    createOTPCode: (phoneNumber) => {
        return axios.post(`${API_BASE_URL}/owner/CreateNewOTPCode`, {
            phoneNumber
        });
    },

    // validate OTP
    validateOTPCode: (phoneNumber, OTPCode) => {
        return axios.post(`${API_BASE_URL}/owner/ValidateOTPCode`, {
            phoneNumber,
            OTPCode
        });
    },

    // Create new employee
    createEmployee: (name, email, department) => {
        return axios.post(`${API_BASE_URL}/owner/CreateEmployee`, {
            name,
            email,
            department
        });
    },

    // get all employees
    getAllEmployees: () => {
        return axios.get(`${API_BASE_URL}/owner/GetAllEmployees`);
    },

    // Get 1 employee
    getEmployee: (employeeId) => {
        return axios.post(`${API_BASE_URL}/owner/GetEmployee`, {
            employeeId
        });
    },

    // Delete employee
    deleteEmployee: (employeeId) => {
        return axios.post(`${API_BASE_URL}/owner/DeleteEmployee`, {
            employeeId
        });
    },

    // Update employee
    updateEmployee: (employeeId, name, email, department) => {
        return axios.post(`${API_BASE_URL}/owner/UpdateEmployee`, {
            employeeId,
            name,
            email,
            department
        });
    },
    // Assign task
    assignTask: (employeeId, title, description, deadline) => {
        return axios.post(`${API_BASE_URL}/owner/AssignTask`, {
            employeeId,
            title,
            description,
            deadline
        });
    }
};

// EMPLOYEE APIs
export const employeeAPI = {
    // Setup account
    setupAccount: (setupToken, username, password) => {
        return axios.post(`${API_BASE_URL}/employee/SetupAccount`, {
            setupToken,
            username,
            password
        });
    },

    // sent OTP through email
    loginEmail: (email) => {
        return axios.post(`${API_BASE_URL}/employee/LoginEmail`, {
            email
        });
    },

    // validate OTP
    validateOTP: (email, OTPCode) => {
        return axios.post(`${API_BASE_URL}/employee/ValidateOTPCode`, {
            email,
            OTPCode
        });
    },

    // get profile
    getProfile: (employeeId) => {
        return axios.post(`${API_BASE_URL}/employee/GetProfile`, {
            employeeId
        });
    },

    // update profile
    updateProfile: (employeeId, name, email, department) => {
        return axios.post(`${API_BASE_URL}/employee/UpdateProfile`, {
            employeeId,
            name,
            email,
            department
        });
    },
    //get task
    getTasks: (employeeId) => {
        return axios.post(`${API_BASE_URL}/employee/GetTasks`, {
            employeeId
        });
    },

    // Update the status of a specific task
    updateTaskStatus: (employeeId, taskId, newStatus) => {
        return axios.post(`${API_BASE_URL}/employee/UpdateTaskStatus`, {
            employeeId,
            taskId,
            status: newStatus
        });
    }
};