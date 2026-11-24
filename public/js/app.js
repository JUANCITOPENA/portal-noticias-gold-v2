/**
 * =============================================================================
 * AURUM NEWS V2 - CONTROLADOR PRINCIPAL DEL FRONTEND (APP.JS)
 * =============================================================================
 * - Conecta con NewsCacheManager y el endpoint /api/news.
 * - Extractor de Noticia Completa con /api/article-full.
 * - Motor TTS de Narración por Voz (Web Speech API) con selector de velocidad.
 * - Sistema de Marcadores / Favoritos (Bookmarks / Guardar para Leer Más Tarde).
 * - Zoom tipográfico en el lector (A- / A / A+).
 * - Impresión limpia / exportación a PDF.
 * - Modal de Telemetría y Salud del Servidor en tiempo real.
 * - Paginación exacta de 16 noticias con resumen estricto de 20 palabras.
 * - Selector de Tema Dark/Light con persistencia.
 * =============================================================================
 */

(function () {
  'use strict';

  // Instancia del gestor de caché V2
  const cacheManager = new window.NewsCacheManager();

  // Motor Web Speech API (TTS)
  const synth = window.speechSynthesis;
  let currentUtterance = null;
  let currentVoiceVolume = 1.0;
  let currentVoiceRate = 1.0;
  let ttsTextToRead = '';

  // Estado reactivo de la aplicación V2
  const state = {
    category: 'top',
    pageNumber: 1,
    searchQuery: '',
    country: 'es',
    language: 'es',
    imageOnly: true,
    theme: localStorage.getItem('aurum_theme_v2') || 'dark',
    fontSize: localStorage.getItem('aurum_fontsize_v2') || 'font-md',
    currentArticle: null,
    activeModalTab: 'reader', // 'reader' | 'webview'
    isLoading: false,
    ttsState: 'idle' // 'idle' | 'speaking' | 'paused'
  };

  // Referencias al DOM
  const dom = {
    html: document.documentElement,
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    hamburgerBtn: document.getElementById('hamburgerBtn'),
    headerActions: document.getElementById('headerActions'),
    categoriesContainer: document.getElementById('categoriesContainer'),
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    countrySelect: document.getElementById('countrySelect'),
    languageSelect: document.getElementById('languageSelect'),
    imageOnlySwitch: document.getElementById('imageOnlySwitch'),
    
    // Ticker y Banners
    tickerText: document.getElementById('tickerText'),
    tickerCacheBadge: document.getElementById('tickerCacheBadge'),
    demoBanner: document.getElementById('demoBanner'),
    closeBannerBtn: document.getElementById('closeBannerBtn'),
    
    // Marcadores y Telemetría V2
    bookmarksNavBtn: document.getElementById('bookmarksNavBtn'),
    bookmarksBadgeCount: document.getElementById('bookmarksBadgeCount'),
    telemetryBtn: document.getElementById('telemetryBtn'),
    telemetryModalOverlay: document.getElementById('telemetryModalOverlay'),
    telemetryModalCloseBtn: document.getElementById('telemetryModalCloseBtn'),

    // Grid y Encabezado de Sección
    sectionTitle: document.getElementById('sectionTitle'),
    sectionBadgeCount: document.getElementById('sectionBadgeCount'),
    sectionMeta: document.getElementById('sectionMeta'),
    newsGrid: document.getElementById('newsGrid'),
    paginationWrapper: document.getElementById('paginationWrapper'),

    // Modal Panorámico
    modalOverlay: document.getElementById('modalOverlay'),
    modalBody: document.getElementById('modalBody'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalUrlText: document.getElementById('modalUrlText'),
    btnCopyUrl: document.getElementById('btnCopyUrl'),
    modalExternalLink: document.getElementById('modalExternalLink'),
    tabReaderBtn: document.getElementById('tabReaderBtn'),
    tabWebviewBtn: document.getElementById('tabWebviewBtn'),
    readerView: document.getElementById('readerView'),
    webviewView: document.getElementById('webviewView'),
    newsIframe: document.getElementById('newsIframe'),
    btnReloadIframe: document.getElementById('btnReloadIframe'),
    webviewOpenExtBtn: document.getElementById('webviewOpenExtBtn'),
    iframeBlockedFallback: document.getElementById('iframeBlockedFallback'),
    iframeExternalBtn: document.getElementById('iframeExternalBtn'),
    btnBackToReader: document.getElementById('btnBackToReader'),

    // Elementos del Modo Lector Completo
    readerCategory: document.getElementById('readerCategory'),
    readerReadingTime: document.getElementById('readerReadingTime'),
    readerWordCount: document.getElementById('readerWordCount'),
    readerTitle: document.getElementById('readerTitle'),
    readerSource: document.getElementById('readerSource'),
    readerAuthor: document.getElementById('readerAuthor'),
    readerDate: document.getElementById('readerDate'),
    readerImg: document.getElementById('readerImg'),
    keyTakeawaysList: document.getElementById('keyTakeawaysList'),
    fullTextBannerText: document.getElementById('fullTextBannerText'),
    readerContentBody: document.getElementById('readerContentBody'),
    readerActionLink: document.getElementById('readerActionLink'),
    btnModalBookmark: document.getElementById('btnModalBookmark'),
    btnPrintArticle: document.getElementById('btnPrintArticle'),

    // Controles tipográficos V2
    btnFontSm: document.getElementById('btnFontSm'),
    btnFontMd: document.getElementById('btnFontMd'),
    btnFontLg: document.getElementById('btnFontLg'),

    // Botones de Compartir
    btnShareWhatsApp: document.getElementById('btnShareWhatsApp'),
    btnShareTwitter: document.getElementById('btnShareTwitter'),
    btnShareNative: document.getElementById('btnShareNative'),

    // Toolbar de Audio TTS V2
    btnTtsPlay: document.getElementById('btnTtsPlay'),
    btnTtsPause: document.getElementById('btnTtsPause'),
    btnTtsResume: document.getElementById('btnTtsResume'),
    btnTtsStop: document.getElementById('btnTtsStop'),
    ttsStatusBadge: document.getElementById('ttsStatusBadge'),
    ttsStatusText: document.getElementById('ttsStatusText'),
    btnVolDown: document.getElementById('btnVolDown'),
    btnVolUp: document.getElementById('btnVolUp'),
    ttsVolumeSlider: document.getElementById('ttsVolumeSlider'),
    ttsVolumeBadge: document.getElementById('ttsVolumeBadge'),
    ttsVolumeIcon: document.getElementById('ttsVolumeIcon'),
    ttsRateSelect: document.getElementById('ttsRateSelect')
  };

  const CATEGORY_MAP = {
    top: 'Noticias Principales',
    business: 'Negocios & Finanzas',
    technology: 'Tecnología & IA',
    science: 'Ciencia & Espacio',
    health: 'Salud & Bienestar',
    sports: 'Deportes Globales',
    entertainment: 'Cultura & Cine',
    world: 'Internacional & Mundo',
    bookmarks: 'Mis Noticias Guardadas'
  };

  /**
   * Inicialización de la aplicación V2
   */
  function init() {
    applyTheme(state.theme);
    applyFontSize(state.fontSize);
    updateBookmarkBadge();
    bindEvents();
    checkBackendHealth();
    loadNews();
  }

  /**
   * Gestión de Tema Dark / Light
   */
  function applyTheme(theme) {
    state.theme = theme;
    dom.html.setAttribute('data-theme', theme);
    localStorage.setItem('aurum_theme_v2', theme);

    if (dom.themeIcon) {
      if (theme === 'light') {
        dom.themeIcon.className = 'bi bi-moon-stars-fill';
        dom.themeToggleBtn.title = 'Cambiar a Modo Oscuro';
      } else {
        dom.themeIcon.className = 'bi bi-sun-fill';
        dom.themeToggleBtn.title = 'Cambiar a Modo Claro';
      }
    }
  }

  /**
   * Gestión de Tamaño de Fuente V2
   */
  function applyFontSize(sizeClass) {
    state.fontSize = sizeClass;
    localStorage.setItem('aurum_fontsize_v2', sizeClass);
    if (dom.readerContentBody) {
      dom.readerContentBody.classList.remove('font-sm', 'font-md', 'font-lg');
      dom.readerContentBody.classList.add(sizeClass);
    }

    [dom.btnFontSm, dom.btnFontMd, dom.btnFontLg].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    if (sizeClass === 'font-sm' && dom.btnFontSm) dom.btnFontSm.classList.add('active');
    if (sizeClass === 'font-md' && dom.btnFontMd) dom.btnFontMd.classList.add('active');
    if (sizeClass === 'font-lg' && dom.btnFontLg) dom.btnFontLg.classList.add('active');
  }

  /**
   * Actualiza el badge contador de noticias guardadas
   */
  function updateBookmarkBadge() {
    const count = cacheManager.getBookmarkCount();
    if (dom.bookmarksBadgeCount) {
      dom.bookmarksBadgeCount.textContent = count;
      dom.bookmarksBadgeCount.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  /**
   * Consulta el estado del backend (/api/health)
   */
  async function checkBackendHealth() {
    try {
      const res = await fetch('/api/health');
      const health = await res.json();
      if (!health.hasApiKey) {
        if (dom.demoBanner) dom.demoBanner.classList.remove('hidden');
      } else {
        if (dom.demoBanner) dom.demoBanner.classList.add('hidden');
      }
    } catch (e) {
      console.warn('Backend local no detectado, operando con Mock Data:', e);
      if (dom.demoBanner) dom.demoBanner.classList.remove('hidden');
    }
  }

  /**
   * Asignación de Listeners de Eventos
   */
  function bindEvents() {
    // Alternancia de Tema
    dom.themeToggleBtn?.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // Menú Hamburguesa Móvil
    dom.hamburgerBtn?.addEventListener('click', () => {
      dom.headerActions?.classList.toggle('open');
    });

    // Categorías de Noticias
    dom.categoriesContainer?.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-nav-btn');
      if (!btn) return;

      const cat = btn.dataset.category;
      if (cat === state.category) return;

      document.querySelectorAll('.category-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      state.category = cat;
      state.pageNumber = 1;
      loadNews();
    });

    // Botón de Marcadores / Favoritos en Header
    dom.bookmarksNavBtn?.addEventListener('click', () => {
      document.querySelectorAll('.category-nav-btn').forEach(b => b.classList.remove('active'));
      state.category = 'bookmarks';
      state.pageNumber = 1;
      loadNews();
    });

    // Botón de Telemetría V2
    dom.telemetryBtn?.addEventListener('click', openTelemetryModal);
    dom.telemetryModalCloseBtn?.addEventListener('click', closeTelemetryModal);
    dom.telemetryModalOverlay?.addEventListener('click', (e) => {
      if (e.target === dom.telemetryModalOverlay) closeTelemetryModal();
    });

    // Búsqueda con Debounce (400ms)
    let searchTimer = null;
    dom.searchInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      dom.searchClearBtn.style.display = val.length > 0 ? 'block' : 'none';

      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchQuery = val;
        state.pageNumber = 1;
        loadNews();
      }, 400);
    });

    // Limpiar búsqueda
    dom.searchClearBtn?.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.searchClearBtn.style.display = 'none';
      state.searchQuery = '';
      state.pageNumber = 1;
      loadNews();
    });

    // Filtros de País, Idioma y Switch de Foto
    dom.countrySelect?.addEventListener('change', (e) => {
      state.country = e.target.value;
      state.pageNumber = 1;
      loadNews();
    });

    dom.languageSelect?.addEventListener('change', (e) => {
      state.language = e.target.value;
      state.pageNumber = 1;
      loadNews();
    });

    dom.imageOnlySwitch?.addEventListener('change', (e) => {
      state.imageOnly = e.target.checked;
      state.pageNumber = 1;
      loadNews();
    });

    // Cerrar Banner Demo
    dom.closeBannerBtn?.addEventListener('click', () => {
      dom.demoBanner?.classList.add('hidden');
    });

    // Controles del Modal
    dom.modalCloseBtn?.addEventListener('click', closeModal);
    dom.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === dom.modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        closeTelemetryModal();
      }
    });

    // Pestañas del Modal: Modo Noticia Completa vs WebView
    dom.tabReaderBtn?.addEventListener('click', () => switchModalTab('reader'));
    dom.tabWebviewBtn?.addEventListener('click', () => switchModalTab('webview'));
    dom.btnBackToReader?.addEventListener('click', () => switchModalTab('reader'));

    // Botones auxiliares de WebView
    dom.btnReloadIframe?.addEventListener('click', () => {
      if (state.currentArticle && dom.newsIframe) {
        dom.newsIframe.src = state.currentArticle.link;
      }
    });

    dom.btnCopyUrl?.addEventListener('click', copyArticleUrl);

    // Controles tipográficos del lector V2
    dom.btnFontSm?.addEventListener('click', () => applyFontSize('font-sm'));
    dom.btnFontMd?.addEventListener('click', () => applyFontSize('font-md'));
    dom.btnFontLg?.addEventListener('click', () => applyFontSize('font-lg'));

    // Botón Imprimir / PDF
    dom.btnPrintArticle?.addEventListener('click', () => window.print());

    // Botón Favorito en Modal
    dom.btnModalBookmark?.addEventListener('click', () => {
      if (!state.currentArticle) return;
      const isSaved = cacheManager.toggleBookmark(state.currentArticle);
      updateBookmarkButton(dom.btnModalBookmark, isSaved);
      updateBookmarkBadge();
      updateCardBookmarkState(state.currentArticle.article_id || state.currentArticle.link, isSaved);
    });

    // Compartir Redes
    dom.btnShareWhatsApp?.addEventListener('click', shareWhatsApp);
    dom.btnShareTwitter?.addEventListener('click', shareTwitter);
    dom.btnShareNative?.addEventListener('click', shareNative);

    // Controles de Audio TTS V2
    dom.btnTtsPlay?.addEventListener('click', playTts);
    dom.btnTtsPause?.addEventListener('click', pauseTts);
    dom.btnTtsResume?.addEventListener('click', resumeTts);
    dom.btnTtsStop?.addEventListener('click', stopTts);

    dom.btnVolDown?.addEventListener('click', () => changeVolume(-0.1));
    dom.btnVolUp?.addEventListener('click', () => changeVolume(0.1));
    dom.ttsVolumeSlider?.addEventListener('input', (e) => setVolume(parseFloat(e.target.value)));

    dom.ttsRateSelect?.addEventListener('change', (e) => {
      currentVoiceRate = parseFloat(e.target.value);
      if (synth && synth.speaking) {
        // Reiniciar con la nueva velocidad
        const wasPaused = synth.paused;
        stopTts();
        playTts();
        if (wasPaused) pauseTts();
      }
    });
  }

  /**
   * Carga de Noticias (Exactamente 16 por página)
   */
  async function loadNews() {
    state.isLoading = true;
    renderSkeletons(16);
    updateSectionHeader();

    try {
      const result = await cacheManager.getPage({
        category: state.category,
        q: state.searchQuery,
        country: state.country,
        language: state.language,
        imageOnly: state.imageOnly,
        pageNumber: state.pageNumber,
        onProgress: (p) => {
          if (dom.sectionMeta) {
            dom.sectionMeta.textContent = `Consultando lote ${p.attempt}... (${p.currentCount}/${p.targetCount} noticias)`;
          }
        }
      });

      renderNewsGrid(result.articles);
      renderPagination(result);
      updateTicker(result);

    } catch (err) {
      console.error('Error al cargar noticias:', err);
      dom.newsGrid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2.5rem;"></i>
          <h3>No se pudieron recuperar noticias</h3>
          <p class="text-muted">Por favor intente nuevamente en unos instantes o revise su conexión a internet.</p>
          <button class="btn-external-link" onclick="location.reload()">Reintentar</button>
        </div>
      `;
    } finally {
      state.isLoading = false;
    }
  }

  /**
   * Renderiza los Skeleton Loaders
   */
  function renderSkeletons(count = 16) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton-pulse skeleton-img"></div>
          <div class="skeleton-content">
            <div class="skeleton-pulse skeleton-line" style="width: 40%;"></div>
            <div class="skeleton-pulse skeleton-line" style="width: 90%; height: 20px;"></div>
            <div class="skeleton-pulse skeleton-line" style="width: 75%; height: 20px;"></div>
            <div class="skeleton-pulse skeleton-line" style="width: 100%;"></div>
            <div class="skeleton-pulse skeleton-line" style="width: 80%;"></div>
          </div>
        </div>
      `;
    }
    dom.newsGrid.innerHTML = html;
  }

  /**
   * Actualiza el encabezado de la sección activa
   */
  function updateSectionHeader() {
    const title = CATEGORY_MAP[state.category] || 'Noticias Especiales';
    if (dom.sectionTitle) dom.sectionTitle.textContent = title;
  }

  /**
   * Renderiza las 16 tarjetas de noticias en el Grid
   */
  function renderNewsGrid(articles) {
    if (!articles || articles.length === 0) {
      dom.newsGrid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1 / -1;">
          <i class="bi bi-inbox" style="font-size: 3rem; color: var(--gold-light);"></i>
          <h3 style="font-family: 'Playfair Display', serif; margin: 1rem 0;">No se encontraron noticias</h3>
          <p class="text-muted">No hay noticias que coincidan con los filtros seleccionados o no tiene noticias guardadas en sus marcadores.</p>
        </div>
      `;
      if (dom.sectionBadgeCount) dom.sectionBadgeCount.textContent = '0 noticias';
      return;
    }

    if (dom.sectionBadgeCount) {
      dom.sectionBadgeCount.textContent = `${articles.length} noticias (Pág. ${state.pageNumber})`;
    }

    let html = '';
    articles.forEach((article, idx) => {
      const id = article.article_id || article.link || `art_${idx}`;
      const title = article.title || 'Titular no disponible';
      const shortDesc = NewsCacheManager.truncateToWords(article.description || article.content || '', 20);
      const source = article.source_name || (article.source_id ? article.source_id.toUpperCase() : 'AURUM EDITORIAL');
      const timeAgo = formatRelativeTime(article.pubDate);
      const categoryLabel = Array.isArray(article.category) ? article.category[0] : (article.category || 'General');
      const imageUrl = article.image_url || 'assets/fallback-news.svg';
      const isSaved = cacheManager.isBookmarked(id);

      html += `
        <article class="news-card" data-article-id="${escapeHtml(id)}">
          <div class="card-img-wrap">
            <img 
              src="${escapeHtml(imageUrl)}" 
              alt="${escapeHtml(title)}" 
              class="card-img" 
              loading="lazy"
              onerror="this.onerror=null; this.src='assets/fallback-news.svg';"
            >
            <div class="card-category-tag">${escapeHtml(categoryLabel)}</div>
            <button 
              type="button" 
              class="btn-bookmark-card ${isSaved ? 'active' : ''}" 
              data-bookmark-id="${escapeHtml(id)}"
              title="${isSaved ? 'Quitar de Guardados' : 'Guardar noticia para leer más tarde'}"
            >
              <i class="bi ${isSaved ? 'bi-bookmark-star-fill' : 'bi-bookmark-plus'}"></i>
            </button>
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span class="card-source"><i class="bi bi-newspaper"></i> ${escapeHtml(source)}</span>
              <span class="card-time"><i class="bi bi-clock"></i> ${escapeHtml(timeAgo)}</span>
            </div>
            <h2 class="card-title">${escapeHtml(title)}</h2>
            <p class="card-desc">${escapeHtml(shortDesc)}</p>
            <div class="card-footer-row">
              <span class="card-read-time"><i class="bi bi-book"></i> ~2 min</span>
              <button type="button" class="btn-read-more" data-action="open-modal" data-article-idx="${idx}">
                Ver más <i class="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    });

    dom.newsGrid.innerHTML = html;

    // Vincular apertura del modal
    dom.newsGrid.querySelectorAll('.btn-read-more').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.articleIdx, 10);
        const article = articles[idx];
        if (article) openArticleModal(article);
      });
    });

    // Vincular clic en Bookmark dentro de las tarjetas
    dom.newsGrid.querySelectorAll('.btn-bookmark-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.bookmarkId;
        const article = articles.find(a => (a.article_id || a.link) === id);
        if (!article) return;

        const isSaved = cacheManager.toggleBookmark(article);
        updateBookmarkBadge();
        updateCardBookmarkState(id, isSaved);

        // Si estamos en la vista de marcadores, recargar para reflejar la eliminación
        if (state.category === 'bookmarks' && !isSaved) {
          loadNews();
        }
      });
    });
  }

  function updateCardBookmarkState(articleId, isSaved) {
    const cardBtn = dom.newsGrid.querySelector(`.btn-bookmark-card[data-bookmark-id="${articleId}"]`);
    if (cardBtn) {
      if (isSaved) {
        cardBtn.classList.add('active');
        cardBtn.innerHTML = '<i class="bi bi-bookmark-star-fill"></i>';
        cardBtn.title = 'Quitar de Guardados';
      } else {
        cardBtn.classList.remove('active');
        cardBtn.innerHTML = '<i class="bi bi-bookmark-plus"></i>';
        cardBtn.title = 'Guardar noticia para leer más tarde';
      }
    }
  }

  /**
   * Renderiza los Controles de Paginación
   */
  function renderPagination(res) {
    if (res.totalPages <= 1) {
      dom.paginationWrapper.innerHTML = '';
      return;
    }

    let html = `
      <div class="pagination-container">
        <button 
          type="button" 
          class="page-btn" 
          id="btnPrevPage" 
          ${!res.hasPrevious ? 'disabled' : ''}
          title="Página anterior"
        >
          <i class="bi bi-chevron-left"></i> Anterior
        </button>

        <span class="page-indicator">Página <strong>${res.pageNumber}</strong> de <strong>${res.totalPages}</strong></span>

        <button 
          type="button" 
          class="page-btn" 
          id="btnNextPage" 
          ${!res.hasNext ? 'disabled' : ''}
          title="Página siguiente"
        >
          Siguiente <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    `;

    dom.paginationWrapper.innerHTML = html;

    document.getElementById('btnPrevPage')?.addEventListener('click', () => {
      if (state.pageNumber > 1) {
        state.pageNumber--;
        window.scrollTo({ top: 380, behavior: 'smooth' });
        loadNews();
      }
    });

    document.getElementById('btnNextPage')?.addEventListener('click', () => {
      state.pageNumber++;
      window.scrollTo({ top: 380, behavior: 'smooth' });
      loadNews();
    });
  }

  /**
   * Actualiza el Ticker y el Badge de Caché
   */
  function updateTicker(res) {
    if (res.articles && res.articles.length > 0) {
      const topTitle = res.articles[0].title;
      if (dom.tickerText) dom.tickerText.textContent = topTitle;
    }

    if (dom.tickerCacheBadge) {
      if (res.wasCached) {
        dom.tickerCacheBadge.innerHTML = '<i class="bi bi-shield-check text-success"></i> Caché Inteligente Activa (0 Créditos Gastados)';
        dom.tickerCacheBadge.style.color = '#22C55E';
      } else {
        dom.tickerCacheBadge.innerHTML = '<i class="bi bi-broadcast text-warning"></i> Datos en Vivo Actualizados';
        dom.tickerCacheBadge.style.color = '#F5C518';
      }
    }
  }

  /**
   * =========================================================================
   * MODAL PANORÁMICO DUAL: LECTOR COMPLETO Y WEBVIEW
   * =========================================================================
   */
  async function openArticleModal(article) {
    state.currentArticle = article;
    const id = article.article_id || article.link;

    // Metadatos
    const title = article.title || 'Sin Título';
    const source = article.source_name || (article.source_id ? article.source_id.toUpperCase() : 'AURUM EDITORIAL');
    const author = (Array.isArray(article.creator) ? article.creator.join(', ') : article.creator) || 'Redacción Especializada';
    const dateFormatted = formatFullDate(article.pubDate);
    const category = Array.isArray(article.category) ? article.category.join(' / ') : (article.category || 'General');
    const imageUrl = article.image_url || 'assets/fallback-news.svg';

    // Rellenar datos
    if (dom.readerTitle) dom.readerTitle.textContent = title;
    if (dom.readerCategory) dom.readerCategory.textContent = category.toUpperCase();
    if (dom.readerSource) dom.readerSource.textContent = source;
    if (dom.readerAuthor) dom.readerAuthor.textContent = author;
    if (dom.readerDate) dom.readerDate.textContent = dateFormatted;
    if (dom.modalUrlText) dom.modalUrlText.textContent = article.link || 'aurum-news://article';
    if (dom.modalExternalLink) dom.modalExternalLink.href = article.link || '#';
    if (dom.readerActionLink) dom.readerActionLink.href = article.link || '#';
    if (dom.iframeExternalBtn) dom.iframeExternalBtn.href = article.link || '#';

    if (dom.readerImg) {
      dom.readerImg.src = imageUrl;
      dom.readerImg.onerror = () => { dom.readerImg.src = 'assets/fallback-news.svg'; };
    }

    // Estado del botón Bookmark en modal
    const isSaved = cacheManager.isBookmarked(id);
    updateBookmarkButton(dom.btnModalBookmark, isSaved);

    // Puntos Clave automáticos
    renderKeyTakeaways(article);

    // Preparar WebView
    if (dom.newsIframe) {
      dom.newsIframe.src = article.link || 'about:blank';
    }
    if (dom.iframeBlockedFallback) {
      dom.iframeBlockedFallback.style.display = 'none';
    }

    // Extracción de Texto Completo
    await loadFullArticleContent(article);

    // Abrir Modal
    switchModalTab('reader');
    dom.modalOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function updateBookmarkButton(btn, isSaved) {
    if (!btn) return;
    if (isSaved) {
      btn.classList.add('active');
      btn.innerHTML = '<i class="bi bi-bookmark-star-fill text-warning"></i> <span>Guardada</span>';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="bi bi-bookmark-plus"></i> <span>Guardar</span>';
    }
  }

  /**
   * Genera los Puntos Clave / Key Takeaways
   */
  function renderKeyTakeaways(article) {
    if (!dom.keyTakeawaysList) return;
    const desc = article.description || article.content || '';
    const points = [];

    points.push(`<strong>Hecho Central:</strong> ${article.title}`);
    if (desc) {
      points.push(`<strong>Contexto Inmediato:</strong> ${desc.slice(0, 160)}...`);
    }
    points.push(`<strong>Fuente Verificada:</strong> Reportado por ${article.source_name || 'la agencia internacional de noticias'}.`);

    let html = '';
    points.forEach(p => {
      html += `<li><i class="bi bi-check-circle-fill text-warning"></i> <span>${p}</span></li>`;
    });
    dom.keyTakeawaysList.innerHTML = html;
  }

  /**
   * Extrae el contenido completo mediante /api/article-full
   */
  async function loadFullArticleContent(article) {
    if (!dom.readerContentBody) return;

    dom.readerContentBody.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <span class="audio-wave-dot" style="width: 14px; height: 14px; margin-bottom: 1rem;"></span>
        <p class="text-muted">Extrayendo texto íntegro y reportaje completo desde la fuente original...</p>
      </div>
    `;

    let extractedParagraphs = [];

    try {
      if (article.link && article.link.startsWith('http')) {
        const res = await fetch(`/api/article-full?url=${encodeURIComponent(article.link)}`);
        const data = await res.json();

        if (data.status === 'success' && Array.isArray(data.paragraphs) && data.paragraphs.length > 0) {
          extractedParagraphs = data.paragraphs;
          if (data.author && dom.readerAuthor) {
            dom.readerAuthor.textContent = data.author;
          }
          if (data.wordCount && dom.readerWordCount) {
            dom.readerWordCount.textContent = `${data.wordCount} palabras`;
            const estMin = Math.max(1, Math.ceil(data.wordCount / 200));
            if (dom.readerReadingTime) dom.readerReadingTime.textContent = `~${estMin} min lectura`;
          }
        }
      }
    } catch (e) {
      console.warn('Extracción remota no disponible, usando contenido local:', e);
    }

    // Fallback al contenido o descripción provistos
    if (extractedParagraphs.length === 0) {
      const fallbackText = article.content || article.description || 'Contenido disponible para lectura en la fuente de origen.';
      extractedParagraphs = fallbackText.split(/\n+/).filter(p => p.trim().length > 30);
      if (extractedParagraphs.length === 0) extractedParagraphs = [fallbackText];
    }

    let bodyHtml = '';
    extractedParagraphs.forEach(p => {
      bodyHtml += `<p>${escapeHtml(p)}</p>`;
    });

    dom.readerContentBody.innerHTML = bodyHtml;

    // Preparar texto plano para el motor TTS
    ttsTextToRead = `${article.title}. ${extractedParagraphs.join('. ')}`;
  }

  function switchModalTab(tab) {
    state.activeModalTab = tab;
    if (tab === 'reader') {
      dom.tabReaderBtn?.classList.add('active');
      dom.tabWebviewBtn?.classList.remove('active');
      if (dom.readerView) dom.readerView.style.display = 'block';
      if (dom.webviewView) dom.webviewView.style.display = 'none';
    } else {
      dom.tabReaderBtn?.classList.remove('active');
      dom.tabWebviewBtn?.classList.add('active');
      if (dom.readerView) dom.readerView.style.display = 'none';
      if (dom.webviewView) dom.webviewView.style.display = 'block';
    }
  }

  function closeModal() {
    dom.modalOverlay?.classList.remove('open');
    document.body.style.overflow = '';
    stopTts();
    if (dom.newsIframe) dom.newsIframe.src = 'about:blank';
    state.currentArticle = null;
  }

  /**
   * =========================================================================
   * MODAL DE TELEMETRÍA V2 (/api/health)
   * =========================================================================
   */
  async function openTelemetryModal() {
    if (!dom.telemetryModalOverlay) return;

    dom.telemetryModalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    const healthContent = document.getElementById('telemetryModalContent');
    if (!healthContent) return;

    healthContent.innerHTML = `<p style="text-align: center;">Cargando métricas de salud y caché...</p>`;

    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const localStats = cacheManager.stats;

      healthContent.innerHTML = `
        <div class="telemetry-card-grid">
          <div class="telemetry-stat-card">
            <div class="telemetry-stat-val">${data.hasApiKey ? 'ACTIVA' : 'DEMO'}</div>
            <div class="telemetry-stat-label">API NewsData.io</div>
          </div>
          <div class="telemetry-stat-card">
            <div class="telemetry-stat-val">${localStats.quotaSaved}</div>
            <div class="telemetry-stat-label">Créditos Ahorrados</div>
          </div>
          <div class="telemetry-stat-card">
            <div class="telemetry-stat-val">${localStats.cacheHits}</div>
            <div class="telemetry-stat-label">Aciertos Caché</div>
          </div>
          <div class="telemetry-stat-card">
            <div class="telemetry-stat-val">${cacheManager.getBookmarkCount()}</div>
            <div class="telemetry-stat-label">Noticias Guardadas</div>
          </div>
        </div>

        <div style="background: var(--bg-card); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-gold); font-size: 0.85rem; line-height: 1.6;">
          <p><strong>Uptime del Servidor:</strong> ${data.uptimeSeconds || 0} segundos</p>
          <p><strong>Entradas Activas en Caché RAM:</strong> ${data.cacheEntries || 0}</p>
          <p><strong>TTL de Caché:</strong> 15 minutos (0 llamadas al re-navegar)</p>
          <p><strong>Peticiones Servidor:</strong> ${data.stats?.totalRequests || 0} (${data.stats?.cacheHitRate || '0%'} servidas desde memoria)</p>
        </div>
      `;
    } catch (e) {
      healthContent.innerHTML = `<p class="text-danger">No se pudo consultar el endpoint /api/health del backend local.</p>`;
    }
  }

  function closeTelemetryModal() {
    dom.telemetryModalOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  /**
   * =========================================================================
   * MOTOR TTS (TEXT-TO-SPEECH) - ESTÁNDAR JPV PRO CON VELOCIDAD V2
   * =========================================================================
   */
  function playTts() {
    if (!synth) {
      alert('Tu navegador no soporta síntesis de voz (Web Speech API).');
      return;
    }

    if (synth.paused && currentUtterance) {
      synth.resume();
      setTtsUiState('speaking');
      return;
    }

    stopTts();

    if (!ttsTextToRead) return;

    const utterance = new SpeechSynthesisUtterance(ttsTextToRead);
    utterance.lang = 'es-ES';
    utterance.rate = currentVoiceRate;
    utterance.pitch = 1.0;
    utterance.volume = currentVoiceVolume;

    utterance.onstart = () => setTtsUiState('speaking');
    utterance.onend = () => setTtsUiState('idle');
    utterance.onerror = () => setTtsUiState('idle');

    currentUtterance = utterance;
    synth.speak(utterance);
  }

  function pauseTts() {
    if (synth && synth.speaking) {
      synth.pause();
      setTtsUiState('paused');
    }
  }

  function resumeTts() {
    if (synth && synth.paused) {
      synth.resume();
      setTtsUiState('speaking');
    }
  }

  function stopTts() {
    if (synth) synth.cancel();
    currentUtterance = null;
    setTtsUiState('idle');
  }

  function setTtsUiState(state) {
    if (!dom.btnTtsPlay) return;

    if (state === 'speaking') {
      dom.btnTtsPlay.classList.add('d-none');
      dom.btnTtsPause?.classList.remove('d-none');
      dom.btnTtsResume?.classList.add('d-none');
      dom.btnTtsStop?.classList.remove('d-none');
      dom.ttsStatusBadge?.classList.remove('d-none');
      dom.ttsStatusBadge?.classList.add('d-flex');
      if (dom.ttsStatusText) dom.ttsStatusText.textContent = `Narrando (${currentVoiceRate}x)...`;
    } else if (state === 'paused') {
      dom.btnTtsPlay.classList.add('d-none');
      dom.btnTtsPause?.classList.add('d-none');
      dom.btnTtsResume?.classList.remove('d-none');
      dom.btnTtsStop?.classList.remove('d-none');
      dom.ttsStatusBadge?.classList.remove('d-none');
      dom.ttsStatusBadge?.classList.add('d-flex');
      if (dom.ttsStatusText) dom.ttsStatusText.textContent = 'Pausado';
    } else {
      dom.btnTtsPlay.classList.remove('d-none');
      dom.btnTtsPause?.classList.add('d-none');
      dom.btnTtsResume?.classList.add('d-none');
      dom.btnTtsStop?.classList.add('d-none');
      dom.ttsStatusBadge?.classList.add('d-none');
      dom.ttsStatusBadge?.classList.remove('d-flex');
    }
  }

  function setVolume(val) {
    currentVoiceVolume = Math.max(0, Math.min(1, val));
    if (currentUtterance) currentUtterance.volume = currentVoiceVolume;

    const pct = Math.round(currentVoiceVolume * 100);
    if (dom.ttsVolumeBadge) dom.ttsVolumeBadge.textContent = `${pct}%`;
    if (dom.ttsVolumeSlider) dom.ttsVolumeSlider.value = currentVoiceVolume;

    if (dom.ttsVolumeIcon) {
      if (pct === 0) dom.ttsVolumeIcon.className = 'bi bi-volume-mute-fill text-danger fs-6';
      else if (pct < 50) dom.ttsVolumeIcon.className = 'bi bi-volume-down-fill text-dark fs-6';
      else dom.ttsVolumeIcon.className = 'bi bi-volume-up-fill text-dark fs-6';
    }
  }

  function changeVolume(delta) {
    let nextVal = Math.round((currentVoiceVolume + delta) * 100) / 100;
    setVolume(nextVal);
  }

  /**
   * =========================================================================
   * COMPARTIR Y UTILIDADES
   * =========================================================================
   */
  function copyArticleUrl() {
    if (!state.currentArticle?.link) return;
    navigator.clipboard.writeText(state.currentArticle.link).then(() => {
      const originalText = dom.btnCopyUrl.innerHTML;
      dom.btnCopyUrl.innerHTML = '<i class="bi bi-check2 text-success"></i> ¡Copiado!';
      setTimeout(() => { dom.btnCopyUrl.innerHTML = originalText; }, 2000);
    });
  }

  function shareWhatsApp() {
    if (!state.currentArticle) return;
    const text = encodeURIComponent(`📰 *${state.currentArticle.title}*\n\nLee la noticia completa en AURUM NEWS:\n${state.currentArticle.link}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }

  function shareTwitter() {
    if (!state.currentArticle) return;
    const text = encodeURIComponent(`📰 ${state.currentArticle.title}`);
    const url = encodeURIComponent(state.currentArticle.link || window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  function shareNative() {
    if (!state.currentArticle) return;
    if (navigator.share) {
      navigator.share({
        title: state.currentArticle.title,
        text: state.currentArticle.description || state.currentArticle.title,
        url: state.currentArticle.link
      }).catch(() => {});
    } else {
      copyArticleUrl();
    }
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return 'Reciente';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Reciente';

    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Hace unos segundos';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  function formatFullDate(dateStr) {
    if (!dateStr) return 'Fecha de publicación editorial';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Inicializar al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
