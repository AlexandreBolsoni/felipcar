import { Appointment } from '../../domain/entities/Appointment';

export class MockAppointmentRepository {
    private static instance: MockAppointmentRepository;
    private appointments: Appointment[] = [];

    private constructor() {
        const today = new Date().toISOString().split('T')[0];
        this.appointments = [
            new Appointment('1', 'João Silva', '11999999999', 'Honda Civic', 'ABC-1234', '1', today, '09:00', 'PENDING'),
            new Appointment('2', 'Maria Souza', '11988888888', 'Toyota Corolla', 'XYZ-5678', '2', today, '14:00', 'COMPLETED')
        ];
    }

    public static getInstance(): MockAppointmentRepository {
        if (!MockAppointmentRepository.instance) {
            MockAppointmentRepository.instance = new MockAppointmentRepository();
        }
        return MockAppointmentRepository.instance;
    }

    public getAll(): Appointment[] {
        return [...this.appointments];
    }
    
    public getByDate(date: string): Appointment[] {
        return this.appointments.filter(a => a.date === date);
    }

    public add(appointment: Appointment): void {
        this.appointments.push(appointment);
    }

    public update(appointment: Appointment): void {
        const index = this.appointments.findIndex(a => a.id === appointment.id);
        if (index !== -1) {
            this.appointments[index] = appointment;
        }
    }
}
