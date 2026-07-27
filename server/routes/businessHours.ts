import { Router, Request, Response } from 'express';
import { db } from '../firebaseAdmin';

export const businessHoursRouter = Router();

const DOC_ID = 'current';
const COLLECTION = 'businessHours';

businessHoursRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const doc = await db.collection(COLLECTION).doc(DOC_ID).get();
    if (!doc.exists) {
      const defaultConfig = {
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
      await db.collection(COLLECTION).doc(DOC_ID).set(defaultConfig);
      res.json(defaultConfig);
      return;
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch business hours' });
  }
});

businessHoursRouter.put('/', async (req: Request, res: Response) => {
  try {
    await db.collection(COLLECTION).doc(DOC_ID).set(req.body, { merge: true });
    const doc = await db.collection(COLLECTION).doc(DOC_ID).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update business hours' });
  }
});
