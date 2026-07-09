const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldPostSettings = `        let settingsDoc = await Settings.findOne();
        if (!settingsDoc) {
          settingsDoc = new Settings(systemSettings);
        } else {
          Object.assign(settingsDoc, systemSettings);
        }
        await settingsDoc.save();`;

const newPostSettings = `        if (!useMockDb) {
          let settingsDoc = await Settings.findOne();
          if (!settingsDoc) {
            settingsDoc = new Settings(systemSettings);
          } else {
            Object.assign(settingsDoc, systemSettings);
          }
          await settingsDoc.save();
        }`;

content = content.replace(oldPostSettings, newPostSettings);

const oldInitSettings = `  // Load settings from DB on startup
  Settings.findOne().then(settingsDoc => {
    if (settingsDoc) {
      Object.assign(systemSettings, settingsDoc.toObject());
      console.log('Loaded settings from DB');
    }
  }).catch(err => console.error('Failed to load settings', err));`;

const newInitSettings = `  // Load settings from DB on startup
  if (!useMockDb) {
    Settings.findOne().then(settingsDoc => {
      if (settingsDoc) {
        Object.assign(systemSettings, settingsDoc.toObject());
        console.log('Loaded settings from DB');
      }
    }).catch(err => console.error('Failed to load settings', err));
  }`;

content = content.replace(oldInitSettings, newInitSettings);

const oldFinanceSettings = `    let settingsDoc = await Settings.findOne();
    if (settingsDoc) {
      settingsDoc.taxRate = systemSettings.taxRate;
      await settingsDoc.save();
    }`;

const newFinanceSettings = `    if (!useMockDb) {
      let settingsDoc = await Settings.findOne();
      if (settingsDoc) {
        settingsDoc.taxRate = systemSettings.taxRate;
        await settingsDoc.save();
      }
    }`;

content = content.replace(oldFinanceSettings, newFinanceSettings);

fs.writeFileSync('server.ts', content);
