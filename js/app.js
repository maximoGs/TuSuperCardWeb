/**
 * ============================================================================
 * TUSUPERCARD - CONTROLADOR PRINCIPAL Y PANEL DE GESTIÓN
 * ============================================================================
 * Coordina la interfaz, las vistas, las notificaciones y el panel de edición
 * para que cualquier persona pueda personalizar sus tarjetas en 1 clic.
 */

class SmartCardApp {
  constructor() {
    this.config = null;
    this.cards = [];
    this.activeView = "deck"; // 'deck' | 'grimorio'
    this.editingCardId = null;
  }

  init() {
    this.config = CardStorageManager.getConfig();
    this.cards = CardStorageManager.getCards();

    this.applyConfig();
    this.setupEventListeners();
    this.updateCardCounts();

    // Iniciar motor de baraja 3D
    window.deckEngine.init(this.cards);
  }

  applyConfig() {
    const ownerEl = document.getElementById("owner-name-display");
    const titleEl = document.getElementById("oracle-title-display");
    const subEl = document.getElementById("oracle-sub-display");
    const bioEl = document.getElementById("oracle-bio-display");

    if (ownerEl) ownerEl.textContent = this.config.ownerName || "Máximo";
    if (titleEl) titleEl.textContent = this.config.oracleTitle || "TuSuperCard";
    if (subEl) subEl.textContent = this.config.oracleSubtitle || "Smart Digital Business Cards";
    if (bioEl) bioEl.textContent = this.config.bio || "Tarjeta de presentación digital interactiva. Selecciona cualquier tarjeta para explorar proyectos, copiar enlaces o escanear su código QR al instante.";

    // Estado del botón de audio
    this.updateAudioButtonUI();
  }

  updateCardCounts() {
    const pubCount = this.cards.filter(c => c.deck === "public").length;
    const privCount = this.cards.filter(c => c.deck === "personal").length;

    const pubBadge = document.getElementById("count-public-deck");
    const privBadge = document.getElementById("count-personal-deck");

    if (pubBadge) pubBadge.textContent = `${pubCount} tarjetas`;
    if (privBadge) privBadge.textContent = `${privCount} tarjetas`;
  }

  setupEventListeners() {
    // Selector de Secciones (Perfil Público vs Contacto Directo)
    document.querySelectorAll(".deck-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const deckType = e.currentTarget.dataset.deck;
        window.deckEngine.switchDeck(deckType);
      });
    });

    // Selector de Modo de Vista (Baraja 3D vs Catálogo Cuadrícula)
    document.getElementById("view-deck-btn")?.addEventListener("click", () => {
      this.switchViewMode("deck");
    });
    document.getElementById("view-grimorio-btn")?.addEventListener("click", () => {
      this.switchViewMode("grimorio");
    });

    // Botón de Sonido
    document.getElementById("toggle-audio-btn")?.addEventListener("click", () => {
      const isMuted = window.smartCardAudio.toggleMute();
      this.updateAudioButtonUI();
      window.showToast(isMuted ? "Sonido silenciado" : "Efectos de sonido activados");
    });

    // Abrir / Cerrar Panel de Control
    document.getElementById("open-altar-btn")?.addEventListener("click", () => {
      this.openAltarModal();
    });
    document.getElementById("close-altar-btn")?.addEventListener("click", () => {
      this.closeAltarModal();
    });
    document.getElementById("altar-backdrop")?.addEventListener("click", () => {
      this.closeAltarModal();
    });

    // Pestañas del Panel de Control
    document.querySelectorAll(".altar-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchAltarTab(tab);
      });
    });

    // Formulario de Identidad / Perfil
    document.getElementById("altar-identity-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveIdentityFromForm();
    });

    // Formulario de Tarjetas (Añadir / Editar)
    document.getElementById("altar-card-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveCardFromForm();
    });

    document.getElementById("new-card-btn")?.addEventListener("click", () => {
      this.resetCardForm();
    });

    // Exportar / Importar / Reiniciar
    document.getElementById("export-config-btn")?.addEventListener("click", () => {
      this.exportConfigJS();
    });
    document.getElementById("copy-json-btn")?.addEventListener("click", () => {
      this.copyConfigJSON();
    });
    document.getElementById("import-json-btn")?.addEventListener("click", () => {
      this.importConfigJSON();
    });
    document.getElementById("reset-defaults-btn")?.addEventListener("click", () => {
      this.resetToDefaults();
    });

    // Filtros de colección en el panel
    document.getElementById("altar-deck-filter")?.addEventListener("change", (e) => {
      this.renderAltarCardList(e.target.value);
    });
  }

  switchAltarTab(tabName) {
    document.querySelectorAll(".altar-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    document.querySelectorAll(".altar-tab-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === `tab-panel-${tabName}`);
    });

    if (window.smartCardAudio) window.smartCardAudio.playShuffle();
  }

  updateAudioButtonUI() {
    const btn = document.getElementById("toggle-audio-btn");
    if (!btn) return;
    const muted = window.smartCardAudio.isMuted();
    btn.innerHTML = muted 
      ? `<span class="icon">🔇</span> <span class="label">Silenciado</span>`
      : `<span class="icon">🔔</span> <span class="label">Sonido</span>`;
    btn.classList.toggle("muted", muted);
  }

  switchViewMode(mode) {
    this.activeView = mode;
    window.deckEngine.viewMode = mode;

    document.getElementById("view-deck-btn")?.classList.toggle("active", mode === "deck");
    document.getElementById("view-grimorio-btn")?.classList.toggle("active", mode === "grimorio");

    document.getElementById("deck-stage")?.classList.toggle("hidden", mode !== "deck");
    document.getElementById("grimorio-stage")?.classList.toggle("hidden", mode !== "grimorio");

    if (mode === "grimorio") {
      window.deckEngine.renderGrimorio();
    } else {
      window.deckEngine.renderCurrentDeck();
    }

    if (window.smartCardAudio) window.smartCardAudio.playShuffle();
  }

  // ==========================================
  // PANEL DE GESTIÓN Y CREADOR DE TARJETAS
  // ==========================================

  openAltarModal() {
    const modal = document.getElementById("altar-modal");
    if (!modal) return;
    modal.classList.add("open");
    window.syncBodyLock?.();

    // Llenar formulario de Identidad
    const ownerInput = document.getElementById("identity-owner-name");
    const titleInput = document.getElementById("identity-oracle-title");
    const subInput = document.getElementById("identity-oracle-sub");
    const bioInput = document.getElementById("identity-bio");

    if (ownerInput) ownerInput.value = this.config.ownerName || "";
    if (titleInput) titleInput.value = this.config.oracleTitle || "";
    if (subInput) subInput.value = this.config.oracleSubtitle || "";
    if (bioInput) bioInput.value = this.config.bio || "";

    this.renderAltarCardList("all");
    this.resetCardForm();
  }

  saveIdentityFromForm() {
    const ownerName = document.getElementById("identity-owner-name")?.value.trim() || "Máximo";
    const oracleTitle = document.getElementById("identity-oracle-title")?.value.trim() || "TuSuperCard";
    const oracleSubtitle = document.getElementById("identity-oracle-sub")?.value.trim() || "Smart Digital Business Cards";
    const bio = document.getElementById("identity-bio")?.value.trim() || "";

    this.config = {
      ...this.config,
      ownerName,
      oracleTitle,
      oracleSubtitle,
      bio
    };

    CardStorageManager.saveConfig(this.config);
    this.applyConfig();

    if (window.smartCardAudio) window.smartCardAudio.playPortalChime();
    window.showToast("✓ Información de perfil guardada con éxito");
  }

  closeAltarModal() {
    const modal = document.getElementById("altar-modal");
    if (modal) modal.classList.remove("open");
    window.syncBodyLock?.();
  }

  renderAltarCardList(filterDeck = "all") {
    const listContainer = document.getElementById("altar-cards-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    const filtered = filterDeck === "all" 
      ? this.cards 
      : this.cards.filter(c => c.deck === filterDeck);

    if (filtered.length === 0) {
      listContainer.innerHTML = `<p class="altar-empty">No hay tarjetas en esta categoría.</p>`;
      return;
    }

    filtered.forEach(card => {
      const item = document.createElement("div");
      item.className = `altar-card-row deck-${card.deck}`;
      item.innerHTML = `
        <div class="row-info">
          <span class="row-deck-badge ${card.deck === 'public' ? 'solar' : 'lunar'}">
            ${card.deck === 'public' ? 'PÚBLICO' : 'DIRECTO'}
          </span>
          <span class="row-num">${card.numeral || '01'}</span>
          <div class="row-titles">
            <strong>${this.escapeHTML(card.title)}</strong>
            <small>${this.escapeHTML(card.destination || card.url)}</small>
          </div>
        </div>
        <div class="row-actions">
          <button class="row-btn edit-btn" title="Editar tarjeta">✎</button>
          <button class="row-btn delete-btn" title="Eliminar tarjeta">✕</button>
        </div>
      `;

      item.querySelector(".edit-btn")?.addEventListener("click", () => {
        this.loadCardIntoForm(card);
      });

      item.querySelector(".delete-btn")?.addEventListener("click", () => {
        this.deleteCard(card.id);
      });

      listContainer.appendChild(item);
    });
  }

  loadCardIntoForm(card) {
    this.editingCardId = card.id;

    document.getElementById("form-card-deck").value = card.deck || "public";
    document.getElementById("form-card-numeral").value = card.numeral || "01";
    document.getElementById("form-card-archetype").value = card.archetype || "PORTFOLIO";
    document.getElementById("form-card-title").value = card.title || "";
    document.getElementById("form-card-dest").value = card.destination || "";
    document.getElementById("form-card-url").value = card.url || "";
    document.getElementById("form-card-category").value = card.category || "General";
    document.getElementById("form-card-sigil").value = card.sigil || "code";
    document.getElementById("form-card-color").value = card.accentColor || "#3b82f6";

    const submitBtn = document.getElementById("form-submit-btn");
    if (submitBtn) {
      submitBtn.innerHTML = `<span class="btn-sigil">✓</span> Actualizar Tarjeta`;
    }

    document.getElementById("altar-form-section")?.scrollIntoView({ behavior: "smooth" });
  }

  resetCardForm() {
    this.editingCardId = null;
    document.getElementById("altar-card-form")?.reset();
    document.getElementById("form-card-deck").value = window.deckEngine.activeDeckType || "public";
    document.getElementById("form-card-color").value = "#3b82f6";

    const submitBtn = document.getElementById("form-submit-btn");
    if (submitBtn) {
      submitBtn.innerHTML = `<span class="btn-sigil">✓</span> Guardar Tarjeta`;
    }
  }

  saveCardFromForm() {
    const deck = document.getElementById("form-card-deck").value;
    const numeral = document.getElementById("form-card-numeral").value.trim() || "01";
    const archetype = document.getElementById("form-card-archetype").value.trim().toUpperCase() || "ENLACE";
    const title = document.getElementById("form-card-title").value.trim();
    const destination = document.getElementById("form-card-dest").value.trim() || "Acceso directo";
    const url = document.getElementById("form-card-url").value.trim();
    const category = document.getElementById("form-card-category").value.trim() || "General";
    const sigil = document.getElementById("form-card-sigil").value;
    const accentColor = document.getElementById("form-card-color").value;

    if (!title || !url) {
      window.showToast("Debes ingresar un título y una URL válida.");
      return;
    }

    const glowType = deck === "public" ? "sapphire" : "emerald";

    if (this.editingCardId) {
      // Actualizar tarjeta existente
      const index = this.cards.findIndex(c => c.id === this.editingCardId);
      if (index !== -1) {
        this.cards[index] = {
          ...this.cards[index],
          deck,
          numeral,
          archetype,
          title,
          destination,
          url,
          category,
          sigil,
          accentColor,
          glowType
        };
        window.showToast("✓ Tarjeta actualizada con éxito");
      }
    } else {
      // Crear nueva tarjeta
      const newCard = {
        id: "card-" + Date.now(),
        deck,
        numeral,
        archetype,
        title,
        destination,
        url,
        category,
        sigil,
        accentColor,
        glowType
      };
      this.cards.push(newCard);
      window.showToast("✓ Tarjeta creada con éxito");
    }

    CardStorageManager.saveCards(this.cards);
    this.updateCardCounts();
    window.deckEngine.setCards(this.cards);
    this.renderAltarCardList(document.getElementById("altar-deck-filter")?.value || "all");
    this.resetCardForm();
  }

  deleteCard(cardId) {
    if (!confirm("¿Deseas eliminar esta tarjeta?")) return;

    this.cards = this.cards.filter(c => c.id !== cardId);
    CardStorageManager.saveCards(this.cards);
    this.updateCardCounts();
    window.deckEngine.setCards(this.cards);
    this.renderAltarCardList(document.getElementById("altar-deck-filter")?.value || "all");

    if (this.editingCardId === cardId) {
      this.resetCardForm();
    }

    window.showToast("Tarjeta eliminada.");
  }

  resetToDefaults() {
    if (!confirm("¿Restaurar las tarjetas predeterminadas? Se perderán las modificaciones no respaldadas.")) return;

    const res = CardStorageManager.resetToDefaults();
    this.cards = res.cards;
    this.config = res.config;
    this.applyConfig();
    this.updateCardCounts();
    window.deckEngine.setCards(this.cards);
    this.renderAltarCardList("all");
    this.resetCardForm();

    window.showToast("✓ Valores originales restablecidos");
  }

  // Descargar archivo js/cards-data.js listo para GitHub
  exportConfigJS() {
    const fileContent = `/**
 * ============================================================================
 * TUSUPERCARD - DATOS Y CONFIGURACIÓN
 * ============================================================================
 * Generado automáticamente por el Panel de Control.
 */

const DEFAULT_CONFIG = ${JSON.stringify(this.config, null, 2)};

const DEFAULT_CARDS = ${JSON.stringify(this.cards, null, 2)};

${CardStorageManager.toString()}
`;

    const blob = new Blob([fileContent], { type: "application/javascript;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cards-data.js";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.showToast("✓ Archivo cards-data.js descargado listo para desplegar");
  }

  copyConfigJSON() {
    const jsonStr = JSON.stringify({ config: this.config, cards: this.cards }, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      window.showToast("✓ Configuración JSON copiada al portapapeles");
    } else {
      prompt("Copia tu configuración JSON:", jsonStr);
    }
  }

  importConfigJSON() {
    const input = prompt("Pega aquí tu configuración JSON de tarjetas:");
    if (!input) return;

    try {
      const parsed = JSON.parse(input);
      if (parsed.cards && Array.isArray(parsed.cards)) {
        this.cards = parsed.cards;
        if (parsed.config) this.config = { ...this.config, ...parsed.config };

        CardStorageManager.saveCards(this.cards);
        CardStorageManager.saveConfig(this.config);

        this.applyConfig();
        this.updateCardCounts();
        window.deckEngine.setCards(this.cards);
        this.renderAltarCardList("all");

        window.showToast("✓ Tarjetas y configuración importadas con éxito");
      } else {
        alert("El formato JSON no contiene una lista de 'cards' válida.");
      }
    } catch (e) {
      alert("Error al procesar el JSON: " + e.message);
    }
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

// Sincronizador de bloqueo de scroll del fondo cuando hay modales abiertos
window.syncBodyLock = function() {
  const cardModalActive = document.getElementById("card-reveal-stage")?.classList.contains("active");
  const altarModalOpen = document.getElementById("altar-modal")?.classList.contains("open");
  const supportModalOpen = document.getElementById("support-modal")?.classList.contains("open");

  if (cardModalActive || altarModalOpen || supportModalOpen) {
    document.body.classList.add("modal-open");
  } else {
    document.body.classList.remove("modal-open");
  }
};

// ==========================================
// WIDGET DE VALORACIÓN & APOYO (ALIAS: EL.MISTICO)
// ==========================================
class SupportWidget {
  constructor() {
    this.modal = document.getElementById("support-modal");
    this.openBtn = document.getElementById("open-support-btn");
    this.closeBtn = document.getElementById("close-support-btn");
    this.backdrop = document.getElementById("support-backdrop");
    this.copyBtn = document.getElementById("support-copy-alias-btn");
    this.confirmBtn = document.getElementById("support-confirm-copy");
    this.alias = "el.mistico";

    this.init();
  }

  init() {
    if (!this.modal) return;

    this.openBtn?.addEventListener("click", () => this.open());
    this.closeBtn?.addEventListener("click", () => this.close());
    this.backdrop?.addEventListener("click", () => this.close());

    this.copyBtn?.addEventListener("click", () => this.copyAlias());
    this.confirmBtn?.addEventListener("click", () => this.copyAlias());

    // Soporte para cerrar con tecla Escape
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("open")) {
        this.close();
      }
    });
  }

  open() {
    this.modal?.classList.add("open");
    window.syncBodyLock?.();
    if (window.smartCardAudio) window.smartCardAudio.playShuffle();
  }

  close() {
    this.modal?.classList.remove("open");
    window.syncBodyLock?.();
  }

  copyAlias() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.alias);
    } else {
      const input = document.createElement("input");
      input.value = this.alias;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    if (window.smartCardAudio) window.smartCardAudio.playPortalChime();
    window.showToast(`✓ Alias "${this.alias}" copiado al portapapeles`);

    // Feedback visual en el botón
    const labelSpan = this.copyBtn?.querySelector(".copy-label");
    if (labelSpan) {
      const oldText = labelSpan.textContent;
      labelSpan.textContent = "¡Copiado! ✓";
      this.copyBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      setTimeout(() => {
        labelSpan.textContent = oldText;
        this.copyBtn.style.background = "";
      }, 2200);
    }

    if (this.confirmBtn) {
      const oldConfirm = this.confirmBtn.innerHTML;
      this.confirmBtn.innerHTML = `<span class="btn-sigil">✓</span> ¡Alias "${this.alias}" Copiado!`;
      setTimeout(() => {
        this.confirmBtn.innerHTML = oldConfirm;
      }, 2200);
    }
  }

  // Micro-animación que atrae la atención de forma sutil tras compartir o descargar
  nudge() {
    if (!this.openBtn) return;
    this.openBtn.classList.remove("nudge-pulse");
    // Forzar reflow
    void this.openBtn.offsetWidth;
    this.openBtn.classList.add("nudge-pulse");
  }
}

// Toast de notificación
window.showToast = function(message) {
  let toast = document.getElementById("mystic-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "mystic-toast";
    toast.className = "mystic-toast";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="toast-sigil">✦</span> ${message}`;
  toast.classList.add("visible");

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2800);
};

// Iniciar aplicación al cargar el DOM con alias de retrocompatibilidad
window.addEventListener("DOMContentLoaded", () => {
  window.smartCardApp = new SmartCardApp();
  window.oracleApp = window.smartCardApp;
  window.smartCardApp.init();

  window.supportWidget = new SupportWidget();
});
