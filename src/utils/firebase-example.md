# Firebase Authentication Setup for Bnusa

This guide explains how to set up Firebase authentication for the Bnusa application.

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the steps to create a new project
3. Once your project is created, add a web app to it by clicking the web icon

## 2. Get Firebase Configuration

1. After adding a web app, you'll see configuration details:
2. Copy this information and add it to your environment variables:

Create or update a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 3. Enable Authentication Methods

1. In the Firebase Console, navigate to "Authentication" and then "Sign-in method"
2. Enable the authentication methods you want to use:
   - Email/Password
   - Google
   - (Optional) Other providers like Facebook, Twitter, etc.

## 4. Test Authentication Flow

The authentication flow is already set up in the application. You can test it by:

1. Opening `/signup` to create a new account
2. Opening `/signin` to sign in with an existing account
3. Opening `/dashboard` which is a protected route that requires authentication

## 5. Firebase Security Rules

If you're using Firestore or Storage, make sure to set up appropriate security rules:

### Firestore Example Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    match /articles/{articleId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Example Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profiles/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /content/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 6. Additional Tips

- Keep your Firebase API keys in environment variables
- Use Firebase Authentication with Firestore for managing user data
- Consider adding Firebase Analytics to track user behavior
- For server-side operations, use Firebase Admin SDK

Enjoy building with Firebase Authentication! 