FROM node:23.1.0

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install the project dependencies
RUN npm install

# Copy the entire application files to the working directory
COPY . .
# Copy the mvp-frontend directory to be a sibling of the app directory
COPY ../mvp-frontend /mvp-frontend

# test then run node
CMD ["sh", "-c", "npm run test && node index.js"]