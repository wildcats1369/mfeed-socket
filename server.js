require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const axios = require('axios');
const app = express();
const server = http.createServer(app);

const cors = require('cors');
const apiKey = 'qyvpHLcynLwpM02TjsYmpgVk2qogg8PU';
const apiServiceInstances = {};

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
let ticking = false;
let client;

// Connect to redis
if (REDIS_PASSWORD.toLowerCase() === 'null') {
    client = redis.createClient({
        url: `redis://${REDIS_HOST}:${REDIS_PORT}`
    });
} else {
    client = redis.createClient({
        url: `redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`
    });
}


const io = socketIo(server, {
    cors: {
        origin: '*', // Allow all origins
        methods: ['GET', 'POST']
    },
    pingTimeout: 10000, // 10 seconds
    pingInterval: 5000  // 5 seconds
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
    // Poll the APIs every 10 seconds
    if (!ticking) {
        setInterval(() => {
            ticking = true;
            hearbeat();
        }, 1000);
    }

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

// Serve static files (optional)
app.use(cors({
    origin: '*', // Allow all origins (you can specify a specific origin instead of *)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.set('transport', ['websocket']);
app.use(express.static('client'));
const roomsList = {};
const channelData = {};
// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);    // Join a specific room
    socket.on('joinRoom', (room) => {
        socket.join(room.channel);
        console.log(`Socket ${socket.id} joined room ${room.channel}`);
        if (!roomsList[room.channel]) {
            roomsList[room.channel] = [];
            channelData[room.channel] = room;
            addApiServiceInstance(room.channel);
        }
        roomsList[room.channel].push(socket.id);



    });

    // Handle messages sent to a specific room
    socket.on('sendMessage', ({ room, message }) => {
        io.to(room).emit('receiveMessage', { message, sender: socket.id });
        console.log(`Message from ${socket.id} to room ${room}: ${message}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        for (const channel in roomsList) {
            const index = roomsList[channel].indexOf(socket.id);
            if (index !== -1) {
                roomsList[channel].splice(index, 1); // Remove the socket.id from the room

                // Check if the room is empty
                if (roomsList[channel].length === 0) {
                    delete roomsList[channel]; // Delete the room if it's empty
                    delete channelData[channel];
                    removeApiServiceInstance(channel);
                }
                break; // Exit the loop once the socket.id is found and removed
            }
        }
    });
});


async function hearbeat() {
    console.log('tick');
    for (const channel in channelData) {
        console.log(channel);
        const service = apiServiceInstances[channel];
        if (service) {
            await service.getFeed();
        }
    }
}

function addApiServiceInstance(channel) {
    if (!apiServiceInstances[channel]) {
        apiServiceInstances[channel] = new ApiService(channelData[channel]);
        console.log(`ApiService instance created for channel: ${channel}`);
    }
}

function removeApiServiceInstance(channel) {
    if (apiServiceInstances[channel]) {
        // apiServiceInstances[channel].remove(); // Assuming your ApiService class has a remove method
        delete apiServiceInstances[channel];
        console.log(`ApiService instance removed for channel: ${channel}`);
    }
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

class ApiService {
    constructor(data) {
        this.apiKey = apiKey;
        this.baseHeaders = {
            'x-api-key': this.apiKey,
        };
        this.channel = data.channel;
        this.sport = data.sport
        this.group = data.group
        this.lang = data.lang
        // this.interval = setInterval(() => this.getFeed(), 10000);
        // console.log(`ApiService for room ${this.channel} started.`);
        // this.channel = this.sport + ':' + this.group + ':' + this.lang;
        this.get_matched_url = 'https://api.mfeedbo.com/api/matchfeed/getmatches/' + this.sport + '/' + this.group + '/' + this.lang;

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
            console.error('Error calling API 1:', error.message);
            throw error;
        }
    }

    async getFeed() {
        try {

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
                    console.log('broadcaasting');
                    this.previousData1 = data1;
                    io.to(this.channel).emit('updateFeed', { feed: data1 });
                } else {
                    console.log('same data')
                }
            }
        } catch (error) {
            console.error('Error polling APIs:', error.message);
        }
    }

    remove() {
        clearInterval(this.interval);
        console.log(`ApiService for room ${this.channel} stopped.`);
    }

}
