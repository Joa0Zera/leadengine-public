import { Lead } from "./types";

/**
 * MÓDULO DE CAPTAÇÃO: Busca leads REAIS no Google Maps com Alta Densidade chamando o backend
 */
export async function fetchLeadsFromGoogleMaps(niche: string, city: string, radius: number): Promise<Lead[]> {
  try {
    const response = await fetch("/api/leads/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ niche, city, radius }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Erro na busca de alta densidade via API:", error);
    return [];
  }
}

/**
 * MÓDULO 1 & 2: Inteligência e Detecção de Oportunidades chamando o backend
 */
export async function analyzeLeadProfessional(lead: Lead): Promise<Lead['score']> {
  try {
    const response = await fetch("/api/leads/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lead }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Erro na análise via API:", error);
    return { grade: 'C', temperature: 'MORNO', reason: "Falha na análise", opportunities: [], potentialValue: 0 };
  }
}

/**
 * MÓDULO DE EXPANSÃO: Sugere nichos correlatos com base nos leads atuais chamando o backend
 */
export async function suggestMarketExpansion(currentLeads: Lead[]): Promise<string[]> {
  try {
    const response = await fetch("/api/leads/suggest-expansion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentLeads }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Erro na sugestão de expansão via API:", error);
    return [];
  }
}

/**
 * MÓDULO DE PRÓXIMA AÇÃO: Sugere a melhor ação comercial chamando o backend
 */
export async function suggestNextAction(lead: Lead): Promise<string> {
  try {
    const response = await fetch("/api/leads/suggest-action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lead }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.text || "Contatar via WhatsApp.";
  } catch (error) {
    console.error("Erro na sugestão de próxima ação via API:", error);
    return "Contatar via WhatsApp.";
  }
}
