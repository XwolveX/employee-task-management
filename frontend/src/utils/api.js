// Import axios
import axios from 'axios';

//Backend base URL
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
// handle token expired (401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const code = error.response?.data?.code;
            if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID') {
                localStorage.clear();

                // Redirect
                const role = localStorage.getItem('userRole');
                if (role === 'employee') {
                    window.location.href = '/employee/login';
                } else {
                    window.location.href = '/owner/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

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
        return api.post(`/owner/CreateEmployee`, {
            name,
            email,
            department
        });
    },

    // get all employees
    getAllEmployees: () => {
        return api.post(`/owner/GetAllEmployees`, {});
    },

    // Get 1 employee
    getEmployee: (employeeId) => {
        return api.post(`/owner/GetEmployee`, {
            employeeId
        });
    },

    // Delete employee
    deleteEmployee: (employeeId) => {
        return api.post(`/owner/DeleteEmployee`, {
            employeeId
        });
    },

    // Update employee
    updateEmployee: (employeeId, name, email, department) => {
        return api.post(`/owner/UpdateEmployee`, {
            employeeId,
            name,
            email,
            department
        });
    },
    // Assign task
    assignTask: (employeeId, title, description, deadline) => {
        return api.post(`/owner/AssignTask`, {
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
    getProfile: () => {
        return api.post(`/employee/GetProfile`, {});
    },

    // update profile
    updateProfile: (name, email, department) => {
        return api.post(`/employee/UpdateProfile`, {
            name,
            email,
            department
        });
    },
    //get task
    getTasks: () => {
        return api.post(`/employee/GetTasks`, {});
    },

    // Update the status of a specific task
    updateTaskStatus: (taskId, newStatus) => {
        return api.post(`/employee/UpdateTaskStatus`, {
            taskId,
            status: newStatus
        });
    }
};