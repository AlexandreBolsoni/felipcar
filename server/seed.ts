import { db } from './firebaseAdmin';

const seedServices = [
  {
    title: 'Lavagem Detalhada & Descontaminação',
    description: 'Limpeza técnica profunda de carroceria, caixa de rodas e chassi com pH neutro e pincéis de detalhamento.',
    durationValue: 60,
    durationUnit: 'minutes',
    durationMinutes: 60,
    price: 150,
    priceType: 'fixed',
    hasDetailedView: true,
    detailedDescription: `### ETAPAS DO PROCESSO TÉCNICO:\n1. **Pré-lavagem Snow Foam:** Aplicação de espuma densa com shampoo pH neutro Vonixx para amolecer a sujeira pesada sem riscar.\n2. **Limpeza de Rodas e Caixa de Rodas:** Uso de desengraxantes específicos e escovas macias para remoção de fuligem de freio.\n3. **Pincelamento de Emblemas e Frisos:** Detalhamento minucioso de grades, emblemas, frestas de portas e borrachas.\n4. **Lavagem com Luva de Microfibra:** Método dos dois baldes com separador de partículas para evitar riscos.\n5. **Descontaminação Química de Ferro:** Aplicação de removedor de resíduos de freio e contaminação industrial.\n6. **Secagem Técnica:** Uso de soprador de ar quente e toalhas de secagem de alta gramatura.\n7. **Proteção e Acabamento:** Aplicação de cera sintética SiO2 com durabilidade de até 3 meses.`,
    detailedImages: [
      'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80',
    ],
    additionalInfo: 'Garantia de acabamento sem holograma. Recomendado a cada 15 a 30 dias.',
  },
  {
    title: 'Polimento Técnico & Vitrificação 9H',
    description: 'Correção de pintura com remoção de até 95% dos riscos e aplicação de vitrificador cerâmico de alta durabilidade.',
    durationValue: 1,
    durationUnit: 'days',
    durationMinutes: 600,
    price: 800,
    priceType: 'variable',
    hasDetailedView: true,
    detailedDescription: `### ETAPAS COMPLETAS DE VITRIFICAÇÃO CERÂMICA:\n1. **Descontaminação da Pintura:** Uso de Clay Bar e descontaminante férrico para remoção total de impurezas.\n2. **Medição de Espessura do Verniz:** Análise micrométrica da camada de tinta.\n3. **Etapa de Corte (Corte Técnico):** Remoção de microrriscos com boinas de lã e compostos Koch Chemie.\n4. **Etapa de Refino & Lustro:** Eliminação de marcas de corte e maximização do brilho.\n5. **Revelador de Hologramas:** Aplicação de Isopropanol (IPA).\n6. **Aplicação do Vitrificador Cerâmico 9H:** Proteção UV, fezes de pássaros e chuvas ácidas.\n7. **Cura Infravermelho:** Secagem técnica com lâmpada infravermelho.`,
    detailedImages: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    ],
    additionalInfo: 'Tempo de cura inicial: 24 horas. Acompanha certificado de garantia.',
  },
  {
    title: 'Proteção PPF e Película Solar Premium',
    description: 'Aplicação de filme de proteção transparente autoregenerativo (PPF) e película de controle térmico.',
    durationValue: 2,
    durationUnit: 'days',
    durationMinutes: 1200,
    price: 2500,
    priceType: 'variable',
    hasDetailedView: true,
    detailedDescription: `### DETALHAMENTO DO SERVIÇO PPF & PELÍCULA:\n- **PPF:** Material TPU de alta resistência contra pedriscos e arranhões.\n- **Tecnologia Auto-Regenerativa:** Riscos superficiais somem com água quente ou calor do sol.\n- **Película Térmica de Nanocerâmica:** Bloqueio de até 99% UV e 92% do calor infravermelho.`,
    detailedImages: ['https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'],
    additionalInfo: 'Garantia oficial de 5 a 10 anos contra amarelamento, bolhas ou descolamento.',
  },
  {
    title: 'Higienização Interna e Ozonização',
    description: 'Limpeza detalhada de estofados, couro, teto e descontaminação biológica por gerador de ozônio.',
    durationValue: 2,
    durationUnit: 'hours',
    durationMinutes: 120,
    price: 220,
    priceType: 'fixed',
    hasDetailedView: true,
    detailedDescription: `### PROCESSO DE HIGIENIZAÇÃO INTERNA:\n1. Extração profunda de ácaros e fungos dos bancos.\n2. Hidratação dos couros com protetor fosco.\n3. Sanitização do ar-condicionado com gerador de Ozônio O3.`,
    detailedImages: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80'],
    additionalInfo: 'Indicado para carros seminovos, transporte de pets ou fumantes.',
  },
  {
    title: 'Restauração e Vitrificação de Faróis',
    description: 'Lixamento d\'água técnico, polimento em etapas e aplicação de verniz protetor UV nos faróis.',
    durationValue: 45,
    durationUnit: 'minutes',
    durationMinutes: 45,
    price: 100,
    priceType: 'fixed',
    hasDetailedView: false,
    detailedDescription: '',
    detailedImages: [],
    additionalInfo: '',
  },
  {
    title: 'Pintura e Restauração de Rodas',
    description: 'Revitalização completa, remoção de ralados de meio-fio, polimento e repintura de rodas de liga leve.',
    durationValue: 3,
    durationUnit: 'hours',
    durationMinutes: 180,
    price: 350,
    priceType: 'variable',
    hasDetailedView: false,
    detailedDescription: '',
    detailedImages: [],
    additionalInfo: '',
  },
];

const seedReviews = [
  {
    authorName: 'Marcos Oliveira',
    carModel: 'Civic Touring',
    rating: 5,
    comment: 'Fiz a vitrificação de pintura e o polimento técnico. Resultado surreal!',
    date: '2026-07-20',
    hidden: false,
    ownerReply: 'Muito obrigado Marcos! Ficou lindo demais no preto perolizado do Civic.',
  },
  {
    authorName: 'Lucas Mendes',
    carModel: 'Jeep Compass',
    rating: 5,
    comment: 'Higienização interna detalhada impecável! Removeu todas as manchas dos bancos.',
    date: '2026-07-22',
    hidden: false,
    ownerReply: 'Valeu Lucas! Obrigado pela confiança.',
  },
  {
    authorName: 'Fernanda Lima',
    carModel: 'Onix Turbo',
    rating: 5,
    comment: 'Agendei pelo site e foi super tranquilo. Carro super limpo por dentro e por fora.',
    date: '2026-07-24',
    hidden: false,
    ownerReply: null,
  },
];

async function seed() {
  console.log('Seeding Firestore...');

  const servicesSnapshot = await db.collection('services').get();
  if (servicesSnapshot.empty) {
    for (const service of seedServices) {
      await db.collection('services').add(service);
    }
    console.log(`Seeded ${seedServices.length} services`);
  } else {
    console.log('Services already seeded, skipping');
  }

  const reviewsSnapshot = await db.collection('reviews').get();
  if (reviewsSnapshot.empty) {
    for (const review of seedReviews) {
      await db.collection('reviews').add(review);
    }
    console.log(`Seeded ${seedReviews.length} reviews`);
  } else {
    console.log('Reviews already seeded, skipping');
  }

  const hoursDoc = await db.collection('businessHours').doc('current').get();
  if (!hoursDoc.exists) {
    await db.collection('businessHours').doc('current').set({
      startHour: '08:00',
      endHour: '18:00',
      slotIntervalMinutes: 60,
      weekdaySchedule: 'Segunda a Sexta: 08h às 18h',
      saturdaySchedule: 'Sábado: 08h às 17h',
      sundaySchedule: 'Domingo / Feriados: Sob Consulta',
      lunchBreakEnabled: false,
      lunchStartHour: '12:00',
      lunchEndHour: '13:00',
    });
    console.log('Seeded business hours');
  } else {
    console.log('Business hours already seeded, skipping');
  }

  console.log('Seed complete!');
}

seed().catch(console.error);
