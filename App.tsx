import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Menu,
  Trello,
  Zap,
  Database,
  Folder,
  DollarSign,
  Sparkles,
  Send,
  MessageSquare,
  Layers,
  Terminal
} from 'lucide-react';
import { AppSection, Lead, SearchFilters, LeadStatus, SiteTemplate, FinancialProject, ProspectingCopy, LeadGroup } from './types';
import { analyzeLeadProfessional, fetchLeadsFromGoogleMaps } from './geminiService';
import { normalizarTelefone, detectarTipoContato, detectarGaps, DEFAULT_PROSPECTING_COPIES } from './helpers';
import DashboardView from './components/DashboardView';
import LeadsListView from './components/LeadsListView';
import PipelineView from './components/PipelineView';
import TemplatesView from './components/TemplatesView';
import CopiesLibraryView from './components/CopiesLibraryView';
import FinanceiroView from './components/FinanceiroView';
import SdrAgentView from './components/SdrAgentView';
import CriarPropostaView from './components/CriarPropostaView';
import GroupsView from './components/GroupsView';
import PromptClaudeCodeView from './components/PromptClaudeCodeView';
import {
  dbFetchLeads,
  dbSaveLead,
  dbDeleteLead,
  dbSaveAllLeads,
  dbFetchTemplates,
  dbSaveTemplate,
  dbDeleteTemplate,
  dbSaveAllTemplates,
  dbFetchProjects,
  dbSaveProject,
  dbDeleteProject,
  dbSaveAllProjects,
  dbClearAllLeads,
  dbFetchCopies,
  dbSaveCopy,
  dbDeleteCopy,
  dbSaveAllCopies,
  dbFetchGroups,
  dbSaveGroup,
  dbDeleteGroup,
  dbSaveAllGroups
} from './firebase';

// Safe storage wrapper to prevent iframe SecurityError crashes
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage access denied in iframe:", e);
      return (window as any).__fallback_storage?.[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage access denied in iframe:", e);
      if (!(window as any).__fallback_storage) {
        (window as any).__fallback_storage = {};
      }
      (window as any).__fallback_storage[key] = value;
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage access denied in iframe:", e);
      if ((window as any).__fallback_storage) {
        delete (window as any).__fallback_storage[key];
      }
    }
  }
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DASHBOARD);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [projects, setProjects] = useState<FinancialProject[]>([]);
  const [copies, setCopies] = useState<ProspectingCopy[]>([]);
  const [groups, setGroups] = useState<LeadGroup[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);

  const [isDbLoading, setIsDbLoading] = useState(true);

  // Load and seed database (Firestore primary, LocalStorage as fallback)
  useEffect(() => {
    async function loadDataFromDb() {
      try {
        setIsDbLoading(true);

        // 1. Fetch Projects
        let dbProjects = await dbFetchProjects();
        const projectsToFilter = ['Odonto Clínica Mogi', 'Fisio Vida Mogi', 'Estética Glow Mogi'];
        const projectsToDeleteFromDb = dbProjects.filter(p => projectsToFilter.includes(p.companyName));
        for (const prj of projectsToDeleteFromDb) {
          try {
            await dbDeleteProject(prj.id);
          } catch (e) {
            console.error("Erro ao deletar projeto pré-cadastrado do banco:", e);
          }
        }
        dbProjects = dbProjects.filter(p => !projectsToFilter.includes(p.companyName));
        setProjects(dbProjects);

        // 2. Fetch Templates
        let dbTemplates = await dbFetchTemplates();
        if (dbTemplates.length === 0) {
          const initialTemplates: SiteTemplate[] = [
            { id: 'tpl-1', niche: 'Dentista / Odontologia', url: 'https://odontoclinica-template.netlify.app', createdAt: new Date().toISOString() },
            { id: 'tpl-2', niche: 'Clínica de Fisioterapia', url: 'https://fisioativa-template.netlify.app', createdAt: new Date().toISOString() },
            { id: 'tpl-3', niche: 'Estética Avançada', url: 'https://esteticaglow-template.netlify.app', createdAt: new Date().toISOString() },
            { id: 'tpl-4', niche: 'Advocacia B2B', url: 'https://advogados-template.netlify.app', createdAt: new Date().toISOString() },
            { id: 'tpl-5', niche: 'Pet Shop / Veterinária', url: 'https://petfelix-template.netlify.app', createdAt: new Date().toISOString() }
          ];
          await dbSaveAllTemplates(initialTemplates);
          dbTemplates = initialTemplates;
        }
        setTemplates(dbTemplates);

        // 3. Fetch Leads
        let dbLeads = await dbFetchLeads();
        if (dbLeads.length === 0) {
          const initialSeed: Lead[] = [
            {
              id: 'lead-1',
              name: 'Clínica Sorriso Lindo Mogi',
              category: 'Dentista',
              secondaryCategories: ['Implantes Dentários', 'Ortodontia'],
              address: 'Av. Voluntário Fernando Pinheiro Franco, 320 - Centro',
              city: 'Mogi das Cruzes - SP',
              phone: '(11) 98888-7777',
              website: 'não disponível',
              rating: 3.8,
              userRatingsTotal: 8,
              businessStatus: 'OPERATIONAL',
              mapsUrl: 'https://maps.google.com',
              latitude: -23.5234,
              longitude: -46.1867,
              collectedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
              status: 'NOVO',
              tags: ['SDR_MINE', 'SEM_SITE'],
              normalizedPhone: '5511988887777',
              phoneType: 'whatsapp',
              gaps: ['SEM_SITE', 'REPUTACAO_BAIXA', 'FALTA_FUNIL'],
              score: {
                grade: 'A',
                temperature: 'QUENTE',
                reason: "Empresa de excelente localização em Mogi das Cruzes, porém totalmente desprovida de site próprio e com notas abaixo da média local, indicando necessidade iminente de tráfego pago e landing page.",
                opportunities: ["Desenvolver Landing Page", "Otimizar SEO Local (Google Meu Negócio)", "Automação de Reviews"],
                potentialValue: 1800
              }
            },
            {
              id: 'lead-2',
              name: 'Consultório Odonto Vale',
              category: 'Clínica Odontológica',
              secondaryCategories: [],
              address: 'R. Coronel Souza Franco, 1500 - Centro',
              city: 'Mogi das Cruzes - SP',
              phone: '(11) 3455-8899',
              website: 'http://odontovalemogi.com.br',
              rating: 4.8,
              userRatingsTotal: 42,
              businessStatus: 'OPERATIONAL',
              mapsUrl: 'https://maps.google.com',
              latitude: -23.5255,
              longitude: -46.1899,
              collectedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
              status: 'CONTATADO',
              tags: ['SDR_MINE'],
              normalizedPhone: '551134558899',
              phoneType: 'fixo',
              gaps: [],
              score: {
                grade: 'B',
                temperature: 'MORNO',
                reason: "Empresa possui site estruturado e boa reputação local. A maior oportunidade reside em implementar campanhas ativas de captação de clientes B2B via tráfego pago focado em procedimentos estéticos de alto valor.",
                opportunities: ["Estruturar Funil WhatsApp Ativo", "Campanhas Google Search Estética"],
                potentialValue: 1200
              }
            }
          ];
          await dbSaveAllLeads(initialSeed);
          dbLeads = initialSeed;
        }
        setLeads(dbLeads);

        // 4. Fetch Copies
        let dbCopies = await dbFetchCopies();
        if (dbCopies.length === 0) {
          await dbSaveAllCopies(DEFAULT_PROSPECTING_COPIES);
          dbCopies = DEFAULT_PROSPECTING_COPIES;
        } else {
          // Check if any default copies (such as Copy 1A - 2C) are missing and append them
          const missingCopies = DEFAULT_PROSPECTING_COPIES.filter(
            defCopy => !dbCopies.some(c => c.id === defCopy.id || c.name.toLowerCase() === defCopy.name.toLowerCase())
          );
          if (missingCopies.length > 0) {
            const mergedCopies = [...dbCopies, ...missingCopies];
            await dbSaveAllCopies(mergedCopies);
            dbCopies = mergedCopies;
          }
        }
        setCopies(dbCopies);

        // 5. Fetch Groups
        let dbGroups = await dbFetchGroups();
        const mockGroupNames = [
          'Harmonização Facial Brasil',
          'Dentistas de São Paulo & Região',
          'Psicólogos e Terapeutas do Brasil'
        ];
        const mockGroupIds = ['group-1', 'group-2', 'group-3'];

        const groupsToDelete = dbGroups.filter(g => 
          mockGroupIds.includes(g.id) || 
          mockGroupNames.includes(g.name)
        );

        if (groupsToDelete.length > 0) {
          dbGroups = dbGroups.filter(g => 
            !mockGroupIds.includes(g.id) && 
            !mockGroupNames.includes(g.name)
          );
          await dbSaveAllGroups(dbGroups);
          for (const g of groupsToDelete) {
            try {
              await dbDeleteGroup(g.id);
            } catch (e) {
              console.error("Erro ao deletar grupo mock individual", e);
            }
          }
        }
        if (dbGroups.length === 0) {
          const initialGroups: LeadGroup[] = [];
          await dbSaveAllGroups(initialGroups);
          dbGroups = initialGroups;
        }
        setGroups(dbGroups);

      } catch (err: any) {
        console.error("Falha ao inicializar banco de dados", err);
        setError("Erro ao se conectar ao banco de dados Firestore. Dados locais em cache sendo exibidos como alternativa.");
        
        // Local fallback
        const savedProjects = safeStorage.getItem('b2b_projects_financeiro');
        if (savedProjects) {
          try {
            const parsed = JSON.parse(savedProjects) as FinancialProject[];
            setProjects(parsed.filter(p => 
              p.companyName !== 'Odonto Clínica Mogi' && 
              p.companyName !== 'Fisio Vida Mogi' && 
              p.companyName !== 'Estética Glow Mogi'
            ));
          } catch (e) {}
        }
        const savedTemplates = safeStorage.getItem('b2b_site_templates_v2');
        if (savedTemplates) {
          try { setTemplates(JSON.parse(savedTemplates)); } catch(e){}
        }
        const savedLeads = safeStorage.getItem('b2b_leads_v2');
        if (savedLeads) {
          try { setLeads(JSON.parse(savedLeads)); } catch(e){}
        }
        const savedCopies = safeStorage.getItem('b2b_prospecting_copies');
        if (savedCopies) {
          try { setCopies(JSON.parse(savedCopies)); } catch(e){}
        }
        const savedGroups = safeStorage.getItem('b2b_lead_groups');
        if (savedGroups) {
          try { 
            const parsed = JSON.parse(savedGroups) as LeadGroup[];
            const mockNames = [
              'Harmonização Facial Brasil',
              'Dentistas de São Paulo & Região',
              'Psicólogos e Terapeutas do Brasil'
            ];
            const mockIds = ['group-1', 'group-2', 'group-3'];
            setGroups(parsed.filter(g => 
              !mockIds.includes(g.id) && 
              !mockNames.includes(g.name)
            ));
          } catch(e){}
        }
      } finally {
        setIsDbLoading(false);
      }
    }

    loadDataFromDb();
  }, []);

  // Sync state to LocalStorage for offline performance fallback
  useEffect(() => {
    if (leads) {
      safeStorage.setItem('b2b_leads_v2', JSON.stringify(leads));
    }
  }, [leads]);

  useEffect(() => {
    if (templates) {
      safeStorage.setItem('b2b_site_templates_v2', JSON.stringify(templates));
    }
  }, [templates]);

  useEffect(() => {
    if (projects) {
      safeStorage.setItem('b2b_projects_financeiro', JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (copies) {
      safeStorage.setItem('b2b_prospecting_copies', JSON.stringify(copies));
    }
  }, [copies]);

  useEffect(() => {
    if (groups) {
      safeStorage.setItem('b2b_lead_groups', JSON.stringify(groups));
    }
  }, [groups]);

  const handleAddProject = async (companyName: string, niche: string, value: number, url: string) => {
    const newProject: FinancialProject = {
      id: 'prj-' + Date.now(),
      companyName,
      niche,
      value,
      url,
      createdAt: new Date().toISOString()
    };
    try {
      await dbSaveProject(newProject);
    } catch (e) {
      console.error("Erro ao salvar projeto no banco", e);
    }
    setProjects(prev => [...prev, newProject]);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await dbDeleteProject(id);
    } catch (e) {
      console.error("Erro ao deletar projeto no banco", e);
    }
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleAddTemplate = async (niche: string, url: string) => {
    const newTemplate: SiteTemplate = {
      id: 'tpl-' + Date.now(),
      niche,
      url,
      createdAt: new Date().toISOString()
    };
    try {
      await dbSaveTemplate(newTemplate);
    } catch (e) {
      console.error("Erro ao salvar template no banco", e);
    }
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await dbDeleteTemplate(id);
    } catch (e) {
      console.error("Erro ao deletar template no banco", e);
    }
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleAddCopy = async (name: string, content: string, channel: 'Google Maps' | 'Instagram' | 'Facebook' | 'LinkedIn' | 'WhatsApp', status: 'Ativa' | 'Inativa') => {
    const newCopy: ProspectingCopy = {
      id: 'copy-' + Date.now(),
      name,
      content,
      channel,
      status,
      sendCount: 0,
      responseCount: 0
    };
    try {
      await dbSaveCopy(newCopy);
    } catch (e) {
      console.error("Erro ao salvar copy no banco", e);
    }
    setCopies(prev => [...prev, newCopy]);
  };

  const handleUpdateCopy = async (updatedCopy: ProspectingCopy) => {
    try {
      await dbSaveCopy(updatedCopy);
    } catch (e) {
      console.error("Erro ao atualizar copy no banco", e);
    }
    setCopies(prev => prev.map(c => c.id === updatedCopy.id ? updatedCopy : c));
  };

  const handleDeleteCopy = async (id: string) => {
    try {
      await dbDeleteCopy(id);
    } catch (e) {
      console.error("Erro ao deletar copy no banco", e);
    }
    setCopies(prev => prev.filter(c => c.id !== id));
  };

  const handleAddGroup = async (newGroup: LeadGroup) => {
    try {
      await dbSaveGroup(newGroup);
    } catch (e) {
      console.error("Erro ao salvar grupo no banco", e);
    }
    setGroups(prev => [...prev, newGroup]);
  };

  const handleUpdateGroup = async (updatedGroup: LeadGroup) => {
    try {
      await dbSaveGroup(updatedGroup);
    } catch (e) {
      console.error("Erro ao atualizar grupo no banco", e);
    }
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await dbDeleteGroup(groupId);
    } catch (e) {
      console.error("Erro ao deletar grupo no banco", e);
    }
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  // Google Maps captação triggers
  const handleSearch = async (filters: SearchFilters) => {
    setIsSearching(true);
    setError(null);
    try {
      const newLeads = await fetchLeadsFromGoogleMaps(filters.niche, filters.city, filters.radius);
      
      const filteredNew: Lead[] = [];
      setLeads(prev => {
        // Build Set of existing normalized phone numbers
        const existingPhones = new Set(prev.map(l => l.normalizedPhone || normalizarTelefone(l.phone)).filter(p => p !== ''));
        
        newLeads.forEach(l => {
          const finalPhone = l.phone || 'não disponível';
          const normalized = normalizarTelefone(finalPhone);
          const type = detectarTipoContato(finalPhone);
          const gaps = detectarGaps(l);
          
          const leadItem = {
            ...l,
            normalizedPhone: normalized,
            phoneType: type,
            gaps: gaps
          };
          
          if (!normalized || !existingPhones.has(normalized)) {
            filteredNew.push(leadItem);
          }
        });

        return [...prev, ...filteredNew];
      });

      if (filteredNew.length > 0) {
        await dbSaveAllLeads(filteredNew);
      }
      
      setActiveSection(AppSection.LEADS);
    } catch (err) {
      setError("Não foi possível estabelecer contato com o barramento do Google Maps. Tente novamente mais tarde.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    setLeads(prev => {
      const updated = prev.map(l => {
        if (l.id === leadId) {
          const history = [...(l.whatsappContactHistory || [])];
          if (status === 'CONTATADO') {
            const nowIso = new Date().toISOString();
            if (!history.some(ts => ts.startsWith(nowIso.split('T')[0]))) {
              history.push(nowIso);
            }
          }
          const newItem = { ...l, status, whatsappContactHistory: history };
          dbSaveLead(newItem).catch(e => console.error(e));
          return newItem;
        }
        return l;
      });
      return updated;
    });
  };

  const handleScoreLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    try {
      const score = await analyzeLeadProfessional(lead);
      setLeads(prev => {
        const updated = prev.map(l => {
          if (l.id === leadId) {
            const newItem = { ...l, score };
            dbSaveLead(newItem).catch(e => console.error(e));
            return newItem;
          }
          return l;
        });
        return updated;
      });
    } catch (e) {
      console.error("Falha ao analisar o lead", e);
    }
  };

  // Mapeadores e importação
  const handleImportLeads = async (newLeadsList: Lead[]) => {
    const existingPhones = new Set(leads.map(l => l.normalizedPhone || normalizarTelefone(l.phone)).filter(p => p !== ''));
    
    // Check for duplicate Instagram or Facebook profiles to avoid importing duplicates
    const existingInstagrams = new Set(
      leads.map(l => {
        if (!l.instagram) return '';
        return l.instagram.toLowerCase().trim().replace(/^@/, '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').replace(/\/$/, '');
      }).filter(i => i !== '')
    );
    const existingFacebooks = new Set(
      leads.map(l => {
        if (!l.facebook) return '';
        return l.facebook.toLowerCase().trim().replace('https://facebook.com/', '').replace('https://www.facebook.com/', '').replace(/\/$/, '');
      }).filter(f => f !== '')
    );

    const filtered: Lead[] = [];
    newLeadsList.forEach(l => {
      let isDuplicate = false;

      // 1. Phone check
      if (l.normalizedPhone) {
        if (existingPhones.has(l.normalizedPhone)) {
          isDuplicate = true;
        }
      }

      // 2. Instagram check
      if (!isDuplicate && l.instagram) {
        const cleanInsta = l.instagram.toLowerCase().trim().replace(/^@/, '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').replace(/\/$/, '');
        if (existingInstagrams.has(cleanInsta)) {
          isDuplicate = true;
        }
      }

      // 3. Facebook check
      if (!isDuplicate && l.facebook) {
        const cleanFace = l.facebook.toLowerCase().trim().replace('https://facebook.com/', '').replace('https://www.facebook.com/', '').replace(/\/$/, '');
        if (existingFacebooks.has(cleanFace)) {
          isDuplicate = true;
        }
      }

      if (!isDuplicate) {
        filtered.push(l);
        if (l.normalizedPhone) {
          existingPhones.add(l.normalizedPhone);
        }
        if (l.instagram) {
          const cleanInsta = l.instagram.toLowerCase().trim().replace(/^@/, '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '').replace(/\/$/, '');
          existingInstagrams.add(cleanInsta);
        }
        if (l.facebook) {
          const cleanFace = l.facebook.toLowerCase().trim().replace('https://facebook.com/', '').replace('https://www.facebook.com/', '').replace(/\/$/, '');
          existingFacebooks.add(cleanFace);
        }
      }
    });

    if (filtered.length > 0) {
      setLeads(prev => [...prev, ...filtered]);
      try {
        await dbSaveAllLeads(filtered);
      } catch (e) {
        console.error("Erro ao salvar leads importados no banco:", e);
      }
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await dbDeleteLead(leadId);
    } catch (e) {
      console.error(e);
    }
    setLeads(prev => prev.filter(l => l.id !== leadId));
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    let leadToSave = updatedLead;
    if (updatedLead.status === 'CONTATADO') {
      const history = [...(updatedLead.whatsappContactHistory || [])];
      const nowIso = new Date().toISOString();
      if (!history.some(ts => ts.startsWith(nowIso.split('T')[0]))) {
        history.push(nowIso);
        leadToSave = { ...updatedLead, whatsappContactHistory: history };
      }
    }
    try {
      await dbSaveLead(leadToSave);
    } catch (e) {
      console.error(e);
    }
    setLeads(prev => prev.map(l => l.id === leadToSave.id ? leadToSave : l));
  };

  const renderContent = () => {
    switch (activeSection) {
      case AppSection.DASHBOARD:
        return <DashboardView leads={leads} projects={projects} copies={copies} onNavigate={setActiveSection} onUpdateLead={handleUpdateLead} />;
      case AppSection.LEADS:
        return (
          <LeadsListView 
            leads={leads} 
            copies={copies}
            onUpdateCopy={handleUpdateCopy}
            onScore={handleScoreLead} 
            onUpdateStatus={handleUpdateLeadStatus} 
            onImportLeads={handleImportLeads}
            onDeleteLead={handleDeleteLead}
            onUpdateLead={handleUpdateLead}
          />
        );
      case AppSection.PIPELINE:
        return <PipelineView leads={leads} onUpdateStatus={handleUpdateLeadStatus} onUpdateLead={handleUpdateLead} />;
      case AppSection.CRIAR_PROPOSTA:
        return <CriarPropostaView onImportLeads={handleImportLeads} onNavigate={setActiveSection} />;
      case AppSection.SDR_AGENT:
        return <SdrAgentView />;
      case AppSection.TEMPLATES:
        return (
          <TemplatesView 
            templates={templates} 
            onAddTemplate={handleAddTemplate} 
            onDeleteTemplate={handleDeleteTemplate} 
          />
        );
      case AppSection.COPIES:
        return (
          <CopiesLibraryView 
            copies={copies} 
            onAddCopy={handleAddCopy} 
            onUpdateCopy={handleUpdateCopy} 
            onDeleteCopy={handleDeleteCopy} 
          />
        );
      case AppSection.FINANCEIRO:
        return (
          <FinanceiroView 
            projects={projects} 
            onAddProject={handleAddProject} 
            onDeleteProject={handleDeleteProject} 
          />
        );
      case AppSection.SETTINGS:
        return (
          <div className="p-8 max-w-4xl mx-auto space-y-8 bg-[#0f172a] text-[#f8fafc] min-h-screen">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                <Settings size={28} className="text-slate-400" /> Governança & Configurações
              </h1>
              <p className="text-slate-400 font-medium">Controle avançado do banco de dados e registros do SDR Engine.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Database className="text-blue-500" />
                <h3 className="font-bold text-slate-200">Banco de Dados Cloud (Google Firestore)</h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Todas as suas informações da plataforma (leads capturados, templates de sites e painel financeiro) estão sendo salvas de forma segura e em tempo real em um banco de dados na nuvem, garantindo que nada se perca entre as suas sessões.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">Leads:</span>
                    <span className="font-mono font-black text-blue-400 bg-blue-950/60 border border-blue-900/20 px-2.5 py-1 rounded-lg">{leads.length} registros</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">Templates:</span>
                    <span className="font-mono font-black text-purple-400 bg-purple-950/60 border border-purple-900/20 px-2.5 py-1 rounded-lg">{templates.length} ativos</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">Projetos:</span>
                    <span className="font-mono font-black text-emerald-400 bg-emerald-950/60 border border-emerald-900/20 px-2.5 py-1 rounded-lg">{projects.length} fechados</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-4">
                  {showClearConfirm ? (
                    <div className="p-4 bg-rose-950/30 border border-rose-900/40 rounded-2xl space-y-3">
                      <p className="text-xs text-rose-300 font-bold">
                        Tem certeza que deseja apagar permanentemente todas as informações do CRM e do Firestore?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await dbClearAllLeads();
                              setLeads([]);
                              safeStorage.setItem('b2b_leads_v2', JSON.stringify([]));
                              setShowClearConfirm(false);
                            } catch (e) {
                              setError("Falha ao deletar dados da nuvem.");
                            }
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Sim, Apagar Tudo
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowClearConfirm(true)}
                      className="px-5 py-3 bg-rose-950/40 hover:bg-rose-950/80 text-rose-400 font-bold border border-rose-900/30 rounded-xl transition-all text-xs cursor-pointer self-start"
                    >
                      Excluir Toda a Base
                    </button>
                  )}

                  {showReloadConfirm ? (
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                      <p className="text-xs text-slate-300 font-bold">
                        Deseja re-sincronizar e carregar os dados de demonstração padrão do CRM na nuvem?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            safeStorage.removeItem('b2b_leads_v2');
                            safeStorage.removeItem('b2b_site_templates_v2');
                            safeStorage.removeItem('b2b_projects_financeiro');
                            window.location.reload();
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Sim, Confirmar e Recarregar
                        </button>
                        <button
                          onClick={() => setShowReloadConfirm(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowReloadConfirm(true)}
                      className="px-5 py-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer self-start"
                    >
                      Recarregar Base Demonstração
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case AppSection.GROUPS:
        return (
          <GroupsView
            groups={groups}
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        );
      case AppSection.PROMPT_CLAUDE_CODE:
        return <PromptClaudeCodeView />;
      default:
        return <DashboardView leads={leads} projects={projects} copies={copies} onNavigate={setActiveSection} onUpdateLead={handleUpdateLead} />;
    }
  };

  const navItems = [
    { id: AppSection.DASHBOARD, label: 'Painel Geral & BI', icon: LayoutDashboard },
    { id: AppSection.LEADS, label: 'Leads & Enriquecimento', icon: Users },
    { id: AppSection.PIPELINE, label: 'Pipeline CRM', icon: Trello },
    { id: AppSection.CRIAR_PROPOSTA, label: 'Criar Proposta', icon: Send },
    { id: AppSection.PROMPT_CLAUDE_CODE, label: 'PROMPT CLAUDE CODE', icon: Terminal },
    { id: AppSection.SDR_AGENT, label: 'Agente SDR', icon: Sparkles },
    { id: AppSection.TEMPLATES, label: 'Templates de Sites', icon: Folder },
    { id: AppSection.COPIES, label: 'Biblioteca de Copies', icon: MessageSquare },
    { id: AppSection.FINANCEIRO, label: 'Financeiro', icon: DollarSign },
    { id: AppSection.GROUPS, label: 'Grupos de Leads', icon: Layers },
    { id: AppSection.SETTINGS, label: 'Configurações', icon: Settings },
  ];

  if (isDbLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#020617] text-white space-y-5">
        <div className="bg-blue-600 p-4 rounded-3xl ring-8 ring-blue-900/20 animate-pulse">
          <Zap size={36} className="fill-white text-white animate-bounce" />
        </div>
        <div className="space-y-1.5 text-center">
          <h2 className="text-xl font-black tracking-tight">LeadEngine PRO</h2>
          <p className="text-xs text-slate-400 font-bold font-mono uppercase tracking-wide">Sincronizando com Banco de Dados Cloud...</p>
        </div>
        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
          <div className="absolute left-0 top-0 h-full bg-blue-500 w-1/2 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#f8fafc] overflow-hidden font-sans">
      {/* Sidebar - Deep Dark Slate */}
      <aside className={`bg-[#020617] border-r border-slate-850 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col shadow-2xl z-20`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-850">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="bg-blue-600 p-2 rounded-xl ring-4 ring-blue-900/20">
              <Zap size={20} className="fill-white text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">LeadEngine <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded align-middle ml-1 font-black">PRO</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-900 rounded-xl transition-all text-slate-400 hover:text-white">
            <Menu size={18} />
          </button>
        </div>
        
        <nav className="flex-1 mt-6 px-3 space-y-1">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              id={`sidebar-nav-${item.id.toLowerCase()}-btn`}
              data-section={item.id}
              data-testid={`nav-${item.id.toLowerCase()}`}
              aria-label={item.label}
              title={item.label}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left cursor-pointer relative z-10 ${
                activeSection === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-black' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <item.icon size={18} className={activeSection === item.id ? 'stroke-[2.5px]' : ''} />
              {isSidebarOpen && <span className="font-bold text-xs tracking-wide uppercase">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-850">
           <div className={`flex items-center gap-2.5 text-slate-500 ${!isSidebarOpen && 'justify-center'}`}>
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gemini Cloud Ativa</span>}
           </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-auto relative bg-[#0f172a]">
        {error && (
          <div className="absolute top-4 right-4 z-50 bg-rose-950/90 text-rose-200 px-4 py-3 rounded-xl shadow-2xl border border-rose-900/50 flex items-center gap-3">
            <span className="font-bold text-xs">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white font-black text-[10px] bg-rose-900/30 hover:bg-rose-900/50 px-2 py-1 rounded">Fechar</button>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
