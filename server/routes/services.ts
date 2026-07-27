import { Router, Request, Response } from 'express';
import { db } from '../firebaseAdmin';

export const servicesRouter = Router();

const COLLECTION = 'services';

servicesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy('title').get();
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

servicesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

servicesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const docRef = await db.collection(COLLECTION).add(req.body);
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

servicesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    await db.collection(COLLECTION).doc(req.params.id).update(req.body);
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

servicesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await db.collection(COLLECTION).doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});
