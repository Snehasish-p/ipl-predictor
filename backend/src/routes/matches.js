const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/matches/upcoming — All matches with user's selection status
router.get('/upcoming', auth, async (req, res) => {
  const userId = req.user.id;

  const matches = await prisma.match.findMany({
    orderBy: { matchDate: 'asc' },
    include: {
      selections: {
        where: { userId },
        select: { selectedTeam: true, isCorrect: true }
      }
    }
  });

  // Attach user's selection directly to each match
  const result = matches.map(match => ({
    ...match,
    userSelection: match.selections[0] || null,
    selections: undefined // don't expose other users' selections
  }));

  res.json(result);
});

// GET /api/matches/today — Keep for backward compat
router.get('/today', auth, async (req, res) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCHours(23, 59, 59, 999);

  const match = await prisma.match.findFirst({
    where: { matchDate: { gte: today, lte: tomorrow } }
  });
  if (!match) return res.status(404).json({ error: 'No match scheduled today' });
  res.json(match);
});

// GET /api/matches — Get all matches
router.get('/', auth, async (req, res) => {
  const matches = await prisma.match.findMany({
    orderBy: { matchDate: 'asc' }
  });
  res.json(matches);
});

// POST /api/matches — Admin: create a match
router.post('/', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });
  const { matchDate, team1, team2, venue } = req.body;

  const match = await prisma.match.create({
    data: { matchDate: new Date(matchDate), team1, team2, venue }
  });
  res.status(201).json(match);
});

// PATCH /api/matches/:id/result — Admin: set match winner
router.patch('/:id/result', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });
  const { winnerTeam } = req.body;
  const matchId = parseInt(req.params.id);

  try {
    const match = await prisma.match.update({
      where: { id: matchId },
      data: { winnerTeam, isComplete: true },
    });

    await prisma.selection.updateMany({
      where: { matchId, selectedTeam: winnerTeam },
      data: { isCorrect: true },
    });
    await prisma.selection.updateMany({
      where: { matchId, NOT: { selectedTeam: winnerTeam } },
      data: { isCorrect: false },
    });

    const selections = await prisma.selection.findMany({ where: { matchId } });
    const winners = selections.filter(s => s.selectedTeam === winnerTeam);
    const totalPool = 2000;
    const share = winners.length > 0 ? totalPool / winners.length : 0;

    for (const w of winners) {
      await prisma.user.update({
        where: { id: w.userId },
        data: { points: { increment: share } },
      });
    }

    res.json({ message: 'Result updated', match, payouts: { share, winners: winners.length } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update result' });
  }
});

// DELETE /api/matches/:id — Admin: delete single match
router.delete('/:id', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });
  const matchId = parseInt(req.params.id);

  try {
    await prisma.selection.deleteMany({ where: { matchId } });
    await prisma.match.delete({ where: { id: matchId } });
    res.json({ message: `Match ${matchId} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// DELETE /api/matches — Admin: delete ALL matches
router.delete('/', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });

  try {
    const deletedSelections = await prisma.selection.deleteMany({});
    const deletedMatches    = await prisma.match.deleteMany({});
    res.json({
      message: 'All matches deleted',
      deletedMatches: deletedMatches.count,
      deletedSelections: deletedSelections.count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete matches' });
  }
});

module.exports = router;