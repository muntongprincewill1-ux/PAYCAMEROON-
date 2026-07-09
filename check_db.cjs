const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI.replace('/?', '/paycam?');
mongoose.connect(URI, { serverSelectionTimeoutMS: 3000 }).then(async () => {
    const db = mongoose.connection.db;
    const transactions = await db.collection('transactions').find({}).toArray();
    console.log("Total txs:", transactions.length);
    const totalFees = transactions.reduce((sum, t) => sum + (t.fee || 0), 0);
    const totalComms = transactions.reduce((sum, t) => sum + (t.commissionRecord || 0), 0);
    const profitWithdrawn = transactions.filter(t => t.type === 'profit_withdrawal').reduce((sum, t) => sum + (t.amount || 0), 0);
    console.log("totalFees:", totalFees, "totalComms:", totalComms, "withdrawn:", profitWithdrawn);
    
    // Check some sample txs that have fee > 0
    const feeTxs = transactions.filter(t => (t.fee || 0) > 0);
    console.log("Txs with fee > 0:", feeTxs.length);
    if(feeTxs.length > 0) {
        console.log("Sample:", feeTxs[0]);
    }
    process.exit(0);
}).catch(console.error);
