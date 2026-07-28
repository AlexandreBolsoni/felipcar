import React, { Component } from 'react';
import { Check, X, Clock, Plus, Trash2, Calendar as CalendarIcon, List, ChevronUp, User, LogOut, AlertTriangle, ShieldCheck, DollarSign, MessageSquare, Eye, EyeOff, CornerDownRight, Star, Edit, Sparkles, Image as ImageIcon, FileText, Layers, CheckCircle2, Upload, ArrowRight, ArrowLeft, Wand2, Info } from 'lucide-react';
import { FirestoreServiceRepository } from '../infrastructure/repositories/FirestoreServiceRepository';
import { FirestoreAppointmentRepository } from '../infrastructure/repositories/FirestoreAppointmentRepository';
import { FirestoreReviewRepository } from '../infrastructure/repositories/FirestoreReviewRepository';
import { FirestoreBusinessHoursRepository } from '../infrastructure/repositories/FirestoreBusinessHoursRepository';
import type { BusinessHoursConfig } from '../infrastructure/repositories/MockBusinessHoursRepository';
import { Service, DurationUnit, PriceType } from '../domain/entities/Service';
import { Appointment } from '../domain/entities/Appointment';
import { Review } from '../domain/entities/Review';
import { CalendarView } from './CalendarView';
import { InstallPWA } from './InstallPWA';
import { getOperatingHours, getSlotInfo, checkBookingConflict, minutesToTime } from '../lib/scheduleUtils';

type AdminProps = {
    onLogout?: () => void;
};

type AdminState = {
    theme: 'light' | 'dark';
    activeTab: 'AGENDA' | 'CATALOG' | 'REVIEWS' | 'HOURS';
    showProfileMenu: boolean;
    // Tab 1 state
    selectedDate: string;
    appointments: Appointment[];
    allAppointments: Appointment[];
    businessHours: BusinessHoursConfig;
    showHoursSaveToast: boolean;
    // Tab 2 state
    services: Service[];
    showServiceModal: boolean;
    serviceModalStep: number;
    // Service form editing and advanced options
    editingServiceId: string | null;
    newServiceTitle: string;
    newServiceDesc: string;
    newServiceDurationValue: number;
    newServiceDurationUnit: DurationUnit;
    newServicePrice: number;
    newServicePriceType: PriceType;
    hasDetailedView: boolean;
    detailedDescription: string;
    detailedImages: string[];
    additionalInfo: string;
    newImageUrlInput: string;
    // Admin scheduling modal
    showAdminScheduleModal: boolean;
    adminSelectedHour: string | null;
    adminClientName: string;
    adminClientPhone: string;
    adminCarModel: string;
    adminCarPlate: string;
    adminServiceId: string | null;
    // Tab 3 state (Reviews)
    reviews: Review[];
    replyingReviewId: string | null;
    replyText: string;
};

export class AdminDashboard extends Component<AdminProps, AdminState> {
    declare state: AdminState;

    private serviceRepo = new FirestoreServiceRepository();
    private appointmentRepo = new FirestoreAppointmentRepository();
    private reviewRepo = new FirestoreReviewRepository();
    private businessHoursRepo = new FirestoreBusinessHoursRepository();
    private mediaQueryListener?: (e: MediaQueryListEvent) => void;

    constructor(props: AdminProps) {
        super(props);
        const today = new Date().toISOString().split('T')[0];
        const isSystemDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.state = {
            theme: isSystemDark ? 'dark' : 'light',
            activeTab: 'AGENDA',
            showProfileMenu: false,
            selectedDate: today,
            appointments: [],
            allAppointments: [],
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
            showHoursSaveToast: false,
            services: [],
            showServiceModal: false,
            serviceModalStep: 1,
            editingServiceId: null,
            newServiceTitle: '',
            newServiceDesc: '',
            newServiceDurationValue: 1,
            newServiceDurationUnit: 'hours',
            newServicePrice: 150,
            newServicePriceType: 'fixed',
            hasDetailedView: false,
            detailedDescription: '',
            detailedImages: [],
            additionalInfo: '',
            newImageUrlInput: '',
            showAdminScheduleModal: false,
            adminSelectedHour: null,
            adminClientName: '',
            adminClientPhone: '',
            adminCarModel: '',
            adminCarPlate: '',
            adminServiceId: null,
            reviews: [],
            replyingReviewId: null,
            replyText: ''
        };
    }

    handleUpdateBusinessHours = async (fields: Partial<BusinessHoursConfig>) => {
        const updated = await this.businessHoursRepo.update(fields);
        this.setState({ businessHours: updated, showHoursSaveToast: true });
        setTimeout(() => {
            this.setState({ showHoursSaveToast: false });
        }, 3000);
    };

    componentDidMount() {
        this.loadData();
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.mediaQueryListener = (e: MediaQueryListEvent) => {
                this.setState({ theme: e.matches ? 'dark' : 'light' });
            };
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', this.mediaQueryListener);
            } else if ((mediaQuery as any).addListener) {
                (mediaQuery as any).addListener(this.mediaQueryListener);
            }
        }
    }

    componentWillUnmount() {
        if (typeof window !== 'undefined' && window.matchMedia && this.mediaQueryListener) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', this.mediaQueryListener);
            } else if ((mediaQuery as any).removeListener) {
                (mediaQuery as any).removeListener(this.mediaQueryListener);
            }
        }
    }

    loadData = async () => {
        const [services, appointments, reviews, businessHours, allAppointments] = await Promise.all([
            this.serviceRepo.getAll(),
            this.appointmentRepo.getByDate(this.state.selectedDate),
            this.reviewRepo.getAll(),
            this.businessHoursRepo.get(),
            this.appointmentRepo.getAll(),
        ]);
        this.setState({ services, appointments, reviews, businessHours, allAppointments });
    }

    handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ selectedDate: e.target.value }, this.loadData);
    }

    handleStatusChange = async (appointment: Appointment, action: 'COMPLETE' | 'CANCEL') => {
        if (action === 'COMPLETE') appointment.complete();
        if (action === 'CANCEL') appointment.cancel();
        await this.appointmentRepo.update(appointment);
        this.loadData();
    }

    handleOpenNewService = () => {
        this.setState({
            showServiceModal: true,
            serviceModalStep: 1,
            editingServiceId: null,
            newServiceTitle: '',
            newServiceDesc: '',
            newServiceDurationValue: 1,
            newServiceDurationUnit: 'hours',
            newServicePrice: 150,
            newServicePriceType: 'fixed',
            hasDetailedView: false,
            detailedDescription: '',
            detailedImages: [],
            additionalInfo: '',
            newImageUrlInput: ''
        });
    }

    handleOpenEditService = (service: Service) => {
        this.setState({
            showServiceModal: true,
            serviceModalStep: 1,
            editingServiceId: service.id,
            newServiceTitle: service.title,
            newServiceDesc: service.description,
            newServiceDurationValue: service.durationValue,
            newServiceDurationUnit: service.durationUnit,
            newServicePrice: service.price,
            newServicePriceType: service.priceType,
            hasDetailedView: service.hasDetailedView,
            detailedDescription: service.detailedDescription || '',
            detailedImages: [...(service.detailedImages || [])],
            additionalInfo: service.additionalInfo || '',
            newImageUrlInput: ''
        });
    }

    handleSaveService = async () => {
        const { 
            editingServiceId,
            newServiceTitle, 
            newServiceDesc, 
            newServiceDurationValue, 
            newServiceDurationUnit, 
            newServicePrice, 
            newServicePriceType,
            hasDetailedView,
            detailedDescription,
            detailedImages,
            additionalInfo
        } = this.state;

        if (!newServiceTitle.trim()) {
            alert('Por favor, informe o título do serviço.');
            this.setState({ serviceModalStep: 1 });
            return;
        }

        try {
            const serviceId = editingServiceId || Date.now().toString();
            const service = new Service(
                serviceId,
                newServiceTitle,
                newServiceDesc,
                Number(newServiceDurationValue) || 1,
                Number(newServicePrice) || 0,
                newServiceDurationUnit,
                newServicePriceType,
                hasDetailedView,
                detailedDescription,
                detailedImages,
                additionalInfo
            );

            if (editingServiceId) {
                await this.serviceRepo.update(service);
            } else {
                await this.serviceRepo.add(service);
            }

            this.setState({
                showServiceModal: false,
                serviceModalStep: 1,
                editingServiceId: null,
                newServiceTitle: '',
                newServiceDesc: '',
                newServiceDurationValue: 1,
                newServiceDurationUnit: 'hours',
                newServicePrice: 150,
                newServicePriceType: 'fixed',
                hasDetailedView: false,
                detailedDescription: '',
                detailedImages: [],
                additionalInfo: '',
                newImageUrlInput: ''
            }, this.loadData);
        } catch (e: any) {
            alert(e.message);
        }
    }

    handleAddImageToGallery = (url?: string) => {
        const targetUrl = url || this.state.newImageUrlInput.trim();
        if (!targetUrl) return;
        if (!this.state.detailedImages.includes(targetUrl)) {
            this.setState({
                detailedImages: [...this.state.detailedImages, targetUrl],
                newImageUrlInput: ''
            });
        }
    }

    handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                if (base64Url && !this.state.detailedImages.includes(base64Url)) {
                    this.setState((prevState) => ({
                        detailedImages: [...prevState.detailedImages, base64Url],
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    handleDropImages = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                if (base64Url && !this.state.detailedImages.includes(base64Url)) {
                    this.setState((prevState) => ({
                        detailedImages: [...prevState.detailedImages, base64Url],
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    handleApplyProcessPreset = (presetText: string) => {
        this.setState({
            detailedDescription: presetText,
            hasDetailedView: true
        });
    };

    handleRemoveImageFromGallery = (index: number) => {
        this.setState({
            detailedImages: this.state.detailedImages.filter((_, i) => i !== index)
        });
    }

    handleInsertFormatTag = (tagType: 'header' | 'step' | 'list' | 'bold') => {
        let snippet = '';
        if (tagType === 'header') {
            snippet = '\n### ETAPA DO PROCEDIMENTO TÉCNICO\n';
        } else if (tagType === 'step') {
            const stepNum = (this.state.detailedDescription.match(/^\d+\./gm) || []).length + 1;
            snippet = `\n${stepNum}. **Nome da Etapa:** Descrição detalhada deste passo...`;
        } else if (tagType === 'list') {
            snippet = '\n- Item e especificação de garantia ou produto';
        } else if (tagType === 'bold') {
            snippet = ' **texto em destaque** ';
        }

        this.setState({
            detailedDescription: this.state.detailedDescription + snippet
        });
    }

    handleDeleteService = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
            await this.serviceRepo.remove(id);
            this.loadData();
        }
    }

    handleAdminSchedule = async () => {
        const { selectedDate, adminSelectedHour, adminServiceId, adminClientName, adminClientPhone, adminCarModel, adminCarPlate, services, appointments } = this.state;
        if (!adminSelectedHour || !adminServiceId || !adminClientName || !adminClientPhone || !adminCarModel || !adminCarPlate) {
            alert('Preencha todos os campos!');
            return;
        }

        const selectedService = services.find(s => s.id === adminServiceId);
        if (selectedService) {
            const conflict = checkBookingConflict(adminSelectedHour, selectedService.durationMinutes, appointments, services);
            if (conflict.hasConflict) {
                alert(`Conflito de Horário!\n${conflict.reason}`);
                return;
            }
        }

        const newAppointment = new Appointment(
            Date.now().toString(),
            adminClientName,
            adminClientPhone,
            adminCarModel,
            adminCarPlate,
            adminServiceId,
            selectedDate,
            adminSelectedHour
        );

        await this.appointmentRepo.add(newAppointment);
        this.setState({
            showAdminScheduleModal: false,
            adminClientName: '',
            adminClientPhone: '',
            adminCarModel: '',
            adminCarPlate: '',
            adminSelectedHour: null,
            adminServiceId: null
        }, this.loadData);
    }

    renderMetrics() {
        const { appointments, services, theme } = this.state;
        const isDark = theme === 'dark';
        const total = appointments.length;
        const completed = appointments.filter(a => a.status === 'COMPLETED').length;
        const pending = appointments.filter(a => a.status === 'PENDING').length;

        // Calculate total occupied minutes and estimated revenue
        let totalMinutes = 0;
        let totalRevenue = 0;

        appointments.forEach(a => {
            if (a.status !== 'CANCELLED') {
                const s = services.find(srv => srv.id === a.serviceId);
                if (s) {
                    totalMinutes += s.durationMinutes;
                    totalRevenue += s.price;
                }
            }
        });

        const totalHours = (totalMinutes / 60).toFixed(1);

        const cards = [
            {
                id: 'agendamentos',
                title: 'Agendamentos',
                value: `${total}`,
                badge: `(${pending} pend / ${completed} concl)`,
                icon: null,
                cardBg: isDark ? 'bg-[#18181A] border-zinc-800' : 'bg-gray-50 border-gray-200/80',
                titleColor: isDark ? 'text-zinc-400' : 'text-gray-500',
                valueColor: isDark ? 'text-white' : 'text-gray-900',
            },
            {
                id: 'horas',
                title: 'Horas Ocupadas',
                value: `${totalHours}h`,
                badge: null,
                icon: <Clock size={14} className={isDark ? 'text-red-400' : 'text-red-600'} />,
                cardBg: isDark ? 'bg-red-950/30 border-red-900/50' : 'bg-red-50/70 border-red-100',
                titleColor: isDark ? 'text-red-400' : 'text-red-600',
                valueColor: isDark ? 'text-red-300' : 'text-red-700',
            },
            {
                id: 'faturamento',
                title: 'Faturamento Previsto',
                value: `R$ ${totalRevenue.toFixed(2)}`,
                badge: null,
                icon: <DollarSign size={14} className={isDark ? 'text-emerald-400' : 'text-green-600'} />,
                cardBg: isDark ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-green-50/70 border-green-100',
                titleColor: isDark ? 'text-emerald-400' : 'text-green-700',
                valueColor: isDark ? 'text-emerald-300' : 'text-green-700',
            },
            {
                id: 'capacidade',
                title: 'Capacidade do Dia',
                value: '11 slots',
                badge: null,
                icon: <ShieldCheck size={14} className={isDark ? 'text-zinc-400' : 'text-gray-500'} />,
                cardBg: isDark ? 'bg-[#18181A] border-zinc-800' : 'bg-gray-50 border-gray-200/80',
                titleColor: isDark ? 'text-zinc-400' : 'text-gray-500',
                valueColor: isDark ? 'text-zinc-200' : 'text-gray-800',
            }
        ];

        const renderCardSet = (prefix: string) => (
            <div className="flex shrink-0 items-center gap-2 pr-2">
                {cards.map((card) => (
                    <div 
                        key={`${prefix}-${card.id}`}
                        className={`inline-flex flex-col justify-center px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border min-w-[145px] sm:min-w-[165px] shrink-0 transition-colors ${card.cardBg}`}
                    >
                        <p className={`text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5 font-semibold ${card.titleColor}`}>
                            {card.title}
                        </p>
                        <div className="flex items-center gap-1 flex-wrap">
                            {card.icon}
                            <span className={`text-sm sm:text-base font-extrabold ${card.valueColor}`}>{card.value}</span>
                            {card.badge && (
                                <span className={`text-[9px] sm:text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                    {card.badge}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );

        return (
            <div className="group relative w-full overflow-hidden flex whitespace-nowrap py-0.5">
                {/* Left Gradient Mask */}
                <div className={`pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-8 z-10 bg-gradient-to-r ${
                    isDark ? 'from-[#222226] to-transparent' : 'from-white to-transparent'
                }`} />

                {/* Right Gradient Mask */}
                <div className={`pointer-events-none absolute inset-y-0 right-0 w-6 sm:w-8 z-10 bg-gradient-to-l ${
                    isDark ? 'from-[#222226] to-transparent' : 'from-white to-transparent'
                }`} />

                {/* Marquee Track 1 */}
                <div className="flex shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]">
                    {renderCardSet('track1')}
                </div>

                {/* Marquee Track 2 (Mirror Duplicate for Infinite Seamless Loop) */}
                <div className="flex shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]" aria-hidden="true">
                    {renderCardSet('track2')}
                </div>
            </div>
        );
    }

    renderAdminScheduleModal() {
        if (!this.state.showAdminScheduleModal || !this.state.adminSelectedHour) return null;

        const { adminServiceId, adminSelectedHour, services, appointments, theme } = this.state;
        const isDark = theme === 'dark';
        const selectedService = services.find(s => s.id === adminServiceId);
        
        let conflictInfo: { hasConflict: boolean; reason?: string; endTimeStr?: string } | null = null;
        if (selectedService) {
            conflictInfo = checkBookingConflict(adminSelectedHour, selectedService.durationMinutes, appointments, services);
        }

        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className={`border p-6 rounded-2xl max-w-md w-full shadow-2xl transition-colors ${
                    isDark ? 'bg-[#222226] border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                    <h3 className="text-xl font-bold mb-2">Agendar Horário</h3>
                    <p className={`text-xs mb-5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                        Data: <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{this.state.selectedDate}</span> | Horário Inicial: <span className="font-bold text-red-500">{adminSelectedHour}</span>
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-sm mb-1 font-medium ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>Serviço</label>
                            <select 
                                value={adminServiceId || ''}
                                onChange={e => this.setState({ adminServiceId: e.target.value })}
                                className={`w-full px-3 py-2.5 rounded-lg focus:outline-none focus:border-red-600 text-sm ${
                                    isDark ? 'bg-[#18181A] border border-zinc-700 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'
                                }`}
                            >
                                <option value="">Selecione um serviço...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.title} ({s.getFormattedDuration()}) - {s.getFormattedPrice()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedService && (
                            <div className={`rounded-lg p-3 text-xs space-y-1 border ${
                                isDark ? 'bg-[#18181A] border-zinc-800 text-zinc-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}>
                                <div className="flex justify-between">
                                    <span>Duração Estimada:</span>
                                    <span className="font-bold">{selectedService.getFormattedDuration()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Preço / Cobrança:</span>
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedService.getFormattedPrice()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Horário Previsto:</span>
                                    <span className="font-bold text-red-500">{adminSelectedHour} às {conflictInfo?.endTimeStr}</span>
                                </div>
                            </div>
                        )}

                        {conflictInfo && conflictInfo.hasConflict && (
                            <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-lg text-xs flex items-start gap-2">
                                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Atenção - Bloqueio de Horário</p>
                                    <p>{conflictInfo.reason}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className={`block text-sm mb-1 font-medium ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>Nome Completo do Cliente</label>
                            <input type="text" value={this.state.adminClientName} onChange={e => this.setState({ adminClientName: e.target.value })} className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-red-600 text-sm ${isDark ? 'bg-[#18181A] border border-zinc-700 text-white placeholder-zinc-500' : 'bg-gray-50 border border-gray-200 text-gray-900'}`} placeholder="Ex: Carlos Eduardo" />
                        </div>
                        <div>
                            <label className={`block text-sm mb-1 font-medium ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>Telefone / WhatsApp</label>
                            <input type="text" value={this.state.adminClientPhone} onChange={e => this.setState({ adminClientPhone: e.target.value })} className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-red-600 text-sm ${isDark ? 'bg-[#18181A] border border-zinc-700 text-white placeholder-zinc-500' : 'bg-gray-50 border border-gray-200 text-gray-900'}`} placeholder="(11) 99999-9999" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm mb-1 font-medium ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>Modelo do Carro</label>
                                <input type="text" value={this.state.adminCarModel} onChange={e => this.setState({ adminCarModel: e.target.value })} className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-red-600 text-sm ${isDark ? 'bg-[#18181A] border border-zinc-700 text-white placeholder-zinc-500' : 'bg-gray-50 border border-gray-200 text-gray-900'}`} placeholder="Ex: Golf GTI" />
                            </div>
                            <div>
                                <label className={`block text-sm mb-1 font-medium ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>Placa</label>
                                <input type="text" value={this.state.adminCarPlate} onChange={e => this.setState({ adminCarPlate: e.target.value })} className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-red-600 text-sm ${isDark ? 'bg-[#18181A] border border-zinc-700 text-white placeholder-zinc-500' : 'bg-gray-50 border border-gray-200 text-gray-900'}`} placeholder="ABC-1234" />
                            </div>
                        </div>
                    </div>

                    <div className={`flex justify-end gap-3 mt-6 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                        <button onClick={() => this.setState({ showAdminScheduleModal: false })} className={`px-4 py-2 text-sm ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>Cancelar</button>
                        <button 
                            disabled={Boolean(conflictInfo?.hasConflict)}
                            onClick={this.handleAdminSchedule} 
                            className={`px-5 py-2.5 rounded-lg text-white font-bold text-sm shadow transition-all cursor-pointer ${
                                conflictInfo?.hasConflict 
                                    ? 'bg-zinc-700 opacity-50 cursor-not-allowed' 
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            Confirmar Agendamento
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    renderAgenda() {
        const { appointments, services, selectedDate, theme, businessHours, showHoursSaveToast, allAppointments: allRepoAppointments } = this.state;
        const isDark = theme === 'dark';
        const operatingHours = getOperatingHours(businessHours);

        // Format date display
        const dateObj = new Date(selectedDate + 'T00:00:00');
        const formattedDateDisplay = dateObj.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        return (
            <div className={`flex flex-col h-full overflow-y-auto transition-colors ${
                isDark ? 'bg-[#18181A] text-zinc-100' : 'bg-[#F9FAFB] text-gray-800'
            }`}>
                <header className={`shrink-0 border-b p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                }`}>
                    <div>
                        <h2 className={`text-lg sm:text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Painel de Gestão e Agenda</h2>
                        <p className={`text-xs mt-0.5 capitalize ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{formattedDateDisplay}</p>
                    </div>
                </header>

                {/* Top Section: Metrics/Day Summary (FIRST on mobile) & Calendar (SECOND on mobile) */}
                <div className="p-4 sm:p-6 flex flex-col lg:grid lg:grid-cols-12 gap-6 shrink-0">
                    {/* Metrics and Day Summary */}
                    <div className={`order-1 lg:order-2 lg:col-span-7 flex flex-col justify-between border rounded-2xl p-4 sm:p-5 shadow-xs transition-colors ${
                        isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                    }`}>
                        <div>
                            <div className={`flex justify-between items-center mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b ${
                                isDark ? 'border-zinc-800' : 'border-gray-100'
                            }`}>
                                <div>
                                    <h3 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Resumo do Dia</h3>
                                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Métricas de ocupação e faturamento</p>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                    isDark ? 'bg-red-950/60 border-red-900/50 text-red-400' : 'bg-red-100 border-red-200 text-red-700'
                                }`}>
                                    {selectedDate}
                                </span>
                            </div>
                            {this.renderMetrics()}
                        </div>

                        <div className={`mt-3 sm:mt-4 pt-3 sm:pt-4 border-t text-xs flex items-center justify-between ${
                            isDark ? 'border-zinc-800 text-zinc-400' : 'border-gray-100 text-gray-500'
                        }`}>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shrink-0"></span>
                                <span className="text-[11px] sm:text-xs">Procedimentos longos bloqueiam automaticamente os horários subsequentes.</span>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Component */}
                    <div className="order-2 lg:order-1 lg:col-span-5">
                        <CalendarView 
                            selectedDate={selectedDate}
                            onSelectDate={(dateStr) => this.setState({ selectedDate: dateStr }, this.loadData)}
                            allAppointments={allRepoAppointments}
                            theme={theme}
                        />
                    </div>
                </div>

                {/* Agenda Hours Timeline */}
                <div className="px-4 sm:px-6 pb-20 md:pb-12">
                    <div className={`border rounded-2xl p-4 sm:p-6 shadow-xs transition-colors ${
                        isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                    }`}>
                        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b gap-2 ${
                            isDark ? 'border-zinc-800' : 'border-gray-100'
                        }`}>
                            <div>
                                <h3 className={`text-base sm:text-lg font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Clock className="text-red-500 shrink-0" size={20} />
                                    Grade de Horários e Atendimentos
                                </h3>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Funcionamento: {businessHours.startHour} às {businessHours.endHour}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {operatingHours.map(hour => {
                                const slot = getSlotInfo(hour, appointments, services);

                                if (slot.isPrimary && slot.appointment) {
                                    const app = slot.appointment;
                                    const service = slot.service;

                                    return (
                                        <div 
                                            key={hour} 
                                            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all shadow-xs ${
                                                app.status === 'COMPLETED' 
                                                    ? (isDark ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-green-50/40 border-green-200') 
                                                    : (isDark ? 'bg-[#19191C] border-l-4 sm:border-l-8 border-l-red-500 border-zinc-800' : 'bg-white border-l-4 sm:border-l-8 border-l-red-600 border-gray-200 hover:shadow-md')
                                            }`}
                                        >
                                            {/* Top Row on Mobile: Time Box, Status & Price */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 sm:pb-0 sm:border-b-0 border-zinc-800/40">
                                                <div className="flex items-center gap-2">
                                                    <div className={`px-2.5 py-1 rounded-lg border font-mono font-black text-sm sm:text-base shrink-0 ${
                                                        isDark ? 'bg-red-950/50 border-red-900/60 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                                                    }`}>
                                                        {hour}
                                                    </div>
                                                    <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                                                        app.status === 'COMPLETED' 
                                                            ? (isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' : 'bg-green-100 text-green-800') 
                                                            : (isDark ? 'bg-red-950 text-red-400 border border-red-900/50' : 'bg-red-100 text-red-800')
                                                    }`}>
                                                        {app.status === 'COMPLETED' ? 'FINALIZADO' : 'EM ANDAMENTO'}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    <span className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {service ? service.getFormattedPrice() : `R$ ${app.hour}`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Middle Section: Client & Service Details */}
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{app.clientName}</h4>
                                                    <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-semibold ${
                                                        isDark ? 'bg-[#26262A] text-zinc-300 border border-zinc-800' : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                    }`}>
                                                        {app.carModel} • {app.carPlate}
                                                    </span>
                                                </div>

                                                <div className={`flex flex-wrap items-center gap-2 text-xs ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                                                    <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{service?.title || 'Serviço Personalizado'}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 font-semibold text-red-500">
                                                        <Clock size={13} /> {service ? service.getFormattedDuration() : '60 min'} (Ocupa até {slot.endHourStr})
                                                    </span>
                                                </div>

                                                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                                    Telefone: <a href={`tel:${app.clientPhone}`} className={`font-medium hover:underline ${isDark ? 'text-red-400' : 'text-red-600'}`}>{app.clientPhone}</a>
                                                </p>
                                            </div>

                                            {/* Bottom Actions */}
                                            {app.status === 'PENDING' && (
                                                <div className={`flex items-center gap-2 pt-2 border-t ${
                                                    isDark ? 'border-zinc-800/80' : 'border-gray-100'
                                                }`}>
                                                    <button 
                                                        onClick={() => this.handleStatusChange(app, 'COMPLETE')}
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer min-h-[40px]"
                                                        title="Finalizar Serviço"
                                                    >
                                                        <Check size={16} /> Finalizar
                                                    </button>
                                                    <button 
                                                        onClick={() => this.handleStatusChange(app, 'CANCEL')}
                                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer min-h-[40px] ${
                                                            isDark ? 'bg-[#26262A] text-zinc-300 hover:bg-red-950/60 hover:text-red-400 border border-zinc-800' : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 border border-gray-200'
                                                        }`}
                                                        title="Cancelar Agendamento"
                                                    >
                                                        <X size={16} /> Cancelar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                if (slot.isBlocked) {
                                    const primaryApp = slot.primaryAppointment;
                                    const service = slot.service;

                                    return (
                                        <div 
                                            key={hour} 
                                            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all ${
                                                isDark 
                                                    ? 'bg-red-950/20 border-red-900/40 text-red-300' 
                                                    : 'bg-red-50/60 border-red-200'
                                            }`}
                                        >
                                            <div className="flex items-start sm:items-center gap-3">
                                                <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs sm:text-sm shrink-0 ${
                                                    isDark ? 'bg-red-950/50 border-red-900/60 text-red-400' : 'bg-red-100 border-red-200 text-red-700'
                                                }`}>
                                                    {hour}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                                            <Clock size={13} /> Bloqueado por Serviço Prolongado
                                                        </span>
                                                        <span className={`text-xs font-semibold ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                                                            ({service?.title || 'Serviço em Andamento'})
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                                                        Cliente: <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{primaryApp?.clientName}</span> ({primaryApp?.carModel}) • Término: <span className="font-bold text-red-500">{slot.endHourStr}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                                                isDark ? 'bg-red-950/60 border-red-800 text-red-400' : 'bg-red-100 border-red-200 text-red-600'
                                            }`}>
                                                Horário Bloqueado
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div 
                                        key={hour} 
                                        className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                                            isDark 
                                                ? 'bg-[#19191C] border-zinc-800 hover:border-zinc-700' 
                                                : 'bg-white border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`px-2.5 py-1 rounded-lg border font-mono font-semibold text-xs sm:text-sm shrink-0 ${
                                                isDark ? 'bg-[#26262A] border-zinc-700 text-zinc-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                                            }`}>
                                                {hour}
                                            </div>
                                            <div>
                                                <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Horário Livre</span>
                                                <p className={`text-[11px] sm:text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Disponível para novos agendamentos</p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => this.setState({ showAdminScheduleModal: true, adminSelectedHour: hour })}
                                            className={`flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 min-h-[38px] ${
                                                isDark 
                                                    ? 'bg-red-950/40 text-red-400 border border-red-900/60 hover:bg-red-600 hover:text-white hover:border-red-600' 
                                                    : 'bg-red-50 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600'
                                            }`}
                                        >
                                            <Plus size={15} /> Reservar
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                <footer className={`mt-auto p-4 border-t flex justify-between items-center shrink-0 transition-colors ${
                    isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                }`}>
                    <div className="flex gap-4">
                        <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}><span className="w-2 h-2 rounded-full bg-green-500"></span> Concluído</span>
                        <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}><span className="w-2 h-2 rounded-full bg-red-600"></span> Ocupado</span>
                        <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}><span className="w-2 h-2 rounded-full bg-gray-400"></span> Cancelado</span>
                    </div>
                    <p className={`text-[10px] uppercase font-mono ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>FelipCar_OS_Build_2026.07.26</p>
                </footer>
                
                {this.renderAdminScheduleModal()}
            </div>
        );
    }

    renderCatalog() {
        const { theme } = this.state;
        const isDark = theme === 'dark';
        const presets = [
            { name: '✨ Polimento / Vitrificação', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80' },
            { name: '🧼 Lavagem Snow Foam', url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80' },
            { name: '🛞 Rodas & Freios', url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80' },
            { name: '🪑 Interna & Estofados', url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80' },
            { name: '🛡️ Proteção / PPF', url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80' },
        ];

        return (
            <div className={`flex flex-col h-full overflow-hidden transition-colors ${
                isDark ? 'bg-[#18181A] text-zinc-100' : 'bg-[#F9FAFB] text-gray-800'
            }`}>
                <header className={`shrink-0 border-b p-4 sm:p-6 md:px-8 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                }`}>
                    <div>
                        <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Catálogo de Serviços</h2>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Gerenciamento de serviços, preços e área detalhada com fotos</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <button 
                            onClick={this.handleOpenNewService}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Plus size={16} /> NOVO SERVIÇO
                        </button>
                    </div>
                </header>

                <div className="p-4 sm:p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {this.state.services.map(service => (
                            <div 
                                key={service.id} 
                                className={`border rounded-2xl p-6 flex flex-col relative group shadow-sm transition-all ${
                                    isDark 
                                        ? 'bg-[#222226] border-zinc-800 hover:border-red-500/50' 
                                        : 'bg-white border-gray-200 hover:border-red-300'
                                }`}
                            >
                                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                    <button 
                                        onClick={() => this.handleOpenEditService(service)}
                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                            isDark ? 'text-zinc-400 hover:text-blue-400 hover:bg-zinc-800' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                        title="Editar Serviço"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => this.handleDeleteService(service.id)}
                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                            isDark ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                        }`}
                                        title="Excluir Serviço"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mb-2 pr-16">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                        service.priceType === 'variable' 
                                            ? (isDark ? 'bg-amber-950/60 border-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-800 border-amber-200') 
                                            : (isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-100 text-gray-700 border-gray-200')
                                    }`}>
                                        {service.priceType === 'variable' ? 'Preço Variável' : 'Preço Fixo'}
                                    </span>

                                    {service.hasDetailedView && (
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${
                                            isDark ? 'bg-red-950/60 border-red-900/50 text-red-400' : 'bg-red-100 text-red-700 border-red-200'
                                        }`}>
                                            <Sparkles size={11} /> Popup Ativo
                                        </span>
                                    )}
                                </div>

                                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{service.title}</h3>
                                <p className={`mb-4 flex-grow text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>{service.description}</p>
                                
                                {service.hasDetailedView && service.detailedImages && service.detailedImages.length > 0 && (
                                    <div className="flex items-center gap-1.5 mb-4 overflow-hidden">
                                        {service.detailedImages.slice(0, 3).map((img, i) => (
                                            <img key={i} src={img} alt="Foto" className={`w-10 h-10 rounded-lg object-cover border ${isDark ? 'border-zinc-700' : 'border-gray-200'}`} />
                                        ))}
                                        {service.detailedImages.length > 3 && (
                                            <span className={`text-[11px] font-bold px-2 py-2 rounded-lg border ${
                                                isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}>
                                                +{service.detailedImages.length - 3} fotos
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className={`flex justify-between items-center text-sm pt-4 border-t mt-auto ${
                                    isDark ? 'border-zinc-800' : 'border-gray-100'
                                }`}>
                                    <span className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-md border ${
                                        isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200' : 'bg-gray-50 border-gray-200 text-gray-700'
                                    }`}>
                                        <Clock size={15} className="text-red-500" /> {service.getFormattedDuration()}
                                    </span>
                                    <span className="font-extrabold text-red-500 text-base">
                                        {service.getFormattedPrice()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Service Create/Edit Modal */}
                {this.state.showServiceModal && this.renderServiceModal()}
            </div>
        );
    }

    renderServiceModal() {
        const { 
            theme, 
            serviceModalStep, 
            editingServiceId, 
            newServiceTitle, 
            newServiceDesc, 
            newServiceDurationValue, 
            newServiceDurationUnit, 
            newServicePrice, 
            newServicePriceType, 
            hasDetailedView, 
            detailedDescription, 
            detailedImages, 
            additionalInfo, 
            newImageUrlInput 
        } = this.state;
        const isDark = theme === 'dark';

        const stockImagePresets = [
            { name: 'Polimento / Vitrificação', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80' },
            { name: 'Lavagem Snow Foam', url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80' },
            { name: 'Rodas & Freios', url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80' },
            { name: 'Interna & Estofados', url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80' },
            { name: 'Proteção / PPF', url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80' },
        ];

        return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className={`border p-6 md:p-8 rounded-3xl max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[94vh] flex flex-col ${
                    isDark ? 'bg-[#222226] border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                    {/* Modal Header */}
                    <div className={`flex items-center justify-between pb-4 border-b shrink-0 ${
                        isDark ? 'border-zinc-800' : 'border-gray-100'
                    }`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-500 border border-red-500/30">
                                    Passo {serviceModalStep} de 3
                                </span>
                                <h3 className={`text-lg md:text-xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {editingServiceId ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
                                </h3>
                            </div>
                            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                {serviceModalStep === 1 && 'Preencha os dados básicos, duração estimada e modelo de valor do serviço.'}
                                {serviceModalStep === 2 && 'Defina a explicação técnica, passo a passo e garantia exibidos ao cliente no site.'}
                                {serviceModalStep === 3 && 'Faça upload de fotos reais do seu processo de trabalho ou adicione links.'}
                            </p>
                        </div>
                        <button 
                            onClick={() => this.setState({ showServiceModal: false })} 
                            className={`p-1.5 rounded-xl cursor-pointer transition-colors ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Step Navigation Bar */}
                    <div className={`grid grid-cols-3 gap-1.5 p-1.5 my-4 rounded-2xl border text-xs font-bold shrink-0 ${
                        isDark ? 'bg-[#18181A] border-zinc-800' : 'bg-gray-50 border-gray-200'
                    }`}>
                        <button
                            type="button"
                            onClick={() => this.setState({ serviceModalStep: 1 })}
                            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                serviceModalStep === 1 
                                    ? 'bg-red-600 text-white shadow-md font-extrabold' 
                                    : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-white')
                            }`}
                        >
                            <FileText size={15} />
                            <span className="hidden sm:inline">1. Dados Básicos</span>
                            <span className="sm:hidden">1. Dados</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => this.setState({ serviceModalStep: 2 })}
                            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                                serviceModalStep === 2 
                                    ? 'bg-red-600 text-white shadow-md font-extrabold' 
                                    : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-white')
                            }`}
                        >
                            <Sparkles size={15} />
                            <span className="hidden sm:inline">2. Detalhamento</span>
                            <span className="sm:hidden">2. Detalhes</span>
                            {hasDetailedView && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 shadow-xs" title="Modo detalhado ativo"></span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => this.setState({ serviceModalStep: 3 })}
                            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                                serviceModalStep === 3 
                                    ? 'bg-red-600 text-white shadow-md font-extrabold' 
                                    : (isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-white')
                            }`}
                        >
                            <ImageIcon size={15} />
                            <span className="hidden sm:inline">3. Galeria ({detailedImages.length})</span>
                            <span className="sm:hidden">3. Fotos</span>
                        </button>
                    </div>

                    {/* Modal Step Content */}
                    <div className="space-y-5 overflow-y-auto py-2 pr-1 flex-1">
                        {/* STEP 1: DADOS BÁSICOS */}
                        {serviceModalStep === 1 && (
                            <div className="space-y-4 animate-in fade-in duration-150">
                                {/* Title */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                                        Título do Serviço *
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Polimento Técnico & Vitrificação 3M"
                                        value={newServiceTitle} 
                                        onChange={e => this.setState({ newServiceTitle: e.target.value })} 
                                        className={`w-full border px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-red-600 text-sm font-semibold ${
                                            isDark ? 'bg-[#18181A] border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white'
                                        }`} 
                                    />
                                </div>

                                {/* Breve Descrição */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                                        Breve Descrição (Resumo do Card no Site do Cliente)
                                    </label>
                                    <textarea 
                                        placeholder="Resumo direto em 1 ou 2 frases do serviço para a listagem de cards do site..."
                                        value={newServiceDesc} 
                                        onChange={e => this.setState({ newServiceDesc: e.target.value })} 
                                        className={`w-full border px-3.5 py-2.5 rounded-xl h-22 resize-none focus:outline-none focus:border-red-600 text-sm ${
                                            isDark ? 'bg-[#18181A] border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900 focus:bg-white'
                                        }`}
                                    ></textarea>
                                </div>

                                {/* Duration & Price Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Duration Row */}
                                    <div className={`p-4 rounded-2xl border space-y-2.5 ${
                                        isDark ? 'bg-[#18181A] border-zinc-800' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                        <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                                            Duração Estimada
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className={`block text-[11px] mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Quantidade</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    value={newServiceDurationValue} 
                                                    onChange={e => this.setState({ newServiceDurationValue: parseInt(e.target.value) || 1 })} 
                                                    className={`w-full border px-2.5 py-2 rounded-xl font-bold text-sm focus:outline-none focus:border-red-600 ${
                                                        isDark ? 'bg-[#222226] border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                                                    }`} 
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-[11px] mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Unidade</label>
                                                <select 
                                                    value={newServiceDurationUnit} 
                                                    onChange={e => this.setState({ newServiceDurationUnit: e.target.value as DurationUnit })}
                                                    className={`w-full border px-2.5 py-2 rounded-xl font-semibold text-xs focus:outline-none focus:border-red-600 ${
                                                        isDark ? 'bg-[#222226] border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                                                    }`}
                                                >
                                                    <option value="minutes">Minutos</option>
                                                    <option value="hours">Horas</option>
                                                    <option value="days">Dias</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Model Row */}
                                    <div className={`p-4 rounded-2xl border space-y-2.5 ${
                                        isDark ? 'bg-[#18181A] border-zinc-800' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                        <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                                            Modelo de Preço
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className={`block text-[11px] mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Tipo de Cobrança</label>
                                                <select 
                                                    value={newServicePriceType} 
                                                    onChange={e => this.setState({ newServicePriceType: e.target.value as PriceType })}
                                                    className={`w-full border px-2 py-2 rounded-xl font-semibold text-xs focus:outline-none focus:border-red-600 ${
                                                        isDark ? 'bg-[#222226] border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                                                    }`}
                                                >
                                                    <option value="fixed">Preço Fixo</option>
                                                    <option value="variable">A partir de (Variável)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={`block text-[11px] mb-1 font-semibold ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Valor (R$)</label>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    step="0.01" 
                                                    value={newServicePrice} 
                                                    onChange={e => this.setState({ newServicePrice: parseFloat(e.target.value) || 0 })} 
                                                    className={`w-full border px-2.5 py-2 rounded-xl font-extrabold text-sm text-red-500 focus:outline-none focus:border-red-600 ${
                                                        isDark ? 'bg-[#222226] border-zinc-700' : 'bg-white border-gray-200'
                                                    }`} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: MODAL DETALHADO & PASSO A PASSO */}
                        {serviceModalStep === 2 && (
                            <div className="space-y-5 animate-in fade-in duration-150">
                                {/* Toggle Switch Card */}
                                <div className={`p-4 rounded-2xl border transition-all ${
                                    hasDetailedView 
                                        ? (isDark ? 'bg-red-950/30 border-red-900/50' : 'bg-red-50 border-red-200') 
                                        : (isDark ? 'bg-[#18181A] border-zinc-800' : 'bg-gray-50 border-gray-200')
                                }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${hasDetailedView ? 'bg-red-600 text-white' : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-600')}`}>
                                                <Sparkles size={20} />
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    Exibir Botão "Ver Detalhes" no Site do Cliente
                                                </h4>
                                                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                                                    Abre um popup exclusivo com explicação técnica, garantia e galeria de fotos do processo.
                                                </p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input 
                                                type="checkbox" 
                                                checked={hasDetailedView} 
                                                onChange={e => this.setState({ hasDetailedView: e.target.checked })} 
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {/* Detailed Description & Step-by-Step Text Area */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className={`block text-xs font-bold uppercase tracking-wider ${
                                            isDark ? 'text-zinc-200' : 'text-gray-900'
                                        }`}>
                                            Descrição Detalhada & Passo a Passo do Procedimento
                                        </label>

                                        {/* Formatting Toolbar */}
                                        <div className="flex items-center gap-1">
                                            <button 
                                                type="button" 
                                                onClick={() => this.handleInsertFormatTag('header')}
                                                className={`text-[10px] font-bold border px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                                                    isDark ? 'bg-[#18181A] border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-800'
                                                }`}
                                                title="Inserir Título de Seção"
                                            >
                                                + Título
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => this.handleInsertFormatTag('step')}
                                                className={`text-[10px] font-bold border px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                                                    isDark ? 'bg-[#18181A] border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-800'
                                                }`}
                                                title="Inserir Etapa Numerada"
                                            >
                                                + Passo
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => this.handleInsertFormatTag('list')}
                                                className={`text-[10px] font-bold border px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                                                    isDark ? 'bg-[#18181A] border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-800'
                                                }`}
                                                title="Inserir Marcador"
                                            >
                                                + Marcador
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => this.handleInsertFormatTag('bold')}
                                                className={`text-[10px] font-extrabold border px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                                                    isDark ? 'bg-[#18181A] border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-800'
                                                }`}
                                                title="Texto em Destaque"
                                            >
                                                B
                                            </button>
                                        </div>
                                    </div>

                                    <textarea 
                                        placeholder={`Exemplo de Estrutura Recomendada:\n\n### ETAPAS DO PROCESSO TÉCNICO:\n1. **Inspeção de Pintura:** Avaliação com micrômetro digital e iluminação LED spot.\n2. **Pré-lavagem & Descontaminação:** Espuma Snow Foam neutra e Clay Bar.\n3. **Polimento Multi-etapas:** Correção técnica de até 95% dos microrriscos.\n4. **Proteção Cerâmica:** Aplicação de vitrificador com 3 anos de garantia.`}
                                        value={detailedDescription} 
                                        onChange={e => this.setState({ detailedDescription: e.target.value })} 
                                        className={`w-full border px-3.5 py-3 rounded-2xl h-44 font-mono text-xs leading-relaxed focus:outline-none focus:border-red-600 ${
                                            isDark ? 'bg-[#18181A] border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                    ></textarea>
                                </div>

                                {/* Additional Info / Warranty */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                                        isDark ? 'text-zinc-200' : 'text-gray-900'
                                    }`}>
                                        Garantia, Produtos e Recomendações do Serviço
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Garantia de 3 anos. Recomenda-se cura de 24 horas sem lavar o veículo."
                                        value={additionalInfo} 
                                        onChange={e => this.setState({ additionalInfo: e.target.value })} 
                                        className={`w-full border px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-red-600 ${
                                            isDark ? 'bg-[#18181A] border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                    />
                                </div>
                            </div>
                        )}

                        {/* STEP 3: GALERIA E FOTOS */}
                        {serviceModalStep === 3 && (
                            <div className="space-y-5 animate-in fade-in duration-150">
                                {/* File Drag and Drop Zone */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between ${
                                        isDark ? 'text-zinc-200' : 'text-gray-900'
                                    }`}>
                                        <span className="flex items-center gap-1.5">
                                            <Upload size={14} className="text-red-500" />
                                            Upload de Fotos do Seu Computador ou Celular
                                        </span>
                                        <span className={`text-[10px] font-normal ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                            Selecione múltiplos arquivos
                                        </span>
                                    </label>

                                    <div 
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={this.handleDropImages}
                                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative flex flex-col items-center justify-center gap-2 group ${
                                            isDark 
                                                ? 'bg-[#18181A] border-zinc-700 hover:border-red-500/70 hover:bg-red-950/10' 
                                                : 'bg-gray-50 border-gray-300 hover:border-red-500 hover:bg-red-50/30'
                                        }`}
                                    >
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            multiple 
                                            onChange={this.handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                        <div className="p-3 rounded-full bg-red-600/10 text-red-500 group-hover:scale-110 transition-transform">
                                            <Upload size={22} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                Clique aqui para escolher fotos ou arraste arquivos para esta área
                                            </p>
                                            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                                Suporta JPG, PNG, WEBP (fotos reais do seu estúdio de detailing)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* URL Input */}
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                                        isDark ? 'text-zinc-200' : 'text-gray-900'
                                    }`}>
                                        Ou Adicione Fotos por Link / URL da Web
                                    </label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Cole o link da imagem (http://...)" 
                                            value={newImageUrlInput}
                                            onChange={e => this.setState({ newImageUrlInput: e.target.value })}
                                            className={`flex-1 border text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-red-600 ${
                                                isDark ? 'bg-[#18181A] border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => this.handleAddImageToGallery()}
                                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                                        >
                                            Adicionar Link
                                        </button>
                                    </div>
                                </div>

                                {/* Stock Photo Presets */}
                                <div>
                                    <span className={`text-[11px] font-bold uppercase block mb-1.5 ${
                                        isDark ? 'text-zinc-400' : 'text-gray-500'
                                    }`}>
                                        Fotos Demonstrativas de Exemplo Rápido:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {stockImagePresets.map((p, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => this.handleAddImageToGallery(p.url)}
                                                className={`text-[11px] font-semibold border px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                                                    isDark 
                                                        ? 'bg-[#18181A] border-zinc-700 hover:bg-red-950/60 hover:border-red-800 text-zinc-300' 
                                                        : 'bg-white border-gray-200 hover:bg-red-50 hover:border-red-300 text-gray-700'
                                                }`}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Uploaded Photos Thumbnails Grid */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${
                                            isDark ? 'text-zinc-200' : 'text-gray-900'
                                        }`}>
                                            Galeria do Serviço ({detailedImages.length} {detailedImages.length === 1 ? 'foto' : 'fotos'})
                                        </label>
                                        {detailedImages.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => this.setState({ detailedImages: [] })}
                                                className="text-[11px] text-red-500 hover:underline font-bold cursor-pointer"
                                            >
                                                Limpar Galeria
                                            </button>
                                        )}
                                    </div>

                                    {detailedImages.length > 0 ? (
                                        <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-3 border rounded-2xl ${
                                            isDark ? 'bg-[#18181A] border-zinc-800' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                            {detailedImages.map((imgUrl, i) => (
                                                <div key={i} className={`relative group aspect-square rounded-xl overflow-hidden border shadow-xs ${
                                                    isDark ? 'border-zinc-700' : 'border-gray-200'
                                                }`}>
                                                    <img src={imgUrl} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    <button
                                                        type="button"
                                                        onClick={() => this.handleRemoveImageFromGallery(i)}
                                                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-lg hover:bg-red-700 shadow-md cursor-pointer transition-colors"
                                                        title="Remover foto"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={`p-4 rounded-xl border text-center text-xs italic ${
                                            isDark ? 'bg-[#18181A] border-zinc-800 text-zinc-500' : 'bg-gray-50 border-gray-200 text-gray-400'
                                        }`}>
                                            Nenhuma foto adicionada até o momento. Faça upload acima para exibir na galeria do cliente.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer Controls */}
                    <div className={`flex items-center justify-between pt-4 mt-2 border-t shrink-0 ${
                        isDark ? 'border-zinc-800' : 'border-gray-100'
                    }`}>
                        <div>
                            {serviceModalStep > 1 ? (
                                <button 
                                    type="button"
                                    onClick={() => this.setState({ serviceModalStep: serviceModalStep - 1 })}
                                    className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                                        isDark ? 'bg-[#18181A] border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <ArrowLeft size={14} /> Anterior
                                </button>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={() => this.setState({ showServiceModal: false })} 
                                    className={`px-4 py-2.5 font-semibold text-xs cursor-pointer ${
                                        isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {serviceModalStep < 3 && (
                                <button 
                                    type="button"
                                    onClick={() => this.setState({ serviceModalStep: serviceModalStep + 1 })}
                                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                                        isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                                    }`}
                                >
                                    Próximo Passo <ArrowRight size={14} />
                                </button>
                            )}

                            <button 
                                type="button"
                                onClick={this.handleSaveService} 
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl transition-all font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                                <Check size={16} />
                                <span>{editingServiceId ? 'SALVAR ALTERAÇÕES' : 'SALVAR SERVIÇO'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    handleToggleHideReview = async (id: string) => {
        await this.reviewRepo.toggleHidden(id);
        this.loadData();
    }

    handleSaveReviewReply = async (id: string) => {
        await this.reviewRepo.reply(id, this.state.replyText.trim() || null);
        this.setState({ replyingReviewId: null, replyText: '' }, this.loadData);
    }

    renderReviewsManagement() {
        const { reviews, replyingReviewId, replyText, theme } = this.state;
        const isDark = theme === 'dark';
        const visibleCount = reviews.filter(r => !r.hidden).length;
        const hiddenCount = reviews.filter(r => r.hidden).length;

        return (
            <div className={`flex flex-col h-full overflow-hidden transition-colors ${
                isDark ? 'bg-[#18181A] text-zinc-100' : 'bg-[#F9FAFB] text-gray-800'
            }`}>
                <header className={`shrink-0 border-b p-4 sm:p-6 md:px-8 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                }`}>
                    <div>
                        <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Gestão de Avaliações e Depoimentos</h2>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Modere comentários, responda clientes e controle o que aparece na Landing Page</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                isDark ? 'bg-emerald-950/60 border-emerald-900/50 text-emerald-400' : 'bg-green-100 border-green-200 text-green-800'
                            }`}>
                                {visibleCount} Visíveis
                            </span>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                            }`}>
                                {hiddenCount} Ocultos
                            </span>
                        </div>
                    </div>
                </header>

                <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                    {reviews.length === 0 ? (
                        <div className={`border rounded-xl p-8 text-center text-sm ${
                            isDark ? 'bg-[#222226] border-zinc-800 text-zinc-400' : 'bg-white border-gray-200 text-gray-500'
                        }`}>
                            Nenhuma avaliação recebida até o momento.
                        </div>
                    ) : (
                        reviews.map(review => (
                            <div 
                                key={review.id} 
                                className={`border rounded-xl p-5 shadow-sm transition-all space-y-3 ${
                                    isDark 
                                        ? (review.hidden ? 'bg-[#1e1e21] border-zinc-800 opacity-70' : 'bg-[#222226] border-zinc-800 hover:border-red-900/50') 
                                        : (review.hidden ? 'bg-gray-50/50 border-gray-300 opacity-75' : 'bg-white border-gray-200 hover:border-red-200')
                                }`}
                            >
                                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3 ${
                                    isDark ? 'border-zinc-800' : 'border-gray-100'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex text-yellow-400">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} size={16} className={star <= review.rating ? "fill-current" : (isDark ? "text-zinc-700" : "text-gray-300")} />
                                            ))}
                                        </div>
                                        <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{review.authorName}</h4>
                                        <span className={`text-xs font-mono font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>({review.carModel})</span>
                                        <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>• {review.date}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                                            review.hidden 
                                                ? (isDark ? 'bg-amber-950/60 border-amber-900/50 text-amber-400' : 'bg-amber-100 border-amber-200 text-amber-800') 
                                                : (isDark ? 'bg-emerald-950/60 border-emerald-900/50 text-emerald-400' : 'bg-green-100 border-green-200 text-green-800')
                                        }`}>
                                            {review.hidden ? 'OCULTO NA LANDING PAGE' : 'VISÍVEL NO SITE'}
                                        </span>

                                        <button 
                                            onClick={() => this.handleToggleHideReview(review.id)}
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                                review.hidden 
                                                    ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 shadow-xs' 
                                                    : (isDark ? 'bg-[#18181A] text-amber-300 border-zinc-700 hover:bg-zinc-800' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50 shadow-xs')
                                            }`}
                                            title={review.hidden ? "Exibir no site" : "Ocultar do site"}
                                        >
                                            {review.hidden ? <Eye size={15} /> : <EyeOff size={15} />}
                                            <span>{review.hidden ? 'Exibir no Site' : 'Ocultar Avaliação'}</span>
                                        </button>
                                    </div>
                                </div>

                                <p className={`text-sm leading-relaxed font-normal ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>
                                    "{review.comment}"
                                </p>

                                {/* Owner Reply Box or Form */}
                                {replyingReviewId === review.id ? (
                                    <div className={`border rounded-xl p-4 space-y-3 mt-3 ${
                                        isDark ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50/50 border-red-200'
                                    }`}>
                                        <label className="block text-xs font-bold text-red-500 flex items-center gap-1.5">
                                            <CornerDownRight size={14} /> Escrever Resposta Oficial do FelipCar:
                                        </label>
                                        <textarea 
                                            value={replyText}
                                            onChange={(e) => this.setState({ replyText: e.target.value })}
                                            placeholder="Digite sua resposta pública para este cliente..."
                                            rows={2}
                                            className={`w-full border px-3 py-2 rounded-lg text-xs font-medium focus:outline-none focus:border-red-500 resize-none ${
                                                isDark ? 'bg-[#18181A] border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                                            }`}
                                        ></textarea>
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => this.setState({ replyingReviewId: null, replyText: '' })}
                                                className={`px-3 py-1.5 text-xs font-medium cursor-pointer ${
                                                    isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={() => this.handleSaveReviewReply(review.id)}
                                                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                                            >
                                                Salvar Resposta
                                            </button>
                                        </div>
                                    </div>
                                ) : review.ownerReply ? (
                                    <div className={`border-l-4 border-red-600 rounded-r-xl p-3.5 border flex justify-between items-start gap-4 mt-2 ${
                                        isDark ? 'bg-[#1a1a1d] border-zinc-800' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                                                <CornerDownRight size={14} /> Sua Resposta Oficial:
                                            </div>
                                            <p className={`text-xs pl-5 font-medium ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>{review.ownerReply}</p>
                                        </div>
                                        <button 
                                            onClick={() => this.setState({ replyingReviewId: review.id, replyText: review.ownerReply || '' })}
                                            className="text-xs text-red-500 hover:underline font-bold shrink-0 cursor-pointer"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-1">
                                        <button 
                                            onClick={() => this.setState({ replyingReviewId: review.id, replyText: '' })}
                                            className="text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                                        >
                                            <CornerDownRight size={14} /> Responder a este cliente
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    renderBusinessHoursManagement() {
        const { businessHours, showHoursSaveToast, theme } = this.state;
        const isDark = theme === 'dark';
        const operatingHoursPreview = getOperatingHours(businessHours);

        return (
            <div className={`flex flex-col h-full overflow-y-auto transition-colors ${
                isDark ? 'bg-[#18181A] text-zinc-100' : 'bg-[#F9FAFB] text-gray-800'
            }`}>
                <header className={`shrink-0 border-b p-4 sm:p-6 md:px-8 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                }`}>
                    <div>
                        <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Horários de Serviço & Atendimento</h2>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Gerencie horários de funcionamento, intervalo das vagas e pausa de almoço</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {showHoursSaveToast && (
                            <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-in fade-in flex items-center gap-1.5 shrink-0">
                                <CheckCircle2 size={14} /> Salvo & Aplicado no Site!
                            </div>
                        )}
                    </div>
                </header>

                <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl">
                    {/* Main Settings Card */}
                    <div className={`border rounded-xl p-6 shadow-sm transition-colors ${
                        isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                    }`}>
                        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-zinc-700/50">
                            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                <Clock size={22} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Grade de Funcionamento Online
                                </h3>
                                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                    Estes parâmetros definem os horários exatos que aparecerão para os clientes ao agendar um serviço.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* Horário de Abertura */}
                            <div>
                                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>
                                    Horário de Abertura
                                </label>
                                <select 
                                    value={businessHours.startHour}
                                    onChange={(e) => {
                                        const newStart = e.target.value;
                                        this.handleUpdateBusinessHours({ startHour: newStart });
                                    }}
                                    className={`w-full text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none transition-all cursor-pointer ${
                                        isDark ? 'bg-[#18181A] border-zinc-700 text-white focus:border-red-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-600'
                                    }`}
                                >
                                    {['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'].map(h => (
                                        <option key={h} value={h} className={isDark ? 'bg-[#18181A]' : ''}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Horário de Fechamento */}
                            <div>
                                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>
                                    Horário de Fechamento
                                </label>
                                <select 
                                    value={businessHours.endHour}
                                    onChange={(e) => {
                                        const newEnd = e.target.value;
                                        this.handleUpdateBusinessHours({ endHour: newEnd });
                                    }}
                                    className={`w-full text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none transition-all cursor-pointer ${
                                        isDark ? 'bg-[#18181A] border-zinc-700 text-white focus:border-red-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-600'
                                    }`}
                                >
                                    {['16:00', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '21:00', '22:00'].map(h => (
                                        <option key={h} value={h} className={isDark ? 'bg-[#18181A]' : ''}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Intervalo entre Slots */}
                            <div>
                                <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>
                                    Intervalo das Vagas
                                </label>
                                <select 
                                    value={businessHours.slotIntervalMinutes}
                                    onChange={(e) => this.handleUpdateBusinessHours({ slotIntervalMinutes: Number(e.target.value) })}
                                    className={`w-full text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none transition-all cursor-pointer ${
                                        isDark ? 'bg-[#18181A] border-zinc-700 text-white focus:border-red-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-red-600'
                                    }`}
                                >
                                    <option value={30} className={isDark ? 'bg-[#18181A]' : ''}>A cada 30 minutos</option>
                                    <option value={60} className={isDark ? 'bg-[#18181A]' : ''}>A cada 1 hora (60 min)</option>
                                    <option value={90} className={isDark ? 'bg-[#18181A]' : ''}>A cada 1h 30min</option>
                                    <option value={120} className={isDark ? 'bg-[#18181A]' : ''}>A cada 2 horas</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lunch Break Settings Card */}
                    <div className={`border rounded-xl p-6 shadow-sm transition-colors ${
                        isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                    }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-5 border-b border-zinc-700/50">
                            <div>
                                <h3 className={`font-bold text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Pausa para Almoço / Intervalo
                                    {businessHours.lunchBreakEnabled && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                            Pausa Ativa
                                        </span>
                                    )}
                                </h3>
                                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                    Bloqueie automaticamente o agendamento de vagas durante o período de almoço.
                                </p>
                            </div>

                            <button
                                onClick={() => this.handleUpdateBusinessHours({ lunchBreakEnabled: !businessHours.lunchBreakEnabled })}
                                className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                                    businessHours.lunchBreakEnabled
                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                                        : (isDark ? 'bg-[#18181A] border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100')
                                }`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${businessHours.lunchBreakEnabled ? 'bg-amber-400 shadow-sm' : 'bg-zinc-600'}`}></span>
                                {businessHours.lunchBreakEnabled ? 'Desativar Pausa' : 'Ativar Pausa de Almoço'}
                            </button>
                        </div>

                        {businessHours.lunchBreakEnabled ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                                            Início do Almoço
                                        </label>
                                        <select 
                                            value={businessHours.lunchStartHour}
                                            onChange={(e) => this.handleUpdateBusinessHours({ lunchStartHour: e.target.value })}
                                            className={`w-full text-xs font-bold rounded-xl px-3 py-2 border outline-none transition-all cursor-pointer ${
                                                isDark ? 'bg-[#18181A] border-zinc-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-600'
                                            }`}
                                        >
                                            {['11:00', '11:30', '12:00', '12:30', '13:00'].map(h => (
                                                <option key={h} value={h} className={isDark ? 'bg-[#18181A]' : ''}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                                            Fim do Almoço
                                        </label>
                                        <select 
                                            value={businessHours.lunchEndHour}
                                            onChange={(e) => this.handleUpdateBusinessHours({ lunchEndHour: e.target.value })}
                                            className={`w-full text-xs font-bold rounded-xl px-3 py-2 border outline-none transition-all cursor-pointer ${
                                                isDark ? 'bg-[#18181A] border-zinc-700 text-white focus:border-amber-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-amber-600'
                                            }`}
                                        >
                                            {['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'].map(h => (
                                                <option key={h} value={h} className={isDark ? 'bg-[#18181A]' : ''}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                                    isDark ? 'bg-amber-950/30 text-amber-200 border border-amber-900/40' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                    <Clock size={15} className="shrink-0 text-amber-400" />
                                    <span>Nenhuma vaga de agendamento será liberada das <strong>{businessHours.lunchStartHour}</strong> às <strong>{businessHours.lunchEndHour}</strong>.</span>
                                </div>
                            </div>
                        ) : (
                            <p className={`text-xs italic ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                                Pausa de almoço desativada. Horários contínuos das {businessHours.startHour} às {businessHours.endHour}.
                            </p>
                        )}
                    </div>

                    {/* Live Preview Card */}
                    <div className={`border rounded-xl p-6 shadow-sm transition-colors ${
                        isDark ? 'bg-[#222226] border-zinc-800' : 'bg-white border-gray-200'
                    }`}>
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-700/50">
                            <div>
                                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Pré-visualização dos Slots de Atendimento no Site do Cliente
                                </h3>
                                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                                    Os clientes verão os seguintes horários disponíveis para seleção:
                                </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-950/60 text-red-400 border border-red-900/50">
                                {operatingHoursPreview.length} slots gerados
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {operatingHoursPreview.map(h => (
                                <span 
                                    key={h} 
                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                                        isDark 
                                            ? 'bg-[#18181A] border-zinc-700 text-zinc-200' 
                                            : 'bg-gray-50 border-gray-200 text-gray-800'
                                    }`}
                                >
                                    {h}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { theme, activeTab } = this.state;
        const isDark = theme === 'dark';

        return (
            <div className={`flex flex-col md:flex-row h-screen font-sans overflow-hidden transition-colors relative ${
                isDark ? 'bg-[#18181A] text-zinc-100' : 'bg-[#F9FAFB] text-gray-800'
            }`}>
                {/* Mobile Top Header */}
                <div className={`md:hidden border-b flex items-center justify-between px-4 py-3 shrink-0 transition-colors z-20 ${
                    isDark ? 'bg-[#1F1F21] border-zinc-800' : 'bg-white border-gray-200'
                }`}>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-red-600">FELIP<span className={isDark ? 'text-white' : 'text-gray-900'}>CAR</span> <span className="text-xs font-semibold text-zinc-400">Administrativo</span></h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <InstallPWA isDark={isDark} />
                        <button 
                            onClick={this.props.onLogout}
                            className={`p-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                                isDark ? 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="Sair do Painel"
                        >
                            <LogOut size={15} />
                            <span className="text-xs">Sair</span>
                        </button>
                    </div>
                </div>

                {/* Desktop Sidebar */}
                <div className={`w-[240px] border-r hidden md:flex flex-col p-6 shrink-0 shadow-sm z-10 transition-colors ${
                    isDark ? 'bg-[#1F1F21] border-zinc-800' : 'bg-white border-gray-200'
                }`}>
                    <div className="mb-10">
                        <h1 className="text-2xl font-bold tracking-tighter text-red-600">FELIP<span className={isDark ? 'text-white' : 'text-gray-900'}>CAR</span></h1>
                        <p className={`text-[10px] tracking-[3px] uppercase mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Administrativo</p>
                    </div>
                    
                    <nav className="flex flex-col gap-2 flex-grow">
                        <div 
                            className={`p-3 rounded flex items-center gap-3 cursor-pointer transition-colors ${
                                this.state.activeTab === 'AGENDA' 
                                    ? (isDark ? 'border-l-4 border-red-500 bg-red-950/40 text-red-400 font-bold' : 'border-l-4 border-red-600 bg-red-50 text-red-700 font-bold') 
                                    : (isDark ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                            }`}
                            onClick={() => this.setState({ activeTab: 'AGENDA', showProfileMenu: false })}
                        >
                            <CalendarIcon size={18} />
                            <span className="font-medium">Agenda & Caixa</span>
                        </div>
                        <div 
                            className={`p-3 rounded flex items-center gap-3 cursor-pointer transition-colors ${
                                this.state.activeTab === 'HOURS' 
                                    ? (isDark ? 'border-l-4 border-red-500 bg-red-950/40 text-red-400 font-bold' : 'border-l-4 border-red-600 bg-red-50 text-red-700 font-bold') 
                                    : (isDark ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                            }`}
                            onClick={() => this.setState({ activeTab: 'HOURS', showProfileMenu: false })}
                        >
                            <Clock size={18} />
                            <span className="font-medium">Horários</span>
                        </div>
                        <div 
                            className={`p-3 rounded flex items-center gap-3 cursor-pointer transition-colors ${
                                this.state.activeTab === 'CATALOG' 
                                    ? (isDark ? 'border-l-4 border-red-500 bg-red-950/40 text-red-400 font-bold' : 'border-l-4 border-red-600 bg-red-50 text-red-700 font-bold') 
                                    : (isDark ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                            }`}
                            onClick={() => this.setState({ activeTab: 'CATALOG', showProfileMenu: false })}
                        >
                            <List size={18} />
                            <span className="font-medium">Catálogo</span>
                        </div>
                        <div 
                            className={`p-3 rounded flex items-center gap-3 cursor-pointer transition-colors ${
                                this.state.activeTab === 'REVIEWS' 
                                    ? (isDark ? 'border-l-4 border-red-500 bg-red-950/40 text-red-400 font-bold' : 'border-l-4 border-red-600 bg-red-50 text-red-700 font-bold') 
                                    : (isDark ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                            }`}
                            onClick={() => this.setState({ activeTab: 'REVIEWS', showProfileMenu: false })}
                        >
                            <MessageSquare size={18} />
                            <span className="font-medium">Avaliações</span>
                        </div>
                    </nav>

                    <div className="mt-auto relative">
                        {this.state.showProfileMenu && (
                            <div className={`absolute bottom-full left-0 w-full mb-2 border rounded-lg shadow-lg overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                                isDark ? 'bg-[#222226] border-zinc-700' : 'bg-white border-gray-200'
                            }`}>
                                <button className={`flex items-center gap-2 p-3 text-sm transition-colors text-left border-b ${
                                    isDark ? 'text-zinc-200 hover:bg-zinc-800 border-zinc-700' : 'text-gray-700 hover:bg-gray-50 border-gray-100'
                                }`}>
                                    <User size={16} /> Editar Perfil
                                </button>
                                <button 
                                    onClick={this.props.onLogout}
                                    className={`flex items-center gap-2 p-3 text-sm text-red-500 transition-colors text-left font-medium ${
                                        isDark ? 'hover:bg-red-950/40' : 'hover:bg-red-50'
                                    }`}
                                >
                                    <LogOut size={16} /> Sair
                                </button>
                            </div>
                        )}
                        <div 
                            className={`p-4 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                                isDark ? 'bg-[#222226] border-zinc-800 hover:bg-zinc-800' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => this.setState(prev => ({ showProfileMenu: !prev.showProfileMenu }))}
                        >
                            <div>
                                <p className={`text-[10px] mb-1 uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Conta Logada</p>
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Felipe S. Lima</p>
                            </div>
                            <ChevronUp size={16} className={`transition-transform duration-200 ${isDark ? 'text-zinc-400' : 'text-gray-500'} ${this.state.showProfileMenu ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>

                {/* Main Content Area with Bottom Padding on Mobile for Bottom Nav */}
                <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
                    {this.state.activeTab === 'AGENDA' && this.renderAgenda()}
                    {this.state.activeTab === 'HOURS' && this.renderBusinessHoursManagement()}
                    {this.state.activeTab === 'CATALOG' && this.renderCatalog()}
                    {this.state.activeTab === 'REVIEWS' && this.renderReviewsManagement()}
                </div>

                {/* Mobile Bottom Navigation Bar */}
                <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg px-2 py-1 flex items-center justify-around shadow-2xl transition-colors ${
                    isDark ? 'bg-[#18181C]/95 border-zinc-800 text-zinc-400' : 'bg-white/95 border-gray-200 text-gray-500'
                }`}>
                    <button
                        onClick={() => this.setState({ activeTab: 'AGENDA' })}
                        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer relative min-w-[68px] ${
                            activeTab === 'AGENDA'
                                ? 'text-red-500 font-extrabold'
                                : (isDark ? 'hover:text-zinc-200' : 'hover:text-gray-800')
                        }`}
                    >
                        <CalendarIcon size={20} className={activeTab === 'AGENDA' ? 'text-red-500 scale-110 transition-transform' : ''} />
                        <span className="text-[10px] mt-1 font-bold">Agenda</span>
                        {activeTab === 'AGENDA' && (
                            <span className="absolute top-0 w-8 h-1 rounded-b-full bg-red-600 shadow-xs"></span>
                        )}
                    </button>

                    <button
                        onClick={() => this.setState({ activeTab: 'HOURS' })}
                        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer relative min-w-[68px] ${
                            activeTab === 'HOURS'
                                ? 'text-red-500 font-extrabold'
                                : (isDark ? 'hover:text-zinc-200' : 'hover:text-gray-800')
                        }`}
                    >
                        <Clock size={20} className={activeTab === 'HOURS' ? 'text-red-500 scale-110 transition-transform' : ''} />
                        <span className="text-[10px] mt-1 font-bold">Horários</span>
                        {activeTab === 'HOURS' && (
                            <span className="absolute top-0 w-8 h-1 rounded-b-full bg-red-600 shadow-xs"></span>
                        )}
                    </button>

                    <button
                        onClick={() => this.setState({ activeTab: 'CATALOG' })}
                        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer relative min-w-[68px] ${
                            activeTab === 'CATALOG'
                                ? 'text-red-500 font-extrabold'
                                : (isDark ? 'hover:text-zinc-200' : 'hover:text-gray-800')
                        }`}
                    >
                        <List size={20} className={activeTab === 'CATALOG' ? 'text-red-500 scale-110 transition-transform' : ''} />
                        <span className="text-[10px] mt-1 font-bold">Catálogo</span>
                        {activeTab === 'CATALOG' && (
                            <span className="absolute top-0 w-8 h-1 rounded-b-full bg-red-600 shadow-xs"></span>
                        )}
                    </button>

                    <button
                        onClick={() => this.setState({ activeTab: 'REVIEWS' })}
                        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer relative min-w-[68px] ${
                            activeTab === 'REVIEWS'
                                ? 'text-red-500 font-extrabold'
                                : (isDark ? 'hover:text-zinc-200' : 'hover:text-gray-800')
                        }`}
                    >
                        <MessageSquare size={20} className={activeTab === 'REVIEWS' ? 'text-red-500 scale-110 transition-transform' : ''} />
                        <span className="text-[10px] mt-1 font-bold">Avaliações</span>
                        {activeTab === 'REVIEWS' && (
                            <span className="absolute top-0 w-8 h-1 rounded-b-full bg-red-600 shadow-xs"></span>
                        )}
                    </button>
                </div>
            </div>
        );
    }
}
