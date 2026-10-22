const express = require('express');
const healthService = require('../services/healthService');

const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    return res.json({ data: healthService.getHealth() });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
