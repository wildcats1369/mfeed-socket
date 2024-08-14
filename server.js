const WebSocket = require('ws');
const axios = require('axios');
const redis = require('redis');
const util = require('util');

const REDIS_HOST = 'redis';
const REDIS_PORT = 6379;
const REDIS_PASSWORD = null;


// Connect to redis
const client = redis.createClient({
    url: "redis://" + REDIS_HOST + ":" + REDIS_PORT,
});

(async () => {
    await client.connect();
})();
// const getAsync = util.promisify(client.get).bind(client);
// const setAsync = util.promisify(client.set).bind(client);

// Connect to the Redis server
client.on('connect', function () {
    // Promisify the get and set methods

    console.log('Connected to Redis...');
    const apiService = new ApiService('qyvpHLcynLwpM02TjsYmpgVk2qogg8PU');
    const socketServer = apiService.connectWebSocket();

    // Poll the APIs every 10 seconds
    setInterval(() => {

        apiService.pollApis();
    }, 1000);
});

client.on('error', function (err) {
    console.error('Error occurred with Redis client:', err);
});
client.on('ready', function () {
    console.log('Redis client is ready');
});

client.on('end', function () {
    console.log('Connection to Redis server has been closed');
});




class ApiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseHeaders = {
            'x-api-key': this.apiKey,
        };
        this.previousData1 = null;
        this.previousData2 = null;
        this.channels = {};
    }

    async getMatched() {
        try {

            const response = await axios.get(this.get_matched_url, {
                headers: this.baseHeaders,
            });
            return response.data;
        } catch (error) {
            console.error('Error calling API 1:', error);
            throw error;
        }
    }

    async callApi2() {
        try {
            url = 'https://api.mfeedbo.com/api/matchfeed/getmatches/' + this.sport + '/' + this.group + '/' + this.lang;
            const response = await axios.get(url, {
                headers: this.baseHeaders,
            });
            return response.data;
        } catch (error) {
            console.error('Error calling API 2:', error);
            throw error;
        }
    }

    connectWebSocket() {
        const server = new WebSocket.Server({ port: 8080 });

        server.on('connection', (socket) => {
            console.log('Client connected');

            socket.on('message', (message) => {
                const parsedMessage = JSON.parse(message);
                const { action, channel, sport, group, lang } = parsedMessage;

                if (action === 'subscribe') {
                    if (!this.channels[channel]) {
                        this.channels[channel] = new Set();
                    }
                    this.sport = sport;
                    this.group = group;
                    this.lang = lang;
                    this.channel = channel;
                    this.previousData1 = '';
                    this.get_matched_url = 'https://api.mfeedbo.com/api/matchfeed/getmatches/' + this.sport + '/' + this.group + '/' + this.lang;
                    this.channels[channel].add(socket);
                    socket.channel = channel;
                    console.log(`Client subscribed to channel: ${channel}`);
                }
            });

            socket.on('close', () => {
                console.log('Client disconnected');
                if (socket.channel && this.channels[socket.channel]) {
                    this.channels[socket.channel].delete(socket);
                }
            });
        });

        return server;
    }

    async pollApis() {
        try {
            console.log("polling apis...");
            console.log(this.channel);
            if (this.channel) {
                let data1 = await client.get(this.channel);// getAsync(this.channel);

                if (data1 === null) {
                    console.log('Fetching data1 from API()');
                    data1 = await this.getMatched();
                    // console.log(data1);
                    // Set the cache with a lifespan of 2 second
                    await client.set(this.channel, JSON.stringify(data1), { EX: 2 });
                } else {
                    console.log('Fetching data1 from cache');
                    data1 = JSON.parse(data1);
                }

                if (JSON.stringify(data1) !== JSON.stringify(this.previousData1)) {
                    console.log('broadcasting data');
                    this.previousData1 = data1;
                    this.broadcast(this.channel, data1);
                } else {
                    console.log('same data')
                }
            }
        } catch (error) {
            console.error('Error polling APIs:', error);
        }
    }

    broadcast(channel, data) {
        if (this.channels[channel]) {
            for (const client of this.channels[channel]) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ channel, data }));
                }
            }
        }
    }
}


