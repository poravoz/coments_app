FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/

RUN cd backend && npm install --legacy-peer-deps --include=dev

COPY backend/ ./backend/

RUN cd backend && npm run build

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "run", "start:prod"]