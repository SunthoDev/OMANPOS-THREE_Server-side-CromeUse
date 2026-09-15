FROM node:20-slim


# 1. Fontconfig ইনস্টল
RUN apt-get update && apt-get install -y fontconfig && rm -rf /var/lib/apt/lists/*

# 2. ফন্ট ফাইল কপি
RUN mkdir -p /usr/share/fonts/truetype/calibri
COPY assets/Calibribold.woff /usr/share/fonts/truetype/calibri/Calibri.woff

# 3. Linux-কে Calibri ফন্ট নাম বাধ্য করার জন্য Fontconfig Alias যোগ করা
RUN mkdir -p /etc/fonts/conf.d/
RUN echo '<?xml version="1.0"?>\n\
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n\
<fontconfig>\n\
  <match target="pattern">\n\
    <test qual="any" name="family"><string>Calibri</string></test>\n\
    <edit name="family" mode="assign" binding="same"><string>CustomCalibri</string></edit>\n\
  </match>\n\
  <selectfont>\n\
    <acceptfont>\n\
      <pattern>\n\
        <patelt name="family"><string>CustomCalibri</string></patelt>\n\
      </pattern>\n\
    </acceptfont>\n\
  </selectfont>\n\
</fontconfig>' > /etc/fonts/conf.d/99-calibri-alias.conf

# 4. ফন্ট ক্যাশ রিফ্রেশ
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