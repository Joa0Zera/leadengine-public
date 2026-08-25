import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Sparkles, 
  Code2, 
  Send, 
  Zap, 
  Globe, 
  FileCode,
  Layers
} from 'lucide-react';

export const CLAUDE_CODE_PROMPT_TEXT = `GERADOR DE LANDING PAGE CUSTOMIZADA - NEVION

OBJETIVO:
Criar um gerador automático que, a partir de dados da empresa, 
cria uma Landing Page profissional, customizada e pronta para usar em 5 minutos.

====================================================

INPUTS QUE JOÃO VAI PASSAR:

1. Nome da Empresa: {nome_empresa}
2. Tipo de Serviço: {tipo_servico} (ex: Harmonização Facial, Psicologia, E-commerce)
3. Nome do Proprietário: {nome_proprietario}
4. Telefone/WhatsApp: {whatsapp}
5. Cidade: {cidade}
6. Descrição curta (1-2 linhas): {descricao}
7. URL da foto do proprietário: {foto_proprietario}
8. URL foto da clínica/loja: {foto_empresa}
9. Instagram (opcional): {instagram}
10. Cor principal (hex): {cor_principal} (padrão: #4B0082)

====================================================

ESTRUTURA DA PÁGINA:

**HERO (Topo)**
- Foto de fundo (foto_empresa)
- Overlay semi-transparente com cor_principal
- Título grande: "{nome_empresa}"
- Subtítulo: "{descricao}"
- CTA Grande: "Agendar Agora" (leva para WhatsApp)

**SOBRE**
- Foto do proprietário (lado esquerdo)
- Texto apresentação (lado direito)
- "Sobre {nome_proprietario}"
- 3-4 linhas de bênção genérica mas relevante ao tipo

**SERVIÇOS**
- 3-4 cards mostrando o que faz
- Ícones simples
- Descrição curta

**DEPOIMENTOS (Social Proof)**
- Mostrar 2-3 depoimentos genéricos mas relevantes ao tipo
- Estrelas de rating

**CTA FINAL**
- "Agende seu atendimento"
- Botão grande com WhatsApp

**RODAPÉ**
- Links de contato
- Instagram
- Cidade

====================================================

DESIGN REQUIREMENTS:

Paleta de Cores:
- Primária: {cor_principal}
- Secundária: #FFFFFF
- Texto: #1A1A1A
- Destaque: #C084FC

Tipografia:
- Títulos: font-size 32-48px, bold
- Texto corpo: 16px, regular
- CTA: 16px, bold, uppercase

Responsividade:
- Mobile first
- Imagens redimensionam automaticamente
- Botões touch-friendly (min 48px)

Design Philosophy:
- Minimalista
- Premium
- Profissional
- Foco em conversão

====================================================

FUNCIONALIDADE:

1. BOTÃO WHATSAPP:
   - Link: https://wa.me/55{whatsapp}?text=Olá%20{nome_proprietario}%20vi%20seu%20site%20e%20gostaria%20de%20agendar
   - Abre WhatsApp automaticamente

2. IMAGENS:
   - Se foto_proprietario não existir, mostrar ícone genérico
   - Se foto_empresa não existir, mostrar cor degradê

3. SOCIAL:
   - Se instagram existe, adicionar botão instagram
   - Se não, esconder

4. ANIMAÇÕES:
   - Fade-in suave ao carregar
   - Hover nos botões (escurece a cor)
   - Scroll reveal nos cards

====================================================

EXEMPLO DE DADOS QUE JOÃO VAI PASSAR:

{
  "nome_empresa": "Dra. Yasmin Afonso - Harmonização Facial",
  "tipo_servico": "Harmonização Facial",
  "nome_proprietario": "Dra. Yasmin Afonso",
  "whatsapp": "11998765432",
  "cidade": "São Paulo",
  "descricao": "Harmonização facial com técnicas modernas e seguras",
  "foto_proprietario": "https://link-foto-dra.jpg",
  "foto_empresa": "https://link-clinica.jpg",
  "instagram": "@dra.yasmin.afonso",
  "cor_principal": "#7B2FBE"
}

====================================================

RESULTADO ESPERADO:

Uma página única HTML (com CSS inline) que:
✅ Carrega em 1 segundo
✅ Responsiva (mobile + desktop)
✅ Pronta para enviar ao cliente
✅ Customizada com dados dele
✅ Com CTA direto para WhatsApp
✅ Design premium (nível Nevion)
✅ Sem dependências externas (HTML puro)

====================================================

FLUXO DE USO:

1. João dispara o prompt com os dados
2. Claude Code gera HTML completo
3. Claude Code faz deploy automático no Vercel
4. Retorna link: https://seu-site-customizado.vercel.app
5. João copia link e envia para cliente no WhatsApp

====================================================

MODELO HTML BASE (estrutura):

<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{nome_empresa}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1A1A1A;
    }
    
    /* HERO */
    .hero {
      height: 100vh;
      background: linear-gradient(135deg, {cor_principal} 0%, rgba(75, 0, 130, 0.8) 100%),
                  url('{foto_empresa}') center/cover;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: white;
      animation: fadeIn 0.8s ease-in;
    }
    
    .hero h1 {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .hero p {
      font-size: 24px;
      margin-bottom: 40px;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
    }
    
    .cta-btn {
      padding: 16px 40px;
      font-size: 18px;
      background-color: #C084FC;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }
    
    .cta-btn:hover {
      background-color: {cor_principal};
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    }
    
    /* SOBRE */
    .about {
      padding: 80px 20px;
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: center;
    }
    
    .about img {
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }
    
    .about h2 {
      font-size: 32px;
      margin-bottom: 20px;
      color: {cor_principal};
    }
    
    .about p {
      font-size: 16px;
      line-height: 1.8;
      color: #555;
      margin-bottom: 20px;
    }
    
    /* SERVIÇOS */
    .services {
      padding: 80px 20px;
      background: #f9f9f9;
    }
    
    .services h2 {
      font-size: 32px;
      text-align: center;
      margin-bottom: 60px;
      color: {cor_principal};
    }
    
    .service-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .card {
      background: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }
    
    .card h3 {
      color: {cor_principal};
      margin-bottom: 15px;
    }
    
    /* ANIMATIONS */
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    /* RESPONSIVE */
    @media (max-width: 768px) {
      .about {
        grid-template-columns: 1fr;
      }
      
      .hero h1 {
        font-size: 32px;
      }
      
      .hero p {
        font-size: 18px;
      }
    }
  </style>
</head>
<body>

  <!-- HERO -->
  <section class="hero">
    <div>
      <h1>{nome_empresa}</h1>
      <p>{descricao}</p>
      <a href="https://wa.me/55{whatsapp}?text=Olá%20{nome_proprietario}%20vi%20seu%20site" 
         class="cta-btn">
        🚀 Agendar Agora
      </a>
    </div>
  </section>

  <!-- SOBRE -->
  <section class="about">
    <img src="{foto_proprietario}" alt="{nome_proprietario}">
    <div>
      <h2>Sobre {nome_proprietario}</h2>
      <p>Profissional especializado em {tipo_servico} com anos de experiência.</p>
      <p>Oferecemos atendimento de qualidade, sempre com foco em resultados e satisfação do cliente.</p>
      <a href="https://wa.me/55{whatsapp}?text=Olá%20{nome_proprietario}%20vi%20seu%20site" 
         class="cta-btn">
        Solicitar Atendimento
      </a>
    </div>
  </section>

  <!-- SERVIÇOS -->
  <section class="services">
    <h2>Nossos Serviços</h2>
    <div class="service-cards">
      <div class="card">
        <h3>✨ Serviço 1</h3>
        <p>Descrição do serviço principal oferecido.</p>
      </div>
      <div class="card">
        <h3>⭐ Serviço 2</h3>
        <p>Segundo serviço em destaque.</p>
      </div>
      <div class="card">
        <h3>💎 Serviço 3</h3>
        <p>Terceiro serviço complementar.</p>
      </div>
    </div>
  </section>

  <!-- CTA FINAL -->
  <section style="padding: 80px 20px; background: {cor_principal}; text-align: center; color: white;">
    <h2>Pronto para começar?</h2>
    <p style="margin: 20px 0; font-size: 18px;">Entre em contato e agende seu atendimento!</p>
    <a href="https://wa.me/55{whatsapp}?text=Olá%20{nome_proprietario}%20gostaria%20de%20agendar%20um%20atendimento" 
       class="cta-btn" style="background-color: #C084FC;">
       📱 Falar no WhatsApp
    </a>
  </section>

</body>
</html>

====================================================

PRÓXIMO PASSO:

Quando João passar os dados + esse prompt para o Claude Code, 
ele vai gerar a página em segundos, fazer deploy automático, 
e retornar um link pronto para enviar!`;

const PromptClaudeCodeView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick customizer inputs for fast copy-paste if João wants to pre-populate parameters!
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [tiposervico, setTipoServico] = useState('');
  const [nomeProprietario, setNomeProprietario] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cidade, setCidade] = useState('');

  const handleCopyPrompt = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setToastMessage('Prompt do Claude Code copiado com sucesso para a área de transferência!');
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
    }, 3000);
  };

  // Generate populated prompt if fields are entered
  const getCustomizedPrompt = () => {
    let custom = CLAUDE_CODE_PROMPT_TEXT;
    if (nomeEmpresa) custom = custom.replace(/\{nome_empresa\}/g, nomeEmpresa);
    if (tiposervico) custom = custom.replace(/\{tipo_servico\}/g, tiposervico);
    if (nomeProprietario) custom = custom.replace(/\{nome_proprietario\}/g, nomeProprietario);
    if (whatsapp) custom = custom.replace(/\{whatsapp\}/g, whatsapp);
    if (cidade) custom = custom.replace(/\{cidade\}/g, cidade);
    return custom;
  };

  const currentPromptText = getCustomizedPrompt();

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] text-[#f8fafc] min-h-screen font-sans relative">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/40 animate-bounce">
          <Check size={18} />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={12} className="text-purple-400" />
              Nevion Landing Page Generator
            </span>
            <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-wider">
              Claude Code Fixed Prompt
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            PROMPT CLAUDE CODE
          </h1>
          <p className="text-slate-400 mt-1 font-medium text-xs">
            Gerador de Landing Page Customizada Nevion — Copie e cole este prompt no Claude Code para criar e publicar sites em minutos.
          </p>
        </div>

        <button
          onClick={() => handleCopyPrompt(currentPromptText)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-3.5 rounded-2xl transition-all shadow-xl shadow-purple-950/40 text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer border border-purple-400/30"
        >
          {copied ? <Check size={18} className="text-emerald-300" /> : <Copy size={18} />}
          {copied ? 'Prompt Copiado!' : 'Copiar Prompt Completo'}
        </button>
      </div>

      {/* Grid: Instructions + Fast Parameter Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step-by-step card */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            Como Usar com Claude Code
          </h3>
          <ol className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="bg-purple-950 text-purple-400 font-bold border border-purple-800/50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">1</span>
              <span>Clique no botão <strong className="text-white">"Copiar Prompt Completo"</strong> no topo da tela.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="bg-purple-950 text-purple-400 font-bold border border-purple-800/50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">2</span>
              <span>Cole no chat do <strong className="text-white">Claude Code</strong>.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="bg-purple-950 text-purple-400 font-bold border border-purple-800/50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">3</span>
              <span>Substitua os dados da empresa (ou preencha no formulário ao lado para auto-completar).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="bg-purple-950 text-purple-400 font-bold border border-purple-800/50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">4</span>
              <span>O Claude Code vai gerar o código HTML inline com CSS e realizar o deploy.</span>
            </li>
          </ol>
        </div>

        {/* Quick parameters filler */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              Preenchimento Rápido de Variáveis (Opcional)
            </h3>
            {(nomeEmpresa || tiposervico || nomeProprietario || whatsapp || cidade) && (
              <button
                onClick={() => {
                  setNomeEmpresa('');
                  setTipoServico('');
                  setNomeProprietario('');
                  setWhatsapp('');
                  setCidade('');
                }}
                className="text-[10px] text-slate-400 hover:text-white underline font-bold"
              >
                Limpar Campos
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input 
              type="text"
              placeholder="Nome da Empresa (ex: Clínica Sorriso)"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-medium"
            />
            <input 
              type="text"
              placeholder="Tipo de Serviço (ex: Odontologia)"
              value={tiposervico}
              onChange={(e) => setTipoServico(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-medium"
            />
            <input 
              type="text"
              placeholder="Nome Proprietário (ex: Dr. Lucas)"
              value={nomeProprietario}
              onChange={(e) => setNomeProprietario(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-medium"
            />
            <input 
              type="text"
              placeholder="WhatsApp (ex: 11999998888)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-medium"
            />
            <input 
              type="text"
              placeholder="Cidade (ex: Mogi das Cruzes)"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-medium"
            />
            <div className="flex items-center justify-end">
              <span className="text-[10px] text-slate-400 font-mono italic">Substitui no texto abaixo em tempo real</span>
            </div>
          </div>
        </div>

      </div>

      {/* Code Prompt Display Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
              <Code2 size={14} className="text-purple-400" />
              prompt-claude-code-nevion.txt
            </span>
          </div>

          <button
            onClick={() => handleCopyPrompt(currentPromptText)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        {/* Prompt content */}
        <pre className="p-6 text-xs font-mono text-purple-200/90 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-purple-900 selection:text-purple-100 max-h-[70vh] overflow-y-auto">
          {currentPromptText}
        </pre>
      </div>

    </div>
  );
};

export default PromptClaudeCodeView;
