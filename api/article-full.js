/**
 * Vercel Serverless Function: /api/article-full (V2)
 * Extrae párrafos y contenido sustancial del artículo original
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Método no permitido. Use GET.' });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return res.status(400).json({ status: 'error', message: 'URL válida requerida' });
  }

  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300');

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
      return res.json({ status: 'partial', message: 'No se pudo obtener el cuerpo completo.', paragraphs: [] });
    }

    const html = await response.text();
    const sanitizedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');

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

    const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["'](.*?)["']/i) ||
                        html.match(/<meta\s+property=["']article:author["']\s+content=["'](.*?)["']/i);
    const author = authorMatch ? authorMatch[1].trim() : null;

    return res.status(200).json({
      status: 'success',
      url,
      author,
      paragraphCount: paragraphs.length,
      paragraphs: paragraphs.slice(0, 18),
      wordCount: paragraphs.reduce((acc, p) => acc + p.split(/\s+/).length, 0)
    });
  } catch (error) {
    return res.status(200).json({
      status: 'partial',
      message: 'Extracción parcial.',
      paragraphs: [],
      error: error.message
    });
  }
}
