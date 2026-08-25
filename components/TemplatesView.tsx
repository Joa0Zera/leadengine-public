import React, { useState } from 'react';
import { 
  Plus, 
  Globe, 
  ExternalLink, 
  Trash2, 
  Folder, 
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { SiteTemplate } from '../types';

interface Props {
  templates: SiteTemplate[];
  onAddTemplate: (niche: string, url: string) => void;
  onDeleteTemplate: (id: string) => void;
}

const TemplatesView: React.FC<Props> = ({ templates, onAddTemplate, onDeleteTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [niche, setNiche] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) {
      setError('Por favor, informe o nicho.');
      return;
    }
    if (!url.trim()) {
      setError('Por favor, informe a URL do template.');
      return;
    }
    // Simple URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('A URL deve começar com http:// ou https://');
      return;
    }

    onAddTemplate(niche.trim(), url.trim());
    setNiche('');
    setUrl('');
    setError(null);
    setIsModalOpen(false);
  };

  const filteredTemplates = templates.filter(t => 
    t.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-[#0f172a] text-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <Folder size={32} className="text-blue-500" />
            Templates de Sites por Nicho
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Gerencie e consulte exemplos de sites de alta conversão para demonstrar aos seus potenciais clientes.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30 text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          Adicionar Template
        </button>
      </div>

      {/* Figma Community Template Search Banner */}
      <div className="bg-gradient-to-r from-blue-950/45 via-indigo-950/45 to-slate-900 border border-indigo-900/40 rounded-[2rem] p-6 md:p-8 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center shadow-2xl relative overflow-hidden group">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-indigo-500/10 text-indigo-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-500/20">
              Figma Community
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Banco de Inspiração Global
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight">
            Procurando por novos templates ou inspirações de layouts?
          </h2>
          <p className="text-slate-400 text-xs max-w-3xl leading-relaxed">
            Acesse o ecossistema oficial da comunidade do Figma. Explore milhares de protótipos de alta conversão, portfólios criativos e landing pages prontas de forma totalmente gratuita para demonstrar para os seus clientes em prospecção.
          </p>
        </div>
        <a 
          href="https://www.figma.com/community" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-950/50 hover:shadow-indigo-500/20 cursor-pointer shrink-0 group-hover:-translate-y-0.5"
        >
          <ExternalLink size={14} />
          Explorar Figma Community
        </a>
      </div>

      {/* Search and stats bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Pesquisar por nicho ou URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-12 pr-4 text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0 bg-slate-950/60 border border-slate-800/40 px-4 py-2 rounded-xl">
          Total de Templates: <span className="text-blue-400 font-black font-mono">{templates.length}</span>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div 
            key={template.id} 
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="bg-blue-950/60 border border-blue-900/40 text-blue-400 text-xs font-black px-3 py-1 rounded-xl uppercase tracking-wider">
                  {template.niche}
                </span>
                
                <button
                  onClick={() => onDeleteTemplate(template.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-950/20 rounded-lg transition-all"
                  title="Excluir Template"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-200 line-clamp-1">{template.niche} - Website Exemplo</h3>
                <p className="text-[10px] text-slate-400 font-mono break-all line-clamp-2">{template.url}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-[9px] text-slate-500 font-mono uppercase">
                Adicionado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
              </span>
              <a 
                href={template.url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[10px] font-black uppercase py-1.5 px-3 rounded-lg transition-all"
              >
                Acessar Site
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
            <Globe className="mx-auto text-slate-700 mb-2" size={48} />
            <p className="text-sm font-bold">Nenhum template encontrado.</p>
            {searchTerm && <p className="text-xs text-slate-600 mt-1">Experimente buscar por outros termos.</p>}
          </div>
        )}
      </div>

      {/* Modal - Adicionar Template */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-850 rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <Plus size={20} className="text-blue-500" />
                Adicionar Novo Template
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
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Nicho</label>
                <input 
                  type="text" 
                  placeholder="Ex: Dentista, Pet Shop, Advogado, Contabilidade"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Link URL de acesso</label>
                <input 
                  type="text" 
                  placeholder="Ex: https://meutemplateodontologico.com.br"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20 cursor-pointer"
              >
                Salvar Template
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesView;
