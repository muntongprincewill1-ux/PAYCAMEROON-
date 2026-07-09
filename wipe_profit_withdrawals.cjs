const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI.replace('/?', '/paycam?');
mongoose.connect(URI, { serverSelectionTimeoutMS: 3000 }).then(async () => {
    const db = mongoose.connection.db;
    const result = await db.collection('transactions').deleteMany({ type: 'profit_withdrawal' });
    console.log("Deleted profit_withdrawals:", result.deletedCount);
    process.exit(0);
}).catch(console.error);
