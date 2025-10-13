# CommentBox

<p align="center">
  <a href="https://reactjs.org/" target="_blank">
    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="50" alt="React"/>
  </a>
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="50" alt="NestJS"/>
  </a>
  <a href="https://www.docker.com/" target="_blank">
    <img src="https://www.docker.com/sites/default/files/d8/2019-07/Moby-logo.png" width="50" alt="Docker"/>
  </a>
  <a href="https://www.postgresql.org/" target="_blank">
    <img src="https://www.postgresql.org/media/img/about/press/elephant.png" width="50" alt="PostgreSQL"/>
  </a>
</p>

## Key Features
- Registration and login with bcrypt, Passport, JWT, cookies, and refresh tokens
- Custom captcha verification during registration
- Login attempt limit (3 attempts); after that, captcha is required
- Comments displayed in a tree structure (configurable via `MAX_INDENT_LEVEL` in Comment.tsx)
- Ability to edit, delete, and reply to comments (parentID -> childID)
- Attach photos, videos, and files with restrictions:
  - Images: 320x240
  - Files: up to 100 KB
  - Videos: up to 50 MB
  - All limits and supported types configurable in CommentForm.tsx (`MAX_CHARACTERS`, `MAX_VIDEO_SIZE`, `MAX_ATTACHMENT_SIZE`, `SUPPORTED_VIDEO_TYPES`, `SUPPORTED_ATTACHMENT_TYPES`)
- Media stored via Cloudinary
- Update user avatars in profile with real-time updates for comments and avatars via GraphQL
- Search and filter comments using ElasticSearch
- Fully responsive and adaptive design for different devices
- The database uses PostgreSQL with docker-compose, and the container image is recorded in the backend/docker-compose.yml file.

## Project Structure
- `backend/` – NestJS server
- `frontend/` – React client

## Installation and Setup

### Backend
1. Navigate to the backend directory:
```bash
cd backend
```
2. Install dependencies:
```bash
npm install
```
3. Start Docker Compose to run PostgreSQL:
```bash
docker-compose up
```
4. Start the backend server in development mode:
```bash
npm run start:dev
```

### Frontend
1. Navigate to the frontend directory:
```bash
cd frontend
```
2. Install dependencies:
```bash
npm install
```
3. Start the frontend:
```bash
npm start
```

Open http://localhost:3000 to view the app in the browser.

# Testing

### Backend
npm run test       # Run unit tests
npm run test:e2e   # Run e2e tests
npm run test:cov   # Run test coverage

### Frontend
npm test

# Production Build

### Backend
npm run build
npm run start:prod

### Frontend
npm run build


# Resources
- [React Documentation](https://reactjs.org/)
- [NestJS Documentation](https://docs.nestjs.com)

# Contributing
1. Fork the repository
2. Make your changes
3. Submit a pull request

# Contact
Email: naviseized09@gmail.com