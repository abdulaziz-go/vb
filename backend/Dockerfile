# Use Node.js 20 alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Create storage directory for uploads
RUN mkdir -p storage/uploads

# Expose the internal port (3000 as per server.js)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
