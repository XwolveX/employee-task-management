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

    Create .env file if not yet
   PORT=5000

    # Twilio
    TWILIO_SID=
    TWILIO_AUTH_TOKEN=
    TWILIO_PHONE=
    
    # Gmail
    EMAIL_USER=
    EMAIL_PASS=
    3. Backend Configuration

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

4. Frontend Configuration

    Navigate to the frontend directory:
    Bash

    cd ../frontend

    Install dependencies: This installs React 19 and libraries like axios and socket.io-client.
    Bash

    npm install

    Start the Application: The app will automatically open in your browser at http://localhost:3000.
    Bash

    npm start

5. Key Project Features

    Real-time Chat: Managed via Socket.io in server.js using join_room and send_message events.

    API Routes:

        /api/owner: Routes for owner-level management.

        /api/employee: Routes for employee tasks and profiles.

    Health Check: You can verify the server status by visiting http://localhost:5000/health.

6. Troubleshooting

    Port Conflicts: Ensure ports 3000 and 5000 are not being used by other processes.

    Firebase Connection: Ensure your Firebase Admin SDK configuration in backend/config/firebase.js is correctly linked to your service account key.
7.screenshot of application
Owner screen
<img width="2482" height="1375" alt="image" src="https://github.com/user-attachments/assets/9af623f5-d16a-4084-baa1-bb696a2e6ffc" />
<img width="1929" height="504" alt="image" src="https://github.com/user-attachments/assets/70d78fa4-814c-4640-8135-71cf1cd3ac3b" />
<img width="2092" height="1302" alt="image" src="https://github.com/user-attachments/assets/2d0e3b9a-bc16-4642-9180-0f508f63fae0" />
<img width="1934" height="1245" alt="image" src="https://github.com/user-attachments/assets/c839fdb9-aa8e-402e-93d8-a3fdba29639d" />
<img width="2010" height="549" alt="image" src="https://github.com/user-attachments/assets/81eb3e8b-8b80-4ee8-b7be-db291ed41176" />
Employee Screen
<img width="2482" height="1376" alt="image" src="https://github.com/user-attachments/assets/2628e325-363e-44a7-8c4f-d9ebc058050b" />
<img width="2480" height="1376" alt="image" src="https://github.com/user-attachments/assets/8d51c726-2fc1-4eed-b5d7-e57314579ca1" />
<img width="1468" height="1049" alt="image" src="https://github.com/user-attachments/assets/7890b1ef-d5e2-4392-a136-2f677a7fb13b" />
Chat socket

<img width="1025" height="1031" alt="image" src="https://github.com/user-attachments/assets/33bc705a-9e5a-47ea-9ab1-d2fbdb15772d" />




