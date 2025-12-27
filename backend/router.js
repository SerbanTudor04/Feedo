import express from 'express';


const api_router = express.Router();

api_router.get('/', (req, res) => {
    res.send('Hello, world! dwad');
});


export default api_router;