import { Router, Request, Response } from 'express';
import { db } from '../firebaseAdmin';

export const reviewsRouter = Router();

const COLLECTION = 'reviews';

reviewsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy('date', 'desc').get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

reviewsRouter.get('/visible', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where('hidden', '==', false)
      .orderBy('date', 'desc')
      .get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visible reviews' });
  }
});

reviewsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const docRef = await db.collection(COLLECTION).add(req.body);
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

reviewsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    await db.collection(COLLECTION).doc(req.params.id).update(req.body);
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

reviewsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await db.collection(COLLECTION).doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});
