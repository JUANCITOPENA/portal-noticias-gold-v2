/**
 * =============================================================================
 * AURUM NEWS V2 - GESTOR DE CACHÉ INTELIGENTE, FAVORITOS Y PAGINADOR DE 16 NOTICIAS
 * =============================================================================
 * - Manejo en memoria y persistencia en sessionStorage con TTL (15 min).
 * - Exactamente 16 noticias por página (PAGE_SIZE = 16).
 * - Algoritmo de acumulación continua mediante nextPage de NewsData.io.
 * - Sistema de Marcadores / Favoritos con persistencia en localStorage.
 * - Telemetría de ahorro de créditos y llamadas remotas.
 * - Fallback inteligente a Mock Data si no hay API key o se agota la cuota.
 * =============================================================================
 */

class NewsCacheManager {
  constructor() {
    this.PAGE_SIZE = 16;
    this.CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos de vida útil
    this.STORAGE_KEY = 'aurum_news_cache_v2';
    this.BOOKMARKS_KEY = 'aurum_bookmarks_v2';
    this.memoryCache = new Map();
    this.stats = {
      apiHits: 0,
      cacheHits: 0,
      quotaSaved: 0,
      totalLoadedArticles: 0
    };

    this.loadFromSessionStorage();
  }

  /**
   * Genera una clave determinista según los filtros activos
   */
  generateKey(category = 'top', query = '', country = 'es', language = 'es', imageOnly = true) {
    const cleanCat = (category || 'top').toLowerCase().trim();
    const cleanQ = (query || '').toLowerCase().trim();
    const cleanCountry = (country || 'es').toLowerCase().trim();
    const cleanLang = (language || 'es').toLowerCase().trim();
    const cleanImg = imageOnly ? 'img1' : 'img0';
    return `v2_cat_${cleanCat}_q_${cleanQ}_c_${cleanCountry}_l_${cleanLang}_${cleanImg}`;
  }

  /**
   * Carga la caché almacenada en sessionStorage si no ha expirado
   */
  loadFromSessionStorage() {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const now = Date.now();

      for (const [key, entry] of Object.entries(parsed)) {
        if (now - entry.timestamp < this.CACHE_TTL_MS) {
          this.memoryCache.set(key, entry);
        }
      }
    } catch (e) {
      console.warn('No se pudo restaurar sessionStorage en V2:', e);
    }
  }

  /**
   * Sincroniza la memoria con sessionStorage
   */
  saveToSessionStorage() {
    try {
      const obj = {};
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (now - entry.timestamp < this.CACHE_TTL_MS) {
          obj[key] = entry;
        }
      }
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Error al guardar en sessionStorage V2:', e);
    }
  }

  /**
   * Obtiene o inicializa la estructura de búfer para una consulta
   */
  getBuffer(cacheKey) {
    let entry = this.memoryCache.get(cacheKey);
    const now = Date.now();

    if (!entry || (now - entry.timestamp >= this.CACHE_TTL_MS)) {
      entry = {
        articles: [],
        nextPageCursor: null,
        hasMore: true,
        timestamp: now,
        isDemo: false,
        totalRemoteResults: 0
      };
      this.memoryCache.set(cacheKey, entry);
    }
    return entry;
  }

  /**
   * Paginador maestro V2: solicita los lotes necesarios para entregar exactamente 16 noticias
   */
  async getPage(params) {
    const {
      category = 'top',
      q = '',
      country = 'es',
      language = 'es',
      imageOnly = true,
      pageNumber = 1,
      onProgress = null
    } = params;

    // Manejo especial de pestaña de Marcadores / Favoritos
    if (category === 'bookmarks') {
      const bookmarked = this.getBookmarkedArticles();
      const startIndex = (pageNumber - 1) * this.PAGE_SIZE;
      const pageArticles = bookmarked.slice(startIndex, startIndex + this.PAGE_SIZE);
      const totalPages = Math.max(1, Math.ceil(bookmarked.length / this.PAGE_SIZE));

      return {
        articles: pageArticles,
        pageNumber,
        pageSize: this.PAGE_SIZE,
        totalLoaded: bookmarked.length,
        totalPages,
        hasMore: false,
        hasPrevious: pageNumber > 1,
        hasNext: pageNumber < totalPages,
        isDemo: false,
        wasCached: true,
        isBookmarksView: true,
        stats: { ...this.stats }
      };
    }

    const cacheKey = this.generateKey(category, q, country, language, imageOnly);
    const buffer = this.getBuffer(cacheKey);

    const startIndex = (pageNumber - 1) * this.PAGE_SIZE;
    const requiredEndIndex = pageNumber * this.PAGE_SIZE;

    let wasFromCache = true;
    let fetchAttempts = 0;
    const MAX_FETCH_ATTEMPTS = 5;

    while (buffer.articles.length < requiredEndIndex && buffer.hasMore && fetchAttempts < MAX_FETCH_ATTEMPTS) {
      wasFromCache = false;
      fetchAttempts++;

      if (typeof onProgress === 'function') {
        onProgress({
          status: 'fetching',
          attempt: fetchAttempts,
          currentCount: buffer.articles.length,
          targetCount: requiredEndIndex
        });
      }

      const fetchResult = await this.fetchRemoteBatch({
        category,
        q,
        country,
        language,
        imageOnly,
        cursor: buffer.nextPageCursor
      });

      if (fetchResult.isDemo) {
        buffer.isDemo = true;
      }

      if (fetchResult.articles.length === 0) {
        buffer.hasMore = false;
        break;
      }

      // Deduplicar e insertar nuevos artículos al búfer
      const existingIds = new Set(buffer.articles.map(a => a.article_id || a.link));
      for (const item of fetchResult.articles) {
        const id = item.article_id || item.link;
        if (!existingIds.has(id)) {
          existingIds.add(id);
          buffer.articles.push(item);
        }
      }

      buffer.nextPageCursor = fetchResult.nextPage || null;
      if (!buffer.nextPageCursor) {
        buffer.hasMore = false;
      }

      buffer.timestamp = Date.now();
      this.saveToSessionStorage();
    }

    if (wasFromCache) {
      this.stats.cacheHits++;
      this.stats.quotaSaved++;
    } else {
      this.stats.apiHits++;
    }

    this.stats.totalLoadedArticles = buffer.articles.length;

    // Extraer exactamente las 16 noticias de la página solicitada
    const pageArticles = buffer.articles.slice(startIndex, requiredEndIndex);
    const totalLoaded = buffer.articles.length;
    const totalPages = Math.max(1, Math.ceil(totalLoaded / this.PAGE_SIZE)) + (buffer.hasMore ? 1 : 0);

    return {
      articles: pageArticles,
      pageNumber,
      pageSize: this.PAGE_SIZE,
      totalLoaded,
      totalPages,
      hasMore: buffer.hasMore,
      hasPrevious: pageNumber > 1,
      hasNext: pageNumber < totalPages || (pageArticles.length === this.PAGE_SIZE && buffer.hasMore),
      isDemo: buffer.isDemo,
      wasCached: wasFromCache,
      isBookmarksView: false,
      stats: { ...this.stats }
    };
  }

  /**
   * Realiza la llamada HTTP al proxy local /api/news
   */
  async fetchRemoteBatch({ category, q, country, language, imageOnly, cursor }) {
    try {
      const url = new URL('/api/news', window.location.origin);
      if (category && category !== 'all') url.searchParams.set('category', category);
      if (q && q.trim() !== '') url.searchParams.set('q', q.trim());
      if (country && country !== 'all') url.searchParams.set('country', country);
      if (language && language !== 'all') url.searchParams.set('language', language);
      if (imageOnly) url.searchParams.set('image', '1');
      if (cursor) url.searchParams.set('page', cursor);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === 'demo_mode' || data.demo) {
        return this.getMockBatch(category, q);
      }

      if (!response.ok || data.status === 'error') {
        console.warn('Aviso de API NewsData.io V2:', data.message || response.statusText);
        const mockFallback = this.getMockBatch(category, q);
        mockFallback.errorMessage = data.message;
        return mockFallback;
      }

      return {
        articles: Array.isArray(data.results) ? data.results : [],
        nextPage: data.nextPage || null,
        totalResults: data.totalResults || 0,
        isDemo: false
      };
    } catch (err) {
      console.error('Error de conexión con el backend V2:', err);
      return this.getMockBatch(category, q);
    }
  }

  /**
   * Genera lote de noticias desde el catálogo simulado
   */
  getMockBatch(category, query) {
    let dataset = [...(window.MOCK_NEWS_DATA || [])];

    if (category && category !== 'top' && category !== 'all' && category !== 'bookmarks') {
      dataset = dataset.filter(item => 
        Array.isArray(item.category) 
          ? item.category.includes(category) 
          : String(item.category).toLowerCase().includes(category)
      );
    }

    if (query && query.trim() !== '') {
      const qLower = query.toLowerCase().trim();
      dataset = dataset.filter(item => 
        (item.title && item.title.toLowerCase().includes(qLower)) ||
        (item.description && item.description.toLowerCase().includes(qLower)) ||
        (item.content && item.content.toLowerCase().includes(qLower))
      );
    }

    if (dataset.length < 32) {
      const baseLen = dataset.length;
      for (let i = 0; i < 20; i++) {
        const template = dataset[i % baseLen] || (window.MOCK_NEWS_DATA && window.MOCK_NEWS_DATA[0]);
        if (template) {
          dataset.push({
            ...template,
            article_id: `${template.article_id}_v2_copy_${i}`,
            title: `[Edición Especial V2] ${template.title}`
          });
        }
      }
    }

    return {
      articles: dataset,
      nextPage: null,
      totalResults: dataset.length,
      isDemo: true
    };
  }

  /**
   * =========================================================================
   * GESTIÓN DE MARCADORES / FAVORITOS (BOOKMARKS)
   * =========================================================================
   */
  getBookmarkedArticles() {
    try {
      const raw = localStorage.getItem(this.BOOKMARKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  isBookmarked(articleId) {
    if (!articleId) return false;
    const bookmarks = this.getBookmarkedArticles();
    return bookmarks.some(b => (b.article_id || b.link) === articleId);
  }

  toggleBookmark(article) {
    if (!article) return false;
    const id = article.article_id || article.link;
    let bookmarks = this.getBookmarkedArticles();
    const index = bookmarks.findIndex(b => (b.article_id || b.link) === id);

    let isSaved = false;
    if (index >= 0) {
      bookmarks.splice(index, 1);
      isSaved = false;
    } else {
      bookmarks.unshift({
        ...article,
        savedAt: Date.now()
      });
      isSaved = true;
    }

    try {
      localStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('Error al guardar favorito en localStorage:', e);
    }

    return isSaved;
  }

  getBookmarkCount() {
    return this.getBookmarkedArticles().length;
  }

  /**
   * Helper estricto: recorta texto a exactamente 20 palabras limpias
   */
  static truncateToWords(text, maxWords = 20) {
    if (!text || typeof text !== 'string') return 'Sin descripción disponible para esta noticia.';
    const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
    if (!cleanText) return 'Sin descripción disponible para esta noticia.';

    const words = cleanText.split(/\s+/);
    if (words.length <= maxWords) {
      return cleanText;
    }
    return words.slice(0, maxWords).join(' ') + '...';
  }

  /**
   * Borra la caché manual
   */
  clearAll() {
    this.memoryCache.clear();
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
    this.stats.quotaSaved = 0;
    this.stats.cacheHits = 0;
  }
}

window.NewsCacheManager = NewsCacheManager;
