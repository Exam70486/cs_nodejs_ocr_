# ─── Node.js + OpenCV (pre-built) + Tesseract OCR ────────────────────────────
FROM node:20-bullseye

WORKDIR /app

# 1. Install system OpenCV 4.x libs + Tesseract (no compilation needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopencv-dev \
    tesseract-ocr \
    tesseract-ocr-eng \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 2. Tell opencv4nodejs to use the system OpenCV instead of building from source
ENV OPENCV4NODEJS_DISABLE_AUTOBUILD=1
ENV LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu

# 3. Copy package files and install (no --build-from-source, just node-gyp binding)
COPY package.json package-lock.json* ./
RUN npm ci

# 4. Copy source
COPY . .

# 5. Non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && chown -R appuser:appuser /app
USER appuser

ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]