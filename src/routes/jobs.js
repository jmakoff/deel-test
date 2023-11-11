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
      const job = await Job.findOne({
        include: [
          {
            model: Contract,
            include: [
              {
                model: Profile,
                as: "Contractor",
              },
              {
                model: Profile,
                as: "Client",
              },
            ],
          },
        ],
        attributes: ["price", "id", "paid"],
        where: {
          id: job_id,
          "$Contract.ClientId$": req.profile.id,
        },
      });

      if (!job) {
        const errorMsg = `Cannot find job`;
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

      const client = job.Contract.Client;
      const contractor = job.Contract.Contractor;

      if (client.balance < job.price) {
        const errorMsg = `You have not enough money on balance`;
        res.status(403);
        res.send(errorMsg);
        throw new Error(errorMsg);
      }

      client.balance -= job.price;
      contractor.balance += job.price;

      job.set({
        paid: true,
        paymentDate: new Date(),
      });

      await job.save();
      await client.save();
      await contractor.save();

      return res.sendStatus(201);
    });
  } catch (error) {
    console.log(error);
    res.send(500);
  }
});

module.exports = router;
