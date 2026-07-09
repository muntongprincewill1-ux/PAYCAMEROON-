const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI.replace('/?', '/paycam?');
mongoose.connect(URI, { serverSelectionTimeoutMS: 3000 }).then(async () => {
    try {
        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).project({ pin: 0 }).toArray();
        console.log("Users:", users.length);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
});
