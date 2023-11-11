const express = require("express");
const { getProfile } = require("../middleware/getProfile");
const router = express.Router();
const { Op } = require("sequelize");

router.get("/unpaid", getProfile, async (req, res) => {
  const { Job, Contract } = req.app.get("models");
  const profileId = req.profile.id;
  const jobs = await Job.findAll({
    include: [Contract],
    where: {
      [Op.or]: [
        { "$Contract.ClientId$": profileId },
        { "$Contract.ContractorId$": profileId },
      ],
      "$Contract.status$": "in_progress",
      paid: null,
    },
  });

  if (!jobs.length) {
    return res.status(404).end();
  }

  res.json(jobs);
});

module.exports = router;
