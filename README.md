# Aurum

Generador automatizado de señales de trading impulsado por IA que analiza datos de criptomonedas desde Hyperliquid usando indicadores técnicos y Claude AI para producir recomendaciones cada 4 horas.

![Dashboard Preview](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white) ![AI](https://img.shields.io/badge/AI-Claude%20Sonnet%204-purple)

## Características

- **Señales de trading automatizadas** generadas cada 4 horas con IA
- **Análisis técnico completo**: SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic, PSAR
- **AI-powered**: Claude Sonnet 4 analiza indicadores y genera señales (BUY/SELL/HOLD)
- **Múltiples criptomonedas**: BTC, ETH, SOL, y más
- **Historial de señales**: Backtesting y análisis de rendimiento
- **Arquitectura serverless**: Cron job automatizado sin servidores que mantener
- **Costos ultra-bajos**: ~$1-2/mes con servicios gratuitos

## Demo

🔗 [Ver demo en vivo](https://aurum.vercel.app) _(próximamente)_

## Arquitectura

```
Cron Job (GitHub Actions)
    ↓ (cada 4 horas)
API Serverless (/api/analyze-signals)
    ↓
Hyperliquid API → Candles → Indicadores → TOON Format
    ↓
Claude AI → Análisis → Trading Signal
    ↓
Supabase (PostgreSQL)
    ↓
Frontend (React + TanStack Query)
```

### Flujo automático

1. **Cron job** se ejecuta cada 4 horas (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
2. **Backend** obtiene 100 velas de Hyperliquid y las guarda en Supabase
3. **Indicadores técnicos** se calculan (RSI, MACD, SMA, EMA, etc.)
4. **Formato TOON** comprime los datos para enviar a la IA
5. **Claude AI** analiza y genera señal (BUY/SELL/HOLD + confianza + razonamiento)
6. **Señal guardada** en base de datos con timestamp y metadata
7. **Frontend** muestra señales actualizadas automáticamente

## Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **State/Cache** | TanStack Query (React Query) |
| **UI/Estilos** | Tailwind CSS, Tremor React |
| **Backend** | Vercel Serverless Functions |
| **AI** | Claude Sonnet 4 (Anthropic API) |
| **Data Format** | TOON (compressed JSON for LLMs) |
| **Base de datos** | Supabase (PostgreSQL) |
| **API de datos** | Hyperliquid REST API |
| **Indicadores** | indicatorts + custom calculations |
| **Cron** | GitHub Actions (gratis) |
| **Deploy** | Vercel (CI/CD automático) |

## Instalación

### Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis)
- Cuenta en [Anthropic](https://console.anthropic.com) (API de Claude)
- Repositorio en GitHub (para cron job gratuito)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/aurum.git
cd aurum
npm install
```

### 2. Configurar Supabase

#### a) Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. En el SQL Editor, ejecuta `supabase/schema.sql` (tabla candles)
3. Ejecuta `supabase/schema-signals.sql` (tabla trading_signals)
4. Configura RLS policies para seguridad

#### b) Obtener credenciales

En Supabase → Settings → API:
- Copia `Project URL` → será tu `SUPABASE_URL`
- Copia `anon` `public` key → será tu `SUPABASE_ANON_KEY`
- Copia `service_role` key → será tu `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (no compartir)

### 3. Obtener API Key de Anthropic

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una API key
3. Añade créditos (mínimo $5, durará meses)
4. Copia la key → será tu `ANTHROPIC_API_KEY`

### 4. Variables de entorno

#### Para desarrollo local

Crea `.env` en la raíz:

```bash
# Frontend
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Backend (para vercel dev)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
ANTHROPIC_API_KEY=sk-ant-tu-key-aqui
```

#### Para producción (Vercel)

En Vercel Dashboard → Settings → Environment Variables, agrega:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 5. Ejecutar en desarrollo

```bash
# Solo frontend (lee señales de Supabase)
npm run dev

# Frontend + API serverless (recomendado para testing)
vercel dev

# Probar endpoint de análisis manualmente
curl -X POST http://localhost:3000/api/analyze-signals \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["BTC"], "interval": "4h", "limit": 100}'
```

Abre http://localhost:3000 (vercel dev) o http://localhost:5173 (npm run dev)

### 6. Configurar Cron Job Automatizado

#### Opción 1: GitHub Actions (GRATIS, recomendado)

1. Crea `.github/workflows/trading-signals.yml`:

```yaml
name: Generate Trading Signals

on:
  schedule:
    - cron: '0 */4 * * *'  # Cada 4 horas
  workflow_dispatch:  # Permitir ejecución manual

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger analysis
        run: |
          curl -X POST https://tu-app.vercel.app/api/analyze-signals \
            -H "Content-Type: application/json" \
            -d '{"symbols": ["BTC", "ETH", "SOL"], "interval": "4h", "limit": 100}'
```

2. Commit y push a GitHub
3. Ve a tu repo → Actions → verifica que esté activo
4. Puedes ejecutar manualmente desde "Run workflow"

#### Opción 2: cron-job.org (GRATIS, alternativa)

1. Crea cuenta en [cron-job.org](https://cron-job.org)
2. New Cron Job:
   - URL: `https://tu-app.vercel.app/api/analyze-signals`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body: `{"symbols": ["BTC", "ETH", "SOL"], "interval": "4h", "limit": 100}`
   - Schedule: `0 */4 * * *`

### 7. Deploy a producción

```bash
# Con Vercel CLI
vercel --prod

# O conecta tu repo de GitHub a Vercel para deploy automático
```

## Uso

### Símbolos disponibles

BTC, ETH, SOL, AVAX, ARB, MATIC, DOGE, LINK

### Intervalos recomendados

- **4h**: Ideal para swing trading, señales más estables
- **1d**: Ideal para análisis de tendencias a largo plazo
- También soporta: 1m, 5m, 15m, 1h

### Tipos de señales

| Señal | Significado | Ejemplo de condiciones |
|-------|-------------|------------------------|
| **STRONG_BUY** | Compra fuerte | RSI < 30, tendencia alcista, MACD cruce positivo |
| **BUY** | Compra moderada | RSI < 50, precio sobre SMA 20 |
| **HOLD** | Mantener | Señales mixtas o sin claridad |
| **SELL** | Venta moderada | RSI > 50, precio bajo SMA 20 |
| **STRONG_SELL** | Venta fuerte | RSI > 70, tendencia bajista, MACD cruce negativo |

### Indicadores técnicos

- **SMA 20/50**: Medias móviles simples (tendencia)
- **EMA 12/26**: Medias móviles exponenciales (momentum)
- **RSI**: Índice de fuerza relativa (sobrecompra/sobreventa)
- **MACD**: Convergencia/divergencia de medias (cruces de señal)
- **Bollinger Bands**: Bandas de volatilidad
- **Stochastic**: Oscilador estocástico
- **Parabolic SAR**: Stop and Reverse (puntos de reversión)
- **ATR**: Average True Range (volatilidad)

## Estructura del proyecto

```
aurum/
├── api/
│   ├── candles.ts              # (Deprecated)
│   └── analyze-signals.ts      # Pipeline principal de IA
│
├── src/
│   ├── components/
│   │   ├── CandlestickChart.tsx
│   │   └── TradingSignalCard.tsx
│   │
│   ├── hooks/
│   │   └── useTradingSignals.ts   # TanStack Query hooks
│   │
│   ├── services/
│   │   ├── signals.ts             # Queries de señales
│   │   └── indicators.ts          # Cálculos técnicos
│   │
│   └── types/
│       └── database.ts            # Tipos TypeScript
│
├── supabase/
│   ├── schema.sql                 # Tabla candles
│   └── schema-signals.sql         # Tabla trading_signals
│
├── .github/
│   └── workflows/
│       └── trading-signals.yml    # Cron job automatizado
│
└── CLAUDE.md                      # Documentación técnica completa
```

## API

### POST /api/analyze-signals

Endpoint principal que ejecuta todo el pipeline de análisis.

**Request:**
```json
{
  "symbols": ["BTC", "ETH", "SOL"],
  "interval": "4h",
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "signals": [
    {
      "symbol": "BTC",
      "signal": "BUY",
      "confidence": 75.5,
      "ai_reasoning": "Strong uptrend with RSI not overbought. MACD shows bullish momentum.",
      "indicators_data": {
        "rsi": [45.2, 47.1, 48.5],
        "sma_20": [42000, 42500, 43000],
        "macd": { "MACD": [120], "signal": [100], "histogram": [20] }
      },
      "processing_time_ms": 3450
    }
  ],
  "processing_time_ms": 5200
}
```

## Seguridad

- **RLS (Row Level Security)** en Supabase - lectura pública, escritura restringida
- Frontend usa `anon key` (solo SELECT)
- Backend usa `service_role key` (INSERT/UPDATE/DELETE)
- `ANTHROPIC_API_KEY` nunca se expone al cliente
- Validación de inputs en todos los endpoints
- Rate limiting implícito (cron cada 4h)

## Costos

| Servicio | Costo mensual |
|----------|---------------|
| Supabase Free Tier | $0 |
| Vercel Hobby | $0 |
| GitHub Actions | $0 (2000 min/mes) |
| Anthropic API | ~$1-2 (540 requests/mes) |
| **TOTAL** | **~$1-2/mes** |

**Desglose**:
- 6 ejecuciones/día × 30 días = 180 ejecuciones/mes
- 3 símbolos por ejecución = 540 análisis/mes
- Claude Sonnet 4: ~$0.003 por request (varía según tokens)

## Monitoreo

### Ver logs de cron (GitHub Actions)
- Repo → Actions → "Generate Trading Signals"
- Historial de ejecuciones con timestamps

### Ver logs del backend (Vercel)
- Vercel Dashboard → tu proyecto → Functions → `/api/analyze-signals`
- Logs en tiempo real con errores y tiempos de respuesta

### Ver señales en Supabase
```sql
-- Últimas 10 señales
SELECT * FROM trading_signals
ORDER BY created_at DESC
LIMIT 10;

-- Señales de BTC
SELECT * FROM trading_signals
WHERE symbol = 'BTC'
ORDER BY created_at DESC;

-- Distribución de señales
SELECT signal, COUNT(*)
FROM trading_signals
GROUP BY signal;
```

## Roadmap

- [x] Pipeline básico de análisis con IA
- [x] Cron job automatizado cada 4h
- [x] Indicadores técnicos (SMA, EMA, RSI, MACD)
- [ ] Frontend para visualizar señales
- [ ] Gráficos interactivos con señales marcadas
- [ ] Backtesting de señales pasadas
- [ ] Notificaciones (email/Telegram) cuando hay señales STRONG_BUY/STRONG_SELL
- [ ] Más símbolos (top 20 cryptos)
- [ ] Análisis de sentimiento (Twitter/Reddit)
- [ ] Portfolio tracking
- [ ] Exportar historial a CSV

## Troubleshooting

### Cron job no ejecuta
- Verifica GitHub Actions está activo en tu repo
- Revisa el formato del cron expression
- Asegúrate que el workflow está en `main` branch

### API retorna error
- Verifica variables de entorno en Vercel
- Revisa logs en Vercel Functions
- Comprueba que `ANTHROPIC_API_KEY` tiene créditos

### No aparecen señales en frontend
- Ejecuta el cron manualmente primero
- Verifica tabla `trading_signals` en Supabase
- Revisa consola del navegador para errores

### Señales de baja calidad
- Aumenta el número de velas analizadas (`limit`)
- Ajusta el prompt en `/api/analyze-signals.ts`
- Revisa el razonamiento en `ai_reasoning` column

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

**Áreas donde puedes contribuir**:
- Mejorar prompts de IA para señales más precisas
- Añadir nuevos indicadores técnicos
- Crear visualizaciones de backtest
- Optimizar formato TOON para reducir tokens
- Documentación y tutoriales

## Licencia

[MIT](LICENSE)

## Disclaimer

⚠️ **IMPORTANTE**: Este proyecto es solo para fines educativos. Las señales de trading generadas por IA no deben considerarse asesoramiento financiero. Siempre haz tu propia investigación (DYOR) antes de tomar decisiones de inversión. El trading de criptomonedas conlleva riesgos significativos.

## Contacto

Tu Nombre - [@tu_twitter](https://twitter.com/tu_twitter)

Link del proyecto: [https://github.com/tu-usuario/aurum](https://github.com/tu-usuario/aurum)

## Agradecimientos

- [Anthropic](https://anthropic.com) por Claude AI
- [Hyperliquid](https://hyperliquid.xyz) por la API de datos
- [Supabase](https://supabase.com) por el backend
- [Vercel](https://vercel.com) por el hosting
- [Tremor](https://tremor.so) por los componentes UI
- [indicatorts](https://github.com/cinar/indicatorts) por los indicadores técnicos
- [TOON Format](https://github.com/toon-format/toon) por la compresión de datos

---

⭐ Si este proyecto te resultó útil, considera darle una estrella en GitHub