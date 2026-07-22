import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
import { registerRoutes } from './routes/index.js';
import { runMigrations } from './db/migrations.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TravelConnect SA API',
      version: '1.0.0',
      description: 'Foundation API for TravelConnect Africa SaaS platform'
    }
  },
  apis: ['./src/routes/**/*.ts']
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

runMigrations();
registerRoutes(app);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`TravelConnect API listening on http://localhost:${port}`);
  });
}

export { app, uuidv4 };
