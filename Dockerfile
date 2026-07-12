# ─── Node.js + OpenCV + Tesseract OCR ────────────────────────────────────────
# opencv4nodejs compiles native C++ bindings, so we need build tools.
# We use a Debian-based image (not Alpine) because OpenCV build requires
# many system libs that are painful to get on Alpine.

FROM node:20-bullseye AS builder

WORKDIR /app

# System dependencies needed to compile opencv4nodejs native bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    libgtk2.0-dev \
    pkg-config \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first (layer cache)
COPY package.json package-lock.json* ./

# Install all dependencies (opencv4nodejs will compile OpenCV here — takes a while)
RUN npm ci --build-from-source

# Copy the rest of the source
COPY . .

# ─── Runtime image ────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS runner

WORKDIR /app

# Runtime system libs needed by OpenCV and Tesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk2.0-0 \
    libavcodec58 \
    libavformat58 \
    libswscale5 \
    libjpeg62-turbo \
    libpng16-16 \
    libtiff5 \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy app + compiled node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# eng.traineddata is already in the repo root — Tesseract.js uses it directly
# (system tesseract-ocr-eng above covers the native tesseract if used)

RUN chown -R appuser:appuser /app
USER appuser

# Render injects $PORT at runtime
ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]