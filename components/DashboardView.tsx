import React, { useState } from 'react';
import { Lead, AppSection, FinancialProject, ProspectingCopy } from '../types';
import { detectarTipoContato, detectarGaps, calcularLeadScore } from '../helpers';
import LeadDetailModal from './LeadDetailModal';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Users, 
  Globe, 
  TrendingUp, 
  MapPin, 
  MessageSquare, 
  Phone, 
  ShieldAlert, 
  Activity, 
  Zap,
  PiggyBank,
  Linkedin,
  Flame,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  AlertCircle,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Video,
  Play,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';

interface Props {
  leads: Lead[];
  projects: FinancialProject[];
  copies?: ProspectingCopy[];
  onNavigate: (section: AppSection) => void;
  onUpdateLead: (updatedLead: Lead) => void;
}

const DashboardView: React.FC<Props> = ({ leads, projects, copies = [], onNavigate, onUpdateLead }) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [safeDailyLimit, setSafeDailyLimit] = useState<number>(50);
  const [historyTab, setHistoryTab] = useState<'WEEK' | 'MONTH'>('WEEK');

  // Video Reactivation state
  const [reactivationModal, setReactivationModal] = useState<{
    lead: Lead;
    message: string;
    url: string;
  } | null>(null);

  // --- WHATSAPP PROSPECTING LIMIT & ANALYTICS CALCULATIONS ---
  const allWhatsAppTimestamps: Date[] = [];
  leads.forEach(lead => {
    let countAdded = false;
    if (lead.whatsappContactHistory && lead.whatsappContactHistory.length > 0) {
      lead.whatsappContactHistory.forEach(ts => {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          allWhatsAppTimestamps.push(d);
          countAdded = true;
        }
      });
    }
    if (!countAdded && lead.status === 'CONTATADO') {
      const latestTimeline = lead.timeline?.[0]?.date;
      const d = latestTimeline ? new Date(latestTimeline) : new Date(lead.collectedAt || Date.now());
      if (!isNaN(d.getTime())) {
        allWhatsAppTimestamps.push(d);
      }
    }
  });

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const contactsLast24h = allWhatsAppTimestamps.filter(d => d >= twentyFourHoursAgo);
  const count24h = contactsLast24h.length;
  const percentage24h = safeDailyLimit > 0 ? Math.round((count24h / safeDailyLimit) * 100) : 0;

  // Countdown to next slot
  let nextSlotTimeStr = '';
  if (contactsLast24h.length > 0) {
    const sorted24h = [...contactsLast24h].sort((a, b) => a.getTime() - b.getTime());
    const oldestContact = sorted24h[0];
    const expiryTime = new Date(oldestContact.getTime() + 24 * 60 * 60 * 1000);
    const diffMs = expiryTime.getTime() - now.getTime();
    if (diffMs > 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      nextSlotTimeStr = `${diffHours}h ${diffMins}m`;
    }
  }

  // Week calculation (Monday - Sunday) of current week
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);

  const daysOfWeekLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];

  allWhatsAppTimestamps.forEach(d => {
    if (d >= startOfWeek && d < endOfWeek) {
      let dayIndex = d.getDay() - 1;
      if (dayIndex === -1) dayIndex = 6; // Sunday is index 6
      if (dayIndex >= 0 && dayIndex < 7) {
        weeklyCounts[dayIndex]++;
      }
    }
  });

  const weeklyChartData = daysOfWeekLabels.map((label, index) => ({
    day: label,
    prospecções: weeklyCounts[index]
  }));

  const weeklyTotal = weeklyCounts.reduce((a, b) => a + b, 0);

  // Month calculation (current calendar month)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthlyContacts = allWhatsAppTimestamps.filter(d => d >= startOfMonth && d <= endOfMonth);
  const countMonth = monthlyContacts.length;

  const monthlyWeeks = [0, 0, 0, 0, 0];
  monthlyContacts.forEach(d => {
    const dateNum = d.getDate();
    if (dateNum <= 7) monthlyWeeks[0]++;
    else if (dateNum <= 14) monthlyWeeks[1]++;
    else if (dateNum <= 21) monthlyWeeks[2]++;
    else if (dateNum <= 28) monthlyWeeks[3]++;
    else monthlyWeeks[4]++;
  });

  const monthlyWeeksData = [
    { name: 'Semana 1 (1-7)', prospecções: monthlyWeeks[0] },
    { name: 'Semana 2 (8-14)', prospecções: monthlyWeeks[1] },
    { name: 'Semana 3 (15-21)', prospecções: monthlyWeeks[2] },
    { name: 'Semana 4 (22-28)', prospecções: monthlyWeeks[3] },
    { name: 'Semana 5 (29+)', prospecções: monthlyWeeks[4] },
  ];

  const handleGenerateMockHistory = () => {
    if (leads.length === 0) return;
    
    const nowTs = Date.now();
    const generatePastDate = (daysAgo: number, hour: number) => {
      const d = new Date(nowTs - daysAgo * 24 * 60 * 60 * 1000);
      d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
      return d.toISOString();
    };

    const mockDates: string[] = [];
    
    // Last 24h
    mockDates.push(generatePastDate(0, 10)); // Today 10am
    mockDates.push(generatePastDate(0.1, 14)); // Yesterday afternoon
    mockDates.push(generatePastDate(0.2, 16)); // Yesterday afternoon
    mockDates.push(generatePastDate(0.5, 20)); // Yesterday night

    // Monday (assuming today is around middle of the week)
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    
    for (let i = 0; i < 12; i++) {
      mockDates.push(generatePastDate(daysSinceMonday, 9 + Math.floor(Math.random() * 8)));
    }
    // Tuesday
    if (daysSinceMonday >= 1) {
      for (let i = 0; i < 18; i++) {
        mockDates.push(generatePastDate(daysSinceMonday - 1, 9 + Math.floor(Math.random() * 8)));
      }
    }
    // Wednesday
    if (daysSinceMonday >= 2) {
      for (let i = 0; i < 15; i++) {
        mockDates.push(generatePastDate(daysSinceMonday - 2, 9 + Math.floor(Math.random() * 8)));
      }
    }

    // Previous weeks of the month
    for (let i = 0; i < 28; i++) {
      mockDates.push(generatePastDate(9 + Math.floor(Math.random() * 6), 9 + Math.floor(Math.random() * 8)));
    }
    for (let i = 0; i < 32; i++) {
      mockDates.push(generatePastDate(16 + Math.floor(Math.random() * 6), 9 + Math.floor(Math.random() * 8)));
    }

    // Distribute among existing leads
    const leadsCopy = [...leads];
    const itemsPerLead = Math.ceil(mockDates.length / leadsCopy.length);
    
    leadsCopy.forEach((lead, index) => {
      const startIdx = index * itemsPerLead;
      const endIdx = Math.min(startIdx + itemsPerLead, mockDates.length);
      const slice = mockDates.slice(startIdx, endIdx);
      
      if (slice.length > 0) {
        onUpdateLead({
          ...lead,
          whatsappContactHistory: [...(lead.whatsappContactHistory || []), ...slice]
        });
      }
    });
  };

  // 1. Calculate Core KPI stats
  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => !l.optOut);
  const totalRevenue = projects.reduce((acc, curr) => acc + curr.value, 0);

  // Compute Potential Funnel Value for leads in the active Closing Pipeline
  // Assign standard ticket values for high-ticket Local Business offers:
  // - LP / Single Template: R$ 2.500,00
  // - Custom Business Site: R$ 5.000,00
  // - Custom Platforms/Complex: R$ 10.000,00
  const getLeadPotentialValue = (lead: Lead) => {
    // If the lead has an explicit score-based potential value, use it
    if (lead.score?.potentialValue) return lead.score.potentialValue;
    
    // Otherwise fallback to segment-based or default standard high-ticket ticket
    const cat = (lead.category || '').toLowerCase();
    if (cat.includes('dentista') || cat.includes('médico') || cat.includes('estética') || cat.includes('advocacia')) {
      return 5000; // High-ticket professional site
    }
    if (cat.includes('marcenaria') || cat.includes('arquitetura') || cat.includes('engenharia')) {
      return 6000; // Mid-high custom project
    }
    return 3000; // Standard landing page
  };

  const potentialFunnelValue = leads
    .filter(l => !l.optOut && (l.status === 'DEMONSTROU_INTERESSE' || !!l.closingStatus) && l.closingStatus !== 'FECHADO')
    .reduce((acc, lead) => acc + getLeadPotentialValue(lead), 0);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };
  
  // Contacts segmentation (WhatsApp vs Fixo)
  let whatsappCount = 0;
  let fixoCount = 0;
  let linkedInCount = 0;
  leads.forEach(l => {
    const type = l.phoneType || detectarTipoContato(l.phone);
    if (type === 'whatsapp') whatsappCount++;
    else if (type === 'fixo') fixoCount++;
    
    if (l.origem === 'LinkedIn' || l.linkedinUrl) {
      linkedInCount++;
    }
  });
  
  const whatsappPercent = totalLeads > 0 ? Math.round((whatsappCount / totalLeads) * 100) : 0;
  const fixoPercent = totalLeads > 0 ? Math.round((fixoCount / totalLeads) * 100) : 0;

  // Conversion rates (Interested leads vs total leads)
  const interestedCount = leads.filter(l => l.status === 'DEMONSTROU_INTERESSE' || !!l.closingStatus).length;
  const conversionRate = totalLeads > 0 ? ((interestedCount / totalLeads) * 100).toFixed(1) : '0';

  const closedWonCount = leads.filter(l => l.status === 'FECHADO' || l.closingStatus === 'FECHADO').length;
  const closedWonRate = totalLeads > 0 ? ((closedWonCount / totalLeads) * 100).toFixed(1) : '0';

  // M3 Recovery System calculations
  const leadsRecuperaveis = leads.filter(l => l.status === 'PERDIDO').length;
  const recuperacoesIniciadas = leads.filter(l => l.closingStatus === 'RECUPERACAO').length;
  const recuperacoesConvertadas = leads.filter(l => 
    l.recoveryHistory && l.recoveryHistory.length > 0 && 
    (l.closingStatus === 'NEGOCIACAO' || l.status === 'FECHADO' || l.recoveryHistory.some(h => h.newNegotiation))
  ).length;

  const RECOVERY_PRIORITIES: { [key: string]: number } = {
    'Sem interesse no momento': 1,
    'Achou caro': 2,
    'Vai pensar': 3,
    'Não respondeu após orçamento': 4,
    'Não respondeu após template': 5,
    'Escolheu outro fornecedor': 6,
    'Já possui agência/equipe': 7,
    'Outro': 8
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const leadsToRecoverToday = leads
    .filter(l => l.status === 'PERDIDO' && l.followUpDate && l.followUpDate <= todayStr)
    .sort((a, b) => {
      const priorityA = RECOVERY_PRIORITIES[a.lossReason || ''] || 9;
      const priorityB = RECOVERY_PRIORITIES[b.lossReason || ''] || 9;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      const dateA = a.followUpDate || '';
      const dateB = b.followUpDate || '';
      return dateB.localeCompare(dateA);
    });

  const getDaysSinceLoss = (lostAt?: string) => {
    if (!lostAt) return 0;
    const lostDate = new Date(lostAt);
    if (isNaN(lostDate.getTime())) return 0;
    const today = new Date();
    const d1 = Date.UTC(lostDate.getFullYear(), lostDate.getMonth(), lostDate.getDate());
    const d2 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const days = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  const handleSendWhatsAppRecovery = (lead: Lead) => {
    if (!lead.phone || lead.phone === 'não disponível') return;
    const phoneDigits = lead.phone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits;
    const msg = `Olá, tudo bem? 😊\n\nTempo atrás conversamos sobre a presença digital da *${lead.name}*. Estava lembrando do seu negócio e gostaria de saber se vocês ainda têm interesse em estruturar um posicionamento de alto nível ou se o projeto ficou para depois?`;
    
    const updatedHistory = [...(lead.whatsappContactHistory || [])];
    updatedHistory.push(new Date().toISOString());
    onUpdateLead({
      ...lead,
      whatsappContactHistory: updatedHistory
    });

    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 2. Identify "🔥 Prioridade do Dia" Leads (Requirement 7)
  // Criteria: Score >= 40 OR followUpDate scheduled OR in critical Negotiation stage
  const getPriorityLeads = (): { lead: Lead; scorePoints: number; reason: string; labelColor: string }[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    return leads
      .filter(l => !l.optOut && l.status !== 'FECHADO' && l.closingStatus !== 'FECHADO' && l.status !== 'PERDIDO')
      .map(lead => {
        const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);
        let priorityWeight = scoreInfo.points;
        let reason = "⚡ Score Comercial Elevado";
        let labelColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";

        // If follow-up date exists
        if (lead.followUpDate) {
          priorityWeight += 50; // Boost weight significantly
          const isTodayOrOverdue = lead.followUpDate <= todayStr;
          reason = isTodayOrOverdue ? "📅 Follow-up Pendente" : "📅 Próximo Contato";
          labelColor = isTodayOrOverdue ? "text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse" : "text-blue-400 bg-blue-500/10 border-blue-500/20";
        } else if (lead.closingStatus === 'NEGOCIACAO') {
          priorityWeight += 40;
          reason = "💰 Em Negociação Ativa";
          labelColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
        } else if (lead.status === 'DEMONSTROU_INTERESSE') {
          priorityWeight += 30;
          reason = "💬 Demonstrou Interesse";
          labelColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
        }

        return {
          lead,
          scorePoints: priorityWeight,
          reason,
          labelColor
        };
      })
      .sort((a, b) => b.scorePoints - a.scorePoints) // Sort by weight descending
      .slice(0, 5); // Take top 5
  };

  const priorityLeadsList = getPriorityLeads();

  // Gaps counts
  let semSiteCount = 0;
  let baixaRepCount = 0;
  let faltaFunilCount = 0;
  leads.forEach(l => {
    const gaps = l.gaps || detectarGaps(l);
    if (gaps.includes('SEM_SITE')) semSiteCount++;
    if (gaps.includes('REPUTACAO_BAIXA')) baixaRepCount++;
    if (gaps.includes('FALTA_FUNIL')) faltaFunilCount++;
  });

  const semSitePercent = totalLeads > 0 ? Math.round((semSiteCount / totalLeads) * 100) : 0;
  const baixaRepPercent = totalLeads > 0 ? Math.round((baixaRepCount / totalLeads) * 100) : 0;
  const faltaFunilPercent = totalLeads > 0 ? Math.round((faltaFunilCount / totalLeads) * 100) : 0;

  // 3. RECHARTS FUNNEL CHART DATA (Requirement 12)
  // Maps the outbound and closing stages sequentially to show a visual drop-off funnel
  const funnelStagesData = [
    { name: '1. Descobertos', qtd: totalLeads, desc: 'Total Prospectados' },
    { name: '2. Contatados', qtd: leads.filter(l => l.status === 'CONTATADO' || l.status === 'DEMONSTROU_INTERESSE' || !!l.closingStatus).length, desc: 'Primeira abordagem' },
    { name: '3. Interessados', qtd: interestedCount, desc: 'Engajamento positivo' },
    { name: '4. Em Desenvolvimento', qtd: leads.filter(l => l.closingStatus === 'PROJETO_EM_DESENVOLVIMENTO' || (!l.closingStatus && l.status === 'DEMONSTROU_INTERESSE')).length, desc: 'Site / LP em criação' },
    { name: '5. Projetos Entregues', qtd: leads.filter(l => l.closingStatus === 'PROJETO_ENTREGUE').length, desc: 'Entregue para o cliente' },
    { name: '6. Fechado (Vendas)', qtd: closedWonCount, desc: 'Vendas Liquidadas' }
  ];

  // 4. RECHARTS PIE CHART DATA - Niches / Segments Distribution
  const segmentCounts: { [key: string]: number } = {};
  leads.forEach(l => {
    const cat = l.category || 'Geral';
    segmentCounts[cat] = (segmentCounts[cat] || 0) + 1;
  });

  const pieChartData = Object.keys(segmentCounts)
    .map(name => ({ name, value: segmentCounts[name] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 niches

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#14b8a6'];

  // 5. RECHARTS AREA CHART DATA - Lead Generation Capture Trends (last 7 days simulated from data)
  const acquisitionTrendData = [
    { date: 'Segunda', leads: Math.max(2, Math.round(totalLeads * 0.12)) },
    { date: 'Terça', leads: Math.max(4, Math.round(totalLeads * 0.18)) },
    { date: 'Quarta', leads: Math.max(5, Math.round(totalLeads * 0.22)) },
    { date: 'Quinta', leads: Math.max(3, Math.round(totalLeads * 0.15)) },
    { date: 'Sexta', leads: Math.max(6, Math.round(totalLeads * 0.25)) },
    { date: 'Sábado', leads: Math.max(1, Math.round(totalLeads * 0.05)) },
    { date: 'Domingo', leads: Math.max(1, Math.round(totalLeads * 0.03)) },
  ];

  const handleSendWhatsAppMessage = (lead: Lead) => {
    if (!lead.phone || lead.phone === 'não disponível') return;
    const phoneDigits = lead.phone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits;
    const msg = `Olá ${lead.name.split(' ')[0]}, tudo bem? Vi sua empresa local e notei ótimas oportunidades para acelerar suas vendas online. Podemos agendar uma conversa rápida?`;
    
    const updatedHistory = [...(lead.whatsappContactHistory || [])];
    updatedHistory.push(new Date().toISOString());
    onUpdateLead({
      ...lead,
      whatsappContactHistory: updatedHistory
    });

    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`, '_blank');
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

  return (
    <div id="dashboard-container" className="p-8 space-y-8 bg-[#0f172a] text-[#f8fafc] min-h-screen">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="animate-pulse" /> Inteligência Comercial & BI Nevion
          </span>
          <h1 className="text-4xl font-black text-slate-100 tracking-tight mt-1">Dashboard Executivo</h1>
          <p className="text-slate-400 mt-1 font-medium">Controle de faturamento, andamento de propostas e prioridades diárias do comercial.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            id="nav-to-leads-btn"
            onClick={() => onNavigate(AppSection.LEADS)}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold px-5 py-2.5 rounded-xl transition-all text-xs flex items-center gap-2 cursor-pointer"
          >
            📋 Base de Leads
          </button>
          <button 
            id="nav-to-pipeline-btn"
            onClick={() => onNavigate(AppSection.PIPELINE)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 text-xs flex items-center gap-2 cursor-pointer"
          >
            📊 Pipeline Comercial
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Grid de KPIs - 3 Bento Boxes (Requirement 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* KPI 1: Total Leads */}
        <div 
          onClick={() => onNavigate(AppSection.LEADS)}
          className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:border-blue-500/50 transition-all duration-300 flex items-center justify-between cursor-pointer group"
          title="Ver Base Ativa de Leads"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Base de Leads</p>
            <p className="text-3xl font-black text-slate-100">{totalLeads}</p>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp size={10} /> +12% esta semana
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-950 border border-blue-900/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Users size={20} />
          </div>
        </div>

        {/* KPI 2: Conversion Rate */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:border-slate-700/60 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversão Geral</p>
            <p className="text-3xl font-black text-slate-100">{conversionRate}%</p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {interestedCount} de {totalLeads} demonstraram interesse
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-950 border border-purple-900/30 text-purple-400">
            <Zap size={20} fill="currentColor" />
          </div>
        </div>

        {/* KPI 3: Closed revenue */}
        <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:border-slate-700/60 transition-all duration-300 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento Líquido</p>
            <p className="text-2xl font-black text-emerald-400">{formatBRL(totalRevenue)}</p>
            <p className="text-[10px] text-emerald-400 font-bold">
              {closedWonCount} contratos formalizados ({closedWonRate}%)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-900/30 text-emerald-400">
            <PiggyBank size={20} />
          </div>
        </div>

      </div>

      {/* 🚀 CONTROLE DE SEGURANÇA E PROSPECÇÃO WHATSAPP */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-[2rem] p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare size={12} fill="currentColor" /> Monitor de Segurança WhatsApp
            </span>
            <h3 className="text-xl font-black text-slate-100 mt-1">Limite Diário & Métricas de Prospecção</h3>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">
              Controle de aquecimento de chip e envios nas últimas 24h para mitigar riscos de banimento pela Meta.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {allWhatsAppTimestamps.length === 0 && (
              <button
                type="button"
                onClick={handleGenerateMockHistory}
                className="px-3.5 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 border border-blue-700/30 hover:border-blue-700/50 text-blue-300 font-extrabold rounded-xl transition-all text-[11px] uppercase tracking-wide cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={12} />
                Simular Histórico
              </button>
            )}
            
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => setHistoryTab('WEEK')}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
                  historyTab === 'WEEK'
                    ? 'bg-slate-800 text-slate-100 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('MONTH')}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
                  historyTab === 'MONTH'
                    ? 'bg-slate-800 text-slate-100 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mês
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Block: 24h Gauge & Slider Controls */}
          <div className="lg:col-span-4 bg-slate-950/40 border border-slate-850/60 p-5 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviados (24h)</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  count24h === 0 
                    ? 'bg-slate-900 text-slate-400 border border-slate-800'
                    : percentage24h < 30
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30'
                    : percentage24h < 70
                    ? 'bg-amber-950 text-amber-400 border border-amber-900/30'
                    : percentage24h < 90
                    ? 'bg-orange-950 text-orange-400 border border-orange-900/30'
                    : 'bg-rose-950 text-rose-400 border border-rose-900/30 border border-rose-500/10 animate-pulse'
                }`}>
                  {count24h === 0 
                    ? 'Zona Inativa'
                    : percentage24h < 30
                    ? '🟢 Zona Segura'
                    : percentage24h < 70
                    ? '🟡 Atenção'
                    : percentage24h < 90
                    ? '🟠 Zona Crítica'
                    : '🚨 Risco Máximo'}
                </span>
              </div>

              {/* Huge circular or linear indicator */}
              <div className="relative pt-2">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-4xl font-black text-slate-100 font-mono tracking-tight">
                    {count24h}
                  </span>
                  <span className="text-slate-500 text-xs font-bold">
                    limite: <strong className="text-slate-300">{safeDailyLimit} / dia</strong>
                  </span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage24h < 30 
                        ? 'bg-emerald-500' 
                        : percentage24h < 70 
                        ? 'bg-amber-500' 
                        : percentage24h < 90 
                        ? 'bg-orange-500' 
                        : 'bg-rose-500 animate-pulse'
                    }`}
                    style={{ width: `${Math.min(100, percentage24h)}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed pt-1 font-sans">
                {percentage24h < 30 ? (
                  <span>O chip está na zona de aquecimento segura. Continue prospectando de forma constante.</span>
                ) : percentage24h < 70 ? (
                  <span>Aquecimento moderado. Recomendável pausar de 3 a 5 minutos entre cada envio manual.</span>
                ) : percentage24h < 90 ? (
                  <span className="text-orange-400 font-semibold">Limite próximo! Recomendamos desacelerar o ritmo de prospecção nas próximas horas.</span>
                ) : (
                  <span className="text-rose-400 font-bold animate-pulse">PARE de enviar abordagens via WhatsApp! Você atingiu o limite de segurança para evitar banimento.</span>
                )}
              </div>
            </div>

            {/* Slider configuration to adjust safe limit */}
            <div className="pt-3 border-t border-slate-800/60 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                <span>Ajustar Limite de Segurança</span>
                <span className="text-blue-400 font-mono font-bold">{safeDailyLimit} leads</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={safeDailyLimit}
                onChange={(e) => setSafeDailyLimit(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-slate-800"
              />
              <div className="flex justify-between text-[8px] font-bold text-slate-600">
                <span>10 (Conservador)</span>
                <span>50 (Recomendado)</span>
                <span>150 (Chip Maduro)</span>
              </div>
            </div>

            {/* Next slot recovery info */}
            {nextSlotTimeStr && (
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <Calendar size={14} />
                </div>
                <div className="font-sans leading-tight">
                  <p className="text-[9px] font-black uppercase text-slate-500">Próxima liberação de limite</p>
                  <p className="text-xs font-bold text-slate-300">Em <strong className="text-blue-400">{nextSlotTimeStr}</strong> (1 vaga)</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Block: Charts / Weekly & Monthly Views */}
          <div className="lg:col-span-8 bg-slate-950/20 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
            {historyTab === 'WEEK' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Prospecções desta Semana</h4>
                    <p className="text-[10px] text-slate-500">Total enviado de Segunda-Feira a Domingo.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-200">Total da semana: </span>
                    <span className="text-lg font-black text-blue-400 font-mono">{weeklyTotal}</span>
                  </div>
                </div>

                <div className="h-44 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="day" 
                        stroke="#475569" 
                        fontSize={9} 
                        tickLine={false} 
                      />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                        labelStyle={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: '11px' }}
                        itemStyle={{ color: '#10b981', fontSize: '10px' }}
                      />
                      <Bar 
                        dataKey="prospecções" 
                        name="Contatados" 
                        fill="#10b981" 
                        radius={[6, 6, 0, 0]}
                      >
                        {weeklyChartData.map((entry, index) => {
                          const isToday = entry.day === ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][new Date().getDay()];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={isToday ? '#3b82f6' : '#10b981'} 
                              fillOpacity={entry.prospecções === 0 ? 0.25 : 0.85}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Métricas deste Mês</h4>
                    <p className="text-[10px] text-slate-500">Distribuição semanal das prospecções ativas.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-200">Total do mês: </span>
                    <span className="text-lg font-black text-emerald-400 font-mono">{countMonth}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
                  {monthlyWeeksData.map((week, i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-850 p-3 rounded-xl text-center space-y-1">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider truncate">{week.name}</p>
                      <p className="text-xl font-mono font-black text-slate-100">{week.prospecções}</p>
                      <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${countMonth > 0 ? (week.prospecções / countMonth) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Monthly stats breakdown footer */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/60 text-center text-[10px] font-sans">
                  <div className="p-2.5 bg-slate-900/20 border border-slate-850/40 rounded-xl">
                    <p className="text-slate-500 font-bold uppercase">Média Semanal</p>
                    <p className="text-slate-200 font-extrabold text-sm mt-0.5">
                      {Math.round(countMonth / 4.3)} envios
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/20 border border-slate-850/40 rounded-xl">
                    <p className="text-slate-500 font-bold uppercase">Meta de Prospecção</p>
                    <p className="text-slate-200 font-extrabold text-sm mt-0.5">
                      {countMonth} / 250
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-900/20 border border-slate-850/40 rounded-xl">
                    <p className="text-slate-500 font-bold uppercase">Conclusão da Meta</p>
                    <p className="text-emerald-400 font-extrabold text-sm mt-0.5">
                      {Math.min(100, Math.round((countMonth / 250) * 100))}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-sans">
              <span className="flex items-center gap-1">
                <CheckCircle size={11} className="text-emerald-400" />
                Histórico sincronizado com a base de leads ativa.
              </span>
              <span>Meta Mensal Recomendada: <strong>250</strong></span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Column Grid (Prioridades + Funnel Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: 🔥 PRIORIDADE DO DIA PANEL (Requirement 7) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800/90 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-100 flex items-center gap-1.5">
                  <Flame size={18} className="text-rose-500 shrink-0 fill-rose-600/30" />
                  Prioridades do Dia
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Ações urgentes estimadas pelo Lead Score para converter hoje.</p>
              </div>
              <span className="bg-rose-950 text-rose-400 px-2 py-0.5 rounded-full text-[9px] font-black border border-rose-900/40 animate-pulse">
                {priorityLeadsList.length} Leads
              </span>
            </div>

            {/* List of Priority items */}
            <div className="space-y-3">
              {priorityLeadsList.map(({ lead, reason, labelColor }) => {
                const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);
                return (
                  <div 
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 border transition-all duration-300 flex flex-col justify-between gap-3 group cursor-pointer relative rounded-xl ${
                      lead.videoReactivationSent
                        ? 'bg-gradient-to-tr from-[#1c121e] via-[#020617] to-[#020617] border-rose-900/50 hover:border-rose-850 shadow-inner'
                        : 'bg-slate-950 hover:bg-slate-950/85 border-slate-850 hover:border-slate-750'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs text-slate-200 line-clamp-1 pr-6">{lead.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{lead.category || 'Nicho'} &bull; {lead.city}</p>
                      </div>
                      
                      {/* Score Badge */}
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border shrink-0 ${scoreInfo.color}`}>
                        {scoreInfo.points} PTS
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-900/60">
                      {/* Trigger Priority Reason */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${labelColor}`}>
                          {reason}
                        </span>
                        {lead.videoReactivationSent && (
                          <span className="bg-rose-950 text-[9px] font-black text-rose-300 border border-rose-900/40 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse uppercase tracking-wider">
                            <Video size={8} className="fill-rose-400 text-rose-400 shrink-0" /> Reativado
                          </span>
                        )}
                      </div>

                      {/* Call Actions */}
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {lead.status === 'NAO_RESPONDEU' ? (
                          <button
                            type="button"
                            onClick={() => handleSendVideoReactivation(lead)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all animate-pulse cursor-pointer flex items-center gap-1 text-[9px] font-black uppercase px-2"
                            title="Enviar Vídeo Reativação"
                          >
                            <Video size={10} className="fill-white/10" />
                            Reativação
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppMessage(lead)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                            title="Enviar Abordagem Rápida"
                          >
                            <MessageSquare size={10} fill="currentColor" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedLead(lead)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-black text-[9px] uppercase tracking-wide rounded-lg transition-colors cursor-pointer"
                        >
                          Ver Perfil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {priorityLeadsList.length === 0 && (
                <div className="py-12 text-center border border-dashed border-slate-850 rounded-xl bg-slate-950/25">
                  <Sparkles className="mx-auto text-slate-700 mb-1" size={24} />
                  <p className="text-xs text-slate-500">Nenhuma prioridade pendente para hoje!</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={12} className="text-blue-400" />
              Sincronizado em Tempo Real
            </span>
            <button
              onClick={() => onNavigate(AppSection.LEADS)}
              className="text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
            >
              Ver todos os leads &rarr;
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: RECHARTS COMPREHENSIVE CHARTS (Funnel Requirement 12 & Nicho Distribution) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800/90 rounded-[2rem] p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-100">Funil de Conversão Comercial</h3>
              <p className="text-[11px] text-slate-400 font-medium">Drop-off e taxas de avanço nos estágios de fechamento high-ticket.</p>
            </div>
            
            <div className="flex gap-2 text-[10px] font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-850">
              <span>Total Ativo: <strong>{activeLeads.length}</strong></span>
            </div>
          </div>

          {/* Visual Funnel Bar Chart with drop-off percentages displayed in Recharts */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelStagesData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: '12px' }}
                  itemStyle={{ color: '#3b82f6', fontSize: '11px' }}
                />
                <Bar 
                  dataKey="qtd" 
                  name="Leads no Estágio" 
                  fill="#6366f1" 
                  radius={[10, 10, 0, 0]}
                >
                  {funnelStagesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Funnel Dropoff Analytics list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-4 border-t border-slate-800">
            {funnelStagesData.map((stage, i) => {
              const prevStageVal = i > 0 ? funnelStagesData[i - 1].qtd : totalLeads;
              const percent = prevStageVal > 0 ? Math.round((stage.qtd / prevStageVal) * 100) : 100;
              return (
                <div key={stage.name} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-center space-y-0.5">
                  <div className="text-[10px] text-slate-500 font-extrabold truncate uppercase" title={stage.name}>
                    {stage.name.split('. ')[1] || stage.name}
                  </div>
                  <div className="text-sm font-black text-slate-200">{stage.qtd}</div>
                  <div className="text-[9px] text-emerald-400 font-bold">
                    {i === 0 ? 'Conversão' : `${percent}% de avanço`}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* M4: Performance das Copies */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={12} /> Inteligência de Distribuição (M4)
            </div>
            <h3 className="font-extrabold text-slate-100 text-lg tracking-tight">Desempenho e Conversão de Copies</h3>
            <p className="text-slate-400 text-xs font-medium">Métricas integradas de alcance, envios automatizados e taxa de resposta local.</p>
          </div>
          <button
            onClick={() => onNavigate(AppSection.COPIES)}
            className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            Ir para Biblioteca
            <ArrowRight size={13} />
          </button>
        </div>

        {copies.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-bold">
            Nenhuma copy cadastrada no banco de dados ainda. Vá para a Biblioteca de Copies para criar as primeiras.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Nome da Copy</th>
                  <th className="py-3 px-4">Canal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Cliques / Envios</th>
                  <th className="py-3 px-4 text-center">Respostas</th>
                  <th className="py-3 px-4 text-right">Taxa de Resposta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {copies.map(copy => {
                  const sends = copy.sendCount || 0;
                  const responses = copy.responseCount || 0;
                  const rate = sends > 0 ? Math.round((responses / sends) * 100) : 0;
                  
                  return (
                    <tr key={copy.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-slate-200">
                        {copy.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-400">
                        {copy.channel}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          copy.status === 'Ativa' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' 
                            : 'bg-slate-950 text-slate-500 border border-slate-800'
                        }`}>
                          {copy.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                        {sends}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                        {responses}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full rounded-full ${
                                rate >= 40 ? 'bg-emerald-500' : rate >= 20 ? 'bg-blue-500' : 'bg-slate-700'
                              }`} 
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="font-mono font-black text-slate-100 min-w-[35px]">
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* DETAILED LEAD PROFILE POPUP DRAWER MODAL (From Priority click) */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateLead={(updated) => {
            onUpdateLead(updated);
            // Sync local selected state
            setSelectedLead(updated);
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

export default DashboardView;
