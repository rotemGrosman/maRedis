const uuid = require('uuid');

const redisClient = require("./redisClient");
const channel = "newMessage";
const zListName = "messages";
const messageId2Text = "messagesText";
const locks = "locks"

class redisService{
    constructor(port, ip) {
        this.firstMessageTime = undefined;
        this.client = new redisClient(port, ip);
        this.eventRedis = new redisClient(port, ip);
        this.eventRedis.subscribe(channel, (timeStamp) => this._updateFirstMessageTime(timeStamp));
    }

    get redisClient() {
        return this.client;
    }

    async newMessage(message, timeStamp){
        const newUuid = uuid.v4();
        
        return Promise.all([
            this.client.zAdd(zListName, timeStamp, newUuid),
            this.client.setKey(messageId2Text + ":" + newUuid, message)  
        ]).then(() => {
            this.client.publish(channel, timeStamp);
        });
    }

    async printAllExpiredMessages() {
        this.firstMessageTime = undefined;
        const expiredMessagesIds = await this.client.zRangeByScore(zListName, 0, Date.now(), false);
        return Promise.all(
            expiredMessagesIds.map(expiredMessageId => {
                this._tryPrintMessage(expiredMessageId)
            })    
        ).then(() => this._setTimerToNextMessage());
    }

    /// from here - private. (TODO: make sure to update functions and delete this comment after inserting TS)
    _updateFirstMessageTime(timeStamp) {
        if (this.firstMessageTime < timeStamp) {
            return;
        }
        this.firstMessageTime = timeStamp;
        clearTimeout(this.earliestTimeout);
        this.earliestTimeout = setTimeout(() => this.printAllExpiredMessages(), timeStamp - Date.now());
    }

    async _tryPrintMessage(expiredMessageId) {
        const ttl = 500;
        const lockKey = locks + ":" + expiredMessageId;
        try {
            const lock = await this.client.lock.lock(lockKey, ttl);

            const fullKey = messageId2Text + ":" + expiredMessageId;
            const value = await this.client.getKey(fullKey, "");
            if (value) {
                console.log(value);
                await Promise.all([
                    this.client.zRem(zListName, expiredMessageId),
                    this.client.delKey(fullKey)
                ]) 
            }
            return lock.unlock();    
        }
        catch (err){
            console.error(err);
            return Promise.reject(err);
        }
    }
    
    async _setTimerToNextMessage() {
        const nextMessage = await this.client.zRange("messages", 0, 0, true);
        if (nextMessage[1]) {
            this._updateFirstMessageTime(nextMessage[1]);
        }
        return;
    }
}

module.exports = redisService;