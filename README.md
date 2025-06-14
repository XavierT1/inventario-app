# Inventario App

Sistema profesional de control de inventario multibodega, con soporte para productos fraccionados, movimientos, transferencias, reportes en PDF y gestión de usuarios.

## 🚀 Tecnologías principales

- **React** + **TypeScript**
- **Vite**
- **Zustand** (estado global)
- **TanStack React Query** (fetching/caché)
- **Supabase** (backend, base de datos y auth)
- **Styled Components**
- **Atomic Design**
- **jsPDF + jsPDF-AutoTable** (PDF)

## 📦 Instalación y configuración

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/XavierT1/inventario-app.git
   cd inventario-app
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   - Crea un archivo `.env` en la raíz con:
     ```
     VITE_SUPABASE_URL=TU_URL_SUPABASE
     VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
     ```

4. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

5. **Abre la app en tu navegador:**
   - Normalmente en [http://localhost:5173](http://localhost:5173)

## 🗂️ Estructura de carpetas

```
inventario-app/
├── src/
│   ├── components/
│   │   ├── atoms/
│   │   ├── organisms/
│   │   └── pages/
│   ├── services/
│   ├── store/
│   ├── styles/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── .env
└── ...
```

## 🧩 Funcionalidades principales

- **Gestión de bodegas** (blanca/oscura, múltiples ubicaciones)
- **Gestión de productos** (fraccionados y normales)
- **Inventario por bodega** (stock y fracciones)
- **Movimientos del Kardex** (entradas/salidas, validación de stock)
- **Transferencias entre bodegas** (con actualización automática de inventario)
- **Gestión de categorías, personal y empresa**
- **Exportación de reportes a PDF** en todos los módulos principales
- **Autenticación de usuarios** (Supabase Auth)

## 📄 Exportación a PDF

Cada módulo principal tiene un botón "Exportar a PDF" que genera un reporte profesional del estado actual de la tabla mostrada.

## 👤 Manual de usuario (resumido)

- **Login:** Ingresa con tu usuario registrado en Supabase.
- **Navegación:** Usa el menú lateral para acceder a cada módulo.
- **Bodegas:** Crea, edita y elimina bodegas.
- **Productos:** Crea productos, define si son fraccionables y su cantidad por empaque.
- **Inventario:** Consulta el stock por bodega.
- **Kardex:** Registra movimientos de entrada/salida.
- **Transferencias:** Mueve productos entre bodegas.
- **PDF:** Exporta cualquier listado a PDF con un clic.

## 👨‍💻 Manual de programador (resumido)

- **React + TypeScript** con Atomic Design.
- **Zustand** para estado global (auth, usuario).
- **React Query** para fetching y sincronización de datos.
- **Supabase** como backend y base de datos.
- **Styled Components** para estilos.
- **jsPDF** para reportes.
- **Fácil de extender:** Agrega nuevos módulos en `src/components/pages/`.

## 📝 Licencia

MIT

---

**Repositorio:**  
[https://github.com/XavierT1/inventario-app](https://github.com/XavierT1/inventario-app)
