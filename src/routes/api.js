const express = require("express");

module.exports = (context) => {
    const {redisService} = context;
    const router = express.Router();

    router.post("/echoAtTime", async (req, res, next) => {
        const {value, time} = req.body;
        await redisService.newMessage(value, time);
        res.sendStatus(200);
    });

    return router;
};
