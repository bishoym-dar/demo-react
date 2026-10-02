FROM node:22-alpine

# Create app directory
WORKDIR /app

# Add node_modules binaries to PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install dependencies first (package-lock or package.json)
COPY package*.json ./
RUN npm ci --silent

# Copy app sources
COPY . .

# Expose Vite default dev port
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
