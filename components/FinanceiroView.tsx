import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  DollarSign, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  PiggyBank
} from 'lucide-react';
import { FinancialProject } from '../types';

interface Props {
  projects: FinancialProject[];
  onAddProject: (companyName: string, niche: string, value: number, url: string) => void;
  onDeleteProject: (id: string) => void;
}

const FinanceiroView: React.FC<Props> = ({ projects, onAddProject, onDeleteProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<FinancialProject | null>(null);
  
  // Form states
  const [companyName, setCompanyName] = useState('');
  const [niche, setNiche] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Stats
  const totalRevenue = projects.reduce((acc, curr) => acc + curr.value, 0);
  const totalProjects = projects.length;
  const averageTicket = totalProjects > 0 ? totalRevenue / totalProjects : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Por favor, informe o nome da empresa.');
      return;
    }
    if (!niche.trim()) {
      setError('Por favor, informe o nicho.');
      return;
    }
    
    const parsedValue = parseFloat(valueInput.replace(/[^\d.-]/g, ''));
    if (isNaN(parsedValue) || parsedValue <= 0) {
      setError('Por favor, informe um valor cobrado válido maior que zero.');
      return;
    }

    if (!url.trim()) {
      setError('Por favor, informe o endereço de URL.');
      return;
    }
    // Simple URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('A URL deve começar com http:// ou https://');
      return;
    }

    onAddProject(companyName.trim(), niche.trim(), parsedValue, url.trim());
    
    // Clear states
    setCompanyName('');
    setNiche('');
    setValueInput('');
    setUrl('');
    setError(null);
    setIsModalOpen(false);
  };

  const filteredProjects = projects.filter(p => 
    p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] text-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <DollarSign size={32} className="text-emerald-500" />
            Painel Financeiro
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Gerencie o faturamento dos sites vendidos e acompanhe a saúde financeira da sua operação de vendas.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/30 text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          Adicionar Projeto
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Total Faturado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Faturado</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1">{formatBRL(totalRevenue)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Soma de todos os projetos ativos</p>
          </div>
          <div className="bg-emerald-950/50 border border-emerald-900/30 p-3 rounded-xl text-emerald-400">
            <PiggyBank size={24} />
          </div>
        </div>

        {/* Card Projetos Vendidos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projetos Vendidos</p>
            <h3 className="text-3xl font-black text-slate-100 mt-1">{totalProjects}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Websites de alta conversão entregues</p>
          </div>
          <div className="bg-blue-950/50 border border-blue-900/30 p-3 rounded-xl text-blue-400">
            <Briefcase size={24} />
          </div>
        </div>

        {/* Card Ticket Médio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket Médio</p>
            <h3 className="text-3xl font-black text-blue-400 mt-1">{formatBRL(averageTicket)}</h3>
            <p className="text-[10px] text-slate-400 mt-1">Valor médio cobrado por site</p>
          </div>
          <div className="bg-indigo-950/50 border border-indigo-900/30 p-3 rounded-xl text-indigo-400">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Pesquisar por empresa, nicho ou link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-12 pr-4 text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0 bg-slate-950/60 border border-slate-800/40 px-4 py-2 rounded-xl">
          Filtro ativo: <span className="text-emerald-400 font-black font-mono">{filteredProjects.length}</span> projetos listados
        </div>
      </div>

      {/* Projects Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider font-black">
                <th className="py-4 px-6">Empresa Vendida</th>
                <th className="py-4 px-6">Nicho de Atuação</th>
                <th className="py-4 px-6">Valor Cobrado</th>
                <th className="py-4 px-6">Endereço de URL</th>
                <th className="py-4 px-6">Data da Venda</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-850/30 transition-colors text-xs">
                  <td className="py-4 px-6 font-bold text-slate-200">
                    {project.companyName}
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-slate-950/80 border border-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {project.niche}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-black text-emerald-400 font-mono">
                    {formatBRL(project.value)}
                  </td>
                  <td className="py-4 px-6">
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 hover:underline font-mono"
                    >
                      {project.url.replace('https://', '').replace('http://', '').substring(0, 30)}
                      {project.url.length > 30 ? '...' : ''}
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    {new Date(project.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setProjectToDelete(project)}
                      className="text-slate-500 hover:text-rose-400 p-2 hover:bg-rose-950/20 rounded-lg transition-all"
                      title="Excluir Projeto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <Briefcase className="mx-auto text-slate-700 mb-2" size={48} />
                    <p className="text-sm font-bold">Nenhum projeto de venda registrado.</p>
                    <p className="text-xs text-slate-600 mt-1">Clique em "Adicionar Projeto" no topo para registrar o faturamento do seu primeiro site vendido!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Adicionar Projeto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6 animate-scale-up">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <Plus size={20} className="text-emerald-500" />
                Adicionar Novo Projeto
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setError(null);
                }}
                className="text-slate-500 hover:text-slate-300 font-black text-xs uppercase cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-900/30 rounded-xl text-rose-400 text-xs flex items-center gap-2 font-bold">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Nome da Empresa Vendida</label>
                <input 
                  type="text" 
                  placeholder="Ex: Clínica Sorriso & Arte"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Nicho</label>
                <input 
                  type="text" 
                  placeholder="Ex: Dentista, Fisioterapia, Pet Shop"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Valor Cobrado (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ex: 1500"
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Endereço de URL</label>
                <input 
                  type="text" 
                  placeholder="Ex: https://sorrisoeartemogi.com.br"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
              >
                Salvar Projeto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Confirmação de Exclusão */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6 animate-scale-up">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-rose-950/30 text-rose-500 rounded-full border border-rose-900/30">
                <Trash2 size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-100">Excluir Projeto?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tem certeza de que deseja excluir o projeto de faturamento da empresa <strong className="text-slate-200">{projectToDelete.companyName}</strong>? Esta ação é irreversível.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-950/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceiroView;
