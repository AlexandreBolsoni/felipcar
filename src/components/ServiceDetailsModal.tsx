import React, { useState } from 'react';
import { X, Clock, Sparkles, ShieldCheck, Calendar, ChevronRight, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Service } from '../domain/entities/Service';

interface ServiceDetailsModalProps {
    service: Service | null;
    onClose: () => void;
    onScheduleService: (serviceId: string) => void;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
    service,
    onClose,
    onScheduleService,
}) => {
    if (!service) return null;

    const [activeImage, setActiveImage] = useState<string | null>(
        service.detailedImages && service.detailedImages.length > 0 ? service.detailedImages[0] : null
    );

    const handleSchedule = () => {
        onScheduleService(service.id);
        onClose();
        const agendarElem = document.getElementById("agendar");
        if (agendarElem) {
            agendarElem.scrollIntoView({ behavior: "smooth" });
        }
    };

    function parseBold(text: string) {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    }

    function renderFormattedContent(content: string) {
        if (!content) return null;
        const lines = content.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-2" />;

            if (trimmed.startsWith('###')) {
                return (
                    <h4 key={idx} className="text-xs font-black text-white uppercase tracking-wider mt-4 mb-2 flex items-center gap-2 border-b border-zinc-800 pb-1">
                        <Sparkles size={14} className="text-red-500" />
                        {trimmed.replace(/^###\s*/, '')}
                    </h4>
                );
            }

            // Match numbered steps like 1. **Step name:** Description
            const stepMatch = trimmed.match(/^(\d+)\.\s*\*\*(.*?)\*\*:?\s*(.*)$/);
            if (stepMatch) {
                const stepNum = stepMatch[1];
                const stepTitle = stepMatch[2];
                const stepDesc = stepMatch[3];
                return (
                    <div key={idx} className="flex items-start gap-3 bg-[#1F1F21] p-3.5 rounded-xl border border-zinc-800 my-2 shadow-xs">
                        <span className="w-6 h-6 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {stepNum}
                        </span>
                        <div>
                            <strong className="block text-xs font-extrabold text-white">{stepTitle}</strong>
                            <span className="text-xs text-zinc-300 leading-relaxed font-normal">{parseBold(stepDesc)}</span>
                        </div>
                    </div>
                );
            }

            if (trimmed.startsWith('- ')) {
                return (
                    <div key={idx} className="flex items-start gap-2 my-1.5 pl-1 text-xs text-zinc-300 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>{parseBold(trimmed.replace(/^-\s*/, ''))}</span>
                    </div>
                );
            }

            return (
                <p key={idx} className="text-xs text-zinc-300 leading-relaxed my-1">
                    {parseBold(trimmed)}
                </p>
            );
        });
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#2A2A2D] border border-zinc-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden my-auto text-zinc-200">
                {/* Header */}
                <div className="bg-[#1F1F21] border-b border-zinc-800 text-white p-6 relative shrink-0">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 p-2 rounded-full transition-all cursor-pointer border border-zinc-700"
                        title="Fechar"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <Sparkles size={11} /> Detalhes do Serviço
                        </span>
                        <span className="bg-zinc-800 text-zinc-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-700">
                            {service.priceType === 'variable' ? 'Preço Variável' : 'Preço Fixo'}
                        </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight pr-8">
                        {service.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-semibold text-zinc-300">
                        <span className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700/80">
                            <Clock size={14} className="text-red-400" />
                            Duração: <strong className="text-white">{service.getFormattedDuration()}</strong>
                        </span>
                        <span className="flex items-center gap-1.5 bg-red-600 text-white px-3.5 py-1 rounded-lg font-black text-sm shadow-xs">
                            {service.getFormattedPrice()}
                        </span>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Breve Descrição */}
                    <div className="bg-[#1F1F21] border border-zinc-800 rounded-2xl p-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Resumo Executivo</h3>
                        <p className="text-sm font-medium text-zinc-200 leading-relaxed">
                            {service.description}
                        </p>
                    </div>

                    {/* Image Gallery if available */}
                    {service.detailedImages && service.detailedImages.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <ImageIcon size={15} className="text-red-500" />
                                Galeria e Fotos do Processo
                            </h3>
                            
                            {/* Main Preview Image */}
                            {activeImage && (
                                <div className="rounded-2xl overflow-hidden border border-zinc-800 mb-3 bg-black max-h-[280px] flex items-center justify-center shadow-xs">
                                    <img 
                                        src={activeImage} 
                                        alt={service.title} 
                                        className="w-full h-full object-cover max-h-[280px]"
                                    />
                                </div>
                            )}

                            {/* Thumbnails */}
                            {service.detailedImages.length > 1 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                    {service.detailedImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(img)}
                                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                                activeImage === img ? 'border-red-500 ring-2 ring-red-950' : 'border-zinc-800 opacity-70 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Detailed Process / Step by Step */}
                    {service.hasDetailedView && service.detailedDescription ? (
                        <div>
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                <CheckCircle2 size={15} className="text-red-500" />
                                Processo Passo a Passo & Metodologia
                            </h3>
                            <div className="bg-[#1F1F21] border border-zinc-800 rounded-2xl p-4 shadow-xs">
                                {renderFormattedContent(service.detailedDescription)}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#1F1F21] border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400">
                            <span className="font-bold text-white">Garantia de Qualidade FelipCar:</span> Todos os serviços são executados com produtos de linha profissional e acompanham orientação técnica para conservação da pintura.
                        </div>
                    )}

                    {/* Additional Info Box */}
                    {service.additionalInfo && (
                        <div className="bg-red-950/40 border border-red-900/60 rounded-2xl p-4 flex items-start gap-3">
                            <ShieldCheck size={20} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-red-200 uppercase tracking-wider">Informações Relevantes & Recomendações</h4>
                                <p className="text-xs text-red-300/90 font-medium mt-0.5 leading-relaxed">
                                    {service.additionalInfo}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer / Action Button */}
                <div className="p-4 md:p-6 bg-[#1F1F21] border-t border-zinc-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-zinc-400 font-medium text-center sm:text-left">
                        Dúvidas? Entre em contato ou escolha seu horário no agendamento.
                    </div>
                    <button
                        onClick={handleSchedule}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm py-3 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Calendar size={18} />
                        <span>AGENDAR ESTE SERVIÇO</span>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
