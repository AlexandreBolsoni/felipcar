export type BusinessHoursConfig = {
    startHour: string;
    endHour: string;
    slotIntervalMinutes: number;
    weekdaySchedule: string;
    saturdaySchedule: string;
    sundaySchedule: string;
    lunchBreakEnabled: boolean;
    lunchStartHour: string;
    lunchEndHour: string;
};

const DEFAULT_CONFIG: BusinessHoursConfig = {
    startHour: '08:00',
    endHour: '18:00',
    slotIntervalMinutes: 60,
    weekdaySchedule: 'Segunda a Sexta: 08:00 às 18:00',
    saturdaySchedule: 'Sábado: 08:00 às 17:00',
    sundaySchedule: 'Domingo / Feriados: Sob Consulta',
    lunchBreakEnabled: false,
    lunchStartHour: '12:00',
    lunchEndHour: '13:00'
};

export class MockBusinessHoursRepository {
    private static instance: MockBusinessHoursRepository;
    private config: BusinessHoursConfig;

    private constructor() {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('felipcar_business_hours') : null;
        if (saved) {
            try {
                this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
            } catch (e) {
                this.config = { ...DEFAULT_CONFIG };
            }
        } else {
            this.config = { ...DEFAULT_CONFIG };
        }
    }

    public static getInstance(): MockBusinessHoursRepository {
        if (!MockBusinessHoursRepository.instance) {
            MockBusinessHoursRepository.instance = new MockBusinessHoursRepository();
        }
        return MockBusinessHoursRepository.instance;
    }

    public get(): BusinessHoursConfig {
        return { ...this.config };
    }

    public update(newConfig: Partial<BusinessHoursConfig>): BusinessHoursConfig {
        this.config = { ...this.config, ...newConfig };
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('felipcar_business_hours', JSON.stringify(this.config));
        }
        return { ...this.config };
    }
}
