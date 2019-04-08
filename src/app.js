const express = require("express");
const bodyParser = require('body-parser')

const config = require("./config.js");
const apiRouter = require("./routes/api");
const debugRouter = require("./routes/debug");
const RedisService = require("./services/redisService");

const portParam = process.argv[process.argv.length - 1];
const expressPort = Number(portParam) ? portParam : config.express.defualtPort;
const redisService = new RedisService(config.redis.port, config.redis.ip);

// for checking 2 servers we can run 'npm run start2' or uncomment next line
//const redisService2 = new RedisService(config.redis.port, config.redis.ip);

const app = express();

app.use(bodyParser.json());
app.use('/api', apiRouter({redisService}));
app.use('/debug', debugRouter({redisService}));
app.listen(expressPort);

redisService.printAllExpiredMessages();