const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const apiKey = 'qyvpHLcynLwpM02TjsYmpgVk2qogg8PU';

const REDIS_HOST = 'localhost';
const REDIS_PORT = 6379;
const REDIS_PASSWORD = null;
let ticking = false;


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
        }
        roomsList[room.channel].push(socket.id);
        channelData[room.channel] = room;

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
                }
                break; // Exit the loop once the socket.id is found and removed
            }
        }
    });
});


function hearbeat() {
    console.log('tick');
    for (const channel in channelData) {
        console.log(channel);
        service = new ApiService(channelData[channel]);
        service.getFeed();
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
            console.error('Error calling API 1:', error);
            throw error;
        }
    }

    async getFeed() {
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
                    this.previousData1 = data1;
                    io.to(this.channel).emit('updateFeed', { feed: data1 });
                } else {
                    console.log('same data')
                }
            }
        } catch (error) {
            console.error('Error polling APIs:', error);
        }
    }


}