# Bnusa Frontend - Coolify Deployment Quick Start

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
   - Set build context to the `bnusa` directory

4. **Configure environment variables**:
   - Set up the required environment variables as listed in `.env.example`
   - At minimum, configure:
     ```
     NODE_ENV=production
     NEXT_PUBLIC_API_URL=http://your-api-url/api
     ```

5. **Deploy**:
   - Click "Deploy" and wait for the build to complete
   - Access your application at the provided URL

## Testing the Deployment

1. Visit the URL provided by Coolify
2. Verify that the homepage loads correctly
3. Test basic functionality like navigation and user authentication

## Common Issues

- **Build fails**: Check if your VPS has enough resources
- **API connection issues**: Verify that `NEXT_PUBLIC_API_URL` points to your backend
- **Image loading problems**: Ensure B2 bucket configuration is correct

## Need Help?

Refer to the detailed [COOLIFY_GUIDE.md](./COOLIFY_GUIDE.md) for more information. 