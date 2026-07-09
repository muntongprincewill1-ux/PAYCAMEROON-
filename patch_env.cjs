const fs = require('fs');
let content = fs.readFileSync('.env.example', 'utf8');
content = content.replace(
  'MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/paycam"',
  'MONGODB_URI="mongodb+srv://muntongprincewillyounyui_db_user:<db_password>@cluster0.muot3qs.mongodb.net/paycam?appName=Cluster0"'
);
fs.writeFileSync('.env.example', content);
