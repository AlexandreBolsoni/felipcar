import { db } from '../../lib/firebase';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { Review } from '../../domain/entities/Review';

type FirestoreReviewData = {
  authorName: string;
  carModel: string;
  rating: number;
  comment: string;
  date: string;
  hidden: boolean;
  ownerReply: string | null;
};

function mapToReview(id: string, data: FirestoreReviewData): Review {
  return new Review(
    id,
    data.authorName,
    data.carModel,
    data.rating,
    data.comment,
    data.date,
    data.hidden,
    data.ownerReply
  );
}

export class FirestoreReviewRepository {
  async getAll(): Promise<Review[]> {
    const q = query(collection(db, 'reviews'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapToReview(d.id, d.data() as FirestoreReviewData));
  }

  async getPublicVisible(): Promise<Review[]> {
    const q = query(
      collection(db, 'reviews'),
      where('hidden', '==', false),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => mapToReview(d.id, d.data() as FirestoreReviewData));
  }

  async add(review: Review): Promise<void> {
    await addDoc(collection(db, 'reviews'), {
      authorName: review.authorName,
      carModel: review.carModel,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      hidden: review.hidden,
      ownerReply: review.ownerReply,
    });
  }

  async update(review: Review): Promise<void> {
    await updateDoc(doc(db, 'reviews', review.id), {
      authorName: review.authorName,
      carModel: review.carModel,
      rating: review.rating,
      comment: review.comment,
      hidden: review.hidden,
      ownerReply: review.ownerReply,
    });
  }

  async toggleHidden(id: string): Promise<void> {
    const ref = doc(db, 'reviews', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const current = snap.data().hidden as boolean;
      await updateDoc(ref, { hidden: !current });
    }
  }

  async reply(id: string, replyText: string | null): Promise<void> {
    await updateDoc(doc(db, 'reviews', id), { ownerReply: replyText });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, 'reviews', id));
  }
}
