process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err)); process.on("unhandledRejection", (reason, promise) => console.error("Unhandled Rejection:", reason));
import "express-async-errors";
import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Phone Validation Helpers
function isValidCameroonNumber(phone) {
    const cleaned = String(phone).replace(/\D/g, '');
    const num = cleaned.startsWith('237') ? cleaned.slice(3) : cleaned;
    if (num.length !== 9) return false;
    return /^[26]/.test(num);
}
function isMTNNumber(phone) {
    const cleaned = String(phone).replace(/\D/g, '');
    const num = cleaned.startsWith('237') ? cleaned.slice(3) : cleaned;
    if (num.length !== 9) return false;
    return /^(65[0-4]|67[0-9]|68[0-3])/.test(num);
}
function isOrangeNumber(phone) {
    const cleaned = String(phone).replace(/\D/g, '');
    const num = cleaned.startsWith('237') ? cleaned.slice(3) : cleaned;
    if (num.length !== 9) return false;
    return /^(65[5-9]|69[0-9])/.test(num);
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY?.trim() });

// --- Database Setup ---
let MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI && MONGODB_URI.includes('/?')) {
  MONGODB_URI = MONGODB_URI.replace('/?', '/paycam?');
}
console.log("MONGODB_URI:", MONGODB_URI);
let useMockDb = !MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
      console.error("MongoDB connection error. Falling back to in-memory mock database.", err.message);
      useMockDb = true;
    });
} else {
  console.log("No MONGODB_URI provided. Using in-memory mock database.");
}

// --- Mongoose Models ---
const userSchema = new mongoose.Schema({
  paycamId: { type: String, unique: true },
  name: String,
  phone: String,
  pin: String,
  balance: { type: Number, default: 0 },
  role: { type: String, default: 'user' }, // 'user', 'merchant', 'admin'
  businessName: String,
  kycVerified: { type: Boolean, default: false },
  status: { type: String, default: 'active' },
  blockReason: String,
  blockedAt: Date,
  commissionBalance: { type: Number, default: 0 },
  limits: {
    maxPerTransfer: Number,
    maxP2PTransfer: Number,
    maxDaily: Number,
    maxMonthly: Number,
    maxFloat: Number,
    maxDailyPayment: Number
  },
  level: { type: Number },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

const amlAlertSchema = new mongoose.Schema({
  userId: String,
  ruleTriggered: String,
  severity: String,
  description: String,
  status: { type: String, default: 'open' },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});
const AmlAlert = mongoose.model("AmlAlert", amlAlertSchema);
const kycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paycamId: String,
  name: String,
  documentType: String,
  documentNumber: String,
  status: { type: String, default: 'pending' },
  documentImage: String,
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: Date
});
const Kyc = mongoose.model("Kyc", kycSchema);


const floatRequestSchema = new mongoose.Schema({
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  agentName: String,
  agentPaycamId: String,
  amount: Number,
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});
const FloatRequest = mongoose.model("FloatRequest", floatRequestSchema);

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: String, // 'send', 'receive', 'deposit', 'withdraw', 'merchant_deposit', 'user_withdrawal', 'commission_withdrawal', 'pending_withdrawal'
  amount: Number,
  agency: String,
  recipient: String,
  status: { type: String, default: 'completed' },
  fee: Number,
  commissionRecord: Number, // Tracking commission earned
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.model("Transaction", transactionSchema);

// --- In-Memory Mock Data ---
const mockUsers = new Map<string, any>([
  ['admin', { _id: 'admin', paycamId: 'PC00000000', name: 'PayCam Admin', phone: '000000000', role: 'admin', pin: '00000', kycVerified: true }],
  ['finance', { _id: 'finance', paycamId: 'PC99999999', name: 'Finance Controller', phone: '999999999', role: 'finance', pin: '99999', kycVerified: true }],
  ['merchant1', { _id: 'merchant1', paycamId: 'PC11111111', name: 'Demo Merchant', businessName: 'Demo Store', phone: '111111111', role: 'merchant', balance: 500000, commissionBalance: 0, pin: '11111', kycVerified: true }],
  ['user1', { _id: 'user1', paycamId: 'PC12345678', name: 'Standard User', phone: '123456789', role: 'user', balance: 10000, pin: '12345', kycVerified: true }],
  ['support1', { _id: 'support1', paycamId: 'PC22222221', name: 'Support Agent L1', phone: '222222221', role: 'support', level: 1, pin: '22221', kycVerified: true }],
  ['support2', { _id: 'support2', paycamId: 'PC22222222', name: 'Support Agent L2', phone: '222222222', role: 'support', level: 2, pin: '22222', kycVerified: true }],
  ['support3', { _id: 'support3', paycamId: 'PC22222223', name: 'Support Agent L3', phone: '222222223', role: 'support', level: 3, pin: '22223', kycVerified: true }],
  ['compliance1', { _id: 'compliance1', paycamId: 'PC33333333', name: 'Compliance Officer', phone: '333333333', role: 'compliance', pin: '33333', kycVerified: true }],
  ['agent1', { _id: 'agent1', paycamId: 'PC44444444', name: 'Mobile Agent', phone: '444444444', role: 'agent', balance: 250000, commissionBalance: 0, floatBalance: 100000, pin: '44444', kycVerified: true }],
]);
const mockTransactions: any[] = [
  { _id: 'flag1', userId: 'user1', type: 'send', amount: 500000, agency: 'PayCam', recipient: 'PC99999999', fee: 5000, status: 'flagged', flagReason: 'Unusually high amount for account age', createdAt: new Date() }
];

const mockKycs: any[] = [
  { _id: 'kyc1', userId: 'user1', paycamId: 'PC12345678', name: 'Standard User', documentType: 'National ID', documentNumber: 'ID987654321', status: 'pending', submittedAt: new Date(Date.now() - 86400000) }
];

const mockNotifications: any[] = [];

async function creditPlatformProfit(feeAmount: number) {
  if (feeAmount === 0) return;
  if (useMockDb) {
    const revenueWallet = internalWalletsData.find(w => w.name === 'Revenue Wallet');
    if (revenueWallet) {
      revenueWallet.balance += feeAmount;
    }
  } else {
    try {
      let revenueWallet = await mongoose.models.InternalWallet.findOne({ name: 'Revenue Wallet' });
      if (!revenueWallet) {
        revenueWallet = new mongoose.models.InternalWallet({ name: 'Revenue Wallet', balance: 0 });
      }
      revenueWallet.balance += feeAmount;
      await revenueWallet.save();
    } catch (e) {
      console.error("Failed to credit platform profit", e);
    }
  }
}

function notifyUser(userId: any, title: string, message: string) {
  mockNotifications.unshift({
    _id: `notify_${Date.now()}_${mockIdCounter++}`,
    userId,
    title,
    message,
    read: false,
    createdAt: new Date()
  });
}

const mockAuditLogs: any[] = [
  { _id: 'audit1', officerId: 'compliance1', action: 'Reviewed KYC', targetId: 'kyc1', timestamp: new Date(Date.now() - 3600000), details: 'Started review of documentation.' }
];

const mockAmlAlerts: any[] = [
  { _id: 'aml1', userId: 'user1', ruleTriggered: 'Velocity Check', severity: 'High', description: '3 transfers >1M XAF within 24h', status: 'open', createdAt: new Date() }
];

const mockFloatRequests: any[] = [];

let mockAgentLogs: any[] = [
   { timestamp: new Date(), action: "Agent Initialized. Loading ML heuristic models...", type: "system" },
   { timestamp: new Date(), action: "Connecting to global sanctions and PEP databases...", type: "system" }
];

// Automated Threat Detection Agent Simulation
setInterval(async () => {
    const actions = [
       "Scanning incoming transactions in real-time...",
       "Running ML clustering on transaction nodes...",
       "Cross-referencing global sanctions and terrorism financing lists...",
       "Analyzing velocity of peer-to-peer transfers...",
       "Performing IP reputation and spoofing checks...",
       "Checking device fingerprinting heuristics...",
       "Analyzing dormant account reactivation patterns..."
    ];
    
    if (Math.random() < 0.15) {
       let ruleName = Math.random() > 0.5 ? 'Geo-Velocity Anomaly' : 'Structuring Anomaly';
       if (useMockDb) {
         mockAmlAlerts.unshift({
           _id: `aml_${Date.now()}_${mockIdCounter++}`,
           userId: 'system',
           ruleTriggered: ruleName,
           severity: Math.random() > 0.7 ? 'High' : 'Medium',
           description: `Automated agent detected unusual transaction patterns matching ${ruleName}.`,
           status: 'open',
           createdAt: new Date()
         });
         mockAgentLogs.unshift({ timestamp: new Date(), action: `Detected anomalous pattern: ${ruleName}. Generated Alert ID.`, type: "alert" });
       } else {
         AmlAlert.create({ userId: 'system',
           ruleTriggered: ruleName,
           severity: Math.random() > 0.7 ? 'High' : 'Medium',
           description: `Automated agent detected unusual transaction patterns matching ${ruleName}.`,
           status: 'open',
           createdAt: new Date()
         }).catch(console.error);
         AgentLog.create({ action: `Detected anomalous pattern: ${ruleName}. Generated Alert ID.`, type: "alert" }).catch(console.error);
       }
    } else {
       const action = actions[Math.floor(Math.random() * actions.length)];
       if (useMockDb) {
         mockAgentLogs.unshift({ timestamp: new Date(), action, type: "scan" });
       } else {
         AgentLog.create({ action, type: "scan" }).catch(console.error);
       }
    }
    
    if (mockAgentLogs.length > 50) mockAgentLogs.length = 50;
}, 1500);

let mockIdCounter = 1;

// Simple MTN/Orange Money style commission structure
function getAgentCommission(amount: number, type: 'cash_in' | 'cash_out', role?: string) {
  if (role === 'merchant') {
    return Math.floor(amount * ((systemSettings.merchantCommissionRate || 0) / 100));
  } else if (role === 'agent') {
    return Math.floor(amount * ((systemSettings.agentCommissionRate || 0) / 100));
  }
  
  // Fallback if role is not provided
  return Math.floor(amount * ((systemSettings.agentCommissionRate || 0) / 100));
}

// Helper to log audit events
function logAudit(officerId: string, action: string, targetId: string, details: string) {
  mockAuditLogs.unshift({
    _id: `audit_${Date.now()}_${mockIdCounter++}`,
    officerId,
    action,
    targetId,
    timestamp: new Date(),
    details
  });
}

// --- API Routes ---

app.use(async (req, res, next) => {
  if (req.method === 'POST' && (
      req.path.startsWith('/api/transactions/') || 
      req.path.startsWith('/api/merchant/') || 
      req.path.startsWith('/api/store/') || 
      req.path === '/api/user/request-withdrawal' || 
      req.path === '/api/user/approve-withdrawal'
  )) {
     const id = req.body.userId || req.body.merchantId;
     if (id) {
        let user;
        if (useMockDb) {
           user = mockUsers.get(id);
        } else {
           user = await mongoose.models.User?.findById(id).catch(() => null);
        }
        if (user && user.status?.startsWith('blocked')) {
           if (useMockDb) {
    mockAmlAlerts.unshift({ _id: `aml_${Date.now()}_${mockIdCounter++}`, userId: id, ruleTriggered: 'Blocked Account Transaction Attempt', severity: 'High', description: `Blocked user attempted a restricted action.`, status: 'open', createdAt: new Date() });
  } else {
    AmlAlert.create({ userId: id, ruleTriggered: 'Blocked Account Transaction Attempt', severity: 'High', description: `Blocked user attempted a restricted action.`, status: 'open', createdAt: new Date()  }).catch(console.error);
  }
           return res.status(401).json({ error: "Your account is currently blocked. You cannot perform this action." });
        }
     }
  }
  next();
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: useMockDb ? "in-memory" : "mongodb", dbName: mongoose.connection.name });
});

async function checkTransactionLimit(user: any, amount: number, type: string, destinationUser?: any) {
    if (!user || user.role === 'admin' || user.role === 'finance' || user.role === 'support' || user.role === 'compliance') return null;

    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0));
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let userTxs = [];
    if (useMockDb) {
        userTxs = mockTransactions.filter((t: any) => String(t.userId) === String(user._id) && t.status === 'completed');
    } else {
        const TransactionModel = mongoose.model("Transaction");
        userTxs = await TransactionModel.find({ userId: user._id, status: 'completed' });
    }

    const dailyTxs = userTxs.filter((t: any) => new Date(t.createdAt) >= todayStart && t.amount);
    const monthlyTxs = userTxs.filter((t: any) => new Date(t.createdAt) >= firstOfMonth && t.amount);
    
    const dailyAmount = dailyTxs.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const monthlyAmount = monthlyTxs.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const dailySent = dailyTxs.filter((t: any) => ['withdraw', 'send'].includes(t.type)).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    const limits = user.limits || {};

    if (user.role === 'user') {
        const maxTransfer = limits.maxPerTransfer || 5000000;
        const maxP2P = limits.maxP2PTransfer || 5000000;
        const dailyMax = limits.maxDaily || 100000000;
        const monthlyMax = limits.maxMonthly || 100000000;

        let isP2P = destinationUser && destinationUser.role === 'user';
        let transferLimit = isP2P ? maxP2P : maxTransfer;

        if (amount > transferLimit) {
            notifyUser(user._id, 'Security Alert: Transfer Limit', `Transfer limit of ${transferLimit.toLocaleString()} XAF exceeded.`);
            return `Exceeds single transaction limit of ${transferLimit.toLocaleString()} XAF for this action`;
        }
        if (dailyAmount + amount > dailyMax) {
            notifyUser(user._id, 'Security Alert: Daily Limit', `Daily limit of ${dailyMax.toLocaleString()} XAF exceeded.`);
            return `Exceeds daily transaction limit of ${dailyMax.toLocaleString()} XAF`;
        }
        if (monthlyAmount + amount > monthlyMax) {
            notifyUser(user._id, 'Security Alert: Monthly Limit', `Monthly limit of ${monthlyMax.toLocaleString()} XAF exceeded.`);
            return `Exceeds monthly transaction limit of ${monthlyMax.toLocaleString()} XAF`;
        }

    } else if (user.role === 'merchant') {
        const maxDailyPayment = limits.maxDailyPayment || 10000000;
        const maxHold = limits.maxFloat || 100000000;
        const maxDaily = limits.maxDaily || 100000000;
        
        if (type === 'send' || type === 'withdraw') {
            if (dailySent + amount > maxDailyPayment) {
                notifyUser(user._id, 'Security Alert: Daily Payment Limit', `Merchant daily payment limit of ${maxDailyPayment.toLocaleString()} XAF exceeded.`);
                return `Exceeds merchant daily payment limit of ${maxDailyPayment.toLocaleString()} XAF`;
            }
        } else {
            if (dailyAmount + amount > maxDaily) {
                notifyUser(user._id, 'Security Alert: Daily Txn Limit', `Merchant daily limit of ${maxDaily.toLocaleString()} XAF exceeded.`);
                return `Exceeds merchant daily transaction limit of ${maxDaily.toLocaleString()} XAF`;
            }
            if ((user.balance || 0) + amount > maxHold) {
                notifyUser(user._id, 'Security Alert: Balance Hold Limit', `Holding limit of ${maxHold.toLocaleString()} XAF exceeded.`);
                return `Exceeds merchant holding limit of ${maxHold.toLocaleString()} XAF`;
            }
        }
    } else if (user.role === 'agent') {
        const maxFloat = limits.maxFloat || 100000000;
        if (type !== 'send' && type !== 'withdraw') {
            if ((user.balance || 0) + amount > maxFloat) {
                notifyUser(user._id, 'Security Alert: Float Limit', `Agent float limit of ${maxFloat.toLocaleString()} XAF exceeded.`);
                return `Exceeds agent float limit of ${maxFloat.toLocaleString()} XAF`;
            }
        }
    }

    return null;
}

// Auth (Simulated Login/Register)
function generatePaycamId() {
  return 'PC' + Math.floor(10000000 + Math.random() * 90000000).toString();
}


app.post("/api/auth/forgot-pin", async (req, res) => {
    let { phone, name, newPin } = req.body;
    
    if (!phone || !name || !newPin) {
        return res.status(400).json({ error: "Phone, name, and new PIN are required" });
    }
    
    if (newPin.length !== 5 || !/^\d{5}$/.test(newPin)) {
        return res.status(400).json({ error: "PIN must be exactly 5 digits" });
    }
    
    try {
        let user;
        if (useMockDb) {
            // Find user by phone
            for (let [id, u] of mockUsers.entries()) {
                if (u.phone === phone) {
                    user = u;
                    break;
                }
            }
        } else {
            user = await User.findOne({ phone });
        }
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Check legal details (name)
        if (!user.name || user.name.toLowerCase() !== name.toLowerCase()) {
            return res.status(400).json({ error: "Details do not match our records" });
        }
        
        // Check balance
        if (user.balance > 25000) {
            return res.status(400).json({ error: "Your balance is above 25,000 XAF. For security reasons, please contact Support or Admin to reset your PIN." });
        }
        
        // Reset PIN
        if (useMockDb) {
            user.pin = newPin;
        } else {
            user.pin = newPin;
            await user.save();
        }
        
        res.json({ success: true, message: "PIN reset successfully" });
        
    } catch (err) {
        res.status(500).json({ error: "Failed to reset PIN" });
    }
});

app.post("/api/auth/login", async (req, res) => {
  let { phone, pin } = req.body;
  if(phone) phone = String(phone).trim();
  if(pin) pin = String(pin).trim();
  if (!pin || pin.length !== 5 || !/^\d{5}$/.test(pin)) {
    return res.status(400).json({ error: "PIN must be exactly 5 digits" });
  }

  try {
    let user;
    if (useMockDb) {
      user = Array.from(mockUsers.values()).find(u => u.phone === phone);
    } else {
      user = await User.findOne({ phone });
      
      if (!user) {
        if (phone === '999999999') {
          user = new User({ paycamId: 'PC99999999', name: 'Finance Controller', phone: '999999999', pin: '99999', role: 'finance' });
          await user.save();
        } else if (phone === '333333333') {
          user = new User({ paycamId: 'PC33333333', name: 'Compliance Officer', phone: '333333333', pin: '33333', role: 'compliance' });
          await user.save();
        } else if (phone === '000000000') {
          user = new User({ paycamId: 'PC00000000', name: 'Admin', phone: '000000000', pin: '00000', role: 'admin' });
          await user.save();
        } else if (phone === '444444444') {
          user = new User({ paycamId: 'PC44444444', name: 'Mobile Agent', phone: '444444444', pin: '44444', role: 'agent', balance: 250000 });
          await user.save();
        } else if (phone === '111111111') {
          user = new User({ paycamId: 'PC11111111', name: 'Demo Merchant', businessName: 'Demo Store', phone: '111111111', pin: '11111', role: 'merchant', balance: 500000 });
          await user.save();
        } else if (phone === '222222221') {
          user = new User({ paycamId: 'PC22222221', name: 'Support Agent L1', phone: '222222221', pin: '22221', role: 'support', level: 1 });
          await user.save();
        } else if (phone === '222222222') {
          user = new User({ paycamId: 'PC22222222', name: 'Support Agent L2', phone: '222222222', pin: '22222', role: 'support', level: 2 });
          await user.save();
        } else if (phone === '222222223') {
          user = new User({ paycamId: 'PC22222223', name: 'Support Agent L3', phone: '222222223', pin: '22223', role: 'support', level: 3 });
          await user.save();
        }
      }
      
      // Auto-fix role if it's the demo accounts
      if (user) {
        let changed = false;
        if (phone === '999999999' && user.role !== 'finance') {
          user.role = 'finance';
          changed = true;
        } else if (phone === '333333333' && user.role !== 'compliance') {
          user.role = 'compliance';
          changed = true;
        } else if (phone === '000000000' && user.role !== 'admin') {
          user.role = 'admin';
          changed = true;
        }
        if (changed) {
          await user.save();
        }
      }

      console.log('Login attempt for phone:', phone, 'User found:', user !== null);
      if (user) {
        console.log('User details _id type:', typeof user._id, user._id);
      }
    }

    if (!user) {
      return res.status(404).json({ error: "User not found. Please sign up." });
    } else if (user.pin !== pin) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    if (user.status === 'blocked_temporal') {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (user.blockedAt && (new Date().getTime() - new Date(user.blockedAt).getTime() > thirtyDays)) {
        user.status = 'blocked_permanent';
        if (!useMockDb) await user.save();
      }
    }

    if (user.status === 'blocked_permanent') {
      return res.status(401).json({ error: "This account has been permanently blocked. Please visit the nearest PayCam office." + (user.blockReason ? ` Reason: ${user.blockReason}` : "") });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  let { phone, pin, name } = req.body;
  if(phone) phone = String(phone).trim();
  if(pin) pin = String(pin).trim();
  if (!isValidCameroonNumber(phone)) return res.status(400).json({ error: "Invalid Cameroon phone number" });
  if (!pin || pin.length !== 5 || !/^\d{5}$/.test(pin)) return res.status(400).json({ error: "PIN must be exactly 5 digits" });
  try {
    const paycamId = generatePaycamId();
    if (useMockDb) {
      let existingUser = Array.from(mockUsers.values()).find(u => u.phone === phone);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this phone number." });
      }
      const user = { _id: String(mockIdCounter++), paycamId, phone, pin, name: name || "PayCam User", balance: 0, createdAt: new Date() };
      mockUsers.set(user._id, user);
      return res.json({ user });
    }

    let existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this phone number." });
    }
    const user = new User({ paycamId, phone, pin, name: name || "PayCam User" });
    await user.save();
    res.json({ user });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/merchant-signup", async (req, res) => {
  let { phone, pin, name, businessName, documentType, documentNumber } = req.body;
  if(phone) phone = String(phone).trim();
  if(pin) pin = String(pin).trim();
  
  if (!isValidCameroonNumber(phone)) return res.status(400).json({ error: "Invalid Cameroon phone number" });
  if (!pin || pin.length !== 5 || !/^\d{5}$/.test(pin)) return res.status(400).json({ error: "PIN must be exactly 5 digits" });

  try {
    const paycamId = generatePaycamId();
    if (useMockDb) {
      let existingUser = Array.from(mockUsers.values()).find(u => u.phone === phone);
      if (existingUser) return res.status(400).json({ error: "User already exists with this phone number." });
      
      const user = { 
        _id: String(mockIdCounter++), paycamId, phone, pin, name, businessName, 
        role: 'merchant', balance: 0, commissionBalance: 0, createdAt: new Date(),
        status: 'pending' 
      };
      mockUsers.set(user._id, user);
      
      pendingAdminApprovals.push({
          id: String(Date.now()),
          type: 'merchant_registration',
          requestedBy: user._id,
          date: new Date(),
          status: 'pending',
          metadata: { userId: user._id, name, businessName, phone, documentType, documentNumber }
      });
      
      return res.json({ success: true, pending: true, message: "Registration submitted. Request is under review." });
    }

    let existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ error: "User already exists with this phone number." });
    
    // Status can be pending (just use string instead of enum restriction if enum doesn't restrict it, standard user model allows string)
    const user = new User({ paycamId, phone, pin, name, businessName, role: 'merchant', balance: 0, commissionBalance: 0, status: 'pending' });
    await user.save();
    
    pendingAdminApprovals.push({
        id: String(Date.now()),
        type: 'merchant_registration',
        requestedBy: user._id.toString(),
        date: new Date(),
        status: 'pending',
        metadata: { userId: user._id.toString(), name, businessName, phone, documentType, documentNumber }
    });

    res.json({ success: true, pending: true, message: "Registration submitted. Request is under review." });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/fix-roles", async (req, res) => {
  await User.updateOne({ phone: '444444444' }, { $set: { role: 'agent', balance: 250000, paycamId: 'PC44444444' } });
  await User.updateOne({ phone: '111111111' }, { $set: { role: 'merchant', paycamId: 'PC11111111' } });
  await User.updateOne({ phone: '000000000' }, { $set: { role: 'admin' } });
  res.json({ success: true });
});

// Lookup User by PayCam ID
app.get("/api/users/lookup", async (req, res) => {
  const identifier = req.query.identifier as string;
  if (!identifier) return res.status(400).json({ error: "Identifier required" });
  
  const upperIdentifier = identifier.toUpperCase();
  try {
    let matchedUser = null;
    if (useMockDb) {
      matchedUser = Array.from(mockUsers.values()).find(u => u.paycamId === upperIdentifier || u.phone === identifier);
      if (!matchedUser && upperIdentifier === 'PC11111111') {
          matchedUser = { paycamId: 'PC11111111', name: 'Demo Merchant', businessName: 'Demo Store', role: 'merchant' };
      }
    } else {
      matchedUser = await User.findOne({ 
        $or: [{ paycamId: upperIdentifier }, { phone: identifier }] 
      });
    }

    if (!matchedUser) return res.status(404).json({ error: "User not found" });

    res.json({ 
      name: matchedUser.businessName || matchedUser.name,
      paycamId: matchedUser.paycamId || identifier,
      role: matchedUser.role
    });
  } catch (error) {
    res.status(500).json({ error: "Lookup failed" });
  }
});

// Get User Data
app.get("/api/user/:id", async (req, res) => {
  try {
    let returnUser = null;
    let returnTransactions = [];

    if (req.params.id === 'admin') {
      returnUser = { _id: 'admin', name: 'PayCam Admin', phone: '000000000', role: 'admin', pin: '00000' };
      returnTransactions = mockTransactions;
    } else if (req.params.id === 'merchant1') {
      returnUser = { _id: 'merchant1', name: 'Demo Merchant', businessName: 'Demo Store', phone: '111111111', role: 'merchant', balance: 500000, commissionBalance: 0, pin: '11111' };
      returnTransactions = mockTransactions.filter(t => String(t.userId) === 'merchant1');
    } else if (req.params.id === 'support1') {
      returnUser = { _id: 'support1', paycamId: 'PC22222221', name: 'Support Agent L1', phone: '222222221', role: 'support', level: 1, pin: '22221' };
      returnTransactions = [];
    } else if (req.params.id === 'support2') {
      returnUser = { _id: 'support2', paycamId: 'PC22222222', name: 'Support Agent L2', phone: '222222222', role: 'support', level: 2, pin: '22222' };
      returnTransactions = [];
    } else if (req.params.id === 'support3') {
      returnUser = { _id: 'support3', paycamId: 'PC22222223', name: 'Support Agent L3', phone: '222222223', role: 'support', level: 3, pin: '22223' };
      returnTransactions = [];
    } else if (useMockDb) {
      returnUser = mockUsers.get(req.params.id);
      returnTransactions = mockTransactions
        .filter(t => t.userId === req.params.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);
    } else {
      returnUser = await User.findById(req.params.id).catch(() => null);
      returnTransactions = await Transaction.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(10);
    }

    if (!returnUser) return res.status(404).json({ error: "User not found" });

    res.json({ user: returnUser, transactions: returnTransactions });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Compare Rates (Simulated)
app.post("/api/rates/compare", (req, res) => {
  const { amount } = req.body;
  const rates = [
    { agency: "PayCam", fee: Math.min(amount * 0.004, 400), time: "Instant", reliability: "High (Official)" },
    { agency: "MTN MoMo", fee: Math.min(amount * 0.005, 500), time: "Instant", reliability: "High" },
    { agency: "Orange Money", fee: Math.min(amount * 0.005, 500), time: "Instant", reliability: "High" },
    { agency: "Express Union", fee: amount * 0.015, time: "10 mins", reliability: "Medium" },
    { agency: "Express Exchange", fee: amount * 0.015, time: "10 mins", reliability: "Medium" }
  ];
  res.json({ rates });
});

// AI Smart Recommendation
app.post("/api/ai/recommend", async (req, res) => {
  const { amount, location } = req.body;
  try {
    const prompt = `As a financial AI assistant for PayCam in Cameroon, recommend the best mobile money agency (MTN MoMo, Orange Money, Express Union, or Wafacash) for sending ${amount} XAF from ${location}. Consider fees, speed, and reliability. Provide a short, concise recommendation in 2 sentences.`;
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ recommendation: "AI recommendations are currently unavailable. Please check your API key." });
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ recommendation: response.text });
  } catch (error: any) {
    if (error.message?.includes("API key not valid")) {
      console.error("AI Assistant error: The provided Gemini API Key is invalid.");
      return res.json({ recommendation: "AI recommendations are currently unavailable. Please check your API key." });
    } else {
      console.error("AI Error:", error.message || error);
    }
    res.status(500).json({ error: "AI recommendation failed" });
  }
});

// AI Chatbot (PayCamBot)
app.post("/api/ai/chat", async (req, res) => {
  const { message } = req.body;
  try {
    const prompt = `You are PayCamBot, an AI assistant for the PayCam mobile payment app in Cameroon. 
    Help the user with their query: "${message}". Keep responses short, helpful, and friendly. 
    You can answer questions about MTN MoMo, Orange Money, rates, and how to use PayCam.`;
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ reply: "I'm sorry, my AI features are currently unavailable. Please check your API key." });
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ reply: response.text });
  } catch (error: any) {
    if (error.message?.includes("API key not valid")) {
      console.error("AI Assistant error: The provided Gemini API Key is invalid.");
      return res.json({ reply: "I'm sorry, my AI features are currently unavailable. Please check your API key." });
    } else {
      console.error("AI Error:", error.message || error);
    }
    res.status(500).json({ error: "Chat failed" });
  }
});

// Send Money (PayCam to PayCam)
app.post("/api/transactions/send", async (req, res) => {
  const { userId, amount, recipient } = req.body;
  try {
    const fee = (amount * (systemSettings.transferFeePercent / 100)) + systemSettings.transferFeeFixed;
    const totalDeduction = amount + fee;
    const upperRecipient = recipient.toUpperCase();

    let recipientUser = null;

    if (useMockDb) {
      const sender = mockUsers.get(userId);
      if (!sender) return res.status(404).json({ error: "Sender not found" });
      if (sender.status?.startsWith('blocked')) return res.status(401).json({ error: "Account blocked" });
      
      recipientUser = Array.from(mockUsers.values()).find(u => u.paycamId === upperRecipient || u.phone === recipient);
      
      if (!recipientUser && upperRecipient === 'PC11111111') {
        recipientUser = { _id: 'merchant1', paycamId: 'PC11111111', name: 'Demo Merchant', businessName: 'Demo Store', phone: '111111111', role: 'merchant', balance: 500000, commissionBalance: 0 };
        mockUsers.set('merchant1', recipientUser);
      }

      if (!recipientUser) return res.status(404).json({ error: "Recipient is not a PayCam user" });
      if (sender.paycamId === upperRecipient || sender.phone === recipient) return res.status(400).json({ error: "Cannot send to yourself" });

      const limitError = await checkTransactionLimit(sender, amount, 'send', recipientUser);
      if (limitError) return res.status(400).json({ error: limitError });
      
      const receiveLimitError = await checkTransactionLimit(recipientUser, amount, 'receive', sender);
      if (receiveLimitError) return res.status(400).json({ error: receiveLimitError });

      if (sender.balance < totalDeduction) return res.status(400).json({ error: "Insufficient balance" });
      
      // FRAUD DETECTION
      let txStatus = 'completed';
      let flagReason = undefined;
      
      if (amount > 5000000 && sender.role === 'user') {
        txStatus = 'flagged';
        flagReason = 'Potential Money Laundering';
        if (useMockDb) {
    mockAmlAlerts.unshift({
           _id: `aml_${Date.now()}_${mockIdCounter++}`,
           userId: sender._id,
           ruleTriggered: 'Potential Money Laundering',
           severity: 'High',
           description: `Transfer of ${amount} XAF exceeds the 5,000,000 XAF threshold for standard users.`,
           status: 'open',
           createdAt: new Date()
        });
  } else {
    AmlAlert.create({ userId: sender._id,
           ruleTriggered: 'Potential Money Laundering',
           severity: 'High',
           description: `Transfer of ${amount} XAF exceeds the 5,000,000 XAF threshold for standard users.`,
           status: 'open',
           createdAt: new Date()
         }).catch(console.error);
  }
      } else if (amount >= 1000000) {
        txStatus = 'flagged';
        flagReason = 'High Volume Transfer';
        if (useMockDb) {
    mockAmlAlerts.unshift({
           _id: `aml_${Date.now()}_${mockIdCounter++}`,
           userId: sender._id,
           ruleTriggered: 'High Volume Transfer',
           severity: 'High',
           description: `Transfer of ${amount} XAF exceeds automatic threshold.`,
           status: 'open',
           createdAt: new Date()
        });
  } else {
    AmlAlert.create({ userId: sender._id,
           ruleTriggered: 'High Volume Transfer',
           severity: 'High',
           description: `Transfer of ${amount} XAF exceeds automatic threshold.`,
           status: 'open',
           createdAt: new Date()
         }).catch(console.error);
  }
      }

    if (txStatus === 'completed') {
        sender.balance -= totalDeduction;
        recipientUser.balance += amount;
        notifyUser(sender._id, 'Transfer Successful', `You sent ${amount.toLocaleString()} XAF to ${recipientUser.name || recipientUser.phone}.`);
        notifyUser(recipientUser._id, 'Payment Received', `You received ${amount.toLocaleString()} XAF from ${sender.name || sender.phone}.`);
        await creditPlatformProfit(fee);
      }

      const transactionOut = {
        _id: String(mockIdCounter++),
        userId, type: 'send', amount, agency: 'PayCam', recipient: upperRecipient, fee, status: txStatus, flagReason, createdAt: new Date()
      };
      mockTransactions.push(transactionOut);

      if (txStatus === 'completed') {
        const transactionIn = {
          _id: String(mockIdCounter++),
          userId: recipientUser._id, type: 'receive', amount, agency: 'PayCam', recipient: sender.phone, fee: 0, status: 'completed', createdAt: new Date()
        };
        mockTransactions.push(transactionIn);
      }
      
      return res.json({ success: true, transaction: transactionOut, newBalance: sender.balance });
    }

    const sender = await User.findById(userId).catch(() => null);
    if (!sender) return res.status(404).json({ error: "Sender not found" });
    if (sender.status?.startsWith('blocked')) return res.status(401).json({ error: "Account blocked" });
    
    recipientUser = await User.findOne({ $or: [{ paycamId: upperRecipient }, { phone: recipient }] });
    if (!recipientUser) return res.status(404).json({ error: "Recipient is not a PayCam user" });
    if (sender.paycamId === upperRecipient || sender.phone === recipient) return res.status(400).json({ error: "Cannot send to yourself" });

    const limitError = await checkTransactionLimit(sender, amount, 'send', recipientUser);
    if (limitError) return res.status(400).json({ error: limitError });
    
    const receiveLimitError = await checkTransactionLimit(recipientUser, amount, 'receive', sender);
    if (receiveLimitError) return res.status(400).json({ error: receiveLimitError });

    if (sender.balance < totalDeduction) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    sender.balance -= totalDeduction;
    recipientUser.balance += amount;
    
    await sender.save();
    await recipientUser.save();
    
    notifyUser(sender._id, 'Transfer Successful', `You sent ${amount.toLocaleString()} XAF to ${recipientUser.name || recipientUser.phone}.`);
    notifyUser(recipientUser._id, 'Payment Received', `You received ${amount.toLocaleString()} XAF from ${sender.name || sender.phone}.`);
    
    const transactionOut = new Transaction({
      userId, type: 'send', amount, agency: 'PayCam', recipient: upperRecipient, fee
    });
    const transactionIn = new Transaction({
      userId: recipientUser._id, type: 'receive', amount, agency: 'PayCam', recipient: sender.phone, fee: 0
    });
    
    await transactionOut.save();
    await transactionIn.save();
    
    res.json({ success: true, transaction: transactionOut, newBalance: sender.balance });
  } catch (error) {
    res.status(500).json({ error: "Transaction failed" });
  }
});

async function getCampayToken() {
  const res = await fetch("https://demo.campay.net/api/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.CAMPAY_USERNAME,
      password: process.env.CAMPAY_PASSWORD
    })
  });
  if (!res.ok) throw new Error("Failed to get CamPay token");
  const data = await res.json();
  return data.token;
}

function formatCameroonNumber(phone: string) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('237')) return cleaned;
  return '237' + cleaned;
}

async function campayCollect(amount: number, phone: string, reference: string) {
  const token = await getCampayToken();
  const res = await fetch("https://demo.campay.net/api/collect/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`
    },
    body: JSON.stringify({
      amount: amount,
      from: formatCameroonNumber(phone),
      description: "from paycam",
      external_reference: reference
    })
  });
  const data = await res.json();
  if (!res.ok || data.error_code) throw new Error(data.message || "Campay collect failed");

  if (data.reference) {
    let status = "PENDING";
    let attempts = 0;
    while (status === "PENDING" && attempts < 15) {
      await new Promise(r => setTimeout(r, 2000));
      const checkRes = await fetch(`https://demo.campay.net/api/transaction/${data.reference}/`, {
        method: "GET",
        headers: { "Authorization": `Token ${token}` }
      });
      if (checkRes.ok) {
         const checkData = await checkRes.json();
         status = checkData.status;
      }
      attempts++;
    }
    if (status === "PENDING" && useMockDb && phone.includes("671234567")) {
        console.log("Mocking SUCCESSFUL status for test number.");
        status = "SUCCESSFUL";
    }

    if (status === "FAILED") throw new Error("Transaction failed or rejected by user.");
    if (status !== "SUCCESSFUL") {
       throw new Error("Transaction timeout or still pending.");
    }
  }

  return data;
}

async function campayWithdraw(amount: number, phone: string, reference: string) {
  const token = await getCampayToken();
  const res = await fetch("https://demo.campay.net/api/withdraw/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`
    },
    body: JSON.stringify({
      amount: amount,
      to: formatCameroonNumber(phone),
      description: "from paycam",
      external_reference: reference
    })
  });
  const data = await res.json();
  if (!res.ok || data.error_code) throw new Error(data.message || "Campay withdraw failed");
  return data;
}

// Deposit Money (Bank to PayCam)
app.post("/api/transactions/deposit", async (req, res) => {
  const { userId, amount, bankAccount } = req.body;
  try {
    if (useMockDb) {
      const user = mockUsers.get(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const limitError = await checkTransactionLimit(user, amount, 'deposit');
      if (limitError) return res.status(400).json({ error: limitError });
      
      if (bankAccount.startsWith('MTN') || bankAccount.startsWith('Orange')) {
         const op = bankAccount.startsWith('MTN') ? 'MTN' : 'Orange';
         const phoneParts = bankAccount.split(' - ');
         if (phoneParts.length > 1) {
            const num = phoneParts[1];
            if (op === 'MTN' && !isMTNNumber(num)) return res.status(400).json({ error: "Invalid MTN Cameroon number" });
            if (op === 'Orange' && !isOrangeNumber(num)) return res.status(400).json({ error: "Invalid Orange Cameroon number" });
            try {
               await campayCollect(amount, phoneParts[1], "paycam-" + Date.now());
            } catch (e: any) {
               return res.status(400).json({ error: "Mobile Money deposit failed: " + e.message });
            }
         }
      }
      
      // FRAUD DETECTION
      let txStatus = 'completed';
      let flagReason = undefined;
      
      if (amount > 5000000 && user.role === 'user') {
        txStatus = 'flagged';
        flagReason = 'Potential Money Laundering';
        if (useMockDb) {
    mockAmlAlerts.unshift({
           _id: `aml_${Date.now()}_${mockIdCounter++}`,
           userId,
           ruleTriggered: 'Potential Money Laundering',
           severity: 'High',
           description: `Deposit of ${amount} XAF exceeds the 5,000,000 XAF threshold for standard users.`,
           status: 'open',
           createdAt: new Date()
        });
  } else {
    AmlAlert.create({ userId,
           ruleTriggered: 'Potential Money Laundering',
           severity: 'High',
           description: `Deposit of ${amount} XAF exceeds the 5,000,000 XAF threshold for standard users.`,
           status: 'open',
           createdAt: new Date()
         }).catch(console.error);
  }
      }

      if (txStatus === 'completed') {
        user.balance += amount;
        notifyUser(user._id, 'Bank Deposit', `Your deposit of ${amount.toLocaleString()} XAF from bank account has been confirmed.`);
      }
      const transaction = {
        _id: String(mockIdCounter++),
        userId, type: 'deposit', amount, agency: 'Bank', recipient: bankAccount, fee: 0, status: txStatus, flagReason, createdAt: new Date()
      };
      mockTransactions.push(transaction);
      return res.json({ success: true, transaction, newBalance: user.balance });
    }

    const user = await User.findById(userId).catch(() => null);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const limitError = await checkTransactionLimit(user, amount, 'deposit');
    if (limitError) return res.status(400).json({ error: limitError });

    if (bankAccount.startsWith('MTN') || bankAccount.startsWith('Orange')) {
         const op = bankAccount.startsWith('MTN') ? 'MTN' : 'Orange';
         const phoneParts = bankAccount.split(' - ');
         if (phoneParts.length > 1) {
            const num = phoneParts[1];
            if (op === 'MTN' && !isMTNNumber(num)) return res.status(400).json({ error: "Invalid MTN Cameroon number" });
            if (op === 'Orange' && !isOrangeNumber(num)) return res.status(400).json({ error: "Invalid Orange Cameroon number" });
            try {
             await campayCollect(amount, phoneParts[1], "paycam-" + Date.now());
          } catch (e: any) {
             return res.status(400).json({ error: "Mobile Money deposit failed: " + e.message });
          }
       }
    }

    user.balance += amount;
    await user.save();
    notifyUser(user._id, 'Bank Deposit', `Your deposit of ${amount.toLocaleString()} XAF from bank account has been confirmed.`);

    
    const transaction = new Transaction({
      userId, type: 'deposit', amount, agency: 'Bank', recipient: bankAccount, fee: 0
    });
    await transaction.save();
    
    res.json({ success: true, transaction, newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ error: "Deposit failed" });
  }
});

// Withdraw Money (PayCam to Bank)
app.post("/api/transactions/withdraw", async (req, res) => {
  const { userId, amount, bankAccount } = req.body;
  try {
    if (useMockDb) {
      const user = mockUsers.get(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      if (user.balance < amount) return res.status(400).json({ error: "Insufficient balance" });
      
      const limitError = await checkTransactionLimit(user, amount, 'withdraw');
      if (limitError) return res.status(400).json({ error: limitError });
      
      if (bankAccount.startsWith('MTN') || bankAccount.startsWith('Orange')) {
         const op = bankAccount.startsWith('MTN') ? 'MTN' : 'Orange';
         const phoneParts = bankAccount.split(' - ');
         if (phoneParts.length > 1) {
            const num = phoneParts[1];
            if (op === 'MTN' && !isMTNNumber(num)) return res.status(400).json({ error: "Invalid MTN Cameroon number" });
            if (op === 'Orange' && !isOrangeNumber(num)) return res.status(400).json({ error: "Invalid Orange Cameroon number" });
            try {
               await campayWithdraw(amount, phoneParts[1], "paycam-" + Date.now());
            } catch (e: any) {
               return res.status(400).json({ error: "Mobile Money withdrawal failed: " + e.message });
            }
         }
      }
      
      // FRAUD DETECTION
      let txStatus = 'completed';
      let flagReason = undefined;
      // For instance, multiple rapid transactions or unusual
      if (amount > 5000000 && user.role === 'user') {
        txStatus = 'flagged';
        flagReason = 'Potential Money Laundering';
        if (useMockDb) {
    mockAmlAlerts.unshift({
           _id: `aml_${Date.now()}_${mockIdCounter++}`,
           userId,
           ruleTriggered: 'Potential Money Laundering',
           severity: 'High',
           description: `Withdrawal of ${amount} XAF exceeds the 5,000,000 XAF threshold for standard users.`,
           status: 'open',
           createdAt: new Date()
        });
  } else {
    AmlAlert.create({ userId,
           ruleTriggered: 'Potential Money Laundering',
           severity: 'High',
           description: `Withdrawal of ${amount} XAF exceeds the 5,000,000 XAF threshold for standard users.`,
           status: 'open',
           createdAt: new Date()
         }).catch(console.error);
  }
      } else if (amount >= 500000) {
        txStatus = 'flagged';
        flagReason = 'Unusual Withdrawal Pattern';
        if (useMockDb) {
    mockAmlAlerts.unshift({
           _id: `aml_${Date.now()}_${mockIdCounter++}`,
           userId,
           ruleTriggered: 'Unusual Withdrawal Pattern',
           severity: 'Medium',
           description: `Withdrawal of ${amount} XAF exceeds typical usage pattern.`,
           status: 'open',
           createdAt: new Date()
        });
  } else {
    AmlAlert.create({ userId,
           ruleTriggered: 'Unusual Withdrawal Pattern',
           severity: 'Medium',
           description: `Withdrawal of ${amount} XAF exceeds typical usage pattern.`,
           status: 'open',
           createdAt: new Date()
         }).catch(console.error);
  }
      }

      if (txStatus === 'completed') {
        user.balance -= amount;
        notifyUser(user._id, 'Bank Withdrawal', `Your withdrawal of ${amount.toLocaleString()} XAF to bank account has been confirmed.`);
      }
      const transaction = {
        _id: String(mockIdCounter++),
        userId, type: 'withdraw', amount, agency: 'Bank', recipient: bankAccount, fee: 0, status: txStatus, flagReason, createdAt: new Date()
      };
      mockTransactions.push(transaction);
      return res.json({ success: true, transaction, newBalance: user.balance });
    }

    const user = await User.findById(userId).catch(() => null);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (user.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    const limitError = await checkTransactionLimit(user, amount, 'withdraw');
    if (limitError) return res.status(400).json({ error: limitError });
    
    if (bankAccount.startsWith('MTN') || bankAccount.startsWith('Orange')) {
         const op = bankAccount.startsWith('MTN') ? 'MTN' : 'Orange';
         const phoneParts = bankAccount.split(' - ');
         if (phoneParts.length > 1) {
            const num = phoneParts[1];
            if (op === 'MTN' && !isMTNNumber(num)) return res.status(400).json({ error: "Invalid MTN Cameroon number" });
            if (op === 'Orange' && !isOrangeNumber(num)) return res.status(400).json({ error: "Invalid Orange Cameroon number" });
            try {
             await campayWithdraw(amount, phoneParts[1], "paycam-" + Date.now());
          } catch (e: any) {
             return res.status(400).json({ error: "Mobile Money withdrawal failed: " + e.message });
          }
       }
    }

    user.balance -= amount;
    await user.save();
    notifyUser(user._id, 'Bank Withdrawal', `Your withdrawal of ${amount.toLocaleString()} XAF to bank account has been confirmed.`);
    
    const transaction = new Transaction({
      userId, type: 'withdraw', amount, agency: 'Bank', recipient: bankAccount, fee: 0
    });
    await transaction.save();
    
    res.json({ success: true, transaction, newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ error: "Withdrawal failed" });
  }
});

// --------------------- AGENT ENDPOINTS ---------------------
app.post("/api/agent/cash-in", async (req, res) => {
  const { agentId, paycamId, amount } = req.body;
  try {
    let agent = useMockDb ? mockUsers.get(agentId) : await User.findById(agentId).catch(() => null);
    if (!agent && agentId === 'agent1') {
      agent = mockUsers.get('agent1') || { _id: 'agent1', paycamId: 'AG11111111', name: 'Demo Agent', phone: '111111111', role: 'agent', balance: 500000, commissionBalance: 0 };
      if (!useMockDb) agent.save = async () => {};
    }
    if (!agent || agent.role !== 'agent') return res.status(401).json({ error: "Unauthorized" });

    const searchPaycam = String(paycamId).trim().toUpperCase();
    let user = useMockDb ? Array.from(mockUsers.values()).find(u => u.paycamId === searchPaycam || u.phone === String(paycamId).trim()) : await User.findOne({ 
      $or: [{ paycamId: searchPaycam }, { phone: String(paycamId).trim() }] 
    }).catch(() => null);
    if (!user && (searchPaycam === 'PC00000000' || String(paycamId).trim() === '000000000')) {
        user = mockUsers.get('user1') || { _id: 'user1', paycamId: 'PC00000000', name: 'Demo User', phone: '000000000', role: 'user', balance: 15000 };
    }
    if (!user) return res.status(404).json({ error: "User not found" });

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const limitError = await checkTransactionLimit(agent, numAmount, 'send', user);
    if (limitError) return res.status(400).json({ error: limitError });
    
    const receiveLimitError = await checkTransactionLimit(user, numAmount, 'receive', agent);
    if (receiveLimitError) return res.status(400).json({ error: receiveLimitError });

    if (agent.balance < numAmount) return res.status(400).json({ error: "Insufficient agent balance (float)" });

    agent.balance -= numAmount;
    user.balance = Number(user.balance) + numAmount;
    
    // Add Commission
    const commission = getAgentCommission(numAmount, 'cash_in', agent ? agent.role : 'agent');
    agent.commissionBalance = Number(agent.commissionBalance || 0) + commission;

    notifyUser(user._id, 'Deposit Successful', `You successfully deposited ${numAmount.toLocaleString()} XAF via agent ${agent.name || agent.phone}.`);
    notifyUser(agent._id, 'Processed Deposit', `You processed a deposit of ${numAmount.toLocaleString()} XAF for ${user.name || user.phone}.`);
    await creditPlatformProfit(-commission);

    if (useMockDb) {
      mockTransactions.push(
        { _id: String(mockIdCounter++), userId: agent._id, type: 'agent_cash_in_out', amount: numAmount, agency: 'PayCam', recipient: user.paycamId, fee: 0, commissionRecord: commission, status: 'completed', createdAt: new Date() },
        { _id: String(mockIdCounter++), userId: user._id, type: 'deposit', amount: numAmount, agency: 'Agent', recipient: agent.name, fee: 0, status: 'completed', createdAt: new Date() }
      );
      return res.json({ success: true, newBalance: agent.balance, commission: agent.commissionBalance });
    }

    await agent.save();
    await user.save();
    
    await Transaction.create([
      { userId: agent._id, type: 'agent_cash_in_out', amount: numAmount, agency: 'PayCam', recipient: user.paycamId, fee: 0, commissionRecord: commission },
      { userId: user._id, type: 'deposit', amount: numAmount, agency: 'Agent', recipient: agent.name, fee: 0 }
    ]);
    
    return res.json({ success: true, newBalance: agent.balance, commission: agent.commissionBalance });
  } catch (error: any) {
    console.error("Cash-in error:", error);
    res.status(500).json({ error: "Cash-in failed: " + error.message });
  }
});

app.post("/api/agent/cash-out", async (req, res) => {
  const { agentId, paycamId, amount } = req.body;
  try {
    let agent = useMockDb ? mockUsers.get(agentId) : await User.findById(agentId).catch(() => null);
    if (!agent && agentId === 'agent1') {
      agent = mockUsers.get('agent1') || { _id: 'agent1', paycamId: 'AG11111111', name: 'Demo Agent', phone: '111111111', role: 'agent', balance: 500000, commissionBalance: 0 };
      if (!useMockDb) agent.save = async () => {};
    }
    if (!agent || agent.role !== 'agent') return res.status(401).json({ error: "Unauthorized" });

    const searchPaycam = String(paycamId).trim().toUpperCase();
    let user = useMockDb ? Array.from(mockUsers.values()).find(u => u.paycamId === searchPaycam || u.phone === String(paycamId).trim()) : await User.findOne({ 
      $or: [{ paycamId: searchPaycam }, { phone: String(paycamId).trim() }] 
    }).catch(() => null);
    if (!user && (searchPaycam === 'PC00000000' || String(paycamId).trim() === '000000000')) {
        user = mockUsers.get('user1') || { _id: 'user1', paycamId: 'PC00000000', name: 'Demo User', phone: '000000000', role: 'user', balance: 15000 };
    }
    if (!user) return res.status(404).json({ error: "User not found" });

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const totalFee = (numAmount * (systemSettings.withdrawalFeePercent / 100)) + systemSettings.withdrawalFeeFixed;
    const totalDeduction = numAmount + totalFee;

    if (user.balance < totalDeduction) return res.status(400).json({ error: "User has insufficient balance" });

    console.log("Checking mock conditions:", { useMockDb, userId: user._id, agentId: agent._id, isUser1: user._id === 'user1', isAgent1: agent._id === 'agent1', isUser1String: String(user._id) === 'user1', isAgent1String: String(agent._id) === 'agent1' });
    if (useMockDb || String(user._id) === 'user1' || String(agent._id) === 'agent1') {
      mockTransactions.push(
        { _id: String(mockIdCounter++), userId: user._id, type: 'pending_withdrawal', amount: numAmount, agency: 'Agent', recipient: agent.name, fee: totalFee, status: 'pending', merchantId: agent._id, createdAt: new Date() }
      );
      return res.json({ success: true, pending: true, message: "Awaiting user approval" });
    }
    
    await Transaction.create(
      { userId: user._id, type: 'pending_withdrawal', amount: numAmount, agency: 'Agent', recipient: agent.name, fee: totalFee, status: 'pending', merchantId: agent._id }
    );
    
    return res.json({ success: true, pending: true, message: "Awaiting user approval" });
  } catch (error: any) {
    console.error("Cash-out error:", error);
    res.status(500).json({ error: "Cash-out failed: " + error.message });
  }
});

app.post("/api/agent/request-float", async (req, res) => {
  const { agentId, amount } = req.body;
  try {
    let agent = useMockDb ? mockUsers.get(agentId) : await User.findById(agentId).catch(() => null);
    if (!agent && agentId === 'agent1') {
      agent = mockUsers.get('agent1') || { _id: 'agent1', paycamId: 'AG11111111', name: 'Demo Agent', phone: '111111111', role: 'agent', balance: 500000, commissionBalance: 0 };
      if (!useMockDb) agent.save = async () => {};
    }
    if (!agent || agent.role !== 'agent') return res.status(401).json({ error: "Unauthorized" });
    
    if (amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    let requestObj;
    if (useMockDb) {
      requestObj = {
        _id: `float_${Date.now()}_${mockIdCounter++}`,
        agentId: agent._id,
        agentName: agent.name || agent.businessName || agent.paycamId,
        agentPaycamId: agent.paycamId,
        amount,
        status: 'pending',
        createdAt: new Date()
      };
      mockFloatRequests.unshift(requestObj);
    } else {
      requestObj = new FloatRequest({
        agentId: agent._id,
        agentName: agent.name || agent.businessName || agent.paycamId,
        agentPaycamId: agent.paycamId,
        amount,
        status: 'pending'
      });
      await requestObj.save();
    }
    
    res.json({ success: true, message: "Float request submitted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Float request failed: " + error.message });
  }
});

app.post("/api/agent/transfer-float", async (req, res) => {
  const { agentId, paycamId, amount } = req.body;
  try {
    let agent = useMockDb ? mockUsers.get(agentId) : await User.findById(agentId).catch(() => null);
    if (!agent && agentId === 'agent1') {
      agent = mockUsers.get('agent1') || { _id: 'agent1', paycamId: 'AG11111111', name: 'Demo Agent', phone: '111111111', role: 'agent', balance: 500000, commissionBalance: 0 };
      if (!useMockDb) agent.save = async () => {};
    }
    if (!agent || agent.role !== 'agent') return res.status(401).json({ error: "Unauthorized" });

    const searchPaycam = String(paycamId).trim().toUpperCase();
    const merchant = useMockDb ? Array.from(mockUsers.values()).find(u => u.paycamId === searchPaycam || u.phone === String(paycamId).trim()) : await User.findOne({ 
      $or: [{ paycamId: searchPaycam }, { phone: String(paycamId).trim() }] 
    });
    if (!merchant) return res.status(404).json({ error: "Merchant not found" });

    // Validate that the receiver is a merchant
    if (merchant.role !== 'merchant' && merchant.role !== 'admin' && merchant.role !== 'agent') {
      return res.status(400).json({ error: "Float transfer is only allowed between Agents and Merchants." });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const limitError = await checkTransactionLimit(agent, numAmount, 'send', merchant);
    if (limitError) return res.status(400).json({ error: limitError });
    
    const receiveLimitError = await checkTransactionLimit(merchant, numAmount, 'receive', agent);
    if (receiveLimitError) return res.status(400).json({ error: receiveLimitError });

    if (agent.balance < numAmount) return res.status(400).json({ error: "Insufficient float balance" });

    agent.balance -= numAmount;
    merchant.balance = Number(merchant.balance || 0) + numAmount;
    
    notifyUser(agent._id, 'Float Transfer Successful', `You successfully transferred ${numAmount.toLocaleString()} XAF float to ${merchant.name || merchant.businessName}.`);
    notifyUser(merchant._id, 'Float Received', `You received ${numAmount.toLocaleString()} XAF float from agent ${agent.name || agent.phone}.`);

    // Fee depends on transfer rules, for float transfer it can be 0 or small fee. Let's use 0 fee for float transfer
    if (useMockDb) {
      mockTransactions.push(
        { _id: String(mockIdCounter++), userId: agent._id, type: 'transfer', amount: numAmount, agency: 'PayCam', recipient: merchant.paycamId, fee: 0, status: 'completed', createdAt: new Date() },
        { _id: String(mockIdCounter++), userId: merchant._id, type: 'deposit', amount: numAmount, agency: 'Agent', recipient: agent.name, fee: 0, status: 'completed', createdAt: new Date() }
      );
      return res.json({ success: true, newBalance: agent.balance, message: "Float transferred successfully" });
    }

    await agent.save();
    await merchant.save();
    
    await Transaction.create([
      { userId: agent._id, type: 'transfer', amount: numAmount, agency: 'PayCam', recipient: merchant.paycamId, fee: 0 },
      { userId: merchant._id, type: 'deposit', amount: numAmount, agency: 'Agent', recipient: agent.name, fee: 0 }
    ]);
    
    return res.json({ success: true, newBalance: agent.balance, message: "Float transferred successfully" });
  } catch (error: any) {
    console.error("Float transfer error:", error);
    res.status(500).json({ error: "Float transfer failed: " + error.message });
  }
});


app.post("/api/agent/withdraw-commission", async (req, res) => {
  const { agentId, amount, method, destination } = req.body;
  try {
    let agent = useMockDb ? mockUsers.get(agentId) : await User.findById(agentId).catch(() => null);
    
    // Demo fallback
    if (!agent && agentId === 'agent1') {
      agent = { _id: 'agent1', paycamId: 'AG11111111', name: 'Demo Agent', phone: '111111111', role: 'agent', balance: 500000, commissionBalance: 0 };
      if (useMockDb) mockUsers.set('agent1', agent);
    }
    
    if (!agent || agent.role !== 'agent') return res.status(401).json({ error: "Unauthorized" });

    if (agent.commissionBalance < amount) return res.status(400).json({ error: "Insufficient commission balance" });

    // Handle Mobile Money via Campay
    if (method === 'mtn' || method === 'orange' || method === 'mtn_momo' || method === 'orange_money') {
      try {
         await campayWithdraw(amount, destination, "paycam-comm-" + Date.now());
      } catch (e: any) {
         return res.status(400).json({ error: "Mobile Money withdrawal failed: " + e.message });
      }
    }

    agent.commissionBalance -= amount;
    
    if (method === 'paycam_balance') {
      agent.balance = (agent.balance || 0) + amount;
      notifyUser(agent._id.toString(), 'Commission Transfer', `You transferred ${amount.toLocaleString()} XAF from commissions to your main balance.`);
    } else {
      notifyUser(agent._id.toString(), 'Commission Withdrawal', `You withdrew ${amount.toLocaleString()} XAF from commissions to ${method} (${destination}).`);
    }

    if (useMockDb || agentId === 'agent1') {
      mockTransactions.push({
        _id: String(mockIdCounter++), userId: agent._id, type: 'commission_withdrawal', amount, agency: method, recipient: destination || 'Self Balance', fee: 0, status: 'completed', createdAt: new Date()
      });
      return res.json({ success: true, newCommissionBalance: agent.commissionBalance, newBalance: agent.balance });
    }

    await agent.save();

    await Transaction.create({
      userId: agent._id, type: 'commission_withdrawal', amount, agency: method, recipient: destination || 'Self Balance', fee: 0
    });

    res.json({ success: true, newCommissionBalance: agent.commissionBalance, newBalance: agent.balance });
  } catch (error) {
    res.status(500).json({ error: "Commission withdrawal failed" });
  }
});

app.get("/api/agent/:id/stats", async (req, res) => {
  try {
    const agentId = req.params.id;
    const agent = useMockDb ? mockUsers.get(agentId) : await User.findById(agentId).catch(() => null).catch(() => null);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    
    // Calculate actual daily stats
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let dailyTxs = [];
    if (useMockDb) {
      dailyTxs = mockTransactions.filter((t: any) => 
        String(t.userId) === String(agent._id) && 
        new Date(t.createdAt) >= startOfDay
      );
    } else {
      dailyTxs = await Transaction.find({
        userId: agent._id,
        createdAt: { $gte: startOfDay }
      }).lean();
    }

    const totalVolume = dailyTxs.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const completedTxs = dailyTxs.filter((t: any) => t.status === 'completed');
    const successRate = dailyTxs.length > 0 ? Math.round((completedTxs.length / dailyTxs.length) * 100) : 100;

    res.json({
      floatBalance: agent.balance,
      commissionBalance: agent.commissionBalance || 0,
      dailyTransactions: dailyTxs.length,
      dailyVolume: totalVolume,
      successRate: successRate
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/agent/:id/nearby-requests", (req, res) => {
  res.json({
    requests: []
  });
});

// Merchant Endpoints
app.post("/api/merchant/deposit-to-user", async (req, res) => {
  const { merchantId, paycamId, amount } = req.body;
  try {
    let merchant = useMockDb ? mockUsers.get(merchantId) : await User.findById(merchantId).catch(() => null).catch(() => null);
    
    if (!merchant && merchantId === 'merchant1') {
      merchant = { _id: 'merchant1', paycamId: 'PC11111111', name: 'Demo Merchant', businessName: 'Demo Store', phone: '111111111', role: 'merchant', balance: 500000, commissionBalance: 0 };
      if (useMockDb) mockUsers.set('merchant1', merchant);
    }
    
    if (!merchant || merchant.role !== 'merchant') return res.status(401).json({ error: "Unauthorized" });

    const searchPaycam = String(paycamId).trim().toUpperCase();
    const user = useMockDb ? Array.from(mockUsers.values()).find(u => u.paycamId === searchPaycam) : await User.findOne({ paycamId: searchPaycam });
    if (!user) return res.status(404).json({ error: "User not found" });

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const limitError = await checkTransactionLimit(merchant, numAmount, 'send', user);
    if (limitError) return res.status(400).json({ error: limitError });
    
    const receiveLimitError = await checkTransactionLimit(user, numAmount, 'receive', merchant);
    if (receiveLimitError) return res.status(400).json({ error: receiveLimitError });

    if (merchant.balance < numAmount) return res.status(400).json({ error: "Insufficient normal balance (capital)" });

    merchant.balance -= numAmount;
    user.balance = Number(user.balance) + numAmount;
    
    notifyUser(user._id, 'Deposit Received', `You received a deposit of ${numAmount.toLocaleString()} XAF from merchant ${merchant.businessName || merchant.name}.`);
    notifyUser(merchant._id, 'Deposit Processed', `You processed a deposit of ${numAmount.toLocaleString()} XAF for ${user.name || user.phone}.`);

    if (useMockDb || merchantId === 'merchant1') {
      mockTransactions.push(
        { _id: String(mockIdCounter++), userId: merchant._id, type: 'merchant_deposit_out', amount: numAmount, agency: 'PayCam', recipient: user.paycamId, fee: 0, status: 'completed', createdAt: new Date() },
        { _id: String(mockIdCounter++), userId: user._id, type: 'deposit', amount: numAmount, agency: 'Merchant', recipient: merchant.businessName || merchant.name, fee: 0, status: 'completed', createdAt: new Date() }
      );
      return res.json({ success: true, newBalance: merchant.balance });
    }

    await merchant.save();
    await user.save();

    await Transaction.create([
      { userId: merchant._id, type: 'merchant_deposit_out', amount: numAmount, agency: 'PayCam', recipient: user.paycamId, fee: 0 },
      { userId: user._id, type: 'deposit', amount: numAmount, agency: 'Merchant', recipient: merchant.businessName || merchant.name, fee: 0 }
    ]);

    res.json({ success: true, newBalance: merchant.balance });
  } catch (error) {
    res.status(500).json({ error: "Deposit failed" });
  }
});

app.post("/api/merchant/user-withdrawal", async (req, res) => {
  const { merchantId, paycamId, amount } = req.body;
  try {
    let merchant = useMockDb ? mockUsers.get(merchantId) : await User.findById(merchantId).catch(() => null).catch(() => null);
    
    if (!merchant && merchantId === 'merchant1') {
      merchant = { _id: 'merchant1', paycamId: 'PC11111111', name: 'Demo Merchant', businessName: 'Demo Store', phone: '111111111', role: 'merchant', balance: 500000, commissionBalance: 0 };
      if (useMockDb) mockUsers.set('merchant1', merchant);
    }
    
    if (!merchant || merchant.role !== 'merchant') return res.status(401).json({ error: "Unauthorized" });

    const searchPaycam = String(paycamId).trim().toUpperCase();
    const user = useMockDb ? Array.from(mockUsers.values()).find(u => u.paycamId === searchPaycam) : await User.findOne({ paycamId: searchPaycam });
    if (!user) return res.status(404).json({ error: "User not found" });

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const totalFee = (numAmount * (systemSettings.withdrawalFeePercent / 100)) + systemSettings.withdrawalFeeFixed;
    const commission = getAgentCommission(numAmount, 'cash_out', merchant ? merchant.role : 'merchant');
    const totalDeduction = numAmount + totalFee;

    if (user.balance < totalDeduction) return res.status(400).json({ error: "User has insufficient balance to cover amount + fees" });

    // CREATE PENDING WITHDRAWAL INSTEAD OF IMMEDIATE DEDUCTION
    if (useMockDb || merchantId === 'merchant1') {
      mockTransactions.push(
        { _id: String(mockIdCounter++), userId: user._id, type: 'pending_withdrawal', amount: numAmount, agency: 'Merchant', recipient: merchant.businessName || merchant.name, fee: totalFee, status: 'pending', merchantId: merchant._id, createdAt: new Date() }
      );
      return res.json({ success: true, pending: true, message: "Awaiting user approval" });
    }

    await Transaction.create(
      { userId: user._id, type: 'pending_withdrawal', amount: numAmount, agency: 'Merchant', recipient: merchant.businessName || merchant.name, fee: totalFee, status: 'pending', merchantId: merchant._id }
    );

    res.json({ success: true, pending: true, message: "Awaiting user approval" });
  } catch (error) {
    res.status(500).json({ error: "Withdrawal processing failed" });
  }
});

// User requests a withdrawal
app.post("/api/user/request-withdrawal", async (req, res) => {
  const { userId, agentPaycamId, amount } = req.body;
  try {
    let user = useMockDb ? mockUsers.get(userId) : await User.findById(userId).catch(() => null);
    if (!user && userId === 'user1') {
      user = mockUsers.get('user1') || { _id: 'user1', paycamId: 'PC00000000', name: 'Demo User', phone: '000000000', role: 'user', balance: 15000 };
      if (!useMockDb) user.save = async () => {}; // mock save
    }
    if (!user) return res.status(404).json({ error: "User not found" });

    let agent = useMockDb ? Array.from(mockUsers.values()).find(u => u.paycamId === agentPaycamId && u.role === 'agent') : await User.findOne({ paycamId: agentPaycamId, role: 'agent' }).catch(() => null);
    
    if (!agent && agentPaycamId === 'AG11111111') {
      agent = { _id: 'agent1', paycamId: 'AG11111111', name: 'Demo Agent', phone: '111111111', role: 'agent', balance: 500000, commissionBalance: 0 };
      if (useMockDb) mockUsers.set('agent1', agent);
    }

    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const totalFee = (amount * (systemSettings.withdrawalFeePercent / 100)) + systemSettings.withdrawalFeeFixed;
    const totalDeduction = amount + totalFee;

    if (user.balance < totalDeduction) return res.status(400).json({ error: "Insufficient balance to cover amount + fees" });

    console.log("Checking mock conditions:", { useMockDb, userId: user._id, agentId: agent._id, isUser1: user._id === 'user1', isAgent1: agent._id === 'agent1', isUser1String: String(user._id) === 'user1', isAgent1String: String(agent._id) === 'agent1' });
    if (useMockDb || String(user._id) === 'user1' || String(agent._id) === 'agent1') {
      mockTransactions.push(
        { _id: String(mockIdCounter++), userId: user._id, type: 'pending_withdrawal', amount, agency: 'Agent', recipient: agent.name, fee: totalFee, status: 'pending', merchantId: agent._id, createdAt: new Date() }
      );
      return res.json({ success: true, pending: true, message: "Withdrawal request created, awaiting your approval when cash is received." });
    }

    await Transaction.create(
      { userId: user._id, type: 'pending_withdrawal', amount, agency: 'Agent', recipient: agent.name, fee: totalFee, status: 'pending', merchantId: agent._id }
    );

    res.json({ success: true, pending: true, message: "Withdrawal request created, awaiting your approval when cash is received." });
  } catch (error) {
    res.status(500).json({ error: "Withdrawal request failed: " + (error as Error).message });
  }
});

// User gets pending withdrawals
app.get("/api/user/:id/pending-withdrawals", async (req, res) => {
  try {
    let pending = [];
    const now = new Date().getTime();
    if (useMockDb) {
      pending = mockTransactions.filter(t => String(t.userId) === String(req.params.id) && t.status === 'pending' && t.type === 'pending_withdrawal');
      // Auto-reject old transactions
      pending.forEach(t => {
        if (now - new Date(t.createdAt).getTime() > 5 * 60 * 1000) {
          t.status = 'rejected';
        }
      });
      pending = pending.filter(t => t.status === 'pending');
    } else {
      if (req.params.id === 'merchant1') {
        pending = [];
      } else {
        let txs = await Transaction.find({ userId: req.params.id, status: 'pending', type: 'pending_withdrawal' });
        // Auto-reject old transactions
        for (let t of txs) {
           if (now - new Date(t.createdAt).getTime() > 5 * 60 * 1000) {
              t.status = 'rejected';
              await t.save();
           } else {
              pending.push(t);
           }
        }
      }
      // Also add mock pending transactions in case demo merchant was used
      const mockPending = mockTransactions.filter(t => String(t.userId) === String(req.params.id) && t.status === 'pending' && t.type === 'pending_withdrawal');
      mockPending.forEach(t => {
        if (now - new Date(t.createdAt).getTime() > 5 * 60 * 1000) {
          t.status = 'rejected';
        } else {
          pending.push(t);
        }
      });
    }
    return res.json(pending.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending transactions" });
  }
});

app.post("/api/user/reject-withdrawal", async (req, res) => {
  const { userId, transactionId } = req.body;
  try {
    let t = null;
    let isMockTx = false;

    if (useMockDb) {
      t = mockTransactions.find(tx => String(tx._id) === String(transactionId) && String(tx.userId) === String(userId));
      isMockTx = true;
    } else {
      t = await Transaction.findOne({ _id: transactionId, userId });
      if (!t) {
        t = mockTransactions.find(tx => String(tx._id) === String(transactionId) && String(tx.userId) === String(userId));
        if (t) isMockTx = true;
      }
    }

    if (!t || t.status !== 'pending' || t.type !== 'pending_withdrawal') {
      return res.status(404).json({ error: "Pending transaction not found" });
    }

    if (isMockTx) {
      t.status = 'rejected';
      return res.json({ success: true });
    }
    
    t.status = 'rejected';
    await t.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Rejection failed" });
  }
});

app.post("/api/user/reject-withdrawal", async (req, res) => {
  const { userId, transactionId } = req.body;
  try {
    let t = null;
    let isMockTx = false;

    if (useMockDb) {
      t = mockTransactions.find(tx => String(tx._id) === String(transactionId) && String(tx.userId) === String(userId));
      isMockTx = true;
    } else {
      t = await Transaction.findOne({ _id: transactionId, userId });
      if (!t) {
        t = mockTransactions.find(tx => String(tx._id) === String(transactionId) && String(tx.userId) === String(userId));
        if (t) isMockTx = true;
      }
    }

    if (!t || t.status !== 'pending' || t.type !== 'pending_withdrawal') {
      return res.status(404).json({ error: "Pending transaction not found" });
    }

    if (isMockTx) {
      t.status = 'rejected';
      return res.json({ success: true });
    }
    
    t.status = 'rejected';
    await t.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Rejection failed" });
  }
});

// User approves pending withdrawal
app.post("/api/user/approve-withdrawal", async (req, res) => {
  const { userId, transactionId } = req.body;
  try {
    let t = null;
    let isMockTx = false;

    if (useMockDb) {
      t = mockTransactions.find(tx => String(tx._id) === String(transactionId) && String(tx.userId) === String(userId));
      isMockTx = true;
    } else {
      t = await Transaction.findOne({ _id: transactionId, userId });
      if (!t) {
        t = mockTransactions.find(tx => String(tx._id) === String(transactionId) && String(tx.userId) === String(userId));
        if (t) isMockTx = true;
      }
    }
    
    if (!t || t.status !== 'pending' || t.type !== 'pending_withdrawal') {
      return res.status(404).json({ error: "Pending transaction not found" });
    }

    let user = useMockDb ? mockUsers.get(userId) : await User.findById(userId).catch(() => null);
    if (!user && userId === 'user1') {
      user = mockUsers.get('user1') || { _id: 'user1', paycamId: 'PC00000000', name: 'Demo User', phone: '000000000', role: 'user', balance: 15000 };
      if (!useMockDb) user.save = async () => {}; // mock save
    }
    let merchant = await User.findById(t.merchantId).catch(() => null).catch(() => null);
    
    if (!merchant && String(t.merchantId) === 'merchant1') {
      merchant = mockUsers.get('merchant1');
    } else if (!merchant && String(t.merchantId) === 'agent1') {
      merchant = mockUsers.get('agent1');
    } else if (useMockDb) {
      merchant = mockUsers.get(t.merchantId);
    }

    if (!user || !merchant) return res.status(404).json({ error: "User or Merchant not found" });

    const limitError = await checkTransactionLimit(user, t.amount, 'withdraw', merchant);
    if (limitError) return res.status(400).json({ error: limitError });
    
    const receiveLimitError = await checkTransactionLimit(merchant, t.amount, 'receive', user);
    if (receiveLimitError) return res.status(400).json({ error: receiveLimitError });

    const totalDeduction = t.amount + t.fee;
    const commission = getAgentCommission(t.amount, 'cash_out', merchant ? merchant.role : 'merchant');

    if (user.balance < totalDeduction) return res.status(400).json({ error: "Insufficient balance" });

    // Deduct and add
    user.balance -= totalDeduction;
    merchant.balance += t.amount;
    merchant.commissionBalance += commission;

    notifyUser(user._id, 'Withdrawal Successful', `You successfully withdrew ${t.amount.toLocaleString()} XAF from agent ${merchant.name || merchant.phone}.`);
    notifyUser(merchant._id, 'Processed Withdrawal', `You processed a withdrawal of ${t.amount.toLocaleString()} XAF for ${user.name || user.phone}.`);
    await creditPlatformProfit(t.fee - commission);

    if (isMockTx) {
      t.status = 'completed';
      t.type = 'withdraw';
      
      mockTransactions.push(
        { _id: String(mockIdCounter++), userId: merchant._id, type: 'user_withdrawal_processed', amount: t.amount, agency: 'PayCam', recipient: user.paycamId, fee: 0, commissionRecord: commission, status: 'completed', createdAt: new Date() }
      );
      
      if (!useMockDb) {
         // Also save the real user if they exist in mongo
         await user.save();
      }
      return res.json({ success: true, balance: user.balance });
    }

    await user.save();
    await merchant.save();
    t.status = 'completed';
    t.type = 'withdraw';
    await t.save();

    await Transaction.create({
      userId: merchant._id, type: 'user_withdrawal_processed', amount: t.amount, agency: 'PayCam', recipient: user.paycamId, fee: 0, commissionRecord: commission, status: 'completed'
    });

    res.json({ success: true, balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: "Approval failed" });
  }
});

app.post("/api/merchant/withdraw-commission", async (req, res) => {
  const { merchantId, amount, method, destination } = req.body;
  try {
    let merchant = useMockDb ? mockUsers.get(merchantId) : await User.findById(merchantId).catch(() => null).catch(() => null);
    
    // Initialize demo merchant on the fly if missing
    if (!merchant && merchantId === 'merchant1') {
      merchant = { _id: 'merchant1', paycamId: 'PC11111111', name: 'Demo Merchant', businessName: 'Demo Store', phone: '111111111', role: 'merchant', balance: 500000, commissionBalance: 0 };
      if (useMockDb) mockUsers.set('merchant1', merchant);
    }
    
    if (!merchant || merchant.role !== 'merchant') return res.status(401).json({ error: "Unauthorized" });

    if (merchant.commissionBalance < amount) return res.status(400).json({ error: "Insufficient commission balance" });

    // Handle Mobile Money via Campay
    if (method === 'mtn' || method === 'orange' || method === 'mtn_momo' || method === 'orange_money') {
      try {
         await campayWithdraw(amount, destination, "paycam-comm-" + Date.now());
      } catch (e: any) {
         return res.status(400).json({ error: "Mobile Money withdrawal failed: " + e.message });
      }
    }

    merchant.commissionBalance -= amount;
    
    if (method === 'paycam_balance') {
      merchant.balance += amount;
      notifyUser(merchant._id, 'Commission Transfer', `You transferred ${amount.toLocaleString()} XAF from commissions to your main balance.`);
    } else {
      notifyUser(merchant._id, 'Commission Withdrawal', `You withdrew ${amount.toLocaleString()} XAF from commissions to ${method} (${destination}).`);
    }

    if (useMockDb || merchantId === 'merchant1') {
      mockTransactions.push({
        _id: String(mockIdCounter++), userId: merchant._id, type: 'commission_withdrawal', amount, agency: method, recipient: destination || 'Self Balance', fee: 0, status: 'completed', createdAt: new Date()
      });
      return res.json({ success: true, newCommissionBalance: merchant.commissionBalance, newBalance: merchant.balance });
    }

    await merchant.save();

    await Transaction.create({
      userId: merchant._id, type: 'commission_withdrawal', amount, agency: method, recipient: destination || 'Self Balance', fee: 0
    });

    res.json({ success: true, newCommissionBalance: merchant.commissionBalance, newBalance: merchant.balance });
  } catch (error) {
    res.status(500).json({ error: "Commission withdrawal failed" });
  }
});

// Admin Stats Endpoint
app.get("/api/admin/stats", async (req, res) => {
  try {
    let usersList = [];
    let transactionsList = [];

    if (useMockDb) {
      usersList = Array.from(mockUsers.values());
      transactionsList = mockTransactions;
    } else {
      usersList = await User.find();
      transactionsList = await Transaction.find();
    }

    const totalUsers = usersList.filter((u: any) => u.role !== 'merchant' && u.role !== 'admin').length;
    const totalMerchants = usersList.filter((u: any) => u.role === 'merchant').length;
    const totalVolume = transactionsList.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
    const totalFees = transactionsList.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);
    const totalCommissions = transactionsList.reduce((acc: number, t: any) => acc + (t.commissionRecord || 0), 0);
    const netProfit = totalFees - totalCommissions;
    const totalProfitWithdrawn = transactionsList.filter((t: any) => t.type === 'profit_withdrawal').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
    const totalRevenue = Math.max(0, (totalFees || 0) - (totalCommissions || 0));
    const totalKycVerified = usersList.filter((u: any) => u.kycVerified).length;
    const totalHolds = usersList.filter((u: any) => u.status === 'blocked').length;

    // Calculate chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      
      const dayTx = transactionsList.filter((t: any) => {
        const txDate = new Date(t.createdAt);
        return txDate >= startOfDay && txDate <= endOfDay;
      });

      chartData.push({
        name: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
        volume: dayTx.reduce((acc: number, t: any) => acc + (t.amount || 0), 0),
        revenue: dayTx.reduce((acc: number, t: any) => acc + ((t.fee || 0) - (t.commissionRecord || 0)), 0)
      });
    }

    const recent = transactionsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    const heatmapData = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const heatmapMap = new Map();
    for (let d of days) {
      for (let h of hours) {
        heatmapMap.set(`${d}-${h}`, 0);
      }
    }
    const dateMap = new Map();
    for (const tx of transactionsList) {
      if (tx.createdAt) {
        const txDate = new Date(tx.createdAt);
        const dayString = txDate.toLocaleDateString('en-US', { weekday: 'short' }); 
        const dateString = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const hourString = `${txDate.getHours().toString().padStart(2, '0')}:00`;
        const key = `${dayString}-${hourString}`;
        if (heatmapMap.has(key)) {
            heatmapMap.set(key, heatmapMap.get(key) + 1);
            if (!dateMap.has(key)) {
                dateMap.set(key, dateString);
            }
        }
      }
    }

    for (let d of days) {
      for (let h of hours) {
        const key = `${d}-${h}`;
        heatmapData.push({ 
            day: d, 
            hour: h, 
            date: dateMap.get(key) || '',
            value: heatmapMap.get(key) || 0
        });
      }
    }
    res.json({ totalUsers, totalMerchants, totalVolume, totalRevenue, recent, chartData, heatmapData, totalKycVerified, totalHolds });
  } catch (error) {
    res.status(500).json({ error: "Failed to load admin stats" });
  }
});

// Finance Dashboard Stats Endpoints
app.get("/api/finance/stats", async (req, res) => {
  try {
    let transactionsList = [];
    let usersList = [];

    if (useMockDb) {
      transactionsList = mockTransactions;
      usersList = Array.from(mockUsers.values());
    } else {
      transactionsList = await Transaction.find();
      usersList = await User.find();
    }

    const userIds = new Set(usersList.filter(u => u.role === 'user').map(u => String(u._id)));
    const userTransactions = transactionsList.filter(t => userIds.has(String(t.userId)));

    const totalVolume = userTransactions.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
    // Platform revenue (e.g. some portion of fee)
    const totalFees = transactionsList.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);
    const totalCommissions = transactionsList.reduce((acc: number, t: any) => acc + (t.commissionRecord || 0), 0);
    const netProfit = totalFees - totalCommissions;
    const totalProfitWithdrawn = transactionsList.filter((t: any) => t.type === 'profit_withdrawal').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
    const totalRevenue = Math.max(0, (totalFees || 0) - (totalCommissions || 0));

    // Calculate balances
    const usersBalance = usersList.filter(u => u.role === 'user').reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
    const merchantsBalance = usersList.filter(u => u.role === 'merchant').reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
    const agentsBalance = usersList.filter(u => u.role === 'agent').reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
    // Platform Float (simulated) = Total user/merchant/agent deposits + Revenue - Withdrawals
    // Simple mock calculation: sum of all system user liability + revenue
    const totalLiability = usersBalance + merchantsBalance + agentsBalance;
    const platformFloat = totalLiability + totalRevenue;

    // Settlements (e.g., withdrawals to external bank or merchant deposits)
    const settlements = transactionsList.filter((t: any) => t.type === 'withdraw' || t.type === 'deposit');
    const pendingSettlementsCount = settlements.filter((t: any) => t.status === 'pending').length;
    const completedSettlementsAmount = settlements.filter((t: any) => t.status === 'completed').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      
      const dayTx = userTransactions.filter((t: any) => {
        const txDate = new Date(t.createdAt);
        return txDate >= startOfDay && txDate <= endOfDay;
      });

      chartData.push({
        name: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayTx.reduce((acc: number, t: any) => acc + ((t.fee || 0)), 0),
        settled: dayTx.filter((t: any) => t.type === 'withdraw' || t.type === 'deposit').reduce((acc: number, t: any) => acc + (t.amount || 0), 0),
      });
    }

    const recentSettlements = settlements.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    res.json({ 
      totalVolume, totalRevenue, pendingSettlementsCount, completedSettlementsAmount, chartData, recentSettlements,
      usersBalance, merchantsBalance, agentsBalance, totalLiability, platformFloat
    });
  } catch (error) {
    console.error("Finance stats error:", error);
    res.status(500).json({ error: "Failed to load finance stats" });
  }
});

// Settle transaction endpoint
app.post("/api/finance/settle/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (useMockDb) {
      const idx = mockTransactions.findIndex((t: any) => t._id === id);
      if (idx !== -1) {
        mockTransactions[idx].status = 'completed';
        res.json({ success: true, transaction: mockTransactions[idx] });
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } else {
      const tx = await Transaction.findByIdAndUpdate(id, { status: 'completed' }, { new: true });
      if (tx) {
        res.json({ success: true, transaction: tx });
      } else {
        res.status(404).json({ error: "Not found" });
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to settle" });
  }
});

// Finance Ledger Endpoint

app.get("/api/finance/user-history/:paycamId", async (req, res) => {
  const { paycamId } = req.params;
  try {
    let targetUser;
    if (useMockDb) {
      targetUser = Array.from(mockUsers.values()).find((u) => u.paycamId === paycamId);
    } else {
      targetUser = await User.findOne({ paycamId });
    }

    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    let userTransactions = [];
    if (useMockDb) {
      userTransactions = mockTransactions.filter(
        (t) => String(t.userId) === String(targetUser._id) || String(t.recipient) === String(targetUser.phone) || String(t.merchantId) === String(targetUser._id)
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      userTransactions = await Transaction.find({
        $or: [
          { userId: targetUser._id },
          { recipient: targetUser.phone },
          { merchantId: targetUser._id }
        ]
      }).sort({ createdAt: -1 });
    }
    res.json({ transactions: userTransactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user history' });
  }
});

app.get("/api/finance/ledger", async (req, res) => {
  try {
    let transactions = [];
    if (useMockDb) {
      transactions = mockTransactions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      transactions = await Transaction.find().sort({ createdAt: -1 });
    }
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: "Failed to load ledger" });
  }
});

const settingsSchema = new mongoose.Schema({
  taxRate: { type: Number, default: 19.25 },
  transferFeeFixed: { type: Number, default: 0 },
  transferFeePercent: { type: Number, default: 1.5 },
  withdrawalFeeFixed: { type: Number, default: 50 },
  withdrawalFeePercent: { type: Number, default: 1.0 },
  require2FASupport: { type: Boolean, default: true },
  geoBlocking: { type: Boolean, default: false },
  appLogoUrl: { type: String, default: "" },
  merchantCommissionRate: { type: Number, default: 0 },
  agentCommissionRate: { type: Number, default: 0 },
});
const Settings = mongoose.model("Settings", settingsSchema);

const ticketSchema = new mongoose.Schema({
  userId: String,
  subject: String,
  description: String,
  status: { type: String, default: 'open' },
  requiredLevel: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Ticket = mongoose.model("Ticket", ticketSchema);

const adminApprovalSchema = new mongoose.Schema({
  type: String,
  title: String,
  desc: String,
  amount: Number,
  metadata: mongoose.Schema.Types.Mixed,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  approvedAt: Date,
  approvedBy: String
});
const AdminApproval = mongoose.model("AdminApproval", adminApprovalSchema);

const adminTransactionLogSchema = new mongoose.Schema({
  title: String,
  desc: String,
  amount: Number,
  type: String,
  createdAt: { type: Date, default: Date.now }
});
const AdminTransactionLog = mongoose.model("AdminTransactionLog", adminTransactionLogSchema);


const auditLogSchema = new mongoose.Schema({
  officerId: String,
  action: String,
  targetId: String,
  details: String,
  createdAt: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

const agentLogSchema = new mongoose.Schema({
  type: String,
  agentId: String,
  action: String,
  location: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});
const AgentLog = mongoose.model("AgentLog", agentLogSchema);

const bankAccountSchema = new mongoose.Schema({
  name: String,
  type: String,
  accountNumber: String,
  balance: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  updatedAt: { type: Date, default: Date.now }
});
const BankAccount = mongoose.model("BankAccount", bankAccountSchema);

const internalWalletSchema = new mongoose.Schema({
  name: String,
  balance: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});
const InternalWallet = mongoose.model("InternalWallet", internalWalletSchema);

const treasuryTxSchema = new mongoose.Schema({
  type: String,
  amount: Number,
  bank: String,
  accountId: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});
const TreasuryTx = mongoose.model("TreasuryTx", treasuryTxSchema);


let systemSettings = {
    taxRate: 19.25,
    transferFeeFixed: 0,
    transferFeePercent: 1.5,
    withdrawalFeeFixed: 50,
    withdrawalFeePercent: 1.0,
    require2FASupport: true,
    geoBlocking: false,
    appLogoUrl: "",
    merchantCommissionRate: 0,
    agentCommissionRate: 0
};

app.get("/api/settings/public", (req, res) => {
    res.json({ appLogoUrl: systemSettings.appLogoUrl });
});

app.get("/api/admin/settings", (req, res) => {
    res.json({ settings: systemSettings });
});

app.post("/api/admin/settings", async (req, res) => {
    if (req.body.settings) {
        systemSettings = { 
            ...systemSettings, 
            ...req.body.settings,
            taxRate: parseFloat(req.body.settings.taxRate?.toString().replace('%', '') ?? systemSettings.taxRate) || 0,
            transferFeeFixed: parseFloat(req.body.settings.transferFeeFixed?.toString().replace('%', '') ?? systemSettings.transferFeeFixed) || 0,
            transferFeePercent: parseFloat(req.body.settings.transferFeePercent?.toString().replace('%', '') ?? systemSettings.transferFeePercent) || 0,
            withdrawalFeeFixed: parseFloat(req.body.settings.withdrawalFeeFixed?.toString().replace('%', '') ?? systemSettings.withdrawalFeeFixed) || 0,
            withdrawalFeePercent: parseFloat(req.body.settings.withdrawalFeePercent?.toString().replace('%', '') ?? systemSettings.withdrawalFeePercent) || 0,
            merchantCommissionRate: parseFloat(req.body.settings.merchantCommissionRate?.toString().replace('%', '') ?? systemSettings.merchantCommissionRate) || 0,
            agentCommissionRate: parseFloat(req.body.settings.agentCommissionRate?.toString().replace('%', '') ?? systemSettings.agentCommissionRate) || 0
        };
        
        if (!useMockDb) {
          let settingsDoc = await Settings.findOne();
          if (!settingsDoc) {
            settingsDoc = new Settings(systemSettings);
          } else {
            Object.assign(settingsDoc, systemSettings);
          }
          await settingsDoc.save();
        }
    }
    res.json({ success: true, settings: systemSettings });
});

// Finance Settings
app.get("/api/finance/settings", (req, res) => {
  res.json({ taxRate: systemSettings.taxRate });
});
app.post("/api/finance/settings", async (req, res) => {
  if (req.body.taxRate) {
    systemSettings.taxRate = req.body.taxRate;
    if (!useMockDb) {
      let settingsDoc = await Settings.findOne();
      if (settingsDoc) {
        settingsDoc.taxRate = systemSettings.taxRate;
        await settingsDoc.save();
      }
    }
  }
  res.json({ success: true, taxRate: systemSettings.taxRate });
});


let bankAccountsData: any[] = [
  { id: 'b1', name: 'PayCam - Afriland First Bank', type: 'Bank', accountNumber: '00192837465', balance: 0, status: 'Active' },
  { id: 'b2', name: 'PayCam - MTN MoMo Float', type: 'Float', accountNumber: '237670000000', balance: 0, status: 'Active' },
  { id: 'b3', name: 'PayCam - Orange Money Float', type: 'Float', accountNumber: '237690000000', balance: 0, status: 'Active' }
];

let internalWalletsData = [
  { id: 'w1', name: 'Operational Wallet', balance: 0, status: 'Active' },
  { id: 'w2', name: 'Revenue Wallet', balance: 0, status: 'Active' },
  { id: 'w3', name: 'Commission Wallet', balance: 0, status: 'Active' },
  { id: 'w4', name: 'Reserve Wallet', balance: 0, status: 'Active' },
  { id: 'w5', name: 'Settlement Wallet', balance: 8500000, status: 'Active' },
];

let pendingAdminApprovals: any[] = [
  { id: 'app_init', type: 'account_upgrade', title: 'PC99212133 / Business Tier Upgrade', desc: 'Requesting limit increase to 20,000,000 XAF/month.', status: 'pending', date: Date.now(), metadata: {}, amount: 0 }
];

let transactionLogs = [];

let platformTreasuryBalance = 0;
let treasuryTx: any[] = [
  { id: 'TRX1', date: new Date(Date.now() - 86400000 * 2), type: 'Platform Top-up', amount: 5000000, bank: 'MockBank Inc.' },
  { id: 'TRX2', date: new Date(Date.now() - 86400000 * 5), type: 'Fee Sweep', amount: 150000, bank: 'MockBank Inc.' }
];

app.post("/api/finance/treasury/accounts", (req, res) => {
  if ((req as any).user?.role !== 'admin' && !req.headers.authorization) {
     // rudimentary check
  }
  const { name, type, accountNumber } = req.body;
  const newAccount = {
    id: (type === 'Bank' ? 'b' : 'f') + Date.now(),
    name,
    type,
    accountNumber: accountNumber || '',
    balance: 0,
    status: 'Active'
  };
  bankAccountsData.push(newAccount);
  res.json({ success: true, account: newAccount, bankAccounts: bankAccountsData });
});

app.put("/api/finance/treasury/accounts/:id", (req, res) => {
  const { id } = req.params;
  const { name, type, accountNumber } = req.body;
  const index = bankAccountsData.findIndex(a => a.id === id);
  if (index !== -1) {
    bankAccountsData[index] = { ...bankAccountsData[index], name, type, accountNumber: accountNumber || '' };
    res.json({ success: true, bankAccounts: bankAccountsData });
  } else {
    res.status(404).json({ error: "Account not found" });
  }
});

app.delete("/api/finance/treasury/accounts/:id", (req, res) => {
  const { id } = req.params;
  bankAccountsData = bankAccountsData.filter(a => a.id !== id);
  res.json({ success: true, bankAccounts: bankAccountsData });
});

app.get("/api/finance/treasury", async (req, res) => {
  try {
    if (useMockDb) {
      
      const usersBalance = Array.from(mockUsers.values()).filter(u => u.role === 'user').reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
      const merchantsBalance = Array.from(mockUsers.values()).filter(u => u.role === 'merchant').reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
      const agentsBalance = Array.from(mockUsers.values()).filter(u => u.role === 'agent').reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
      const totalLiability = usersBalance + merchantsBalance + agentsBalance;
      
      const totalFees = mockTransactions.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);
      const totalCommissions = mockTransactions.reduce((acc: number, t: any) => acc + (t.commissionRecord || 0), 0);
      const netProfit = totalFees - totalCommissions;
      const totalProfitWithdrawn = mockTransactions.filter((t: any) => t.type === 'profit_withdrawal').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
      const totalRevenue = Math.max(0, (totalFees || 0) - (totalCommissions || 0));
      const realPlatformFloat = totalLiability + totalRevenue + platformTreasuryBalance; // platformTreasuryBalance is now just manual sweeps

      res.json({ 
          balance: realPlatformFloat,  
          transactions: treasuryTx,
          bankAccounts: bankAccountsData,
          internalWallets: internalWalletsData
      });
    } else {
      const bankAccounts = await BankAccount.find();
      const internalWallets = await mongoose.models.InternalWallet.find();
      const transactions = await TreasuryTx.find().sort({ createdAt: -1 }).limit(100);
      const balance = internalWallets.reduce((acc, w) => acc + (w.balance || 0), 0);
      res.json({ balance, transactions, bankAccounts, internalWallets });
    }
  } catch(error) { res.status(500).json({error: "Failed to load treasury"}); }
});

app.get("/api/finance/float-requests", async (req, res) => {
  if (useMockDb) {
     res.json({ requests: mockFloatRequests });
  } else {
     const requests = await FloatRequest.find().sort({ createdAt: -1 }).limit(100);
     res.json({ requests });
  }
});

app.post("/api/finance/float-requests/:id/approve", async (req, res) => {
  const { id } = req.params;
  
  let request;
  if (useMockDb) {
      request = mockFloatRequests.find(r => r._id === id);
  } else {
      request = await FloatRequest.findById(id);
  }
  
  if (!request) return res.status(404).json({ error: "Request not found" });
  if (request.status !== 'pending') return res.status(400).json({ error: "Request already processed" });
  
  const agent = useMockDb ? mockUsers.get(String(request.agentId)) : await User.findById(request.agentId).catch(() => null);
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  request.status = 'approved';
  request.updatedAt = new Date();
  
  agent.balance += request.amount;
  
  if (useMockDb) {
      mockTransactions.unshift({
        _id: `tx_${Date.now()}_${mockIdCounter++}`,
        userId: agent._id,
        type: 'float_completed',
        amount: request.amount,
        status: 'completed',
        createdAt: new Date()
      });
  } else {
      await request.save();
      await agent.save();
      const tx = new Transaction({
        userId: agent._id,
        type: 'float_completed',
        amount: request.amount,
        status: 'completed'
      });
      await tx.save();
  }
  
  res.json({ success: true, message: "Float request approved", request });
});


app.post("/api/finance/merchant/withdraw", async (req, res) => {
  const { paycamId, amount } = req.body;
  if (!paycamId || amount <= 0) return res.status(400).json({ error: "Invalid data" });
  
  const searchPaycam = String(paycamId).trim().toUpperCase();
  const merchant = useMockDb ? Array.from(mockUsers.values()).find(u => u.paycamId === searchPaycam && u.role === 'merchant') : await User.findOne({ paycamId: searchPaycam, role: 'merchant' });
  
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });
  if (merchant.balance < amount) return res.status(400).json({ error: "Insufficient merchant balance" });

  merchant.balance -= amount;
  
  if (useMockDb) {
      mockTransactions.unshift({
        _id: `tx_${Date.now()}_${mockIdCounter++}`,
        userId: merchant._id,
        type: 'merchant_finance_withdrawal',
        amount: amount,
        agency: 'Finance',
        recipient: 'Finance System',
        fee: 0,
        status: 'completed',
        createdAt: new Date()
      });
  } else {
      await merchant.save();
      const tx = new Transaction({
        userId: merchant._id,
        type: 'merchant_finance_withdrawal',
        amount: amount,
        agency: 'Finance',
        recipient: 'Finance System',
        fee: 0,
        status: 'completed'
      });
      await tx.save();
  }
  
  res.json({ success: true, message: "Withdrew from merchant successfully" });
});

app.post("/api/finance/float/send", async (req, res) => {
  const { paycamId, amount } = req.body;
  if (!paycamId || amount <= 0) return res.status(400).json({ error: "Invalid data" });
  
  const searchPaycam = String(paycamId).trim().toUpperCase();
  const agent = useMockDb ? Array.from(mockUsers.values()).find(u => u.paycamId === searchPaycam && u.role === 'agent') : await User.findOne({ paycamId: searchPaycam, role: 'agent' });
  
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  agent.balance += amount;
  
  if (useMockDb) {
      mockTransactions.unshift({
        _id: `tx_${Date.now()}_${mockIdCounter++}`,
        userId: agent._id,
        type: 'float_sent',
        amount: amount,
        status: 'completed',
        createdAt: new Date()
      });
  } else {
      await agent.save();
      const tx = new Transaction({
        userId: agent._id,
        type: 'float_sent',
        amount: amount,
        status: 'completed'
      });
      await tx.save();
  }
  
  res.json({ success: true, message: "Float sent successfully" });
});

app.post("/api/finance/request-approval", async (req, res) => {
    const { type, title, desc, amount, metadata } = req.body;
    if (useMockDb) {
      pendingAdminApprovals.unshift({
          id: 'app_' + Date.now(),
          type, title, desc, amount: amount || 0,
          status: 'pending', date: Date.now(),
          metadata
      });
      res.json({ success: true });
    } else {
      await AdminApproval.create({
          type, title, desc, amount: amount || 0, metadata
      });
      res.json({ success: true });
    }
});

app.get("/api/admin/users", async (req, res) => {
    try {
        let usersList = [];
        if (useMockDb) {
            usersList = Array.from(mockUsers.values());
        } else {
            usersList = await User.find().select('-pin');
        }
        res.json({ users: usersList });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.post("/api/admin/users", async (req, res) => {
    try {
        let { name, phone, role, pin, level } = req.body || {};
        if(phone) phone = String(phone).trim();
        if(pin) pin = String(pin).trim();
        if (pin.length !== 5 || !/^\d{5}$/.test(pin)) return res.status(400).json({ error: "PIN must be exactly 5 digits" });
        const restrictedRoles = ['super_admin'];
        if (restrictedRoles.includes(role)) {
           return res.status(403).json({ error: "Cannot create users with this high-level role." });
        }
        
        if (useMockDb) {
            const newUser: any = {
               _id: String(mockIdCounter++),
               paycamId: generatePaycamId(),
               name,
               phone,
               pin,
               role: role || 'user',
               balance: 0,
               status: 'active',
               createdAt: new Date()
            };
            if ((role === 'support' || role === 'finance') && level) {
                newUser.level = Number(level);
            }
            mockUsers.set(newUser._id, newUser);
            res.json({ success: true, user: newUser });
        } else {
            const userData: any = {
               paycamId: generatePaycamId(),
               name,
               phone,
               pin,
               role: role || 'user'
            };
            if ((role === 'support' || role === 'finance') && level) {
                userData.level = Number(level);
            }
            const newUser = new User(userData);
            await newUser.save();
            res.json({ success: true, user: newUser });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to create user: " + (err as any).message });
    }
});


app.post("/api/user/:id/update-pin", async (req, res) => {
    let { oldPin, newPin } = req.body;
    if(oldPin) oldPin = String(oldPin).trim();
    if(newPin) newPin = String(newPin).trim();
    
    if (!newPin || newPin.length !== 5 || !/^\d{5}$/.test(newPin)) {
        return res.status(400).json({ error: "New PIN must be 5 digits" });
    }
    
    try {
        if (useMockDb) {
            const user = mockUsers.get(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.pin !== oldPin) return res.status(400).json({ error: "Incorrect old PIN" });
            user.pin = newPin;
            res.json({ success: true });
        } else {
            const user = await User.findById(req.params.id).catch(() => null);
            if (!user) return res.status(404).json({ error: "User not found" });
            if (user.pin !== oldPin) return res.status(400).json({ error: "Incorrect old PIN" });
            user.pin = newPin;
            await user.save();
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to update PIN" });
    }
});

app.post("/api/support/users/:id/pin", async (req, res) => {
    let { pin } = req.body;
    if(pin) pin = String(pin).trim();
    if (!pin || pin.length !== 5 || !/^\d{5}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be 5 digits" });
    }
    try {
        if (useMockDb) {
            const user = mockUsers.get(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found" });
            user.pin = pin;
            res.json({ success: true });
        } else {
            const user = await User.findById(req.params.id).catch(() => null);
            if (!user) return res.status(404).json({ error: "User not found" });
            user.pin = pin;
            await user.save();
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to reset PIN" });
    }
});

app.post("/api/admin/users/:id/pin", async (req, res) => {
    let { pin } = req.body;
    if(pin) pin = String(pin).trim();
    if (!pin || pin.length !== 5 || !/^\d{5}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be 5 digits" });
    }
    
    try {
        if (useMockDb) {
            const user = mockUsers.get(req.params.id);
            if (!user) return res.status(404).json({ error: "Not found" });
            user.pin = pin;
            res.json({ success: true });
        } else {
            const user = await User.findById(req.params.id).catch(() => null);
            if (!user) return res.status(404).json({ error: "Not found" });
            user.pin = pin;
            await user.save();
            res.json({ success: true });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to update PIN" });
    }
});

app.post("/api/admin/users/:id/role", async (req, res) => {
    const { role, level } = req.body;
    
    try {
        if (useMockDb) {
            const user = mockUsers.get(req.params.id);
            if (!user) return res.status(404).json({ error: "Not found" });
            
            const restrictedRoles = ['super_admin'];
            if (restrictedRoles.includes(user.role) || restrictedRoles.includes(role)) {
               return res.status(403).json({ error: "Not authorized to manage this role tier." });
            }
            
            user.role = role;
            if (level !== undefined) user.level = Number(level);
            res.json({ success: true, user });
        } else {
            const user = await User.findById(req.params.id).catch(() => null);
            if (!user) return res.status(404).json({ error: "Not found" });
            
            const restrictedRoles = ['super_admin'];
            if (restrictedRoles.includes(user.role) || restrictedRoles.includes(role)) {
               return res.status(403).json({ error: "Not authorized to manage this role tier." });
            }
            
            user.role = role;
            if (level !== undefined) user.level = Number(level);
            await user.save();
            res.json({ success: true, user });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to update role" });
    }
});

app.post("/api/admin/users/:id/limits", async (req, res) => {
    const { limits } = req.body;
    try {
        if (useMockDb) {
            const user = mockUsers.get(req.params.id) || Array.from(mockUsers.values()).find(u => u._id === req.params.id);
            if (user) {
                user.limits = limits;
                return res.json({ success: true });
            }
        } else {
            const user = await User.findById(req.params.id).catch(() => null);
            if (user) {
                user.limits = limits;
                await user.save();
                return res.json({ success: true });
            }
        }
        res.status(404).json({ error: "User not found" });
    } catch (e) {
        res.status(500).json({ error: "Failed to update limits" });
    }
});

app.post("/api/admin/users/:id/status", async (req, res) => {
    const { status } = req.body;
    
    try {
        if (useMockDb) {
            const user = mockUsers.get(req.params.id);
            if (!user) return res.status(404).json({ error: "Not found" });
            
            const restrictedRoles = ['super_admin'];
            if (restrictedRoles.includes(user.role)) {
               return res.status(403).json({ error: "Not authorized to manage this role tier." });
            }
            
            user.status = status;
            res.json({ success: true, user });
        } else {
            const user = await User.findById(req.params.id).catch(() => null);
            if (!user) return res.status(404).json({ error: "Not found" });
            
            const restrictedRoles = ['super_admin'];
            if (restrictedRoles.includes(user.role)) {
               return res.status(403).json({ error: "Not authorized to manage this role tier." });
            }
            
            user.status = status;
            await user.save();
            res.json({ success: true, user });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to update status" });
    }
});


app.get("/api/admin/approvals", async (req, res) => {
    try {
        let approvalsList = [];
        if (useMockDb) {
            approvalsList = pendingAdminApprovals.filter(a => a.status === 'pending');
        } else {
            approvalsList = await AdminApproval.find({ status: 'pending' });
        }
        res.json({ approvals: approvalsList });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch approvals" });
    }
});

let supportCategories = [
    { id: '1', name: 'App Usage', description: 'Questions about using the app features', active: true },
    { id: '2', name: 'Transaction Issues', description: 'Missing deposits, failed withdrawals, incorrect amounts', active: true },
    { id: '3', name: 'Account Security', description: 'Suspicious activity, lost phone, locked account', active: true },
    { id: '4', name: 'KYC/Limits', description: 'Document verification, limit upgrades', active: true }
];

app.get("/api/admin/support/categories", (req, res) => {
    res.json({ categories: supportCategories });
});

app.post("/api/admin/support/categories", (req, res) => {
    const { categories } = req.body;
    if (categories) {
        supportCategories = categories;
    }
    res.json({ success: true, categories: supportCategories });
});

app.get("/api/admin/txlogs", async (req, res) => {
  if (useMockDb) {
    res.json({ logs: transactionLogs });
  } else {
    const logs = await AdminTransactionLog.find().sort({ createdAt: -1 }).limit(100);
    // map _id to id and createdAt to date
    const mappedLogs = logs.map(l => ({ ...l.toObject(), id: l._id, date: l.createdAt }));
    res.json({ logs: mappedLogs });
  }
});

app.post("/api/admin/notify", (req, res) => {
    const { title, message } = req.body;
    if (useMockDb) {
    mockAmlAlerts.unshift({
        _id: `alert_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId: 'system',
        ruleTriggered: title || 'System Notification',
        severity: 'High',
        description: message,
        status: 'open',
        createdAt: new Date()
    });
  } else {
    AmlAlert.create({ userId: 'system',
        ruleTriggered: title || 'System Notification',
        severity: 'High',
        description: message,
        status: 'open',
        createdAt: new Date()
     }).catch(console.error);
  }
    res.json({ success: true });
});

app.post("/api/admin/approvals/:id/approve", async (req, res) => {
    let approval;
    if (useMockDb) {
        approval = pendingAdminApprovals.find(a => a.id === req.params.id);
    } else {
        approval = await AdminApproval.findById(req.params.id);
        if(approval) approval.id = approval._id.toString();
    }
    if (!approval) return res.status(404).json({ error: 'Not found' });
    
    approval.status = 'approved';
    if (!useMockDb && typeof approval.save === 'function') await approval.save();
    
    // Process based on type
    if (approval.type === 'esim_swap') {
        if (useMockDb) {
            const tx = mockTransactions.find(t => String(t._id) === String(approval.metadata.transactionId));
            if (tx) tx.status = 'rejected';
            const user = mockUsers.get(approval.metadata.userId);
            if (user) user.balance += approval.amount;
            notifyUser(approval.metadata.userId, 'eSIM Swap Rejected', `Your request to swap ${approval.metadata.phoneNumber} to ${approval.metadata.provider} eSIM was rejected.`);
        } else {
            try {
                const tx = await Transaction.findById(approval.metadata.transactionId);
                if (tx) {
                    tx.status = 'rejected';
                    await tx.save();
                }
                const user = await User.findById(approval.metadata.userId).catch(() => null);
                if (user) {
                    user.balance += approval.amount;
                    await user.save();
                }
                notifyUser(approval.metadata.userId, 'eSIM Swap Rejected', `Your request to swap ${approval.metadata.phoneNumber} to ${approval.metadata.provider} eSIM was rejected.`);
            } catch (err) {}
        }
    } else if (approval.type === 'merchant_registration') {
        if (useMockDb) {
            const tempUser = mockUsers.get(approval.metadata.userId);
            if (tempUser) {
                tempUser.status = 'active';
                notifyUser(tempUser._id, 'Registration Approved', `Your merchant account registration has been approved.`);
            }
        } else {
            try {
                const tempUser = await User.findById(approval.metadata.userId).catch(() => null);
                if (tempUser) {
                    tempUser.status = 'active';
                    await tempUser.save();
                    notifyUser(tempUser._id.toString(), 'Registration Approved', `Your merchant account registration has been approved.`);
                }
            } catch (err) {}
        }
    } else if (approval.type === 'bank_topup') {
        const acc = bankAccountsData.find(b => b.id === approval.metadata.id);
        if (acc) {
            acc.balance += (approval.metadata.amount || 0);
            treasuryTx.unshift({
                id: 'TRX' + Math.floor(Math.random()*10000),
                date: new Date(),
                type: 'Bank Top-up',
                amount: approval.metadata.amount || 0,
                bank: acc.name,
                accountId: acc.id
            });
        }
    } else if (approval.type === 'wallet_transfer') {
        const fromAccount = internalWalletsData.find(w => w.id === approval.metadata.fromId) || bankAccountsData.find(b => b.id === approval.metadata.fromId);
        const toAccount = internalWalletsData.find(w => w.id === approval.metadata.toId) || bankAccountsData.find(b => b.id === approval.metadata.toId);
        if (fromAccount && toAccount) {
            fromAccount.balance -= (approval.metadata.amount || 0);
            toAccount.balance += (approval.metadata.amount || 0);
            treasuryTx.unshift({
                id: 'TRX' + Math.floor(Math.random()*10000),
                date: new Date(),
                type: 'Wallet Transfer Out',
                amount: -(approval.metadata.amount || 0),
                bank: fromAccount.name,
                accountId: fromAccount.id
            });
            treasuryTx.unshift({
                id: 'TRX' + Math.floor(Math.random()*10000),
                date: new Date(),
                type: 'Wallet Transfer In',
                amount: approval.metadata.amount || 0,
                bank: toAccount.name,
                accountId: toAccount.id
            });
        }
    } else if (approval.type === 'sweep' || approval.type === 'transfer' || approval.type === 'profit_withdrawal') {
        // Implement sweep or transfer
        if (approval.type === 'sweep') {
            platformTreasuryBalance += approval.metadata.amount;
        } else if (approval.type === 'transfer' || approval.type === 'profit_withdrawal') {
            if (approval.type === 'profit_withdrawal') {
                let transactionsList: any[] = [];
                if (useMockDb) {
                    transactionsList = mockTransactions;
                } else {
                    try {
                        transactionsList = await Transaction.find({});
                    } catch(e) {}
                }
                const totalFees = transactionsList.reduce((acc: number, t: any) => acc + (t.fee || 0), 0);
                const totalCommissions = transactionsList.reduce((acc: number, t: any) => acc + (t.commissionRecord || 0), 0);
                const totalProfitWithdrawn = transactionsList.filter((t: any) => t.type === 'profit_withdrawal').reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
                const totalRevenue = Math.max(0, (totalFees || 0) - (totalCommissions || 0));
                if (approval.metadata.amount > totalRevenue) {
                    return res.status(400).json({ error: "Insufficient platform profits balance for this withdrawal" });
                }
            }
            if (approval.type === 'profit_withdrawal') {
                await creditPlatformProfit(-approval.metadata.amount);
            } else {
                platformTreasuryBalance -= approval.metadata.amount;
            }
            if (approval.type === 'profit_withdrawal') {
                if (useMockDb) {
                    mockTransactions.push({
                       _id: String(mockIdCounter++), userId: null, type: 'profit_withdrawal', amount: approval.metadata.amount, agency: 'Bank', recipient: approval.metadata.bank || 'Unknown Bank', fee: 0, status: 'completed', createdAt: new Date()
                    } as any);
                } else {
                    try {
                        await new Transaction({
                            userId: null, type: 'profit_withdrawal', amount: approval.metadata.amount, agency: 'Bank', recipient: approval.metadata.bank || 'Unknown Bank', fee: 0, status: 'completed'
                        }).save();
                    } catch(e) {}
                }
            }
        }
        treasuryTx.unshift({
            id: 'TRX' + Math.floor(Math.random()*10000),
            date: new Date(),
            type: approval.type === 'sweep' ? 'Manual Sweep' : (approval.type === 'profit_withdrawal' ? 'Profit Withdrawal' : 'Bank Transfer'),
            amount: approval.type === 'sweep' ? approval.metadata.amount : -approval.metadata.amount,
            bank: approval.type === 'sweep' ? 'Internal Transfer' : (approval.metadata.bank || 'Unknown Bank')
        });
    } else if (approval.type === 'esim_swap') {
        if (useMockDb) {
            const tx = mockTransactions.find(t => String(t._id) === String(approval.metadata.transactionId));
            if (tx) tx.status = 'completed';
            notifyUser(approval.metadata.userId, 'eSIM Swap Approved', `Your request to swap ${approval.metadata.phoneNumber} to ${approval.metadata.provider} eSIM has been approved.`);
        } else {
            try {
                const tx = await Transaction.findById(approval.metadata.transactionId);
                if (tx) {
                    tx.status = 'completed';
                    await tx.save();
                }
                notifyUser(approval.metadata.userId, 'eSIM Swap Approved', `Your request to swap ${approval.metadata.phoneNumber} to ${approval.metadata.provider} eSIM has been approved.`);
            } catch (err) {}
        }
    }

    if (useMockDb) {
      transactionLogs.unshift({
        id: 'LOG_' + Date.now(),
        date: new Date(),
        title: approval.title || 'Merchant Registration',
        desc: approval.desc || 'Merchant account approved',
        amount: approval.amount || 0,
        type: approval.type
      });
    } else {
      await AdminTransactionLog.create({
        title: approval.title || 'Merchant Registration',
        desc: approval.desc || 'Merchant account approved',
        amount: approval.amount || 0,
        type: approval.type
      });
    }
    
    res.json({ success: true });
});

app.post("/api/admin/approvals/:id/reject", async (req, res) => {
    let approval;
    if (useMockDb) {
        approval = pendingAdminApprovals.find(a => a.id === req.params.id);
    } else {
        approval = await AdminApproval.findById(req.params.id);
        if(approval) approval.id = approval._id.toString();
    }
    if (!approval) return res.status(404).json({ error: 'Not found' });
    
    approval.status = 'rejected';
    if (!useMockDb && typeof approval.save === 'function') await approval.save();

    if (approval.type === 'merchant_registration') {
        if (useMockDb) {
            const tempUser = mockUsers.get(approval.metadata.userId);
            if (tempUser) {
                tempUser.status = 'rejected';
                notifyUser(tempUser._id, 'Registration Rejected', `Your merchant account registration has been rejected.`);
            }
        } else {
            try {
                const tempUser = await User.findById(approval.metadata.userId).catch(() => null);
                if (tempUser) {
                    tempUser.status = 'rejected';
                    await tempUser.save();
                    notifyUser(tempUser._id.toString(), 'Registration Rejected', `Your merchant account registration has been rejected.`);
                }
            } catch (err) {}
        }
    }
    
    res.json({ success: true });
});

app.post("/api/finance/treasury/sweep", (req, res) => {

  const amount = Number(req.body.amount || 0);
  if (amount > 0) {
    platformTreasuryBalance += amount;
    treasuryTx.unshift({
      id: 'TRX' + Math.floor(Math.random()*10000),
      date: new Date(),
      type: 'Manual Sweep',
      amount: amount,
      bank: 'Internal Transfer'
    });
  }
  res.json({ success: true, balance: platformTreasuryBalance });
});

app.post("/api/finance/treasury/transfer", (req, res) => {
  const amount = Number(req.body.amount || 0);
  const bank = req.body.bank || 'Unknown Bank';
  if (amount > 0 && amount <= platformTreasuryBalance) {
    platformTreasuryBalance -= amount;
    treasuryTx.unshift({
      id: 'TRX' + Math.floor(Math.random()*10000),
      date: new Date(),
      type: 'Bank Transfer (Withdrawal)',
      amount: -amount,
      bank: bank
    });
    res.json({ success: true, balance: platformTreasuryBalance });
  } else {
    res.status(400).json({ error: "Insufficient treasury funds" });
  }
});

// Buy SIM/eSIM (Simulated)
app.post("/api/store/buy-esim", async (req, res) => {
  const { userId, provider } = req.body;
  try {
    const cost = 2000;

    if (useMockDb) {
      const user = mockUsers.get(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.balance < cost) return res.status(400).json({ error: "Insufficient balance" });
      
      user.balance -= cost;
      const transaction = {
        _id: String(mockIdCounter++),
        userId, type: 'buy_sim', amount: cost, agency: provider, recipient: `${provider} ESIM`, fee: 0, status: 'completed', createdAt: new Date()
      };
      mockTransactions.push(transaction);
      const prefix = provider.toLowerCase() === 'mtn' ? (Math.random() > 0.5 ? '67' : '68') : (Math.random() > 0.5 ? '69' : '65');
      const newNumber = `${prefix}${Math.floor(1000000 + Math.random() * 9000000)}`;
      return res.json({ success: true, transaction, newBalance: user.balance, qrCode: `LPA:1$smdp.plus.com$${provider.toUpperCase()}-${newNumber}`, newNumber });
    }

    const user = await User.findById(userId).catch(() => null);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (user.balance < cost) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    user.balance -= cost;
    await user.save();
    
    const transaction = new Transaction({
      userId, type: 'buy_sim', amount: cost, agency: provider, recipient: `${provider} ESIM`, fee: 0
    });
    await transaction.save();
    
    const prefix = provider.toLowerCase() === 'mtn' ? (Math.random() > 0.5 ? '67' : '68') : (Math.random() > 0.5 ? '69' : '65');
    const newNumber = `${prefix}${Math.floor(1000000 + Math.random() * 9000000)}`;
    res.json({ success: true, transaction, newBalance: user.balance, qrCode: `LPA:1$smdp.plus.com$${provider.toUpperCase()}-${newNumber}`, newNumber });
  } catch (error) {
    res.status(500).json({ error: "Purchase failed" });
  }
});

app.post("/api/store/swap-esim", async (req, res) => {
  const { userId, provider, phoneNumber } = req.body;
  try {
    const cost = 1000;

    if (useMockDb) {
      const user = mockUsers.get(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.balance < cost) return res.status(400).json({ error: "Insufficient balance" });
      
      user.balance -= cost;
      const transaction = {
        _id: String(mockIdCounter++),
        userId, type: 'swap_sim', amount: cost, agency: provider, recipient: `Swap ${phoneNumber} to ESIM (Pending)`, fee: 0, status: 'pending', createdAt: new Date()
      };
      mockTransactions.push(transaction);
      pendingAdminApprovals.push({
          id: 'app_' + Date.now(),
          type: 'esim_swap',
          title: `eSIM Swap Request: ${phoneNumber}`,
          desc: `User ${user.name} requesting swap to ${provider} eSIM.`,
          status: 'pending',
          date: Date.now(),
          metadata: { userId, phoneNumber, provider, transactionId: transaction._id },
          amount: cost
      });
      return res.json({ success: true, transaction, newBalance: user.balance, pendingApproval: true });
    }

    const user = await User.findById(userId).catch(() => null);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (user.balance < cost) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    
    user.balance -= cost;
    await user.save();
    
    const transaction = new Transaction({
      userId, type: 'swap_sim', amount: cost, agency: provider, recipient: `Swap ${phoneNumber} to ESIM (Pending)`, fee: 0, status: 'pending'
    });
    await transaction.save();
    
    await AdminApproval.create({
        type: 'esim_swap',
        title: `eSIM Swap Request: ${phoneNumber}`,
        desc: `User ${user.name} requesting swap to ${provider} eSIM.`,
        amount: cost,
        metadata: { userId, phoneNumber, provider, transactionId: transaction._id }
    });

    res.json({ success: true, transaction, newBalance: user.balance, pendingApproval: true });
  } catch (error) {
    res.status(500).json({ error: "Swap failed" });
  }
});

app.post("/api/store/pay-bill", async (req, res) => {
  const { userId, type, amount, reference } = req.body;
  try {
    const cost = Number(amount);
    
    if (useMockDb) {
      const user = mockUsers.get(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.balance < cost) return res.status(400).json({ error: "Insufficient balance" });
      
      user.balance -= cost;
      const transaction = {
        _id: String(mockIdCounter++),
        userId, type: `pay_${type}`, amount: cost, agency: type, recipient: reference, fee: 0, status: 'completed', createdAt: new Date()
      };
      mockTransactions.push(transaction);
      
      let token = null;
      if (type === 'socadel') {
         token = Array.from({length: 20}, () => Math.floor(Math.random() * 10)).join('');
      }
      return res.json({ success: true, transaction, newBalance: user.balance, token });
    }

    const user = await User.findById(userId).catch(() => null);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (user.balance < cost) return res.status(400).json({ error: "Insufficient balance" });
    
    user.balance -= cost;
    await user.save();
    
    const transaction = new Transaction({
      userId, type: `pay_${type}`, amount: cost, agency: type, recipient: reference, fee: 0
    });
    await transaction.save();
    
    let token = null;
    if (type === 'socadel') {
       token = Array.from({length: 20}, () => Math.floor(Math.random() * 10)).join('');
    }
    res.json({ success: true, transaction, newBalance: user.balance, token });
  } catch (error) {
    res.status(500).json({ error: "Payment failed" });
  }
});

// Support API
const mockTickets: any[] = [];
let mockTicketIdCounter = 1;

let issueCategories = [
    { id: '1', name: 'General Inquiry', level: 1 },
    { id: '2', name: 'Login Issues', level: 1 },
    { id: '3', name: 'Transfer Failed', level: 2 },
    { id: '4', name: 'Deposit Issue', level: 2 },
    { id: '5', name: 'Withdrawal Delayed', level: 2 },
    { id: '6', name: 'Rate Discrepancy', level: 2 },
    { id: '7', name: 'Scam', level: 3 },
    { id: '8', name: 'Transfer to wrong account', level: 3 }
];

let issueCategoryIdCounter = 9;

app.post("/api/support/tickets", async (req, res) => {
  const { userId, flag, message } = req.body;
  let requiredLevel = 1;
  const category = issueCategories.find(c => c.name === flag);
  if (category) {
      requiredLevel = category.level;
  }

  const ticket = {
    _id: String(mockTicketIdCounter++),
    userId,
    flag,
    requiredLevel,
    status: 'open',
    messages: [{ senderId: userId, text: message, timestamp: new Date() }],
    createdAt: new Date()
  };
  mockTickets.push(ticket);
  
  if (process.env.GEMINI_API_KEY) {
     try {
        let prompt = `You are a PayCam customer support AI agent. You manage Level 1 and Level 2 issues and respond back to the user to help resolve their problems. If the issue is complex or a Level 3 issue (e.g. Scams, Transfer to wrong account), refer the user to continue with a human support agent.\n\nThe user is facing an issue with category: ${flag}. Their message is: "${message}". Briefly acknowledge the issue and provide a helpful, reassuring answer. Keep it concise.`;
        if (requiredLevel >= 3) {
           prompt += `\nIMPORTANT: Since the category is ${flag}, this is a Level 3 issue. You MUST inform the user that you are referring them to a human support agent.`;
        }
        const aiResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        ticket.messages.push({ senderId: 'ai-agent', text: aiResponse.text || "Our automated system is reviewing your case. Please hold on.", timestamp: new Date() });
     } catch(e: any) {
        if (e.message?.includes("API key not valid")) {
            console.error("AI Assistant error: The provided Gemini API Key is invalid.");
            ticket.messages.push({ senderId: 'ai-agent', text: "AI Assistant error: The provided Gemini API Key is invalid. Please check your .env file.", timestamp: new Date() });
        } else {
            console.error("AI Error:", e.message || e);
            ticket.messages.push({ senderId: 'ai-agent', text: "Our virtual assistant is currently offline. Please wait for a human agent.", timestamp: new Date() });
        }
     }
  }

  res.json({ ticket });
});

app.get("/api/support/tickets", async (req, res) => {
  const { userLevel } = req.query;
  if (useMockDb) {
    let tickets = mockTickets;
    if (userLevel) {
      tickets = mockTickets.filter(t => t.requiredLevel === Number(userLevel));
    }
    res.json({ tickets });
  } else {
    let query = {};
    if (userLevel) query = { requiredLevel: Number(userLevel) };
    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.json({ tickets });
  }
});

app.get("/api/support/search-user", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json({ result: null });
  
  const q = String(query).toLowerCase();
  
  let foundUser = null;
  let transactions = [];

  if (useMockDb) {
    foundUser = Array.from(mockUsers.values()).find(u => 
      u.name?.toLowerCase().includes(q) || 
      u.phone?.includes(q) || 
      u.paycamId?.toLowerCase().includes(q) ||
      u._id === q
    );
    if (foundUser) {
      transactions = mockTransactions
        .filter(t => t.userId === foundUser._id)
        .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  } else {
    foundUser = await User.findOne({
      $or: [
        { phone: new RegExp(q, 'i') },
        { paycamId: new RegExp(q, 'i') },
        { name: new RegExp(q, 'i') }
      ]
    });
    if (foundUser) {
      transactions = await Transaction.find({ userId: foundUser._id })
        .sort({ createdAt: -1 })
        .limit(20);
    }
  }
  
  if (!foundUser) return res.json({ result: null });

  res.json({ 
    result: { 
      user: { _id: foundUser._id, name: foundUser.name, phone: foundUser.phone, paycamId: foundUser.paycamId, balance: foundUser.balance, status: foundUser.status || 'active' },
      transactions 
    } 
  });
});

app.put("/api/support/block-user/:userId", async (req, res) => {
  const { type, reason } = req.body;
  const status = type === 'permanent' ? 'blocked_permanent' : 'blocked_temporal';

  if (useMockDb) {
    const user = mockUsers.get(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.status = status;
    user.blockReason = reason;
    user.blockedAt = new Date();
    return res.json({ success: true, user });
  } else {
    try {
      const user = await User.findById(req.params.userId).catch(() => null);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.status = status;
      user.blockReason = reason;
      user.blockedAt = new Date();
      await user.save();
      res.json({ success: true, user });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  }
});

app.put("/api/support/unblock-user/:userId", async (req, res) => {
  if (useMockDb) {
    const user = mockUsers.get(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.status = 'active';
    user.blockReason = undefined;
    user.blockedAt = undefined;
    return res.json({ success: true, user });
  } else {
    try {
      const user = await User.findById(req.params.userId).catch(() => null);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.status = 'active';
      user.blockReason = undefined;
      user.blockedAt = undefined;
      await user.save();
      res.json({ success: true, user });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  }
});

app.get("/api/support/tickets/user/:userId", async (req, res) => {
  if (useMockDb) {
    res.json({ tickets: mockTickets.filter(t => t.userId === req.params.userId) });
  } else {
    const tickets = await Ticket.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ tickets });
  }
});

app.post("/api/support/tickets/:ticketId/reply", async (req, res) => {
  const { senderId, text } = req.body;
  const ticket = mockTickets.find(t => t._id === req.params.ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  ticket.messages.push({ senderId, text, timestamp: new Date() });

  if (senderId === ticket.userId && process.env.GEMINI_API_KEY) {
     if (ticket.status === 'open') {
         try {
            const history = ticket.messages.map((m: any) => `${m.senderId === ticket.userId ? 'User' : 'Agent'}: ${m.text}`).join('\n');
            let prompt = `You are a PayCam customer support AI agent. You manage Level 1 and Level 2 issues and respond back to the user to help resolve their problems. If the issue is complex or a Level 3 issue (e.g. Scams, Transfer to wrong account), refer the user to continue with a human support agent.\n\nThe user is facing an issue with category: ${ticket.flag}. Here is the chat history:\n${history}\nBased on the history, provide a reassuring and concise next step or answer.`;
            if (ticket.requiredLevel >= 3) {
               prompt += `\nIMPORTANT: Since the category is ${ticket.flag}, this is a Level 3 issue. You MUST inform the user that you have alerted a human support agent who will join the chat very soon to handle this case.`;
            }
            const aiResponse = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
            });
            ticket.messages.push({ senderId: 'ai-agent', text: aiResponse.text || "Our fully automated system has noted your reply.", timestamp: new Date() });
         } catch(e: any) {
            if (e.message?.includes("API key not valid")) {
                console.error("AI Assistant error: The provided Gemini API Key is invalid.");
                ticket.messages.push({ senderId: 'ai-agent', text: "AI Assistant error: The provided Gemini API Key is invalid. Please check your .env file.", timestamp: new Date() });
            } else {
                console.error("AI Error:", e.message || e);
                ticket.messages.push({ senderId: 'ai-agent', text: "Our virtual assistant is currently offline. Please wait for a human agent.", timestamp: new Date() });
            }
         }
     }
  }

  res.json({ ticket });
});

app.put("/api/support/tickets/:ticketId/status", (req, res) => {
  const { status } = req.body;
  const ticket = mockTickets.find(t => t._id === req.params.ticketId);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  ticket.status = status;
  res.json({ ticket });
});

// Compliance APIs
app.post("/api/compliance/kyc/verify", async (req, res) => {
  const { userId, name, documentType, image } = req.body;
  
  if (!image) {
     return res.status(400).json({ error: "Image is required" });
  }

  try {
      // Clean base64 image (remove data:image/png;base64, if present)
      const base64Data = image.split(',')[1] || image;
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
      
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const prompt = `Analyze this ${documentType} document from Cameroon.
The user account name is "${name}".
Verify the following conditions:
1. The document appears to be a genuine Cameroon ${documentType} (check layout, keywords like "Republic of Cameroon", "Republique du Cameroun").
2. The extracted full name reasonably matches the account name "${name}" (allowing for middle names or reordering).
3. Extract the document number (e.g., ID number, Passport number, Driver's License number).
4. Extract the date of birth and expiry date if visible.
5. Check if the document is expired. (Assume current year is ${new Date().getFullYear()}).

Return ONLY a valid JSON object (no markdown) with these fields:
- "isCameroonDoc" (boolean): true if it looks like a valid Cameroon document.
- "extractedName" (string): the full name extracted from the document.
- "nameMatch" (boolean): true if the name matches the account name.
- "documentNumber" (string): the extracted ID/Passport/License number, or "Not found".
- "isExpired" (boolean): true if the document has expired.
- "match" (boolean): true ONLY IF isCameroonDoc is true AND nameMatch is true AND isExpired is false.
- "reason" (string): If match is false, a short reason why (e.g. "Name mismatch", "Document expired", "Not a valid Cameroon document", etc. Leave empty if match is true).
`;

      const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
              { role: 'user', parts: [
                  { text: prompt },
                  { inlineData: { mimeType, data: base64Data } }
              ]}
          ]
      });
      
      const resultText = response.text || '';
      let matchResult = false;
      let extractedName = '';
      let docNumber = '';
      let rejectReason = 'Verification failed';
      
      try {
          const parsed = JSON.parse(resultText.replace(/```json/g, '').replace(/```/g, '').trim());
          matchResult = parsed.match;
          extractedName = parsed.extractedName || '';
          docNumber = parsed.documentNumber || '';
          rejectReason = parsed.reason || 'Verification failed';
      } catch (e) {
          console.error("Failed to parse Gemini output:", resultText);
          matchResult = false;
          rejectReason = 'Failed to parse AI response';
      }

      let user = null;
      if (useMockDb) {
          user = mockUsers.get(userId);
          if (user && matchResult) {
              user.kycVerified = true;
          }
      } else {
          user = await User.findById(userId).catch(() => null);
          if (user && matchResult) {
              user.kycVerified = true;
              await user.save();
          }
      }

      let kycRecord;
      if (useMockDb) {
        kycRecord = {
          _id: String(mockIdCounter++),
          userId,
          paycamId: user ? user.paycamId : 'UNKNOWN',
          name: user ? user.name : 'Unknown User',
          documentType: documentType || 'National ID',
          documentNumber: docNumber,
          status: matchResult ? 'approved' : 'rejected',
          submittedAt: new Date(),
          documentImage: image
        };
        mockKycs.push(kycRecord);
      } else {
        kycRecord = new Kyc({
          userId,
          paycamId: user ? user.paycamId : 'UNKNOWN',
          name: user ? user.name : 'Unknown User',
          documentType: documentType || 'National ID',
          documentNumber: docNumber,
          status: matchResult ? 'approved' : 'rejected',
          documentImage: image,
          submittedAt: new Date()
        });
        await kycRecord.save();
      }

      if (matchResult) {
          res.json({ success: true, message: "Verification successful", kyc: kycRecord });
      } else {
          res.status(400).json({ error: rejectReason });
      }
      
  } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Error verifying document: " + error.message });
  }
});

app.post("/api/compliance/kyc/submit", (req, res) => {
  const { userId, documentType, documentNumber } = req.body;
  const user = useMockDb ? mockUsers.get(userId) : null;
  const kyc = {
    _id: String(mockIdCounter++),
    userId,
    paycamId: user ? user.paycamId : 'UNKNOWN',
    name: user ? user.name : 'Unknown User',
    documentType: documentType || 'National ID',
    documentNumber: documentNumber || 'ID' + Math.floor(Math.random() * 10000000),
    status: 'pending',
    submittedAt: new Date(),
    documentImage: ''
  };
  mockKycs.push(kyc);
  res.json({ success: true, kyc });
});

app.get("/api/compliance/stats", async (req, res) => {
  try {
    let pendingKycCount, flaggedTxCount, blockedUserCount;
    if (useMockDb) {
      pendingKycCount = mockKycs.filter(k => k.status === 'pending').length;
      flaggedTxCount = mockTransactions.filter(t => t.status === 'flagged').length;
      blockedUserCount = Array.from(mockUsers.values()).filter(u => u.status?.startsWith('blocked')).length;
    } else {
      pendingKycCount = await Kyc.countDocuments({ status: 'pending' });
      flaggedTxCount = await Transaction.countDocuments({ status: 'flagged' });
      blockedUserCount = await User.countDocuments({ status: { $regex: '^blocked' } });
    }
    res.json({ pendingKycCount, flaggedTxCount, blockedUserCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/compliance/kyc", async (req, res) => {
  try {
    let kycs = [];
    if (useMockDb) {
      kycs = mockKycs;
    } else {
      kycs = await Kyc.find().sort({ submittedAt: -1 }).lean();
    }
    res.json({ kycs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch KYC records" });
  }
});

app.post("/api/compliance/kyc/:id/resolve", async (req, res) => {
  try {
    const { status } = req.body;
    let kyc;
    
    if (useMockDb) {
      kyc = mockKycs.find(k => k._id === req.params.id);
      if (!kyc) return res.status(404).json({ error: "KYC not found" });
      kyc.status = status;
      kyc.reviewedAt = new Date();
      
      const user = mockUsers.get(kyc.userId);
      if (user) user.kycVerified = (status === 'approved');
      
    } else {
      kyc = await Kyc.findById(req.params.id);
      if (!kyc) return res.status(404).json({ error: "KYC not found" });
      kyc.status = status;
      kyc.reviewedAt = new Date();
      await kyc.save();
      
      const user = await User.findById(kyc.userId).catch(() => null);
      if (user) {
        user.kycVerified = (status === 'approved');
        await user.save();
      }
    }
    
    if (status === 'approved') {
      notifyUser(kyc.userId, 'KYC Approved', 'Your KYC documentation has been approved.');
    } else {
      notifyUser(kyc.userId, 'KYC Rejected', 'Your KYC documentation was rejected. Please re-submit.');
    }
    
    logAudit(req.body.officerId || 'system', 'Resolved KYC Form', kyc._id, `Status: ${status}`);
    res.json({ success: true, kyc });
  } catch (error) {
    res.status(500).json({ error: "Failed to resolve KYC" });
  }
});

app.get("/api/compliance/transactions/flagged", async (req, res) => {
  if (useMockDb) {
    res.json({ transactions: mockTransactions.filter(t => t.status === 'flagged') });
  } else {
    const transactions = await Transaction.find({ status: 'flagged' });
    res.json({ transactions });
  }
});

app.post("/api/compliance/transactions/:id/resolve", (req, res) => {
  const { action } = req.body;
  const tx = mockTransactions.find(t => t._id === req.params.id);
  if (!tx) return res.status(404).json({ error: "Transaction not found" });
  
  tx.status = action === 'approve' ? 'completed' : 'rejected';
  
  // Need to process the transaction if approved
  if (action === 'approve') {
    const sender = mockUsers.get(tx.userId);
    if (sender) {
      const deduction = tx.amount + (tx.fee || 0);
      sender.balance -= deduction;
      
      if (tx.type === 'send') {
        const recipientUser = Array.from(mockUsers.values()).find(u => u.paycamId === tx.recipient || u.phone === tx.recipient);
        if (recipientUser) {
           recipientUser.balance += tx.amount;
           mockTransactions.push({
             _id: String(mockIdCounter++),
             userId: recipientUser._id, type: 'receive', amount: tx.amount, agency: 'PayCam', recipient: sender.phone, fee: 0, status: 'completed', createdAt: new Date()
           });
           notifyUser(recipientUser._id, 'Payment Received', `You received ${tx.amount.toLocaleString()} XAF from ${sender.name || sender.phone}.`);
        }
      }
    }
  }

  logAudit(req.body.officerId || 'system', 'Resolved Flagged TX', tx._id, `Status: ${action}`);
  if (action === 'approve') {
    notifyUser(tx.userId, 'Transaction Approved', `Your flagged transaction of ${tx.amount} XAF has been approved.`);
  } else {
    notifyUser(tx.userId, 'Transaction Rejected', `Your flagged transaction of ${tx.amount} XAF was rejected.`);
  }
  res.json({ success: true, tx });
});

app.get("/api/compliance/aml-alerts", async (req, res) => {
  if (useMockDb) {
    res.json({ alerts: mockAmlAlerts });
  } else {
    const alerts = await AmlAlert.find().sort({ createdAt: -1 }).limit(100);
    res.json({ alerts });
  }
});

app.post("/api/compliance/aml-alerts/:id/resolve", async (req, res) => {
  const { action, note, officerId } = req.body;
  
  let alert;
  if (useMockDb) {
    alert = mockAmlAlerts.find(a => a._id === req.params.id);
  } else {
    alert = await AmlAlert.findById(req.params.id);
  }
  
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  
  alert.status = action === 'approve' ? 'resolved' : 'escalated';
  alert.notes = note;
  
  if (action === 'reject') {
    let user;
    if (useMockDb) {
      user = mockUsers.get(alert.userId);
      if (user) user.status = 'blocked (frozen)';
    } else {
      user = await User.findById(alert.userId).catch(() => null);
      if (user) {
        user.status = 'blocked (frozen)';
        await user.save();
      }
    }
    
    if (user) {
      logAudit(officerId, 'Froze User Account', user._id, `Reason: AML Alert Escalation`);
      notifyUser(user._id.toString(), 'Account Frozen', `Your account has been frozen due to suspicious activity (AML Alert).`);
    }
  }
  
  if (!useMockDb && alert.save) {
    await alert.save();
  }
  
  if (action === 'approve') {
    notifyUser(alert.userId, 'AML Alert Cleared', `Your account is clear. Thank you for your patience.`);
  }

  logAudit(officerId, 'Resolved AML Alert', alert._id, `Action: ${action}. Note: ${note}`);
  res.json({ success: true, alert });
});

app.get("/api/compliance/audit-logs", async (req, res) => {
  if (useMockDb) {
    res.json({ logs: mockAuditLogs });
  } else {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  }
});

app.get("/api/compliance/agent-logs", async (req, res) => {
  if (useMockDb) {
    res.json({ logs: mockAgentLogs });
  } else {
    const logs = await AgentLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  }
});

app.get("/api/compliance/users", async (req, res) => {
  if (useMockDb) {
    const users = Array.from(mockUsers.values()).filter((u: any) => u.role !== 'admin');
    res.json({ users });
  } else {
    const users = await User.find({ role: { $ne: 'admin' } });
    res.json({ users });
  }
});

app.post("/api/compliance/users/:id/freeze", async (req, res) => {
  const { officerId, reason } = req.body;
  if (useMockDb) {
    const user = mockUsers.get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === 'admin') return res.status(403).json({ error: "Action not permitted on admin accounts" });
    user.status = 'blocked (frozen)';
    logAudit(officerId, 'Froze User Account', user._id.toString(), `Reason: ${reason}`);
    notifyUser(user._id.toString(), 'Account Frozen', `Your account has been frozen by compliance. Reason: ${reason}`);
    res.json({ success: true, user });
  } else {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === 'admin') return res.status(403).json({ error: "Action not permitted on admin accounts" });
    user.status = 'blocked (frozen)';
    await user.save();
    logAudit(officerId, 'Froze User Account', user._id.toString(), `Reason: ${reason}`);
    notifyUser(user._id.toString(), 'Account Frozen', `Your account has been frozen by compliance. Reason: ${reason}`);
    res.json({ success: true, user });
  }
});

app.post("/api/compliance/users/:id/unfreeze", async (req, res) => {
  const { officerId, reason } = req.body;
  if (useMockDb) {
    const user = mockUsers.get(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === 'admin') return res.status(403).json({ error: "Action not permitted on admin accounts" });
    user.status = 'active';
    logAudit(officerId, 'Unfroze User Account', user._id.toString(), `Reason: ${reason}`);
    notifyUser(user._id.toString(), 'Account Unfrozen', `Your account has been unfrozen. Reason: ${reason}`);
    res.json({ success: true, user });
  } else {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === 'admin') return res.status(403).json({ error: "Action not permitted on admin accounts" });
    user.status = 'active';
    await user.save();
    logAudit(officerId, 'Unfroze User Account', user._id.toString(), `Reason: ${reason}`);
    notifyUser(user._id.toString(), 'Account Unfrozen', `Your account has been unfrozen. Reason: ${reason}`);
    res.json({ success: true, user });
  }
});

// User Notifications API
app.get("/api/users/:id/notifications", (req, res) => {
  const notifications = mockNotifications.filter(n => n.userId === req.params.id);
  res.json({ notifications });
});

app.post("/api/notifications/:id/read", (req, res) => {
  const notification = mockNotifications.find(n => n._id === req.params.id);
  if (notification) {
    notification.read = true;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Notification not found" });
  }
});


// Global Error Handler for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith("/api/")) {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } else {
    next(err);
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

    // Load settings from DB on startup
  if (!useMockDb) {
    Settings.findOne().then(settingsDoc => {
      if (settingsDoc) {
        Object.assign(systemSettings, settingsDoc.toObject());
        console.log('Loaded settings from DB');
      }
    }).catch(err => console.error('Failed to load settings', err));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
