const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI.replace('/?', '/paycam?');
mongoose.connect(URI, { serverSelectionTimeoutMS: 3000 }).then(async () => {
    const db = mongoose.connection.db;
    await db.collection('transactions').insertOne({
        userId: "dummy",
        type: 'send',
        amount: 1000,
        fee: 50,
        commissionRecord: 0,
        createdAt: new Date(),
        status: 'completed'
    });
    console.log("Simulated tx");
    process.exit(0);
}).catch(console.error);
