import React, { createContext, useState, useContext } from 'react';

type Language = 'EN' | 'ES' | 'FR';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  EN: {
    dashboard: "Dashboard",
    analytics: "Analytics",
    guests: "Guest List & RSVPs",
    ticketing: "Ticketing & Badges",
    seating: "Seating Arrangement",
    budget: "Budget & Marketplace",
    aiPlanner: "AI Event Planner",
    websiteGen: "Website Builder",
    engagement: "Live Polls & Q&A",
    certificates: "Certificates",
    sponsorsStaff: "Sponsors & Staff",
    feedback: "Feedback & Sentiment",
    gallery: "Photo Gallery",
    language: "Language",
    notifications: "Notification Campaigns",
    aiAssistant: "AI Chat Assistant",
    
    // UI details
    eventTitle: "EventSphere Dashboard",
    guestManagement: "Guest Management",
    rsvpTracking: "RSVP Status Tracking",
    ticketSales: "Ticket Sales & Revenue",
    budgetOverview: "Budget Overview",
    vendorsMarket: "Vendor Marketplace",
    liveDashboard: "Live Analytics Board",
    qrCheckin: "QR Check-in Scanner",
    badgeGen: "Digital Badge Designer",
    seatingBuilder: "Seating arrangement builder",
    interactiveMap: "Interactive Venue Map",
    pollsAndQa: "Live Polls & Q&A Board",
    certGenerator: "Certificate Generator",
    staffScheduler: "Staff shift scheduling",
    aiPredictor: "AI Budget Prediction Model",
    
    // General terms
    activeEvent: "Active Event",
    save: "Save",
    delete: "Delete",
    add: "Add New",
    update: "Update",
    status: "Status",
    role: "Role",
    actions: "Actions"
  },
  ES: {
    dashboard: "Panel de Control",
    analytics: "Analítica",
    guests: "Lista de Invitados & RSVP",
    ticketing: "Boletos & Credenciales",
    seating: "Distribución de Asientos",
    budget: "Presupuesto & Proveedores",
    aiPlanner: "Planificador de IA",
    websiteGen: "Creador de Sitios Web",
    engagement: "Encuestas en Vivo & Q&A",
    certificates: "Certificados",
    sponsorsStaff: "Patrocinadores & Personal",
    feedback: "Comentarios & Sentimiento",
    gallery: "Galería de Fotos",
    language: "Idioma",
    notifications: "Campañas de Notificación",
    aiAssistant: "Asistente de Chat de IA",
    
    eventTitle: "Panel de Control de EventSphere",
    guestManagement: "Gestión de Invitados",
    rsvpTracking: "Seguimiento de RSVP",
    ticketSales: "Venta de Boletos & Ingresos",
    budgetOverview: "Resumen del Presupuesto",
    vendorsMarket: "Mercado de Proveedores",
    liveDashboard: "Tablero de Análisis en Vivo",
    qrCheckin: "Escáner de Check-in QR",
    badgeGen: "Diseñador de Credenciales Digitales",
    seatingBuilder: "Constructor de Disposición de Asientos",
    interactiveMap: "Mapa Interactivo de la Sede",
    pollsAndQa: "Tablero de Encuestas en Vivo & Q&A",
    certGenerator: "Generador de Certificados",
    staffScheduler: "Programación de turnos del personal",
    aiPredictor: "Modelo de Predicción de Presupuesto por IA",
    
    activeEvent: "Evento Activo",
    save: "Guardar",
    delete: "Eliminar",
    add: "Añadir Nuevo",
    update: "Actualizar",
    status: "Estado",
    role: "Rol",
    actions: "Acciones"
  },
  FR: {
    dashboard: "Tableau de Bord",
    analytics: "Analyses",
    guests: "Liste des Invités & RSVP",
    ticketing: "Billetterie & Badges",
    seating: "Plan de Table",
    budget: "Budget & Prestataires",
    aiPlanner: "Planificateur d'IA",
    websiteGen: "Générateur de Site Web",
    engagement: "Sondages en Direct & Q&A",
    certificates: "Certificats",
    sponsorsStaff: "Sponsors & Personnel",
    feedback: "Commentaires & Sentiments",
    gallery: "Galerie Photos",
    language: "Langue",
    notifications: "Campagnes de Notification",
    aiAssistant: "Assistant de Chat d'IA",
    
    eventTitle: "Tableau de Bord EventSphere",
    guestManagement: "Gestion des Invités",
    rsvpTracking: "Suivi des RSVP",
    ticketSales: "Ventes de Billets & Revenus",
    budgetOverview: "Aperçu du Budget",
    vendorsMarket: "Marché des Prestataires",
    liveDashboard: "Analyses en Direct",
    qrCheckin: "Scanner de Validation QR",
    badgeGen: "Créateur de Badges Numériques",
    seatingBuilder: "Créateur de Plan de Table",
    interactiveMap: "Carte Interactive de la Salle",
    pollsAndQa: "Sondages & Questions en Direct",
    certGenerator: "Générateur de Certificats",
    staffScheduler: "Planification du personnel",
    aiPredictor: "Modèle de Prédiction Budgétaire par IA",
    
    activeEvent: "Événement Actif",
    save: "Sauvegarder",
    delete: "Supprimer",
    add: "Ajouter Nouveau",
    update: "Mettre à jour",
    status: "Statut",
    role: "Rôle",
    actions: "Actions"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('EN');

  const t = (key: string): string => {
    return translations[language][key] || translations['EN'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
