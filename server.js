const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Caché en memoria del servidor con TTL (15 minutos)
const serverCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

// Telemetría del servidor
const serverStats = {
  startTime: Date.now(),
  totalRequests: 0,
  apiHits: 0,
  cacheHits: 0,
  articleExtractions: 0
};

// Middleware para JSON y CORS básico
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Helper para limpiar entradas expiradas de la caché
 */
function cleanupExpiredCache() {
  const now = Date.now();
  for (const [key, item] of serverCache.entries()) {
    if (now > item.expiresAt) {
      serverCache.delete(key);
    }
  }
}
setInterval(cleanupExpiredCache, 5 * 60 * 1000);

/**
 * GET /api/health
 * Estado de configuración, telemetría y salud del backend V2
 */
app.get('/api/health', (req, res) => {
  const hasApiKey = Boolean(process.env.NEWSDATA_API_KEY && process.env.NEWSDATA_API_KEY.trim() !== '');
  const uptimeSeconds = Math.floor((Date.now() - serverStats.startTime) / 1000);

  res.json({
    status: 'ok',
    version: '2.0.0-PRO',
    service: 'AURUM NEWS V2 — The Gold Standard in Global Journalism',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    hasApiKey,
    cacheEntries: serverCache.size,
    stats: {
      totalRequests: serverStats.totalRequests,
      apiHits: serverStats.apiHits,
      cacheHits: serverStats.cacheHits,
      articleExtractions: serverStats.articleExtractions,
      cacheHitRate: serverStats.totalRequests > 0 
        ? ((serverStats.cacheHits / serverStats.totalRequests) * 100).toFixed(1) + '%' 
        : '0%'
    }
  });
});

/**
 * GET /api/article-full
 * Extrae el contenido completo y real de la noticia original para el modal
 */
app.get('/api/article-full', async (req, res) => {
  serverStats.totalRequests++;
  serverStats.articleExtractions++;

  const { url } = req.query;

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ status: 'error', message: 'URL válida requerida' });
  }

  const cacheKey = `article_full_v2_${url}`;
  if (serverCache.has(cacheKey)) {
    const entry = serverCache.get(cacheKey);
    if (Date.now() < entry.expiresAt) {
      serverStats.cacheHits++;
      return res.json({ ...entry.data, cached: true });
    }
    serverCache.delete(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.json({
        status: 'partial',
        message: 'No se pudo obtener el cuerpo completo directamente del sitio de origen.',
        paragraphs: []
      });
    }

    const html = await response.text();

    // Extracción limpia de párrafos significativos
    const sanitizedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');

    // Buscar párrafos dentro del cuerpo
    const pMatches = sanitizedHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const paragraphs = [];

    for (const rawP of pMatches) {
      const cleanP = rawP
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim();

      if (
        cleanP.length > 55 &&
        !cleanP.toLowerCase().includes('cookie') &&
        !cleanP.toLowerCase().includes('suscríbete') &&
        !cleanP.toLowerCase().includes('todos los derechos reservados') &&
        !cleanP.toLowerCase().includes('javascript')
      ) {
        paragraphs.push(cleanP);
      }
    }

    // Extraer autor
    const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["'](.*?)["']/i) ||
                        html.match(/<meta\s+property=["']article:author["']\s+content=["'](.*?)["']/i);
    const author = authorMatch ? authorMatch[1].trim() : null;

    const resultData = {
      status: 'success',
      url,
      author,
      paragraphCount: paragraphs.length,
      paragraphs: paragraphs.slice(0, 18),
      wordCount: paragraphs.reduce((acc, p) => acc + p.split(/\s+/).length, 0)
    };

    serverCache.set(cacheKey, {
      data: resultData,
      createdAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return res.json(resultData);

  } catch (error) {
    return res.json({
      status: 'partial',
      message: 'Extracción parcial debido a protecciones o restricciones del sitio web de origen.',
      paragraphs: [],
      error: error.message
    });
  }
});

/**
 * GET /api/news
 * Proxy seguro para NewsData.io V2 con soporte para orden y filtros
 */
app.get('/api/news', async (req, res) => {
  serverStats.totalRequests++;

  try {
    const apiKey = process.env.NEWSDATA_API_KEY;
    const { category, q, country, language, image, page } = req.query;

    const cacheKey = JSON.stringify({
      category: category || 'top',
      q: q || '',
      country: country || '',
      language: language || 'es',
      image: image || '1',
      page: page || ''
    });

    if (serverCache.has(cacheKey)) {
      const cachedEntry = serverCache.get(cacheKey);
      if (Date.now() < cachedEntry.expiresAt) {
        serverStats.cacheHits++;
        return res.json({
          ...cachedEntry.data,
          cached: true,
          cacheAgeMs: Date.now() - cachedEntry.createdAt
        });
      } else {
        serverCache.delete(cacheKey);
      }
    }

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('TU_API_KEY_AQUI')) {
      return res.status(200).json({
        status: 'demo_mode',
        version: '2.0.0-PRO',
        message: 'Modo demostración activo. Configure NEWSDATA_API_KEY en su archivo .env para consultar la API en vivo.',
        totalResults: 0,
        results: [],
        nextPage: null,
        demo: true
      });
    }

    serverStats.apiHits++;

    const targetUrl = new URL('https://newsdata.io/api/1/latest');
    targetUrl.searchParams.set('apikey', apiKey.trim());

    if (category && category !== 'all') {
      targetUrl.searchParams.set('category', category);
    }
    if (q && q.trim() !== '') {
      targetUrl.searchParams.set('q', q.trim());
    }
    if (country && country.trim() !== '' && country !== 'all') {
      targetUrl.searchParams.set('country', country.trim());
    }
    if (language && language.trim() !== '' && language !== 'all') {
      targetUrl.searchParams.set('language', language.trim());
    }
    if (image === '1' || image === 'true') {
      targetUrl.searchParams.set('image', '1');
    }
    if (page && page.trim() !== '') {
      targetUrl.searchParams.set('page', page.trim());
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const apiResponse = await fetch(targetUrl.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PortalNoticiasGold-V2/2.0'
      }
    });
    clearTimeout(timeoutId);

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      const status = apiResponse.status;
      let errorMsg = 'Error al comunicarse con NewsData.io';

      if (status === 401) {
        errorMsg = 'API Key no válida o no autorizada en NewsData.io. Verifique su credencial en .env.';
      } else if (status === 403) {
        errorMsg = 'Acceso prohibido. Es posible que el parámetro solicitado no esté disponible en su plan de NewsData.io.';
      } else if (status === 422) {
        errorMsg = 'Parámetros de consulta no válidos enviados a NewsData.io.';
      } else if (status === 429) {
        errorMsg = 'Límite de peticiones de cuota alcanzado (Rate Limit de NewsData.io excedido). Intente en unos minutos o use datos en caché.';
      } else if (status >= 500) {
        errorMsg = 'El servidor remoto de NewsData.io experimenta problemas temporales. Intente nuevamente más tarde.';
      }

      return res.status(status).json({
        status: 'error',
        code: status,
        message: errorMsg,
        details: data.results?.message || data.message || null
      });
    }

    if (data.status === 'success' && Array.isArray(data.results)) {
      serverCache.set(cacheKey, {
        data,
        createdAt: Date.now(),
        expiresAt: Date.now() + CACHE_TTL_MS
      });
    }

    return res.json({
      ...data,
      cached: false
    });

  } catch (error) {
    console.error('Error en /api/news V2:', error.message);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        status: 'error',
        code: 504,
        message: 'Tiempo de espera agotado al conectar con NewsData.io (Timeout).'
      });
    }

    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Error interno en el proxy del servidor de noticias V2.',
      details: error.message
    });
  }
});

// Redireccionar rutas no encontradas al index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor local
app.listen(PORT, () => {
  console.log(`\n===============================================================`);
  console.log(`✨ AURUM NEWS V2 — The Gold Standard in Global Journalism`);
  console.log(`🚀 Servidor V2 ejecutándose en: http://localhost:${PORT}`);
  console.log(`🔑 Estado API Key: ${process.env.NEWSDATA_API_KEY ? 'CONFIGURADA' : 'MODO DEMO (Sin API Key)'}`);
  console.log(`📰 Extractor de Artículo Completo: /api/article-full`);
  console.log(`📊 Panel de Telemetría: /api/health`);
  console.log(`===============================================================\n`);
});
