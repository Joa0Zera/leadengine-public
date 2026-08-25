import React, { useState } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const SdrAgentView: React.FC = () => {
  const [conversation, setConversation] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (textToUse?: string) => {
    const text = textToUse !== undefined ? textToUse : conversation;
    if (!text.trim()) {
      setError('Por favor, cole alguma conversa ou mensagem do lead antes de gerar.');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedReply('');

    try {
      const response = await fetch('/api/sdr/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationText: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao obter resposta do Agente SDR.');
      }

      const data = await response.json();
      setGeneratedReply(data.text || '');
    } catch (err: any) {
      console.error('Erro ao gerar mensagem:', err);
      setError('Ocorreu um erro ao gerar a resposta. Verifique a chave de API ou tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedReply) return;
    navigator.clipboard.writeText(generatedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setConversation('');
    setGeneratedReply('');
    setError(null);
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] text-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <Sparkles className="text-emerald-400 w-8 h-8 animate-pulse" />
            Agente SDR Inteligente
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Gere a melhor resposta personalizada para enviar no WhatsApp e fechar negócios locais sem armazenar nada.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input & Objective Selection */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-2 flex-1 flex flex-col">
            <label className="block text-sm font-extrabold text-slate-200 tracking-wide uppercase">
              1. Cole a Conversa com o Lead
            </label>
            <textarea
              className="w-full flex-1 min-h-[380px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-sans text-sm resize-none"
              placeholder="Cole aqui o histórico de mensagens do WhatsApp, a mensagem recebida, ou a resposta do lead. Ao colar, o Agente SDR inteligente irá analisar e gerar a melhor resposta de forma 100% automática!"
              value={conversation}
              onChange={(e) => {
                setConversation(e.target.value);
                if (error) setError(null);
              }}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData('text');
                if (pastedText && pastedText.trim()) {
                  setConversation(pastedText);
                  handleGenerate(pastedText);
                }
              }}
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/30 text-rose-300 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              onClick={() => handleGenerate()}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-850 disabled:text-emerald-500 text-white font-extrabold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/20 active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analisando e Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Próxima Mensagem
                </>
              )}
            </button>

            {(conversation || generatedReply) && (
              <button
                onClick={handleClear}
                title="Limpar campos"
                className="p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Output Suggestion */}
        <div className="flex flex-col">
          {generatedReply ? (
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Resposta Gerada para Copiar
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded font-black uppercase">
                    WhatsApp Pronto
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-200 font-sans text-sm whitespace-pre-wrap leading-relaxed relative min-h-[300px]">
                  {generatedReply}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center gap-2 font-extrabold text-sm py-3 px-6 rounded-xl transition-all cursor-pointer shadow-lg active:scale-98 ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-100 hover:bg-white text-slate-950'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado para o Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Mensagem
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleClear}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs py-3 px-5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} />
                  Limpar Conversa
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8 space-y-4">
              <div className="p-4 rounded-full bg-slate-950 border border-slate-800 text-slate-700">
                <MessageSquare size={36} />
              </div>
              <div className="max-w-sm space-y-2">
                <h3 className="font-extrabold text-slate-300 text-base">Nenhuma resposta gerada</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Insira ou cole o texto da conversa com o lead à esquerda para que o Agente SDR inteligente analise e gere a melhor resposta automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SdrAgentView;
