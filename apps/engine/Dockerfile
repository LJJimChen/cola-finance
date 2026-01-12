# Use the official Node.js 20 runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if available)
COPY package.json pnpm-lock.yaml* ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Install Playwright browsers (needed for the engine service)
RUN pnpm exec playwright install chromium

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run the application
CMD ["pnpm", "start"]