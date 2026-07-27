import { Router, Request, Response } from 'express';
import { db } from '../firebaseAdmin';

export const appointmentsRouter = Router();

const COLLECTION = 'appointments';

appointmentsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy('date', 'asc').get();
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

appointmentsRouter.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('date', '==', req.params.date)
      .get();
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

appointmentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const docRef = await db.collection(COLLECTION).add(req.body);
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

appointmentsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    await db.collection(COLLECTION).doc(req.params.id).update(req.body);
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});
