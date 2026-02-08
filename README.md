Employee Task Management - Setup Guide

This project is a full-stack application consisting of a Node.js/Express Backend and a React Frontend. It uses Firebase for data management and Socket.io for real-time communication.
link login for employee:http://localhost:3000/employee/login
link login for owner: http://localhost:3000/owner/login
REMEMBER TO UNCOMMENT NODEMAILER AND TWILIO IN employee.js and owner.js. twrite your twilio and nodemailer account in env
CHECK you log of backend to get OTP code for sms and mail if dont use twilio and nodemailer
1. Prerequisites 

    Node.js: Version 16.x or higher installed.

    npm: Installed (comes with Node.js).

    Firebase Account: A project created in the Firebase Console.

2. Backend Configuration

    Navigate to the backend directory:
    Bash

    cd backend

    Install dependencies: This will install essential packages like express, firebase-admin, socket.io, bcrypt, and dotenv.
    Bash

    npm install

    Environment Setup: Create a .env file in the backend/ folder. Based on the source code, you should define your server port and Firebase credentials here.
    Đoạn mã

    PORT=5000
    # Add your Firebase Service Account configuration here

    Run the Server: The server will start at http://localhost:5000 by default.
    Bash

    node server.js

3. Frontend Configuration

    Navigate to the frontend directory:
    Bash

    cd ../frontend

    Install dependencies: This installs React 19 and libraries like axios and socket.io-client.
    Bash

    npm install

    Start the Application: The app will automatically open in your browser at http://localhost:3000.
    Bash

    npm start

4. Key Project Features

    Real-time Chat: Managed via Socket.io in server.js using join_room and send_message events.

    API Routes:

        /api/owner: Routes for owner-level management.

        /api/employee: Routes for employee tasks and profiles.

    Health Check: You can verify the server status by visiting http://localhost:5000/health.

5. Troubleshooting

    Port Conflicts: Ensure ports 3000 and 5000 are not being used by other processes.

    Firebase Connection: Ensure your Firebase Admin SDK configuration in backend/config/firebase.js is correctly linked to your service account key.
