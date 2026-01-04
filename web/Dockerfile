# STAGE 1: Build
FROM node:24-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Vite app
RUN npm run build

# STAGE 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built React app to Nginx's serve directory
# Note: Vite usually builds to 'dist', not 'build'
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config (we will create this below)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]