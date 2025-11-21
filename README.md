# Aurum

Dashboard financiero para visualizar datos OHLCV de criptomonedas desde Hyperliquid con indicadores técnicos en tiempo real.

![Dashboard Preview](https://img.shields.io/badge/Estado-Activo-green) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

## Características

- **Datos en tiempo real** de Hyperliquid (BTC, ETH, SOL, y más)
- **Indicadores técnicos**: SMA, EMA, RSI, MACD, Bollinger Bands, ATR
- **Múltiples intervalos**: 1m, 5m, 15m, 1h, 4h, 1d, etc.
- **Cache inteligente** con Supabase (reduce llamadas a la API)
- **Arquitectura serverless** (sin servidores que mantener)
- **Diseño responsive** con Tremor React

## Demo

🔗 [Ver demo en vivo](https://aurum.vercel.app)

## Arquitectura

```
Frontend (React + Vite)
    ↓
API Serverless (Vercel)
    ↓
Supabase (Cache PostgreSQL)
    ↓
Hyperliquid API
```

### Flujo de datos

1. El usuario abre la aplicación
2. Se verifica si hay datos en cache (Supabase)
3. Si el cache está vacío o desactualizado (>1h) → se llama a la API serverless
4. La API obtiene datos de Hyperliquid y los guarda en Supabase
5. El frontend lee los datos actualizados y calcula indicadores
6. Fallback directo a Hyperliquid si la API falla

## Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI/Estilos** | Tailwind CSS, Tremor React |
| **Backend** | Vercel Serverless Functions |
| **Base de datos** | Supabase (PostgreSQL) |
| **API de datos** | Hyperliquid REST API |
| **Indicadores** | indicatorts |
| **Deploy** | Vercel (CI/CD automático) |

## Instalación

### Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com) (opcional, para deploy)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/aurum.git
cd aurum
npm install
```

### 2. Configurar Supabase

#### a) Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. En el SQL Editor, ejecuta `supabase/schema.sql` para crear la tabla
3. Ejecuta `supabase/rls-policies.sql` para configurar seguridad
4. Configura el cron job diario (ver sección Configuración)

#### b) Obtener credenciales

En Supabase → Settings → API:
- Copia `Project URL` → será tu `SUPABASE_URL`
- Copia `anon` `public` key → será tu `SUPABASE_ANON_KEY`
- Copia `service_role` key → será tu `SUPABASE_SERVICE_ROLE_KEY`

### 3. Variables de entorno

#### Para desarrollo local

Crea `.env` en la raíz:

```bash
# Frontend
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Backend (para vercel dev)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

#### Para producción (Vercel)

En Vercel Dashboard → Settings → Environment Variables, agrega:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. Ejecutar en desarrollo

```bash
# Solo frontend (la API dará error, usa fallback directo)
npm run dev

# Frontend + API serverless (recomendado)
vercel dev
```

Abre http://localhost:3000 (vercel dev) o http://localhost:5173 (npm run dev)

### 5. Deploy a producción

```bash
# Con Vercel CLI
vercel --prod

# O conecta tu repo de GitHub a Vercel para deploy automático
```

## Configuración

### Cron job en Supabase (limpiar cache diario)

En Supabase Dashboard → Database → Cron Jobs, ejecuta:

```sql
SELECT cron.schedule(
  'cleanup-old-candles',
  '0 0 * * *',
  'DELETE FROM candles'
);
```

Esto borra todos los datos a las 00:00 cada día.

### Cache automático (opcional)

Por defecto, el cache se llena cuando un usuario abre la app. Para pre-llenar automáticamente:

**Opción 1: Cron externo (gratis)**

1. Crea cuenta en [cron-job.org](https://cron-job.org)
2. Configura un cron job:
   - URL: `https://tu-app.vercel.app/api/candles`
   - Método: POST
   - Body: `{"symbol": "BTC", "interval": "1h", "limit": 100}`
   - Schedule: Diario a las 00:05

**Opción 2: Vercel Cron (requiere plan PRO)**

Crea `vercel.json` en la raíz con el contenido apropiado (ver documentación de Vercel).

## Uso

### Símbolos disponibles

BTC, ETH, SOL, AVAX, ARB, MATIC, DOGE, LINK

### Intervalos disponibles

1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 12h, 1d, 3d, 1w, 1M

### Indicadores técnicos

- **SMA**: Media móvil simple
- **EMA**: Media móvil exponencial
- **RSI**: Índice de fuerza relativa
- **MACD**: Convergencia/divergencia de medias móviles
- **Bollinger Bands**: Bandas de Bollinger
- **ATR**: Rango verdadero promedio

## Estructura del proyecto

```
aurum/
├── api/
│   └── candles.ts              # API serverless
├── src/
│   ├── components/             # Componentes React
│   ├── hooks/                  # Custom hooks
│   ├── services/               # Lógica de negocio
│   │   ├── candles.ts          # Queries a Supabase
│   │   ├── dataService.ts      # Orquestador de datos
│   │   ├── hyperliquid.ts      # API Hyperliquid
│   │   └── indicators.ts       # Indicadores técnicos
│   └── types/                  # Tipos TypeScript
├── supabase/
│   ├── schema.sql              # Schema de la DB
│   └── rls-policies.sql        # Políticas de seguridad
└── CLAUDE.md                   # Documentación técnica completa
```

## API

### POST /api/candles

Obtiene velas de Hyperliquid y las guarda en cache.

**Request:**
```json
{
  "symbol": "BTC",
  "interval": "1h",
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "count": 100,
  "symbol": "BTC",
  "interval": "1h"
}
```

## Seguridad

- **RLS (Row Level Security)** configurado en Supabase
- Frontend usa `anon key` (solo lectura)
- Backend usa `service_role key` (lectura/escritura)
- La `service_role key` nunca se expone al cliente
- Validación de inputs en el API endpoint

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Roadmap

- [ ] Más símbolos soportados
- [ ] Alertas de precio
- [ ] Exportar datos a CSV
- [ ] Temas dark/light
- [ ] Comparación de múltiples símbolos
- [ ] Más indicadores técnicos

## Problemas conocidos

Ver [Issues](https://github.com/tu-usuario/aurum/issues) para bugs conocidos y features solicitadas.

## Licencia

[MIT](LICENSE)

## Contacto

Tu Nombre - [@tu_twitter](https://twitter.com/tu_twitter)

Link del proyecto: [https://github.com/tu-usuario/aurum](https://github.com/tu-usuario/aurum)

## Agradecimientos

- [Hyperliquid](https://hyperliquid.xyz) por la API de datos
- [Supabase](https://supabase.com) por el backend
- [Vercel](https://vercel.com) por el hosting
- [Tremor](https://tremor.so) por los componentes UI
- [indicatorts](https://github.com/cinar/indicatorts) por los indicadores técnicos

---

⭐ Si este proyecto te resultó útil, considera darle una estrella en GitHub
