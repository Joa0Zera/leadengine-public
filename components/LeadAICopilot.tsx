import React, { useState, useEffect } from 'react';
import { Lead, ClosingStatus } from '../types';
import { calcularLeadScore } from '../helpers';
import { 
  Flame, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Save, 
  Check, 
  AlertTriangle,
  BrainCircuit,
  CornerDownRight,
  Send
} from 'lucide-react';

interface Props {
  lead: Lead;
  onUpdateLead: (updatedLead: Lead) => void;
}

const LeadAICopilot: React.FC<Props> = ({ lead, onUpdateLead }) => {
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [memoryText, setMemoryText] = useState<string>((lead as any).aiMemory || '');
  const [isSavingMemory, setIsSavingMemory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isCopiedText, setIsCopiedText] = useState<boolean>(false);

  // Sync memoryText when lead changes
  useEffect(() => {
    setMemoryText((lead as any).aiMemory || '');
    setSummary('');
  }, [lead.id]);

  // Extract score points
  const scoreInfo = calcularLeadScore(lead.checkedScoreFactors);
  const scorePoints = scoreInfo.points;

  // 1. Calculate smart Probability of Closing (Chance de Fechamento)
  const calculateClosingProbability = (): { percent: number; label: string; color: string; barColor: string } => {
    if (lead.status === 'PERDIDO' || lead.optOut) {
      return { percent: 5, label: 'Muito Baixa 🔴', color: 'text-rose-400', barColor: 'bg-rose-500' };
    }
    if (lead.status === 'FECHADO' || lead.closingStatus === 'FECHADO') {
      return { percent: 100, label: 'Muito Alta 🟢', color: 'text-emerald-400', barColor: 'bg-emerald-500' };
    }

    let basePercent = 10;
    
    // Add based on score points
    basePercent += Math.min(scorePoints * 0.6, 50);

    // Add based on Closing Status pipeline stage
    const stage = lead.closingStatus || 'INTERESSADO';
    if (stage === 'NEGOCIACAO') basePercent += 20;
    else if (stage === 'BRIEFING_RECEBIDO') basePercent += 15;
    else if (stage === 'BRIEFING_ENVIADO') basePercent += 10;
    else if (stage === 'TEMPLATE_ENVIADO' || stage === 'CRIATIVO_1_ENVIADO') basePercent += 5;
    else if (stage === 'PROJETO_EM_DESENVOLVIMENTO' || stage === 'PROJETO_ENTREGUE') basePercent += 25;

    // Adjust based on notes indicating budget or decision
    const notesLower = (lead.notes || '').toLowerCase();
    if (notesLower.includes('preco') || notesLower.includes('preço') || notesLower.includes('orçamento') || notesLower.includes('gostou')) {
      basePercent += 10;
    }
    if (notesLower.includes('fechar') || notesLower.includes('contrato')) {
      basePercent += 10;
    }

    // Caps & Floors
    const finalPercent = Math.min(Math.max(Math.round(basePercent), 8), 98);

    if (finalPercent >= 80) {
      return { percent: finalPercent, label: 'Muito Alta 🟢', color: 'text-emerald-400', barColor: 'bg-emerald-500' };
    } else if (finalPercent >= 55) {
      return { percent: finalPercent, label: 'Alta 🟢', color: 'text-emerald-400', barColor: 'bg-emerald-400' };
    } else if (finalPercent >= 35) {
      return { percent: finalPercent, label: 'Média 🟡', color: 'text-yellow-400', barColor: 'bg-yellow-500' };
    } else if (finalPercent >= 15) {
      return { percent: finalPercent, label: 'Baixa 🟠', color: 'text-orange-400', barColor: 'bg-orange-500' };
    } else {
      return { percent: finalPercent, label: 'Muito Baixa 🔴', color: 'text-rose-400', barColor: 'bg-rose-500' };
    }
  };

  const prob = calculateClosingProbability();

  // 2. Automatically select principal objection
  const selectPrincipalObjection = (): string => {
    if (lead.status === 'PERDIDO') return "Não respondeu ou perdeu interesse.";
    
    const notesLower = (lead.notes || '').toLowerCase();
    const stage = lead.closingStatus || 'INTERESSADO';

    if (stage === 'TEMPLATE_ENVIADO' || stage === 'CRIATIVO_1_ENVIADO' || stage === 'CRIATIVO_2_ENVIADO') {
      return "Não respondeu após receber o template.";
    }
    if (stage === 'BRIEFING_ENVIADO') {
      return "Está aguardando aprovação do responsável.";
    }
    if (notesLower.includes('caro') || notesLower.includes('preço') || notesLower.includes('preco') || notesLower.includes('orcamento') || notesLower.includes('orçamento')) {
      if (stage !== 'FECHADO') {
        return "Perguntou preço mas não avançou.";
      }
    }
    if (lead.status === 'DEMONSTROU_INTERESSE' && stage === 'INTERESSADO') {
      return "Demonstrou interesse porém está sem urgência.";
    }
    if (lead.status === 'CONTATADO' && !lead.notes) {
      return "Ainda não percebeu o valor da Landing Page.";
    }

    return "Não identificada.";
  };

  const objection = selectPrincipalObjection();

  // 3. Recommended single action, reason & pre-filled messages
  const getActionAndMessage = (): { action: string; reason: string; message: string } => {
    const stage = lead.closingStatus || 'INTERESSADO';
    const nameFirst = lead.name.split(' ')[0];
    const categoryName = (lead.category || 'Empresa').toLowerCase();

    if (stage === 'INTERESSADO' || lead.status === 'NOVO') {
      return {
        action: '📩 Enviar Template',
        reason: 'O lead acabou de entrar em contato ou foi prospectado. Demonstrar um modelo visual do nicho é ideal.',
        message: `Olá, tudo bem? 😊\n\nVi o perfil da *${lead.name}* no Google Maps e gostei bastante do trabalho de vocês.\n\nEnquanto analisava a presença digital da empresa, percebi uma oportunidade que pode ajudar a fortalecer ainda mais a autoridade da marca na internet.\n\nNotei que vocês ainda não possuem um site profissional ou uma Landing Page exclusiva para apresentar os serviços, facilitar o contato e transmitir mais credibilidade para novos clientes.\n\nTrabalho desenvolvendo Landing Pages e sites personalizados para negócios locais, sempre com foco em performance, experiência no celular e conversão.\n\nInclusive, preparei um modelo demonstrativo para empresas desse segmento e posso enviar gratuitamente para vocês conhecerem, sem compromisso.\n\nGostariam que eu enviasse? 😊`
      };
    }
    if (stage === 'TEMPLATE_ENVIADO') {
      return {
        action: '📩 Enviar Criativo 1',
        reason: 'O lead recebeu o template visual básico. Apresentar o primeiro exemplo focado em conversão reaquece a proposta.',
        message: `Olá ${nameFirst}! Conseguiu dar uma olhada no template de site que te enviei? Preparei um criativo visual rápido mostrando como ficaria no celular. Me diz se faz sentido darmos esse próximo passo para impulsionar suas vendas!`
      };
    }
    if (stage === 'CRIATIVO_1_ENVIADO') {
      return {
        action: '📩 Enviar Criativo 2',
        reason: 'O lead recebeu o Criativo 1. O próximo passo ideal para nutrir o interesse é o Criativo 2 destacando depoimentos de clientes.',
        message: `Oi ${nameFirst}, passando pra compartilhar esse modelo rápido de depoimentos de clientes que integramos na Landing Page. Isso aumenta em até 3x a credibilidade de quem entra no seu site. O que achou?`
      };
    }
    if (stage === 'CRIATIVO_2_ENVIADO' || stage === 'CRIATIVO_3_ENVIADO') {
      return {
        action: '☎ Fazer Follow-up',
        reason: 'O lead recebeu múltiplos criativos e ainda não avançou. Um follow-up direto e amigável reativa a negociação.',
        message: `Olá ${nameFirst}! Tudo bem? Gostaria de saber se ficou alguma dúvida sobre o design do site ou sobre como as Landing Pages estruturadas ajudam a faturar mais. Se quiser, podemos agendar um papo rápido de 5 minutinhos!`
      };
    }
    if (stage === 'FOLLOW_UP') {
      return {
        action: '📩 Enviar Briefing',
        reason: 'O lead já validou os criativos. Agora é a hora de coletar as especificações enviando o formulário de briefing.',
        message: `Excelente, ${nameFirst}! Para que possamos desenhar a estrutura exata do seu negócio, precisamos de algumas informações simples. Você pode preencher esse briefing rápido de 5 minutos aqui? Assim iniciamos o layout personalizado: [Inserir Link do Briefing]`
      };
    }
    if (stage === 'BRIEFING_ENVIADO') {
      return {
        action: '☎ Fazer Follow-up',
        reason: 'O link do briefing foi enviado há alguns dias. Cobrar o preenchimento de forma amigável ajudará a avançar.',
        message: `Olá ${nameFirst}! Passando para ver se conseguiu preencher o nosso briefing rápido de design para iniciarmos o projeto. Se tiver alguma dúvida ou precisar de ajuda para preencher juntos, me avise!`
      };
    }
    if (stage === 'BRIEFING_RECEBIDO') {
      return {
        action: '📄 Enviar Proposta',
        reason: 'O briefing técnico já foi preenchido e recebido. O próximo passo lógico é formalizar a proposta de design e desenvolvimento da Landing Page.',
        message: `Olá ${nameFirst}! Analisei o seu briefing e elaborei a proposta de desenvolvimento sob medida para a sua empresa de ${categoryName}. Segue em anexo a proposta comercial detalhada com prazos e formas de pagamento flexíveis!`
      };
    }
    if (stage === 'NEGOCIACAO') {
      return {
        action: '💰 Apresentar condição especial',
        reason: 'O lead se encontra em estágio avançado de negociação. Apresentar uma proposta com bônus de hospedagem ou desconto facilitará o fechamento imediato.',
        message: `Olá ${nameFirst}! Conversei com meu sócio sobre o seu projeto e conseguimos liberar um bônus especial para fecharmos ainda esta semana: Hospedagem e Suporte gratuitos por 3 meses inteiros. O que acha de iniciarmos o desenvolvimento hoje?`
      };
    }
    if (stage === 'PROJETO_EM_DESENVOLVIMENTO' || stage === 'PROJETO_ENTREGUE') {
      return {
        action: '☎ Fazer Follow-up',
        reason: 'Acompanhar o projeto em desenvolvimento ou oferecer manutenção/upsell de tráfego pago.',
        message: `Olá ${nameFirst}! Tudo bem? Nosso time já finalizou os ajustes de otimização mobile do seu site. Gostaria de alinhar os detalhes de lançamento e também te apresentar nossa estratégia ativa de tráfego pago para atrair clientes hoje mesmo?`
      };
    }

    return {
      action: '☎ Fazer Follow-up',
      reason: 'Revisar o histórico do lead para reatar contatos de prospecção e manter o funil de vendas ativo.',
      message: `Olá ${nameFirst}, tudo bem? Faz algum tempo que não conversamos. Gostaria de saber como estão as vendas da sua empresa e se podemos ajudar a turbinar seus resultados comerciais este mês!`
    };
  };

  const { action, reason, message } = getActionAndMessage();

  // 4. Alerts calculation
  const getAlerts = (): string[] => {
    const alerts: string[] = [];
    const today = new Date();
    const collected = lead.collectedAt ? new Date(lead.collectedAt) : new Date();
    
    // Check elapsed days since prospected
    const diffTime = Math.abs(today.getTime() - collected.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (lead.status !== 'FECHADO' && lead.status !== 'PERDIDO') {
      if (diffDays >= 7 && (!lead.lastInteraction || diffDays >= 7)) {
        alerts.push(`⚠ Este lead está há ${diffDays} dias sem contato.`);
      }
      if (lead.closingStatus === 'BRIEFING_ENVIADO') {
        alerts.push(`⚠ O briefing foi enviado há 4 dias.`);
      }
      if (scorePoints >= 60 && !lead.followUpDate) {
        alerts.push(`⚠ Lead quente sem follow-up agendado.`);
      }
    }

    return alerts;
  };

  const activeAlerts = getAlerts();

  // 5. Run real-time server-side summary calling /api/leads/summarize
  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await fetch('/api/leads/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead })
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      } else {
        // Fallback rule-based summary
        throw new Error("Erro na resposta do backend");
      }
    } catch (e) {
      // Elegant rule-based fallback summary (deterministic)
      const niche = lead.category || "negócio local";
      const place = lead.city || "região local";
      const statusStr = lead.status === 'DEMONSTROU_INTERESSE' ? "Demonstrou interesse comercial ativo." : "Prospectado recentemente.";
      const tempStr = scorePoints >= 80 ? "Muito Quente" : scorePoints >= 40 ? "Morno" : "Frio";
      
      setSummary(
        `${lead.name} no segmento de ${niche} em ${place}.\n` +
        `${statusStr} Estágio atual do funil: ${lead.closingStatus || "A abordagem inicial"}.\n` +
        `Score comercial ativo em ${scorePoints} pontos.\n` +
        `Status de objeção: ${objection}\n` +
        `Lead classificado como de temperatura ${tempStr}.`
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  // 6. Memory of the negotiation saving
  const handleSaveMemory = () => {
    setIsSavingMemory(true);
    const updatedLead: Lead = {
      ...lead,
      // Save memory directly into custom metadata
      ...{ aiMemory: memoryText }
    } as any;

    onUpdateLead(updatedLead);
    setTimeout(() => {
      setIsSavingMemory(false);
    }, 600);
  };

  // 7. Copy suggested message text
  const handleCopyText = () => {
    navigator.clipboard.writeText(message);
    setIsCopiedText(true);
    setTimeout(() => setIsCopiedText(false), 2000);
  };

  // 8. Single click [ Executar ] action - Open WhatsApp with text
  const handleExecuteAction = () => {
    if (!lead.phone || lead.phone === 'não disponível') {
      // Just copy the text if phone is not available
      handleCopyText();
      return;
    }
    const phoneDigits = lead.phone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits;
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`, '_blank');
    
    // Auto add a timeline entry about execution
    const updatedHistory = [...(lead.whatsappContactHistory || [])];
    updatedHistory.push(new Date().toISOString());

    const updatedLead: Lead = {
      ...lead,
      whatsappContactHistory: updatedHistory,
      timeline: [
        {
          id: 'action-exec-' + Date.now(),
          date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          title: `Ação Executada: ${action}`,
          description: `Abordagem enviada automaticamente via Copiloto de IA para o WhatsApp.`
        },
        ...(lead.timeline || [])
      ]
    };
    onUpdateLead(updatedLead);
  };

  return (
    <div id="sales-ai-copilot-card" className="bg-slate-900 border border-blue-900/40 rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden">
      
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-blue-400" />
          <div>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center gap-1">
              IA Comercial <span className="text-[9px] font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-900/30">Copiloto</span>
            </h3>
            <p className="text-[9px] text-slate-400 font-medium">Recomendações e análises inteligentes em tempo real</p>
          </div>
        </div>
      </div>

      {/* Alertas Ativos */}
      {activeAlerts.length > 0 && (
        <div className="space-y-1.5">
          {activeAlerts.map((alertText, index) => (
            <div key={index} className="p-2 bg-rose-950/20 border border-rose-900/30 text-rose-300 text-[10px] rounded-xl flex items-center gap-2 font-bold">
              <AlertTriangle size={11} className="text-rose-400 shrink-0" />
              <span>{alertText}</span>
            </div>
          ))}
        </div>
      )}

      {/* Grid: Chance de Fechamento + Principal Objeção */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Chance de Fechamento */}
        <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl space-y-2">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Chance de Fechamento</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-black ${prob.color}`}>{prob.percent}%</span>
            <span className="text-[9px] font-extrabold uppercase text-slate-300">{prob.label.split(' ')[0]}</span>
          </div>
          {/* Progress Bar slider */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${prob.barColor}`} style={{ width: `${prob.percent}%` }} />
          </div>
        </div>

        {/* Principal Objeção */}
        <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl space-y-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Objeção Provável</span>
          <p className="text-xs font-black text-amber-400 leading-snug line-clamp-2">{objection}</p>
        </div>

      </div>

      {/* Próxima Ação Recomendada */}
      <div className="bg-gradient-to-br from-blue-950/30 to-slate-900/50 border border-blue-900/20 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
            <Flame size={12} className="text-blue-400" /> Próxima Ação recomendada
          </span>
          <button
            type="button"
            id="send-whatsapp-btn"
            onClick={handleExecuteAction}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <Send size={10} fill="currentColor" /> Executar
          </button>
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-100 tracking-tight">{action}</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal italic">
            "{reason}"
          </p>
        </div>

        {/* Suggested Messages Box with Quick Copy */}
        <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2 relative">
          <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">Sugestão de Mensagem</span>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[8px] font-bold"
              title="Copiar mensagem"
            >
              {isCopiedText ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
              {isCopiedText ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <p data-template="venda-de-site" className="text-[10px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto pr-1">
            {message}
          </p>
        </div>
      </div>

      {/* Resumo Automático (Button and Output) */}
      <div className="bg-slate-950/45 border border-slate-850 p-4 rounded-2xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Resumo comercial</span>
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={loadingSummary}
            className="bg-slate-900 hover:bg-slate-850 text-blue-400 border border-slate-800 text-[9px] font-black px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles size={10} className="text-blue-400" />
            {loadingSummary ? 'Analisando...' : '✨ Resumir Lead'}
          </button>
        </div>

        {summary ? (
          <div className="p-3 bg-slate-950 border border-blue-950 rounded-xl">
            <p className="text-[10px] text-slate-200 leading-relaxed font-medium whitespace-pre-line">
              {summary}
            </p>
          </div>
        ) : (
          <p className="text-[9px] text-slate-500 italic">Clique no botão acima para consolidar os pontos chaves do lead com IA.</p>
        )}
      </div>

      {/* Memória da Negociação (Remembered points) */}
      <div className="bg-slate-950/45 border border-slate-850 p-4 rounded-2xl space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">🧠 Memória da Negociação</label>
          <button
            type="button"
            onClick={handleSaveMemory}
            disabled={isSavingMemory}
            className="text-blue-400 hover:text-blue-300 font-black text-[9px] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            {isSavingMemory ? <Check size={10} className="text-emerald-400" /> : <Save size={10} />}
            {isSavingMemory ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
        <textarea
          value={memoryText}
          onChange={(e) => setMemoryText(e.target.value)}
          placeholder="Ex: Cliente informou que decidiria após conversar com a sócia, ou solicitou retorno na próxima semana."
          className="w-full h-12 bg-slate-950 border border-slate-850/80 rounded-xl p-2.5 text-[10px] text-slate-200 outline-none focus:border-blue-500/50 resize-none leading-normal font-sans"
        />
      </div>

    </div>
  );
};

export default LeadAICopilot;
