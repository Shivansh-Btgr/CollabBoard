
FROM node:18-alpine

# Set the working directory in the Docker container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the current directory contents into the container at /app
COPY . .

# Make port 3000 available to the outside world
EXPOSE 3000

# Run the application when the docker is launched
CMD [ "npm", "run", "dev" ]