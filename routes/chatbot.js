// Chatbot route: simple logic for food suggestion and discount messages
const express = require('express');
const router = express.Router();

// POST /api/chatbot
router.post('/', (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string")
    return res.status(400).json({ reply: "Please send a valid message!" });

  if (/vegan/i.test(message))
    return res.json({ reply: "Try our Vegan Salad!" });

  if (/discount/i.test(message))
    return res.json({ reply: "Use code FOODIE10 for 10% off!" });

  // You can add more cases here!

  return res.json({ reply: "Can I help you pick something tasty?" });
});

module.exports = router;
