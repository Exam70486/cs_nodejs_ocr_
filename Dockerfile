FROM node:20

# 1. Install system C/C++ dependencies for node-canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# 2. Install dependencies & rebuild node-canvas binaries
RUN npm install

COPY . .

EXPOSE 10000

CMD ["node", "index.js"]