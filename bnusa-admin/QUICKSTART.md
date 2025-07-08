# Bnusa Admin Frontend - Coolify Deployment Quick Start

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
   - Set build context to the `bnusa-admin` directory

4. **Configure environment variables**:
   - Set up the required environment variables as listed in `env.example`
   - At minimum, configure:
     ```
     NODE_ENV=production
     NEXT_PUBLIC_API_URL=http://your-api-url/api
     NEXT_PUBLIC_JWT_SECRET=your-jwt-secret
     ```

5. **Deploy**:
   - Click "Deploy" and wait for the build to complete
   - Access your application at the provided URL

## Security Considerations

Since this is an admin panel:
- Set up IP restrictions if possible
- Use a strong password
- Enable HTTPS
- Consider adding a reverse proxy with additional authentication

## Testing the Deployment

1. Visit the URL provided by Coolify
2. Log in with your admin credentials
3. Verify that you can access all admin functions

## Common Issues

- **Build fails**: Check if your VPS has enough resources
- **API connection issues**: Verify that `NEXT_PUBLIC_API_URL` points to your backend
- **Authentication problems**: Check that your JWT secret is correctly set

## Need Help?

Refer to the detailed [COOLIFY_GUIDE.md](./COOLIFY_GUIDE.md) for more information. 