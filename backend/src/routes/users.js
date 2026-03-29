const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users — All users with points and profit
router.get('/', auth, async (req, res) => {
  try {
    // Get all completed matches
    const completedMatches = await prisma.match.findMany({
      where: { isComplete: true },
      select: { id: true }
    });
    const totalCompletedMatches = completedMatches.length;
    const completedMatchIds = completedMatches.map(m => m.id);

    // Get all non-admin users with their selections
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        selections: {
          where: {
            matchId: { in: completedMatchIds }
          },
          select: {
            matchId: true,
            isCorrect: true
          }
        }
      },
      orderBy: { points: 'desc' }
    });

    const result = users.map(user => {
      const selectedMatchIds = user.selections.map(s => s.matchId);

      // Matches user participated in (out of completed matches)
      const matchesPlayed = user.selections.length;

      // Matches user MISSED (completed but no selection)
      const matchesMissed = completedMatchIds.filter(
        id => !selectedMatchIds.includes(id)
      ).length;

      // Total matches everyone should have played
      const totalMatches = totalCompletedMatches;

      // Points earned from correct selections
      const pointsEarned = Number(user.points || 0);

      // Total invested = 200 per completed match (whether they played or not)
      const totalInvested = totalMatches * 200;

      // Profit = points earned - total invested
      // Missed matches count as -200 each (invested but earned 0)
      const profit = pointsEarned - totalInvested;

      return {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        points:        pointsEarned,
        totalMatches,
        matchesPlayed,
        matchesMissed,
        totalInvested,
        profit
      };
    });

    // Sort by profit descending, then by points
    result.sort((a, b) => b.profit - a.profit || b.points - a.points);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


// PATCH /api/users/reset-points — Admin: reset ALL users' points to 0
router.patch('/reset-points', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });

  try {
    await prisma.user.updateMany({
      data: { points: 0 }
    });
    res.json({ message: '✅ All user points reset to 0' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset points' });
  }
});

router.delete('/reset-all', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admins only' });

  try {
    await prisma.selection.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.user.deleteMany({ where: { isAdmin: false } });

    // ← Also reset admin points to 0
    await prisma.user.updateMany({
      where: { isAdmin: true },
      data: { points: 0 }
    });

    res.json({ message: '✅ All users, matches, selections deleted. Admin points reset to 0.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

module.exports = router;