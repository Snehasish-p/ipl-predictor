const express  = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/selections — User picks a team for today's match
router.post('/', auth, async (req, res) => {
  const { matchId, selectedTeam } = req.body;
  const userId = req.user.id;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.isComplete) return res.status(400).json({ error: 'Match already completed' });

  // ⏰ Check if submission time has passed (match start time = cutoff)
  const now = new Date();
  if (now >= new Date(match.matchDate)) {
    return res.status(400).json({ error: 'Selection time is over. Match has already started!' });
  }

  if (selectedTeam !== match.team1 && selectedTeam !== match.team2) {
    return res.status(400).json({ error: 'Invalid team selection' });
  }

  try {
    const selection = await prisma.selection.create({
      data: { userId, matchId, selectedTeam }
    });
    res.status(201).json({ message: 'Selection saved!', selection });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'You already picked a team for this match' });
    }
    throw err;
  }
});

// GET /api/selections/my — Get current user's selections
router.get('/my', auth, async (req, res) => {
  const selections = await prisma.selection.findMany({
    where: { userId: req.user.id },
    include: { match: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(selections);
});

module.exports = router;