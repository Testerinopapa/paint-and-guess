FROM node:20-slim

# Install dependencies for downloading and extracting Stockfish
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    tar \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Set environment variable to skip postinstall Stockfish download
# (we'll download it in the Dockerfile instead)
ENV SKIP_STOCKFISH_DOWNLOAD=true

# Install Node.js dependencies
RUN npm ci

# Download and install Stockfish binary
# Using hardcoded version for reliability (sf_17.1)
RUN mkdir -p /app/stockfish && \
    cd /app/stockfish && \
    wget -q https://github.com/official-stockfish/Stockfish/releases/download/sf_17.1/stockfish-ubuntu-x86-64-avx2.tar && \
    tar -xf stockfish-ubuntu-x86-64-avx2.tar && \
    rm stockfish-ubuntu-x86-64-avx2.tar && \
    (mv stockfish-ubuntu-x86-64-avx2 stockfish 2>/dev/null || \
     find . -maxdepth 1 -name "stockfish*" -type f ! -name "*.tar" ! -name "*.txt" -exec mv {} stockfish \; || \
     find . -maxdepth 1 -type f -executable -exec mv {} stockfish \;) && \
    chmod +x stockfish && \
    test -f stockfish && test -x stockfish && \
    echo "Stockfish binary installed successfully:" && \
    ls -lh stockfish

# Copy application code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Expose port
EXPOSE 3001

# Run migrations and start server
CMD ["sh", "-c", "npm run prisma:migrate && npm run start"]

