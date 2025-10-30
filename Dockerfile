# 빌드용
FROM node:20-alpine AS builder
WORKDIR /var/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 런타임용
FROM node:20-alpine
WORKDIR /var/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /var/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]