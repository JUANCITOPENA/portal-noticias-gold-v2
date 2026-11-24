/**
 * Vercel Serverless Function: /api/news (V2)
 * Proxy seguro para NewsData.io en producción serverless con Edge Cache
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Método no permitido. Use GET.' });
  }

  try {
    const apiKey = process.env.NEWSDATA_API_KEY;
    const { category, q, country, language, image, page } = req.query;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('TU_API_KEY_AQUI')) {
      return res.status(200).json({
        status: 'demo_mode',
        version: '2.0.0-PRO',
        message: 'Modo demostración activo. Configure NEWSDATA_API_KEY en variables de entorno de Vercel.',
        totalResults: 0,
        results: [],
        nextPage: null,
        demo: true
      });
    }

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

    // Cabecera de caché en Vercel Edge Cache (10 minutos)
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const apiResponse = await fetch(targetUrl.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PortalNoticiasGold-V2-Vercel/2.0'
      }
    });
    clearTimeout(timeoutId);

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      const status = apiResponse.status;
      let errorMsg = 'Error al comunicarse con NewsData.io';

      if (status === 401) {
        errorMsg = 'API Key no válida o no autorizada en NewsData.io.';
      } else if (status === 403) {
        errorMsg = 'Acceso prohibido. Parámetro no disponible en su plan de NewsData.io.';
      } else if (status === 429) {
        errorMsg = 'Límite de peticiones de cuota alcanzado (Rate Limit de NewsData.io excedido).';
      }

      return res.status(status).json({
        status: 'error',
        code: status,
        message: errorMsg,
        details: data.results?.message || data.message || null
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({
        status: 'error',
        code: 504,
        message: 'Tiempo de espera agotado al conectar con NewsData.io.'
      });
    }

    return res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Error en el proxy de Vercel.',
      details: error.message
    });
  }
}
