import React, { Component } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Appointment } from '../domain/entities/Appointment';

type CalendarViewProps = {
    selectedDate: string; // YYYY-MM-DD
    onSelectDate: (dateStr: string) => void;
    allAppointments?: Appointment[];
    theme?: 'light' | 'dark';
};

type CalendarViewState = {
    currentYear: number;
    currentMonth: number;
};

export class CalendarView extends Component<CalendarViewProps, CalendarViewState> {
    declare state: CalendarViewState;

    constructor(props: CalendarViewProps) {
        super(props);
        const initialDate = props.selectedDate ? new Date(props.selectedDate + 'T00:00:00') : new Date();
        this.state = {
            currentYear: initialDate.getFullYear(),
            currentMonth: initialDate.getMonth()
        };
    }

    componentDidUpdate(prevProps: CalendarViewProps) {
        if (prevProps.selectedDate !== this.props.selectedDate && this.props.selectedDate) {
            const dateObj = new Date(this.props.selectedDate + 'T00:00:00');
            if (!isNaN(dateObj.getTime())) {
                if (dateObj.getFullYear() !== this.state.currentYear || dateObj.getMonth() !== this.state.currentMonth) {
                    this.setState({
                        currentYear: dateObj.getFullYear(),
                        currentMonth: dateObj.getMonth()
                    });
                }
            }
        }
    }

    handlePrevMonth = () => {
        this.setState(prev => {
            if (prev.currentMonth === 0) {
                return { currentYear: prev.currentYear - 1, currentMonth: 11 };
            }
            return { currentYear: prev.currentYear, currentMonth: prev.currentMonth - 1 };
        });
    };

    handleNextMonth = () => {
        this.setState(prev => {
            if (prev.currentMonth === 11) {
                return { currentYear: prev.currentYear + 1, currentMonth: 0 };
            }
            return { currentYear: prev.currentYear, currentMonth: prev.currentMonth + 1 };
        });
    };

    handleToday = () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        this.setState({
            currentYear: today.getFullYear(),
            currentMonth: today.getMonth()
        });
        this.props.onSelectDate(todayStr);
    };

    formatMonthYear(year: number, month: number): string {
        const date = new Date(year, month, 1);
        const monthName = date.toLocaleString('pt-BR', { month: 'long' });
        return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
    }

    render() {
        const { selectedDate, onSelectDate, allAppointments = [] } = this.props;
        const { currentYear, currentMonth } = this.state;

        // Days of week
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        // Calculate days in month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        // Calculate appointments by date map for indicators
        const appointmentsByDate = new Map<string, number>();
        allAppointments.forEach(app => {
            if (app.status !== 'CANCELLED') {
                const count = appointmentsByDate.get(app.date) || 0;
                appointmentsByDate.set(app.date, count + 1);
            }
        });

        const todayStr = new Date().toISOString().split('T')[0];

        // Generate calendar grid cells
        const calendarGrid = [];

        // Previous month padding days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            calendarGrid.push({
                type: 'prev',
                dayNum,
                dateStr: ''
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const m = (currentMonth + 1).toString().padStart(2, '0');
            const d = day.toString().padStart(2, '0');
            const dateStr = `${currentYear}-${m}-${d}`;
            calendarGrid.push({
                type: 'current',
                dayNum: day,
                dateStr
            });
        }

        // Next month padding days to complete 35 or 42 cells grid
        const totalCells = calendarGrid.length > 35 ? 42 : 35;
        const remainingCells = totalCells - calendarGrid.length;
        for (let i = 1; i <= remainingCells; i++) {
            calendarGrid.push({
                type: 'next',
                dayNum: i,
                dateStr: ''
            });
        }

        const isLight = this.props.theme === 'light';

        return (
            <div className={`border rounded-xl p-5 shadow-sm transition-colors ${
                isLight ? 'bg-white border-gray-200 text-gray-800' : 'bg-[#222226] border-zinc-800 text-zinc-200'
            }`}>
                {/* Header controls */}
                <div className={`flex items-center justify-between mb-4 pb-3 border-b ${
                    isLight ? 'border-gray-100' : 'border-zinc-800'
                }`}>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="text-red-500" size={20} />
                        <h3 className={`font-bold text-lg ${isLight ? 'text-gray-900' : 'text-white'}`}>
                            {this.formatMonthYear(currentYear, currentMonth)}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={this.handleToday}
                            className={`text-xs px-2.5 py-1.5 rounded font-medium transition-colors border mr-2 cursor-pointer ${
                                isLight 
                                    ? 'text-gray-700 hover:bg-gray-100 border-gray-200' 
                                    : 'text-zinc-300 hover:bg-zinc-800 border-zinc-700'
                            }`}
                        >
                            Hoje
                        </button>
                        <button
                            onClick={this.handlePrevMonth}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                                isLight 
                                    ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' 
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                            title="Mês anterior"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={this.handleNextMonth}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                                isLight 
                                    ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' 
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                            title="Próximo mês"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 text-center mb-2">
                    {weekDays.map((wd, idx) => (
                        <span key={wd} className={`text-xs font-semibold py-1 ${
                            idx === 0 || idx === 6 
                                ? (isLight ? 'text-red-600' : 'text-red-400') 
                                : (isLight ? 'text-gray-400' : 'text-zinc-400')
                        }`}>
                            {wd}
                        </span>
                    ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                    {calendarGrid.map((cell, index) => {
                        if (cell.type !== 'current') {
                            return (
                                <div key={index} className={`h-10 flex items-center justify-center text-xs ${
                                    isLight ? 'text-gray-300' : 'text-zinc-600'
                                }`}>
                                    {cell.dayNum}
                                </div>
                            );
                        }

                        const isSelected = cell.dateStr === selectedDate;
                        const isToday = cell.dateStr === todayStr;
                        const appCount = appointmentsByDate.get(cell.dateStr) || 0;

                        return (
                            <button
                                key={index}
                                onClick={() => onSelectDate(cell.dateStr)}
                                className={`h-10 rounded-lg flex flex-col items-center justify-center relative transition-all text-xs font-medium cursor-pointer ${
                                    isSelected
                                        ? 'bg-red-600 text-white font-bold shadow-md scale-105 z-10'
                                        : isToday
                                        ? (isLight 
                                            ? 'border-2 border-red-500 text-red-600 font-bold bg-red-50 hover:bg-red-100' 
                                            : 'border-2 border-red-500 text-white bg-red-950/30 hover:bg-red-950/50')
                                        : (isLight 
                                            ? 'hover:bg-gray-100 text-gray-800' 
                                            : 'hover:bg-zinc-800/80 text-zinc-200')
                                }`}
                            >
                                <span>{cell.dayNum}</span>
                                {appCount > 0 && (
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                isSelected ? 'bg-white' : 'bg-red-500'
                                            }`}
                                        />
                                        {appCount > 1 && (
                                            <span className={`text-[9px] leading-none ${
                                                isSelected ? 'text-white' : (isLight ? 'text-red-600 font-bold' : 'text-red-400 font-bold')
                                            }`}>
                                                {appCount}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }
}
