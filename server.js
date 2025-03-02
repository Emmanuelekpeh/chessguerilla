const express = require('express');
const cors = require('cors');
const { handler } = require('./api/generatePuzzle');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('./'));

// API routes
app.post('/api/puzzles', async (req, res) => {
    try {
        const event = { body: JSON.stringify(req.body) };
        const result = await handler(event);
        
        res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
