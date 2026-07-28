import React, { Component } from 'react';
import { Clock, AlertTriangle, CheckCircle2, MapPin, Star, MessageSquare, Send, CornerDownRight, Phone, Navigation, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { FirestoreServiceRepository } from '../infrastructure/repositories/FirestoreServiceRepository';
import { FirestoreAppointmentRepository } from '../infrastructure/repositories/FirestoreAppointmentRepository';
import { FirestoreReviewRepository } from '../infrastructure/repositories/FirestoreReviewRepository';
import { FirestoreBusinessHoursRepository } from '../infrastructure/repositories/FirestoreBusinessHoursRepository';
import type { BusinessHoursConfig } from '../infrastructure/repositories/MockBusinessHoursRepository';
import { Service } from '../domain/entities/Service';
import { Appointment } from '../domain/entities/Appointment';
import { Review } from '../domain/entities/Review';
import { CalendarView } from './CalendarView';
import { getOperatingHours, getSlotInfo, checkBookingConflict } from '../lib/scheduleUtils';
import { Pricing } from './ui/pricing';
import { ServiceDetailsModal } from './ServiceDetailsModal';
import { TestimonialSection } from './ui/testimonial';

type PublicState = {
    services: Service[];
    selectedDate: string;
    appointments: Appointment[];
    selectedServiceId: string | null;
    selectedHour: string | null;
    showModal: boolean;
    clientName: string;
    clientPhone: string;
    carModel: string;
    carPlate: string;
    businessHours: BusinessHoursConfig;

    // Detailed View Modal State
    selectedDetailService: Service | null;

    // All appointments (for calendar)
    allAppointments: Appointment[];

    // Review Form State
    reviews: Review[];
    activeReviewIndex: number;
    showReviewForm: boolean;
    newReviewName: string;
    newReviewCar: string;
    newReviewRating: number;
    newReviewComment: string;
    submittingReview: boolean;
};

export class PublicLandingPage extends Component<{}, PublicState> {
    declare state: PublicState;

    private serviceRepo = new FirestoreServiceRepository();
    private appointmentRepo = new FirestoreAppointmentRepository();
    private reviewRepo = new FirestoreReviewRepository();
    private businessHoursRepo = new FirestoreBusinessHoursRepository();

    constructor(props: {}) {
        super(props);
        const today = new Date().toISOString().split('T')[0];
        this.state = {
            services: [],
            selectedDate: today,
            appointments: [],
            selectedServiceId: null,
            selectedHour: null,
            showModal: false,
            clientName: '',
            clientPhone: '',
            carModel: '',
            carPlate: '',
            businessHours: {
                startHour: '08:00',
                endHour: '18:00',
                slotIntervalMinutes: 60,
                weekdaySchedule: 'Segunda a Sexta: 08h às 18h',
                saturdaySchedule: 'Sábado: 08h às 17h',
                sundaySchedule: 'Domingo / Feriados: Sob Consulta',
                lunchBreakEnabled: false,
                lunchStartHour: '12:00',
                lunchEndHour: '13:00',
            },

            selectedDetailService: null,

            allAppointments: [],
            reviews: [],
            activeReviewIndex: 0,
            showReviewForm: false,
            newReviewName: '',
            newReviewCar: '',
            newReviewRating: 5,
            newReviewComment: '',
            submittingReview: false,
        };
    }

    componentDidMount() {
        this.loadData();
    }

    loadData = async () => {
        const [services, appointments, reviews, businessHours, allAppointments] = await Promise.all([
            this.serviceRepo.getAll(),
            this.appointmentRepo.getByDate(this.state.selectedDate),
            this.reviewRepo.getPublicVisible(),
            this.businessHoursRepo.get(),
            this.appointmentRepo.getAll(),
        ]);
        this.setState({ services, appointments, reviews, businessHours, allAppointments });
    }

    handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ selectedDate: e.target.value }, this.loadData);
    }

    handleSchedule = async () => {
        const { selectedDate, selectedHour, selectedServiceId, clientName, clientPhone, carModel, carPlate, services, appointments, businessHours } = this.state;
        if (!selectedHour || !selectedServiceId || !clientName || !clientPhone || !carModel || !carPlate) {
            alert('Preencha todos os campos!');
            return;
        }

        const selectedService = services.find(s => s.id === selectedServiceId);
        if (selectedService && businessHours) {
            const conflict = checkBookingConflict(selectedHour, selectedService.durationMinutes, appointments, services, undefined, businessHours.endHour);
            if (conflict.hasConflict) {
                alert(`Horário indisponível:\n${conflict.reason}`);
                return;
            }
        }

        const newAppointment = new Appointment(
            Date.now().toString(),
            clientName,
            clientPhone,
            carModel,
            carPlate,
            selectedServiceId,
            selectedDate,
            selectedHour
        );

        await this.appointmentRepo.add(newAppointment);
        alert('Agendamento realizado com sucesso!');
        this.setState({
            showModal: false,
            clientName: '',
            clientPhone: '',
            carModel: '',
            carPlate: '',
            selectedHour: null,
            selectedServiceId: null
        }, this.loadData);
    }

    handleSelectServiceFromCarousel = (serviceId: string) => {
        this.setState({ selectedServiceId: serviceId });
    }

    handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        const { newReviewName, newReviewCar, newReviewRating, newReviewComment } = this.state;

        if (!newReviewName.trim() || !newReviewComment.trim()) {
            alert('Por favor, informe seu nome e escreva seu comentário.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const newReview = new Review(
            Date.now().toString(),
            newReviewName.trim(),
            newReviewCar.trim() || 'Veículo do Cliente',
            newReviewRating,
            newReviewComment.trim(),
            today,
            false,
            null
        );

        await this.reviewRepo.add(newReview);
        alert('Sua avaliação foi enviada com sucesso! Obrigado pelo seu comentário.');

        this.setState({
            newReviewName: '',
            newReviewCar: '',
            newReviewRating: 5,
            newReviewComment: ''
        }, this.loadData);
    }

    renderSchedule() {
        const { appointments, services, selectedDate, businessHours, allAppointments } = this.state;
        const operatingHours = getOperatingHours(businessHours);
        
        return (
            <div id="agendar" className="py-12 scroll-mt-20">
                <div className="text-center space-y-2 mb-10">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Agendamento Online</h2>
                    <p className="text-sm text-zinc-400 max-w-lg mx-auto">Selecione o dia e o horário de sua preferência.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Calendar Component */}
                    <div className="lg:col-span-5 shadow-md">
                        <CalendarView 
                            selectedDate={selectedDate}
                            onSelectDate={(dateStr) => this.setState({ selectedDate: dateStr }, this.loadData)}
                            allAppointments={allAppointments}
                        />
                    </div>

                    {/* Time Slots Grid */}
                    <div className="lg:col-span-7 bg-[#2A2A2D] p-6 rounded-2xl border border-zinc-800 shadow-md flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
                                <div>
                                    <h3 className="font-bold text-white text-lg">Horários Disponíveis</h3>
                                    <p className="text-xs text-zinc-400">Data: <span className="font-semibold text-zinc-200">{selectedDate}</span></p>
                                </div>
                                <span className="text-xs font-semibold text-zinc-300 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700/60">
                                    {businessHours.startHour} às {businessHours.endHour}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {operatingHours.map(hour => {
                                    const slot = getSlotInfo(hour, appointments, services);
                                    
                                    if (slot.isOccupied) {
                                        return (
                                            <div
                                                key={hour}
                                                className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-center opacity-50 cursor-not-allowed select-none"
                                            >
                                                <span className="block text-sm font-bold text-zinc-500">{hour}</span>
                                                <span className="text-[11px] mt-0.5 block font-medium text-red-400">
                                                    {slot.isBlocked ? 'Em Andamento' : 'Ocupado'}
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={hour}
                                            onClick={() => this.setState({ selectedHour: hour, showModal: true })}
                                            className="p-3 rounded-xl border border-zinc-700 bg-[#222225] hover:border-red-500 hover:bg-red-950/30 text-center transition-all cursor-pointer shadow-xs group"
                                        >
                                            <span className="block text-sm font-bold text-white group-hover:text-red-400 transition-colors">{hour}</span>
                                            <span className="text-[11px] mt-0.5 block font-semibold text-green-400">
                                                Livre
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                Clique no horário desejado para prosseguir.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderLocationSection() {
        const { businessHours } = this.state;
        return (
            <div id="localizacao" className="py-12 scroll-mt-20">
                <div className="text-center space-y-2 mb-10">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Localização</h2>
                    <p className="text-sm text-zinc-400 max-w-lg mx-auto">
                        Estúdio de estética automotiva com atendimento sob agendamento.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Map Iframe Embed */}
                    <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-zinc-800 shadow-md relative min-h-[360px] bg-zinc-900">
                        <iframe 
                            src="https://maps.google.com/maps?q=-19.747993,-40.651833&hl=pt-BR&z=17&output=embed" 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0, minHeight: '360px' }} 
                            allowFullScreen={true} 
                            loading="lazy" 
                            referrerPolicy="strict-origin-when-cross-origin"
                            title="Localização FelipCar Estética Automotiva (-19.747993, -40.651833)"
                            className="w-full h-full rounded-2xl"
                        ></iframe>
                    </div>

                    {/* Information Sidebar */}
                    <div className="lg:col-span-5 bg-[#2A2A2D] border border-zinc-800 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-6">
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                                    <MapPin className="text-red-500 shrink-0" size={18} />
                                    Ponto de Atendimento Exclusivo
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Localização exata demarcada no mapa. Dedicação total a cada veículo com suporte personalizado.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                                    <Clock size={14} className="text-red-500" />
                                    Horários
                                </h4>
                                <ul className="text-xs text-zinc-300 space-y-2 font-medium">
                                    <li className="flex justify-between gap-2">
                                        <span className="text-zinc-400">Segunda a Sexta:</span>
                                        <span className="font-bold text-white">{businessHours.startHour} às {businessHours.endHour}</span>
                                    </li>
                                    {businessHours.lunchBreakEnabled && (
                                        <li className="flex justify-between gap-2 text-amber-400">
                                            <span>Pausa para Almoço:</span>
                                            <span className="font-bold">{businessHours.lunchStartHour} às {businessHours.lunchEndHour}</span>
                                        </li>
                                    )}
                                    <li className="flex justify-between gap-2">
                                        <span className="text-zinc-400">Sábado:</span>
                                        <span className="font-bold text-white">{businessHours.startHour} às 17:00</span>
                                    </li>
                                    <li className="flex justify-between gap-2 text-zinc-400">
                                        <span>Domingo / Feriados:</span>
                                        <span>Sob Consulta</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
                            <a 
                                href="https://www.google.com/maps/search/?api=1&query=-19.747993,-40.651833" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                            >
                                <Navigation size={14} /> Abrir no GPS
                            </a>
                            <a 
                                href="https://wa.me/5527999999999?text=Olá!%20Gostaria%20de%20dúvidas%20sobre%20a%20localização%20e%20serviços" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                            >
                                <Phone size={14} /> WhatsApp Direct
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderReviewsSection() {
        const { reviews, showReviewForm, newReviewName, newReviewCar, newReviewRating, newReviewComment, activeReviewIndex } = this.state;
        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0 
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
            : '5.0';

        const currentIdx = Math.min(Math.max(0, activeReviewIndex || 0), Math.max(0, totalReviews - 1));

        return (
            <div id="avaliacoes" className="py-12 scroll-mt-20">
                {/* Header */}
                <div className="text-center space-y-2 mb-10">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Avaliações</h2>
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-200 pt-1">
                        <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={16} className="fill-current" />
                            ))}
                        </div>
                        <span>{avgRating}</span>
                        <span className="text-xs text-zinc-400 font-normal">({totalReviews} depoimentos)</span>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Toggle Form Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => this.setState({ showReviewForm: !showReviewForm })}
                            className="bg-[#2A2A2D] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
                        >
                            <MessageSquare size={14} />
                            {showReviewForm ? 'Fechar Formulário' : '+ Deixar Avaliação'}
                        </button>
                    </div>

                    {/* Expandable Review Form */}
                    {showReviewForm && (
                        <div className="bg-[#2A2A2D] border border-zinc-700 p-6 rounded-2xl shadow-md animate-in fade-in duration-150">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Send className="text-zinc-300" size={16} />
                                Enviar sua Avaliação
                            </h3>
                            <form onSubmit={this.handleSubmitReview} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-300 mb-1">Nota</label>
                                        <div className="flex items-center gap-1 bg-[#1F1F21] p-2 rounded-xl border border-zinc-700">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => this.setState({ newReviewRating: star })}
                                                    className="p-0.5 focus:outline-none cursor-pointer hover:scale-110 transition-transform"
                                                >
                                                    <Star 
                                                        size={18} 
                                                        className={star <= newReviewRating ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"} 
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-300 mb-1">Seu Nome</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={newReviewName} 
                                            onChange={(e) => this.setState({ newReviewName: e.target.value })}
                                            placeholder="Ex: Carlos Silva" 
                                            className="w-full bg-[#1F1F21] border border-zinc-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-zinc-500 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-300 mb-1">Veículo (Opcional)</label>
                                        <input 
                                            type="text" 
                                            value={newReviewCar} 
                                            onChange={(e) => this.setState({ newReviewCar: e.target.value })}
                                            placeholder="Ex: Golf GTI" 
                                            className="w-full bg-[#1F1F21] border border-zinc-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-zinc-500 text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 mb-1">Comentário</label>
                                    <textarea 
                                        required
                                        rows={2}
                                        value={newReviewComment} 
                                        onChange={(e) => this.setState({ newReviewComment: e.target.value })}
                                        placeholder="Sua experiência com nosso serviço..." 
                                        className="w-full bg-[#1F1F21] border border-zinc-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-zinc-500 text-xs resize-none"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Send size={14} /> Publicar Depoimento
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* New Testimonial Section Grid */}
                    {reviews.length === 0 ? (
                        <div className="p-8 text-center bg-[#2A2A2D] rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
                            Nenhuma avaliação cadastrada ainda.
                        </div>
                    ) : (
                        <TestimonialSection 
                            items={reviews.map(r => ({
                                id: r.id,
                                authorName: r.authorName,
                                carModel: r.carModel,
                                comment: r.comment,
                                rating: r.rating,
                                date: r.date,
                                ownerReply: r.ownerReply
                            }))} 
                        />
                    )}
                </div>
            </div>
        );
    }

    renderModal() {
        if (!this.state.showModal || !this.state.selectedHour) return null;

        const { selectedServiceId, selectedHour, services, appointments } = this.state;
        const selectedService = services.find(s => s.id === selectedServiceId);
        
        let conflictInfo: { hasConflict: boolean; reason?: string; endTimeStr?: string } | null = null;
        if (selectedService) {
            conflictInfo = checkBookingConflict(selectedHour, selectedService.durationMinutes, appointments, services);
        }

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-[#2A2A2D] border border-zinc-700 p-6 rounded-2xl max-w-md w-full shadow-2xl text-zinc-200">
                    <h3 className="text-xl font-bold text-white mb-1">Confirmar Agendamento</h3>
                    <p className="text-xs text-zinc-400 mb-5">
                        Data: <span className="font-semibold text-zinc-200">{this.state.selectedDate}</span> | Horário: <span className="font-bold text-red-400">{selectedHour}</span>
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1 font-medium">Selecione o Serviço</label>
                            <select 
                                value={selectedServiceId || ''}
                                onChange={e => this.setState({ selectedServiceId: e.target.value })}
                                className="w-full bg-[#1F1F21] border border-zinc-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-red-500 transition-colors text-sm font-medium"
                            >
                                <option value="" className="bg-[#1F1F21]">Escolha um serviço...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id} className="bg-[#1F1F21]">
                                        {s.title} ({s.getFormattedDuration()}) - {s.getFormattedPrice()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedService && (
                            <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3 text-xs text-zinc-300 space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Duração Estimada:</span>
                                    <span className="font-bold text-white">{selectedService.getFormattedDuration()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Valor / Cobrança:</span>
                                    <span className="font-bold text-white">{selectedService.getFormattedPrice()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Previsão de Término:</span>
                                    <span className="font-bold text-red-400">{selectedHour} às {conflictInfo?.endTimeStr}</span>
                                </div>
                            </div>
                        )}

                        {conflictInfo && conflictInfo.hasConflict && (
                            <div className="bg-red-950/60 border border-red-800 text-red-200 p-3 rounded-xl text-xs flex items-start gap-2">
                                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Horário Indisponível</p>
                                    <p>{conflictInfo.reason}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-zinc-300 mb-1 font-medium">Seu Nome Completo</label>
                            <input type="text" value={this.state.clientName} onChange={e => this.setState({ clientName: e.target.value })} className="w-full bg-[#1F1F21] border border-zinc-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-red-500 text-sm" placeholder="Ex: Roberto Silva" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1 font-medium">Telefone / WhatsApp</label>
                            <input type="text" value={this.state.clientPhone} onChange={e => this.setState({ clientPhone: e.target.value })} className="w-full bg-[#1F1F21] border border-zinc-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-red-500 text-sm" placeholder="(11) 99999-9999" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-zinc-300 mb-1 font-medium">Modelo do Carro</label>
                                <input type="text" value={this.state.carModel} onChange={e => this.setState({ carModel: e.target.value })} className="w-full bg-[#1F1F21] border border-zinc-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-red-500 text-sm" placeholder="Ex: Honda Civic" />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-300 mb-1 font-medium">Placa</label>
                                <input type="text" value={this.state.carPlate} onChange={e => this.setState({ carPlate: e.target.value })} className="w-full bg-[#1F1F21] border border-zinc-700 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-red-500 text-sm" placeholder="ABC-1234" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                        <button onClick={() => this.setState({ showModal: false })} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium cursor-pointer">Cancelar</button>
                        <button 
                            disabled={Boolean(conflictInfo?.hasConflict)}
                            onClick={this.handleSchedule} 
                            className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow transition-all ${
                                conflictInfo?.hasConflict 
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                    : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                            }`}
                        >
                            CONFIRMAR AGENDAMENTO
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
                {/* Clean Minimal Hero Section */}
                <div className="text-center py-8 md:py-12 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                        Estética Automotiva <span className="text-red-500">Premium</span>
                    </h1>
                    <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed mb-8 font-normal">
                        Cuidado técnico, proteção de alta durabilidade e atenção minuciosa aos detalhes do seu veículo.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a 
                            href="#agendar" 
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md"
                        >
                            Agendar Horário
                        </a>
                        <a 
                            href="#servicos" 
                            className="w-full sm:w-auto bg-[#2A2A2D] border border-zinc-700 hover:border-zinc-600 text-zinc-200 font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md"
                        >
                            Ver Serviços
                        </a>
                    </div>
                </div>

                {/* Services Catalog Carousel */}
                <Pricing 
                    services={this.state.services} 
                    onSelectService={this.handleSelectServiceFromCarousel} 
                    onOpenDetails={(service) => this.setState({ selectedDetailService: service })}
                />

                {/* Schedule View */}
                {this.renderSchedule()}

                {/* Location Section */}
                {this.renderLocationSection()}

                {/* Reviews & Comments Section */}
                {this.renderReviewsSection()}
                
                {/* Modal */}
                {this.renderModal()}

                {/* Detailed Service Modal */}
                {this.state.selectedDetailService && (
                    <ServiceDetailsModal 
                        service={this.state.selectedDetailService}
                        onClose={() => this.setState({ selectedDetailService: null })}
                        onScheduleService={(serviceId) => {
                            this.handleSelectServiceFromCarousel(serviceId);
                        }}
                    />
                )}
            </div>
        );
    }
}
