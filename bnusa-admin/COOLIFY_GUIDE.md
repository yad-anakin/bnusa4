# Deploying Bnusa Admin Frontend with Coolify

This guide explains how to deploy the Bnusa Admin frontend application on a VPS using Coolify.

## Prerequisites

1. A VPS with Coolify installed
2. Access to your Coolify dashboard
3. Git repository access for this project

## Deployment Steps

### 1. Create a New Service in Coolify

1. Log in to your Coolify dashboard
2. Click on "Create New Resource"
3. Select "Application"
4. Choose "Docker" as the deployment method

### 2. Configure the Source

1. Connect your Git repository
2. Select the branch you want to deploy (usually `main` or `master`)
3. Set the build context to the `bnusa-admin` directory (where the Dockerfile is located)

### 3. Configure Build Settings

1. Dockerfile path: `./Dockerfile`
2. Build command will be automatically detected from the Dockerfile
3. Port: `3003`

### 4. Environment Variables

Create the following environment variables in Coolify:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://your-api-url/api
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret
```

If your admin panel connects directly to MongoDB, also add:

```
MONGODB_URI=mongodb://username:password@host:port/database
MONGODB_DB=bnusa
```

### 5. Deploy

1. Click "Deploy" to start the build process
2. Coolify will build the Docker image and deploy the container
3. Once deployment is complete, your admin frontend will be accessible at the URL provided by Coolify

### 6. Security Considerations

Since this is an admin panel, consider:

1. Setting up IP restrictions in Coolify to limit access
2. Enabling 2FA if available
3. Using a strong password for admin access
4. Setting up a reverse proxy with additional authentication

### 7. Custom Domain (Optional)

1. Go to the "Settings" tab of your deployed application
2. Add your custom domain (e.g., admin.yourdomain.com)
3. Configure DNS settings as instructed by Coolify
4. Enable HTTPS (strongly recommended for admin panels)

## Troubleshooting

- If the build fails, check the build logs for errors
- Ensure all required environment variables are set
- Verify that your VPS has enough resources (CPU, RAM, disk space)
- If you encounter ESLint errors, they are bypassed in the build process with the `--no-lint` flag

## Updating the Application

To update the application:

1. Push changes to your Git repository
2. Go to the application in Coolify
3. Click "Redeploy" to build and deploy the latest version 