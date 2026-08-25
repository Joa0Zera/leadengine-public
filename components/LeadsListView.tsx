import React, { useState } from 'react';
import { Lead, LeadStatus, ProspectingCopy } from '../types';
import { normalizarTelefone, detectarTipoContato, detectarGaps, calcularLeadScore } from '../helpers';
import LeadDetailModal from './LeadDetailModal';
import { 
  ExternalLink, 
  Globe, 
  Phone, 
  Star, 
  Download, 
  Search, 
  Filter, 
  Zap, 
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Upload,
  AlertTriangle,
  Info,
  Trash2,
  FileSpreadsheet,
  MessageSquare,
  Users,
  Facebook,
  Instagram,
  Linkedin,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Video,
  Play
} from 'lucide-react';

interface Props {
  leads: Lead[];
  copies?: ProspectingCopy[];
  onUpdateCopy?: (updatedCopy: ProspectingCopy) => void;
  onScore: (id: string) => void;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onImportLeads: (newLeads: Lead[]) => void;
  onDeleteLead: (id: string) => void;
  onUpdateLead: (updatedLead: Lead) => void;
}

const LeadsListView: React.FC<Props> = ({ 
  leads, 
  copies = [], 
  onUpdateCopy, 
  onScore, 
  onUpdateStatus, 
  onImportLeads, 
  onDeleteLead, 
  onUpdateLead 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'LIST' | 'IMPORT' | 'TUTORIAL'>('LIST');
  const [contactFilter, setContactFilter] = useState<'ALL' | 'PENDING' | 'CONTACTED'>('ALL');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = leads.find(l => l.id === selectedLeadId) || null;

  // Advanced Filters Collapsible State
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [filterCity, setFilterCity] = useState('ALL');
  const [filterSegment, setFilterSegment] = useState('ALL');
  const [filterOrigin, setFilterOrigin] = useState('ALL');
  const [filterTemperature, setFilterTemperature] = useState('ALL');
  const [filterStage, setFilterStage] = useState('ALL');
  const [filterResponsible, setFilterResponsible] = useState('ALL');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const [abordagemModal, setAbordagemModal] = useState<{
    lead: Lead;
    platform: 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'LINKEDIN';
    type: 'SITE' | 'TRAFEGO';
    message: string;
    url: string;
    copyId?: string;
    copyName?: string;
  } | null>(null);

  const [reactivationModal, setReactivationModal] = useState<{
    lead: Lead;
    message: string;
    url: string;
  } | null>(null);

  // Importer states
  const [importText, setImportText] = useState('');
  const [defaultCity, setDefaultCity] = useState('São Paulo');
  const [importLog, setImportLog] = useState<{ success: number; discarded: number; duplicates: number; details: string[] } | null>(null);

  // Extract unique listing parameters dynamically for selectors
  const uniqueCities = Array.from(new Set(leads.map(l => l.city).filter(Boolean).sort()));
  const uniqueCategories = Array.from(new Set(leads.map(l => l.category).filter(Boolean).sort()));
  const uniqueResponsibles = Array.from(new Set(leads.map(l => l.responsibleUser?.name || 'Fundador (Nevion)').sort()));

  const getSelectedCopyAndPreview = (
    lead: Lead, 
    channel: 'Google Maps' | 'Instagram' | 'Facebook' | 'LinkedIn' | 'WhatsApp',
    fallbackText: string
  ): { text: string; copyId?: string; copyName?: string } => {
    const activeChannelCopies = copies.filter(c => c.channel === channel && c.status === 'Ativa');
    
    if (activeChannelCopies.length === 0) {
      return { text: fallbackText };
    }
    
    // Sort by sendCount ascending to pick the least used one
    const sorted = [...activeChannelCopies].sort((a, b) => (a.sendCount || 0) - (b.sendCount || 0));
    const selectedCopy = sorted[0];
    
    // Replace placeholders
    let parsedText = selectedCopy.content;
    const cleanName = lead.name || 'Empresa';
    const cleanNiche = lead.category || 'seu segmento';
    const cleanCity = lead.city || 'sua região';
    
    parsedText = parsedText
      .replace(/{nome}/g, cleanName)
      .replace(/{empresa}/g, cleanName)
      .replace(/{nicho}/g, cleanNiche)
      .replace(/{categoria}/g, cleanNiche)
      .replace(/{cidade}/g, cleanCity)
      .replace(/{localizacao}/g, cleanCity);
      
    return {
      text: parsedText,
      copyId: selectedCopy.id,
      copyName: selectedCopy.name
    };
  };

  const handleConfirmAbordagem = (
    lead: Lead,
    copyId?: string,
    copyName?: string,
    platform?: string
  ) => {
    // 1. Increment sendCount of the copy if copyId is present
    if (copyId && onUpdateCopy) {
      const selectedCopy = copies.find(c => c.id === copyId);
      if (selectedCopy) {
        onUpdateCopy({
          ...selectedCopy,
          sendCount: (selectedCopy.sendCount || 0) + 1
        });
      }
    }

    // 2. Update Lead object with copy tracking info and WhatsApp contact timestamp if applicable
    const updatedHistory = [...(lead.whatsappContactHistory || [])];
    if (platform === 'WHATSAPP') {
      updatedHistory.push(new Date().toISOString());
    }

    const updatedLead: Lead = {
      ...lead,
      usedCopyId: copyId,
      usedCopyName: copyName,
      whatsappContactHistory: updatedHistory
    };
    onUpdateLead(updatedLead);
  };

  const getWhatsAppMessage = (lead: Lead, type: 'SITE' | 'TRAFEGO' = 'SITE') => {
    if (type === 'TRAFEGO') {
      return `Olá, tudo bem? 🚀\n\nVi o perfil da *${lead.name}* no Google Maps e achei o negócio de vocês fantástico!\n\nSou especialista em atração de clientes e tráfego pago (anúncios no Google, Instagram e Facebook) para negócios locais. Estava analisando a presença digital de vocês na região e percebi que vocês têm um potencial gigante de atrair muito mais clientes qualificados todos os dias através de anúncios direcionados.\n\nSei que o mercado é competitivo, e investir em anúncios estratégicos no Google e nas Redes Sociais é a forma mais rápida e barata de colocar o seu negócio no topo e encher a sua agenda/gerar vendas diariamente.\n\nPreparei uma análise de anúncios rápida e prática (com 3 oportunidades imediatas para o seu nicho) de como destacar seu negócio na região e atrair novos clientes ainda esta semana.\n\nGrotaria de receber essa análise prática de forma 100% gratuita?\n\nFico no aguardo! 😊`;
    }

    return `Olá, tudo bem? 😊\n\nVi o perfil da *${lead.name}* no Google Maps e gostei bastante do trabalho de vocês.\n\nEnquanto analisava a presença digital da empresa, percebi uma oportunidade que pode ajudar a fortalecer ainda mais a autoridade da marca na internet.\n\nNotei que vocês ainda não possuem um site profissional ou uma Landing Page exclusiva para apresentar os serviços, facilitar o contato e transmitir mais credibilidade para novos clientes.\n\nTrabalho desenvolvendo Landing Pages e sites personalizados para negócios locais, sempre com foco em performance, experiência no celular e conversão.\n\nInclusive, preparei um modelo demonstrativo para empresas desse segmento e posso enviar gratuitamente para vocês conhecerem, sem compromisso.\n\nGostariam que eu enviasse? 😊`;
  };

  const handleSendWhatsAppMessage = (leadOrId: Lead | string, type: 'SITE' | 'TRAFEGO' = 'SITE') => {
    const lead = typeof leadOrId === 'string' ? leads.find(l => l.id === leadOrId) : leadOrId;
    if (!lead || !lead.phone || lead.phone === 'não disponível') return;
    const phoneDigits = lead.phone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits;
    const fallbackMessage = getWhatsAppMessage(lead, type);
    const { text: message, copyId, copyName } = getSelectedCopyAndPreview(lead, 'WhatsApp', fallbackMessage);
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}`;

    setCopiedStatus(false);
    setAbordagemModal({
      lead,
      platform: 'WHATSAPP',
      type,
      message,
      url,
      copyId,
      copyName
    });

    navigator.clipboard.writeText(message).then(() => {
      setCopiedStatus(true);
      setToastMessage(`Mensagem copiada automaticamente!`);
      setTimeout(() => setToastMessage(null), 3000);
    }).catch(err => {
      console.warn('Erro ao copiar automaticamente:', err);
    });
  };

  const handleSendVideoReactivation = (leadOrId: Lead | string) => {
    const lead = typeof leadOrId === 'string' ? leads.find(l => l.id === leadOrId) : leadOrId;
    if (!lead || !lead.phone || lead.phone === 'não disponível') return;
    const phoneDigits = lead.phone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits;
    
    const message = `Olá! Tudo bem? 😊\n\nPassei novamente porque preparei um vídeo bem rápido para mostrar o padrão de qualidade das Landing Pages que desenvolvemos.\n\nAcredito que a sua empresa também poderia ter uma presença digital nesse nível.\n\nAssista ao vídeo e, se fizer sentido para vocês, me chama aqui. Terei o maior prazer em criar um modelo exclusivo para o seu negócio, sem qualquer compromisso. 🚀`;
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

    navigator.clipboard.writeText(message).then(() => {
      setCopiedStatus(true);
      setToastMessage(`Mensagem de reativação copiada!`);
      setTimeout(() => setToastMessage(null), 3000);
    }).catch(err => {
      console.warn('Erro ao copiar automaticamente:', err);
    });

    setReactivationModal({ lead, message, url });
  };

  const handleSocialAbordagem = (leadOrId: Lead | string, platform: 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN', type: 'SITE' | 'TRAFEGO') => {
    const lead = typeof leadOrId === 'string' ? leads.find(l => l.id === leadOrId) : leadOrId;
    if (!lead) return;
    let message = '';
    let url = '';
    let copyId: string | undefined = undefined;
    let copyName: string | undefined = undefined;

    if (platform === 'INSTAGRAM') {
      const handleOrUrl = lead.instagram || '';
      if (!handleOrUrl) return;

      if (handleOrUrl.startsWith('http://') || handleOrUrl.startsWith('https://')) {
        url = handleOrUrl;
      } else {
        const cleaned = handleOrUrl.trim().replace(/^@/, '');
        url = `https://instagram.com/${cleaned}`;
      }

      let fallbackText = '';
      if (type === 'SITE') {
        fallbackText = `Olá, tudo bem? 😊\n\nVi o perfil da *${lead.name}* no Instagram e gostei bastante do trabalho de vocês.\n\nEnquanto analisava a presença digital da empresa, percebi uma oportunidade que pode ajudar a fortalecer ainda mais a autoridade da marca na internet.\n\nNotei que vocês ainda não possuem um site profissional ou uma Landing Page exclusiva para apresentar os serviços, facilitar o contato e transmitir mais credibilidade para novos clientes.\n\nTrabalho desenvolvendo Landing Pages e sites personalizados para negócios locais, sempre com foco em performance, experiência no celular e conversão.\n\nInclusive, preparei um modelo demonstrativo para empresas desse segmento e posso enviar gratuitamente para vocês conhecerem, sem compromisso.\n\nGostariam que eu enviasse? 😊`;
      } else {
        fallbackText = `Olá, tudo bem? 🚀\n\nAmei o Instagram da *${lead.name}*! O positioning de vocês é excelente.\n\nTrabalho com posicionamento digital e atração de clientes através de anúncios patrocinados (Google, Instagram e Facebook) específicos para o mercado de ${lead.city}.\n\nFazendo uma análise rápida, vi que vocês têm um potencial enorme de atrair mais clientes locais todos os dias usando anúncios direcionados de alto retorno.\n\nMontei um estudo rápido gratuito com 3 oportunidades imediatas de anúncios para o seu nicho se destacar na região.\n\nGostaria de receber esse estudo de forma 100% gratuita por aqui? \n\nFico no aguardo! 😊`;
      }
      const preview = getSelectedCopyAndPreview(lead, 'Instagram', fallbackText);
      message = preview.text;
      copyId = preview.copyId;
      copyName = preview.copyName;
    } else if (platform === 'FACEBOOK') {
      const handleOrUrl = lead.facebook || '';
      if (handleOrUrl) {
        if (handleOrUrl.startsWith('http://') || handleOrUrl.startsWith('https://')) {
          url = handleOrUrl;
        } else {
          url = `https://facebook.com/${handleOrUrl.trim()}`;
        }
      } else {
        url = `https://facebook.com/search/pages/?q=${encodeURIComponent(lead.name)}`;
      }

      let fallbackText = '';
      if (type === 'SITE') {
        fallbackText = `Olá, tudo bem? 😊\n\nVi o perfil da *${lead.name}* no Facebook e gostei bastante do trabalho de vocês.\n\nEnquanto analisava a presença digital da empresa, percebi uma oportunidade que pode ajudar a fortalecer ainda mais a autoridade da marca na internet.\n\nNotei que vocês ainda não possuem um site profissional ou uma Landing Page exclusiva para apresentar os serviços, facilitar o contato e transmitir mais credibilidade para novos clientes.\n\nTrabalho desenvolvendo Landing Pages e sites personalizados para negócios locais, sempre com foco em performance, experiência no celular e conversão.\n\nInclusive, preparei um modelo demonstrativo para empresas desse segmento e posso enviar gratuitamente para vocês conhecerem, sem compromisso.\n\nGostariam que eu enviasse? 😊`;
      } else {
        fallbackText = `Olá, tudo bem? 🚀\n\nVi o perfil da *${lead.name}* no Facebook e achei o trabalho de vocês fantástico!\n\nTrabalho ajudando negócios locais a multiplicarem seus clientes através de posicionamento digital e anúncios estratégicos (Google e Redes Sociais) focados na região de ${lead.city}.\n\nEstava analisando a presença digital de vocês e percebi uma oportunidade gigante de atrair mais clientes todos os dias através de Tráfego Pago patrocinado.\n\nPreparei uma análise rápida gratuita com 3 ações práticas imediatas para destacar sua empresa e atrair clientes ainda esta semana.\n\nGostaria de receber essa análise prática por aqui?\n\nFico no aguardo! 😊`;
      }
      const preview = getSelectedCopyAndPreview(lead, 'Facebook', fallbackText);
      message = preview.text;
      copyId = preview.copyId;
      copyName = preview.copyName;
    } else {
      // LINKEDIN
      const handleOrUrl = lead.linkedinUrl || '';
      if (handleOrUrl) {
        if (handleOrUrl.startsWith('http://') || handleOrUrl.startsWith('https://')) {
          url = handleOrUrl;
        } else {
          url = `https://www.linkedin.com/company/${handleOrUrl.trim()}`;
        }
      } else {
        url = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.name)}`;
      }

      let fallbackText = '';
      if (type === 'SITE') {
        fallbackText = `Olá, tudo bem? 😊\n\nVi o perfil da *${lead.name}* no LinkedIn e gostei bastante do trabalho de vocês.\n\nEnquanto analisava a presença digital da empresa, percebi uma oportunidade que pode ajudar a fortalecer ainda mais a autoridade da marca na internet.\n\nNotei que vocês ainda não possuem um site profissional ou uma Landing Page exclusiva para apresentar os serviços, facilitar o contato e transmitir mais credibilidade para novos clientes.\n\nTrabalho desenvolvendo Landing Pages e sites personalizados para negócios locais, sempre com foco em performance, experiência no celular e conversão.\n\nInclusive, preparei um modelo demonstrativo para empresas desse segmento e posso enviar gratuitamente para vocês conhecerem, sem compromisso.\n\nGostariam que eu enviasse? 😊`;
      } else {
        fallbackText = `Olá! 🚀\n\nEncontrei o perfil da *${lead.name}* no LinkedIn e achei excelente a atuação de vocês!\n\nSou especialista em atração de clientes qualificados através de anúncios de tráfego pago altamente segmentados no Google e redes sociais.\n\nAnalisando rapidamente, vi um potencial enorme para atrair mais parceiros de negócios e vendas qualificadas de forma consistente todos os dias.\n\nMontei um estudo rápido gratuito com as 3 melhores estratégias de anúncios para o seu nicho se destacar nesta semana.\n\nGostaria de receber este estudo de forma gratuita por aqui?\n\nFico à disposição! 😊`;
      }
      const preview = getSelectedCopyAndPreview(lead, 'LinkedIn', fallbackText);
      message = preview.text;
      copyId = preview.copyId;
      copyName = preview.copyName;
    }

    setCopiedStatus(false);
    setAbordagemModal({
      lead,
      platform,
      type,
      message,
      url,
      copyId,
      copyName
    });

    navigator.clipboard.writeText(message).then(() => {
      setCopiedStatus(true);
      setToastMessage(`Mensagem copiada automaticamente!`);
      setTimeout(() => setToastMessage(null), 3000);
    }).catch(err => {
      console.warn('Erro ao copiar automaticamente:', err);
    });
  };

  const whatsappCount = leads.filter(l => {
    if (l.optOut) return false;
    const classification = l.phoneType || detectarTipoContato(l.phone);
    return l.phone && l.phone !== 'não disponível' && classification !== 'fixo';
  }).length;
  
  const instagramCount = leads.filter(l => !l.optOut && l.instagram && l.instagram !== '').length;
  const facebookCount = leads.filter(l => !l.optOut && l.facebook && l.facebook !== '').length;
  const linkedinCount = leads.filter(l => !l.optOut && (l.origem === 'LinkedIn' || l.linkedinUrl)).length;

  const filteredLeads = leads.filter(lead => {
    if (lead.optOut) return false;

    // Term search filter
    const name = lead.name || '';
    const category = lead.category || '';
    const city = lead.city || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          city.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Contacted or pending tabs
    if (contactFilter === 'PENDING') {
      if (!(lead.status === 'NOVO' || !lead.status)) return false;
    } else if (contactFilter === 'CONTACTED') {
      if (lead.status !== 'CONTATADO') return false;
    }

    // Top channel filter
    if (channelFilter === 'WHATSAPP') {
      const classification = lead.phoneType || detectarTipoContato(lead.phone);
      const isWhatsapp = lead.phone && lead.phone !== 'não disponível' && classification !== 'fixo';
      if (!isWhatsapp) return false;
    } else if (channelFilter === 'INSTAGRAM') {
      if (!lead.instagram || lead.instagram === '') return false;
    } else if (channelFilter === 'FACEBOOK') {
      if (!lead.facebook || lead.facebook === '') return false;
    } else if (channelFilter === 'LINKEDIN') {
      if (lead.origem !== 'LinkedIn' && !lead.linkedinUrl) return false;
    }

    // ADVANCED FILTERS BLOCK
    if (filterCity !== 'ALL' && lead.city !== filterCity) return false;
    if (filterSegment !== 'ALL' && lead.category !== filterSegment) return false;
    if (filterOrigin !== 'ALL' && lead.origem !== filterOrigin) return false;
    
    // Filter Temperature from lead score
    if (filterTemperature !== 'ALL') {
      const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);
      const tempLabel = scoreInfo.points >= 80 ? 'Muito Quente' : scoreInfo.points >= 40 ? 'Quente' : scoreInfo.points >= 20 ? 'Morno' : 'Frio';
      if (tempLabel !== filterTemperature) return false;
    }

    // Filter stage
    if (filterStage !== 'ALL' && (lead.status || 'NOVO') !== filterStage) return false;

    // Filter responsible salesperson
    if (filterResponsible !== 'ALL') {
      const respName = lead.responsibleUser?.name || 'Fundador (Nevion)';
      if (respName !== filterResponsible) return false;
    }

    // Filter Date period
    if (filterDateStart || filterDateEnd) {
      if (!lead.collectedAt) return false;
      const leadTime = new Date(lead.collectedAt).getTime();
      if (filterDateStart) {
        const start = new Date(filterDateStart).getTime();
        if (leadTime < start) return false;
      }
      if (filterDateEnd) {
        const end = new Date(filterDateEnd).getTime();
        if (leadTime > end) return false;
      }
    }

    return true;
  });

  const getTemperatureStyles = (points: number) => {
    if (points >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (points >= 40) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    if (points >= 20) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'FECHADO': return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
      case 'CONTATADO': return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
      case 'DEMONSTROU_INTERESSE': return 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
      case 'NAO_RESPONDEU': return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
      case 'PERDIDO': return 'text-rose-400 bg-rose-500/10 border border-rose-500/20';
      default: return 'text-slate-300 bg-slate-800 border border-slate-700';
    }
  };

  // CSV Export logic
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      'ID', 'Nome', 'Categoria', 'Endereço', 'Cidade', 'Telefone', 'Website', 
      'Avaliação', 'Total Avaliações', 'Status Negócio', 'Latitude', 'Longitude', 
      'Data Coleta', 'Status CRM', 'Lead Score', 'Temperatura IA', 'Oportunidades', 'Responsavel'
    ];

    const csvRows = filteredLeads.map(lead => {
      const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);
      const name = (lead.name || '').replace(/"/g, '""');
      const category = (lead.category || '').replace(/"/g, '""');
      const address = (lead.address || '').replace(/"/g, '""');
      const city = (lead.city || '').replace(/"/g, '""');
      const phone = lead.phone || '';
      const website = lead.website || '';
      const rating = lead.rating !== undefined ? String(lead.rating) : '';
      const userRatingsTotal = lead.userRatingsTotal !== undefined ? String(lead.userRatingsTotal) : '';
      const businessStatus = lead.businessStatus || '';
      const latitude = lead.latitude !== undefined ? String(lead.latitude) : '';
      const longitude = lead.longitude !== undefined ? String(lead.longitude) : '';
      const collectedAt = lead.collectedAt || '';
      const status = lead.status || 'NOVO';
      const points = scoreInfo.points;
      const temperature = scoreInfo.label;
      const opportunities = (lead.gaps || detectarGaps(lead)).join('; ');
      const resp = lead.responsibleUser?.name || 'Fundador (Nevion)';

      return [
        `"${lead.id}"`,
        `"${name}"`,
        `"${category}"`,
        `"${address}"`,
        `"${city}"`,
        `"${phone}"`,
        `"${website}"`,
        `"${rating}"`,
        `"${userRatingsTotal}"`,
        `"${businessStatus}"`,
        `"${latitude}"`,
        `"${longitude}"`,
        `"${collectedAt}"`,
        `"${status}"`,
        `"${points}"`,
        `"${temperature}"`,
        `"${opportunities}"`,
        `"${resp}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n'); // Prepend BOM for Excel compatibility in pt-BR
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leadengine_pro_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV/TSV copy-paste importer parser (Módulo 4)
  const handleProcessImport = () => {
    if (!importText.trim()) return;

    const firstLineEnd = importText.indexOf('\n');
    const firstLine = firstLineEnd !== -1 ? importText.substring(0, firstLineEnd).trim() : importText.trim();
    let separator = '\t';
    if (firstLine.includes(';')) separator = ';';
    else if (firstLine.includes(',') && !firstLine.includes('\t')) separator = ',';

    const parseCSVRows = (text: string, sep: string): string[][] => {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentCell = '';
      let inQuotes = false;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentCell += '"';
            i++; 
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === sep && !inQuotes) {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++; 
          }
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      
      if (currentRow.length > 0 || currentCell !== '') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
      }
      
      return rows.filter(row => row.length > 0 && row.some(cell => cell !== ''));
    };

    const parsedRows = parseCSVRows(importText, separator);
    if (parsedRows.length < 2) {
      setImportLog({
        success: 0,
        discarded: 1,
        duplicates: 0,
        details: ["Erro: Formato inválido. Insira ao menos uma linha de cabeçalho e uma de dados."]
      });
      return;
    }

    const headers = parsedRows[0].map(h => h.toLowerCase().trim().replace(/^["']|["']$/g, ''));

    // Map critical header columns
    const colNameIdx = headers.findIndex(h => h === 'title' || h.includes('nome') || h.includes('empresa') || h.includes('business') || h.includes('name') || h.includes('razão') || h === 'x1i10hfl' || h === 'fullname');
    const colPhoneIdx = headers.findIndex(h => h === 'phone' || h.includes('telefone') || h.includes('celular') || h.includes('whatsapp') || h.includes('contato') || h.includes('número'));
    const colPhoneUnformattedIdx = headers.findIndex(h => h === 'phoneunformatted' || h.includes('phoneunformatted'));
    const colSiteIdx = headers.findIndex(h => h === 'website' || h.includes('site') || h.includes('web') || h.includes('url'));
    const colEmailIdx = headers.findIndex(h => h.includes('email') || h.includes('e-mail') || h.includes('mail'));
    const colCityIdx = headers.findIndex(h => h.includes('cidade') || h.includes('city') || h.includes('municipio') || h.includes('localidade'));
    const colCategoryIdx = headers.findIndex(h => h.includes('categoria') || h.includes('nicho') || h.includes('category') || h.includes('ramo'));
    const colInstagramIdx = headers.findIndex(h => h === 'instagram' || h.includes('insta') || h.includes('ig') || h === 'username');
    const colFacebookIdx = headers.findIndex(h => h === 'facebook' || h.includes('fb') || h.includes('face') || h === 'x1i10hfl href');
    const colBiographyIdx = headers.findIndex(h => h === 'biography' || h.includes('biografia') || h.includes('bio') || h === 'description');

    const colLinkedinUrlIdx = headers.findIndex(h => h === 'company_url' || h.includes('company_url'));
    const colLinkedinCompanyIdIdx = headers.findIndex(h => h === 'company_id' || h.includes('company_id'));
    const colLinkedinDescriptionIdx = headers.findIndex(h => h === 'description' || h.includes('description') || h === 'company_description');
    const colLinkedinIndustryIdx = headers.findIndex(h => h === 'industry' || h.includes('industry'));
    const colLinkedinLocationIdx = headers.findIndex(h => h === 'location' || h.includes('location'));
    const colLinkedinFollowerCountIdx = headers.findIndex(h => h === 'follower_count' || h.includes('follower_count') || h.includes('followers'));
    const colLinkedinLogoUrlIdx = headers.findIndex(h => h === 'logo_url' || h.includes('logo_url') || h.includes('logo'));
    const colLinkedinSearchInputIdx = headers.findIndex(h => h === 'search_input' || h.includes('search_input'));

    const isLinkedIn = colLinkedinUrlIdx !== -1 || colLinkedinCompanyIdIdx !== -1;

    const importedLeadsList: Lead[] = [];
    const details: string[] = [];
    let discardedCount = 0;
    let duplicateCount = 0;
    let successCount = 0;

    const phoneMap = new Map<string, Lead>();
    const companyIdMap = new Map<string, Lead>();
    const companyUrlMap = new Map<string, Lead>();
    const nameLocationSet = new Set<string>();

    const normalizeStr = (s: string) => s.toLowerCase().trim();

    leads.forEach(l => {
      const normPhone = normalizarTelefone(l.phone);
      if (normPhone) phoneMap.set(normPhone, l);
      if (l.normalizedPhone) phoneMap.set(l.normalizedPhone, l);
      
      if (l.linkedinCompanyId) {
        companyIdMap.set(normalizeStr(l.linkedinCompanyId), l);
      }
      if (l.linkedinUrl) {
        companyUrlMap.set(normalizeStr(l.linkedinUrl), l);
      }
      
      const nameLocKey = `${normalizeStr(l.name)}|${normalizeStr(l.location || l.city || '')}`;
      nameLocationSet.add(nameLocKey);
    });

    for (let i = 1; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      
      const getVal = (idx: number) => {
        if (idx === -1 || idx >= row.length) return '';
        return row[idx].trim().replace(/^["']|["']$/g, '');
      };

      const name = getVal(colNameIdx);
      const phoneRaw = getVal(colPhoneIdx) || getVal(colPhoneUnformattedIdx);
      const website = getVal(colSiteIdx);
      const email = getVal(colEmailIdx);
      const city = getVal(colCityIdx) || defaultCity;
      const category = getVal(colCategoryIdx) || 'Outros';
      const instagram = getVal(colInstagramIdx);
      const facebook = getVal(colFacebookIdx);
      const biography = getVal(colBiographyIdx);

      const companyUrl = getVal(colLinkedinUrlIdx);
      const companyId = getVal(colLinkedinCompanyIdIdx);
      const description = getVal(colLinkedinDescriptionIdx);
      const industry = getVal(colLinkedinIndustryIdx);
      const location = getVal(colLinkedinLocationIdx);
      const followerCountStr = getVal(colLinkedinFollowerCountIdx);
      const logoUrl = getVal(colLinkedinLogoUrlIdx);
      const searchInput = getVal(colLinkedinSearchInputIdx);

      if (!name) {
        discardedCount++;
        details.push(`Linha ${i + 1} descartada: Nome da empresa ausente.`);
        continue;
      }

      const normalizedNameLoc = `${normalizeStr(name)}|${normalizeStr(location || city)}`;
      if (nameLocationSet.has(normalizedNameLoc)) {
        duplicateCount++;
        details.push(`Duplicidade em "${name}" (${location || city}): Já cadastrado com esse nome e localização.`);
        continue;
      }

      if (isLinkedIn) {
        if (companyId && companyIdMap.has(normalizeStr(companyId))) {
          duplicateCount++;
          details.push(`Duplicidade em "${name}": ID do LinkedIn "${companyId}" já existe no CRM.`);
          continue;
        }
        if (companyUrl && companyUrlMap.has(normalizeStr(companyUrl))) {
          duplicateCount++;
          details.push(`Duplicidade em "${name}": URL do LinkedIn já existe no CRM.`);
          continue;
        }
      }

      const normPhone = phoneRaw ? normalizarTelefone(phoneRaw) : '';
      if (normPhone && phoneMap.has(normPhone)) {
        duplicateCount++;
        details.push(`Duplicidade em "${name}": Telefone "${phoneRaw}" já cadastrado.`);
        continue;
      }

      const gapsFound = website ? detectarGaps({ website }) : ['SEM_SITE'];
      const followerCount = followerCountStr ? parseInt(followerCountStr.replace(/\D/g, '')) || 0 : undefined;

      const newLead: Lead = {
        id: 'imported-' + Date.now() + '-' + i,
        name,
        category: category || (isLinkedIn ? 'LinkedIn Prospect' : 'Geral'),
        secondaryCategories: [],
        address: location || city || 'Endereço não informado',
        city: city || defaultCity,
        phone: phoneRaw || 'não disponível',
        website: website || 'não disponível',
        rating: 0,
        userRatingsTotal: 0,
        businessStatus: 'OPERATIONAL',
        mapsUrl: '',
        latitude: 0,
        longitude: 0,
        collectedAt: new Date().toISOString(),
        status: 'NOVO',
        tags: isLinkedIn ? ['LinkedIn', 'Importado'] : ['Importado'],
        gaps: gapsFound,
        origem: isLinkedIn ? 'LinkedIn' : 'Manual',
        linkedinUrl: companyUrl || undefined,
        linkedinCompanyId: companyId || undefined,
        description: description || undefined,
        industry: industry || undefined,
        location: location || undefined,
        followerCount,
        logoUrl: logoUrl || undefined,
        searchInput: searchInput || undefined,
        normalizedPhone: normPhone || undefined,
        phoneType: normPhone ? (detectarTipoContato(normPhone) as any) : 'desconhecido',
        biography: biography || undefined,
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        timeline: [
          {
            id: 'timeline-import',
            date: new Date().toLocaleDateString('pt-BR'),
            title: 'Lead Importado via Copiar e Colar',
            description: `Lead adicionado à lista ativa de prospecção. Origem: ${isLinkedIn ? 'LinkedIn' : 'Excel/Manual'}.`
          }
        ]
      };

      importedLeadsList.push(newLead);
      successCount++;
      nameLocationSet.add(normalizedNameLoc);
      if (normPhone) phoneMap.set(normPhone, newLead);
    }

    if (importedLeadsList.length > 0) {
      onImportLeads(importedLeadsList);
    }

    setImportLog({
      success: successCount,
      discarded: discardedCount,
      duplicates: duplicateCount,
      details: [`Mapeamento concluído com sucesso.`, ...details]
    });
    setImportText('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section Layout */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users size={12} className="fill-blue-500/10" /> Monitoramento & Captação
          </span>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight mt-1">Base Ativa de Leads</h1>
          <p className="text-slate-400 mt-1 font-medium">Controle geral da prospecção, envio de abordagens personalizadas e monitoramento regional.</p>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-xl shrink-0">
          <button
            onClick={() => { setActiveTab('LIST'); setImportLog(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'LIST' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Todos os Leads ({leads.filter(l => !l.optOut).length})
          </button>
          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'IMPORT' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={13} />
            Mapear Excel/CSV
          </button>
        </div>
      </div>

      {/* Main Container Views */}
      {activeTab === 'TUTORIAL' ? (
        /* Tutorial instructions - Fallback if needed */
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8">Tutorial content here...</div>
      ) : activeTab === 'IMPORT' ? (
        /* MÓDULO 4: Resilient Spreadsheet/CSV Importer */
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-xl max-w-4xl mx-auto">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-500" />
              Resilient Copiar-Colar Excel/CSV
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cole linhas diretamente de sua planilha Excel, Google Sheets ou arquivos CSV. O motor detectará automaticamente as colunas principais como <strong>phone</strong>, <strong>phoneUnformatted</strong>, <strong>website</strong> e <strong>title</strong> (Nome da Empresa).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 leading-relaxed space-y-1.5">
            <div className="font-bold text-slate-300">Regras de Processamento Ativo:</div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><strong>Estrutura Esperada:</strong> Mapeia diretamente colunas de <code>phone</code>, <code>phoneUnformatted</code>, <code>website</code> e <code>title</code>.</li>
              <li><strong>Normalização Inteligente:</strong> Telefones são limpos e padronizados para o formato brasileiro utilizando a coluna limpa ou formatada para garantir a precisão.</li>
              <li><strong>Segmentação:</strong> Telefones de 9 dígitos que iniciam com "9" são marcados como <span className="text-emerald-400">WhatsApp</span>, senão como <span className="text-slate-400">Fixo</span>.</li>
              <li><strong>Prevenção de Duplicatas:</strong> Números que já constam na base de dados do CRM serão sumariamente ignorados.</li>
            </ul>
          </div>

          <div className="space-y-2 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              Cidade de Prospecção Padrão (Fallback)
            </label>
            <input
              type="text"
              value={defaultCity}
              onChange={(e) => setDefaultCity(e.target.value)}
              placeholder="Ex: Rio de Janeiro, Salvador, Curitiba..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
              <span>Cole os dados aqui (com cabeçalho na 1ª linha)</span>
              <span className="text-slate-500 text-[11px]">Aceita separadores Tab (Excel), Vírgula ou Ponto e Vírgula</span>
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="phone&#9;phoneUnformatted&#9;website&#9;title&#10;+55 11 4654-2702&#9;+551146542702&#9;https://www.facebook.com/marcenariarestaurantearuja/&#9;Marcenaria Restaurante"
              className="w-full h-48 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl p-4 text-xs font-mono text-slate-300 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleProcessImport}
            disabled={!importText.trim()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-900/30 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Upload size={16} />
            Mapear e Enriquecer Leads
          </button>

          {importLog && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-200">Relatório de Importação</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-lg font-black text-emerald-400">{importLog.success}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Importados</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-lg font-black text-amber-400">{importLog.duplicates}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Duplicados</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-lg font-black text-rose-400">{importLog.discarded}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Inválidos</div>
                </div>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto border-t border-slate-800 pt-3 text-xs font-mono text-slate-400">
                {importLog.details.map((detail, idx) => (
                  <div key={idx} className="flex gap-2 items-start py-0.5">
                    <span className="text-blue-500">&#8250;</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Leads List View with Advanced Collapsible Filters (Requirement 8) */
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
          
          {/* Filters Bar & Expanded Panels */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/40 space-y-4">
            
            {/* Top Row: Search Input + Advanced Filter Toggle */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Filtrar por nome da empresa, nicho ou localização..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-850 outline-none focus:border-blue-500 rounded-xl text-sm font-medium transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Advanced Filters toggler button */}
              <button
                type="button"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                  isFiltersExpanded 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Filter size={14} />
                {isFiltersExpanded ? 'Ocultar Filtros' : 'Filtros Avançados'}
                {isFiltersExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 font-black uppercase text-xs tracking-wider px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Download size={14} /> Exportar CSV
              </button>
            </div>

            {/* COLLAPSED ADVANCED FILTERS PANEL (Cidade, Segmento, Origem, Temperatura, Etapa, Data, Responsável) */}
            {isFiltersExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-950 border border-slate-850 rounded-2xl animate-fadeIn text-xs">
                
                {/* 1. Cidade */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade de Prospecção</label>
                  <select 
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-medium outline-none"
                  >
                    <option value="ALL">Todas as Cidades</option>
                    {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* 2. Segmento / Categoria */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Segmento / Ramo</label>
                  <select 
                    value={filterSegment}
                    onChange={(e) => setFilterSegment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-medium outline-none"
                  >
                    <option value="ALL">Todos os Segmentos</option>
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* 3. Origem */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Origem da Captação</label>
                  <select 
                    value={filterOrigin}
                    onChange={(e) => setFilterOrigin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-medium outline-none"
                  >
                    <option value="ALL">Todas as Origens</option>
                    <option value="Google Maps">Google Maps</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                {/* 4. Temperatura do Lead Score */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Temperatura comercial</label>
                  <select 
                    value={filterTemperature}
                    onChange={(e) => setFilterTemperature(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-medium outline-none"
                  >
                    <option value="ALL">Todas as Temperaturas</option>
                    <option value="Muito Quente">🔥 Muito Quente (Score &gt;= 80)</option>
                    <option value="Quente">🟢 Quente (Score &gt;= 40)</option>
                    <option value="Morno">🟡 Morno (Score &gt;= 20)</option>
                    <option value="Frio">❄️ Frio (Score &lt; 20)</option>
                  </select>
                </div>

                {/* 5. Etapa CRM */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Etapa do Pipeline</label>
                  <select 
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-medium outline-none"
                  >
                    <option value="ALL">Todos os Estágios</option>
                    <option value="NOVO">NOVO LEAD</option>
                    <option value="CONTATADO">CONTATADO</option>
                    <option value="DEMONSTROU_INTERESSE">DEMONSTROU INTERESSE</option>
                    <option value="NAO_RESPONDEU">NÃO RESPONDEU</option>
                    <option value="FECHADO">FECHADO (GANHO)</option>
                    <option value="PERDIDO">PERDIDO</option>
                  </select>
                </div>

                {/* 6. Responsável Atribuído */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Responsável Comercial</label>
                  <select 
                    value={filterResponsible}
                    onChange={(e) => setFilterResponsible(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-medium outline-none"
                  >
                    <option value="ALL">Todos os Responsáveis</option>
                    {uniqueResponsibles.map(resp => <option key={resp} value={resp}>{resp}</option>)}
                  </select>
                </div>

                {/* 7. Data Inicial */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Coleta De</label>
                  <input 
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 font-mono outline-none"
                  />
                </div>

                {/* 8. Data Final */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Coleta Até</label>
                  <input 
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 font-mono outline-none"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 md:col-span-4 flex justify-end gap-3 pt-2 border-t border-slate-900">
                  <button 
                    type="button"
                    onClick={() => {
                      setFilterCity('ALL');
                      setFilterSegment('ALL');
                      setFilterOrigin('ALL');
                      setFilterTemperature('ALL');
                      setFilterStage('ALL');
                      setFilterResponsible('ALL');
                      setFilterDateStart('');
                      setFilterDateEnd('');
                    }}
                    className="px-4 py-2 bg-slate-900 text-slate-400 hover:text-slate-200 font-bold rounded-lg"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            )}
            
            {/* Bottom Row: Quick Status Tabs */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              {/* Channel Filter Group */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Canal de Prospecção:</span>
                <div className="flex flex-wrap bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                  <button
                    type="button"
                    onClick={() => setChannelFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                      channelFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users size={12} />
                    Todos ({leads.filter(l => !l.optOut).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelFilter('WHATSAPP')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                      channelFilter === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    <Phone size={12} />
                    WhatsApp ({whatsappCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelFilter('INSTAGRAM')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                      channelFilter === 'INSTAGRAM' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-pink-400'
                    }`}
                  >
                    <Instagram size={12} />
                    Instagram ({instagramCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelFilter('FACEBOOK')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                      channelFilter === 'FACEBOOK' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-400'
                    }`}
                  >
                    <Facebook size={12} />
                    Facebook ({facebookCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannelFilter('LINKEDIN')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                      channelFilter === 'LINKEDIN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-400'
                    }`}
                  >
                    <Linkedin size={12} className="fill-blue-500/10" />
                    LinkedIn ({linkedinCount})
                  </button>
                </div>
              </div>

              {/* Status Filter Group */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtro Rápido Contato:</span>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
                  <button
                    type="button"
                    onClick={() => setContactFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      contactFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      contactFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pendentes ({leads.filter(l => !l.optOut && (l.status === 'NOVO' || !l.status)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactFilter('CONTACTED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      contactFilter === 'CONTACTED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Contatados ({leads.filter(l => !l.optOut && l.status === 'CONTATADO').length})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Leads (Square Frame Bento Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredLeads.map((lead) => {
              const phoneClassification = lead.phoneType || detectarTipoContato(lead.phone);
              const isFixo = phoneClassification === 'fixo';
              const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);

              return (
                <div 
                  key={lead.id}
                  data-lead-id={lead.id}
                  data-status={lead.status || 'NOVO'}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`group relative flex flex-col justify-between p-6 rounded-[1.5rem] border transition-colors duration-150 shadow-md min-h-[300px] h-auto pb-5 cursor-pointer ${
                    lead.videoReactivationSent
                      ? 'bg-gradient-to-tr from-[#1c121e] via-[#0f172a] to-[#0f172a] border-rose-900/50 text-slate-100 hover:border-rose-800/80 shadow-inner'
                      : isFixo 
                        ? 'bg-white border-slate-200 text-slate-800 hover:border-slate-300' 
                        : 'bg-slate-900 border-slate-800 text-slate-100 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col gap-3.5">
                    {/* Header: Company and delete button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2.5 min-w-0 flex-1">
                        {lead.logoUrl && (
                          <img 
                            src={lead.logoUrl} 
                            alt="logo" 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl border border-slate-700/50 shrink-0 bg-slate-950 object-cover mt-0.5" 
                          />
                        )}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <h3 data-field="nome" className={`font-extrabold text-base leading-snug tracking-tight line-clamp-2 ${
                            isFixo ? 'text-slate-900' : 'text-slate-100'
                          }`} title={lead.name}>
                            {lead.name}
                          </h3>
                          
                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {lead.videoReactivationSent && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800/40 flex items-center gap-1 shrink-0 animate-pulse">
                                <Video size={8} className="fill-rose-400 text-rose-400 shrink-0" /> Reativação Enviada
                              </span>
                            )}
                            {(lead.origem === 'LinkedIn' || lead.linkedinUrl) && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-900/30 text-blue-300 border border-blue-800/30 flex items-center gap-1 shrink-0">
                                <Linkedin size={8} className="fill-blue-400 text-blue-400" /> LinkedIn
                              </span>
                            )}
                            {(lead.facebook || lead.origem?.toLowerCase().includes('facebook')) && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-950/40 text-blue-300 border border-blue-900/40 flex items-center gap-1 shrink-0">
                                <Facebook size={8} className="fill-blue-400 text-blue-400" /> Facebook
                              </span>
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md truncate max-w-[120px] ${
                              isFixo ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                            }`}>
                              {lead.category || 'Geral'}
                            </span>
                            {lead.city && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md truncate max-w-[100px] ${
                                isFixo ? 'bg-blue-50 text-blue-700' : 'bg-blue-950/45 text-blue-300'
                              }`}>
                                {lead.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right control panel */}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onDeleteLead(lead.id)}
                          className={`shrink-0 p-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            isFixo
                              ? 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 hover:border-rose-900/40'
                          }`}
                          title="Excluir Lead"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div className="flex items-center gap-2">
                      <Phone size={14} className={isFixo ? 'text-slate-500' : 'text-slate-400'} />
                      <span data-field="telefone" className={`text-sm font-mono font-bold ${
                        isFixo ? 'text-slate-800' : 'text-slate-200'
                      }`}>
                        {lead.phone || 'não disponível'}
                      </span>
                      {!isFixo && lead.phone && lead.phone !== 'não disponível' && (
                        <span className="inline-flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          <MessageSquare size={8} fill="currentColor" /> WhatsApp
                        </span>
                      )}
                      {isFixo && lead.phone && lead.phone !== 'não disponível' && (
                        <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-500 text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Fixo
                        </span>
                      )}
                    </div>

                    {/* Website */}
                    <div>
                      {lead.website && lead.website !== 'não disponível' ? (
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs flex items-center gap-1.5 font-bold transition-all truncate pb-1 ${
                            isFixo 
                              ? 'text-blue-600 hover:text-blue-700 hover:underline' 
                              : 'text-blue-400 hover:text-blue-300 hover:underline'
                          }`}
                          title={lead.website}
                        >
                          <Globe size={12} /> 
                          <span className="truncate">{lead.website.replace('https://', '').replace('http://', '').split('/')[0]}</span>
                        </a>
                      ) : (
                        <span className={`text-xs flex items-center gap-1.5 font-medium italic ${
                          isFixo ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <Globe size={12} /> Sem site
                        </span>
                      )}
                    </div>

                    {/* Lead Score Indicator Block */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/40">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${scoreInfo.color}`}>
                        {scoreInfo.label} ({scoreInfo.points} pts)
                      </span>
                      {lead.responsibleUser?.name && (
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${isFixo ? 'text-slate-500' : 'text-slate-400'}`}>
                          👤 {lead.responsibleUser.name}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Operational CRM Quick outreach buttons */}
                  <div className={`flex flex-col gap-3 mt-4 pt-4 border-t ${isFixo ? 'border-slate-100' : 'border-slate-800/60'}`} onClick={(e) => e.stopPropagation()}>
                    {/* WhatsApp */}
                    {lead.phone && lead.phone !== 'não disponível' && (
                      <div className="space-y-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider ${isFixo ? 'text-slate-400' : 'text-slate-500'}`}>WhatsApp</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendWhatsAppMessage(lead.id, 'SITE');
                            }}
                            className="flex items-center justify-center gap-1 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-colors shadow-sm cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white active:bg-emerald-700"
                            title="Abordar no WhatsApp: Venda de Site"
                          >
                            <Globe size={10} />
                            Venda de Site
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendWhatsAppMessage(lead.id, 'TRAFEGO');
                            }}
                            className="flex items-center justify-center gap-1 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-colors shadow-sm cursor-pointer bg-blue-600 hover:bg-blue-500 text-white active:bg-blue-700"
                            title="Abordar no WhatsApp: Tráfego Pago"
                          >
                            <Zap size={10} fill="currentColor" />
                            Tráfego Pago
                          </button>
                        </div>
                        {lead.status === 'NAO_RESPONDEU' && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendVideoReactivation(lead.id);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 font-black uppercase py-2.5 px-3 rounded-xl text-[10px] transition-colors shadow-md cursor-pointer bg-rose-600 hover:bg-rose-500 text-white active:bg-rose-700 border border-rose-500/30 animate-pulse"
                              title="Abordar no WhatsApp: Vídeo Reativação"
                            >
                              <Video size={11} className="fill-white/10" />
                              Vídeo Reativação
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Instagram */}
                    {lead.instagram && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-pink-400/85 font-extrabold">Instagram</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSocialAbordagem(lead.id, 'INSTAGRAM', 'SITE');
                            }}
                            className="flex items-center justify-center gap-1 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-colors shadow-sm cursor-pointer bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white"
                          >
                            <Instagram size={10} />
                            Venda de Site
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSocialAbordagem(lead.id, 'INSTAGRAM', 'TRAFEGO');
                            }}
                            className="flex items-center justify-center gap-1 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-colors shadow-sm cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white"
                          >
                            <Zap size={10} fill="currentColor" />
                            Tráfego Pago
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Facebook */}
                    {(lead.facebook || lead.origem?.toLowerCase().includes('facebook')) && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 font-extrabold">Facebook</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSocialAbordagem(lead.id, 'FACEBOOK', 'SITE');
                            }}
                            className="flex items-center justify-center gap-1 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-colors shadow-sm cursor-pointer bg-blue-700 hover:bg-blue-600 text-white"
                            title="Abordar no Facebook: Venda de Site"
                          >
                            <Facebook size={10} />
                            Venda de Site
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSocialAbordagem(lead.id, 'FACEBOOK', 'TRAFEGO');
                            }}
                            className="flex items-center justify-center gap-1 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-colors shadow-sm cursor-pointer bg-blue-600 hover:bg-blue-500 text-white"
                            title="Abordar no Facebook: Tráfego Pago"
                          >
                            <Zap size={10} fill="currentColor" />
                            Tráfego Pago
                          </button>
                        </div>
                      </div>
                    )}

                    {/* LinkedIn */}
                    {(lead.linkedinUrl || lead.origem === 'LinkedIn') && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-sky-400 font-extrabold">LinkedIn</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSocialAbordagem(lead.id, 'LINKEDIN', 'SITE');
                            }}
                            className="flex items-center justify-center gap-1 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-colors shadow-sm cursor-pointer bg-blue-800 hover:bg-blue-700 text-white"
                            title="Abordar no LinkedIn: Venda de Site"
                          >
                            <Linkedin size={10} />
                            Venda de Site
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSocialAbordagem(lead.id, 'LINKEDIN', 'TRAFEGO');
                            }}
                            className="flex items-center justify-center gap-1 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-colors shadow-sm cursor-pointer bg-blue-700 hover:bg-blue-600 text-white"
                            title="Abordar no LinkedIn: Tráfego Pago"
                          >
                            <Zap size={10} fill="currentColor" />
                            Tráfego Pago
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fallback selling script button if no other social/phone channel is active */}
                    {!(lead.phone && lead.phone !== 'não disponível') && !lead.instagram && !lead.facebook && lead.origem !== 'Facebook' && !lead.linkedinUrl && lead.origem !== 'LinkedIn' && (
                      <div className="space-y-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider ${isFixo ? 'text-slate-400' : 'text-slate-500'}`}>Script de Abordagem</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSocialAbordagem(lead.id, 'INSTAGRAM', 'SITE');
                            }}
                            className="col-span-2 flex items-center justify-center gap-1 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-colors shadow-sm cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60"
                          >
                            <MessageSquare size={10} />
                            Copiar Script de Abordagem
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Etapa status controls */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/20">
                      <div className="col-span-2 text-[9px] font-black uppercase tracking-wider text-slate-500">Status no CRM</div>
                      <span data-field="status" className={`text-[10px] font-black uppercase text-center py-2 px-3 rounded-xl border ${getStatusColor(lead.status || 'NOVO')}`}>
                        {lead.status || 'NOVO'}
                      </span>
                      <select
                        data-field="status-select"
                        value={lead.status || 'NOVO'}
                        onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                        className={`text-[10px] font-bold uppercase py-2 px-2.5 rounded-xl border outline-none cursor-pointer ${
                          isFixo 
                            ? 'bg-slate-50 border-slate-250 text-slate-700' 
                            : 'bg-slate-950 border-slate-850 text-slate-300'
                        }`}
                      >
                        <option value="NOVO">NOVO</option>
                        <option value="CONTATADO">CONTATADO</option>
                        <option value="DEMONSTROU_INTERESSE">INTERESSADO</option>
                        <option value="NAO_RESPONDEU">NÃO RESP.</option>
                        <option value="FECHADO">FECHADO</option>
                        <option value="PERDIDO">PERDIDO</option>
                      </select>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {filteredLeads.length === 0 && (
            <div className="p-24 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
              <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                <div className="bg-slate-950 p-6 rounded-full border border-slate-800 shadow-inner">
                  <Search size={40} className="text-slate-600 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-200">Nenhum lead disponível</h3>
                  <p className="text-slate-500 text-xs">Modifique seus filtros de busca ou inicie a captação regional de novos leads.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Popups / Alerts notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/30 text-emerald-300 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="bg-emerald-500/15 p-2 rounded-xl text-emerald-400">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="font-extrabold text-sm text-slate-100">Abordagem Pronta!</p>
            <p className="text-xs text-slate-400 mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Modal de Abordagem */}
      {abordagemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setAbordagemModal(null)}>
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/55">
              <div className="flex items-center gap-2.5">
                {abordagemModal.platform === 'INSTAGRAM' ? (
                  <div className="bg-pink-500/15 p-2 rounded-xl text-pink-400">
                    <Instagram size={18} />
                  </div>
                ) : abordagemModal.platform === 'FACEBOOK' ? (
                  <div className="bg-blue-500/15 p-2 rounded-xl text-blue-400">
                    <Facebook size={18} />
                  </div>
                ) : abordagemModal.platform === 'LINKEDIN' ? (
                  <div className="bg-blue-600/15 p-2 rounded-xl text-blue-400">
                    <Linkedin size={18} className="fill-blue-500" />
                  </div>
                ) : (
                  <div className="bg-emerald-500/15 p-2 rounded-xl text-emerald-400">
                    <Phone size={18} />
                  </div>
                )}
                <div>
                  <h3 className="font-black uppercase tracking-wide text-sm">
                    Abordagem no {abordagemModal.platform === 'INSTAGRAM' ? 'Instagram' : abordagemModal.platform === 'FACEBOOK' ? 'Facebook' : abordagemModal.platform === 'LINKEDIN' ? 'LinkedIn' : 'WhatsApp'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Lead: <span className="font-bold text-slate-200">{abordagemModal.lead.name}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAbordagemModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl text-xs space-y-1 font-medium leading-relaxed">
                <p className="font-extrabold flex items-center gap-1 text-slate-100 uppercase tracking-wider text-[10px]">
                  <CheckCircle size={12} className="text-emerald-400" /> Copiado automaticamente!
                </p>
                <p className="text-slate-300 text-[11px]">
                  {abordagemModal.platform === 'WHATSAPP' 
                    ? 'O texto já está na sua área de transferência. Você pode clicar no botão enviar abaixo ou pressionar Ctrl + V no chat do WhatsApp para colar e enviar!'
                    : abordagemModal.platform === 'LINKEDIN'
                    ? 'O texto já está na sua área de transferência. Basta abrir o perfil do lead no LinkedIn e pressionar Ctrl + V para enviar a mensagem ou convite!'
                    : 'O texto já está na sua área de transferência. Basta abrir o chat da página do lead e pressionar Ctrl + V para colar e enviar!'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Texto da Mensagem (Copie ou Edite abaixo)</label>
                <textarea
                  className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-sans resize-none leading-relaxed"
                  value={abordagemModal.message}
                  onChange={(e) => setAbordagemModal({ ...abordagemModal, message: e.target.value })}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/35 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(abordagemModal.message).then(() => {
                    setCopiedStatus(true);
                    setToastMessage('Mensagem copiada para a área de transferência!');
                    setTimeout(() => setToastMessage(null), 3000);
                  });
                }}
                className={`flex-1 flex items-center justify-center gap-2 font-black uppercase py-3.5 px-4 rounded-xl text-xs transition-all shadow-md active:scale-95 ${
                  copiedStatus 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold'
                }`}
              >
                {copiedStatus ? (
                  <>
                    <CheckCircle size={15} />
                    Copiado com Sucesso!
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    Copiar Novamente
                  </>
                )}
              </button>

              {abordagemModal.platform === 'WHATSAPP' ? (
                <button
                  type="button"
                  onClick={() => {
                    const encodedMsg = encodeURIComponent(abordagemModal.message);
                    const phoneDigits = abordagemModal.lead.phone.replace(/\D/g, '');
                    const formattedPhone = phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits;
                    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}`, '_blank');
                    handleConfirmAbordagem(abordagemModal.lead, abordagemModal.copyId, abordagemModal.copyName, abordagemModal.platform);
                    setAbordagemModal(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 font-black uppercase py-3.5 px-4 rounded-xl text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md active:scale-95 text-center font-bold"
                >
                  Enviar via WhatsApp
                  <ExternalLink size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    window.open(abordagemModal.url, '_blank');
                    handleConfirmAbordagem(abordagemModal.lead, abordagemModal.copyId, abordagemModal.copyName, abordagemModal.platform);
                    setAbordagemModal(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 font-black uppercase py-3.5 px-4 rounded-xl text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md active:scale-95 text-center font-bold"
                >
                  Abrir Perfil do Lead
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED LEAD PROFILE POPUP DRAWER MODAL */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onUpdateLead={(updated) => {
            onUpdateLead(updated);
          }}
        />
      )}

      {/* VÍDEO REATIVAÇÃO MODAL (M3 campaign popup) */}
      {reactivationModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans" onClick={() => setReactivationModal(null)}>
          <div 
            className="bg-slate-900 border border-slate-800 rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800/60 bg-slate-950/20 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                  <Play size={10} className="fill-rose-400 text-rose-400" /> Campanha de Reativação Ativa
                </span>
                <h3 className="text-lg font-extrabold text-slate-100 tracking-tight mt-0.5">Enviar Vídeo Reativação</h3>
              </div>
              <button
                type="button"
                onClick={() => setReactivationModal(null)}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(100vh-200px)]">
              {/* Copy Status Notification */}
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-xs space-y-1 font-medium leading-relaxed">
                <p className="font-extrabold flex items-center gap-1 text-slate-100 uppercase tracking-wider text-[10px]">
                  <CheckCircle size={12} className="text-rose-400" /> Mensagem Copiada Automaticamente!
                </p>
                <p className="text-slate-300 text-[11px]">
                  A mensagem de reativação com o vídeo foi copiada para sua área de transferência. Ao abrir o WhatsApp, basta colar (<kbd className="bg-rose-950 border border-rose-900 px-1 py-0.5 rounded font-mono text-[9px]">Ctrl + V</kbd>) e anexar o arquivo do vídeo.
                </p>
              </div>

              {/* Video Mock Thumbnail Card */}
              <div className="relative group overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-tr from-slate-950 via-rose-950/25 to-slate-950 p-6 flex flex-col justify-between items-center h-48 shadow-inner">
                <div className="absolute top-3 left-3 bg-slate-950/60 backdrop-blur-md px-2.5 py-0.5 border border-slate-800/80 rounded-full text-[9px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                  Vídeo Anexo
                </div>
                <div className="absolute top-3 right-3 bg-emerald-500/10 backdrop-blur-md px-2.5 py-0.5 border border-emerald-500/20 rounded-full text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Pronto para Enviar
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center space-y-2 mt-4">
                  <div className="p-4 rounded-full bg-rose-600/15 group-hover:bg-rose-600/25 border-2 border-rose-500/40 text-rose-400 transition-all transform group-hover:scale-105 duration-300 cursor-pointer flex items-center justify-center">
                    <Play size={24} className="fill-rose-400 shrink-0 ml-0.5" />
                  </div>
                  <p className="text-xs font-black text-slate-200 uppercase tracking-wider text-center max-w-[280px]">
                    Sua empresa ainda não tem um site profissional?
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold tracking-tight">
                    Duração: 0:45 &bull; Formato: MP4 (Padrão de Qualidade LPs)
                  </p>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-[11px] text-slate-400 space-y-2 font-medium">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-300">Como enviar o vídeo no WhatsApp Web / Desktop:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                  <li>Clique no botão <span className="text-emerald-400 font-bold">"Enviar via WhatsApp"</span> abaixo.</li>
                  <li>No chat aberto de <span className="text-slate-200 font-bold">{reactivationModal.lead.name}</span>, cole a mensagem com <kbd className="bg-slate-900 border border-slate-800 px-1 rounded">Ctrl+V</kbd>.</li>
                  <li>Arraste e solte o arquivo do vídeo reativação no chat para anexá-lo e envie!</li>
                </ol>
              </div>

              {/* Message Display Area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Texto da Mensagem</label>
                <textarea
                  className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-medium text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500/30 font-sans resize-none leading-relaxed"
                  value={reactivationModal.message}
                  readOnly
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/35 flex gap-3">
              <button
                type="button"
                onClick={() => setReactivationModal(null)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 cursor-pointer text-center"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedHistory = [...(reactivationModal.lead.whatsappContactHistory || [])];
                  updatedHistory.push(new Date().toISOString());
                  onUpdateLead({ 
                    ...reactivationModal.lead, 
                    videoReactivationSent: true,
                    whatsappContactHistory: updatedHistory
                  });
                  window.open(reactivationModal.url, '_blank');
                  setReactivationModal(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-950/30 active:scale-95 text-center font-bold flex items-center justify-center gap-1.5"
              >
                Enviar via WhatsApp
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeadsListView;
