import express from 'express';
import cors from 'cors';
import { servicesRouter } from './routes/services';
import { appointmentsRouter } from './routes/appointments';
import { reviewsRouter } from './routes/reviews';
import { businessHoursRouter } from './routes/businessHours';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/services', servicesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/business-hours', businessHoursRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
