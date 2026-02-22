import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './Database/dbconnect.js';
import authRoutes from './Routes/authRoutes.js';
import taskRoutes from './Routes/taskRoutes.js';
import studyLogRoutes from './Routes/studyLogRoutes.js';
import productivityRoutes from './Routes/productivityRoutes.js';
import skillRoutes from './Routes/skillRoutes.js';
import roadmapRoutes from './Routes/roadmapRoutes.js';
import { initEmailScheduler } from './Scheduler/emailScheduler.js';
import { initEmailServiceHealth } from './Utils/emailService.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (no Origin) and configured frontend origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked for this origin'));
  },
  credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'FutureMe AI backend running' });
});

await connectDB().catch((error) => {
  console.error('Database connection failed:', error);
  process.exit(1);
});

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('Email config warning: EMAIL_USER or EMAIL_PASS is missing.');
}

if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
  console.warn('Gemini config warning: GEMINI_API_KEY/API_KEY is missing. Roadmap generation will use fallback mode.');
}

if (!process.env.GEMINI_MODEL) {
  console.warn('Gemini config warning: GEMINI_MODEL not set. Default model will be used.');
}

await initEmailServiceHealth();
await initEmailScheduler();

app.use(authRoutes);
app.use(taskRoutes);
app.use(studyLogRoutes);
app.use(productivityRoutes);
app.use(skillRoutes);
app.use(roadmapRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
