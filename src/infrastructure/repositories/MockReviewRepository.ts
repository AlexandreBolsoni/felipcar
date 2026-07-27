import { Review } from '../../domain/entities/Review';

const STORAGE_KEY = 'felipcar_reviews_data';

export class MockReviewRepository {
    private static instance: MockReviewRepository;
    private reviews: Review[] = [];

    private constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.reviews = parsed.map(
                        (r: any) => new Review(r.id, r.authorName, r.carModel, r.rating, r.comment, r.date, r.hidden, r.ownerReply)
                    );
                    return;
                }
            }
        } catch (e) {
            console.error('Failed to parse reviews from localStorage', e);
        }

        // Default seed data
        this.reviews = [
            new Review(
                '1',
                'Marcos Oliveira',
                'Civic Touring',
                5,
                'Fiz a vitrificação de pintura e o polimento técnico com o FelipCar. O resultado ficou simplesmente surreal! O brilho e a repulsa de água impressionam. Atendimento nota 10.',
                '2026-07-20',
                false,
                'Muito obrigado Marcos! Ficou lindo demais no preto perolizado do Civic. Tamo junto!'
            ),
            new Review(
                '2',
                'Lucas Mendes',
                'Jeep Compass',
                5,
                'Higienização interna detalhada impecável! Removeu todas as manchas dos bancos de couro e deixou o interior com cheiro de novo. Recomendo de olhos fechados.',
                '2026-07-22',
                false,
                'Valeu Lucas! Obrigado pela confiança e pela preferência de sempre.'
            ),
            new Review(
                '3',
                'Fernanda Lima',
                'Onix Turbo',
                5,
                'Agendei pelo site e foi super tranquilo. Entrega rigorosamente no horário combinado, carro super limpo por dentro e por fora.',
                '2026-07-24',
                false,
                null
            )
        ];
        this.saveToStorage();
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reviews.map(r => r.toJSON())));
        } catch (e) {
            console.error('Failed to save reviews to localStorage', e);
        }
    }

    public static getInstance(): MockReviewRepository {
        if (!MockReviewRepository.instance) {
            MockReviewRepository.instance = new MockReviewRepository();
        }
        return MockReviewRepository.instance;
    }

    public getAll(): Review[] {
        return [...this.reviews];
    }

    public getPublicVisible(): Review[] {
        return this.reviews.filter(r => !r.hidden);
    }

    public add(review: Review): void {
        this.reviews.unshift(review);
        this.saveToStorage();
    }

    public update(review: Review): void {
        const index = this.reviews.findIndex(r => r.id === review.id);
        if (index !== -1) {
            this.reviews[index] = review;
            this.saveToStorage();
        }
    }

    public toggleHidden(id: string): void {
        const review = this.reviews.find(r => r.id === id);
        if (review) {
            review.hidden = !review.hidden;
            this.saveToStorage();
        }
    }

    public reply(id: string, replyText: string | null): void {
        const review = this.reviews.find(r => r.id === id);
        if (review) {
            review.ownerReply = replyText;
            this.saveToStorage();
        }
    }

    public remove(id: string): void {
        this.reviews = this.reviews.filter(r => r.id !== id);
        this.saveToStorage();
    }
}
