# CollabBoard - Real-Time Collaborative Whiteboard

A full-stack collaborative whiteboard application with real-time synchronization, voice chat, and board sharing capabilities.

## Features

### 🎨 Real-Time Collaboration
- **Live Post Updates**: See changes instantly as team members add, edit, move, or delete posts
- **Drag-and-Drop**: Smooth drag-and-drop interface with live position updates visible to all users
- **Text Synchronization**: Real-time text content updates with typing indicators
- **Color Coordination**: 5 color themes for visual organization
- **User Presence**: See who's online and what they're editing

### 🎤 Voice Chat
- **Peer-to-Peer Audio**: WebRTC-based voice communication
- **Join/Leave Anytime**: Flexible voice channel participation
- **Mute Controls**: Individual mute/unmute with broadcast to other users
- **Audio Indicators**: Visual feedback showing who's speaking and who's muted
- **Multi-User Support**: Supports 2-8 concurrent voice users

### 📤 Board Sharing
- **Share Codes**: Generate 8-character codes to share boards
- **Import Boards**: Join shared boards by entering a share code
- **Member Management**: View all board members and their online status
- **Access Control**: Board owners and invited members only

### 💾 Export & Organization
- **PNG Export**: Download boards as high-quality PNG images
- **Post Management**: Create posts via double-click or button
- **Z-Index Control**: Automatic layering for overlapping posts
- **Board Organization**: Personal dashboard to manage all your boards

### 🔐 Authentication & Users
- **User Accounts**: Secure registration and login with JWT authentication
- **Guest Access**: Quick start with temporary guest accounts
- **Profile Customization**: 8 unique avatar styles and display names
- **Session Management**: Persistent login with secure token storage

## Tech Stack

### Frontend
- **Next.js 15.5.3**: React framework with App Router
- **TypeScript**: Type-safe development
- **React DnD**: Drag-and-drop interface
- **WebRTC**: Peer-to-peer voice chat
- **html2canvas**: Board export functionality
- **Tailwind CSS + DaisyUI**: Modern, responsive UI
- **React Hot Toast**: User notifications

### Backend
- **FastAPI**: High-performance async Python framework
- **PostgreSQL**: Robust relational database
- **SQLAlchemy ORM**: Type-safe database operations
- **WebSockets**: Real-time bidirectional communication
- **Pydantic**: Data validation and settings management
- **JWT**: Secure authentication
- **bcrypt**: Password hashing

### Infrastructure
- **Docker & Docker Compose**: Containerized deployment
- **GitHub**: Version control
- **CORS**: Secure cross-origin requests

## Project Structure

```
boards/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   │   └── dnd/        # Drag-and-drop components
│   │   ├── hooks/           # Custom React hooks (WebSocket, Voice Chat)
│   │   ├── api/             # API client functions
│   │   ├── ws/              # WebSocket event definitions
│   │   └── constants/       # App constants and configuration
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── backend/                  # FastAPI backend application
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API endpoints
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── middleware/      # Auth and logging middleware
│   │   ├── ws/              # WebSocket manager and handlers
│   │   └── utils/           # JWT and password utilities
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
└── docker-compose.yml        # Multi-container setup
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- (Or) Node.js 18+, Python 3.11+, PostgreSQL 15+

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd boards
   ```

2. **Set up environment files**
   ```bash
   # Frontend
   cp frontend/.env.example frontend/.env
   
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env and set JWT_SECRET_KEY and DB_PASSWORD
   ```

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - API Docs: http://localhost:8080/docs

### Option 2: Local Development

#### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

4. **Create database**
   ```bash
   psql -U postgres -c "CREATE DATABASE boards;"
   ```

5. **Start the server**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment** (optional)
   ```bash
   cp .env.example .env
   # Edit if you're not using localhost:8080 for backend
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## Usage Guide

### Getting Started
1. **Sign up** or use **Guest Login** for quick access
2. **Create a board** from your dashboard
3. **Double-click** on the canvas to create a post
4. **Drag posts** to reposition them
5. **Click a post** to edit its content
6. **Select colors** from the palette to organize posts

### Sharing Boards
1. Click the **Share** button on any board
2. Copy the **8-character share code**
3. Share the code with collaborators
4. They can click **Import Board** and enter the code

### Voice Chat
1. Click **Join Voice** in the sidebar
2. Allow microphone access when prompted
3. Click **Mute/Unmute** to control your audio
4. See audio indicators next to users who are speaking
5. Click **Leave Voice** when done

### Exporting Boards
1. Click the **Export** button (download icon)
2. Board will be saved as a PNG image
3. All posts and their positions are preserved

## WebSocket Events

The application uses 12 WebSocket events for real-time features:

### Core Events
- `user.authenticate` - Authenticate with JWT token
- `board.connect` - Join a board and get connected users
- `board.disconnect` - Leave a board

### Post Events
- `post.create` - Create a new post
- `post.update` - Update post content, color, or position
- `post.delete` - Delete a post
- `post.focus` - Indicate user is editing a post
- `post.drag` - Broadcast live drag position (50ms intervals)

### Voice Chat Events
- `voice.offer` - Send WebRTC offer to peer
- `voice.answer` - Send WebRTC answer to peer
- `voice.ice_candidate` - Exchange ICE candidates
- `voice.mute` - Broadcast mute status

## API Documentation

Once the backend is running, access the interactive API documentation:
- **Swagger UI**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

## Environment Variables

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boards
DB_USER=postgres
DB_PASSWORD=your-password

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION=24

# CORS
CORS_ORIGINS=http://localhost:3000
```

## Production Deployment

### Backend
1. Set a strong `JWT_SECRET_KEY`
2. Use a managed PostgreSQL database
3. Update `CORS_ORIGINS` with your frontend domain
4. Use environment variables for all secrets
5. Enable HTTPS (wss:// for WebSockets)
6. Consider using a reverse proxy (nginx, Caddy)

### Frontend
1. Update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`
2. Build for production: `npm run build`
3. Use a production STUN/TURN server for WebRTC
4. Enable HTTPS
5. Configure proper CORS headers

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### WebSocket Connection Issues
- Ensure backend is running on the correct port
- Check CORS configuration
- Verify JWT token is valid
- Check browser console for errors

### Voice Chat Not Working
- Allow microphone access in browser
- Check WebRTC peer connections in browser DevTools
- Ensure STUN servers are accessible
- Try refreshing the page

### Database Connection Failed
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `CREATE DATABASE boards;`

### Docker Build Failures
- Clear Docker cache: `docker-compose down -v`
- Rebuild: `docker-compose up --build`
- Check Docker logs: `docker-compose logs`


**Built with ❤️ using Next.js, FastAPI, and WebRTC**
