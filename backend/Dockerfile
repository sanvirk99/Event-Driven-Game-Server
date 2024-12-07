FROM node:23.1.0

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install the project dependencies
RUN npm install

# Copy the entire application files to the working directory
COPY . .

# Command to run the WebSocket server when the container starts
CMD ["node", "index.js"]