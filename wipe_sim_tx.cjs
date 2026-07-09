const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI.replace('/?', '/paycam?');
mongoose.connect(URI, { serverSelectionTimeoutMS: 3000 }).then(async () => {
    const db = mongoose.connection.db;
    await db.collection('transactions').deleteMany({ userId: "dummy" });
    console.log("Deleted simulated tx");
    process.exit(0);
}).catch(console.error);
