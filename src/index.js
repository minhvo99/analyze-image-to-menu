import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import appRoute from './routes/index.js';
const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:8100',
      'http://localhost:8101',
      'http://10.10.10.30:8101',
    ],
    credentials: true,
  }),
);
app.use(morgan('dev'));

app.use(appRoute);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
