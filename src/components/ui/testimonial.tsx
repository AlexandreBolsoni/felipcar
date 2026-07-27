import { useState } from "react";
import { cn } from "../../lib/utils";
import { Star, CornerDownRight, ChevronLeft, ChevronRight, User, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface TestimonialItem {
    id?: string;
    image?: string;
    authorName?: string;
    name?: string;
    carModel?: string;
    title?: string;
    comment?: string;
    content?: string;
    rating?: number;
    date?: string;
    ownerReply?: string;
}

interface TestimonialProps {
    items?: TestimonialItem[];
    onAddReviewClick?: () => void;
}

export function TestimonialSection({ items = [] }: TestimonialProps) {
    const [pageIndex, setPageIndex] = useState(0);
    const [direction, setDirection] = useState<number>(1);

    if (!items || items.length === 0) return null;

    const pageSize = 2;
    const totalPages = Math.ceil(items.length / pageSize);

    const prevPage = () => {
        if (pageIndex > 0) {
            setDirection(-1);
            setPageIndex(prev => prev - 1);
        }
    };

    const nextPage = () => {
        if (pageIndex < totalPages - 1) {
            setDirection(1);
            setPageIndex(prev => prev + 1);
        }
    };

    const visibleItems = items.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

    const pageVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 50 : -50,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir < 0 ? 50 : -50,
            opacity: 0,
        }),
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Pairs Grid Container with AnimatePresence */}
            <div className="min-h-[220px] relative overflow-hidden py-1">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={pageIndex}
                        custom={direction}
                        variants={pageVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
                    >
                        {visibleItems.map((item, index) => {
                            const author = item.authorName || item.name || "Cliente Satisfeito";
                            const vehicle = item.carModel || item.title || "Cliente FelipCar";
                            const text = item.comment || item.content || "";
                            const rating = item.rating || 5;
                            const evaluatorImage = item.image; // Only show if evaluator uploaded/provided an image
                            const initial = author.trim().charAt(0).toUpperCase() || "C";

                            return (
                                <div 
                                    key={item.id || index}
                                    className="bg-[#222226] border border-zinc-800 hover:border-zinc-700 text-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[200px] h-full"
                                >
                                    <div className="space-y-3.5">
                                        {/* Card Header: Author Info & Rating */}
                                        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {/* Author Avatar: Only show if uploaded by evaluator, otherwise show elegant initial badge */}
                                                {evaluatorImage ? (
                                                    <img 
                                                        src={evaluatorImage} 
                                                        alt={author} 
                                                        className="w-9 h-9 rounded-full object-cover border border-red-500/80 shrink-0" 
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                                        {initial}
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-white text-sm truncate leading-snug">{author}</h4>
                                                    <p className="text-[11px] text-zinc-400 font-medium truncate">
                                                        {vehicle} {item.date ? `• ${item.date}` : ""}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Stars */}
                                            <div className="flex items-center gap-0.5 shrink-0 bg-zinc-900/60 px-2 py-1 rounded-lg border border-zinc-800">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star 
                                                        key={star} 
                                                        size={13} 
                                                        className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"} 
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Evaluator Comment */}
                                        <p className="text-xs text-zinc-300 leading-relaxed italic font-normal">
                                            "{text}"
                                        </p>

                                        {/* Evaluator attached photo (only if uploaded/provided) */}
                                        {evaluatorImage && (
                                            <div className="pt-1">
                                                <div className="relative rounded-xl overflow-hidden h-32 w-full border border-zinc-700/80 bg-zinc-900">
                                                    <img 
                                                        src={evaluatorImage} 
                                                        alt="Foto enviada pelo avaliador" 
                                                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <span className="absolute bottom-1.5 left-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                                                        <ImageIcon size={10} /> Foto do avaliador
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Owner Reply if available */}
                                    {item.ownerReply && (
                                        <div className="bg-[#19191C] rounded-xl p-3 border-l-2 border-red-500 text-xs space-y-1 mt-4">
                                            <span className="font-bold text-red-400 text-[11px] flex items-center gap-1">
                                                <CornerDownRight size={12} /> Resposta FelipCar:
                                            </span>
                                            <p className="text-zinc-300 text-xs leading-relaxed pl-3">
                                                {item.ownerReply}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pagination Controls for Pairs (2 por vez) */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                        disabled={pageIndex === 0}
                        onClick={prevPage}
                        className={cn(
                            "p-2 rounded-full border border-zinc-700 bg-[#262629] text-zinc-300 transition-all cursor-pointer flex items-center justify-center",
                            pageIndex === 0
                                ? "opacity-20 cursor-not-allowed border-zinc-800"
                                : "hover:bg-zinc-800 hover:text-white hover:border-red-500"
                        )}
                        title="Anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setDirection(idx > pageIndex ? 1 : -1);
                                    setPageIndex(idx);
                                }}
                                className={cn(
                                    "h-2 rounded-full transition-all cursor-pointer",
                                    idx === pageIndex ? "w-6 bg-red-600" : "w-2 bg-zinc-700 hover:bg-zinc-600"
                                )}
                                title={`Página ${idx + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        disabled={pageIndex >= totalPages - 1}
                        onClick={nextPage}
                        className={cn(
                            "p-2 rounded-full border border-zinc-700 bg-[#262629] text-zinc-300 transition-all cursor-pointer flex items-center justify-center",
                            pageIndex >= totalPages - 1
                                ? "opacity-20 cursor-not-allowed border-zinc-800"
                                : "hover:bg-zinc-800 hover:text-white hover:border-red-500"
                        )}
                        title="Próximo"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Example() {
    return (
        <div className="bg-[#18181A] text-white p-8">
            <TestimonialSection 
                items={[
                    {
                        name: "John Doe",
                        title: "Porsche 911 GT3",
                        content: "O serviço de PPF e Vitrificação de pintura da FelipCar superou todas as minhas expectativas. O carro ficou com brilho de zero km!",
                        rating: 5,
                    },
                    {
                        name: "Jane Smith",
                        title: "BMW M3 Competition",
                        content: "Atendimento impecável e cuidado extremo com cada detalhe do veículo. A higienização interna deixou o couro perfeito.",
                        rating: 5,
                    },
                    {
                        name: "David Lee",
                        title: "Audi RS6 Avant",
                        content: "Sempre trago meus carros aqui. Profissionais de confiança, agilidade no agendamento e resultado espetacular.",
                        rating: 5,
                    }
                ]}
            />
        </div>
    );
}

