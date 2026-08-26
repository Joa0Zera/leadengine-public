import React, { useState } from 'react';
import { Lead, LeadStatus, ClosingStatus } from '../types';
import { detectarTipoContato, calcularLeadScore, detectarGaps } from '../helpers';
import LeadDetailModal from './LeadDetailModal';
import { 
  MoreHorizontal, 
  Calendar, 
  MessageSquare, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  Trello, 
  Clock, 
  Zap, 
  AlertTriangle,
  Search,
  X,
  Target,
  DollarSign,
  Flame,
  Award,
  Sparkles,
  Layers,
  ArrowRight,
  Video,
  Play,
  CheckCircle,
  ExternalLink,
  Undo,
  Download,
  FileSpreadsheet,
  Copy
} from 'lucide-react';

interface Props {
  leads: Lead[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onUpdateLead: (updatedLead: Lead) => void;
}

const PipelineView: React.FC<Props> = ({ leads, onUpdateStatus, onUpdateLead }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activePipeline, setActivePipeline] = useState<'OUTBOUND' | 'CLOSING'>('OUTBOUND');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = leads.find(l => l.id === selectedLeadId) || null;
  
  // Mandatory Loss Reason state
  const [lossReasonLead, setLossReasonLead] = useState<Lead | null>(null);
  const [selectedLossReason, setSelectedLossReason] = useState('');

  // Video Reactivation state
  const [reactivationModal, setReactivationModal] = useState<{
    lead: Lead;
    message: string;
    url: string;
  } | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Copiar JSON modal state (edição de serviço/descrição/cores antes de copiar)
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonModalLead, setJsonModalLead] = useState<Lead | null>(null);
  const [jsonFormData, setJsonFormData] = useState({
    servico: '',
    descricao: '',
    cor_primaria: '#4a9eff',
    cor_secundaria: '#2d5a7a',
    cor_destaque: '#ffa500'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopiarJSON = (lead: Lead) => {
    setJsonModalLead(lead);
    setJsonFormData({
      servico: lead.category || lead.secondaryCategories?.join(', ') || '',
      descricao: lead.description || lead.biography || '',
      cor_primaria: '#4a9eff',
      cor_secundaria: '#2d5a7a',
      cor_destaque: '#ffa500'
    });
    setShowJsonModal(true);
  };

  const handleCopiarJSONCompleto = () => {
    if (!jsonModalLead) return;

    const jsonData = {
      nome: jsonModalLead.name || 'Lead',
      contato: jsonModalLead.phone || jsonModalLead.normalizedPhone || '',
      website: jsonModalLead.website || '',
      endereco: jsonModalLead.address || jsonModalLead.location || '',
      servico: jsonFormData.servico || 'Não especificado',
      descricao: jsonFormData.descricao || '',
      rating: jsonModalLead.rating || 0,
      reviews_count: jsonModalLead.userRatingsTotal || 0,
      horario: '', // não coletado pelo scraper atual, mantido para compatibilidade com o schema do Nevion Hub
      cor_primaria: jsonFormData.cor_primaria,
      cor_secundaria: jsonFormData.cor_secundaria,
      cor_destaque: jsonFormData.cor_destaque
    };

    const jsonString = JSON.stringify([jsonData], null, 2);

    navigator.clipboard.writeText(jsonString).then(() => {
      showToast('JSON com informações completas copiado!');
      setShowJsonModal(false);
    }).catch(err => {
      console.warn('Erro ao copiar JSON:', err);
      showToast('Erro ao copiar JSON');
    });
  };

  const handleReturnToProspecting = (lead: Lead) => {
    const updatedLead: Lead = {
      ...lead,
      status: 'CONTATADO',
    };
    delete updatedLead.closingStatus;

    // Add timeline entry
    const timelineEntry = {
      id: 'timeline-' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      title: `Retornado para Prospecção`,
      description: `Lead removido do pipeline de Fechamento e devolvido para a etapa de Contatados no CRM de Prospecção.`
    };
    updatedLead.timeline = [timelineEntry, ...(lead.timeline || [])];

    onUpdateLead(updatedLead);
    showToast(`Lead "${lead.name}" retornado ao CRM de Prospecção com sucesso!`);
  };

  // Column arrays
  const outboundColumns: LeadStatus[] = ['NOVO', 'CONTATADO', 'DEMONSTROU_INTERESSE', 'NAO_RESPONDEU', 'FECHADO', 'PERDIDO'];

  const closingStages: { status: ClosingStatus; label: string; color: string; description: string }[] = [
    { status: 'PROJETO_EM_DESENVOLVIMENTO', label: 'Desenvolvimento', color: 'border-l-indigo-500', description: 'Site / Landing Page em criação e desenvolvimento' },
    { status: 'PROJETO_ENTREGUE', label: 'Projeto Entregue', color: 'border-l-teal-500', description: 'Projeto entregue ao cliente para revisão / aprovação' },
    { status: 'FECHADO', label: 'Projeto Fechado Pronto', color: 'border-l-emerald-500', description: 'Projeto aprovado, concluído e faturado' }
  ];

  const getColumnLabel = (col: LeadStatus) => {
    if (col === 'NAO_RESPONDEU') return 'NÃO RESPONDEU';
    if (col === 'DEMONSTROU_INTERESSE') return 'DEMONSTROU INTERESSE';
    return col;
  };

  const getDaysInCRM = (collectedAt?: string) => {
    if (!collectedAt) return 0;
    const collectedDate = new Date(collectedAt);
    if (isNaN(collectedDate.getTime())) return 0;
    
    const today = new Date();
    const d1 = Date.UTC(collectedDate.getFullYear(), collectedDate.getMonth(), collectedDate.getDate());
    const d2 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    
    const days = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  const handleSendVideoReactivation = (lead: Lead) => {
    if (!lead.phone || lead.phone === 'não disponível') return;
    const phoneDigits = lead.phone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits;
    
    const message = `Olá! Tudo bem? 😊\n\nPassei novamente porque preparei um vídeo bem rápido para mostrar o padrão de qualidade das Landing Pages que desenvolvemos.\n\nAcredito que a sua empresa também poderia ter uma presença digital nesse nível.\n\nAssista ao vídeo e, se fizer sentido para vocês, me chama aqui. Terei o maior prazer em criar um modelo exclusivo para o seu negócio, sem qualquer compromisso. 🚀`;
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;

    navigator.clipboard.writeText(message).catch(err => {
      console.warn('Erro ao copiar automaticamente:', err);
    });

    setReactivationModal({ lead, message, url });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDropOutbound = (leadId: string, targetCol: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      if (targetCol === 'PERDIDO') {
        setLossReasonLead(lead);
      } else if (targetCol === 'DEMONSTROU_INTERESSE' && !lead.closingStatus) {
        onUpdateLead({
          ...lead,
          status: targetCol,
          closingStatus: 'PROJETO_EM_DESENVOLVIMENTO'
        });
      } else {
        onUpdateStatus(leadId, targetCol);
      }
    }
  };

  const handleDropClosing = (leadId: string, targetStage: ClosingStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      onUpdateLead({
        ...lead,
        closingStatus: targetStage,
        status: targetStage === 'FECHADO' ? 'FECHADO' : lead.status
      });
    }
  };

  // Moving left/right via micro-controls
  const handleMoveLeft = (lead: Lead, currentCol: LeadStatus) => {
    const currentIdx = outboundColumns.indexOf(currentCol);
    if (currentIdx > 0) {
      const nextCol = outboundColumns[currentIdx - 1];
      if (nextCol === 'DEMONSTROU_INTERESSE' && !lead.closingStatus) {
        onUpdateLead({ ...lead, status: nextCol, closingStatus: 'PROJETO_EM_DESENVOLVIMENTO' });
      } else {
        onUpdateStatus(lead.id, nextCol);
      }
    }
  };

  const handleMoveRight = (lead: Lead, currentCol: LeadStatus) => {
    const currentIdx = outboundColumns.indexOf(currentCol);
    if (currentIdx < outboundColumns.length - 1) {
      const nextCol = outboundColumns[currentIdx + 1];
      if (nextCol === 'PERDIDO') {
        setLossReasonLead(lead);
      } else if (nextCol === 'DEMONSTROU_INTERESSE' && !lead.closingStatus) {
        onUpdateLead({ ...lead, status: nextCol, closingStatus: 'PROJETO_EM_DESENVOLVIMENTO' });
      } else {
        onUpdateStatus(lead.id, nextCol);
      }
    }
  };

  const handleSaveLossReasonFromModal = () => {
    if (!lossReasonLead || !selectedLossReason) return;

    const calculateFollowUpDate = (r: string): string => {
      const today = new Date();
      let days = 30;
      if (r === 'Sem interesse no momento') days = 60;
      else if (r === 'Achou caro') days = 30;
      else if (r === 'Já possui agência/equipe') days = 90;
      else if (r === 'Vai pensar') days = 20;
      else if (r === 'Não respondeu após orçamento') days = 15;
      else if (r === 'Não respondeu após template') days = 15;
      else if (r === 'Escolheu outro fornecedor') days = 180;
      else if (r === 'Outro') days = 30;
      
      today.setDate(today.getDate() + days);
      return today.toISOString().split('T')[0];
    };

    const calculatedDate = calculateFollowUpDate(selectedLossReason);
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedLead: Lead = {
      ...lossReasonLead,
      status: 'PERDIDO',
      lossReason: selectedLossReason,
      lostAt: todayStr,
      followUpDate: calculatedDate
    };

    const timelineEntry = {
      id: 'timeline-' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      title: `Lead Perdido: ${selectedLossReason}`,
      description: `Definido motivo de perda. Recuperação agendada automaticamente para ${new Date(calculatedDate).toLocaleDateString('pt-BR')} (em ${selectedLossReason === 'Sem interesse no momento' ? 60 : selectedLossReason === 'Já possui agência/equipe' ? 90 : selectedLossReason === 'Vai pensar' ? 20 : selectedLossReason === 'Não respondeu após orçamento' || selectedLossReason === 'Não respondeu após template' ? 15 : selectedLossReason === 'Escolheu outro fornecedor' ? 180 : 30} dias).`
    };
    updatedLead.timeline = [timelineEntry, ...(lossReasonLead.timeline || [])];

    onUpdateLead(updatedLead);
    
    // reset states
    setLossReasonLead(null);
    setSelectedLossReason('');
  };

  const handleMoveClosingLeft = (lead: Lead, currentStage: ClosingStatus) => {
    const currentIdx = closingStages.findIndex(s => s.status === currentStage);
    if (currentIdx > 0) {
      const nextStage = closingStages[currentIdx - 1].status;
      onUpdateLead({
        ...lead,
        closingStatus: nextStage,
        status: nextStage === 'FECHADO' ? 'FECHADO' : lead.status
      });
    }
  };

  const handleMoveClosingRight = (lead: Lead, currentStage: ClosingStatus) => {
    const currentIdx = closingStages.findIndex(s => s.status === currentStage);
    if (currentIdx < closingStages.length - 1) {
      const nextStage = closingStages[currentIdx + 1].status;
      onUpdateLead({
        ...lead,
        closingStatus: nextStage,
        status: nextStage === 'FECHADO' ? 'FECHADO' : lead.status
      });
    }
  };

  // Export Interested/Closing Leads to CSV
  const handleExportClosingCSV = () => {
    const closingLeads = leads.filter(lead => {
      if (lead.optOut) return false;
      const hasClosingStatus = !!lead.closingStatus;
      const isInterested = lead.status === 'DEMONSTROU_INTERESSE';
      return hasClosingStatus || isInterested;
    });

    const leadsToExport = searchTerm.trim() !== ''
      ? closingLeads.filter(lead => {
          const searchLower = searchTerm.toLowerCase();
          const matchesName = lead.name?.toLowerCase().includes(searchLower);
          const matchesPhone = lead.phone?.toLowerCase().includes(searchLower);
          const matchesCity = lead.city?.toLowerCase().includes(searchLower);
          return matchesName || matchesPhone || matchesCity;
        })
      : closingLeads;

    if (leadsToExport.length === 0) {
      showToast('Nenhum lead interessado encontrado para exportar.');
      return;
    }

    const headers = [
      'ID',
      'Nome da Empresa / Lead',
      'Nicho / Categoria',
      'Telefone',
      'Tipo de Telefone',
      'Cidade',
      'Endereço',
      'Website',
      'Instagram',
      'Origem',
      'Status no CRM',
      'Etapa Fechamento',
      'Rótulo Etapa Fechamento',
      'Lead Score (Pontos)',
      'Classificação Temperatura',
      'GAPs Oportunidades',
      'Responsável',
      'Data de Entrada',
      'Próxima Ação',
      'Data Follow-Up',
      'Observações / Notas'
    ];

    const getStageLabel = (lead: Lead) => {
      if (lead.closingStatus === 'PROJETO_EM_DESENVOLVIMENTO') return 'Desenvolvimento';
      if (lead.closingStatus === 'PROJETO_ENTREGUE') return 'Projeto Entregue';
      if (lead.closingStatus === 'FECHADO' || lead.status === 'FECHADO') return 'Projeto Fechado Pronto';
      if (lead.status === 'DEMONSTROU_INTERESSE') return 'Demonstrou Interesse (Novo)';
      return lead.closingStatus || 'Interessado';
    };

    const csvRows = leadsToExport.map(lead => {
      const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);
      const name = (lead.name || '').replace(/"/g, '""');
      const category = (lead.category || '').replace(/"/g, '""');
      const phone = lead.phone || '';
      const phoneType = lead.phoneType || detectarTipoContato(lead.phone);
      const city = (lead.city || '').replace(/"/g, '""');
      const address = (lead.address || '').replace(/"/g, '""');
      const website = lead.website || '';
      const instagram = lead.instagram || lead.importantLinks?.instagram || '';
      const origem = lead.origem || 'Google Maps';
      const status = lead.status || 'DEMONSTROU_INTERESSE';
      const closingStatus = lead.closingStatus || (lead.status === 'DEMONSTROU_INTERESSE' ? 'PROJETO_EM_DESENVOLVIMENTO' : '');
      const stageLabel = getStageLabel(lead);
      const points = scoreInfo.points;
      const temperature = scoreInfo.label;
      const gaps = (lead.gaps || detectarGaps(lead)).join('; ');
      const resp = lead.responsibleUser?.name || 'Fundador (Nevion)';
      const collectedAt = lead.collectedAt || '';
      const nextAction = (lead.nextAction || '').replace(/"/g, '""');
      const followUpDate = lead.followUpDate || '';
      const notes = (lead.notes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');

      return [
        `"${lead.id}"`,
        `"${name}"`,
        `"${category}"`,
        `"${phone}"`,
        `"${phoneType}"`,
        `"${city}"`,
        `"${address}"`,
        `"${website}"`,
        `"${instagram}"`,
        `"${origem}"`,
        `"${status}"`,
        `"${closingStatus}"`,
        `"${stageLabel}"`,
        `"${points}"`,
        `"${temperature}"`,
        `"${gaps}"`,
        `"${resp}"`,
        `"${collectedAt}"`,
        `"${nextAction}"`,
        `"${followUpDate}"`,
        `"${notes}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `leads_interessados_fechamento_crm_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`${leadsToExport.length} leads interessados exportados para CSV com sucesso!`);
  };

  // Export Outbound leads to CSV
  const handleExportOutboundCSV = () => {
    const leadsToExport = filteredLeads;
    if (leadsToExport.length === 0) {
      showToast('Nenhum lead encontrado para exportar.');
      return;
    }

    const headers = [
      'ID',
      'Nome da Empresa / Lead',
      'Nicho / Categoria',
      'Telefone',
      'Tipo de Telefone',
      'Cidade',
      'Endereço',
      'Website',
      'Status no CRM',
      'Lead Score (Pontos)',
      'Classificação Temperatura',
      'GAPs Oportunidades',
      'Responsável',
      'Data de Coleta'
    ];

    const csvRows = leadsToExport.map(lead => {
      const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);
      const name = (lead.name || '').replace(/"/g, '""');
      const category = (lead.category || '').replace(/"/g, '""');
      const phone = lead.phone || '';
      const phoneType = lead.phoneType || detectarTipoContato(lead.phone);
      const city = (lead.city || '').replace(/"/g, '""');
      const address = (lead.address || '').replace(/"/g, '""');
      const website = lead.website || '';
      const status = lead.status || 'NOVO';
      const points = scoreInfo.points;
      const temperature = scoreInfo.label;
      const gaps = (lead.gaps || detectarGaps(lead)).join('; ');
      const resp = lead.responsibleUser?.name || 'Fundador (Nevion)';
      const collectedAt = lead.collectedAt || '';

      return [
        `"${lead.id}"`,
        `"${name}"`,
        `"${category}"`,
        `"${phone}"`,
        `"${phoneType}"`,
        `"${city}"`,
        `"${address}"`,
        `"${website}"`,
        `"${status}"`,
        `"${points}"`,
        `"${temperature}"`,
        `"${gaps}"`,
        `"${resp}"`,
        `"${collectedAt}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `leads_pipeline_outbound_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`${leadsToExport.length} leads do pipeline exportados para CSV!`);
  };

  const filteredLeads = leads.filter(lead => {
    if (lead.optOut) return false;

    // Filter by pipeline type
    if (activePipeline === 'CLOSING') {
      // Must be interested, closed, or manually initialized in closingStatus
      const hasClosingStatus = !!lead.closingStatus;
      const isInterested = lead.status === 'DEMONSTROU_INTERESSE';
      if (!hasClosingStatus && !isInterested) return false;
    }

    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = lead.name?.toLowerCase().includes(searchLower);
      const matchesPhone = lead.phone?.toLowerCase().includes(searchLower);
      const matchesCity = lead.city?.toLowerCase().includes(searchLower);
      return matchesName || matchesPhone || matchesCity;
    }

    return true;
  });

  return (
    <div id="pipeline-view-container" className="p-8 h-full flex flex-col bg-[#0f172a] text-[#f8fafc] min-h-screen space-y-6">
      
      {/* Dual Header Navigation Tabs for the two pipelines */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
            <Trello size={12} /> Pipeline Comercial Nevion
          </span>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight mt-1">Gestão de Pipelines Ativos</h1>
          <p className="text-slate-400 mt-1 font-medium">Controle de funis e fluxos automatizados de prospecção regional e fechamento high-ticket.</p>
        </div>
        
        {/* Toggle Switcher */}
        <div id="pipeline-toggle-switch" className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-xl shrink-0">
          <button
            id="btn-pipeline-outbound"
            onClick={() => setActivePipeline('OUTBOUND')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activePipeline === 'OUTBOUND' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            Outbound (Prospecção)
          </button>
          <button
            id="btn-pipeline-closing"
            onClick={() => setActivePipeline('CLOSING')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activePipeline === 'CLOSING' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target size={13} />
            Fechamento (Interessados)
          </button>
        </div>
      </div>

      {/* Controls & Metrics Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 border border-slate-800/60 rounded-2xl">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            id="pipeline-search-input"
            type="text"
            placeholder="Filtrar por nome, telefone ou cidade..."
            className="w-full bg-slate-950 text-xs border border-slate-800 rounded-xl pl-9 pr-8 py-3 outline-none text-slate-300 placeholder-slate-500 focus:border-blue-500/50 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Quick status counters & Action buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-850/80">
            <Clock size={12} className={activePipeline === 'CLOSING' ? "text-purple-400" : "text-blue-400"} />
            <span>
              {activePipeline === 'CLOSING' ? 'Interessados no Fechamento:' : 'Filtro Ativo:'}{' '}
              <strong className={activePipeline === 'CLOSING' ? "text-purple-300 font-black" : "text-slate-200"}>
                {filteredLeads.length}
              </strong> leads
            </span>
          </div>

          {activePipeline === 'CLOSING' ? (
            <button
              id="btn-export-closing-csv"
              type="button"
              onClick={handleExportClosingCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-900/30 cursor-pointer active:scale-95 border border-purple-400/30"
              title="Exportar Interessados do CRM de Fechamento para CSV"
            >
              <Download size={14} className="shrink-0" />
              Exportar Interessados (CSV)
            </button>
          ) : (
            <button
              id="btn-export-outbound-csv"
              type="button"
              onClick={handleExportOutboundCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer active:scale-95"
              title="Exportar Leads do Pipeline para CSV"
            >
              <Download size={14} className="shrink-0 text-slate-400" />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* PIPELINE KANBAN BOARD CONTENT */}
      {activePipeline === 'OUTBOUND' ? (
        /* ==================== OUTBOUND PIPELINE BOARD ==================== */
        <div id="outbound-board" className="flex-1 flex gap-6 overflow-x-auto pb-6 pr-4 h-[calc(100vh-250px)] min-h-[500px]">
          {outboundColumns.map(col => {
            const colLeads = filteredLeads.filter(l => (l.status || 'NOVO') === col);

            return (
              <div 
                key={col} 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData('text/plain');
                  handleDropOutbound(id, col);
                }}
                className="w-80 flex-shrink-0 flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-[1.5rem] p-4 space-y-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      col === 'FECHADO' ? 'bg-emerald-500' :
                      col === 'PERDIDO' ? 'bg-rose-500' :
                      col === 'NAO_RESPONDEU' ? 'bg-amber-500' :
                      col === 'DEMONSTROU_INTERESSE' ? 'bg-purple-500' : 'bg-blue-500'
                    }`} />
                    <h3 className="font-black text-slate-200 text-xs uppercase tracking-wider">{getColumnLabel(col)}</h3>
                  </div>
                  <span className="bg-slate-950 border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                    {colLeads.length}
                  </span>
                </div>
                
                {/* Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {colLeads.map(lead => {
                    const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);

                    return (
                      <div 
                        key={lead.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`p-4 rounded-xl border transition-all duration-300 relative cursor-pointer active:scale-95 group hover:shadow-lg ${
                          lead.videoReactivationSent
                            ? 'bg-gradient-to-br from-[#2a1120] to-[#090d16] border-fuchsia-500/40 hover:border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.12)]'
                            : 'bg-slate-900 border-slate-800/80 hover:border-blue-900/40'
                        }`}
                      >
                        {/* Drag Indicators / Controls */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleMoveLeft(lead, col)}
                            className="p-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded transition-all cursor-pointer"
                            title="Mover estágio anterior"
                          >
                            <ChevronLeft size={10} />
                          </button>
                          <button 
                            onClick={() => handleMoveRight(lead, col)}
                            className="p-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded transition-all cursor-pointer"
                            title="Mover próximo estágio"
                          >
                            <ChevronRight size={10} />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-2.5">
                          <h4 className="font-extrabold text-slate-100 text-xs line-clamp-2 leading-snug pr-8" title={lead.name}>
                            {lead.name}
                          </h4>
                          
                          {/* Rating and Meta Indicators */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {lead.videoReactivationSent && (
                              <span className="bg-rose-950 text-[9px] font-black text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                                <Video size={8} className="fill-rose-400 text-rose-400 shrink-0" /> Reativação
                              </span>
                            )}
                            {lead.usedCopyName && (
                              <span className="bg-blue-950/80 text-[9px] font-black text-blue-300 border border-blue-900/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <MessageSquare size={8} className="text-blue-400 shrink-0" fill="currentColor" /> {lead.usedCopyName}
                              </span>
                            )}
                            {lead.city && (
                              <span className="bg-slate-950 text-[9px] font-bold text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded">
                                {lead.city}
                              </span>
                            )}
                            <span className="bg-slate-950 text-[9px] font-bold text-blue-400 border border-slate-850 px-1.5 py-0.5 rounded">
                              {lead.category || 'Nicho'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                            <MessageSquare size={11} className="text-emerald-400 shrink-0" fill="currentColor" />
                            <span className="font-bold">{lead.phone || 'não disponível'}</span>
                          </div>

                          {/* Dynamic Temperature / Lead Score Badge */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                            {scoreInfo.points > 0 ? (
                              <span className={`px-2 py-0.5 rounded-md font-bold border ${scoreInfo.color}`}>
                                {scoreInfo.label} ({scoreInfo.points} pts)
                              </span>
                            ) : (
                              <span className="text-slate-500 font-semibold flex items-center gap-1">
                                <Clock size={11} />
                                {(() => {
                                  const days = getDaysInCRM(lead.collectedAt);
                                  return days === 0 ? 'Entrou hoje' : `${days} d no CRM`;
                                })()}
                              </span>
                            )}

                            {lead.nextAction && (
                              <span className="text-blue-400 font-black uppercase text-[8px] tracking-wider">
                                {lead.nextAction}
                              </span>
                            )}
                          </div>

                          {col === 'NAO_RESPONDEU' && lead.phone && lead.phone !== 'não disponível' && (
                            <div className="pt-2.5 border-t border-slate-800/60" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleSendVideoReactivation(lead)}
                                className="w-full flex items-center justify-center gap-1.5 font-black uppercase py-2 px-1.5 rounded-xl text-[9px] transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] bg-rose-600 hover:bg-rose-500 text-white active:bg-rose-700 border border-rose-500/20 animate-pulse"
                              >
                                <Video size={10} className="fill-white/15" />
                                Vídeo Reativação
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colLeads.length === 0 && (
                    <div className="py-12 text-center border border-dashed border-slate-800/50 rounded-xl bg-slate-950/20">
                      <AlertTriangle className="mx-auto text-slate-700 mb-1" size={18} />
                      <p className="text-[10px] text-slate-500">Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ==================== HIGH-TICKET CLOSING PIPELINE BOARD (3 STAGES) ==================== */
        <div className="flex-1 flex flex-col gap-4">
          {/* Closing Pipeline Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-900/40 border border-purple-900/40 p-4 rounded-2xl gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-950 border border-purple-800/60 rounded-xl text-purple-400">
                <Target size={18} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                  Funil de Fechamento High-Ticket (Interessados)
                  <span className="bg-purple-900/60 text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-700/50">
                    {filteredLeads.length} Leads Ativos
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">Controle dos leads que responderam positivamente e estão em etapa de desenvolvimento ou fechamento.</p>
              </div>
            </div>
            <button
              id="btn-export-closing-csv-banner"
              type="button"
              onClick={handleExportClosingCSV}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-900/30 cursor-pointer active:scale-95 shrink-0 border border-purple-400/30"
              title="Exportar Interessados do CRM para Planilha CSV"
            >
              <FileSpreadsheet size={15} />
              Exportar Interessados (CSV)
            </button>
          </div>

          <div id="closing-board" className="flex-1 flex gap-6 overflow-x-auto pb-6 pr-4 h-[calc(100vh-320px)] min-h-[480px]">
            {closingStages.map(stage => {
            // Include leads either with matching closingStatus OR fallback to first stage (PROJETO_EM_DESENVOLVIMENTO)
            const stageLeads = filteredLeads.filter(l => {
              if (stage.status === 'PROJETO_EM_DESENVOLVIMENTO') {
                return l.closingStatus === 'PROJETO_EM_DESENVOLVIMENTO' || 
                       (!l.closingStatus && l.status === 'DEMONSTROU_INTERESSE') || 
                       (!!l.closingStatus && l.closingStatus !== 'PROJETO_ENTREGUE' && l.closingStatus !== 'FECHADO');
              }
              if (stage.status === 'FECHADO') {
                return l.closingStatus === 'FECHADO' || l.status === 'FECHADO';
              }
              return l.closingStatus === stage.status;
            });

            return (
              <div 
                key={stage.status} 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData('text/plain');
                  handleDropClosing(id, stage.status);
                }}
                className="w-80 flex-shrink-0 flex flex-col bg-slate-900/30 border border-slate-850/80 rounded-[1.5rem] p-4 space-y-4 shadow-inner"
              >
                {/* Stage Header */}
                <div className="flex flex-col gap-1.5 border-b border-slate-800/40 pb-2 px-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">{stage.label}</h3>
                    <span className="bg-slate-950 border border-slate-850 text-slate-400 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-tight">{stage.description}</p>
                </div>
                
                {/* Stage Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {stageLeads.map(lead => {
                    const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);

                    return (
                      <div 
                        key={lead.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`p-4 rounded-xl border border-l-4 transition-all duration-300 relative cursor-pointer active:scale-95 group hover:shadow-lg ${stage.color} ${
                          lead.videoReactivationSent
                            ? 'bg-gradient-to-br from-[#2a1120] to-[#090d16] border-fuchsia-500/40 hover:border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.12)]'
                            : 'bg-slate-900 border-slate-800 hover:border-blue-900/40'
                        }`}
                      >
                        {/* Drag Indicators / Controls */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleMoveClosingLeft(lead, stage.status)}
                            className="p-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded transition-all cursor-pointer"
                            title="Estágio anterior"
                          >
                            <ChevronLeft size={10} />
                          </button>
                          <button 
                            onClick={() => handleMoveClosingRight(lead, stage.status)}
                            className="p-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded transition-all cursor-pointer"
                            title="Próximo estágio"
                          >
                            <ChevronRight size={10} />
                          </button>
                        </div>

                        {/* Card Content */}
                        <div className="space-y-2.5">
                          <h4 className="font-extrabold text-slate-100 text-xs line-clamp-2 leading-snug pr-8" title={lead.name}>
                            {lead.name}
                          </h4>

                          {/* Quick details */}
                          <div className="flex flex-wrap gap-1 items-center text-[9px] font-bold text-slate-400">
                            {lead.videoReactivationSent && (
                              <span className="bg-rose-950 text-[9px] font-black text-rose-300 border border-rose-900/40 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                                <Video size={8} className="fill-rose-400 text-rose-400 shrink-0" /> Reativação
                              </span>
                            )}
                            {lead.usedCopyName && (
                              <span className="bg-blue-950/80 text-[9px] font-black text-blue-300 border border-blue-900/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <MessageSquare size={8} className="text-blue-400 shrink-0" fill="currentColor" /> {lead.usedCopyName}
                              </span>
                            )}
                            {lead.city && <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">{lead.city}</span>}
                            {lead.responsibleUser?.name ? (
                              <span className="bg-slate-950 text-blue-400 px-1.5 py-0.5 rounded border border-slate-850">👤 {lead.responsibleUser.name.split(' ').slice(-1)[0]}</span>
                            ) : (
                              <span className="bg-slate-950 text-slate-500 px-1.5 py-0.5 rounded border border-slate-850">👤 Fundador</span>
                            )}
                          </div>

                          {/* Lead Score Indicator inside Closing funnel */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${scoreInfo.color}`}>
                              {scoreInfo.label} ({scoreInfo.points} pts)
                            </span>

                            {lead.nextAction && (
                              <span className="text-blue-400 font-extrabold text-[8px] uppercase tracking-wider">
                                {lead.nextAction}
                              </span>
                            )}
                          </div>

                          {/* Copiar JSON do lead (somente na coluna de Desenvolvimento) */}
                          {stage.status === 'PROJETO_EM_DESENVOLVIMENTO' && (
                            <div className="pt-2 border-t border-slate-800/40" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleCopiarJSON(lead)}
                                className="w-full text-[10px] font-black text-white bg-gradient-to-r from-[#4a9eff] to-[#6B35FF] rounded-lg py-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                                title="Copiar dados do lead em JSON"
                              >
                                <Copy size={11} />
                                Copiar JSON
                              </button>
                            </div>
                          )}

                          {/* Botão de devolução ao CRM de prospecção */}
                          <div className="pt-2 border-t border-slate-800/40 flex justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleReturnToProspecting(lead)}
                              className="w-full text-[10px] font-black text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-lg py-1.5 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                            >
                              <Undo size={11} />
                              Devolver p/ Prospecção
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="py-12 text-center border border-dashed border-slate-850/50 rounded-xl bg-slate-950/10">
                      <Sparkles className="mx-auto text-slate-800 mb-1" size={18} />
                      <p className="text-[10px] text-slate-600">Arraste leads interessados para cá</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* DETAILED INTERACTIVE POPUP MODAL DRAWER */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onUpdateLead={(updated) => {
            onUpdateLead(updated);
          }}
        />
      )}

      {/* MANDATORY LOSS REASON MODAL */}
      {lossReasonLead && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle size={24} />
              <h3 className="font-extrabold text-lg text-slate-100 uppercase tracking-wide">Motivo Obrigatório da Perda</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Para mover o lead <strong className="text-slate-200">"{lossReasonLead.name}"</strong> para Perdido, selecione obrigatoriamente um motivo de encerramento da negociação. O sistema agendará automaticamente uma nova data de recuperação ativa.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block">Categoria do Motivo</label>
              <select
                value={selectedLossReason}
                onChange={(e) => setSelectedLossReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 font-bold outline-none focus:border-rose-500/50"
              >
                <option value="">-- Selecione o motivo --</option>
                <option value="Sem interesse no momento">Sem interesse no momento (Recuperar em 60 dias)</option>
                <option value="Achou caro">Achou caro (Recuperar em 30 dias)</option>
                <option value="Já possui agência/equipe">Já possui agência/equipe (Recuperar em 90 dias)</option>
                <option value="Vai pensar">Vai pensar (Recuperar em 20 dias)</option>
                <option value="Não respondeu após orçamento">Não respondeu após orçamento (Recuperar em 15 dias)</option>
                <option value="Não respondeu após template">Não respondeu após template (Recuperar em 15 dias)</option>
                <option value="Escolheu outro fornecedor">Escolheu outro fornecedor (Recuperar em 180 dias)</option>
                <option value="Outro">Outro (Manual - 30 dias)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLossReasonLead(null);
                  setSelectedLossReason('');
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedLossReason}
                onClick={handleSaveLossReasonFromModal}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-rose-950/20 cursor-pointer font-bold"
              >
                Salvar e Agendar
              </button>
            </div>
          </div>
        </div>
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

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-sans font-bold z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle size={14} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL: Editar dados antes de copiar JSON (Nevion Hub) */}
      {showJsonModal && jsonModalLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowJsonModal(false)}>
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-cyan-500/30 p-8 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                📋 Editar Informações - {jsonModalLead.name}
              </h3>
              <p className="text-gray-400 text-sm">Preencha as informações antes de copiar o JSON</p>
            </div>

            {/* Formulário */}
            <div className="space-y-6">

              {/* Serviço */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  🏷️ Serviço/Produto
                </label>
                <input
                  type="text"
                  placeholder="Ex: Harmonização Facial, Estética, Moda..."
                  value={jsonFormData.servico}
                  onChange={(e) => setJsonFormData({ ...jsonFormData, servico: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  📝 Descrição da Empresa
                </label>
                <textarea
                  placeholder="Ex: Especialista em harmonização facial com mais de 10 anos de experiência..."
                  value={jsonFormData.descricao}
                  onChange={(e) => setJsonFormData({ ...jsonFormData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition resize-none"
                />
              </div>

              {/* Cores */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-4">
                  🎨 Cores da Marca
                </label>
                <div className="grid grid-cols-3 gap-4">

                  {/* Cor Primária */}
                  <div className="flex flex-col items-center">
                    <input
                      type="color"
                      value={jsonFormData.cor_primaria}
                      onChange={(e) => setJsonFormData({ ...jsonFormData, cor_primaria: e.target.value })}
                      className="w-16 h-16 rounded-lg cursor-pointer border-2 border-cyan-500/50 hover:border-cyan-500"
                    />
                    <p className="text-xs text-gray-400 mt-2">Primária</p>
                    <p className="text-xs text-cyan-400 font-mono">{jsonFormData.cor_primaria}</p>
                  </div>

                  {/* Cor Secundária */}
                  <div className="flex flex-col items-center">
                    <input
                      type="color"
                      value={jsonFormData.cor_secundaria}
                      onChange={(e) => setJsonFormData({ ...jsonFormData, cor_secundaria: e.target.value })}
                      className="w-16 h-16 rounded-lg cursor-pointer border-2 border-purple-500/50 hover:border-purple-500"
                    />
                    <p className="text-xs text-gray-400 mt-2">Secundária</p>
                    <p className="text-xs text-purple-400 font-mono">{jsonFormData.cor_secundaria}</p>
                  </div>

                  {/* Cor Destaque */}
                  <div className="flex flex-col items-center">
                    <input
                      type="color"
                      value={jsonFormData.cor_destaque}
                      onChange={(e) => setJsonFormData({ ...jsonFormData, cor_destaque: e.target.value })}
                      className="w-16 h-16 rounded-lg cursor-pointer border-2 border-orange-500/50 hover:border-orange-500"
                    />
                    <p className="text-xs text-gray-400 mt-2">Destaque</p>
                    <p className="text-xs text-orange-400 font-mono">{jsonFormData.cor_destaque}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={handleCopiarJSONCompleto}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 active:scale-95"
              >
                ✅ Copiar JSON
              </button>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PipelineView;
