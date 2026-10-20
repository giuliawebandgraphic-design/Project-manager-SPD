import { StationeryCategory } from '../types';

export type ProjectTypologyKey = 
  | 'matrimonio' 
  | 'battesimo' 
  | 'festa_compleanno' 
  | 'cartoleria' 
  | 'sito_web';

export interface ProjectTypologyConfig {
  key: ProjectTypologyKey;
  label: string;
  prefix: string;
  icon: string;
  shortDesc: string;
  description: string;
  // Specific color palette (no black, no yellow, fully harmonious)
  colorHex: string;     // Primary accent
  colorHoverHex: string;// Darker tone for hover
  bgHex: string;        // Light pill/badge background
  bgCardHex: string;    // Soft card background
  borderHex: string;    // Border color
  textHex: string;      // Readable dark text
  badgeClass: string;
  activeRingClass: string;
  // Default suggested items for this typology in new projects
  defaultSuiteItems: {
    name: string;
    quantity: number;
    specifications: string;
    unitPrice: number;
  }[];
}

export const PROJECT_TYPOLOGIES: ProjectTypologyConfig[] = [
  {
    key: 'matrimonio',
    label: 'Matrimonio',
    prefix: 'MAT',
    icon: '💍',
    shortDesc: 'Wedding Suite',
    description: 'Partecipazioni artigianali, libretti messa, menù, tableau e coordinati nozze',
    colorHex: '#5B7B63',       // Verde Salvia Elegante
    colorHoverHex: '#486650',
    bgHex: '#EBF2ED',
    bgCardHex: '#F6F9F7',
    borderHex: '#C5D8C9',
    textHex: '#26422E',
    badgeClass: 'bg-[#EBF2ED] text-[#26422E] border-[#C5D8C9]',
    activeRingClass: 'ring-2 ring-[#5B7B63] bg-[#EBF2ED]/60 border-[#5B7B63]',
    defaultSuiteItems: [
      {
        name: 'Partecipazioni Nozze con Busta Artigianale C5',
        quantity: 100,
        specifications: 'Carta cotone Amalfi 340g con bordi intonsi e stampa a caldo oro opaco',
        unitPrice: 8.50,
      },
      {
        name: 'Sigillo in Ceralacca Personalizzato con Iniziali',
        quantity: 100,
        specifications: 'Ceralacca verde salvia perlata e frammenti di foglia oro',
        unitPrice: 2.20,
      },
      {
        name: 'Libretto Cerimonia Religiosa / Civile',
        quantity: 80,
        specifications: 'Copertina cotone 240g con nastro in seta vegetale avorio',
        unitPrice: 4.80,
      }
    ]
  },
  {
    key: 'battesimo',
    label: 'Battesimo',
    prefix: 'BAT',
    icon: '🕊️',
    shortDesc: 'Battesimo & Nascita',
    description: 'Inviti nascita e battesimo, scatoline confetti, bomboniere e ricordini',
    colorHex: '#437996',       // Blu Polvere / Celeste Carta
    colorHoverHex: '#325E75',
    bgHex: '#EBF4F9',
    bgCardHex: '#F5F9FC',
    borderHex: '#C6DFED',
    textHex: '#1C475F',
    badgeClass: 'bg-[#EBF4F9] text-[#1C475F] border-[#C6DFED]',
    activeRingClass: 'ring-2 ring-[#437996] bg-[#EBF4F9]/60 border-[#437996]',
    defaultSuiteItems: [
      {
        name: 'Invito Battesimo con Foglia Botanica a Rilievo',
        quantity: 60,
        specifications: 'Carta cotone 300g con piccolo ramo d\'ulivo stampato e busta coordinata',
        unitPrice: 5.80,
      },
      {
        name: 'Tag Bomboniera & Scatolina Confetti',
        quantity: 60,
        specifications: 'Cartoncino naturale con occhiello metallico e nome calligrafato',
        unitPrice: 2.00,
      }
    ]
  },
  {
    key: 'festa_compleanno',
    label: 'Festa di Compleanno',
    prefix: 'CMP',
    icon: '🎂',
    shortDesc: 'Party & Compleanno',
    description: 'Inviti party, cartoncini ringraziamento, festoni decorativi e party kit coordinato',
    colorHex: '#9C556D',       // Rosa Cipria Vellutato / Mauve
    colorHoverHex: '#7E4054',
    bgHex: '#F9EDF2',
    bgCardHex: '#FCF7FA',
    borderHex: '#EBCAD5',
    textHex: '#672B3E',
    badgeClass: 'bg-[#F9EDF2] text-[#672B3E] border-[#EBCAD5]',
    activeRingClass: 'ring-2 ring-[#9C556D] bg-[#F9EDF2]/60 border-[#9C556D]',
    defaultSuiteItems: [
      {
        name: 'Invito Festa Compleanno Illustrato',
        quantity: 40,
        specifications: 'Carta martellata 320g con illustrazione tema festa e busta colorata',
        unitPrice: 4.50,
      },
      {
        name: 'Party Kit Segnaposto & Cake Topper Artigianale',
        quantity: 1,
        specifications: 'Set coordinato per tavolo buffet, topper e ringraziamenti',
        unitPrice: 65.00,
      }
    ]
  },
  {
    key: 'cartoleria',
    label: 'Cartoleria',
    prefix: 'CAR',
    icon: '✉️',
    shortDesc: 'Cartoleria & Brand',
    description: 'Taccuini rilegati, carta da lettere, segnalibri, buste artigianali e timbri',
    colorHex: '#946445',       // Terracotta Naturale / Argilla Calda
    colorHoverHex: '#794E32',
    bgHex: '#F7EFE9',
    bgCardHex: '#FAF5F1',
    borderHex: '#E8D4C6',
    textHex: '#5E361D',
    badgeClass: 'bg-[#F7EFE9] text-[#5E361D] border-[#E8D4C6]',
    activeRingClass: 'ring-2 ring-[#946445] bg-[#F7EFE9]/60 border-[#946445]',
    defaultSuiteItems: [
      {
        name: 'Set Carta da Lettere & Buste Artigianali',
        quantity: 50,
        specifications: 'Foglio cotone 120g filigranato con busta foderata a mano',
        unitPrice: 3.20,
      },
      {
        name: 'Notebook Sartoriale Rilegato a Filo',
        quantity: 20,
        specifications: 'Copertina telata con stampa a secco e interni a righe puntinate',
        unitPrice: 16.00,
      }
    ]
  },
  {
    key: 'sito_web',
    label: 'Sito Web',
    prefix: 'WEB',
    icon: '🌐',
    shortDesc: 'Sito Web & RSVP',
    description: 'Sito web dedicato all\'evento o nozze, RSVP digitale interattivo, gallery e countdown',
    colorHex: '#625C8F',       // Lavanda Polverosa / Soft Iris
    colorHoverHex: '#4E4875',
    bgHex: '#F2F0F8',
    bgCardHex: '#F7F6FC',
    borderHex: '#D7D3EB',
    textHex: '#3D3768',
    badgeClass: 'bg-[#F2F0F8] text-[#3D3768] border-[#D7D3EB]',
    activeRingClass: 'ring-2 ring-[#625C8F] bg-[#F2F0F8]/60 border-[#625C8F]',
    defaultSuiteItems: [
      {
        name: 'Sito Web Evento Personalizzato con Dominio',
        quantity: 1,
        specifications: 'Design responsive su misura, mappa location, dress code e timeline cerimonia',
        unitPrice: 450.00,
      },
      {
        name: 'Modulo RSVP Digitale & Gestione Intolleranze',
        quantity: 1,
        specifications: 'Sistema automatico di conferma presenze, menù e messaggi per gli sposi',
        unitPrice: 180.00,
      }
    ]
  }
];

/**
 * Normalizes any category string (including legacy ones) to one of the 5 project typologies
 */
export function normalizeTypologyKey(category: StationeryCategory | string | undefined): ProjectTypologyKey {
  if (!category) return 'matrimonio';
  
  const lower = category.toLowerCase().trim();
  
  if (lower === 'matrimonio' || lower === 'wedding') return 'matrimonio';
  if (lower === 'battesimo' || lower === 'battesimo_evento' || lower === 'nascita') return 'battesimo';
  if (lower === 'festa_compleanno' || lower === 'compleanno' || lower === 'party' || lower === 'festa') return 'festa_compleanno';
  if (lower === 'cartoleria' || lower === 'brand_stationery' || lower === 'corporate_brand' || lower === 'retail_product' || lower === 'calligrafia_speciale' || lower === 'market_fiera' || lower === 'internal_project') {
    return 'cartoleria';
  }
  if (lower === 'sito_web' || lower === 'web' || lower === 'website' || lower === 'rsvp_web') return 'sito_web';
  
  return 'matrimonio';
}

/**
 * Returns the full styling and configuration object for any project category
 */
export function getTypologyConfig(category: StationeryCategory | string | undefined): ProjectTypologyConfig {
  const key = normalizeTypologyKey(category);
  return PROJECT_TYPOLOGIES.find(t => t.key === key) || PROJECT_TYPOLOGIES[0];
}

/**
 * Generates an automated serial number based on project typology and existing projects
 * Format: [PREFIX]-[YEAR]-[NUMERO] -> e.g. "MAT-2026-03", "BAT-2026-01", "CMP-2026-01", "CAR-2026-02", "WEB-2026-01"
 */
export function generateProjectSerial(
  category: StationeryCategory | string | undefined,
  existingProjects: { code?: string; category?: string }[],
  year: number = new Date().getFullYear()
): string {
  const config = getTypologyConfig(category);
  const prefix = config.prefix; // e.g. "MAT", "BAT", "CMP", "CAR", "WEB"
  const prefixWithYear = `${prefix}-${year}-`;

  let maxSequential = 0;

  existingProjects.forEach(p => {
    if (!p.code) return;

    // Check if code matches standard prefix with year: e.g. "MAT-2026-04"
    if (p.code.startsWith(prefixWithYear)) {
      const part = p.code.substring(prefixWithYear.length);
      const parsed = parseInt(part, 10);
      if (!isNaN(parsed) && parsed > maxSequential) {
        maxSequential = parsed;
      }
    } 
    // Check if code matches prefix with hyphen: e.g. "MAT-04"
    else if (p.code.startsWith(`${prefix}-`)) {
      const parts = p.code.split('-');
      const lastPart = parts[parts.length - 1];
      const parsed = parseInt(lastPart, 10);
      if (!isNaN(parsed) && parsed > maxSequential) {
        maxSequential = parsed;
      }
    }
    // Also if legacy code like "ST-2026-14" and project matches this category
    else if (normalizeTypologyKey(p.category) === config.key) {
      const parts = p.code.split('-');
      const lastPart = parts[parts.length - 1];
      const parsed = parseInt(lastPart, 10);
      if (!isNaN(parsed) && parsed > maxSequential) {
        maxSequential = Math.min(parsed, 10); // cap legacy offsets
      }
    }
  });

  const nextNumber = maxSequential + 1;
  return `${prefix}-${year}-${String(nextNumber).padStart(2, '0')}`;
}
