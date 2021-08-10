const express = require('express');
const route = express.Router();
const ustaadController = require('../controller/ustaad.controller');
const authentication = require("../middlewares/authentication");
const s3bucket = require("../modules/aws-s3");

route.post('/addCity', ustaadController.addCity);
route.post('/addCountry', s3bucket.uploadUstaadFiles, ustaadController.addCountry);
route.post('/updateCountry', s3bucket.uploadUstaadFiles, ustaadController.updateCountry);
route.post('/addSubAdmin', ustaadController.addSubAdmin);
route.get('/getAllCities', ustaadController.getAllCity);
route.get('/getAllFreeCities', ustaadController.getAllFreeCities);
route.post('/deleteCityByid', ustaadController.deleteCityByid);
route.post('/blockAndUnblockCity', ustaadController.blockAndUnblockCity);
route.get('/getAllCountry', ustaadController.getAllCountry);
route.post('/deleteCountryByid', ustaadController.deleteCountryByid);
route.post('/blockAndUnblockCountry', ustaadController.blockAndUnblockCountry);

route.get('/getAllSubAdmins', ustaadController.getAllSubAdmins);
route.post('/blockAndUnblockSubAdmins', ustaadController.blockAndUnblockSubAdmins);
route.post('/deleteSubAdminsByid', ustaadController.deleteSubAdminsByid);
route.post('/getsubAdminByid', ustaadController.getsubAdminByid);


//-------------sub admin Register ---
route.post('/registerSubAdmin', ustaadController.registerSubAdminUser);
route.post('/genUserIdPass', ustaadController.generateUserIdPassword);
route.post('/checkGeneratedID', ustaadController.checkGeneratedID);
route.get('/getSubAdminList', ustaadController.getSubAdminList);
route.post('/loginSubAdmin', ustaadController.loginSubAdmin);

route.post('/addTimeSlot', authentication.verifyUstaadToken, ustaadController.addTimeSlot);
route.post('/getTimeSlots', authentication.verifyUstaadToken, ustaadController.getTimeSlots);
route.post('/changeTimeAvalability', authentication.verifyUstaadToken, ustaadController.changeTimeAvalability);
route.post('/getSlotsOfTime', authentication.verifyUstaadToken, ustaadController.getSlotsOfTime);

route.get('/getAllStichings', authentication.verifyUstaadToken, ustaadController.getAllStichings);

route.post('/addRecordMeasurment',authentication.verifyUstaadToken, ustaadController.addMeasurment );
// route.post('/trackSubAdmin',ustaadController.trackStatuSubAdmins);
// route.post('/trackSubAdminById',ustaadController.getTrackStatuById);
module.exports = route;