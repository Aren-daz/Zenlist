FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create database directory and initialize
RUN mkdir -p /app/prisma
RUN npx prisma db push --accept-data-loss

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 