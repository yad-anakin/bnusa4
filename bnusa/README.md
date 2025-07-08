# Bunsa - Kurdish Knowledge Platform

Bunsa is an interactive knowledge-sharing platform designed for the Kurdish Sorani community. The platform provides a space for writers to share articles on science, history, art, and other intellectual topics, fostering a community of knowledge exchange.

![Bunsa Platform](public/images/placeholders/hero-primary.png)

## 🌟 Features

- **Responsive Design**: Works seamlessly on devices of all sizes
- **Interactive UI**: Modern and engaging user interface
- **Accessibility**: Support for high contrast mode, font size adjustments, and reduced motion
- **Writer Profiles**: Dedicated space for writers to showcase their work
- **Article Publishing**: Platform for publishing and reading articles
- **Multi-language Support**: Primarily focused on Kurdish Sorani content

## 🔧 Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Accessibility**: Custom theme context for accessibility settings
- **Animations**: CSS animations with reduced motion support
- **Image Handling**: Custom image component with fallbacks
- **Asset Generation**: Custom placeholder generation for development

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bnusa.git
   cd bnusa
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Generate placeholder images (optional):
   ```bash
   node scripts/generate-placeholders.js
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
bnusa/
├── public/               # Static assets
│   └── images/           # Images used throughout the site
│       └── placeholders/ # Generated placeholder images
├── scripts/              # Utility scripts
├── src/                  # Source code
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable UI components
│   └── utils/            # Utility functions and context providers
└── ...                   # Config files
```

## 🧩 Components

### Core Components
- **Navbar**: Navigation bar with responsive design and mobile menu
- **Footer**: Site footer with links and credits
- **HeroSection**: Main showcase section on the home page
- **ArticleCard**: Card component for displaying article previews
- **WriterCard**: Card for showing writer profiles
- **ImageWithFallback**: Enhanced image component with fallback support
- **AccessibilitySettings**: Component for managing accessibility preferences

### Utility Functions
- **ThemeContext**: Context provider for managing accessibility settings
- **placeholderImage**: Utility functions for generating placeholder images
- **animations**: Animation utility functions and variants

## 🌈 Accessibility Features

Bunsa prioritizes accessibility with the following features:

- **High Contrast Mode**: Enhanced color contrast for users with visual impairments
- **Font Size Adjustment**: Users can increase or decrease text size
- **Reduced Motion**: Option to minimize animations for users sensitive to motion
- **Keyboard Navigation**: Full keyboard support for navigation
- **Screen Reader Compatibility**: Semantic HTML and ARIA attributes
- **Focus Indicators**: Clear visual indicators for keyboard focus

## 📝 Development Workflow

### Running Locally
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Generating Placeholder Images
```bash
node scripts/generate-placeholders.js
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- All contributors and supporters of the Kurdish knowledge community

## Backblaze B2 Integration

This project uses Backblaze B2 for image storage. We've implemented a robust integration that handles:

- Image uploads for profiles, articles, and content
- Secure file deletion
- Folder organization
- Authentication and caching

For detailed setup and usage instructions, see the [B2 Integration Guide](./BACKBLAZE-B2-README.md).

## Testing

### Testing the B2 Integration

We've included several scripts to test the B2 integration:

```bash
# Check your B2 configuration
npm run check:b2

# Test basic authentication
npm run b2:direct

# Test file upload
npm run test:b2:native

# Test complete image upload/delete flow
npm run test:image
```

## Deployment

1. Build the Next.js application
```bash
npm run build
```

2. Start the server
```bash
npm start
```

For production deployment, consider using a process manager like PM2.

## Authentication System

This application uses a hybrid authentication system:

- **Firebase Authentication**: Handles user signup, signin, and password management
- **MongoDB**: Stores all user profiles and application data
- **Integration**: Firebase UIDs are stored in MongoDB to link the accounts

### Key Features

- Secure authentication with Firebase
- Token-based API access
- MongoDB storage for user data and content
- Profile image uploads through Backblaze B2
- Support for email/password and Google authentication methods

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5003

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Service Account (for backend)
FIREBASE_SERVICE_ACCOUNT_TYPE=service_account
FIREBASE_SERVICE_ACCOUNT_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n
FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_SERVICE_ACCOUNT_CLIENT_ID=your-client-id
FIREBASE_SERVICE_ACCOUNT_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_SERVICE_ACCOUNT_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxx%40your-project-id.iam.gserviceaccount.com

# Backblaze B2 Configuration
B2_KEY_ID=your-key-id
B2_APP_KEY=your-app-key
B2_BUCKET_NAME=your-bucket-name
B2_ENDPOINT=your-endpoint
B2_REGION=your-region
B2_PUBLIC_URL=your-public-url
```

## Documentation

Detailed documentation is available in the following files:

- [Firebase + MongoDB Integration](./FIREBASE-MONGODB-INTEGRATION.md)
- [Firebase Setup Guide](./FIREBASE-SETUP.md)
- [Backblaze B2 Integration](./BACKBLAZE-B2-README.md)

## Running the Application

```bash
# Run the Next.js frontend and API server
npm run dev

# Run only the API server
npm run server

# Run with automatic reload (development)
npm run dev:server
```

## Testing

```bash
# Run tests
npm test

# Test Backblaze B2 configuration
npm run check:b2

# Test B2 image upload
npm run test:image
```

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

For production deployment, consider using a process manager like PM2.
