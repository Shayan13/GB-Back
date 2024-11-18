import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import transactionRoutes from './routes/transaction.routes';
import walletRoutes from './routes/wallet.routes';

import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs

  statusCode: 429, // default = 429
  message: 'Too many requests, please try again later.',
});
app.use(limiter);



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', authenticateToken, profileRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/wallet', authenticateToken, walletRoutes);

// Error handling
app.use(errorHandler);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));