/**
 * ============================================================================
 * TUSUPERCARD - MOTOR DE BARAJA 3D Y FÍSICAS DE TARJETAS
 * ============================================================================
 * Controla la baraja apilada en 3D, el despliegue en abanico, el giro de tarjeta,
 * la generación instantánea de códigos QR y la exportación de tarjetas en PNG.
 */

class DeckEngine {
  constructor() {
    this.activeDeckType = "public"; // 'public' | 'personal'
    this.cards = [];
    this.currentDrawnCard = null;
    this.viewMode = "deck"; // 'deck' | 'spread' | 'grimorio'
    this.isAnimating = false;

    this.deckContainer = document.getElementById("deck-stage");
    this.activeCardModal = document.getElementById("card-reveal-stage");
    this.grimorioContainer = document.getElementById("grimorio-grid");

    // Coordenadas para soporte táctil (swipe en móviles)
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;

    // Breakpoint donde el abanico se convierte en carrusel deslizable
    this.compactQuery = window.matchMedia("(max-width: 640px)");
  }

  isCompactViewport() {
    return this.compactQuery.matches;
  }

  init(cards) {
    this.cards = cards;
    this.renderCurrentDeck();
    this.setupDeckInteractions();
  }

  setCards(cards) {
    this.cards = cards;
    this.renderCurrentDeck();
    if (this.viewMode === "grimorio") {
      this.renderGrimorio();
    }
  }

  getActiveCards() {
    return this.cards.filter(c => c.deck === this.activeDeckType);
  }

  switchDeck(deckType) {
    if (this.activeDeckType === deckType) return;
    this.activeDeckType = deckType;

    if (window.smartCardAudio) {
      window.smartCardAudio.playShuffle();
    }

    // Actualizar selector visual de secciones
    document.querySelectorAll(".deck-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.deck === deckType);
    });

    // Actualizar indicador de tema activo
    document.body.dataset.activeDeck = deckType;

    this.renderCurrentDeck();
    if (this.viewMode === "grimorio") {
      this.renderGrimorio();
    }
  }

  renderCurrentDeck() {
    const activeCards = this.getActiveCards();
    if (!this.deckContainer) return;

    this.deckContainer.innerHTML = "";

    if (activeCards.length === 0) {
      this.deckContainer.innerHTML = `
        <div class="empty-deck-notice">
          <div class="empty-sigil">🎴</div>
          <p class="empty-title">No hay tarjetas en esta sección</p>
          <p class="empty-desc">Esta colección está vacía. Abre el Panel de Control para agregar tus primeros enlaces.</p>
          <button class="mystic-btn primary-gold" onclick="window.smartCardApp && window.smartCardApp.openAltarModal()">
            <span class="btn-sigil">⚙</span> Agregar Nuevas Tarjetas
          </button>
        </div>
      `;
      return;
    }

    if (this.viewMode === "deck") {
      this.renderStackedDeck(activeCards);
    } else if (this.viewMode === "spread") {
      this.renderFannedSpread(activeCards);
    }
  }

  // Renderiza la baraja física apilada en 3D
  renderStackedDeck(activeCards) {
    const stackWrap = document.createElement("div");
    stackWrap.className = `card-stack-wrap deck-${this.activeDeckType}`;
    stackWrap.id = "card-stack-interactive";

    const visibleLayers = Math.min(activeCards.length, 6);

    for (let i = 0; i < visibleLayers; i++) {
      const layer = document.createElement("div");
      layer.className = `deck-layer layer-${i}`;

      const offsetX = (i * 2.5);
      const offsetY = -(i * 3);
      const rotate = ((i % 2 === 0 ? 1 : -1) * (i * 0.8)).toFixed(1);

      layer.style.transform = `translate3d(${offsetX}px, ${offsetY}px, ${-i * 8}px) rotateZ(${rotate}deg)`;
      layer.style.zIndex = visibleLayers - i;

      // El reverso de la tarjeta superior
      if (i === 0) {
        layer.innerHTML = this.getCardBackHTML(this.activeDeckType, activeCards.length);
        layer.setAttribute("title", "Haz clic para ver una tarjeta de la baraja");
      }

      stackWrap.appendChild(layer);
    }

    // Controles de navegación de la baraja
    const controls = document.createElement("div");
    controls.className = "deck-stack-controls";
    controls.innerHTML = `
      <button id="draw-card-btn" class="mystic-btn primary-gold" title="Explorar tarjetas interactivas">
        <span class="btn-sigil">✦</span> Descubrir Tarjeta
      </button>
      <button id="fan-deck-btn" class="mystic-btn secondary-ethereal" title="Desplegar todas las tarjetas de la sección">
        <span class="btn-sigil">🎴</span> Extender Baraja
      </button>
    `;

    this.deckContainer.appendChild(stackWrap);
    this.deckContainer.appendChild(controls);

    // Eventos
    stackWrap.addEventListener("click", () => this.drawRandomCard());
    document.getElementById("draw-card-btn")?.addEventListener("click", () => this.drawRandomCard());
    document.getElementById("fan-deck-btn")?.addEventListener("click", () => this.toggleSpreadView());
  }

  // Renderiza las tarjetas en un abanico dinámico (o carrusel en móviles)
  renderFannedSpread(activeCards) {
    if (this.isCompactViewport()) {
      this.renderSpreadCarousel(activeCards);
      return;
    }

    const spreadWrap = document.createElement("div");
    spreadWrap.className = "fanned-spread-wrap";

    const total = activeCards.length;
    const arcDegrees = Math.min(76, total * 9);
    const step = total > 1 ? arcDegrees / (total - 1) : 0;
    const startAngle = -arcDegrees / 2;

    activeCards.forEach((card, idx) => {
      const cardEl = document.createElement("div");
      cardEl.className = "spread-card";
      const angle = startAngle + step * idx;
      const transY = Math.abs(angle) * 1.5;

      cardEl.style.transform = `rotate(${angle}deg) translateY(${transY}px)`;
      cardEl.style.zIndex = idx + 1;

      cardEl.innerHTML = `
        <div class="spread-card-inner">
          ${this.getCardBackHTML(this.activeDeckType, null, card.numeral)}
          <div class="spread-card-label">${card.numeral} · ${this.escapeHTML(card.archetype)}</div>
        </div>
      `;

      cardEl.addEventListener("click", () => {
        this.revealCard(card);
      });

      spreadWrap.appendChild(cardEl);
    });

    this.deckContainer.appendChild(spreadWrap);
    this.appendSpreadControls();
  }

  // Carrusel horizontal con scroll-snap: cómodo de deslizar con el pulgar
  renderSpreadCarousel(activeCards) {
    const carousel = document.createElement("div");
    carousel.className = "spread-carousel";
    carousel.setAttribute("aria-label", "Tarjetas de la sección, deslizá para explorar");

    activeCards.forEach(card => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "spread-carousel-card";
      item.setAttribute("aria-label", `Abrir tarjeta ${card.numeral} · ${card.title}`);
      item.innerHTML = `
        <div class="spread-card-inner">
          ${this.getCardBackHTML(this.activeDeckType, null, card.numeral)}
          <div class="spread-card-label">${card.numeral} · ${this.escapeHTML(card.archetype)}</div>
        </div>
      `;
      item.addEventListener("click", () => this.revealCard(card));
      carousel.appendChild(item);
    });

    const hint = document.createElement("p");
    hint.className = "spread-carousel-hint";
    hint.textContent = "← Deslizá para explorar · Tocá una tarjeta para abrirla →";

    this.deckContainer.appendChild(carousel);
    this.deckContainer.appendChild(hint);
    this.appendSpreadControls();
  }

  appendSpreadControls() {
    const controls = document.createElement("div");
    controls.className = "deck-stack-controls";
    controls.innerHTML = `
      <button id="collapse-deck-btn" class="mystic-btn secondary-ethereal">
        <span class="btn-sigil">↩</span> Apilar Baraja
      </button>
      <button id="draw-spread-btn" class="mystic-btn primary-gold">
        <span class="btn-sigil">✦</span> Tarjeta Aleatoria
      </button>
    `;

    this.deckContainer.appendChild(controls);

    document.getElementById("collapse-deck-btn")?.addEventListener("click", () => {
      this.viewMode = "deck";
      this.renderCurrentDeck();
    });
    document.getElementById("draw-spread-btn")?.addEventListener("click", () => {
      this.drawRandomCard();
    });
  }

  toggleSpreadView() {
    this.viewMode = this.viewMode === "spread" ? "deck" : "spread";
    if (window.smartCardAudio) {
      window.smartCardAudio.playShuffle();
    }
    this.renderCurrentDeck();
  }

  // Reverso estilizado de la tarjeta inteligente ejecutiva
  getCardBackHTML(deckType, cardCount = null, numeral = null) {
    const isPublic = deckType === "public";
    const sigilSVG = isPublic ? getSigilSVG("compass") : getSigilSVG("wave");
    const deckName = isPublic ? "PERFIL PÚBLICO" : "CONTACTO DIRECTO";
    const subTitle = isPublic ? "Proyectos & Portfolio" : "Canales Inmediatos";

    return `
      <div class="card-back-design ${isPublic ? 'back-solar' : 'back-lunar'}">
        <div class="tarot-border-outer">
          <div class="tarot-corner c-tl">◈</div>
          <div class="tarot-corner c-tr">◈</div>
          <div class="tarot-corner c-bl">◈</div>
          <div class="tarot-corner c-br">◈</div>
          <div class="tarot-border-inner">
            <div class="back-top-numeral">${numeral ? numeral : (cardCount ? cardCount + ' TARJETAS' : 'TUSUPERCARD')}</div>
            <div class="back-sigil-center">
              ${sigilSVG}
            </div>
            <div class="back-bottom-titles">
              <span class="back-deck-name">${deckName}</span>
              <span class="back-deck-sub">${subTitle}</span>
            </div>
          </div>
        </div>
        <div class="holographic-foil"></div>
      </div>
    `;
  }

  // Descubrir tarjeta aleatoria o primera de la baraja
  drawRandomCard() {
    const activeCards = this.getActiveCards();
    if (activeCards.length === 0) return;

    if (window.smartCardAudio) {
      window.smartCardAudio.playCardDraw();
    }

    const randomIndex = Math.floor(Math.random() * activeCards.length);
    const chosenCard = activeCards[randomIndex];

    this.revealCard(chosenCard);
  }

  // Revelar tarjeta en el escenario modal central con giro 3D y navegación
  revealCard(card) {
    this.currentDrawnCard = card;

    if (window.smartCardAudio) {
      setTimeout(() => window.smartCardAudio.playCardFlip(), 180);
    }

    const modal = this.activeCardModal;
    if (!modal) return;

    const activeCards = this.getActiveCards();
    const currentIndex = Math.max(0, activeCards.findIndex(c => c.id === card.id));
    const hasMultiple = activeCards.length > 1;

    modal.classList.add("active");
    modal.scrollTop = 0;
    window.syncBodyLock?.();
    modal.innerHTML = `
      <div class="card-reveal-backdrop" id="close-card-backdrop"></div>
      <button class="reveal-close-fab" id="reveal-close-fab" title="Cerrar (Escape)" aria-label="Cerrar tarjeta">✕</button>
      
      ${hasMultiple ? `
        <button class="modal-nav-btn prev-card-btn" id="modal-prev-btn" title="Tarjeta anterior (←)">‹</button>
        <button class="modal-nav-btn next-card-btn" id="modal-next-btn" title="Tarjeta siguiente (→)">›</button>
      ` : ''}

      <div class="card-reveal-container">
        <div class="card-3d-wrapper" id="revealed-card-3d" title="Haz clic sobre la tarjeta para girarla">
          <div class="card-flip-inner flipped" id="revealed-flip-inner">
            <!-- Reverso antes del giro -->
            <div class="card-face card-face-back">
              ${this.getCardBackHTML(card.deck, null, card.numeral)}
            </div>
            <!-- Frente con código QR y detalles -->
            <div class="card-face card-face-front" style="--card-accent: ${card.accentColor || '#3b82f6'};">
              ${this.getCardFrontHTML(card)}
            </div>
          </div>
        </div>

        ${hasMultiple ? `
          <!-- Navegación compacta (visible en móviles) -->
          <div class="card-nav-row">
            <button class="card-nav-mini" id="modal-prev-mini" aria-label="Tarjeta anterior">‹</button>
            <span class="card-nav-counter">
              ${currentIndex + 1} / ${activeCards.length}
              <small>Deslizá la tarjeta para cambiar</small>
            </span>
            <button class="card-nav-mini" id="modal-next-mini" aria-label="Tarjeta siguiente">›</button>
          </div>
        ` : ''}

        <!-- Barra de acciones directas -->
        <div class="card-reveal-actions">
          <a href="${this.escapeHTML(card.url)}" target="_blank" rel="noopener noreferrer" class="mystic-action-btn primary" id="open-portal-btn">
            <span class="action-icon">↗</span>
            <div class="action-text">
              <span class="action-title">Abrir Enlace</span>
              <span class="action-sub">Visitar en pestaña nueva</span>
            </div>
          </a>

          <button class="mystic-action-btn" id="flip-card-btn" title="Girar tarjeta (Espacio)">
            <span class="action-icon">🔄</span>
            <div class="action-text">
              <span class="action-title">Girar Tarjeta</span>
              <span class="action-sub">Ver reverso</span>
            </div>
          </button>

          <button class="mystic-action-btn" id="share-card-btn" title="Compartir enlace">
            <span class="action-icon">↗</span>
            <div class="action-text">
              <span class="action-title">Compartir</span>
              <span class="action-sub">Móvil y redes</span>
            </div>
          </button>

          <button class="mystic-action-btn" id="copy-link-btn" title="Copiar URL al portapapeles">
            <span class="action-icon">📋</span>
            <div class="action-text">
              <span class="action-title">Copiar Enlace</span>
              <span class="action-sub">Copiar al portapapeles</span>
            </div>
          </button>

          <button class="mystic-action-btn" id="download-qr-btn" title="Descargar tarjeta PNG con código QR">
            <span class="action-icon">📥</span>
            <div class="action-text">
              <span class="action-title">Descargar QR</span>
              <span class="action-sub">Guardar tarjeta PNG</span>
            </div>
          </button>

          <button class="mystic-action-btn return" id="return-deck-btn" title="Cerrar vista (Escape)">
            <span class="action-icon">✕</span>
            <div class="action-text">
              <span class="action-title">Cerrar</span>
              <span class="action-sub">Volver al catálogo</span>
            </div>
          </button>
        </div>
      </div>
    `;

    // Renderizar el código QR nítido
    this.renderCardQR(card, "revealed-qr-container");

    // Activar efecto de inclinación 3D sobre la tarjeta
    this.attach3DTiltEffect(document.getElementById("revealed-card-3d"));

    // Evento de giro
    const flipInner = document.getElementById("revealed-flip-inner");
    const toggleFlip = (e) => {
      if (e && e.target.closest("a, button, .qr-center-sigil")) return;
      if (flipInner) {
        flipInner.classList.toggle("is-back-shown");
        if (window.smartCardAudio) window.smartCardAudio.playCardFlip();
      }
    };

    document.getElementById("revealed-card-3d")?.addEventListener("click", toggleFlip);
    document.getElementById("flip-card-btn")?.addEventListener("click", () => {
      if (flipInner) {
        flipInner.classList.toggle("is-back-shown");
        if (window.smartCardAudio) window.smartCardAudio.playCardFlip();
      }
    });

    // Navegación anterior / siguiente
    document.getElementById("modal-prev-btn")?.addEventListener("click", () => {
      this.navigateCard(-1);
    });
    document.getElementById("modal-next-btn")?.addEventListener("click", () => {
      this.navigateCard(1);
    });
    document.getElementById("modal-prev-mini")?.addEventListener("click", () => {
      this.navigateCard(-1);
    });
    document.getElementById("modal-next-mini")?.addEventListener("click", () => {
      this.navigateCard(1);
    });

    // Eventos de botones
    document.getElementById("close-card-backdrop")?.addEventListener("click", () => this.closeRevealModal());
    document.getElementById("reveal-close-fab")?.addEventListener("click", () => this.closeRevealModal());
    document.getElementById("return-deck-btn")?.addEventListener("click", () => this.closeRevealModal());

    document.getElementById("open-portal-btn")?.addEventListener("click", () => {
      if (window.smartCardAudio) window.smartCardAudio.playPortalChime();
    });

    document.getElementById("share-card-btn")?.addEventListener("click", () => {
      this.shareCard(card);
    });

    document.getElementById("copy-link-btn")?.addEventListener("click", () => {
      this.copyCardLink(card.url);
    });

    document.getElementById("download-qr-btn")?.addEventListener("click", () => {
      this.downloadCardQR(card);
    });

    // Soporte de gestos táctiles (Swipe horizontal sin bloquear el scroll vertical)
    const cardWrapper = document.getElementById("revealed-card-3d");
    if (cardWrapper) {
      cardWrapper.addEventListener("touchstart", (e) => {
        this.touchStartX = e.changedTouches[0].clientX;
        this.touchStartY = e.changedTouches[0].clientY;
      }, { passive: true });

      cardWrapper.addEventListener("touchend", (e) => {
        this.touchEndX = e.changedTouches[0].clientX;
        const diffX = this.touchEndX - this.touchStartX;
        const diffY = e.changedTouches[0].clientY - this.touchStartY;
        // Solo cuenta como swipe si el gesto es claramente horizontal
        if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          if (diffX > 0) {
            this.navigateCard(-1); // Swipe derecha -> anterior
          } else {
            this.navigateCard(1);  // Swipe izquierda -> siguiente
          }
        }
      }, { passive: true });
    }
  }

  // Navegar a la tarjeta anterior o siguiente
  navigateCard(direction) {
    const activeCards = this.getActiveCards();
    if (activeCards.length === 0) return;

    let index = activeCards.findIndex(c => c.id === this.currentDrawnCard?.id);
    if (index === -1) index = 0;

    let nextIndex = (index + direction + activeCards.length) % activeCards.length;
    this.revealCard(activeCards[nextIndex]);
  }

  // Compartir tarjeta con Web Share API o fallback al portapapeles
  shareCard(card) {
    const shareData = {
      title: `${card.title} · ${card.archetype}`,
      text: `${card.destination || card.title} - TuSuperCard`,
      url: card.url
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => {
          if (window.smartCardAudio) window.smartCardAudio.playPortalChime();
          window.supportWidget?.nudge();
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            this.copyCardLink(card.url);
          }
        });
    } else {
      this.copyCardLink(card.url);
    }
  }

  // Frente de la tarjeta inteligente
  getCardFrontHTML(card) {
    const sigilSVG = getSigilSVG(card.sigil || "compass");
    const cleanUrl = this.formatDisplayURL(card.url);

    return `
      <div class="tarot-card-front glow-${card.glowType || 'sapphire'}">
        <div class="tarot-border-outer">
          <div class="tarot-corner c-tl">◈</div>
          <div class="tarot-corner c-tr">◈</div>
          <div class="tarot-corner c-bl">◈</div>
          <div class="tarot-corner c-br">◈</div>
          <div class="tarot-border-inner">

            <!-- Encabezado de la Tarjeta -->
            <div class="front-card-header">
              <span class="card-numeral">${card.numeral || '01'}</span>
              <span class="card-archetype">${this.escapeHTML(card.archetype || 'ENLACE')}</span>
              <span class="card-category-badge">${this.escapeHTML(card.category || 'General')}</span>
            </div>

            <!-- Título y Descripción -->
            <div class="front-card-meta">
              <h2 class="front-card-title">${this.escapeHTML(card.title)}</h2>
              <p class="front-card-dest">${this.escapeHTML(card.destination || 'Acceso directo')}</p>
            </div>

            <!-- Contenedor del Código QR -->
            <div class="front-qr-portal-wrap">
              <div class="qr-celestial-ring"></div>
              <div class="qr-altar-frame">
                <div id="revealed-qr-container" class="qr-svg-holder"></div>
                <div class="qr-center-sigil">${sigilSVG}</div>
              </div>
            </div>

            <!-- Acceso Directo / URL -->
            <div class="front-destination-portal">
              <div class="portal-heading">
                <span class="portal-glyph">🔗</span> DESTINO DEL ENLACE
              </div>
              <div class="portal-url-display" title="${this.escapeHTML(card.url)}">
                ${this.escapeHTML(cleanUrl)}
              </div>
            </div>

          </div>
        </div>
        <div class="holographic-foil"></div>
      </div>
    `;
  }

  // Genera el código QR nítido con soporte UTF-8 completo
  renderCardQR(card, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const qr = qrcode(0, 'M');
      let safeUrl = card.url || "";
      try {
        safeUrl = unescape(encodeURIComponent(safeUrl));
      } catch (e) {
        safeUrl = card.url;
      }

      qr.addData(safeUrl);
      qr.make();

      const cellSize = 6;
      const margin = 2;
      const svgString = qr.createSvgTag(cellSize, margin);

      container.innerHTML = svgString;

      const svgEl = container.querySelector("svg");
      if (svgEl) {
        svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svgEl.classList.add("crisp-qr-svg");
      }
    } catch (e) {
      console.error("Error generando código QR:", e);
      container.innerHTML = `<div class="qr-error" style="color:#f87171;font-size:0.75rem;text-align:center;padding:10px;">Código QR no disponible</div>`;
    }
  }

  // Inclinación 3D y brillo holográfico al mover el ratón
  attach3DTiltEffect(cardElement) {
    if (!cardElement) return;

    const handleMove = (e) => {
      const rect = cardElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      const foil = cardElement.querySelector(".holographic-foil");
      if (foil) {
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        foil.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.35) 0%, rgba(59,130,246,0.18) 35%, transparent 70%)`;
      }
    };

    const handleLeave = () => {
      cardElement.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      const foil = cardElement.querySelector(".holographic-foil");
      if (foil) {
        foil.style.background = "none";
      }
    };

    cardElement.addEventListener("mousemove", handleMove);
    cardElement.addEventListener("mouseleave", handleLeave);
  }

  closeRevealModal() {
    if (this.activeCardModal) {
      this.activeCardModal.classList.remove("active");
      this.activeCardModal.innerHTML = "";
    }
    window.syncBodyLock?.();
  }

  copyCardLink(url) {
    if (!navigator.clipboard) {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    } else {
      navigator.clipboard.writeText(url);
    }

    if (window.smartCardAudio) window.smartCardAudio.playPortalChime();
    window.showToast("✓ ¡Enlace copiado al portapapeles!");
  }

  // Descarga la tarjeta en PNG de alta resolución con diseño de tarjeta inteligente ejecutiva
  downloadCardQR(card) {
    try {
      const qr = qrcode(0, 'H'); // Máxima corrección de error
      let safeUrl = card.url || "";
      try {
        safeUrl = unescape(encodeURIComponent(safeUrl));
      } catch (e) {
        safeUrl = card.url;
      }
      qr.addData(safeUrl);
      qr.make();

      const canvas = document.createElement("canvas");
      const width = 640;
      const height = 940;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // 1. Fondo Degradado Ejecutivo Tech (Obsidiana y Cobalto)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#080c16");
      bgGrad.addColorStop(0.5, "#0e172a");
      bgGrad.addColorStop(1, "#030712");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Marco exterior sutil y fino
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(28, 28, width - 56, height - 56);

      // Acentos en las esquinas
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("◈", 38, 44);
      ctx.fillText("◈", width - 38, 44);
      ctx.fillText("◈", 38, height - 34);
      ctx.fillText("◈", width - 38, height - 34);

      // 2. Encabezado de la Tarjeta: Código y Tipo
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 15px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`${card.numeral || '01'} · ${(card.archetype || 'ENLACE').toUpperCase()}`, width / 2, 75);

      // Categoría
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`— ${(card.category || 'PROFESIONAL').toUpperCase()} —`, width / 2, 100);

      // 3. Título Principal
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(card.title || "TuSuperCard", width / 2, 145);

      // Subtítulo / Destino
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "15px sans-serif";
      ctx.fillText(card.destination || "Acceso directo", width / 2, 175);

      // 4. Marco Blanco y Contenedor del Código QR
      const qrBoxSize = 340;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 215;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
      ctx.fill();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Módulos del código QR
      const moduleCount = qr.getModuleCount();
      const qrMargin = 22;
      const qrInnerSize = qrBoxSize - (qrMargin * 2);
      const cellSize = qrInnerSize / moduleCount;

      ctx.fillStyle = "#090d16";
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect(
              qrBoxX + qrMargin + (col * cellSize),
              qrBoxY + qrMargin + (row * cellSize),
              cellSize + 0.3,
              cellSize + 0.3
            );
          }
        }
      }

      // 5. Destino del Enlace
      const urlBoxY = 600;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(50, urlBoxY, width - 100, 75, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("🔗 DESTINO DEL ENLACE", width / 2, urlBoxY + 28);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "14px monospace";
      const cleanUrl = this.formatDisplayURL(card.url);
      ctx.fillText(cleanUrl, width / 2, urlBoxY + 54);

      // 6. Pie de Tarjeta
      ctx.fillStyle = "#60a5fa";
      ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("TUSUPERCARD · SMART DIGITAL CARD", width / 2, 730);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      ctx.fillText("Escanea el código QR con la cámara de tu smartphone para acceder directo.", width / 2, 755);

      // Descarga automática en PNG
      const link = document.createElement("a");
      const safeTitle = (card.title || "tarjeta").toLowerCase().replace(/[^a-z0-9]/g, "_");
      link.download = `TuSuperCard_${safeTitle}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (window.smartCardAudio) window.smartCardAudio.playPortalChime();
      window.showToast("✓ ¡Tarjeta digital PNG descargada!");
      window.supportWidget?.nudge();
    } catch (e) {
      console.error("Error al exportar tarjeta QR:", e);
      window.showToast("Error al exportar la tarjeta.");
    }
  }

  // Renderizar la vista de catálogo completo con buscador y filtros
  renderGrimorio() {
    if (!this.grimorioContainer) return;

    if (this.grimorioSearchQuery === undefined) this.grimorioSearchQuery = "";
    if (this.grimorioActiveCategory === undefined) this.grimorioActiveCategory = "all";

    this.renderGrimorioFilterPills();
    this.renderGrimorioCards();
    this.setupGrimorioSearchEvents();
  }

  // Píldoras de filtro por categoría
  renderGrimorioFilterPills() {
    const pillsContainer = document.getElementById("grimorio-category-pills");
    if (!pillsContainer) return;

    const allActiveCards = this.getActiveCards();
    const categories = Array.from(new Set(allActiveCards.map(c => c.category || "General").filter(Boolean)));

    pillsContainer.innerHTML = `
      <button class="filter-pill ${this.grimorioActiveCategory === 'all' ? 'active' : ''}" data-cat="all">
        Todos (${allActiveCards.length})
      </button>
      ${categories.map(cat => {
        const count = allActiveCards.filter(c => (c.category || "General") === cat).length;
        const isActive = this.grimorioActiveCategory === cat;
        return `
          <button class="filter-pill ${isActive ? 'active' : ''}" data-cat="${this.escapeHTML(cat)}">
            ${this.escapeHTML(cat)} (${count})
          </button>
        `;
      }).join("")}
    `;

    pillsContainer.querySelectorAll(".filter-pill").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.grimorioActiveCategory = e.currentTarget.dataset.cat;
        this.renderGrimorioFilterPills();
        this.renderGrimorioCards();
        if (window.smartCardAudio) window.smartCardAudio.playShuffle();
      });
    });
  }

  // Eventos del buscador en tiempo real
  setupGrimorioSearchEvents() {
    const searchInput = document.getElementById("grimorio-search-input");
    const clearBtn = document.getElementById("grimorio-clear-btn");

    if (searchInput && !searchInput.dataset.initialized) {
      searchInput.dataset.initialized = "true";
      searchInput.addEventListener("input", (e) => {
        this.grimorioSearchQuery = e.target.value.trim().toLowerCase();
        if (clearBtn) clearBtn.style.display = this.grimorioSearchQuery ? "block" : "none";
        this.renderGrimorioCards();
      });
    }

    if (clearBtn && !clearBtn.dataset.initialized) {
      clearBtn.dataset.initialized = "true";
      clearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        this.grimorioSearchQuery = "";
        clearBtn.style.display = "none";
        this.renderGrimorioCards();
      });
    }
  }

  // Renderiza la cuadrícula de tarjetas filtradas
  renderGrimorioCards() {
    if (!this.grimorioContainer) return;
    this.grimorioContainer.innerHTML = "";

    const activeCards = this.getActiveCards();
    const query = this.grimorioSearchQuery || "";
    const category = this.grimorioActiveCategory || "all";

    const filtered = activeCards.filter(card => {
      const matchCat = category === "all" || (card.category || "General") === category;
      if (!matchCat) return false;

      if (!query) return true;
      const searchBlob = `${card.title || ''} ${card.archetype || ''} ${card.numeral || ''} ${card.destination || ''} ${card.category || ''} ${card.url || ''}`.toLowerCase();
      return searchBlob.includes(query);
    });

    if (filtered.length === 0) {
      this.grimorioContainer.innerHTML = `
        <div class="empty-deck-notice" style="grid-column: 1 / -1;">
          <div class="empty-sigil">🔍</div>
          <p class="empty-title">No se encontraron tarjetas</p>
          <p class="empty-desc">No hay resultados para "${this.escapeHTML(query)}". Prueba con otros términos o selecciona otra categoría.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(card => {
      const cardItem = document.createElement("div");
      cardItem.className = `grimorio-card-item glow-${card.glowType || 'sapphire'}`;
      cardItem.innerHTML = `
        <div class="grimorio-card-inner">
          <div class="grimorio-header">
            <span class="grimorio-num">${card.numeral}</span>
            <span class="grimorio-archetype">${this.escapeHTML(card.archetype)}</span>
          </div>
          <div class="grimorio-qr-box" id="grimorio-qr-${card.id}"></div>
          <h3 class="grimorio-title">${this.escapeHTML(card.title)}</h3>
          <p class="grimorio-dest">${this.escapeHTML(card.destination || '')}</p>
          <div class="grimorio-footer">
            <span class="grimorio-url">${this.escapeHTML(this.formatDisplayURL(card.url))}</span>
          </div>
        </div>
      `;

      cardItem.addEventListener("click", () => {
        this.revealCard(card);
      });

      this.grimorioContainer.appendChild(cardItem);
      this.renderCardQR(card, `grimorio-qr-${card.id}`);
    });
  }

  setupDeckInteractions() {
    // Re-renderizar el abanico/carrusel al cruzar el breakpoint (rotación de pantalla, resize)
    const onCompactChange = () => {
      if (this.viewMode === "spread") this.renderCurrentDeck();
    };
    if (this.compactQuery.addEventListener) {
      this.compactQuery.addEventListener("change", onCompactChange);
    } else if (this.compactQuery.addListener) {
      this.compactQuery.addListener(onCompactChange);
    }

    // Atajos de teclado accesibles
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

      const isModalOpen = this.activeCardModal?.classList.contains("active");

      if (e.key === "Escape") {
        if (isModalOpen) {
          this.closeRevealModal();
        } else {
          const altar = document.getElementById("altar-modal");
          if (altar && altar.classList.contains("open")) {
            window.smartCardApp?.closeAltarModal();
          }
        }
      } else if (isModalOpen) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.navigateCard(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          this.navigateCard(1);
        } else if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          const flipInner = document.getElementById("revealed-flip-inner");
          if (flipInner) {
            flipInner.classList.toggle("is-back-shown");
            if (window.smartCardAudio) window.smartCardAudio.playCardFlip();
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          document.getElementById("open-portal-btn")?.click();
        }
      }
    });
  }

  formatDisplayURL(url) {
    if (!url) return "";
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }

  escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

window.deckEngine = new DeckEngine();
