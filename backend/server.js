import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/apiRoutes.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Backend server is running with MVC architecture');
});

app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
