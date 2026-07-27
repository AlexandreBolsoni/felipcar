# FelipCar - Estética Automotiva

Um sistema web completo, moderno e responsivo para agendamento online e gestão administrativa de centros de estética automotiva.

---

## 🚗 Sobre o Projeto

O **FelipCar** une uma experiência fluida para os clientes agendarem serviços de estética automotiva com um painel de gestão completo para os administradores controlarem a agenda, faturamento, horários de funcionamento e catálogo de serviços.

---

## ✨ Funcionalidades Principais

### 🌐 Área do Cliente (Landing Page Pública)
- **Agendamento Inteligente**: Escolha de data, horário disponível, dados do veículo (modelo e placa) e informações de contato.
- **Bloqueio de Horários Dinâmico**: Procedimentos de longa duração bloqueiam automaticamente os slots subsequentes para evitar conflito de agenda.
- **Catálogo de Serviços**: Apresentação de tratamentos (Lavagem Detalhada, Polimento Comercial, Higienização Interna, Vitrificação de Pintura, etc.) com fotos, preços e tempo estimado.
- **Antes & Depois**: Galeria interativa de resultados.
- **Avaliações e Depoimentos**: Seção para feedback de clientes com suporte a estrelas e moderação.

### 🛡️ Painel de Gestão (Admin)
- **Resumo do Dia em Marquee**: Ticker/letreiro infinito com animação contínua exibindo métricas diárias (Agendamentos, Horas Ocupadas, Faturamento Previsto e Capacidade).
- **Agenda & Calendário**: Visualização de disponibilidade por data com navegação rápida.
- **Grade de Horários**: Controle de status dos serviços (Pendente, Em Andamento, Concluído ou Cancelado) e reserva manual direta.
- **Gestão de Serviços**: Adição, edição, remoção e personalização de serviços do catálogo.
- **Configuração do Negócio**: Definição de horários de funcionamento, intervalo entre agendamentos e pausa de almoço.
- **Moderação de Avaliações**: Aprovação ou remoção de avaliações enviadas por clientes.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript
- **Estilização**: Tailwind CSS v4, Lucide React (Ícones)
- **Animações**: Framer Motion
- **Build & Execução**: Vite

---

## 🚀 Como Executar o Projeto

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Acesse no navegador**:
   Acesse `http://localhost:3000` para visualizar a aplicação.

---

## 📜 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Compila a aplicação para produção
- `npm run lint`: Valida os tipos TypeScript e sintaxe
- `npm run preview`: Executa o preview da build de produção
