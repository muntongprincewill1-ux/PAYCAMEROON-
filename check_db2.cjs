const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI.replace('/?', '/paycam?');
mongoose.connect(URI, { serverSelectionTimeoutMS: 3000 }).then(async () => {
    const db = mongoose.connection.db;
    const transactions = await db.collection('transactions').find({}).toArray();
    const withdrawals = transactions.filter(t => t.type === 'profit_withdrawal');
    console.log("Withdrawals:", withdrawals);
    process.exit(0);
}).catch(console.error);
