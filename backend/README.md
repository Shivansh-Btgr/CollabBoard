# CollabBoard Backend (FastAPI)

This is the FastAPI backend for the CollabBoard collaborative board application. It has been migrated from the original Go server while maintaining full compatibility with the existing frontend.

## Features

- **RESTful API**: Complete REST API for user, board, and post management
- **WebSocket Support**: Real-time collaboration via WebSocket connections
- **JWT Authentication**: Secure token-based authentication
- **PostgreSQL Database**: Robust data persistence with SQLAlchemy ORM
- **CORS Support**: Configured for frontend integration
- **Request Logging**: Comprehensive logging for debugging and monitoring

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration and settings
│   ├── database.py          # Database connection and session management
│   ├── models/              # SQLAlchemy database models
│   │   ├── user.py
│   │   ├── board.py
│   │   └── post.py
│   ├── schemas/             # Pydantic schemas for validation
│   │   ├── user.py
│   │   ├── board.py
│   │   ├── post.py
│   │   └── auth.py
│   ├── routes/              # API route handlers
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── board.py
│   │   └── post.py
│   ├── middleware/          # Custom middleware
│   │   ├── auth.py          # JWT authentication
│   │   └── logging.py       # Request logging
│   ├── utils/               # Utility functions
│   │   ├── jwt.py           # JWT token management
│   │   └── password.py      # Password hashing
│   └── ws/                  # WebSocket implementation
│       ├── types.py         # WebSocket message types
│       ├── hub.py           # Connection hub management
│       └── manager.py       # WebSocket event handlers
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email and password

### Users
- `POST /users` - Create new user account
- `GET /users/me` - Get current authenticated user (requires auth)

### Boards
- `GET /boards` - Get all boards (owned and shared) (requires auth)
- `GET /boards/{boardId}` - Get specific board with members (requires auth)
- `POST /boards` - Create new board (requires auth)

### Posts
- `GET /posts?boardId={boardId}` - Get all posts for a board (requires auth)

### WebSocket
- `WS /ws` - WebSocket endpoint for real-time collaboration

## WebSocket Events

### Client → Server
- `user.authenticate` - Authenticate user with JWT
- `board.connect` - Connect to a board
- `post.create` - Create a new post
- `post.update` - Update an existing post
- `post.delete` - Delete a post
- `post.focus` - Indicate user is editing a post

### Server → Client
- Same events with success/error responses and result data

## Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- pip or poetry

### Installation

1. **Clone the repository** (if not already done)
   ```bash
   cd boards/backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=boards
   DB_USER=postgres
   DB_PASSWORD=your_password

   JWT_SECRET_KEY=your-secret-key-here
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION=24

   CORS_ORIGINS=http://localhost:3000
   ```

4. **Run database migrations**
   The application will automatically create tables on startup using SQLAlchemy.

5. **Start the server**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
   ```

   Or use Python directly:
   ```bash
   python -m app.main
   ```

## Docker Setup

### Using Docker Compose (Recommended)

From the project root:
```bash
docker-compose up --build
```

This will start:
- Backend (FastAPI) on port 8080
- Frontend (Next.js) on port 3000
- PostgreSQL database on port 5432

### Building Docker Image

```bash
docker build -t collabboard-backend .
docker run -p 8080:8080 --env-file .env collabboard-backend
```

## Development

### Running in Development Mode
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### API Documentation
Once the server is running, access:
- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

### Testing WebSocket Connection
You can test the WebSocket connection using a WebSocket client or the frontend application.

## Migration from Go Server

This FastAPI backend is a complete migration from the original Go server with the following improvements:

### Maintained Features
- All REST API endpoints with identical request/response formats
- WebSocket real-time collaboration with same event structure
- JWT authentication with same token format
- Database schema (unchanged)
- CORS configuration
- Request logging

### Implementation Differences
- **Framework**: FastAPI instead of Go/Chi
- **ORM**: SQLAlchemy instead of SQLC
- **Validation**: Pydantic instead of go-playground/validator
- **WebSocket**: Native FastAPI WebSocket instead of Gorilla WebSocket
- **Password Hashing**: Passlib/bcrypt (compatible with Go's bcrypt)

### Benefits of FastAPI
- Automatic API documentation (Swagger/OpenAPI)
- Built-in request/response validation
- Async/await support for better performance
- Type hints throughout
- Easier to extend and maintain
- Rich ecosystem of Python libraries

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | boards |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET_KEY` | Secret key for JWT signing | - |
| `JWT_ALGORITHM` | JWT algorithm | HS256 |
| `JWT_EXPIRATION` | JWT expiration in hours | 24 |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | http://localhost:3000 |

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if the database exists: `psql -U postgres -c "CREATE DATABASE boards;"`

### Import Errors
- Make sure all dependencies are installed: `pip install -r requirements.txt`
- Verify Python version: `python --version` (should be 3.11+)

### WebSocket Connection Failures
- Check that the frontend is configured to connect to `ws://localhost:8080/ws`
- Verify JWT token is being sent correctly in authentication event
- Check browser console for WebSocket errors

### CORS Issues
- Ensure frontend URL is in `CORS_ORIGINS` environment variable
- Check browser console for CORS errors

## License

This project is part of the CollabBoard application.
