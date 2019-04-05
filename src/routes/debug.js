const express = require("express");

module.exports = (context) => {
    const {redisService} = context;
    const router = express.Router();

    router.get("/addKeyValue/:key/:value", async (req, res, next) => {
        const {key, value} = req.params;
        await redisService.redisClient.setKey(key, value);
        const result = await redisService.redisClient.getKey(key);
        res.send(result);
    });
    router.get("/enterMessage/:value", async (req, res, next) => {
        const {value} = req.params;
        await redisService.newMessage(value, Date.now() + 10000);
        const result = await redisService.redisClient.zRange("messages", 0, -1);
        res.send(result);
    });

    return router;
};
