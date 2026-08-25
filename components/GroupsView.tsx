import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Layers, 
  X, 
  Globe, 
  MessageSquare,
  Facebook,
  Send,
  Linkedin,
  Calendar,
  AlertCircle,
  Settings,
  HelpCircle,
  Lightbulb,
  Compass,
  ArrowRight,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeadGroup } from '../types';

interface Props {
  groups: LeadGroup[];
  onAddGroup: (group: LeadGroup) => void;
  onUpdateGroup: (group: LeadGroup) => void;
  onDeleteGroup: (groupId: string) => void;
}

const GroupsView: React.FC<Props> = ({ groups, onAddGroup, onUpdateGroup, onDeleteGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeDrawerGroup, setActiveDrawerGroup] = useState<LeadGroup | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [copiedTerm, setCopiedTerm] = useState(false);

  const handleCloseDrawer = () => {
    setActiveDrawerGroup(null);
    setShowDeleteConfirm(false);
  };

  // New Group Form State
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState<'Facebook' | 'WhatsApp' | 'Telegram' | 'LinkedIn'>('Facebook');
  const [newNiche, setNewNiche] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newStatus, setNewStatus] = useState<'Entrar' | 'Participando' | 'Publicado' | 'Gerou Lead'>('Entrar');
  const [newNotes, setNewNotes] = useState('');
  const [newPostText, setNewPostText] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Suggested Niches
  const suggestedNiches = ['Harmonização Facial', 'Psicologia', 'Odontologia', 'Estética', 'Advocacia', 'Contabilidade'];

  // Handle Add Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNiche.trim() || !newLink.trim()) {
      setAddError('Por favor, preencha todos os campos obrigatórios (Nome, Nicho e Link).');
      return;
    }

    if (!newLink.startsWith('http://') && !newLink.startsWith('https://')) {
      setAddError('O Link do Grupo deve começar com http:// ou https://');
      return;
    }

    const createdGroup: LeadGroup = {
      id: 'group-' + Date.now(),
      name: newName,
      platform: newPlatform,
      niche: newNiche,
      link: newLink,
      status: newStatus,
      notes: newNotes,
      postText: newPostText,
      leadsGenerated: 0,
      salesCount: 0,
      salesValue: 0,
    };

    onAddGroup(createdGroup);
    
    // Reset Form
    setNewName('');
    setNewPlatform('Facebook');
    setNewNiche('');
    setNewLink('');
    setNewStatus('Entrar');
    setNewNotes('');
    setNewPostText('');
    setAddError(null);
    setIsAddModalOpen(false);
  };

  // Quick helper to get platform styling/badge
  const getPlatformDetails = (platform: string) => {
    switch (platform) {
      case 'Facebook':
        return { color: 'text-blue-400 bg-blue-950/40 border-blue-900/30', icon: Facebook };
      case 'WhatsApp':
        return { color: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30', icon: MessageSquare };
      case 'Telegram':
        return { color: 'text-sky-400 bg-sky-950/40 border-sky-900/30', icon: Send };
      case 'LinkedIn':
        return { color: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/30', icon: Linkedin };
      default:
        return { color: 'text-slate-400 bg-slate-950/40 border-slate-900/30', icon: Globe };
    }
  };

  // Quick helper to get status styling/badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Entrar':
        return 'text-slate-400 bg-slate-950/40 border-slate-800';
      case 'Participando':
        return 'text-amber-400 bg-amber-950/40 border-amber-900/30';
      case 'Publicado':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30';
      case 'Gerou Lead':
        return 'text-violet-400 bg-violet-950/40 border-violet-900/30';
      default:
        return 'text-slate-400 bg-slate-950 border-slate-800';
    }
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Mark group as published
  const handleMarkAsPublished = (group: LeadGroup) => {
    const updated: LeadGroup = {
      ...group,
      status: 'Publicado',
      lastPublishedAt: new Date().toISOString()
    };
    onUpdateGroup(updated);
    if (activeDrawerGroup?.id === group.id) {
      setActiveDrawerGroup(updated);
    }
  };

  // Image/Video upload preview simulated through base64 representation
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'postImage' | 'postVideo', group: LeadGroup) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const updated: LeadGroup = {
        ...group,
        [type]: base64
      };
      onUpdateGroup(updated);
      if (activeDrawerGroup?.id === group.id) {
        setActiveDrawerGroup(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove media from post
  const handleRemoveMedia = (type: 'postImage' | 'postVideo', group: LeadGroup) => {
    const updated: LeadGroup = {
      ...group,
      [type]: undefined
    };
    onUpdateGroup(updated);
    if (activeDrawerGroup?.id === group.id) {
      setActiveDrawerGroup(updated);
    }
  };

  // KPI Calculations
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => ['Participando', 'Publicado', 'Gerou Lead'].includes(g.status)).length;
  const scheduledPosts = groups.filter(g => g.postText && g.postText.trim() !== '').length;
  const totalLeads = groups.reduce((acc, g) => acc + (g.leadsGenerated || 0), 0);
  const totalSalesCount = groups.reduce((acc, g) => acc + (g.salesCount || 0), 0);
  const totalSalesValue = groups.reduce((acc, g) => acc + (g.salesValue || 0), 0);

  // Filter logic
  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.niche.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === 'All' || g.platform === selectedPlatform;
    const matchesStatus = selectedStatus === 'All' || g.status === selectedStatus;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#020617] text-slate-100 min-h-screen">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 tracking-tight flex items-center gap-3">
            <Layers size={28} className="text-blue-500" /> Grupos de Leads
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            Organize seus grupos de networking para salvar copies, programar posts manuais e trackear faturamento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button 
            onClick={() => setShowTutorial(!showTutorial)}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-800 transition-all text-sm cursor-pointer"
          >
            <HelpCircle size={18} className="text-blue-400 animate-pulse" /> 
            {showTutorial ? 'Ocultar Tutorial' : 'Como achar grupos?'}
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-blue-500/20 text-sm cursor-pointer"
          >
            <Plus size={18} /> Adicionar Grupo
          </button>
        </div>
      </div>

      {/* Tutorial Section */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20 border border-blue-900/40 rounded-3xl relative shadow-2xl space-y-6">
              {/* Decorative light */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-900/50 text-blue-400 text-[11px] font-black uppercase tracking-wider">
                    <Sparkles size={12} /> Hack de Prospecção
                  </span>
                  <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2 mt-1.5">
                    <BookOpen size={20} className="text-blue-500" /> Tutorial: Como Encontrar Grupos no Facebook e WhatsApp
                  </h2>
                  <p className="text-xs text-slate-400">
                    Siga este passo a passo estratégico para encontrar grupos de altíssima conversão e captar leads qualificados.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowTutorial(false)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  title="Ocultar Tutorial"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {/* Step 1 */}
                <div className="p-5 bg-slate-900/40 border border-slate-800/60 rounded-2xl relative space-y-3 hover:border-blue-900/30 transition-all">
                  <div className="absolute -top-3 -left-2 w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-blue-500/20">
                    01
                  </div>
                  <div className="text-slate-200 font-bold text-sm flex items-center gap-2 pt-1">
                    <Facebook size={16} className="text-blue-500" /> Acesse o Facebook
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Entre na sua conta do Facebook e clique na <strong className="text-slate-300">barra de pesquisa</strong> principal localizada no topo.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-5 bg-slate-900/40 border border-slate-800/60 rounded-2xl relative space-y-3 hover:border-blue-900/30 transition-all">
                  <div className="absolute -top-3 -left-2 w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-blue-500/20">
                    02
                  </div>
                  <div className="text-slate-200 font-bold text-sm flex items-center gap-2 pt-1">
                    <Search size={16} className="text-blue-400" /> Busque o Nicho
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pesquise o nicho dos grupos que você deseja prospectar. Por exemplo: digite <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[11px] font-mono text-blue-400 font-bold">"harmonizacao facial"</code>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-5 bg-slate-900/40 border border-slate-800/60 rounded-2xl relative space-y-3 hover:border-blue-900/30 transition-all">
                  <div className="absolute -top-3 -left-2 w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-blue-500/20">
                    03
                    {/* Arrow indicator for step flow */}
                  </div>
                  <div className="text-slate-200 font-bold text-sm flex items-center gap-2 pt-1">
                    <Compass size={16} className="text-amber-400" /> Filtre por Grupos
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Filtre os resultados selecionando a opção <strong className="text-slate-300">"Grupos"</strong> no menu lateral e clique em <strong className="text-slate-300">Entrar</strong> nos grupos mais engajados do nicho.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-5 bg-blue-950/20 border border-blue-900/30 rounded-2xl relative space-y-3 hover:border-blue-900/50 transition-all">
                  <div className="absolute -top-3 -left-2 w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-emerald-500/20">
                    04
                  </div>
                  <div className="text-slate-200 font-bold text-sm flex items-center gap-2 pt-1">
                    <MessageSquare size={16} className="text-emerald-400" /> Hack do WhatsApp
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dentro de qualquer grupo do Facebook, vá na <strong className="text-slate-300">barra de pesquisa interna do grupo</strong> e digite exatamente o seguinte comando:
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 font-bold">
                      chat.whatsapp.com
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('chat.whatsapp.com');
                        setCopiedTerm(true);
                        setTimeout(() => setCopiedTerm(false), 2000);
                      }}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Copiar comando de busca"
                    >
                      {copiedTerm ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Este comando puxará todos os posts que contém links diretos de grupos de WhatsApp compartilhados dentro do grupo do Facebook!
                  </p>
                </div>
              </div>

              {/* Call to action tip banner */}
              <div className="p-4 bg-blue-950/30 border border-blue-900/20 rounded-xl flex items-center gap-3 text-xs text-blue-300">
                <Lightbulb size={16} className="text-blue-400 shrink-0" />
                <span>
                  <strong>Dica Quente:</strong> Copie o termo de pesquisa acima, cole na busca do grupo e salve os novos grupos do WhatsApp mapeados na sua lista abaixo para iniciar sua prospecção ativa!
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { title: 'Total de Grupos', value: totalGroups, icon: Layers, color: 'text-blue-400 bg-blue-950/20 border-blue-900/30' },
          { title: 'Grupos Ativos', value: activeGroups, icon: Globe, color: 'text-amber-400 bg-amber-950/20 border-amber-900/30' },
          { title: 'Posts Programados', value: scheduledPosts, icon: FileText, color: 'text-purple-400 bg-purple-950/20 border-purple-900/30' },
          { title: 'Leads Gerados', value: totalLeads, icon: Users, color: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30' },
          { title: 'Vendas Originadas', value: `${totalSalesCount} (R$ ${totalSalesValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, icon: TrendingUp, color: 'text-violet-400 bg-violet-950/20 border-violet-900/30', colSpan: true }
        ].map((kpi, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={kpi.title} 
            className={`p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group ${kpi.colSpan ? 'lg:col-span-1' : ''}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <kpi.icon size={50} />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{kpi.title}</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-100 tracking-tight">{kpi.value}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters Section */}
      <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou nicho..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-xs transition-all text-slate-300 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Platform Filters */}
          <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs">
            {['All', 'Facebook', 'WhatsApp', 'Telegram', 'LinkedIn'].map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  selectedPlatform === plat 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {plat === 'All' ? 'Todas Redes' : plat}
              </button>
            ))}
          </div>

          {/* Status Dropdown Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl outline-none focus:border-blue-500/50"
          >
            <option value="All">Todos Status</option>
            <option value="Entrar">Entrar</option>
            <option value="Participando">Participando</option>
            <option value="Publicado">Publicado</option>
            <option value="Gerou Lead">Gerou Lead</option>
          </select>
        </div>
      </div>

      {/* Main Grid View / Groups Table */}
      <div className="bg-slate-900/20 border border-slate-800/60 rounded-[2rem] overflow-hidden shadow-2xl">
        {filteredGroups.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Layers className="mx-auto text-slate-600" size={40} />
            <p className="text-slate-400 font-bold text-sm">Nenhum grupo cadastrado ou localizado com estes filtros.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Cadastre novos grupos de networking para gerenciar as suas abordagens e captar leads qualificadíssimos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/30 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Nome do Grupo</th>
                  <th className="py-4 px-4">Plataforma</th>
                  <th className="py-4 px-4">Nicho</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-center">Leads</th>
                  <th className="py-4 px-4 text-center">Vendas</th>
                  <th className="py-4 px-4">Última Publicação</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
                {filteredGroups.map((group) => {
                  const platInfo = getPlatformDetails(group.platform);
                  const PlatIcon = platInfo.icon;
                  return (
                    <motion.tr 
                      layoutId={group.id}
                      key={group.id} 
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      <td className="py-4 px-6 font-bold text-slate-200">
                        <div className="flex flex-col">
                          <span>{group.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium truncate max-w-xs">{group.link}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${platInfo.color}`}>
                          <PlatIcon size={11} /> {group.platform}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-medium text-slate-400">
                          {group.niche}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusBadge(group.status)}`}>
                          {group.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold font-mono text-emerald-400">{group.leadsGenerated}</td>
                      <td className="py-4 px-4 text-center font-bold font-mono text-violet-400">{group.salesCount}</td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                        {group.lastPublishedAt ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-500" />
                            {new Date(group.lastPublishedAt).toLocaleDateString('pt-BR')} {new Date(group.lastPublishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          'Nunca'
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => window.open(group.link, '_blank')}
                            title="Abrir Link do Grupo"
                            className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg text-slate-400 cursor-pointer transition-all"
                          >
                            <ExternalLink size={13} />
                          </button>
                          <button
                            onClick={() => setActiveDrawerGroup(group)}
                            className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-900/30 hover:border-blue-500 text-blue-400 hover:text-white text-[11px] font-black rounded-lg cursor-pointer transition-all"
                          >
                            Visualizar & Configurar
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer Sidebar for Details and Post Setup */}
      <AnimatePresence>
        {activeDrawerGroup && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
              onClick={handleCloseDrawer}
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full md:w-[600px] bg-slate-950 border-l border-slate-800 z-50 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold ${getPlatformDetails(activeDrawerGroup.platform).color} mb-1`}>
                    {activeDrawerGroup.platform}
                  </span>
                  <h2 className="text-lg font-black text-slate-100 tracking-tight">{activeDrawerGroup.name}</h2>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Section: Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => window.open(activeDrawerGroup.link, '_blank')}
                    className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    <ExternalLink size={14} /> Abrir Grupo
                  </button>
                  <button
                    onClick={() => handleMarkAsPublished(activeDrawerGroup)}
                    disabled={activeDrawerGroup.status === 'Publicado'}
                    className={`flex items-center justify-center gap-2 py-2.5 font-bold rounded-xl text-xs transition-all cursor-pointer border ${
                      activeDrawerGroup.status === 'Publicado'
                        ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600/10 hover:bg-emerald-600 border-emerald-900/30 text-emerald-400 hover:text-white'
                    }`}
                  >
                    <Check size={14} /> {activeDrawerGroup.status === 'Publicado' ? 'Publicado Hoje' : 'Marcar Publicado'}
                  </button>
                </div>

                {/* Section: Programar Post (Manual Copy center) */}
                <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <FileText size={14} className="text-blue-500" /> Programar Post
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">Postagem Manual</span>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-slate-400">Texto do Post / Copywriting</label>
                    <textarea
                      rows={5}
                      value={activeDrawerGroup.postText || ''}
                      onChange={(e) => {
                        const updated = { ...activeDrawerGroup, postText: e.target.value };
                        setActiveDrawerGroup(updated);
                        onUpdateGroup(updated);
                      }}
                      placeholder="Insira aqui o texto/copy que deseja divulgar..."
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none focus:border-blue-500/50"
                    />
                    
                    {activeDrawerGroup.postText && (
                      <button
                        onClick={() => handleCopyToClipboard(activeDrawerGroup.postText || '', activeDrawerGroup.id)}
                        className={`w-full flex items-center justify-center gap-2 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          copiedId === activeDrawerGroup.id
                            ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {copiedId === activeDrawerGroup.id ? (
                          <>
                            <Check size={14} /> Texto Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copiar Texto do Post
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Media uploads inside group storage */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400">Imagem de Apoio</label>
                      {activeDrawerGroup.postImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950 flex items-center justify-center group">
                          <img src={activeDrawerGroup.postImage} alt="Post image template" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            onClick={() => handleRemoveMedia('postImage', activeDrawerGroup)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl aspect-video bg-slate-950 hover:bg-slate-900/50 cursor-pointer transition-all text-slate-500 hover:text-slate-300 text-[10px] space-y-1">
                          <ImageIcon size={18} />
                          <span>Selecionar Imagem</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleMediaUpload(e, 'postImage', activeDrawerGroup)}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400">Vídeo de Apoio</label>
                      {activeDrawerGroup.postVideo ? (
                        <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950 flex items-center justify-center group">
                          <video src={activeDrawerGroup.postVideo} controls className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleRemoveMedia('postVideo', activeDrawerGroup)}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl aspect-video bg-slate-950 hover:bg-slate-900/50 cursor-pointer transition-all text-slate-500 hover:text-slate-300 text-[10px] space-y-1">
                          <VideoIcon size={18} />
                          <span>Selecionar Vídeo</span>
                          <input 
                            type="file" 
                            accept="video/*" 
                            onChange={(e) => handleMediaUpload(e, 'postVideo', activeDrawerGroup)}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Controle de Resultados */}
                <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <TrendingUp size={14} className="text-emerald-500" /> Controle de Resultados
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400">Leads Gerados</label>
                      <input 
                        type="number" 
                        min="0"
                        value={activeDrawerGroup.leadsGenerated}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const updated = { ...activeDrawerGroup, leadsGenerated: val };
                          setActiveDrawerGroup(updated);
                          onUpdateGroup(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg outline-none focus:border-blue-500/50 font-mono"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400">Vendas</label>
                      <input 
                        type="number" 
                        min="0"
                        value={activeDrawerGroup.salesCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const updated = { ...activeDrawerGroup, salesCount: val };
                          setActiveDrawerGroup(updated);
                          onUpdateGroup(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg outline-none focus:border-blue-500/50 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400">Valor Vendido</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">R$</span>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          value={activeDrawerGroup.salesValue}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = { ...activeDrawerGroup, salesValue: val };
                            setActiveDrawerGroup(updated);
                            onUpdateGroup(updated);
                          }}
                          className="w-full pl-7 pr-2 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg outline-none focus:border-blue-500/50 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Group Configuration */}
                <div className="bg-slate-900/30 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Settings size={14} className="text-slate-400" /> Configuração Cadastral
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400">Nome do Grupo</label>
                      <input 
                        type="text" 
                        value={activeDrawerGroup.name}
                        onChange={(e) => {
                          const updated = { ...activeDrawerGroup, name: e.target.value };
                          setActiveDrawerGroup(updated);
                          onUpdateGroup(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400">Plataforma</label>
                      <select
                        value={activeDrawerGroup.platform}
                        onChange={(e) => {
                          const updated = { ...activeDrawerGroup, platform: e.target.value as any };
                          setActiveDrawerGroup(updated);
                          onUpdateGroup(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                      >
                        <option value="Facebook">Facebook</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Telegram">Telegram</option>
                        <option value="LinkedIn">LinkedIn</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400">Nicho do Grupo</label>
                      <input 
                        type="text" 
                        value={activeDrawerGroup.niche}
                        onChange={(e) => {
                          const updated = { ...activeDrawerGroup, niche: e.target.value };
                          setActiveDrawerGroup(updated);
                          onUpdateGroup(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400">Status Geral</label>
                      <select
                        value={activeDrawerGroup.status}
                        onChange={(e) => {
                          const updated = { ...activeDrawerGroup, status: e.target.value as any };
                          setActiveDrawerGroup(updated);
                          onUpdateGroup(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                      >
                        <option value="Entrar">Entrar</option>
                        <option value="Participando">Participando</option>
                        <option value="Publicado">Publicado</option>
                        <option value="Gerou Lead">Gerou Lead</option>
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400">Link do Grupo</label>
                      <input 
                        type="url" 
                        value={activeDrawerGroup.link}
                        onChange={(e) => {
                          const updated = { ...activeDrawerGroup, link: e.target.value };
                          setActiveDrawerGroup(updated);
                          onUpdateGroup(updated);
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                      />
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400">Observações Manuais (Dicas do Admin, Regras, etc.)</label>
                      <textarea 
                        rows={3}
                        value={activeDrawerGroup.notes || ''}
                        onChange={(e) => {
                          const updated = { ...activeDrawerGroup, notes: e.target.value };
                          setActiveDrawerGroup(updated);
                          onUpdateGroup(updated);
                        }}
                        placeholder="Ex: Grupo moderado, postagens devem ser autorizadas..."
                        className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Destructive Delete Area */}
                <div className="pt-4 border-t border-slate-900 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300">Excluir Grupo</h4>
                    <p className="text-[10px] text-slate-500">Esta ação é permanente e apagará todos os dados de faturamento do grupo.</p>
                  </div>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onDeleteGroup(activeDrawerGroup.id);
                          handleCloseDrawer();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Confirmar Exclusão
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-rose-600/10 hover:bg-rose-600 border border-rose-900/30 hover:border-rose-500 text-rose-400 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={13} /> Excluir Registro
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add New Group Dialog Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setIsAddModalOpen(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-slate-950 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden z-10 flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Plus size={18} className="text-blue-500" /> Adicionar Grupo de Networking
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="p-6 space-y-5">
                {addError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/30 text-rose-400 rounded-xl flex items-center gap-2 text-xs">
                    <AlertCircle size={14} /> {addError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400">Nome do Grupo <span className="text-blue-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Harmonização Facial Brasil"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400">Plataforma</label>
                    <select
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                    >
                      <option value="Facebook">Facebook</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Telegram">Telegram</option>
                      <option value="LinkedIn">LinkedIn</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400">Status Inicial</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                    >
                      <option value="Entrar">Entrar</option>
                      <option value="Participando">Participando</option>
                      <option value="Publicado">Publicado</option>
                      <option value="Gerou Lead">Gerou Lead</option>
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400">Nicho do Grupo <span className="text-blue-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Estética, Odontologia..."
                      value={newNiche}
                      onChange={(e) => setNewNiche(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {suggestedNiches.map(n => (
                        <button
                          type="button"
                          key={n}
                          onClick={() => setNewNiche(n)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-[9px] font-bold rounded-md transition-all cursor-pointer"
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400">Link de Acesso (URL) <span className="text-blue-500">*</span></label>
                    <input 
                      type="url" 
                      required
                      placeholder="Ex: https://facebook.com/groups/..."
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400">Observações Iniciais</label>
                    <textarea 
                      rows={2}
                      placeholder="Dicas extras sobre o grupo, restrições ou regras de postagem..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    Confirmar Cadastro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupsView;
