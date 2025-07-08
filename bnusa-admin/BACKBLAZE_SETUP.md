# Backblaze B2 Setup for Bnusa Platform

This document explains how to set up Backblaze B2 for image and file storage in the Bnusa Platform.

## 1. Create a Backblaze B2 Account

If you don't already have one, sign up for a Backblaze B2 account at https://www.backblaze.com/b2/sign-up.html.

## 2. Create a Bucket

1. Log in to your Backblaze B2 account
2. Go to the "Buckets" section
3. Click "Create a Bucket"
4. Name your bucket (e.g., "bnusa-images")
5. Set bucket privacy to "Public"
6. Click "Create a Bucket"

## 3. Create an Application Key

1. Go to the "App Keys" section
2. Click "Add a New Application Key"
3. Give your key a name (e.g., "bnusa-upload-key")
4. Select the bucket you created
5. Set the permissions to:
   - Read and Write files
   - List all bucket names
   - List files in buckets
6. Click "Create New Key"
7. **IMPORTANT**: Save the "keyID" and "applicationKey" values - you will only see them once!

## 4. Configure Environment Variables

Create a `.env.local` file in the root of both the `bnusa-admin` and `bnusa` projects with the following variables:

```
# Backblaze B2 Configuration
B2_KEY_ID=your_key_id_from_step_3
B2_APP_KEY=your_application_key_from_step_3
B2_BUCKET_NAME=your_bucket_name_from_step_2
```

## 5. Update next.config.js

The `next.config.js` file in the `bnusa` project should already be configured to allow images from Backblaze B2. Make sure it includes the following configuration:

```javascript
images: {
  domains: ['localhost'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'f005.backblazeb2.com',
      pathname: '/file/bnusa-images/**',
    },
    {
      protocol: 'https',
      hostname: 'bnusa-images.s3.us-east-005.backblazeb2.com',
      pathname: '/**',
    },
  ],
},
```

## 6. Testing the Setup

1. Start both the admin and frontend applications
2. Log in to the admin panel
3. Try to upload a book with an image
4. Check if the image URL in the database starts with the Backblaze B2 URL
5. Verify that the image displays correctly on the frontend

## Troubleshooting

If you encounter issues:

1. Check the browser console for error messages
2. Verify that the environment variables are set correctly
3. Ensure that your Backblaze B2 bucket is set to public
4. Check that the image URL in the database matches the format expected by the frontend
5. Verify that the `next.config.js` file has the correct domain configuration 