import { db } from '../../lib/firebase';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Service, DurationUnit, PriceType } from '../../domain/entities/Service';

type FirestoreServiceData = {
  title: string;
  description: string;
  durationValue: number;
  durationUnit: DurationUnit;
  durationMinutes: number;
  price: number;
  priceType: PriceType;
  hasDetailedView: boolean;
  detailedDescription: string;
  detailedImages: string[];
  additionalInfo: string;
};

function mapToService(id: string, data: FirestoreServiceData): Service {
  return new Service(
    id,
    data.title,
    data.description,
    data.durationValue,
    data.price,
    data.durationUnit,
    data.priceType,
    data.hasDetailedView,
    data.detailedDescription,
    data.detailedImages,
    data.additionalInfo
  );
}

export class FirestoreServiceRepository {
  async getAll(): Promise<Service[]> {
    const snapshot = await getDocs(collection(db, 'services'));
    return snapshot.docs.map(d => mapToService(d.id, d.data() as FirestoreServiceData));
  }

  async getById(id: string): Promise<Service | null> {
    const d = await getDoc(doc(db, 'services', id));
    if (!d.exists()) return null;
    return mapToService(d.id, d.data() as FirestoreServiceData);
  }

  async add(service: Service): Promise<void> {
    await addDoc(collection(db, 'services'), {
      title: service.title,
      description: service.description,
      durationValue: service.durationValue,
      durationUnit: service.durationUnit,
      durationMinutes: service.durationMinutes,
      price: service.price,
      priceType: service.priceType,
      hasDetailedView: service.hasDetailedView,
      detailedDescription: service.detailedDescription,
      detailedImages: service.detailedImages,
      additionalInfo: service.additionalInfo,
    });
  }

  async update(service: Service): Promise<void> {
    await updateDoc(doc(db, 'services', service.id), {
      title: service.title,
      description: service.description,
      durationValue: service.durationValue,
      durationUnit: service.durationUnit,
      durationMinutes: service.durationMinutes,
      price: service.price,
      priceType: service.priceType,
      hasDetailedView: service.hasDetailedView,
      detailedDescription: service.detailedDescription,
      detailedImages: service.detailedImages,
      additionalInfo: service.additionalInfo,
    });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, 'services', id));
  }
}
