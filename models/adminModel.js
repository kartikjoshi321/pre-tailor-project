var { mongoose, conn } = require('../config/db');

const adminSchema = new mongoose.Schema({
  roleId: {
    type: Number,
    default: 1  //Note: RoleId 1 for admin, 2 for driver, 3 for user, 4 for subAdmin
  },
  email: {
    type: String,
    required: true
  },
  fullname: {
    type: String,
    default: "Admin"
  },
  image: {
    type: String,
    default: ''
  },
  token: {
    type: String,
    default: ''
  },
  linkToken:{
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true
  }
},
  {
    strict: true,
    collection: 'admin',
    versionKey: false
  }
);

exports.AdminModel = mongoose.model('admin', adminSchema);
