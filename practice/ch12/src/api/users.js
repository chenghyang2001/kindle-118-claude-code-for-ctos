const express = require('express');
const userService = require('../services/userService');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ data: userService.listUsers() });
});

router.get('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id must be a positive integer' });
    }
    return res.json({ data: userService.getUser(id) });
  } catch (err) {
    return next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const user = userService.createUser(req.body);
    return res.status(201).json({ data: user });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
