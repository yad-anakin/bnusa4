# BNUSA Admin Dashboard

This is the administrative dashboard for the BNUSA Platform, allowing authorized administrators to manage users, articles, and other content.

## Features

- User management: View, edit, and manage user accounts
- Article management: Review, edit, and delete articles
- Site settings: Configure site-wide settings
- Admin authentication
- Responsive design for desktop and mobile use

## Technologies Used

- Next.js - React framework
- Tailwind CSS - Utility-first CSS framework
- Heroicons - SVG icons
- JWT authentication
- Fetch API for data fetching

## Prerequisites

- Node.js 18+ installed
- Bnusa backend API running (default: http://localhost:5003)

## Setup

1. Clone the repository (if not already done)

```bash
git clone <repository-url>
cd bnusa-admin
```

2. Install dependencies

```bash
npm install
```

3. Install TypeScript type declarations

For Linux/Mac:
```bash
chmod +x dependencies-install.sh
./dependencies-install.sh
```

For Windows:
```powershell
.\install-dependencies.ps1
```

Or manually:
```bash
npm install --save-dev @types/react @types/react-dom @types/node
npm install --save axios chart.js react-chartjs-2 @tailwindcss/forms
```

4. Create a `.env.local` file in the root directory with the following content:

```
NEXT_PUBLIC_API_URL=http://localhost:5003
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
JWT_SECRET=your_secure_jwt_secret
```

Adjust the API URL if your backend is running on a different port or host.

5. Start the development server

```bash
npm run dev
```

The admin dashboard will be available at http://localhost:3001.

## Fixing TypeScript Errors

If you encounter TypeScript errors related to missing type declarations, run the dependency installation script as mentioned in the setup step above. This will install the required type declaration packages that are needed by the project.

For JSX-related errors, the project includes custom TypeScript declaration files in the `src/types` directory that provide global declarations for React and other libraries.

## Production Deployment

1. Build the application

```bash
npm run build
```

2. Start the production server

```bash
npm start
```

Alternatively, you can deploy this application to any platform supporting Next.js, such as Vercel, Netlify, or a traditional server.

## Connecting to the Backend

The admin dashboard connects to the Bnusa Platform backend API for all data operations. Make sure the backend is properly configured to accept requests from the admin dashboard domain.

In the backend's CORS configuration, ensure that the admin dashboard domain is allowed:

```javascript
// In the backend's CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000', // Main BNUSA app
    'http://localhost:3001', // Admin dashboard
    'https://your-main-domain.com',
    'https://admin.your-main-domain.com'
  ],
  // other options...
};
```

## Authentication

The admin dashboard uses JWT authentication with the Bnusa Platform backend. Only users with the 'admin' role can access the dashboard.

## Security Overview

The admin dashboard implements role-based authentication to ensure that only authorized administrators can access the system. The authentication system has been designed to:

1. Restrict access to users with the 'admin' role in the database
2. Use JWT tokens for authentication
3. Implement client-side and server-side verification of admin permissions

## Setting Up Admin Users

### Security Note

For security reasons, admin user setup has been disabled in the production version. 
Please contact the system administrator if you need to create or modify admin accounts.

### Authentication Flow

1. Administrators log in with their credentials
2. The system verifies the credentials and checks for the admin role
3. Upon successful authentication, a JWT token is generated with the user's role embedded
4. The token is stored in the browser's localStorage
5. Protected routes verify this token before granting access

## Development Notes

### Environment Variables

The following environment variables should be configured in `.env.local`:

```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
JWT_SECRET=your_secure_jwt_secret
```

### Authentication Library

The authentication functionality is implemented in `src/lib/auth.ts`, which provides:

- `isAuthenticated()`: Checks if the current user is authenticated and has admin role
- `login(identifier, password)`: Authenticates a user with email or username and password
- `logout()`: Removes authentication tokens
- `getToken()`: Retrieves the current authentication token

## Troubleshooting Authentication Issues

If you encounter problems logging in, please contact the system administrator.

### Common Issues

- **Connection issues**: Verify your network connection and try again later
- **Account status**: Your account might be inactive or require verification
- **Permission issues**: Ensure your account has the required admin privileges
- **Browser problems**: Try clearing your browser cache and cookies

## Security Best Practices

1. **Password Security**: Always use strong, unique passwords
2. **JWT Secret**: Use a strong, unique JWT_SECRET for production deployments
3. **Token Expiration**: Admin tokens expire after 24 hours by default
4. **HTTPS**: Always serve the admin dashboard over HTTPS in production
5. **Audit Logging**: Important actions are logged for security auditing

## Folder Structure

```
bnusa-admin/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── dashboard/        # Admin dashboard pages
│   │   ├── users/            # User management pages 
│   │   ├── articles/         # Article management pages
│   │   ├── settings/         # Settings pages
│   │   ├── login/            # Authentication pages
│   │   └── layout.tsx        # Main layout
│   ├── components/           # Reusable components
│   ├── lib/                  # Utility functions and hooks
│   ├── styles/               # Global styles
│   └── types/                # TypeScript type declarations
├── public/                   # Static assets
└── ...config files
```

## License

This project is licensed under the MIT License. 