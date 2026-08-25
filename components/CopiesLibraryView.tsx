import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Search, 
  Check, 
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  TrendingUp,
  Award,
  Copy as CopyIcon,
  Zap,
  Flame,
  BarChart2,
  Sparkles,
  Layers
} from 'lucide-react';
import { ProspectingCopy } from '../types';
import { DEFAULT_PROSPECTING_COPIES } from '../helpers';

interface Props {
  copies: ProspectingCopy[];
  onAddCopy: (name: string, content: string, channel: 'Google Maps' | 'Instagram' | 'Facebook' | 'LinkedIn' | 'WhatsApp', status: 'Ativa' | 'Inativa') => void;
  onUpdateCopy: (updatedCopy: ProspectingCopy) => void;
  onDeleteCopy: (id: string) => void;
}

const CopiesLibraryView: React.FC<Props> = ({ copies, onAddCopy, onUpdateCopy, onDeleteCopy }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<'All' | 'Google Maps' | 'Instagram' | 'Facebook' | 'LinkedIn' | 'WhatsApp'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'NOVAS' | 'SUAVES' | 'AGRESSIVAS'>('ALL');
  const [sortBy, setSortBy] = useState<'TAXA' | 'ENVIOS' | 'RETORNOS' | 'NOME'>('TAXA');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<ProspectingCopy | null>(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState<'Google Maps' | 'Instagram' | 'Facebook' | 'LinkedIn' | 'WhatsApp'>('WhatsApp');
  const [status, setStatus] = useState<'Ativa' | 'Inativa'>('Ativa');
  const [error, setError] = useState<string | null>(null);

  // Global Stats
  const totalSends = copies.reduce((acc, c) => acc + (c.sendCount || 0), 0);
  const totalResponses = copies.reduce((acc, c) => acc + (c.responseCount || 0), 0);
  const averageConversion = totalSends > 0 ? ((totalResponses / totalSends) * 100).toFixed(1) : '0.0';

  // Identify Top Conversion Copy
  let topCopyId = '';
  let highestRate = -1;
  copies.forEach(c => {
    if ((c.sendCount || 0) > 0) {
      const rate = (c.responseCount || 0) / c.sendCount;
      if (rate > highestRate) {
        highestRate = rate;
        topCopyId = c.id;
      }
    }
  });

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setToastMessage('Texto da copy copiado para a área de transferência!');
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 2500);
  };

  const handleRestoreDefaults = () => {
    let addedCount = 0;
    DEFAULT_PROSPECTING_COPIES.forEach(defCopy => {
      const exists = copies.some(c => c.id === defCopy.id || c.name.toLowerCase() === defCopy.name.toLowerCase());
      if (!exists) {
        onAddCopy(defCopy.name, defCopy.content, defCopy.channel, defCopy.status);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setToastMessage(`${addedCount} copys padrão (incluindo 1A-2C) adicionadas com sucesso!`);
    } else {
      setToastMessage('Todas as copys padrão já estão presentes na sua biblioteca.');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSimulateDailyBatch = () => {
    const increments: Record<string, number> = {
      'Copy 1A': 7,
      'Copy 1B': 7,
      'Copy 1C': 7,
      'Copy 2A': 3,
      'Copy 2B': 3,
      'Copy 2C': 3,
    };

    let updatedAny = false;
    copies.forEach(c => {
      let addVal = 0;
      for (const [key, val] of Object.entries(increments)) {
        if (c.name.includes(key)) {
          addVal = val;
          break;
        }
      }
      if (addVal > 0) {
        onUpdateCopy({
          ...c,
          sendCount: (c.sendCount || 0) + addVal
        });
        updatedAny = true;
      }
    });

    if (updatedAny) {
      setToastMessage('Simulação de disparo diário de 30 leads executada! Contadores +1 Envio atualizados.');
    } else {
      setToastMessage('Não foram encontradas as copys 1A-2C. Clique em "Restaurar Copys Padrão".');
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da copy.');
      return;
    }
    if (!content.trim()) {
      setError('Por favor, digite o conteúdo da copy.');
      return;
    }

    onAddCopy(name.trim(), content.trim(), channel, status);
    
    setName('');
    setContent('');
    setChannel('WhatsApp');
    setStatus('Ativa');
    setError(null);
    setIsCreateOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCopy) return;
    if (!editingCopy.name.trim()) {
      setError('Por favor, informe o nome da copy.');
      return;
    }
    if (!editingCopy.content.trim()) {
      setError('Por favor, digite o conteúdo da copy.');
      return;
    }

    onUpdateCopy(editingCopy);
    setEditingCopy(null);
    setError(null);
  };

  const toggleCopyStatus = (copy: ProspectingCopy) => {
    const updated: ProspectingCopy = {
      ...copy,
      status: copy.status === 'Ativa' ? 'Inativa' : 'Ativa'
    };
    onUpdateCopy(updated);
  };

  // Helper to categorize copy
  const getCopyCategory = (cName: string) => {
    if (cName.includes('Copy 1A') || cName.includes('Copy 1B') || cName.includes('Copy 1C')) return 'SUAVE';
    if (cName.includes('Copy 2A') || cName.includes('Copy 2B') || cName.includes('Copy 2C')) return 'AGRESSIVA';
    return 'PADRÃO';
  };

  // Filter & Sort
  const filteredCopies = copies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === 'All' || c.channel === channelFilter;
    
    const cat = getCopyCategory(c.name);
    let matchesCategory = true;
    if (categoryFilter === 'NOVAS') matchesCategory = (cat === 'SUAVE' || cat === 'AGRESSIVA');
    else if (categoryFilter === 'SUAVES') matchesCategory = (cat === 'SUAVE');
    else if (categoryFilter === 'AGRESSIVAS') matchesCategory = (cat === 'AGRESSIVA');

    return matchesSearch && matchesChannel && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'TAXA') {
      const rateA = a.sendCount > 0 ? (a.responseCount / a.sendCount) : 0;
      const rateB = b.sendCount > 0 ? (b.responseCount / b.sendCount) : 0;
      return rateB - rateA;
    }
    if (sortBy === 'ENVIOS') return (b.sendCount || 0) - (a.sendCount || 0);
    if (sortBy === 'RETORNOS') return (b.responseCount || 0) - (a.responseCount || 0);
    return a.name.localeCompare(b.name);
  });

  const getChannelColor = (ch: string) => {
    switch (ch) {
      case 'WhatsApp': return 'bg-emerald-950/60 border-emerald-900/45 text-emerald-400';
      case 'Instagram': return 'bg-pink-950/60 border-pink-900/45 text-pink-400';
      case 'Facebook': return 'bg-blue-950/60 border-blue-900/45 text-blue-400';
      case 'LinkedIn': return 'bg-sky-950/60 border-sky-900/45 text-sky-400';
      case 'Google Maps': return 'bg-amber-950/60 border-amber-900/45 text-amber-400';
      default: return 'bg-slate-950 border-slate-800 text-slate-400';
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] text-[#f8fafc] min-h-screen font-sans relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/40 animate-bounce">
          <CheckCircle size={18} />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <MessageSquare size={32} className="text-blue-500" />
            Biblioteca Inteligente de Copies
          </h1>
          <p className="text-slate-400 mt-1 font-medium text-xs">
            Gerencie, monitore a taxa de resposta e execute o sistema de rotação de 6 novas variações (1A-2C).
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRestoreDefaults}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold px-4 py-3 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            title="Adicionar ou restaurar o pacote de 6 novas copys (1A a 2C)"
          >
            <Sparkles size={16} className="text-amber-400" />
            Restaurar Copys Padrão
          </button>

          <button
            onClick={() => {
              setError(null);
              setIsCreateOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30 text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            Cadastrar Copy
          </button>
        </div>
      </div>

      {/* Stats Cards - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800/80 rounded-[2rem] p-6 flex items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Total de Disparos</span>
            <span className="text-3xl font-black font-mono text-blue-400">{totalSends}</span>
            <span className="text-[10px] text-slate-400 block font-medium">Contatos realizados via Lead Engine</span>
          </div>
          <div className="bg-blue-950/40 border border-blue-900/30 p-3 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
            <RefreshCw size={20} className="animate-spin-slow" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-[2rem] p-6 flex items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Retornos Recebidos</span>
            <span className="text-3xl font-black font-mono text-emerald-400">{totalResponses}</span>
            <span className="text-[10px] text-slate-400 block font-medium">Leads que responderam à abordagem</span>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-900/30 p-3 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-[2rem] p-6 flex items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Taxa Média de Resposta</span>
            <span className="text-3xl font-black font-mono text-indigo-400">{averageConversion}%</span>
            <span className="text-[10px] text-slate-400 block font-medium">(Retornos ÷ Contatos) × 100</span>
          </div>
          <div className="bg-indigo-950/40 border border-indigo-900/30 p-3 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* ROTATION SYSTEM PANEL (30 LEADS/DAY) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={13} className="text-amber-400" />
                Sistema de Rotação Anti-Spam (30 Leads/Dia)
              </span>
              <span className="text-xs text-slate-400 font-mono">Teste A/B Natural</span>
            </div>
            <h3 className="text-lg font-black text-slate-100 tracking-tight">
              Estratégia Recomendada para João Disparar 30 Leads/Dia Sem Bloqueio
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Distribuir os disparos diários entre as variações evita padrões repetitivos detectados como spam e permite testar na prática a conversão entre o tom <span className="text-emerald-400 font-bold">Suave (1A, 1B, 1C)</span> e o tom <span className="text-amber-400 font-bold">Agressivo (2A, 2B, 2C)</span>.
            </p>
          </div>

          <button
            onClick={handleSimulateDailyBatch}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-950 text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer"
            title="Simula 30 disparos diários divididos entre as 6 variações"
          >
            <BarChart2 size={16} />
            Simular Disparo Diário (30 leads)
          </button>
        </div>

        {/* Grid breakdown of rotation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-emerald-900/30 rounded-xl p-3 text-center space-y-1">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">7 Disparos</span>
            <span className="text-xs font-black text-slate-200 block truncate">Copy 1A</span>
            <span className="text-[9px] text-slate-400 block">Suave Oportunidade</span>
          </div>

          <div className="bg-slate-950/70 border border-emerald-900/30 rounded-xl p-3 text-center space-y-1">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">7 Disparos</span>
            <span className="text-xs font-black text-slate-200 block truncate">Copy 1B</span>
            <span className="text-[9px] text-slate-400 block">Suave Simples</span>
          </div>

          <div className="bg-slate-950/70 border border-emerald-900/30 rounded-xl p-3 text-center space-y-1">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">7 Disparos</span>
            <span className="text-xs font-black text-slate-200 block truncate">Copy 1C</span>
            <span className="text-[9px] text-slate-400 block">Suave Elegante</span>
          </div>

          <div className="bg-slate-950/70 border border-amber-900/30 rounded-xl p-3 text-center space-y-1">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">3 Disparos</span>
            <span className="text-xs font-black text-slate-200 block truncate">Copy 2A</span>
            <span className="text-[9px] text-slate-400 block">Agressiva Urgência</span>
          </div>

          <div className="bg-slate-950/70 border border-amber-900/30 rounded-xl p-3 text-center space-y-1">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">3 Disparos</span>
            <span className="text-xs font-black text-slate-200 block truncate">Copy 2B</span>
            <span className="text-[9px] text-slate-400 block">Agressiva Qualidade</span>
          </div>

          <div className="bg-slate-950/70 border border-amber-900/30 rounded-xl p-3 text-center space-y-1">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">3 Disparos</span>
            <span className="text-xs font-black text-slate-200 block truncate">Copy 2C</span>
            <span className="text-[9px] text-slate-400 block">Agressiva Consultoria</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">3 Disparos</span>
            <span className="text-xs font-black text-slate-200 block truncate">Outras Copys</span>
            <span className="text-[9px] text-slate-500 block">Rotação Antiga</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar por nome ou texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-12 pr-4 text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">Todas Categorias</option>
            <option value="NOVAS">Pacote Novo (1A a 2C)</option>
            <option value="SUAVES">Variações Suaves (1A, 1B, 1C)</option>
            <option value="AGRESSIVAS">Variações Agressivas (2A, 2B, 2C)</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="TAXA">Ordenar por: Maior Taxa de Resposta (%)</option>
            <option value="ENVIOS">Ordenar por: Mais Contatos Enviados</option>
            <option value="RETORNOS">Ordenar por: Mais Retornos</option>
            <option value="NOME">Ordenar por: Nome</option>
          </select>
        </div>

        {/* Channel filter pills */}
        <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end">
          {(['All', 'WhatsApp', 'Google Maps', 'Instagram', 'Facebook', 'LinkedIn'] as const).map(ch => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                channelFilter === ch 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {ch === 'All' ? 'Todos Canais' : ch}
            </button>
          ))}
        </div>
      </div>

      {/* Copies Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredCopies.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900 border border-slate-800/80 rounded-3xl">
            <MessageSquare size={36} className="mx-auto mb-3 text-slate-600" />
            <p className="font-bold text-sm text-slate-300">Nenhuma copy encontrada</p>
            <p className="text-xs mt-1 text-slate-500">
              Experimente alterar os filtros ou clique no botão <span className="text-amber-400 font-bold">"Restaurar Copys Padrão"</span> acima.
            </p>
          </div>
        ) : (
          filteredCopies.map(copy => {
            const sendCount = copy.sendCount || 0;
            const responseCount = copy.responseCount || 0;
            const rateNum = sendCount > 0 ? (responseCount / sendCount) * 100 : 0;
            const conversionRate = rateNum.toFixed(1);
            const isTopPerformer = copy.id === topCopyId && sendCount > 0;
            const category = getCopyCategory(copy.name);

            return (
              <div 
                key={copy.id}
                className={`bg-slate-900 border rounded-[2rem] p-6 shadow-xl flex flex-col justify-between space-y-4 group transition-all relative ${
                  isTopPerformer 
                    ? 'border-amber-500/50 ring-1 ring-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20' 
                    : 'border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Top Badge Row */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getChannelColor(copy.channel)}`}>
                      {copy.channel}
                    </span>

                    {category === 'SUAVE' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                        Suave
                      </span>
                    )}

                    {category === 'AGRESSIVA' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-950/60 border border-amber-800/40 text-amber-400">
                        Agressiva
                      </span>
                    )}

                    {isTopPerformer && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center gap-1 shadow-lg shadow-amber-950">
                        <Flame size={12} className="text-amber-400 animate-pulse" />
                        🏆 Melhor Desempenho
                      </span>
                    )}

                    <button
                      onClick={() => toggleCopyStatus(copy)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        copy.status === 'Ativa'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                          : 'bg-rose-950/40 text-rose-400 border-rose-900/30'
                      }`}
                      title="Clique para alternar status da copy"
                    >
                      {copy.status}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyText(copy.content, copy.id)}
                      className="text-slate-400 hover:text-blue-400 p-2 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                      title="Copiar texto da copy"
                    >
                      {copiedId === copy.id ? <Check size={14} className="text-emerald-400" /> : <CopyIcon size={14} />}
                    </button>
                    <button
                      onClick={() => setEditingCopy(copy)}
                      className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                      title="Editar Copy"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteCopy(copy.id)}
                      className="text-slate-400 hover:text-rose-400 p-2 hover:bg-rose-950/20 rounded-xl transition cursor-pointer"
                      title="Excluir Copy"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Content Box */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm text-slate-100 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    {copy.name}
                  </h3>
                  <div className="bg-slate-950 border border-slate-850/80 rounded-2xl p-4 h-36 overflow-y-auto font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-line select-all scrollbar-thin">
                    {copy.content}
                  </div>
                </div>

                {/* Bottom Metrics & Increments */}
                <div className="pt-4 border-t border-slate-850 flex flex-wrap gap-4 items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-3">
                    <div>
                      Contatos: <span className="font-bold text-slate-200 font-mono">{sendCount}</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                    <div>
                      Retornos: <span className="font-bold text-emerald-400 font-mono">{responseCount}</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                    <div className={`px-2 py-0.5 rounded-md border font-bold font-mono ${
                      rateNum >= 20 
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' 
                        : rateNum > 0 
                        ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/20' 
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}>
                      Taxa: {conversionRate}%
                    </div>
                  </div>

                  {/* Increment Buttons */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        onUpdateCopy({
                          ...copy,
                          sendCount: sendCount + 1
                        });
                        setToastMessage(`Envio incrementado na ${copy.name}!`);
                        setTimeout(() => setToastMessage(null), 2000);
                      }}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
                      title="Incremente 1 envio (Contatos)"
                    >
                      +1 Envio
                    </button>
                    <button
                      onClick={() => {
                        onUpdateCopy({
                          ...copy,
                          responseCount: responseCount + 1
                        });
                        setToastMessage(`Retorno registrado na ${copy.name}! Taxa recalculada.`);
                        setTimeout(() => setToastMessage(null), 2000);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-[10px] text-emerald-400 hover:text-emerald-300 rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
                      title="Incremente 1 retorno (Retornos e Recálculo da Taxa)"
                    >
                      +1 Retorno
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Copy Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/55">
              <h3 className="font-black uppercase tracking-wide text-sm flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" />
                Cadastrar Nova Copy Comercial
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3.5 bg-rose-950/45 border border-rose-900/40 text-rose-300 rounded-xl text-xs flex items-center gap-2 font-bold">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nome da Copy</label>
                <input 
                  type="text"
                  placeholder="Ex: Copy 1A - Suave com Oportunidade"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Canal Compatível</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Google Maps">Google Maps</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status Inicial</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('Ativa')}
                      className={`flex-1 p-3 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                        status === 'Ativa' 
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 font-extrabold' 
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      Ativa
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('Inativa')}
                      className={`flex-1 p-3 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                        status === 'Inativa' 
                          ? 'bg-rose-950/50 border-rose-500 text-rose-400 font-extrabold' 
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      Inativa
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Conteúdo do Script</label>
                  <span className="text-[9px] text-slate-500 font-bold">Use {"{nome}"}, {"{nicho}"}, {"{cidade}"}</span>
                </div>
                <textarea
                  placeholder="Ex: Olá, tudo bem? Vi o perfil da {nome}..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans leading-relaxed resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
                >
                  Salvar Copy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Copy Modal */}
      {editingCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/55">
              <h3 className="font-black uppercase tracking-wide text-sm flex items-center gap-2">
                <Edit2 size={16} className="text-blue-500" />
                Editar Copy Comercial
              </h3>
              <button 
                onClick={() => setEditingCopy(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3.5 bg-rose-950/45 border border-rose-900/40 text-rose-300 rounded-xl text-xs flex items-center gap-2 font-bold">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nome da Copy</label>
                <input 
                  type="text"
                  value={editingCopy.name}
                  onChange={(e) => setEditingCopy({ ...editingCopy, name: e.target.value })}
                  placeholder="Ex: Copy 1A - Suave com Oportunidade"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Canal Compatível</label>
                  <select
                    value={editingCopy.channel}
                    onChange={(e) => setEditingCopy({ ...editingCopy, channel: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Google Maps">Google Maps</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status da Copy</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCopy({ ...editingCopy, status: 'Ativa' })}
                      className={`flex-1 p-3 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                        editingCopy.status === 'Ativa' 
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 font-extrabold' 
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      Ativa
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCopy({ ...editingCopy, status: 'Inativa' })}
                      className={`flex-1 p-3 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                        editingCopy.status === 'Inativa' 
                          ? 'bg-rose-950/50 border-rose-500 text-rose-400 font-extrabold' 
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      Inativa
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Conteúdo do Script</label>
                  <span className="text-[9px] text-slate-500 font-bold">Use {"{nome}"}, {"{nicho}"}, {"{cidade}"}</span>
                </div>
                <textarea
                  value={editingCopy.content}
                  onChange={(e) => setEditingCopy({ ...editingCopy, content: e.target.value })}
                  placeholder="Ex: Olá, tudo bem? Vi o perfil da {nome}..."
                  className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans leading-relaxed resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingCopy(null)}
                  className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
                >
                  Atualizar Copy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CopiesLibraryView;
