FROM node:18-alpine

# Instalar dependências necessárias para o Puppeteer no Alpine
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Configurar variáveis de ambiente para o Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./

# Instalar todas as dependências, incluindo as de desenvolvimento
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]