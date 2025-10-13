FROM node:18-alpine AS backend

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY backend/ ./
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=backend /app/backend/dist ./dist
COPY --from=backend /app/backend/node_modules ./node_modules
COPY --from=backend /app/backend/package.json ./

RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "dist/main"]