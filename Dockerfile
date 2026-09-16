FROM node:20-slim


# ১. Linux Font Engine ইনস্টল
RUN apt-get update && apt-get install -y fontconfig && rm -rf /var/lib/apt/lists/*

# ২. ডকার ওএস ডিরেক্টরিতে ফোল্ডার তৈরি
RUN mkdir -p /usr/share/fonts/truetype/calibri

# ৩. আপনার প্রজেক্টের assets ফোল্ডারের আসল নামের ফাইল কন্টেইনারে কপি
COPY assets/Calibribold.woff /usr/share/fonts/truetype/calibri/Calibri.woff

# ৪. পারমিশন সেট করা
RUN chmod 644 /usr/share/fonts/truetype/calibri/*

# ৫. Linux Fontconfig XML Alias Rule (Calibri পাওয়ামাত্র আপনার WOFF ফাইলটি চিনবে)
RUN mkdir -p /etc/fonts/conf.d/
RUN echo '<?xml version="1.0"?>\n\
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n\
<fontconfig>\n\
  <match target="pattern">\n\
    <test qual="any" name="family"><string>Calibri</string></test>\n\
    <edit name="family" mode="assign" binding="same"><string>Calibribold</string></edit>\n\
  </match>\n\
</fontconfig>' > /etc/fonts/conf.d/99-calibri-alias.conf

# ৬. ফন্ট ক্যাশ রিফ্রেশ
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