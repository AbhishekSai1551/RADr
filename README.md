
# Proximity - Location-Based Social Network

Proximity is a modern social networking application that connects people based on their geographical location, shared interests, and professional goals. The application helps users discover and connect with like-minded individuals in their area.

## Features

### 1. Location-Based Discovery
- Interactive map interface for discovering nearby users
- Real-time location updates
- City-based user search
- Manual location setting for testing and privacy

### 2. Social Zones
- Create and join social gathering zones
- Organize meetups and events
- Set participant limits
- View zones on an interactive map

### 3. Real-Time Communication
- Instant messaging between connected users
- Real-time notifications
- Chat history preservation
- Read receipts

### 4. User Profiles
- Customizable user profiles
- Professional information display
- Interest tagging system
- Profile picture and cover image support

### 5. Interest-Based Matching
- Connect with users sharing similar interests
- Interest categories and tags
- Professional networking opportunities
- Interest-based filtering

### 6. Security Features
- Secure authentication system
- Location privacy controls
- Connection request system
- Profile visibility settings

## Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: Socket.IO
- **Maps Integration**: Google Maps API
- **Authentication**: Session-based auth with Express

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the development server: `npm run dev`

The application will be available at `http://localhost:5000`

## Environment Variables

The following environment variables are required:

- `GOOGLE_MAPS_API_KEY`: API key for Google Maps integration
- `DATABASE_URL`: PostgreSQL database connection string
- `SESSION_SECRET`: Secret key for session management

## License

MIT License
