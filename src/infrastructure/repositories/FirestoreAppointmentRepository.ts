import { db } from '../../lib/firebase';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { Appointment, AppointmentStatus } from '../../domain/entities/Appointment';

type FirestoreAppointmentData = {
  clientName: string;
  clientPhone: string;
  carModel: string;
  carPlate: string;
  serviceId: string;
  date: string;
  hour: string;
  status: AppointmentStatus;
};

function mapToAppointment(id: string, data: FirestoreAppointmentData): Appointment {
  return new Appointment(
    id,
    data.clientName,
    data.clientPhone,
    data.carModel,
    data.carPlate,
    data.serviceId,
    data.date,
    data.hour,
    data.status
  );
}

export class FirestoreAppointmentRepository {
  async getAll(): Promise<Appointment[]> {
    const q = query(collection(db, 'appointments'), orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapToAppointment(d.id, d.data() as FirestoreAppointmentData));
  }

  async getByDate(date: string): Promise<Appointment[]> {
    const q = query(collection(db, 'appointments'), where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapToAppointment(d.id, d.data() as FirestoreAppointmentData));
  }

  async add(appointment: Appointment): Promise<void> {
    await addDoc(collection(db, 'appointments'), {
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      carModel: appointment.carModel,
      carPlate: appointment.carPlate,
      serviceId: appointment.serviceId,
      date: appointment.date,
      hour: appointment.hour,
      status: appointment.status,
    });
  }

  async update(appointment: Appointment): Promise<void> {
    await updateDoc(doc(db, 'appointments', appointment.id), {
      status: appointment.status,
      date: appointment.date,
      hour: appointment.hour,
    });
  }
}
