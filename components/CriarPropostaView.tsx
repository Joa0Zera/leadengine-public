import React, { useState } from 'react';
import { 
  Instagram, 
  Facebook, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  UserPlus, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Lead, AppSection } from '../types';

interface CriarPropostaViewProps {
  onImportLeads: (leads: Lead[]) => void;
  onNavigate: (section: AppSection) => void;
}

const CriarPropostaView: React.FC<CriarPropostaViewProps> = ({ onImportLeads, onNavigate }) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'Instagram' | 'Facebook'>('Instagram');
  const [context, setContext] = useState('');
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedToCRM, setSavedToCRM] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!name.trim()) {
      setError('Por favor, digite o nome da pessoa ou o nome da conta.');
      return;
    }
    if (!context.trim()) {
      setError('Por favor, digite o contexto de interação do lead.');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedProposal('');
    setSavedToCRM(false);

    try {
      const response = await fetch('/api/leads/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          platform,
          context: context.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao obter resposta do servidor.');
      }

      const data = await response.json();
      setGeneratedProposal(data.text || '');
    } catch (err: any) {
      console.error('Erro ao gerar proposta:', err);
      setError('Ocorreu um erro ao gerar a proposta. Certifique-se de que a chave de API está ativa e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedProposal) return;
    navigator.clipboard.writeText(generatedProposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToCRM = () => {
    if (!name.trim()) return;

    // Build a manual lead item to register in CRM
    const newLead: Lead = {
      id: 'manual-' + Date.now(),
      name: name.trim(),
      category: 'Prospecção Manual',
      secondaryCategories: [],
      address: `Interação via ${platform}`,
      city: 'Manual / Redes Sociais',
      phone: 'não disponível',
      website: 'não disponível',
      rating: 'N/A',
      userRatingsTotal: 0,
      businessStatus: 'OPERATIONAL',
      mapsUrl: platform === 'Instagram' ? 'https://instagram.com' : 'https://facebook.com',
      latitude: 0,
      longitude: 0,
      collectedAt: new Date().toISOString(),
      status: 'NOVO',
      tags: ['MANUAL', platform.toUpperCase()],
      normalizedPhone: '',
      phoneType: 'desconhecido',
      gaps: ['SEM_SITE'],
      origem: platform,
      instagram: platform === 'Instagram' ? (name.startsWith('@') ? name : `@${name}`) : undefined,
      facebook: platform === 'Facebook' ? name : undefined,
      description: context.trim()
    };

    onImportLeads([newLead]);
    setSavedToCRM(true);
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] text-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <Sparkles className="text-blue-400 w-8 h-8 animate-pulse" />
            Criar Proposta Individual
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Gere uma abordagem de alta performance e personalizada pela IA para leads de interações manuais no Instagram ou Facebook.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Card: Input Form */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-8 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            {/* 1. Platform Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 tracking-wider uppercase">
                1. Rede Social de Origem
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPlatform('Instagram')}
                  className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer border ${
                    platform === 'Instagram'
                      ? 'bg-pink-600/10 border-pink-500 text-pink-400 shadow-lg shadow-pink-950/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Instagram size={18} />
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('Facebook')}
                  className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer border ${
                    platform === 'Facebook'
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-950/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Facebook size={18} />
                  Facebook
                </button>
              </div>
            </div>

            {/* 2. Lead Identifier */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 tracking-wider uppercase">
                2. Nome do Lead ou Nome da Conta
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-4 pr-10 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-sans text-sm"
                  placeholder={platform === 'Instagram' ? 'Ex: marcelo ou @marcelo_negocios' : 'Ex: Marcelo Silva'}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>
            </div>

            {/* 3. Context */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 tracking-wider uppercase flex justify-between">
                <span>3. Contexto da Interação para a IA</span>
                <span className="text-[10px] text-blue-400 lowercase italic">Dê detalhes da interação</span>
              </label>
              <textarea
                className="w-full min-h-[160px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-sans text-sm resize-none"
                placeholder="Ex: Comentou que tinha a intenção de fazer um site para seu negócio no post de uma agência digital parceira."
                value={context}
                onChange={(e) => {
                  setContext(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>

            {/* Quick Suggestions for Context */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sugestões Rápidas de Contexto:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setContext('Comentou que tinha a intenção de fazer um site para seu negócio no site de uma agência digital')}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  💬 Intenção de Site
                </button>
                <button
                  type="button"
                  onClick={() => setContext('Curtiu a postagem sobre otimização de tráfego pago para dentistas e perguntou como funciona')}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  🦷 Tráfego para Clínicas
                </button>
                <button
                  type="button"
                  onClick={() => setContext('Respondeu aos stories elogiando o design de uma landing page e demonstrou interesse em modernizar a dele')}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  🎨 Feedback nos Stories
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/30 border border-rose-900/40 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2 mt-4">
              <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-6">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 disabled:text-blue-400 text-white font-extrabold text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-950/30 active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gerando Abordagem Perfeita...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Proposta com IA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Card: Result & Mobile Preview */}
        <div className="space-y-6 flex flex-col justify-between">
          {generatedProposal ? (
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-xl flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${platform === 'Instagram' ? 'bg-pink-600/10 text-pink-400' : 'bg-blue-600/10 text-blue-400'}`}>
                      {platform === 'Instagram' ? <Instagram size={18} /> : <Facebook size={18} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-200 text-sm">Abordagem Gerada</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Copiável para envio direto no DM</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Simulated DM UI */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-sans text-sm relative min-h-[220px] flex flex-col justify-end">
                  {/* Mock Chat Header */}
                  <div className="absolute top-0 left-0 right-0 h-11 bg-slate-900/40 border-b border-slate-850 rounded-t-2xl flex items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${platform === 'Instagram' ? 'bg-pink-500' : 'bg-blue-500'}`}></div>
                      <span className="font-bold text-xs text-slate-300 font-mono">@{name || 'lead'}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{platform} DM</span>
                  </div>

                  {/* Message Bubble */}
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-start">
                      <div className="bg-slate-900 text-slate-400 rounded-2xl px-4 py-2.5 max-w-[85%] text-xs leading-relaxed border border-slate-850">
                        💬 Informação recebida no post.
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className={`rounded-2xl px-4 py-3 max-w-[90%] text-xs leading-relaxed text-white shadow-md ${
                        platform === 'Instagram' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                          : 'bg-blue-600'
                      }`}>
                        <div className="whitespace-pre-wrap font-sans font-medium">{generatedProposal}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-6">
                <button
                  onClick={handleSaveToCRM}
                  disabled={savedToCRM}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                    savedToCRM
                      ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <UserPlus size={16} />
                  {savedToCRM ? 'Cadastrado no CRM com Sucesso!' : 'Cadastrar como Lead no CRM'}
                </button>

                <button
                  onClick={() => onNavigate(AppSection.LEADS)}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg shadow-blue-950/20"
                >
                  <MessageSquare size={16} />
                  Ir para Lista de Leads
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-xl flex-1 flex flex-col justify-center items-center text-center space-y-4 min-h-[350px]">
              <div className="bg-slate-950 p-4 rounded-full border border-slate-800 text-slate-600">
                <Send className="w-10 h-10 stroke-[1.5]" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-bold text-slate-300">Aguardando geração da proposta</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Insira o nome do lead e descreva o contexto da interação ao lado, em seguida clique em "Gerar Proposta" para obter uma abordagem sob medida criada pela nossa IA de conversão.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CriarPropostaView;
