const mongoose = require('mongoose');

// local connection
// const conn = mongoose.connect('mongodb://127.0.0.1:27017/taylordb', { useNewUrlParser: true , useUnifiedTopology: true } );

//live connection
//const conn = mongoose.connect('mongodb://taylorapp:TaiLorApp@127.0.0.1:27017/Taylordb', { useNewUrlParser: true, useUnifiedTopology: true });

//local code with live connection     
 const conn = mongoose.connect('mongodb://taylorapp:TaiLorApp@15.184.81.38:27017/Taylordb', { useNewUrlParser: true, useUnifiedTopology: true });

exports.mongoose = mongoose;
exports.conn = conn;
