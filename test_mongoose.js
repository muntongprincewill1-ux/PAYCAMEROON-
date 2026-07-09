const mongoose = require('mongoose');

const Schema = new mongoose.Schema({ name: String });
const Model = mongoose.model('Test', Schema);

Model.findOne().then(console.log).catch(console.error);
console.log('Started');
