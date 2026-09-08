# LeadEngine

CRM de prospecção próprio, construído para sustentar operações de outreach em escala sem levar bloqueio por spam no WhatsApp.

> **EN**: In-house prospecting CRM built to run outreach at scale while avoiding WhatsApp spam detection.

## O problema que resolve

Disparar a mesma mensagem centenas de vezes por dia é a forma mais rápida de ter um número bloqueado. O LeadEngine gerencia leads e mensagens de forma que cada disparo pareça humano e único, além de centralizar o pipeline de prospecção num só lugar.

## Funcionalidades

- **Pipeline de leads** com adição manual e busca por telefone (`GET /api/lead-by-phone`)
- **Upload de leads via CSV**, alimentado por scraping do Google Maps
- **Rotação de copy**: 6 variações otimizadas de mensagem (1A/1B/1C/2A/2B/2C) alternadas automaticamente por lead
- **Lógica de rotação diária** para distribuir o volume de disparos e reduzir o risco de bloqueio
- Rastreamento de taxa de resposta e conversão por lead

## Stack

- **React + Vite** (frontend)
- **Firebase** — Firestore como banco, com regras de segurança dedicadas (`firestore.rules`)
- **Gemini API** — usada no processamento/geração de conteúdo do CRM (`geminiService.ts`)
- Servidor Node (`server.ts`) para as rotas de API

## Status

Em uso ativo, com desenvolvimento contínuo — últimas entregas incluem adição manual de lead no pipeline e busca de lead por telefone.
