FROM node:18-slim

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source
COPY frontend/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
