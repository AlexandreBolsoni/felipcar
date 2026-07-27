import { Appointment } from '../domain/entities/Appointment';
import { Service } from '../domain/entities/Service';
import { MockBusinessHoursRepository, BusinessHoursConfig } from '../infrastructure/repositories/MockBusinessHoursRepository';

export const OPERATING_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export function getOperatingHours(customConfig?: BusinessHoursConfig): string[] {
    const config = customConfig || MockBusinessHoursRepository.getInstance().get();
    const startMin = timeToMinutes(config.startHour || '08:00');
    const endMin = timeToMinutes(config.endHour || '18:00');
    const step = config.slotIntervalMinutes || 60;

    const lunchStartMin = timeToMinutes(config.lunchStartHour || '12:00');
    const lunchEndMin = timeToMinutes(config.lunchEndHour || '13:00');

    const hours: string[] = [];
    for (let current = startMin; current <= endMin; current += step) {
        if (config.lunchBreakEnabled && current >= lunchStartMin && current < lunchEndMin) {
            continue;
        }
        hours.push(minutesToTime(current));
    }

    if (hours.length === 0) {
        return OPERATING_HOURS;
    }

    return hours;
}

export function timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export type SlotInfo = {
    hour: string;
    isOccupied: boolean;
    isBlocked: boolean; // Occupied as a continuation of a multi-hour service
    isPrimary: boolean; // Start slot of an appointment
    appointment?: Appointment;
    primaryAppointment?: Appointment; // Reference to the appointment that blocked this slot
    service?: Service;
    endHourStr?: string;
};

export function getSlotInfo(
    hour: string,
    appointments: Appointment[],
    services: Service[]
): SlotInfo {
    const slotMin = timeToMinutes(hour);
    const activeAppointments = appointments.filter(a => a.status !== 'CANCELLED');

    for (const app of activeAppointments) {
        const appService = services.find(s => s.id === app.serviceId);
        const duration = appService ? appService.durationMinutes : 60;
        const appStartMin = timeToMinutes(app.hour);
        const appEndMin = appStartMin + duration;

        if (slotMin >= appStartMin && slotMin < appEndMin) {
            const isPrimary = slotMin === appStartMin;
            return {
                hour,
                isOccupied: true,
                isBlocked: !isPrimary,
                isPrimary,
                appointment: isPrimary ? app : undefined,
                primaryAppointment: app,
                service: appService,
                endHourStr: minutesToTime(appEndMin)
            };
        }
    }

    return {
        hour,
        isOccupied: false,
        isBlocked: false,
        isPrimary: false
    };
}

export function checkBookingConflict(
    startHour: string,
    serviceDurationMinutes: number,
    appointments: Appointment[],
    services: Service[],
    currentAppointmentId?: string,
    customClosingHour?: string
): { hasConflict: boolean; reason?: string; endTimeStr?: string } {
    const startMin = timeToMinutes(startHour);
    const endMin = startMin + serviceDurationMinutes;
    
    const closingHourStr = customClosingHour || MockBusinessHoursRepository.getInstance().get().endHour || '18:00';
    // Closing time threshold in minutes + 60 min grace for multi-hour finish
    const closingMin = timeToMinutes(closingHourStr) + 60;

    let endTimeStr = minutesToTime(endMin);
    if (serviceDurationMinutes >= 1200) {
        endTimeStr = `${closingHourStr} (em 2 dias)`;
    } else if (serviceDurationMinutes >= 600) {
        endTimeStr = `${closingHourStr} (próximo dia)`;
    }

    // Check if single day service (less than 600 min) exceeds operational hours on same day
    if (serviceDurationMinutes < 600 && endMin > closingMin) {
        return {
            hasConflict: true,
            reason: `O serviço dura ${serviceDurationMinutes} min e excederia o horário de funcionamento (${closingHourStr}).`,
            endTimeStr
        };
    }

    const activeAppointments = appointments.filter(a => a.status !== 'CANCELLED' && a.id !== currentAppointmentId);

    for (const app of activeAppointments) {
        const appService = services.find(s => s.id === app.serviceId);
        const appDuration = appService ? appService.durationMinutes : 60;
        const appStartMin = timeToMinutes(app.hour);
        const appEndMin = appStartMin + appDuration;

        // Check interval overlap: [startMin, endMin) overlaps with [appStartMin, appEndMin)
        if (startMin < appEndMin && endMin > appStartMin) {
            const conflictServiceTitle = appService ? appService.title : 'Outro serviço';
            return {
                hasConflict: true,
                reason: `Conflito de horário com o agendamento de ${app.clientName} (${conflictServiceTitle}, das ${app.hour} às ${minutesToTime(appEndMin)}).`,
                endTimeStr
            };
        }
    }

    return { hasConflict: false, endTimeStr };
}

