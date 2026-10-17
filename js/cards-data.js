/**
 * ============================================================================
 * TUSUPERCARD - CONFIGURACIÓN Y BASE DE DATOS PREDETERMINADA
 * ============================================================================
 * Define las tarjetas iniciales de presentación, la información de perfil
 * y el gestor de almacenamiento local para edición en tiempo real.
 */

const DEFAULT_CONFIG = {
  ownerName: "Máximo",
  oracleTitle: "TuSuperCard",
  oracleSubtitle: "Smart Digital Business Cards & QR Hub",
  bio: "Tarjeta de presentación digital interactiva. Selecciona cualquier tarjeta para explorar proyectos, copiar enlaces directos o escanear su código QR al instante.",
  soundEnabled: true,
  theme: "professional-dark"
};

const DEFAULT_CARDS = [
  // ==========================================
  // PERFIL PÚBLICO & PROYECTOS
  // ==========================================
  {
    id: "pub-1",
    deck: "public",
    numeral: "01",
    archetype: "PORTFOLIO",
    title: "Sitio Web & Proyectos",
    destination: "Casos de estudio, arquitectura y desarrollos",
    url: "https://github.com/maximoGs",
    category: "Proyectos",
    accentColor: "#3b82f6",
    sigil: "code",
    glowType: "sapphire"
  },
  {
    id: "pub-2",
    deck: "public",
    numeral: "02",
    archetype: "REPOSITORIOS",
    title: "GitHub Oficial",
    destination: "Librerías, código abierto y contribuciones",
    url: "https://github.com/maximoGs",
    category: "Desarrollo",
    accentColor: "#06b6d4",
    sigil: "github",
    glowType: "emerald"
  },
  {
    id: "pub-3",
    deck: "public",
    numeral: "03",
    archetype: "NETWORKING",
    title: "LinkedIn Ejecutivo",
    destination: "Trayectoria laboral, experiencia y colaboraciones",
    url: "https://www.linkedin.com/",
    category: "Carrera",
    accentColor: "#0284c7",
    sigil: "linkedin",
    glowType: "sapphire"
  },
  {
    id: "pub-4",
    deck: "public",
    numeral: "04",
    archetype: "CV / RESUME",
    title: "Currículum Vitae",
    destination: "Dossier profesional y certificaciones técnicas",
    url: "https://drive.google.com/",
    category: "Trayectoria",
    accentColor: "#6366f1",
    sigil: "scroll",
    glowType: "amethyst"
  },
  {
    id: "pub-5",
    deck: "public",
    numeral: "05",
    archetype: "REUNIONES",
    title: "Calendly / Meet",
    destination: "Agendar videollamada o sesión técnica 1 a 1",
    url: "https://calendly.com/",
    category: "Agenda",
    accentColor: "#10b981",
    sigil: "hourglass",
    glowType: "emerald"
  },
  {
    id: "pub-6",
    deck: "public",
    numeral: "06",
    archetype: "COMUNIDAD",
    title: "Twitter / X Profesional",
    destination: "Novedades tecnológicas, hilos técnicos y artículos",
    url: "https://x.com/",
    category: "Social",
    accentColor: "#e2e8f0",
    sigil: "feather",
    glowType: "crystal"
  },

  // ==========================================
  // CONTACTO DIRECTO & CANALES PRIVADOS
  // ==========================================
  {
    id: "priv-1",
    deck: "personal",
    numeral: "07",
    archetype: "CHAT DIRECTO",
    title: "WhatsApp Business",
    destination: "Canal directo y consultas de proyectos",
    url: "https://wa.me/5491100000000",
    category: "Contacto",
    accentColor: "#22c55e",
    sigil: "whatsapp",
    glowType: "emerald"
  },
  {
    id: "priv-2",
    deck: "personal",
    numeral: "08",
    archetype: "MENSAJERÍA",
    title: "Telegram Directo",
    destination: "Contacto rápido y coordinación de entregas",
    url: "https://t.me/usuario",
    category: "Contacto",
    accentColor: "#38bdf8",
    sigil: "telegram",
    glowType: "sapphire"
  },
  {
    id: "priv-3",
    deck: "personal",
    numeral: "09",
    archetype: "EMAIL",
    title: "Correo Corporativo",
    destination: "Propuestas formales, contratos y alianzas",
    url: "mailto:contacto@maximogs.com",
    category: "Contacto",
    accentColor: "#f59e0b",
    sigil: "mail",
    glowType: "gold"
  },
  {
    id: "priv-4",
    deck: "personal",
    numeral: "10",
    archetype: "PAGOS",
    title: "Pasarela / Pagos",
    destination: "Cobros freelance, transferencias y propinas",
    url: "https://cafecito.app/",
    category: "Finanzas",
    accentColor: "#ec4899",
    sigil: "chalice",
    glowType: "ruby"
  },
  {
    id: "priv-5",
    deck: "personal",
    numeral: "11",
    archetype: "CONECTIVIDAD",
    title: "Acceso Wi-Fi Oficina",
    destination: "Credenciales de conexión directa al Wi-Fi",
    url: "WIFI:S:Oficina_HighSpeed;T:WPA;P:PasswordSegura2026;;",
    category: "Red",
    accentColor: "#8b5cf6",
    sigil: "antenna",
    glowType: "amethyst"
  },
  {
    id: "priv-6",
    deck: "personal",
    numeral: "12",
    archetype: "PORTFOLIO VISUAL",
    title: "Instagram / Visual Lab",
    destination: "Diseño UI/UX, prototipos y capturas de trabajo",
    url: "https://www.instagram.com/",
    category: "Diseño",
    accentColor: "#f43f5e",
    sigil: "eye",
    glowType: "ruby"
  }
];

// Gestor de persistencia en localStorage
class CardStorageManager {
  static STORAGE_KEY = "tu_super_card_data_v2";
  static CONFIG_KEY = "tu_super_card_config_v2";
  static LEGACY_STORAGE_KEY = "tu_super_card_data_v1";
  static LEGACY_CONFIG_KEY = "tu_super_card_config_v1";

  static getCards() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem(this.LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("No se pudo leer localStorage, usando tarjetas por defecto.", e);
    }
    return [...DEFAULT_CARDS];
  }

  static saveCards(cards) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
      return true;
    } catch (e) {
      console.error("Error al guardar tarjetas en localStorage", e);
      return false;
    }
  }

  static getConfig() {
    try {
      const saved = localStorage.getItem(this.CONFIG_KEY) || localStorage.getItem(this.LEGACY_CONFIG_KEY);
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.warn("No se pudo leer configuración local.", e);
    }
    return { ...DEFAULT_CONFIG };
  }

  static saveConfig(cfg) {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg));
      return true;
    } catch (e) {
      console.error("Error al guardar configuración", e);
      return false;
    }
  }

  static resetToDefaults() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CONFIG_KEY);
    localStorage.removeItem(this.LEGACY_STORAGE_KEY);
    localStorage.removeItem(this.LEGACY_CONFIG_KEY);
    return { cards: [...DEFAULT_CARDS], config: { ...DEFAULT_CONFIG } };
  }
}
