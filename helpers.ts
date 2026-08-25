/**
 * Normalizes phone numbers to standard Brazilian format: 55 + DDD (2 digits) + number (8 or 9 digits)
 */
export function normalizarTelefone(phone: string): string {
  if (!phone) return '';
  // Strip all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading 0 if present (e.g. 011999999999 -> 11999999999)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  
  // If it starts with 55 and has 12 or 13 digits, it is already complete
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    return cleaned;
  }
  
  // If length is 10 or 11 (e.g. 11999998888 or 1134445555), prepend 55
  if (cleaned.length === 10 || cleaned.length === 11) {
    return '55' + cleaned;
  }
  
  // If length is 8 or 9 (no DDD), we assume a fallback DDD of 11
  if (cleaned.length === 8 || cleaned.length === 9) {
    return '5511' + cleaned;
  }

  return cleaned;
}

/**
 * Classifies the phone number as 'whatsapp' or 'fixo'
 * Rule: After removing the country code (55) and DDD (2 digits), if the number
 * has 9 digits and starts with '9', it is 'whatsapp'. Otherwise, it is 'fixo'.
 */
export function detectarTipoContato(phone: string): 'whatsapp' | 'fixo' | 'desconhecido' {
  if (!phone || phone === 'não disponível') return 'desconhecido';
  const normalized = normalizarTelefone(phone);
  
  // Brazil: 55 (2 digits) + DDD (2 digits) + local number
  if (normalized.length >= 4) {
    const numberWithoutDDD = normalized.slice(4);
    if (numberWithoutDDD.length === 9 && numberWithoutDDD.startsWith('9')) {
      return 'whatsapp';
    }
  }
  return 'fixo';
}

/**
 * Detect gaps in business profiles to focus strategic approaches
 */
export function detectarGaps(lead: { website?: string; rating?: number | string; userRatingsTotal?: number | string }): string[] {
  const gaps: string[] = [];
  
  const hasNoWebsite = !lead.website || lead.website === 'não disponível' || lead.website.trim() === '';
  if (hasNoWebsite) {
    gaps.push('SEM_SITE');
  }
  
  const ratingNum = typeof lead.rating === 'string' ? parseFloat(lead.rating) : lead.rating;
  if (ratingNum && ratingNum < 4.2) {
    gaps.push('REPUTACAO_BAIXA');
  }
  
  const reviewsNum = typeof lead.userRatingsTotal === 'string' ? parseInt(lead.userRatingsTotal) : lead.userRatingsTotal;
  if (!reviewsNum || reviewsNum < 15) {
    gaps.push('FALTA_FUNIL');
  }
  
  return gaps;
}

export const SCORE_FACTORS = [
  { id: 'preco', label: 'Perguntou preço', points: 30 },
  { id: 'template', label: 'Solicitou template', points: 20 },
  { id: 'quick_reply', label: 'Respondeu em menos de 24h', points: 15 },
  { id: 'personalizacao', label: 'Perguntou sobre personalização', points: 20 },
  { id: 'responsavel', label: 'Foi encaminhado para o responsável', points: 25 },
  { id: 'briefing', label: 'Preencheu briefing', points: 100 },
  { id: 'orcamento', label: 'Solicitou orçamento', points: 40 },
];

export function calcularLeadScore(checkedFactors: string[] | undefined): { points: number; label: 'Muito Quente' | 'Quente' | 'Morno' | 'Frio'; color: string } {
  if (!checkedFactors || !Array.isArray(checkedFactors)) {
    return { points: 0, label: 'Frio', color: 'text-rose-400 border-rose-500/20 bg-rose-500/10' };
  }
  let total = 0;
  checkedFactors.forEach(factorId => {
    const f = SCORE_FACTORS.find(sf => sf.id === factorId);
    if (f) total += f.points;
  });

  if (total >= 80) {
    return { points: total, label: 'Muito Quente', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' };
  }
  if (total >= 50) {
    return { points: total, label: 'Quente', color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' };
  }
  if (total >= 20) {
    return { points: total, label: 'Morno', color: 'text-orange-400 border-orange-500/20 bg-orange-500/10' };
  }
  return { points: total, label: 'Frio', color: 'text-rose-400 border-rose-500/20 bg-rose-500/10' };
}

import { ProspectingCopy } from './types';

export const DEFAULT_PROSPECTING_COPIES: ProspectingCopy[] = [
  {
    id: 'copy-1a',
    name: 'Copy 1A - Suave com Oportunidade',
    content: `Olá, tudo bem? 😊\n\nVi o perfil da {nome} e gostei bastante do trabalho de vocês.\n\nEnquanto analisava a presença digital da empresa, percebi uma oportunidade que pode ajudar a fortalecer ainda mais a autoridade da marca na internet.\n\nPreparei um modelo demonstrativo para empresas desse segmento e posso enviar gratuitamente para vocês conhecerem, sem compromisso.\n\nGostariam que eu enviasse? 😊`,
    channel: 'WhatsApp',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-1b',
    name: 'Copy 1B - Suave Simples',
    content: `Olá! 😊\n\nConheci o perfil da {nome} e achei muito interessante o trabalho de vocês.\n\nTrabalho desenvolvendo Landing Pages personalizadas para empresas que desejam fortalecer sua presença digital.\n\nPreparei um modelo demonstrativo e posso enviar gratuitamente para vocês conhecerem.\n\nGostariam de receber?`,
    channel: 'WhatsApp',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-1c',
    name: 'Copy 1C - Suave Elegante',
    content: `Olá, tudo bem? 😊\n\nPassei pelo perfil da {nome} e gostei bastante da forma como vocês apresentam o trabalho.\n\nTrabalho criando Landing Pages modernas e preparei um modelo demonstrativo que acredito fazer bastante sentido para a empresa.\n\nGostaria de compartilhar com vocês, sem compromisso.\n\nPosso enviar?`,
    channel: 'WhatsApp',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-2a',
    name: 'Copy 2A - Agressiva com Urgência',
    content: `Olá, tudo bem? 🚀\n\nVi o perfil da {nome} no Google Maps e achei o negócio de vocês fantástico!\n\nSou especialista em posicionamento digital e criação de sites de alta conversão para negócios locais.\n\nNotei que vocês ainda não possuem um site profissional ou Landing Page otimizada para celular.\n\nSei que o mercado é competitivo, e ter uma Landing Page profissional é o caminho mais rápido para transformar visitantes em clientes reais.\n\nGostaria de receber um template visual 100% gratuito de como seria um site moderno e exclusivo para o seu nicho?\n\nFico no aguardo! 😊`,
    channel: 'WhatsApp',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-2b',
    name: 'Copy 2B - Agressiva Qualidade',
    content: `Olá! 🚀\n\nConheci a {nome} e percebi que vocês já transmitem bastante qualidade.\n\nAcredito que uma Landing Page profissional ajudaria a reforçar ainda mais essa autoridade e facilitar o contato de novos clientes.\n\nSou especialista em sites de alta conversão e tenho um modelo demonstrativo que preparei.\n\nGostaria de compartilhar com vocês?`,
    channel: 'WhatsApp',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-2c',
    name: 'Copy 2C - Agressiva Consultoria',
    content: `Olá, tudo bem? 🚀\n\nAnalisei rapidamente a presença digital da {nome} e identifiquei algumas oportunidades que podem fortalecer bastante a marca.\n\nAlém disso, preparei um modelo demonstrativo de Landing Page que acredito combinar bastante com a empresa.\n\nPosso enviar para vocês conhecerem?`,
    channel: 'WhatsApp',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-1',
    name: 'Apresentação de Site (WhatsApp)',
    content: 'Olá, tudo bem? 😊\n\nVi o perfil da *{nome}* no Google Maps e gostei bastante do trabalho de vocês.\n\nEnquanto analisava a presença digital da empresa, percebi uma oportunidade que pode ajudar a fortalecer ainda mais a autoridade da marca na internet.\n\nNotei que vocês ainda não possuem um site profissional ou uma Landing Page exclusiva para apresentar os serviços, facilitar o contato e transmitir mais credibilidade para novos clientes.\n\nTrabalho desenvolvendo Landing Pages e sites personalizados para o nicho de {nicho}, sempre com foco em performance, experiência no celular e conversão.\n\nInclusive, preparei um modelo demonstrativo para empresas de {cidade} e posso enviar gratuitamente para vocês conhecerem, sem compromisso.\n\nGostariam que eu enviasse? 😊',
    channel: 'WhatsApp',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-2',
    name: 'Primeiro Contato (Google Maps)',
    content: 'Olá! Notei a sua empresa *{nome}* no Google Maps. Vi que vocês oferecem um excelente trabalho como {nicho}, mas que ainda não possuem um site otimizado na sua ficha de busca.\n\nUm site profissional ou Landing Page de alta performance ajudaria muito a captar novos clientes na região de {cidade}.\n\nDesenvolvo estruturas completas focadas em conversão. Gostaria de ver um modelo de site demonstrativo sem custos para seu segmento? 🚀',
    channel: 'Google Maps',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-3',
    name: 'Abordagem de Site (Instagram)',
    content: 'Olá, tudo bem? 😊\n\nVi o perfil da *{nome}* no Instagram e gostei bastante do trabalho de vocês.\n\nEnquanto analisava a presença digital da empresa, percebi uma oportunidade que pode ajudar a fortalecer ainda mais a autoridade da marca na internet.\n\nNotei que vocês ainda não possuem um site profissional ou uma Landing Page exclusiva para apresentar os serviços, facilitar o contato e transmitir mais credibilidade para novos clientes.\n\nTrabalho desenvolvendo Landing Pages e sites personalizados para o mercado de {nicho}, sempre com foco em performance, experiência no celular e conversão.\n\nInclusive, preparei um modelo demonstrativo para empresas desse segmento em {cidade} e posso enviar gratuitamente para vocês conhecerem, sem compromisso.\n\nGostariam que eu enviasse? 😊',
    channel: 'Instagram',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-4',
    name: 'Oportunidade Comercial (Facebook)',
    content: 'Olá, tudo bem? 😊\n\nVi o perfil da *{nome}* no Facebook e gostei bastante do trabalho de vocês.\n\nEnquanto analisava a presença digital da empresa, percebi uma oportunidade que pode ajudar a fortalecer ainda mais a autoridade da marca na internet.\n\nNotei que vocês ainda não possuem um site profissional ou uma Landing Page exclusiva para apresentar os serviços, facilitar o contato e transmitir mais credibilidade para novos clientes.\n\nTrabalho desenvolvendo Landing Pages e sites personalizados para o nicho de {nicho} em {cidade}, sempre com foco em performance, experiência no celular e conversão.\n\nGostariam que eu enviasse uma amostra sem qualquer custo? 😊',
    channel: 'Facebook',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  },
  {
    id: 'copy-5',
    name: 'Parceria de Negócios (LinkedIn)',
    content: 'Olá! 🚀\n\nEncontrei o perfil da *{nome}* no LinkedIn e achei excelente a atuação de vocês no mercado de {nicho}.\n\nSou especialista em atração de clientes qualificados e conversão digital para negócios na região de {cidade}.\n\nAnalisando a presença online da empresa, identifiquei oportunidades excelentes de aceleração e fechamento de vendas.\n\nMontei um estudo rápido de 3 estratégias imediatas para destacar sua marca online. Gostaria de receber de forma gratuita por aqui?\n\nFico à disposição! 😊',
    channel: 'LinkedIn',
    status: 'Ativa',
    sendCount: 0,
    responseCount: 0
  }
];

