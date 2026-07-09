const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      const kyc = {
        _id: String(mockIdCounter++),
        userId,
        paycamId: user ? user.paycamId : 'UNKNOWN',
        name: user ? user.name : 'Unknown User',
        documentType: documentType || 'National ID',
        documentNumber: docNumber,
        status: matchResult ? 'approved' : 'rejected',
        submittedAt: new Date(),
        documentImage: image // store image as base64 for compliance officer
      };
      mockKycs.push(kyc);

      if (matchResult) {
          res.json({ success: true, message: "Verification successful", kyc });
      } else {
          res.status(400).json({ error: rejectReason });
      }`;

const replacementStr = `      let kycRecord;
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
      }`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('server.ts', content);
