const express  = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/standings — Overall leaderboard
router.get('/', auth, async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      selections: {
        where: { isCorrect: { not: null } }, // only evaluated selections
        select: { isCorrect: true }
      }
    }
  });

  const standings = users
    .map(user => ({
      id:     user.id,
      name:   user.name,
      total:  user.selections.length,
      wins:   user.selections.filter(s => s.isCorrect).length,
      losses: user.selections.filter(s => !s.isCorrect).length,
    }))
    .sort((a, b) => b.wins - a.wins); // Sort by most wins

  res.json(standings);
});

module.exports = router;