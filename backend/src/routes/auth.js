const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/register
// Accepts email OR mobile (at least one required)
router.post('/register', async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!name || !password || (!email && !mobile)) {
    return res.status(400).json({ 
      error: 'Name, password, and email or mobile are required' 
    });
  }

  // Check for duplicate email or mobile
  const existing = await prisma.user.findFirst({
    where: { OR: [
      email  ? { email }  : undefined,
      mobile ? { mobile } : undefined,
    ].filter(Boolean) }
  });
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: email || null, mobile: mobile || null, password: hashed }
  });

  const token = jwt.sign(
    { id: user.id, name: user.name, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.status(201).json({ token, user: { id: user.id, name: user.name } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  // identifier = email or mobile number

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password required' });
  }

  const isEmail = identifier.includes('@');
  const user = await prisma.user.findUnique({
    where: isEmail ? { email: identifier } : { mobile: identifier }
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  const token = jwt.sign(
    { id: user.id, name: user.name, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, isAdmin: user.isAdmin } });
});

module.exports = router;