School Panel Website
Warning: The critical .js files that serve as connection points (e.g., app.js) for the project have not been shared in this repository. If these files inadvertently include sensitive or private information, please ensure to review and sanitize them before uploading or sharing.

Description
This project is a robust and versatile web application designed using the React framework. It features a clean, modular architecture aimed at efficiently managing various user roles and data sets. The application demonstrates how React components can work seamlessly with external APIs, leveraging Redux, Formik, and Yup for state management, form handling, and validation respectively.

Features
User Management

Role-based user access: Admin, Teacher, Parent, Student, etc.
User data is fetched and updated via API calls with token-based authentication.
Includes forms for creating, updating, and deleting users.
Responsive UI

Components styled using reactstrap for a professional layout.
Form validation powered by Formik and Yup for a seamless user experience.
Data Visualization

Dynamic table rendering combining API data and local state using TableContainer.
Authentication

Login.js includes a basic authentication flow with token handling.
Implements "Remember Me" functionality for user convenience.
Announcements Module

Fetch, create, and display announcements for the users.
Date selection and validation with react-datepicker.
Toast Notifications

Real-time feedback for success or error states using react-toastify.
Role-Specific Features

Separate interfaces for Admins, Teachers, Parents, and Students.
E.g., ContactsListTeacher.js allows school-specific teacher management.
File Structure
bash
Kodu kopyala
/src
├── components
│   ├── Common
│   │   ├── Breadcrumb.js
│   │   ├── DeleteModal.js
│   │   └── TableContainer.js
├── pages
│   ├── Login.js
│   ├── Contacts
│   │   ├── ContactsList.js
│   │   ├── ContactsListStudent.js
│   │   ├── ContactsListParent.js
│   │   ├── ContactsListTeacher.js
│   │   ├── ContactsListClass.js
│   │   ├── ContactsListSchool.js
│   │   └── ContactsListAdmin.js
│   └── Announcement.js
├── helpers
│   └── api_helper.js
Usage
Setup

Clone the repository.
Install dependencies:
bash
Kodu kopyala
npm install
Run

Start the development server:
bash
Kodu kopyala
npm start
Environment Configuration

Ensure .env is correctly configured with API endpoints and token secrets.
API Integration
Authentication
Endpoint: POST /auth/login
Headers: Authorization: Bearer <token>
User Management
Fetch Users: GET /user/getAllUser/
Add User: POST /user/create
Update User: PATCH /user/update/<userId>
Delete User: DELETE /user/delete/<userId>
Modules
Login Page

Handles user authentication.
Includes "Remember Me" functionality.
Contacts Management

CRUD operations for different user types.
Dynamic rendering with role-based access control.
Announcement Page

Announcement creation with date and role association.
Validates data before submission.
Dependencies
React for UI.
Redux for state management.
Formik and Yup for form validation.
reactstrap for styling.
Axios for API communication.
react-toastify for notifications.
