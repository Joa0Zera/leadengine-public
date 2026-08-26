console.log("[1] Server.ts carregado");

import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, GroundingLink } from "./types";
import { dbFindLeadByPhone } from "./firebase";

// Catch-all safety net for server process errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("[SERVER UNHANDLED REJECTION] at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[SERVER UNCAUGHT EXCEPTION]:", error);
});

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function generateContentWithRetry(
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  retries = 3,
  delayMs = 1000
): Promise<any> {
  const modelsToTry = [params.model];
  if (params.model !== "gemini-3.1-flash-lite") {
    modelsToTry.push("gemini-3.1-flash-lite");
  }
  if (params.model !== "gemini-flash-lite-latest" && params.model !== "gemini-3.1-flash-lite") {
    modelsToTry.push("gemini-flash-lite-latest");
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`[GEMINI API] Attempt ${attempt} failed for model "${model}":`, error.message || error);
        
        const errorMessage = (error.message || "").toUpperCase();
        const errorStatus = error.status || (error.error && error.error.code);
        const isTransient = 
          errorStatus === 503 || 
          errorStatus === 429 || 
          errorStatus === 500 ||
          errorMessage.includes("503") ||
          errorMessage.includes("429") ||
          errorMessage.includes("UNAVAILABLE") ||
          errorMessage.includes("TEMPORARY") ||
          errorMessage.includes("HIGH DEMAND") ||
          errorMessage.includes("RATE_LIMIT") ||
          errorMessage.includes("RESOURCE_EXHAUSTED") ||
          errorMessage.includes("FETCH FAILED");

        if (isTransient && attempt < retries) {
          const waitTime = delayMs * Math.pow(1.5, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          break;
        }
      }
    }
  }

  throw lastError;
}

async function startServer() {
  try {
    const app = express();
    console.log("[2] Express criado");
    const PORT = Number(process.env.PORT) || 3000;

  // Set CORS headers for all requests
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    next();
  });

  // For parsing application/json
  app.use(express.json());

  // Health check endpoint for Cloud Run / load balancers
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Routes

  // GET /api/lead-by-phone?phone=+5585999999999
  app.get("/api/lead-by-phone", async (req, res) => {
    const phone = req.query.phone as string;

    if (!phone) {
      return res.status(400).json({ error: "Phone parameter is required" });
    }

    try {
      const lead = await dbFindLeadByPhone(phone);

      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({
        id: lead.id,
        name: lead.name || "",
        phone: lead.phone || phone,
        website: lead.website || "",
        address: lead.address || "",
        category: lead.category || "",
        description: lead.description || lead.biography || "",
        rating: lead.rating || 0,
        userRatingsTotal: lead.userRatingsTotal || 0,
        secondaryCategories: lead.secondaryCategories || []
      });
    } catch (error: any) {
      console.error("Erro ao buscar lead por telefone:", error);
      res.status(500).json({ error: error.message || "Erro interno ao buscar lead." });
    }
  });

  app.post("/api/leads/search", async (req, res) => {
    const { niche, city, radius } = req.body;
    
    const prompt = `AJA COMO UM DATA SCRAPER PROFISSIONAL B2B DE ALTA PERFORMANCE. 
    Sua missão é extrair uma lista MASSIVA de empresas reais (mínimo de 30 a 50 resultados) para o nicho "${niche}" na região de "${city}" e arredores em um raio de ${radius}km.
    
    PROCEDIMENTO DE BUSCA:
    1. Varra exaustivamente todos os bairros, polos industriais e centros comerciais dentro do raio de ${radius}km.
    2. Não pare nos primeiros resultados. Explore empresas de todos os tamanhos (pequenas, médias e grandes).
    3. Para cada empresa, extraia: nome oficial, categoria específica, endereço completo com cidade, telefone de contato público e website.
    4. Use "não disponível" APENAS se o dado realmente não existir no Google Maps.
    
    IMPORTANTE: Quero uma lista densa e útil para prospecção ativa. Priorize empresas com telefones válidos.
    
    Retorne um array JSON com: id, name, category, secondaryCategories (array), address, city, phone, website, rating, userRatingsTotal, businessStatus, mapsUrl, latitude, longitude.`;

    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          temperature: 0.1,
        },
      });

      const groundingLinks: GroundingLink[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      chunks.forEach((chunk: any) => {
        if (chunk.maps) {
          groundingLinks.push({
            uri: chunk.maps.uri,
            title: chunk.maps.title || "Google Maps Ref"
          });
        }
      });

      const rawText = response.text || "";

      // Estruturador otimizado para garantir que nenhum lead seja perdido na conversão para JSON
      const structurer = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",
        contents: `Extraia TODOS os leads citados no texto abaixo e converta para um JSON Array válido. 
        Não omita nenhum registro. Se houver 40 leads no texto, quero 40 no JSON.
        Texto: ${rawText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                secondaryCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
                address: { type: Type.STRING },
                city: { type: Type.STRING },
                phone: { type: Type.STRING },
                website: { type: Type.STRING },
                rating: { type: Type.STRING },
                userRatingsTotal: { type: Type.STRING },
                businessStatus: { type: Type.STRING },
                mapsUrl: { type: Type.STRING },
                latitude: { type: Type.NUMBER },
                longitude: { type: Type.NUMBER },
              },
              required: ["id", "name", "category", "address"]
            }
          }
        }
      });

      const parsed = JSON.parse(structurer.text || "[]");
      const leads: Lead[] = parsed.map((l: any) => ({
        ...l,
        status: 'NOVO' as const,
        tags: [],
        collectedAt: new Date().toISOString(),
        groundingLinks: groundingLinks
      }));

      res.json(leads);
    } catch (error: any) {
      console.error("Erro na busca de alta densidade:", error);
      if (error.message && error.message.includes("GEMINI_API_KEY")) {
        res.status(400).json({ error: "A chave de API GEMINI_API_KEY não foi configurada nas variáveis de ambiente do applet." });
      } else {
        res.status(500).json({ error: "Erro interno no servidor ao processar os leads." });
      }
    }
  });

  app.post("/api/leads/analyze", async (req, res) => {
    const { lead } = req.body;
    const prompt = `Analise tecnicamente o lead ${lead.name} para serviços de tráfego pago.
    Empresa: ${lead.name}
    Categoria: ${lead.category}
    Site: ${lead.website}
    Avaliações: ${lead.rating} (${lead.userRatingsTotal})
    
    Identifique oportunidades críticas (Ex: falta de site, site antigo, baixa reputação, alta concorrência no nicho).`;

    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              grade: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
              temperature: { type: Type.STRING, enum: ["QUENTE", "MORNO", "FRIO"] },
              reason: { type: Type.STRING },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              potentialValue: { type: Type.NUMBER }
            },
            required: ["grade", "temperature", "reason", "opportunities"]
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error: any) {
      console.error("Erro na análise do lead:", error);
      if (error.message && error.message.includes("GEMINI_API_KEY")) {
        res.status(400).json({ error: "A chave de API GEMINI_API_KEY não foi configurada." });
      } else {
        res.json({ grade: 'C', temperature: 'MORNO', reason: "Falha na análise", opportunities: [], potentialValue: 0 });
      }
    }
  });

  app.post("/api/leads/suggest-expansion", async (req, res) => {
    const { currentLeads } = req.body;
    const niches = [...new Set((currentLeads || []).map((l: any) => l.category))];
    const prompt = `Com base nestas categorias: ${niches.join(', ')}. Sugira 5 nichos correlatos de alta rentabilidade.`;
    
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      res.json(JSON.parse(response.text || "[]"));
    } catch (error: any) {
      console.error("Erro na sugestão de expansão:", error);
      res.json([]);
    }
  });

  app.post("/api/leads/suggest-action", async (req, res) => {
    const { lead } = req.body;
    const prompt = `Próxima melhor ação para ${lead.name} (${lead.status}).`;
    
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",
        contents: prompt
      });
      res.json({ text: response.text || "Contatar via WhatsApp." });
    } catch (error: any) {
      console.error("Erro na sugestão de próxima ação:", error);
      res.json({ text: "Contatar via WhatsApp." });
    }
  });

  app.post("/api/leads/summarize", async (req, res) => {
    const { lead } = req.body;
    if (!lead) {
      return res.status(400).json({ error: "Lead é obrigatório" });
    }

    const prompt = `Você é o Copiloto de Inteligência Comercial da Nevion.
    Sua tarefa é analisar o lead abaixo e criar um resumo de até 5 linhas no máximo, extremamente direto, limpo e humanizado.
    
    DADOS DO LEAD:
    - Empresa/Nome: ${lead.name}
    - Nicho/Categoria: ${lead.category || "Não especificado"}
    - Cidade/Local: ${lead.city || "Não especificado"}
    - Canal de Origem: ${lead.origem || "Não especificado"}
    - Status Comercial: ${lead.status}
    - Estágio de Fechamento: ${lead.closingStatus || "Não iniciado"}
    - Pontuação (Lead Score): ${lead.scorePoints || 0} pts
    - Observações/Histórico: ${lead.notes || "Sem observações adicionais."}
    
    FORMATO DO RESUMO (MÁXIMO 5 LINHAS):
    - Linha 1: Perfil do negócio e localidade (Ex: Clínica de Harmonização Facial em Belo Horizonte).
    - Linha 2-4: O que aconteceu até o momento (Ex: Recebeu o template. Perguntou sobre personalização e preço. Ainda não respondeu após o envio do orçamento).
    - Linha 5: Classificação de temperatura do lead (Ex: Lead considerado quente/morno/frio).
    
    Regra absoluta: Retorne APENAS o texto puro do resumo, sem cabeçalhos, sem asteriscos, sem formatação Markdown complexa. No máximo 5 linhas.`;

    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
        }
      });
      res.json({ summary: response.text || "Resumo indisponível no momento." });
    } catch (error: any) {
      console.error("Erro ao gerar resumo do lead:", error);
      res.status(500).json({ error: "Erro interno ao gerar resumo." });
    }
  });

  app.post("/api/sdr/generate-reply", async (req, res) => {
    const { conversationText } = req.body;
    
    if (!conversationText || !conversationText.trim()) {
      return res.status(400).json({ error: "O texto da conversa é obrigatório." });
    }

    const prompt = `Você é um SDR e Closer de Elite especializado em prospecção e fechamento de serviços de Criação de Sites de Alta Conversão, Landing Pages, e Tráfego Pago para Negócios Locais.
    
    Você deve seguir RIGOROSAMENTE o modelo e estilo de fluxo de conversação detalhado abaixo para guiar o lead pelo funil de vendas de forma altamente natural, amigável e persuasiva:

    ESTRUTURA DE FLUXO E MODELO DE ABORDAGEM:
    1. ABORDAGEM INICIAL (Gatilho de Curiosidade e Valor):
       - Identifique o perfil do lead (ex: Psicólogo, Dentista, Loja Física) e mencione de forma calorosa que viu o perfil deles no Google Maps em sua cidade e achou excelente.
       - Aponte uma melhoria imediata com sutileza: a falta de uma Landing Page ou site otimizado para celulares.
       - Ofereça uma isca digital irresistível: um template visual ou exemplo 100% gratuito e exclusivo para o nicho deles para eles darem uma olhada sem compromisso.
       - Exemplo de tom: "Gostaria de receber um template visual 100% gratuito de como seria um site moderno e exclusivo para o seu nicho?"

    2. APRESENTAÇÃO DO EXEMPLO (Aprovação de Interesse):
       - Se o lead aceitou ver o modelo, responda de forma muito positiva e direta, mostrando como aquilo gera autoridade e facilita agendamentos/vendas.
       - Apresente um link de exemplo de alta qualidade (como um link do Figma/site ou exemplo real).
       - Exemplo de tom: "Vou te mostrar esse exemplo pensando exatamente em passar mais autoridade e facilitar o agendamento de novos clientes/pacientes. https://port-vivid-03035256.figma.site/"

    3. EXPLICAÇÃO DO PROCESSO E ORÇAMENTO (Fechamento):
       - Quando o lead perguntar sobre valores, orçamento ou como funciona, responda exatamente neste formato super transparente, limpo e estruturado:
         * Diga o valor de investimento de forma direta (R$ 1.500,00) e explique que o custo do domínio é acessível e fica registrado no nome deles.
         * Divida o processo em passos simples e fáceis (usando marcadores em estrela/bullet points):
           - Envio de um briefing simples com perguntas rápidas (cores, especialidades, etc.).
           - Envio de fotos e materiais que eles desejam usar.
           - Desenvolvimento completo do layout, programação e implementação.
         * Prazo de entrega ágil (até 20 dias) com o site pronto para uso.
         * Enfatize o benefício principal (transmitir credibilidade, velocidade, otimização mobile e atração de pacientes/clientes).
         * Termine com uma CTA suave e direta: "Se você gostar da proposta, podemos começar ainda esta semana. 😊"

    DIRETRIZES PARA ESCREVER AS MENSAGENS NO WHATSAPP:
    1. Seja 100% humanizado, natural, empático e amigável. Nunca pareça um robô engessado.
    2. Use parágrafos curtos e espaçados. Mensagens longas são ignoradas.
    3. Use emojis de forma equilibrada e profissional para dar leveza e calor à conversa (ex: 😊, 🚀, 👍, etc.).
    4. NÃO use placeholders como "[Nome]" ou "[Empresa]" se conseguir deduzir esses dados do histórico. Caso contrário, use termos genéricos super amigáveis ou pergunte com polidez.
    5. Retorne APENAS o texto final pronto para copiar e enviar, sem introduções explicativas, notas explicativas ou tags extras.

    Analise a conversa abaixo com o lead, identifique o estágio atual dele no fluxo acima (Abordagem, Apresentação ou Fechamento) e gere a PRÓXIMA resposta perfeita seguindo exatamente esse padrão:
    
    Conversa atual com o lead:
    --------------------------------------
    ${conversationText}
    --------------------------------------`;
    
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",
        contents: prompt
      });
      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Erro no Agente SDR:", error);
      res.status(500).json({ error: "Erro interno ao gerar a resposta do Agente SDR." });
    }
  });

  app.post("/api/leads/generate-proposal", async (req, res) => {
    const { name, platform, context } = req.body;

    if (!name || !platform || !context) {
      return res.status(400).json({ error: "Nome, plataforma e contexto são obrigatórios." });
    }

    const prompt = `Você é um copywriter de elite especializado em prospecção ativa de negócios locais. 
    Sua tarefa é criar uma mensagem de abordagem fria e personalizada para um potencial cliente (lead) que interagiu em um post de rede social.

    Informações do lead:
    - Nome/Conta: ${name}
    - Plataforma de Origem: ${platform}
    - Contexto da Interação: ${context}

    Instruções de redação da mensagem:
    1. Tom de voz: Extremamente amigável, acolhedor, profissional e com linguagem humanizada natural de rede social (nunca pareça um bot de spam ou uma mensagem gerada por IA).
    2. Linguagem: Português do Brasil.
    3. Conecte de forma direta com o contexto (Ex: "Olá ${name}, vi seu comentário no post de ontem sobre..." ou "Olá ${name}, vi que você curtiu o post e demonstrou interesse em...").
    4. Proposta de valor: Ofereça a criação de um site profissional, landing page de alta conversão ou tráfego pago sob medida pela Nevion (ou de forma genérica se for o caso). Mencione benefícios práticos de forma leve (ex: "desenvolvemos o seu projeto e te entregamos em até 15 dias" ou "ideal para aumentar seus agendamentos").
    5. Formatação: Use parágrafos curtos, espaçados, boa escaneabilidade e emojis adequados de forma moderna e moderada (ex: 😊, 🚀, 👋, ✨).
    6. Chamada de ação (CTA): Finalize de forma leve e convidativa com uma pergunta amigável para abrir conversa (Ex: "Faria sentido batermos um papinho rápido sobre isso por aqui?" ou "Podemos conversar mais a respeito?").
    7. Restrição absoluta: Retorne APENAS o texto da mensagem final pronto para ser enviado. Não adicione cabeçalhos, introduções explicativas, aspas ao redor do texto todo ou notas de rodapé da IA. Comece diretamente com a saudação (ex: "Olá ${name}, tudo bem? ...").`;

    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 0.8,
        }
      });
      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Erro ao gerar proposta:", error);
      res.status(500).json({ error: "Erro interno ao gerar a proposta com a IA." });
    }
  });

  console.log("[3] Rotas registradas");

  console.log("[4] Ambiente detectado");
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist", "index.html"));

  // Vite middleware for development / serving files in production
  if (!isProduction) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { 
        middlewareMode: true,
        cors: true
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      } else {
        next();
      }
    });
  }
  console.log("[5] Arquivos estáticos configurados");

  console.log("[6] Chamando app.listen()");
  app.listen(PORT, "0.0.0.0", () => {
    console.log("[7] Servidor iniciado");
    console.log(`Server running on http://localhost:${PORT}`);
  });
  } catch (error: any) {
    console.error(error.stack);
  }
}

startServer();
