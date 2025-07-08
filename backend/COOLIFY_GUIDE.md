# Deploying Bnusa Backend with Coolify

This guide explains how to deploy the Bnusa Backend API on a VPS using Coolify.

## Prerequisites

1. A VPS with Coolify installed
2. Access to your Coolify dashboard
3. Git repository access for this project
4. MongoDB instance (either Atlas or self-hosted)

## Deployment Steps

### 1. Create a New Service in Coolify

1. Log in to your Coolify dashboard
2. Click on "Create New Resource"
3. Select "Application"
4. Choose "Docker" as the deployment method

### 2. Configure the Source

1. Connect your Git repository
2. Select the branch you want to deploy (usually `main` or `master`)
3. Set the build context to the `backend` directory (where the Dockerfile is located)

### 3. Configure Build Settings

1. Dockerfile path: `./Dockerfile`
2. Build command will be automatically detected from the Dockerfile
3. Port: `5003`

### 4. Environment Variables

Create the following environment variables in Coolify:

```
NODE_ENV=production
PORT=5003
MONGODB_URI=mongodb://username:password@host:port/database
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

For AWS/Backblaze B2 storage:

```
B2_BUCKET_NAME=bnusa-images
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_ACCESS_KEY_ID=your-access-key
B2_SECRET_ACCESS_KEY=your-secret-key
```

For security (optional but recommended):

```
JWT_SECRET=your-jwt-secret
IP_WHITELIST=your-frontend-server-ip,your-admin-server-ip
```

### 5. Deploy

1. Click "Deploy" to start the build process
2. Coolify will build the Docker image and deploy the container
3. Once deployment is complete, your backend API will be accessible at the URL provided by Coolify

### 6. Verify Deployment

1. Access the health check endpoint: `https://your-api-url/api/health`
2. Verify that the response shows the API is running and connected to MongoDB

### 7. Configure Frontend and Admin Panel

Update the frontend and admin panel environment variables to point to your new backend API:

```
NEXT_PUBLIC_API_URL=https://your-api-url/api
```

### 8. Security Considerations

1. Set up IP restrictions in Coolify to limit access to your backend API
2. Configure a firewall on your VPS to only allow necessary connections
3. Use HTTPS for all communications
4. Consider setting up a reverse proxy with additional authentication

## Troubleshooting

- If the build fails, check the build logs for errors
- If MongoDB connection fails, verify your connection string and network settings
- Check the health endpoint for detailed status information
- Review server logs in Coolify for any runtime errors

## Updating the Application

To update the application:

1. Push changes to your Git repository
2. Go to the application in Coolify
3. Click "Redeploy" to build and deploy the latest version 