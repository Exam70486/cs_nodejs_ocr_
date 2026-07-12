# ─── Node.js + Tesseract OCR (opencv via WASM, no native build) ──────────────
FROM node:20-bullseye

WORKDIR /app

# System deps for Tesseract and native sharp/canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libvips-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Skip ALL native post-install scripts (avoids opencv4nodejs C++ build entirely).
# opencv.js (WebAssembly) in your package.json handles OpenCV in JS — no native needed.
ENV OPENCV4NODEJS_DISABLE_AUTOBUILD=1
ENV npm_config_ignore_scripts=true

COPY package.json package-lock.json* ./

# Install deps without running any native build scripts
RUN npm ci --ignore-scripts

# Re-run only the scripts for packages that actually need them (sharp, etc.)
# but NOT opencv4nodejs
RUN node -e "require('sharp')" 2>/dev/null || npm rebuild sharp --update-binary || true

COPY . .

RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && chown -R appuser:appuser /app
USER appuser

ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]