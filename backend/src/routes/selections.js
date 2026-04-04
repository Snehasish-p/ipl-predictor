const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/selections — Submit new selection
router.post('/', auth, async (req, res) => {
  const { matchId, selectedTeam } = req.body;
  const userId = req.user.id;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.isComplete) return res.status(400).json({ error: 'Match already completed' });

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

// PATCH /api/selections/:matchId — Edit existing selection before match starts
router.patch('/:matchId', auth, async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const userId  = req.user.id;
  const { selectedTeam } = req.body;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.isComplete) return res.status(400).json({ error: 'Match already completed' });

  // Check if match has started
  const now = new Date();
  if (now >= new Date(match.matchDate)) {
    return res.status(400).json({ error: 'Cannot edit — match has already started!' });
  }

  if (selectedTeam !== match.team1 && selectedTeam !== match.team2) {
    return res.status(400).json({ error: 'Invalid team selection' });
  }

  // Check selection exists
  const existing = await prisma.selection.findUnique({
    where: { userId_matchId: { userId, matchId } }
  });
  if (!existing) return res.status(404).json({ error: 'No selection found to edit' });

  const updated = await prisma.selection.update({
    where: { userId_matchId: { userId, matchId } },
    data: { selectedTeam }
  });

  res.json({ message: `Selection updated to ${selectedTeam}!`, selection: updated });
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

// DELETE /api/selections/reset/:matchId — Admin
router.delete('/reset/:matchId', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });
  const matchId = parseInt(req.params.matchId);
  const deleted = await prisma.selection.deleteMany({ where: { matchId } });
  res.json({ message: `Deleted ${deleted.count} selections` });
});

// DELETE /api/selections/reset-user/:matchId/:userId — Admin
router.delete('/reset-user/:matchId/:userId', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });
  const matchId = parseInt(req.params.matchId);
  const userId  = parseInt(req.params.userId);
  const deleted = await prisma.selection.deleteMany({ where: { matchId, userId } });
  res.json({ message: `Deleted ${deleted.count} selection(s)` });
});

// DELETE /api/selections/reset-all — Admin
router.delete('/reset-all', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });
  const deleted = await prisma.selection.deleteMany({});
  res.json({ message: `Deleted all ${deleted.count} selections` });
});

module.exports = router;