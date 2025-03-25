FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose frontend port
EXPOSE 3000

# Load environment variables from .env file
ENV REACT_APP_API_BASE_URL=http://backend:5000

CMD ["npm", "start"]

