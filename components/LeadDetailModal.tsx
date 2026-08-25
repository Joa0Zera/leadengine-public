import React, { useState, useEffect } from 'react';
import { Lead, TimelineEntry, LeadDocument, ClosingStatus, LeadStatus } from '../types';
import { SCORE_FACTORS, calcularLeadScore } from '../helpers';
import LeadAICopilot from './LeadAICopilot';
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  FileText, 
  Link2, 
  ExternalLink, 
  User, 
  Users, 
  Award, 
  Flame, 
  CheckCircle, 
  Paperclip, 
  AlertTriangle,
  Globe,
  Instagram,
  Facebook,
  Phone,
  Send,
  MapPin,
  ChevronRight
} from 'lucide-react';

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdateLead: (updatedLead: Lead) => void;
}

const LeadDetailModal: React.FC<Props> = ({ lead, onClose, onUpdateLead }) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<'SCORE' | 'TIMELINE' | 'INFO' | 'DOCS' | 'RECUPERACAO'>('TIMELINE');

  // Recovery states
  const [recMessage, setRecMessage] = useState('');
  const [recCreative, setRecCreative] = useState('');
  const [recVideo, setRecVideo] = useState('');
  const [recResponse, setRecResponse] = useState('');
  const [recNewNego, setRecNewNego] = useState(false);

  // Notes
  const [notes, setNotes] = useState(lead.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Timeline entry states
  const [newTimelineTitle, setNewTimelineTitle] = useState('');
  const [newTimelineDesc, setNewTimelineDesc] = useState('');
  const [newTimelineDate, setNewTimelineDate] = useState(new Date().toLocaleDateString('pt-BR'));

  // Document states
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<LeadDocument['type']>('Briefing');
  const [docUrl, setDocUrl] = useState('');

  // Important links states
  const [links, setLinks] = useState({
    landingPageEnviada: lead.importantLinks?.landingPageEnviada || '',
    instagram: lead.importantLinks?.instagram || lead.instagram || '',
    site: lead.importantLinks?.site || lead.website || '',
    googleMaps: lead.importantLinks?.googleMaps || lead.mapsUrl || '',
    whatsapp: lead.importantLinks?.whatsapp || lead.phone || '',
    facebook: lead.importantLinks?.facebook || lead.facebook || '',
    briefing: lead.importantLinks?.briefing || '',
  });

  // Next action & Follow-up
  const [nextAction, setNextAction] = useState(lead.nextAction || 'Enviar Template');
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate || '');

  // Scale: Salesperson
  const [assignedSalesperson, setAssignedSalesperson] = useState(lead.responsibleUser?.name || 'Fundador (Nevion)');
  const [assignedRole, setAssignedRole] = useState(lead.responsibleUser?.role || 'founder');

  // Keep notes state in sync when lead prop changes
  useEffect(() => {
    setNotes(lead.notes || '');
  }, [lead.id, lead.notes]);

  // Debounced auto-saving for notes (only fires if user modified notes)
  useEffect(() => {
    if (notes === (lead.notes || '')) return;
    const handler = setTimeout(() => {
      setIsSavingNotes(true);
      const updated = { ...lead, notes };
      onUpdateLead(updated);
      setTimeout(() => setIsSavingNotes(false), 800);
    }, 1500);
    return () => clearTimeout(handler);
  }, [notes, lead.id]);

  // Lead Score calculation on the fly
  const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);

  const handleToggleScoreFactor = (factorId: string) => {
    const currentFactors = lead.checkedScoreFactors || [];
    let updatedFactors: string[] = [];
    if (currentFactors.includes(factorId)) {
      updatedFactors = currentFactors.filter(id => id !== factorId);
    } else {
      updatedFactors = [...currentFactors, factorId];
    }

    const calculated = calcularLeadScore(updatedFactors);
    const updatedLead: Lead = {
      ...lead,
      checkedScoreFactors: updatedFactors,
      scorePoints: calculated.points,
      score: {
        grade: calculated.points >= 100 ? 'A' : calculated.points >= 60 ? 'B' : calculated.points >= 30 ? 'C' : 'D',
        temperature: calculated.points >= 80 ? 'QUENTE' : calculated.points >= 40 ? 'MORNO' : 'FRIO',
        reason: 'Pontuação gerada automaticamente com base nos comportamentos comerciais ativos.',
        opportunities: lead.score?.opportunities || ["Otimização de LP", "Campanhas de Escala Local"],
        potentialValue: lead.score?.potentialValue || 1500
      }
    };

    // Auto-add timeline event on critical changes
    const newlyAdded = updatedFactors.filter(x => !currentFactors.includes(x));
    if (newlyAdded.length > 0) {
      const factorObj = SCORE_FACTORS.find(f => f.id === newlyAdded[0]);
      if (factorObj) {
        const entry: TimelineEntry = {
          id: 'timeline-' + Date.now(),
          date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          title: `Comportamento: ${factorObj.label}`,
          description: `Lead atingiu o critério e somou +${factorObj.points} pontos no Score comercial.`
        };
        updatedLead.timeline = [entry, ...(lead.timeline || [])];
      }
    }

    onUpdateLead(updatedLead);
  };

  const handleAddTimelineEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimelineTitle.trim()) return;

    const newEntry: TimelineEntry = {
      id: 'timeline-' + Date.now(),
      date: newTimelineDate,
      title: newTimelineTitle,
      description: newTimelineDesc || undefined,
    };

    const updatedLead: Lead = {
      ...lead,
      timeline: [newEntry, ...(lead.timeline || [])],
    };

    onUpdateLead(updatedLead);
    setNewTimelineTitle('');
    setNewTimelineDesc('');
  };

  const handleDeleteTimelineEntry = (id: string) => {
    const updatedLead: Lead = {
      ...lead,
      timeline: (lead.timeline || []).filter(item => item.id !== id),
    };
    onUpdateLead(updatedLead);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newDoc: LeadDocument = {
      id: 'doc-' + Date.now(),
      name: docName,
      type: docType,
      url: docUrl.trim() || '#',
      uploadedAt: new Date().toLocaleDateString('pt-BR'),
    };

    const updatedLead: Lead = {
      ...lead,
      documents: [...(lead.documents || []), newDoc],
    };

    // Add automatically to timeline
    const timelineEntry: TimelineEntry = {
      id: 'timeline-' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      title: `Documento adicionado: ${docName}`,
      description: `Tipo: ${docType}. Link: ${newDoc.url}`
    };
    updatedLead.timeline = [timelineEntry, ...(lead.timeline || [])];

    onUpdateLead(updatedLead);
    setDocName('');
    setDocUrl('');
  };

  const handleDeleteDocument = (id: string) => {
    const updatedLead: Lead = {
      ...lead,
      documents: (lead.documents || []).filter(doc => doc.id !== id),
    };
    onUpdateLead(updatedLead);
  };

  const handleSaveLinks = () => {
    const updatedLead: Lead = {
      ...lead,
      importantLinks: links,
      website: links.site || lead.website,
      instagram: links.instagram || lead.instagram,
      facebook: links.facebook || lead.facebook,
      mapsUrl: links.googleMaps || lead.mapsUrl,
    };
    onUpdateLead(updatedLead);
  };

  const handleSaveNextAction = (action: string) => {
    setNextAction(action);
    const updatedLead: Lead = {
      ...lead,
      nextAction: action,
    };

    // Add to timeline
    const timelineEntry: TimelineEntry = {
      id: 'timeline-' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      title: `Ação definida: ${action}`,
      description: `Definido como próxima ação prioritária de fechamento.`
    };
    updatedLead.timeline = [timelineEntry, ...(lead.timeline || [])];

    onUpdateLead(updatedLead);
  };

  const handleSaveFollowUpDate = (date: string) => {
    setFollowUpDate(date);
    const updatedLead: Lead = {
      ...lead,
      followUpDate: date,
    };
    onUpdateLead(updatedLead);
  };

  const handleSaveSalesperson = (name: string) => {
    setAssignedSalesperson(name);
    const role: Lead['responsibleUser']['role'] = name.includes('SDR') ? 'sdr' : name.includes('Vendedor') ? 'vendedor' : 'founder';
    setAssignedRole(role);
    const updatedLead: Lead = {
      ...lead,
      responsibleUser: {
        id: 'user-' + name.toLowerCase().replace(/\s/g, '-'),
        name,
        role,
        team: 'Sales Core Nevion'
      },
    };
    onUpdateLead(updatedLead);
  };

  const handleSaveLossReason = (reason: string) => {
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
      else if (r === 'Outro') days = 30; // default for manual select, can be edited
      
      today.setDate(today.getDate() + days);
      return today.toISOString().split('T')[0];
    };

    const calculatedDate = calculateFollowUpDate(reason);
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedLead: Lead = {
      ...lead,
      lossReason: reason,
      lostAt: todayStr,
      followUpDate: calculatedDate,
      status: 'PERDIDO'
    };

    const timelineEntry: TimelineEntry = {
      id: 'timeline-' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      title: `Lead Perdido: ${reason}`,
      description: `Definido motivo de perda. Recuperação agendada automaticamente para ${new Date(calculatedDate).toLocaleDateString('pt-BR')} (em ${reason === 'Sem interesse no momento' ? 60 : reason === 'Já possui agência/equipe' ? 90 : reason === 'Vai pensar' ? 20 : reason === 'Não respondeu após orçamento' || reason === 'Não respondeu após template' ? 15 : reason === 'Escolheu outro fornecedor' ? 180 : 30} dias).`
    };
    updatedLead.timeline = [timelineEntry, ...(lead.timeline || [])];

    onUpdateLead(updatedLead);
  };

  const handleSaveStatus = (newStatus: LeadStatus) => {
    const updatedLead: Lead = {
      ...lead,
      status: newStatus,
    };

    // If changing to PERDIDO, we keep the loss reason if selected, otherwise clean it up
    if (newStatus !== 'PERDIDO') {
      if ('lossReason' in updatedLead) {
        delete (updatedLead as any).lossReason;
      }
      if ('lostAt' in updatedLead) {
        delete (updatedLead as any).lostAt;
      }
    }

    const statusLabels: Record<LeadStatus, string> = {
      NOVO: 'Novo Lead',
      CONTATADO: 'Contatado',
      DEMONSTROU_INTERESSE: 'Demonstrou Interesse',
      NAO_RESPONDEU: 'Não Respondeu',
      FECHADO: 'Fechado (Ganho)',
      PERDIDO: 'Perdido'
    };

    const timelineEntry: TimelineEntry = {
      id: 'timeline-' + Date.now(),
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      title: `Status alterado manualmente`,
      description: `Lead movido para a etapa: ${statusLabels[newStatus]}`
    };
    updatedLead.timeline = [timelineEntry, ...(lead.timeline || [])];

    onUpdateLead(updatedLead);
  };

  const handleStartRecovery = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    
    const updatedLead: Lead = {
      ...lead,
      status: 'DEMONSTROU_INTERESSE',
      closingStatus: 'RECUPERACAO',
      followUpDate: ''
    };

    const timelineEntry: TimelineEntry = {
      id: 'timeline-' + Date.now(),
      date: todayStr + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      title: 'Fluxo de Recuperação Iniciado',
      description: 'Lead foi movido automaticamente do status de Perdido para a etapa de Recuperação.'
    };
    updatedLead.timeline = [timelineEntry, ...(lead.timeline || [])];

    const initialRecEntry = {
      id: 'rec-' + Date.now(),
      date: todayStr + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      messageSent: 'Início da recuperação ativa.',
      creativeSent: '-',
      videoSent: '-',
      responseReceived: 'Fluxo de recuperação iniciado',
      newNegotiation: false
    };
    updatedLead.recoveryHistory = [initialRecEntry, ...(lead.recoveryHistory || [])];

    onUpdateLead(updatedLead);
  };

  const handleAddRecoveryEntry = (e: React.FormEvent) => {
    e.preventDefault();
    
    const todayStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const newEntry = {
      id: 'rec-' + Date.now(),
      date: todayStr,
      messageSent: recMessage || 'Nenhuma',
      creativeSent: recCreative || 'Nenhum',
      videoSent: recVideo || 'Nenhum',
      responseReceived: recResponse || 'Nenhuma resposta registrada ainda',
      newNegotiation: recNewNego
    };

    const updatedHistory = [newEntry, ...(lead.recoveryHistory || [])];
    
    let nextClosingStatus = lead.closingStatus;
    let nextStatus = lead.status;
    if (recNewNego) {
      nextClosingStatus = 'NEGOCIACAO';
      nextStatus = 'DEMONSTROU_INTERESSE';
    }

    const updatedLead: Lead = {
      ...lead,
      closingStatus: nextClosingStatus,
      status: nextStatus,
      recoveryHistory: updatedHistory
    };

    const timelineEntry: TimelineEntry = {
      id: 'timeline-' + Date.now(),
      date: todayStr,
      title: recNewNego ? 'Recuperação com Sucesso (Nova Negociação)' : 'Ação de Recuperação Registrada',
      description: `Msg: ${recMessage || 'abordagem'}. Criativo: ${recCreative || 'n/d'}. Nova Negociação? ${recNewNego ? 'Sim' : 'Não'}`
    };
    updatedLead.timeline = [timelineEntry, ...(lead.timeline || [])];

    onUpdateLead(updatedLead);

    // Reset inputs
    setRecMessage('');
    setRecCreative('');
    setRecVideo('');
    setRecResponse('');
    setRecNewNego(false);
  };

  // Compute timeline inline without triggering re-render loops
  const displayTimeline: TimelineEntry[] = (lead.timeline && lead.timeline.length > 0) ? lead.timeline : [
    {
      id: 'timeline-seed-1',
      date: lead.collectedAt ? new Date(lead.collectedAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
      title: 'Lead Importado na Nevion',
      description: `Origem identificada: ${lead.origem || 'Google Maps'}. Qualificação automática realizada com sucesso.`
    },
    ...(lead.status === 'CONTATADO' ? [{
      id: 'timeline-seed-2',
      date: new Date().toLocaleDateString('pt-BR'),
      title: 'Mensagem Inicial Enviada',
      description: 'Abordagem comercial executada através do canal do WhatsApp.'
    }] : [])
  ];

  // Active notifications for Follow-up list
  const getFollowUpRecommendation = () => {
    if (lead.closingStatus === 'TEMPLATE_ENVIADO') return { time: '48h', text: 'Lembrar de enviar Criativo 1.' };
    if (lead.closingStatus === 'CRIATIVO_1_ENVIADO') return { time: '72h', text: 'Lembrar de enviar Criativo 2.' };
    if (lead.closingStatus === 'CRIATIVO_2_ENVIADO') return { time: '72h', text: 'Lembrar de enviar Criativo 3.' };
    if (lead.closingStatus === 'CRIATIVO_3_ENVIADO') return { time: '7 dias', text: 'Enviar último Follow-up de encerramento.' };
    return null;
  };

  const recommendation = getFollowUpRecommendation();

  return (
    <div 
      id="lead-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
      onClick={() => onClose()}
    >
      <div 
        id="lead-detail-modal"
        data-lead-id={lead.id}
        className="bg-[#0b0f19] border border-slate-800 text-slate-100 rounded-[2rem] shadow-2xl max-w-5xl w-full h-[85vh] overflow-hidden flex flex-col cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Block with Premium Glow */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/45 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border font-mono font-black text-xs shrink-0 ${scoreInfo.color}`}>
              {scoreInfo.label} ({scoreInfo.points} pts)
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight leading-none">{lead.name}</h2>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                <span className="font-semibold text-blue-400 uppercase tracking-widest text-[10px]">{lead.category || 'Nicho Geral'}</span>
                <span>•</span>
                <span className="font-medium text-slate-400">{lead.city || 'Localização não especificada'}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            id="modal-close-x-btn"
            data-testid="close-modal-btn"
            aria-label="Fechar Modal"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            className="text-slate-400 hover:text-white p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors border border-slate-800/50 hover:border-slate-700 cursor-pointer z-30 shrink-0 flex items-center justify-center pointer-events-auto"
            title="Fechar Modal"
          >
            <X size={20} className="pointer-events-none" />
          </button>
        </div>

        {/* Outer Split Pane Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT INTERACTIVE MODULES (60% Width) */}
          <div className="w-full md:w-3/5 flex flex-col border-r border-slate-850 overflow-y-auto">
            
            {/* Tab Controller Bar */}
            <div className="flex border-b border-slate-850 bg-slate-950/20 px-6">
              <button 
                onClick={() => setActiveTab('TIMELINE')}
                className={`py-4 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'TIMELINE' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                📜 Timeline Histórica
              </button>
              <button 
                onClick={() => setActiveTab('SCORE')}
                className={`py-4 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'SCORE' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                🔥 Lead Score
              </button>
              <button 
                onClick={() => setActiveTab('DOCS')}
                className={`py-4 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'DOCS' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                📎 Anexos ({lead.documents?.length || 0})
              </button>
              <button 
                onClick={() => setActiveTab('INFO')}
                className={`py-4 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'INFO' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                🔗 Links & Escala
              </button>
              <button 
                onClick={() => setActiveTab('RECUPERACAO')}
                className={`py-4 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${activeTab === 'RECUPERACAO' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                🔄 Recuperação
              </button>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* TAB 1: INTERACTIVE TIMELINE HISTORY */}
              {activeTab === 'TIMELINE' && (
                <div className="space-y-6">
                  {/* Create New Entry Form */}
                  <form onSubmit={handleAddTimelineEntry} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Novo Registro de Interação</div>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Título (Ex: Template enviado, Reunião feita...)"
                        value={newTimelineTitle}
                        onChange={(e) => setNewTimelineTitle(e.target.value)}
                        className="col-span-2 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                        required
                      />
                      <input 
                        type="text" 
                        placeholder="Detalhes adicionais (opcional)..."
                        value={newTimelineDesc}
                        onChange={(e) => setNewTimelineDesc(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                      />
                      <input 
                        type="text" 
                        value={newTimelineDate}
                        onChange={(e) => setNewTimelineDate(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Registrar na Linha do Tempo
                    </button>
                  </form>

                  {/* Vertical Chronological Timeline */}
                  <div data-field="timeline" className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                    {displayTimeline.map((entry) => (
                      <div key={entry.id} className="relative pl-8 group">
                        {/* Bullet */}
                        <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-blue-500 z-10 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        </div>

                        <div className="bg-slate-900/40 border border-slate-850/80 p-3.5 rounded-2xl hover:border-slate-800 transition-all flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold font-mono text-blue-400 block mb-1">{entry.date}</span>
                            <h4 className="font-bold text-xs text-slate-200 leading-tight">{entry.title}</h4>
                            {entry.description && (
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{entry.description}</p>
                            )}
                          </div>
                          <button 
                            onClick={() => handleDeleteTimelineEntry(entry.id)}
                            className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Apagar Registro"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: DYNAMIC AUTOMATED LEAD SCORE CHECKLIST */}
              {activeTab === 'SCORE' && (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-950/20 border border-blue-900/20 rounded-2xl text-xs leading-relaxed text-blue-300">
                    <p className="font-extrabold text-slate-100 uppercase tracking-wider text-[10px] mb-1">Como Funciona o Lead Score?</p>
                    A pontuação é cumulativa e atualizada automaticamente. Ela define o selo de temperatura (Morno, Quente ou Muito Quente), o que nos ajuda a priorizar os leads com maior chance de contratação imediata!
                  </div>

                  <div className="space-y-3">
                    {SCORE_FACTORS.map((factor) => {
                      const isChecked = (lead.checkedScoreFactors || []).includes(factor.id);
                      return (
                        <button
                          key={factor.id}
                          type="button"
                          onClick={() => handleToggleScoreFactor(factor.id)}
                          className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                            isChecked 
                              ? 'bg-blue-950/20 border-blue-500/30 text-slate-100' 
                              : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              readOnly
                              className="accent-blue-500 w-4 h-4 shrink-0 rounded"
                            />
                            <span className={`text-xs font-bold ${isChecked ? 'text-slate-100' : 'text-slate-300'}`}>{factor.label}</span>
                          </div>
                          <span className={`font-mono text-xs font-extrabold ${isChecked ? 'text-blue-400' : 'text-slate-500'}`}>+{factor.points} pts</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENT ORGANIZER / ATTACHMENTS */}
              {activeTab === 'DOCS' && (
                <div className="space-y-6">
                  {/* Create New Document Form */}
                  <form onSubmit={handleAddDocument} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Anexar Novo Arquivo / Documento</div>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Nome do Documento (Ex: Briefing Preenchido, Contrato Assinado...)"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="col-span-2 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                        required
                      />
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as LeadDocument['type'])}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
                      >
                        <option value="Briefing">Briefing</option>
                        <option value="PDF">PDF</option>
                        <option value="Proposta">Proposta</option>
                        <option value="Logo">Logo</option>
                        <option value="Fotos">Fotos</option>
                        <option value="Contrato">Contrato</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="URL de Acesso ou Link..."
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Anexar Documento ao Lead
                    </button>
                  </form>

                  {/* List of Attached Files */}
                  <div className="space-y-2">
                    {(lead.documents || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-semibold border border-dashed border-slate-800 rounded-xl">
                        Nenhum documento anexado. Organize propostas, briefing e contrato aqui.
                      </div>
                    ) : (
                      (lead.documents || []).map((doc) => (
                        <div key={doc.id} className="bg-slate-900/40 border border-slate-850/80 p-3 rounded-xl flex items-center justify-between hover:border-slate-800 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-950/40 p-2 rounded-lg text-blue-400 border border-blue-900/20">
                              <Paperclip size={14} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                {doc.name}
                                <span className="bg-slate-950 text-[8px] font-black text-slate-500 uppercase px-1.5 py-0.5 rounded border border-slate-850">{doc.type}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Anexado em {doc.uploadedAt}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={doc.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1.5 bg-slate-950 hover:bg-slate-800 text-blue-400 rounded-lg border border-slate-850 transition-all text-xs"
                              title="Visualizar Arquivo"
                            >
                              <ExternalLink size={12} />
                            </a>
                            <button 
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 bg-slate-950 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-lg border border-slate-850 transition-all"
                              title="Remover Anexo"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ESSENTIAL LINKS & SALESPERSON ASSIGNMENT */}
              {activeTab === 'INFO' && (
                <div className="space-y-6">
                  {/* Important Links Column Inputs */}
                  <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-[1.5rem] space-y-4">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">🔗 Links de Acesso Rápido</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Landing Page */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Landing Page Enviada</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={links.landingPageEnviada} 
                            onChange={(e) => setLinks({...links, landingPageEnviada: e.target.value})}
                            placeholder="https://sua-lp.com"
                            className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                          />
                          {links.landingPageEnviada && (
                            <a href={links.landingPageEnviada} target="_blank" rel="noreferrer" className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-blue-400 hover:text-white transition-all"><ExternalLink size={12}/></a>
                          )}
                        </div>
                      </div>

                      {/* Briefing */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Link Briefing (Typeform/Sheets)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={links.briefing} 
                            onChange={(e) => setLinks({...links, briefing: e.target.value})}
                            placeholder="https://typeform.com/briefing"
                            className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                          />
                          {links.briefing && (
                            <a href={links.briefing} target="_blank" rel="noreferrer" className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-blue-400 hover:text-white transition-all"><ExternalLink size={12}/></a>
                          )}
                        </div>
                      </div>

                      {/* Website */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Site Original do Lead</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={links.site} 
                            onChange={(e) => setLinks({...links, site: e.target.value})}
                            placeholder="https://site-do-cliente.com"
                            className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                          />
                          {links.site && (
                            <a href={links.site.startsWith('http') ? links.site : `https://${links.site}`} target="_blank" rel="noreferrer" className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-blue-400 hover:text-white transition-all"><ExternalLink size={12}/></a>
                          )}
                        </div>
                      </div>

                      {/* Instagram */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Instagram Link</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={links.instagram} 
                            onChange={(e) => setLinks({...links, instagram: e.target.value})}
                            placeholder="https://instagram.com/perfil"
                            className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                          />
                          {links.instagram && (
                            <a href={links.instagram.startsWith('http') ? links.instagram : `https://instagram.com/${links.instagram.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="p-2 bg-slate-950 border border-slate-850 rounded-xl text-blue-400 hover:text-white transition-all"><ExternalLink size={12}/></a>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveLinks}
                      className="py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                    >
                      Atualizar Links Principais
                    </button>
                  </div>

                  {/* Future scale team allocation mock */}
                  <div className="bg-slate-900/30 border border-slate-850 p-5 rounded-[1.5rem] space-y-4">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-blue-400" /> Preparação para Escala (Vendedores & SDRs)
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Configure a atribuição de responsáveis comerciais para preparar a plataforma para multi-usuários no futuro.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">SDR / Vendedor Atribuído</label>
                        <select
                          value={assignedSalesperson}
                          onChange={(e) => handleSaveSalesperson(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-blue-500 font-bold"
                        >
                          <option value="Fundador (Nevion)">Fundador (Nevion) - Geral</option>
                          <option value="SDR João Silva">SDR João Silva - Prospecção</option>
                          <option value="SDR Marina Castro">SDR Marina Castro - Prospecção</option>
                          <option value="Vendedor Lucas Santos">Vendedor Lucas Santos - Fechamento</option>
                          <option value="Vendedora Rebeca Mel">Vendedora Rebeca Mel - Fechamento</option>
                        </select>
                      </div>

                      <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-850 text-xs">
                        <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider">Regra de Escala Ativa</span>
                        <div className="font-extrabold text-blue-400 mt-1 uppercase tracking-wider text-[10px]">Permissões: {assignedRole === 'founder' ? 'Acesso Total Administrador' : assignedRole === 'sdr' ? 'SDR Prospecção Regional' : 'Executivo de Fechamento'}</div>
                        <div className="text-[10px] text-slate-400 mt-1 leading-normal">Preparado para distribuir leads automaticamente de acordo com as regras de pipeline.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LEAD RECOVERY SYSTEM */}
              {activeTab === 'RECUPERACAO' && (
                <div className="space-y-6">
                  {lead.status === 'PERDIDO' ? (
                    <div className="p-6 bg-rose-950/20 border border-rose-900/30 rounded-2xl space-y-4">
                      <div className="flex items-center gap-2 text-rose-400">
                        <AlertTriangle size={20} />
                        <h3 className="font-extrabold text-sm uppercase tracking-wider">Recuperar Lead Perdido</h3>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Este lead está atualmente marcado como <strong>Perdido</strong> pelo motivo de <strong className="text-rose-400">"{lead.lossReason || 'Sem motivo selecionado'}"</strong>.
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Ao iniciar a recuperação, o lead voltará automaticamente para o status de <strong>Interessado</strong> na etapa do pipeline de <strong className="text-rose-400">Recuperação</strong>, reaquecendo o processo comercial e registrando a data de início da abordagem de recuperação.
                      </p>
                      <button
                        type="button"
                        onClick={handleStartRecovery}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-900/30 cursor-pointer flex items-center justify-center gap-2 font-bold"
                      >
                        🔄 Iniciar Recuperação Ativa
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-900/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold">
                      <CheckCircle size={16} />
                      <span>Fluxo de recuperação ativo ou lead reaquecido com sucesso! (Etapa atual: {lead.closingStatus || lead.status})</span>
                    </div>
                  )}

                  {/* Log a New Recovery Interaction */}
                  <form onSubmit={handleAddRecoveryEntry} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4 font-sans">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      Registrar Novo Contato de Recuperação
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Mensagem Enviada</label>
                        <textarea
                          value={recMessage}
                          onChange={(e) => setRecMessage(e.target.value)}
                          placeholder="Digite a mensagem de abordagem enviada para o lead (Ex: Olá, tudo bem? Vi o perfil da...)"
                          className="w-full h-16 bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-rose-500/50 resize-none font-sans"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Criativo Enviado (Imagem/Oferta)</label>
                        <input
                          type="text"
                          value={recCreative}
                          onChange={(e) => setRecCreative(e.target.value)}
                          placeholder="Ex: Proposta de Design ou Banners Locais"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-rose-500/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Vídeo Explicativo Enviado</label>
                        <input
                          type="text"
                          value={recVideo}
                          onChange={(e) => setRecVideo(e.target.value)}
                          placeholder="Ex: Vídeo de Auditoria de SEO local"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-rose-500/50"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">Resposta Recebida do Cliente</label>
                        <input
                          type="text"
                          value={recResponse}
                          onChange={(e) => setRecResponse(e.target.value)}
                          placeholder="Ex: Respondeu que achou interessante e pediu orçamento detalhado"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-rose-500/50"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                        <input
                          type="checkbox"
                          id="chk-new-nego"
                          checked={recNewNego}
                          onChange={(e) => setRecNewNego(e.target.checked)}
                          className="accent-rose-500 w-4 h-4 rounded cursor-pointer"
                        />
                        <label htmlFor="chk-new-nego" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                          🔥 Gerou Nova Negociação? (Move automaticamente para a etapa de Negociação)
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer font-bold"
                    >
                      Salvar Interação no Histórico de Recuperação
                    </button>
                  </form>

                  {/* List of Previous Recovery Entries */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      Histórico Completo de Recuperações
                    </h3>
                    
                    {(lead.recoveryHistory || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-semibold border border-dashed border-slate-800 rounded-xl">
                        Nenhuma tentativa de recuperação registrada.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(lead.recoveryHistory || []).map((entry) => (
                          <div key={entry.id} className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-3 font-sans">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                              <span className="text-[10px] font-mono font-bold text-rose-400">{entry.date}</span>
                              {entry.newNegotiation && (
                                <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-bold">
                                  Nova Negociação Ativa
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Mensagem</span>
                                <span className="text-slate-200 mt-1 block leading-relaxed">{entry.messageSent}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Resposta</span>
                                <span className="text-slate-200 mt-1 block leading-relaxed">{entry.responseReceived}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Criativo</span>
                                <span className="text-slate-300 mt-1 block font-mono text-[10px]">{entry.creativeSent}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase block">Vídeo</span>
                                <span className="text-slate-300 mt-1 block font-mono text-[10px]">{entry.videoSent}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT METADATA PANEL (40% Width) */}
          <div className="w-full md:w-2/5 bg-slate-950/40 flex flex-col justify-between overflow-y-auto">
            
            {/* Action Items, Follow-ups, and Observações */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* 🤖 IA COMERCIAL COPILOTO CARD */}
              <LeadAICopilot lead={lead} onUpdateLead={onUpdateLead} />

              {/* Etapa do Funil CRM (Status) */}
              <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Award size={12} /> Etapa do Funil CRM
                </span>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Status Comercial do Lead</label>
                  <select
                    id="lead-status-select"
                    data-field="status-select"
                    value={lead.status || 'NOVO'}
                    onChange={(e) => handleSaveStatus(e.target.value as LeadStatus)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold outline-none focus:border-blue-500/50 cursor-pointer"
                  >
                    <option value="NOVO">🟢 NOVO LEAD (Pendente)</option>
                    <option value="CONTATADO">🔵 CONTATADO</option>
                    <option value="DEMONSTROU_INTERESSE">🔥 DEMONSTROU INTERESSE</option>
                    <option value="NAO_RESPONDEU">🟡 NÃO RESPONDEU</option>
                    <option value="FECHADO">🏆 FECHADO (GANHO)</option>
                    <option value="PERDIDO">❌ PERDIDO</option>
                  </select>
                </div>
              </div>

              {/* Lembrete de Follow-up (Data do Próximo Contato) */}
              <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                  <Clock size={12} /> Agenda de Contatos
                </span>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Data Próximo Contato</label>
                  <input 
                    type="date"
                    value={followUpDate}
                    onChange={(e) => handleSaveFollowUpDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Notes: Observations */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">📝 Campo de Observações</label>
                  {isSavingNotes ? (
                    <span className="text-[9px] font-bold text-blue-400 animate-pulse">Sincronizando...</span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 font-mono">Salvo em tempo real</span>
                  )}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Gostou bastante. Perguntou preço. Quer conversar segunda-feira. Cliente prefere contato via WhatsApp..."
                  className="w-full h-40 bg-slate-950 border border-slate-850 rounded-2xl p-4 text-xs font-medium text-slate-200 outline-none focus:border-blue-500 font-sans resize-none leading-relaxed"
                />
              </div>

              {/* Loss Reasons Picker (Active only if Status is Perdido) */}
              {lead.status === 'PERDIDO' && (
                <div className="bg-rose-950/20 border border-rose-900/20 p-5 rounded-[1.5rem] space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Motivo de Perda do Lead
                  </span>
                  
                  <select
                    value={lead.lossReason || ''}
                    onChange={(e) => handleSaveLossReason(e.target.value)}
                    className="w-full bg-slate-950 border border-rose-950 rounded-xl px-3 py-2 text-xs text-rose-300 font-bold outline-none"
                  >
                    <option value="">-- Selecione o motivo --</option>
                    <option value="Sem interesse no momento">Sem interesse no momento</option>
                    <option value="Achou caro">Achou caro</option>
                    <option value="Já possui agência/equipe">Já possui agência/equipe</option>
                    <option value="Vai pensar">Vai pensar</option>
                    <option value="Não respondeu após orçamento">Não respondeu após orçamento</option>
                    <option value="Não respondeu após template">Não respondeu após template</option>
                    <option value="Escolheu outro fornecedor">Escolheu outro fornecedor</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default LeadDetailModal;
