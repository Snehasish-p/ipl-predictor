const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users — All users with points and profit
router.get('/', auth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isAdmin: false }, // exclude admin
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        selections: {
          where: {
            match: { isComplete: true } // only count completed matches
          },
          select: { id: true }
        }
      },
      orderBy: { points: 'desc' }
    });

    const result = users.map(user => {
      const matchesPlayed  = user.selections.length;
      const totalInvested  = matchesPlayed * 200;
      const profit         = user.points - totalInvested;

      return {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        points:       user.points,
        matchesPlayed,
        totalInvested,
        profit
      };
    });

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