import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorMiddleware } from './utils/errors';

// Routes
import authRoutes from './routes/auth.routes';
import locationRoutes from './routes/location.routes';
import adminRoutes from './routes/admin.routes';
import photoRoutes from './routes/photo.routes';
import miscRoutes from './routes/misc.routes';

const app = express();

// ─── Express 5 req.query Compatibility Patch ─────────────────
// Express 5 defines req.query as a prototype getter (read-only).
// Sub-routers internally try to redefine it, causing TypeError.
// This middleware materializes req.query into a writable instance
// property before the router chain processes it.
app.use((req: any, _res: any, next: any) => {
  try {
    const q = req.query; // read via prototype getter
    Object.defineProperty(req, 'query', {
      value: q,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch {
    // already an instance property — nothing to do
  }
  next();
});

// ─── Security Middleware ──────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Needed for map tiles
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      const allowed = [
        'http://localhost:3000',
        env.FRONTEND_URL,
      ].filter(Boolean);

      // Allow any *.vercel.app subdomain
      const isVercel = /^https:\/\/[a-zA-Z0-9-]+(\.vercel\.app)$/.test(origin);

      if (allowed.includes(origin) || isVercel) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Request Logging ──────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});


// ─── Routes ───────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin', photoRoutes);
app.use('/api/v1', miscRoutes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// ─── Global Error Handler (must be last) ─────────────────────
app.use(errorMiddleware);

export default app;
