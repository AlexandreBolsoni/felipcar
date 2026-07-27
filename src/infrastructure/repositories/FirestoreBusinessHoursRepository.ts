import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { BusinessHoursConfig } from './MockBusinessHoursRepository';

const DOC_PATH = 'businessHours/current';

const DEFAULT_CONFIG: BusinessHoursConfig = {
  startHour: '08:00',
  endHour: '18:00',
  slotIntervalMinutes: 60,
  weekdaySchedule: 'Segunda a Sexta: 08h às 18h',
  saturdaySchedule: 'Sábado: 08h às 17h',
  sundaySchedule: 'Domingo / Feriados: Sob Consulta',
  lunchBreakEnabled: false,
  lunchStartHour: '12:00',
  lunchEndHour: '13:00',
};

export class FirestoreBusinessHoursRepository {
  async get(): Promise<BusinessHoursConfig> {
    const d = await getDoc(doc(db, 'businessHours', 'current'));
    if (!d.exists()) {
      await setDoc(doc(db, 'businessHours', 'current'), DEFAULT_CONFIG);
      return { ...DEFAULT_CONFIG };
    }
    return d.data() as BusinessHoursConfig;
  }

  async update(config: Partial<BusinessHoursConfig>): Promise<BusinessHoursConfig> {
    const current = await this.get();
    const merged = { ...current, ...config };
    await setDoc(doc(db, 'businessHours', 'current'), merged, { merge: true });
    return merged;
  }
}
