# Frontend - Taller Sistema Distribuido

Este es el frontend del proyecto, construido con las últimas tecnologías y siguiendo las mejores prácticas de arquitectura.

## Stack Tecnológico

- **React 19.1**: Última versión estable con mejoras en concurrencia y hooks.
- **Tailwind CSS 4.1**: Motor de estilos de última generación (CSS-first).
- **TypeScript**: Tipado estático para un desarrollo robusto.
- **Vite**: Bundler ultra rápido.

## Estructura de Directorios

La estructura sigue un patrón de **Clean Architecture** y modularidad:

- `src/assets/`: Recursos estáticos (imágenes, estilos globales, fuentes).
- `src/components/`: Componentes reutilizables.
  - `common/`: Componentes básicos (botones, inputs, etc).
  - `layout/`: Componentes de estructura (navbar, footer).
- `src/hooks/`: Hooks personalizados para lógica de estado.
- `src/pages/`: Componentes de página (vistas principales).
- `src/services/`: Capa de comunicación con APIs y servicios externos.
- `src/store/`: Gestión de estado global (Context API o librerías).
- `src/types/`: Definiciones de interfaces y tipos TypeScript.
- `src/utils/`: Funciones de utilidad y constantes.

## Instalación y Uso

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. (Opcional) Configurar URL de la API. Por defecto usa `http://localhost:3000`. Crear `.env` local (no se sube al repo) con:
   ```
   VITE_API_URL=http://localhost:3000
   ```

3. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

4. Construir para producción:
   ```bash
   npm run build
   ```
