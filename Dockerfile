FROM node:20-slim


# ১. Linux Font Engine ইনস্টল
RUN apt-get update && apt-get install -y fontconfig && rm -rf /var/lib/apt/lists/*

# ২. ডকারের সিস্টেমে জেনেরিক Calibri নামে ফোল্ডার তৈরি
RUN mkdir -p /usr/share/fonts/truetype/calibri

# ৩. প্রজেক্টের assets ফোল্ডারের ফাইলকে OS Level "Calibri" নাম দিয়ে কপি
COPY assets/Calibribold.woff /usr/share/fonts/truetype/calibri/Calibri.woff

# ৪. ফন্ট ক্যাশ রিফ্রেশ
RUN fc-cache -f -v



  

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