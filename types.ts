
export interface GroundingLink {
  uri: string;
  title: string;
}

export type LeadStatus = 'NOVO' | 'CONTATADO' | 'DEMONSTROU_INTERESSE' | 'NAO_RESPONDEU' | 'FECHADO' | 'PERDIDO';

export type ClosingStatus = 
  | 'INTERESSADO' 
  | 'TEMPLATE_ENVIADO' 
  | 'CRIATIVO_1_ENVIADO' 
  | 'CRIATIVO_2_ENVIADO' 
  | 'CRIATIVO_3_ENVIADO' 
  | 'FOLLOW_UP' 
  | 'NEGOCIACAO' 
  | 'BRIEFING_ENVIADO' 
  | 'BRIEFING_RECEBIDO' 
  | 'PROJETO_EM_DESENVOLVIMENTO' 
  | 'PROJETO_ENTREGUE' 
  | 'RECUPERACAO'
  | 'FECHADO';

export interface RecoveryHistoryEntry {
  id: string;
  date: string;
  messageSent: string;
  creativeSent: string;
  videoSent: string;
  responseReceived: string;
  newNegotiation: boolean;
}

export interface Interaction {
  date: string;
  type: 'WHATSAPP' | 'EMAIL' | 'LIGAÇÃO';
  status: 'ENVIADO' | 'VISUALIZADO' | 'RESPONDIDO';
}

export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description?: string;
}

export interface LeadDocument {
  id: string;
  name: string;
  type: 'Briefing' | 'PDF' | 'Proposta' | 'Logo' | 'Fotos' | 'Contrato' | 'Outro';
  url: string;
  uploadedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  category: string;
  secondaryCategories: string[];
  address: string;
  city: string;
  phone: string;
  website: string;
  rating: number | string;
  userRatingsTotal: number | string;
  businessStatus: string;
  mapsUrl: string;
  latitude: number;
  longitude: number;
  collectedAt: string;
  status: LeadStatus;
  tags: string[];
  lastInteraction?: Interaction;
  groundingLinks?: GroundingLink[];
  score?: {
    grade: 'A' | 'B' | 'C' | 'D';
    temperature: 'QUENTE' | 'MORNO' | 'FRIO';
    reason: string;
    opportunities: string[];
    potentialValue: number;
  };
  // Camadas de Inteligência, Classificação e LGPD
  normalizedPhone?: string;
  phoneType?: 'whatsapp' | 'fixo' | 'desconhecido';
  gaps?: string[];
  optOut?: boolean;
  consentRegistered?: boolean;
  consentDate?: string;
  instagram?: string;
  facebook?: string;
  email?: string;
  biography?: string;
  origem?: 'Google Maps' | 'Facebook' | 'Instagram' | 'WhatsApp' | 'LinkedIn' | 'Manual';
  linkedinUrl?: string;
  linkedinCompanyId?: string;
  description?: string;
  industry?: string;
  location?: string;
  followerCount?: number;
  logoUrl?: string;
  searchInput?: string;

  // NOVOS CAMPOS - ENGENHARIA DE PROSPECÇÃO M2/M4
  closingStatus?: ClosingStatus; // Status no pipeline de fechamento
  checkedScoreFactors?: string[]; // Fatores de Lead Score marcados
  scorePoints?: number; // Pontuação real calculada do Lead Score
  lossReason?: string; // Motivo de perda
  lostAt?: string; // Data em que o lead foi perdido M3
  timeline?: TimelineEntry[]; // Histórico completo
  notes?: string; // Campo de observações em tempo real
  documents?: LeadDocument[]; // Anexos / Documentos
  importantLinks?: {
    landingPageEnviada?: string;
    instagram?: string;
    site?: string;
    googleMaps?: string;
    whatsapp?: string;
    facebook?: string;
    briefing?: string;
  };
  nextAction?: string; // Próxima ação recomendada ou selecionada
  followUpDate?: string; // Data para o próximo follow-up inteligente
  state?: string; // Estado para filtros
  responsibleUser?: { // Preparação para escala multi-vendedor
    id: string;
    name: string;
    role: 'founder' | 'sales_manager' | 'vendedor' | 'sdr';
    team?: string;
  };
  recoveryHistory?: RecoveryHistoryEntry[]; // Histórico de Recuperação M3
  videoReactivationSent?: boolean; // Se o vídeo de reativação foi enviado
  usedCopyId?: string; // ID da copy utilizada
  usedCopyName?: string; // Nome da copy utilizada
  whatsappContactHistory?: string[]; // Histórico de timestamps de contatos via WhatsApp
}

export interface ProspectingCopy {
  id: string;
  name: string;
  content: string;
  channel: 'Google Maps' | 'Instagram' | 'Facebook' | 'LinkedIn' | 'WhatsApp';
  status: 'Ativa' | 'Inativa';
  sendCount: number;
  responseCount: number;
}

export interface SearchFilters {
  niche: string;
  city: string;
  radius: number;
}

export enum AppSection {
  DASHBOARD = 'DASHBOARD',
  LEADS = 'LEADS',
  PIPELINE = 'PIPELINE',
  CRIAR_PROPOSTA = 'CRIAR_PROPOSTA',
  PROMPT_CLAUDE_CODE = 'PROMPT_CLAUDE_CODE',
  SDR_AGENT = 'SDR_AGENT',
  TEMPLATES = 'TEMPLATES',
  COPIES = 'COPIES',
  FINANCEIRO = 'FINANCEIRO',
  GROUPS = 'GROUPS',
  SETTINGS = 'SETTINGS'
}

export interface LeadGroup {
  id: string;
  name: string;
  platform: 'Facebook' | 'WhatsApp' | 'Telegram' | 'LinkedIn';
  niche: string;
  link: string;
  status: 'Entrar' | 'Participando' | 'Publicado' | 'Gerou Lead';
  notes: string;
  postImage?: string; // base64 representation or URL
  postVideo?: string; // base64 representation or URL
  postText?: string;
  leadsGenerated: number;
  salesCount: number;
  salesValue: number;
  lastPublishedAt?: string; // ISO string
}

export interface SiteTemplate {
  id: string;
  niche: string;
  url: string;
  createdAt: string;
}

export interface FinancialProject {
  id: string;
  companyName: string;
  niche: string;
  value: number;
  url: string;
  createdAt: string;
}

