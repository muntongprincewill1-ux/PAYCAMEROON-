const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const amlAlertSchemaText = `const AmlAlert = mongoose.model("AmlAlert", amlAlertSchema);`;

const kycSchemaCode = `
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
`;

if (!content.includes('mongoose.model("Kyc"')) {
  content = content.replace(amlAlertSchemaText, amlAlertSchemaText + kycSchemaCode);
  fs.writeFileSync('server.ts', content);
}
