import React, { useState, useRef } from "react";
import { buttonVariants } from "./button";
import { useMediaQuery } from "../../hooks/use-media-query";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, ChevronLeft, ChevronRight, Clock, Sparkles, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { Service } from "../../domain/entities/Service";

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string; // duration text
  features: string[];
  description: string;
  buttonText: string;
  isPopular: boolean;
  priceType?: 'fixed' | 'variable';
  rawService?: Service;
}

interface PricingProps {
  plans?: PricingPlan[];
  services?: Service[];
  title?: string;
  description?: string;
  onSelectService?: (serviceId: string) => void;
  onOpenDetails?: (service: Service) => void;
}

export function Pricing({
  plans: customPlans,
  services,
  title = "Nossos Serviços",
  description = "Tratamentos e cuidados de alta performance para o seu veículo.",
  onSelectService,
  onOpenDetails,
}: PricingProps) {
  // Map services to PricingPlan format if passed
  const displayPlans: PricingPlan[] = customPlans || (services ? services.map((s, index) => {
    const descParts = s.description.split('.').map(p => p.trim()).filter(Boolean);
    const features = descParts.length > 0 ? descParts : [s.description];

    return {
      id: s.id,
      name: s.title,
      price: s.price,
      period: s.getFormattedDuration(),
      features: features,
      description: s.description,
      buttonText: s.hasDetailedView ? "Ver Detalhes do Serviço" : "Agendar Este Serviço",
      isPopular: index === 1 || s.title.toLowerCase().includes('vitrificação') || s.title.toLowerCase().includes('polimento'),
      priceType: s.priceType,
      rawService: s
    };
  }) : []);

  const total = displayPlans.length;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState<number>(1);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (diffX > 40) {
      nextSlide();
    } else if (diffX < -40) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  const handleAction = (plan: PricingPlan) => {
    if (onOpenDetails && plan.rawService && plan.rawService.hasDetailedView) {
      onOpenDetails(plan.rawService);
      return;
    }

    if (plan.id && onSelectService) {
      onSelectService(plan.id);
    } else if (plan.rawService && onSelectService) {
      onSelectService(plan.rawService.id);
    }

    const agendarElem = document.getElementById("agendar");
    if (agendarElem) {
      agendarElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const nextSlide = () => {
    if (total === 0) return;
    if (selectedIndex < total - 1) {
      setDirection(1);
      setSelectedIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (total === 0) return;
    if (selectedIndex > 0) {
      setDirection(-1);
      setSelectedIndex(prev => prev - 1);
    }
  };

  const selectPlan = (index: number) => {
    if (index === selectedIndex) return;
    setDirection(index > selectedIndex ? 1 : -1);
    setSelectedIndex(index);
  };

  if (total === 0) return null;

  // Windowing for desktop view (3 cards)
  let windowStart = 0;
  if (total > 3) {
    if (selectedIndex === 0) windowStart = 0;
    else if (selectedIndex >= total - 1) windowStart = total - 3;
    else windowStart = Math.min(Math.max(0, selectedIndex - 1), total - 3);
  }

  const visiblePlans = isDesktop && total >= 3
    ? displayPlans.slice(windowStart, windowStart + 3).map((plan) => ({
        plan,
        planIndex: displayPlans.findIndex(p => p.id === plan.id)
      }))
    : isDesktop && total < 3
    ? displayPlans.map((plan, idx) => ({ plan, planIndex: idx }))
    : [{ plan: displayPlans[selectedIndex], planIndex: selectedIndex }];

  // Mobile Page-Slide variants
  const mobileVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 80 : -80,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section id="servicos" className="py-12 px-4 max-w-6xl mx-auto scroll-mt-20">
      {/* Clean Header */}
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Cards & Carousel Container */}
      <div 
        className="relative py-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isDesktop ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center min-h-[480px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {visiblePlans.map(({ plan, planIndex }) => {
                const isSelected = planIndex === selectedIndex;

                return (
                  <motion.div
                    key={plan.id || planIndex}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ 
                      opacity: isSelected ? 1 : 0.65, 
                      scale: isSelected ? 1.04 : 0.95,
                      y: isSelected ? -6 : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{
                      layout: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3 },
                      y: { duration: 0.3 },
                    }}
                    onClick={() => selectPlan(planIndex)}
                    className={cn(
                      "rounded-2xl p-6 text-left flex flex-col justify-between transition-colors duration-300 select-none cursor-pointer relative",
                      isSelected
                        ? "bg-[#2A2A2E] border-2 border-red-500 shadow-2xl shadow-red-950/40 ring-1 ring-red-500/30 z-20 min-h-[470px]"
                        : "bg-[#202023] border border-zinc-800/80 hover:border-zinc-700 hover:opacity-90 z-10 min-h-[410px]"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={cn("font-bold text-white transition-all", isSelected ? "text-xl" : "text-lg")}>
                          {plan.name}
                        </h3>
                        {isSelected ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/80 border border-red-800/80 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
                            <Sparkles size={11} /> Selecionado
                          </span>
                        ) : plan.isPopular ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800/80 border border-zinc-700/80 px-2 py-0.5 rounded-md">
                            Destaque
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-md flex items-center gap-1 border border-zinc-700/50">
                          <Clock size={13} className="text-red-400" /> {plan.period}
                        </span>
                        {plan.priceType === 'variable' && (
                          <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                            A partir de
                          </span>
                        )}
                      </div>

                      <div className="mb-4">
                        <span className={cn("font-black tracking-tight text-white transition-all", isSelected ? "text-3xl" : "text-2xl")}>
                          <span className="text-lg font-bold text-red-500 mr-1">R$</span>
                          {plan.price}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 mb-6 leading-relaxed line-clamp-3">
                        {plan.description}
                      </p>

                      <ul className="space-y-2 mb-6 pt-4 border-t border-zinc-800">
                        {plan.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 font-medium">
                            <Check className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSelected) {
                          selectPlan(planIndex);
                        } else {
                          handleAction(plan);
                        }
                      }}
                      className={cn(
                        "w-full py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-auto",
                        isSelected
                          ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-950/50"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                      )}
                    >
                      {isSelected ? plan.buttonText : "Ver Serviço"}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* Mobile Single Card Page-Slide */
          <div className="min-h-[440px] flex items-center justify-center overflow-hidden py-2 px-1">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={selectedIndex}
                custom={direction}
                variants={mobileVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                className="w-full bg-[#2A2A2E] border-2 border-red-500 rounded-2xl p-6 text-left flex flex-col justify-between shadow-xl shadow-red-950/30"
              >
                {(() => {
                  const plan = displayPlans[selectedIndex];
                  return (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-xl text-white">
                            {plan.name}
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/80 border border-red-800/80 px-2.5 py-1 rounded-md flex items-center gap-1">
                            <Sparkles size={11} /> Selecionado
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs font-semibold text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-md flex items-center gap-1 border border-zinc-700/50">
                            <Clock size={13} className="text-red-400" /> {plan.period}
                          </span>
                          {plan.priceType === 'variable' && (
                            <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                              A partir de
                            </span>
                          )}
                        </div>

                        <div className="mb-4">
                          <span className="text-3xl font-black tracking-tight text-white">
                            <span className="text-lg font-bold text-red-500 mr-1">R$</span>
                            {plan.price}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                          {plan.description}
                        </p>

                        <ul className="space-y-2 mb-6 pt-4 border-t border-zinc-800">
                          {plan.features.slice(0, 4).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 font-medium">
                              <Check className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleAction(plan)}
                        className="w-full py-3 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {plan.buttonText}
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {total > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            disabled={selectedIndex === 0}
            onClick={prevSlide}
            className={cn(
              "p-2.5 rounded-full border border-zinc-700 bg-[#262629] text-zinc-300 transition-all cursor-pointer",
              selectedIndex === 0
                ? "opacity-20 cursor-not-allowed border-zinc-800/50"
                : "hover:bg-zinc-800 hover:text-white hover:border-red-500"
            )}
            title="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            {displayPlans.map((plan, idx) => (
              <button
                key={plan.id || idx}
                onClick={() => selectPlan(idx)}
                className={cn(
                  "h-2.5 rounded-full transition-all cursor-pointer",
                  idx === selectedIndex ? "w-7 bg-red-600" : "w-2.5 bg-zinc-700 hover:bg-zinc-600"
                )}
                title={plan.name}
              />
            ))}
          </div>
          <button
            disabled={selectedIndex >= total - 1}
            onClick={nextSlide}
            className={cn(
              "p-2.5 rounded-full border border-zinc-700 bg-[#262629] text-zinc-300 transition-all cursor-pointer",
              selectedIndex >= total - 1
                ? "opacity-20 cursor-not-allowed border-zinc-800/50"
                : "hover:bg-zinc-800 hover:text-white hover:border-red-500"
            )}
            title="Próximo"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
}
