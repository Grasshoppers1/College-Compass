const express = require('express');
const College = require('../Models/college');

const router = express.Router();

// Prediction endpoint
router.post('/predict', async (req, res) => {
    try {
        const { rank } = req.body; // Extract rank from request body
        const results = await College.find({
            openingRank: { $lte: rank },
            closingRank: { $gte: rank }
        });
        res.json(results); // Send the matching colleges back as a response
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
