const express = require("express");
const router = express.Router();

router.post("/deposit/:userId", async (req, res) => {
  const { Profile, Job, Contract } = req.app.get("models");

  // Im not sure what means "more than 25% his total of jobs to pay".
  // Lets assume that it is 25% of total job prices and it cannot be sent on balance more then it in one payment
  // Also, lets assume that money amount will come in body in JSON like this: { "amount": 100}
  const { amount } = req.body;
  const { userId } = req.params;

  const client = await Profile.findOne({
    where: {
      id: userId,
      type: "client",
    },
  });

  if (!client) {
    return res.send(404);
  }

  const clientJobsPrice = await Job.sum("price", {
    include: [Contract],
    where: { "$Contract.ClientId$": userId },
  });

  const maxAmountToDeposit = clientJobsPrice * 0.25;

  if (amount > maxAmountToDeposit) {
    res.send(`Cannot update more then ${maxAmountToDeposit} at one payment`);
    return res.send(403);
  }

  client.balance += amount;
  client.save();

  res.send(201);
});

module.exports = router;
