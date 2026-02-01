const { createClient } = require("redis");

const redis = createClient({
    host: 'localhost',
    port: 6379
});

let redisConnected = false;

redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
    console.warn('Running without Redis cache - using file storage only');
});

redis.on('connect', () => {
    redisConnected = true;
    console.log('Connected to Redis');
});

redis.connect().catch(() => {
    console.warn('Could not connect to Redis - please ensure Redis server is running');
    console.warn('To start Redis, run: redis-server');
});

// Load all chat conversations for a user from Redis
async function loadUserChatHistory(username) {
    const chatHistory = {};
    
    if (!redisConnected) {
        console.warn('Redis not connected, returning empty chat history');
        return chatHistory;
    }
    
    try {
        const chatKeys = await redis.keys('chat:*');
        
        for (const key of chatKeys) {
            const chatKey = key.replace('chat:', '');
            if (chatKey.includes(username)) {
                try {
                    const messages = await redis.lRange(key, 0, -1); // lRange = get all the list
                    chatHistory[chatKey] = messages.map(msg => JSON.parse(msg)).reverse();
                } catch (parseErr) {
                    console.error(`Error parsing messages for ${chatKey}:`, parseErr);
                }
            }
        }
    } catch (err) {
        console.error('Error loading chat history from Redis:', err);
    }
    return chatHistory;
}

async function saveUserStatus(username, socketId, status) {
    if (!redisConnected) return;
    
    try {
        await redis.hSet(`users:${username}`, {
            id: socketId,
            status: status,
            lastSeen: new Date().toISOString()
        });
        if (status === 'online') {
            await redis.sAdd('online_users', username);
        } else {
            await redis.sRem('online_users', username);
        }
    } catch (err) {
        console.error('Redis error:', err);
    }
}

async function saveMessage(chatKey, messageData) {
    if (!redisConnected) return;
    
    try {
        await redis.lPush(`chat:${chatKey}`, JSON.stringify(messageData));
        console.log(`Message stored in Redis for chat: ${chatKey}`);
    } catch (err) {
        console.error('Redis error:', err);
    }
}

module.exports = {
    redis,
    redisConnected: () => redisConnected,
    loadUserChatHistory,
    saveUserStatus,
    saveMessage
};
