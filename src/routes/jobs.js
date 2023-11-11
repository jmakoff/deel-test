const express = require("express");
const router = express.Router();
const { getProfile } = require("../middleware/getProfile");
const { Op } = require("sequelize");
const { sequelize } = require("../model");

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

router.post("/:job_id/pay", getProfile, async (req, res) => {
  try {
    await sequelize.transaction(async () => {
      const { Job, Profile, Contract } = req.app.get("models");
      const { job_id } = req.params;
      const [profile, job] = await Promise.all([
        Profile.findOne({
          attributes: ["balance", "id"],
          where: {
            id: req.profile.id,
          },
        }),
        Job.findOne({
          include: [Contract],
          attributes: ["price", "id", "paid"],
          where: {
            id: job_id,
            "$Contract.ClientId$": req.profile.id,
          },
        }),
      ]);

      if (!profile || !job) {
        const errorMsg = `Cannot find contract or client info`;
        res.status(404);
        res.send(errorMsg);
        throw new Error(errorMsg);
      }

      if (job.paid) {
        const errorMsg = `This job is already paid`;
        res.status(403);
        res.send(errorMsg);
        throw new Error(errorMsg);
      }

      if (profile.balance < job.price) {
        const errorMsg = `You have not enough money on balance`;
        res.status(403);
        res.send(errorMsg);
        throw new Error(errorMsg);
      }

      profile.balance = profile.balance - job.price;
      job.set({
        paid: true,
        paymentDate: new Date(),
      });
      await Promise.all([profile.save(), job.save()]);

      return res.status(201).end;
    });
  } catch (error) {
    console.log(error);
    res.status(500);
  }
});

module.exports = router;
