FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose port
EXPOSE 5000

# Set environment variables
ENV DB_HOST=mysql
ENV DB_USER=root
ENV DB_PASSWORD=Password
ENV DB_NAME=ecommerce
ENV JWT_SECRET=mike1234
ENV JWT_EXPIRES_IN=1h

# Start backend
CMD ["npm", "start"]

