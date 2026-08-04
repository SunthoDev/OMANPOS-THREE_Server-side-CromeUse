FROM node:20-slim

# Install Chromium and necessary dependencies
# 'chromium-driver' is added for completeness, and 'libappindicator3-1' is restored.
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm-dev \
    libgbm-dev \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Puppeteer Chromium Path (This line is correct)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
# Use 'npm ci' for reliable builds in CI/CD, but 'npm install' is fine too.
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]