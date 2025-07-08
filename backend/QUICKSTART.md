# Bnusa Backend API - Coolify Deployment Quick Start

## Quick Setup Steps

1. **Install Coolify on your VPS**:
   - Follow the [official Coolify installation guide](https://coolify.io/docs/installation/vps)
   - Recommended VPS specs: 2GB RAM, 2 vCPUs, 20GB SSD

2. **Connect your Git repository**:
   - In Coolify dashboard, go to "Sources" and connect your Git provider
   - Select the repository containing this project

3. **Create a new application**:
   - Click "Create Resource" > "Application"
   - Select "Docker" as the deployment method
   - Choose your connected Git repository
   - Set build context to the `backend` directory

4. **Configure environment variables**:
   - Set up the required environment variables as listed in `env.example`
   - At minimum, configure:
     ```
     NODE_ENV=production
     PORT=5003
     MONGODB_URI=mongodb://username:password@host:port/database
     CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
     ```

5. **Deploy**:
   - Click "Deploy" and wait for the build to complete
   - Access your API at the provided URL

## Testing the Deployment

1. Visit `https://your-api-url/api/health` to verify the API is running
2. Check that it reports a successful connection to MongoDB
3. Update your frontend and admin panel to use this API URL

## Common Issues

- **MongoDB connection fails**: Check your connection string and network settings
- **CORS errors**: Ensure your frontend domain is included in CORS_ALLOWED_ORIGINS
- **Build fails**: Check if your VPS has enough resources

## Need Help?

Refer to the detailed [COOLIFY_GUIDE.md](./COOLIFY_GUIDE.md) for more information. 