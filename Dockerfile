FROM node:18.19.0

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (if needed)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
