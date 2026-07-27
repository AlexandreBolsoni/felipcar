import { Service } from '../../domain/entities/Service';

export class MockServiceRepository {
    private static instance: MockServiceRepository;
    private services: Service[] = [];

    private constructor() {
        this.services = [
            new Service(
                '1', 
                'Lavagem Detalhada & Descontaminação', 
                'Limpeza técnica profunda de carroceria, caixa de rodas e chassi com pH neutro e pincéis de detalhamento.', 
                60, 
                150, 
                'minutes', 
                'fixed',
                true,
                `### ETAPAS DO PROCESSO TÉCNICO:
1. **Pré-lavagem Snow Foam:** Aplicação de espuma densa com shampoo pH neutro Vonixx para amolecer a sujeira pesada sem riscar.
2. **Limpeza de Rodas e Caixa de Rodas:** Uso de desengraxantes específicos e escovas macias para remoção de fuligem de freio.
3. **Pincelamento de Emblemas e Frisos:** Detalhamento minucioso de grades, emblemas, frestas de portas e borrachas.
4. **Lavagem com Luva de Microfibra:** Método dos dois baldes com separador de partículas para evitar riscos ("swirls").
5. **Descontaminação Química de Ferro:** Aplicação de removedor de resíduos de freio e contaminação industrial.
6. **Secagem Técnica:** Uso de soprador de ar quente e toalhas de secagem de alta gramatura.
7. **Proteção e Acabamento:** Aplicação de cera sintética SiO2 com durabilidade de até 3 meses e pretinho condicionador de pneus.`,
                [
                    'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80'
                ],
                'Garantia de acabamento sem holograma. Recomendado a cada 15 a 30 dias.'
            ),
            new Service(
                '2', 
                'Polimento Técnico & Vitrificação 9H', 
                'Correção de pintura com remoção de até 95% dos riscos e aplicação de vitrificador cerâmico de alta durabilidade.', 
                1, 
                800, 
                'days', 
                'variable',
                true,
                `### ETAPAS COMPLETAS DE VITRIFICAÇÃO CERÂMICA:
1. **Descontaminação da Pintura:** Uso de Clay Bar e descontaminante férrico para remoção total de impurezas impregnais.
2. **Medição de Espessura do Verniz:** Análise micrométrica da camada de tinta para garantir segurança no corte.
3. **Etapa de Corte (Corte Técnico):** Remoção de microrriscos fundos e teias de aranha ("swirls") com boinas de lã e compostos alemães Koch Chemie.
4. **Etapa de Refino & Lustro:** Eliminação de marcas de corte e maximização do brilho espelhado da cor original.
5. **Revelador de Hologramas:** Aplicação de Isopropanol (IPA) para certificar remoção definitiva dos riscos.
6. **Aplicação do Vitrificador Cerâmico 9H:** Proteção extrema contra raios UV, fezes de pássaros, seiva de árvore e chuvas ácidas.
7. **Cura Infravermelho:** Secagem técnica com lâmpada infravermelho para ancoragem perfeita.`,
                [
                    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
                ],
                'Tempo de cura inicial: 24 horas. Acompanha certificado de garantia e manual de manutenção.'
            ),
            new Service(
                '3', 
                'Proteção PPF e Película Solar Premium', 
                'Aplicação de filme de proteção transparente autoregenerativo (PPF) e película de controle térmico.', 
                2, 
                2500, 
                'days', 
                'variable',
                true,
                `### DETALHAMENTO DO SERVIÇO PPF & PELÍCULA:
- **Película de Proteção PPF (Paint Protection Film):** Material TPU de alta resistência contra pedriscos, arranhões de estacionamento e vandalismo.
- **Tecnologia Auto-Regenerativa:** Riscos superficiais somem ao contato com a água quente ou calor do sol.
- **Película Térmica de Nanocerâmica:** Bloqueio de até 99% dos raios UV e 92% do calor infravermelho no interior da cabine.`,
                [
                    'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'
                ],
                'Garantia oficial de 5 a 10 anos contra amarelamento, bolhas ou descolamento.'
            ),
            new Service(
                '4', 
                'Pintura e Restauração de Rodas', 
                'Revitalização completa, remoção de ralados de meio-fio, polimento e repintura de rodas de liga leve.', 
                3, 
                350, 
                'hours', 
                'variable',
                false,
                '',
                [],
                ''
            ),
            new Service(
                '5', 
                'Higienização Interna e Ozonização', 
                'Limpeza detalhada de estofados, couro, teto e descontaminação biológica por gerador de ozônio.', 
                2, 
                220, 
                'hours', 
                'fixed',
                true,
                `### PROCESSO DE HIGIENIZAÇÃO INTERNA:
1. Extração profunda de ácaros e fungos dos bancos de tecido ou couro.
2. Hidratação dos couros com protetor fosco sem aspecto engordurado.
3. Sanitização do sistema de ar-condicionado com gerador de Ozônio O3 (elimina 99.9% de odores e bactérias).`,
                [
                    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80'
                ],
                'Indicado para carros seminovos, transporte de pets ou fumantes.'
            ),
            new Service(
                '6', 
                'Restauração e Vitrificação de Faróis', 
                'Lixamento d’água técnico, polimento em etapas e aplicação de verniz protetor UV nos faróis.', 
                45, 
                100, 
                'minutes', 
                'fixed',
                false,
                '',
                [],
                ''
            ),
        ];
    }

    public static getInstance(): MockServiceRepository {
        if (!MockServiceRepository.instance) {
            MockServiceRepository.instance = new MockServiceRepository();
        }
        return MockServiceRepository.instance;
    }

    public getAll(): Service[] {
        return [...this.services];
    }

    public getById(id: string): Service | undefined {
        return this.services.find(s => s.id === id);
    }

    public add(service: Service): void {
        this.services.push(service);
    }

    public update(service: Service): void {
        const index = this.services.findIndex(s => s.id === service.id);
        if (index !== -1) {
            this.services[index] = service;
        }
    }

    public remove(id: string): void {
        this.services = this.services.filter(s => s.id !== id);
    }
}
