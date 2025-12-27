import express from 'express';
import api_router from './router.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api', api_router);



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});