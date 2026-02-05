# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json tsconfig.json ./

# Instalar dependencias (incluyendo devDependencies)
RUN npm install

# Copiar el código fuente
COPY . .

# Compilar el proyecto
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Establecer entorno de producción
ENV NODE_ENV=production

# Copiar package.json para instalar solo dependencias de producción
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar los archivos compilados del stage anterior
COPY --from=builder /app/dist ./dist

# Comando de inicio
CMD ["node", "dist/index.js"]
