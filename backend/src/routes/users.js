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

module.exports = router;