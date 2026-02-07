import logo from './logo.svg';
import './App.css';

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import pages
import OwnerLogin from './pages/OwnerLogin';
import Dashboard from './pages/Dashboard';
import EmployeeSetup from './pages/EmployeeSetup';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Default route - redirect to owner login */}
                    <Route path="/" element={<Navigate to="/owner/login" />} />

                    {/* Owner routes */}
                    <Route path="/owner/login" element={<OwnerLogin />} />
                    <Route path="/owner/dashboard" element={<Dashboard />} />

                    {/* Employee routes */}
                    <Route path="/employee/setup/:token" element={<EmployeeSetup />} />
                    <Route path="/employee/login" element={<EmployeeLogin />} />
                    <Route path="/employee/dashboard" element={<EmployeeDashboard />} />

                    {/* 404 - Not found */}
                    <Route path="*" element={<div><h1>404 - Page Not Found</h1></div>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;