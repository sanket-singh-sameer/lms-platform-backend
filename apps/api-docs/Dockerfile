FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .



FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app ./
RUN npm install
EXPOSE 3001
CMD ["npm", "start", "--", "--port", "8080"]