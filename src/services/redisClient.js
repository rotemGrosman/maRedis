var Redlock = require('redlock');
const redis = require("redis");

const redisFunctionFactory = (client, func, ...args) => {
    return new Promise((resolve, reject) => {
        func.bind(client)(...args, (err, value) => {
            if (err) {
                reject(err);
            } else {
                resolve(value);
            }
        });
    });
}

module.exports = class redisClient{
    constructor(port, ip) {
        this.redisClient = redis.createClient(port, ip);
    }

    get lock() {
        if (!this.redlock){
            this.redlock = new Redlock(
                [this.redisClient],
                {
                    driftFactor: 0.01, // time in ms
                    retryCount:  10,
                    retryDelay:  200, // time in ms
                    retryJitter:  200 // time in ms
                }
            );    
        }
        return this.redlock;
    }

    getKey(key) {
        return redisFunctionFactory(this.redisClient, this.redisClient.get, key);
    }

    setKey(key, value) {
        return redisFunctionFactory(this.redisClient, this.redisClient.set, key, value);
    }

    delKey(key) {
        return redisFunctionFactory(this.redisClient, this.redisClient.del, key);
    }

    getSetKey(key, value) {
        return redisFunctionFactory(this.redisClient, this.redisClient.getset, key, value);
    }

    zAdd(key, score, value) {
        return redisFunctionFactory(this.redisClient, this.redisClient.zadd, key, score, value);
    }

    zRem(key, value) {
        return redisFunctionFactory(this.redisClient, this.redisClient.zrem, key, value);
    }

    zRange(key, from, to, withScores = false) {
        return withScores ?
            redisFunctionFactory(this.redisClient, this.redisClient.zrange, key, from, to, "WITHSCORES"):
            redisFunctionFactory(this.redisClient, this.redisClient.zrange, key, from, to);
    }

    zRangeByScore(key, from, to, withScores = false) {
        return withScores ?
            redisFunctionFactory(this.redisClient, this.redisClient.zrangebyscore, key, from, to, "WITHSCORES"):
            redisFunctionFactory(this.redisClient, this.redisClient.zrangebyscore, key, from, to);
    }

    expire(key, seconds, withScores = false) {
        return withScores ?
            redisFunctionFactory(this.redisClient, this.redisClient.expire, key, seconds, "WITHSCORES"):
            redisFunctionFactory(this.redisClient, this.redisClient.expire, key, seconds);
    }

    subscribe(channel, messageCB) {
        this.redisClient.on("message", (activeChannel, message) => {
            if (activeChannel === channel) {
                messageCB(message);
            }
        });
        this.redisClient.subscribe(channel);
    }

    publish(channel, message) {
        this.redisClient.publish(channel, message);
    }
}