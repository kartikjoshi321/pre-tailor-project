const mongoose = require('mongoose');
const { cityModel } = require('../models/cityModel');
const { countryModel } = require('../models/countryModel');
const { ustaadModel } = require('../models/ustaadModel');
const utils = require('../modules/utils');
const { timeslotModel } = require('../models/timeslotModel');
const { slotsOfTimeModel } = require('../models/slotsOfTimeModel');
const { stichingCartModel } = require('../models/stichingCartModel');
const { recordMeasurementModel } = require('../models/recordMeasurmentModel');
const { fabricColorModel } = require('../models/fabricColorModel');
const moment = require('moment');

exports.loginSubAdmin = async (data) => {

    try {
        if (!data.generated_user_id || data.generated_user_id == '')
            throw new Error("Please Enter the generated_user_id");
        if (!data.generated_password || data.generated_user_id == '')
            throw new Error("Please Enter the generated_password");

        let subAdmin_check = await ustaadModel.find({ roleId: 2 }).lean();

        // Check if Admin exist, if not then Create one
        if (subAdmin_check.length == 0) {
            return { status: 0, data: subAdmin_check };
        }
        let subAdmin = await ustaadModel.findOne({ generated_user_id: data.generated_user_id }).exec();
        if (!subAdmin)
            throw new Error("generated_user_id id not Exist");
        console.log("subAdmin :", subAdmin);
        let check = await ustaadModel.findOne({ generated_password: data.generated_password });
        if (!check) {
            throw new Error(msg.invalidPass);
        }

        // let token = authentication.generateToken('30 days');
        // console.log("Token :", token);
        // subAdmin.token = token;
        let subAdminUser = await subAdmin.save();
        if (!subAdminUser) {
            return { status: -1, message: "Something went wrong, Please try Later" };
        }
        return { status: 1, data: subAdminUser, message: "Login Successfully" };

    } catch (error) {
        throw new Error(error.message);
    }
};
exports.addCity = async (data) => {
    try {
        let existCity = await cityModel.findOne({ cityName: { $regex: data.cityName, $options: 'i' }, is_deleted: false }).lean();
        if (existCity) {
            return { status: -1, message: "City Already Exist." };
        }

        let city = new cityModel(data);
        let result = await city.save();
        if (!result) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "City added Successfully.", data: result };

    } catch (err) {
        throw new Error(err.message);
    }
};


exports.addCountry = async (data) => {
    try {
        let cities = JSON.parse(data.cityAllocatedToThisCountry);
        data.applicableTaxes != '' ? data.applicableTaxes = JSON.parse(data.applicableTaxes) : [];
        delete data.cityAllocatedToThisCountry;

        let existCountry = await countryModel.findOne({ countryName: { $regex: data.countryName, $options: 'i' }, is_deleted: false }).lean();
        if (existCountry) {
            return { status: -1, message: "Country Already Exist." };
        }


        let country = new countryModel(data);
        let result = await country.save();

        if (!result) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }

        await cityModel.updateMany({ _id: { $in: cities } }, {
            $set: { country: result._id }
        }, { new: true, lean: true });

        return { status: 1, message: "Country added Successfully.", data: result };
    } catch (err) {
        throw new Error(err.message);
    }
};
exports.updateCountry = async (data) => {
    try {
        if (!data._id || data._id == '')
            throw new Error("Insufficient Paramaters");
        if (!data.countryName) {
            return { status: -1, message: "please provide country name" };
        }
        if (data.cityAllocatedToThisCountry) {
            data.cityAllocatedToThisCountry = JSON.parse(data.cityAllocatedToThisCountry);
            // if (data.cityAllocatedToThisCountry.length <= 0) {
            //   throw new Error("Please give atleast one cityAllocatedToThisCountry");
            // } 
        }
        if (data.applicableTaxes) {
            data.applicableTaxes = JSON.parse(data.applicableTaxes);
            // if (data.cityAllocatedToThisCountry.length <= 0) {
            //   throw new Error("Please give atleast one cityAllocatedToThisCountry");
            // } 
        }
        if (!data.countryFlag || data.countryFlag == '' || data.countryFlag == 'undefined') { throw new Error("Upload the country flag"); }

        let existCountry = await countryModel.findOne({ _id: { $ne: mongoose.Types.ObjectId(data._id) }, is_deleted: false, countryName: { $regex: data.countryName, $options: 'i' } }).lean();
        if (existCountry) {
            return { status: -1, message: "Country Already Exist." };
        }


        data.modified_at = Date.now();
        let update = await countryModel.findByIdAndUpdate(data._id, { $set: data }, { new: true })
        if (!update) {
            return { status: -1, message: "Not able to update right now,please try later" }
        }
        return { status: 1, message: "country updated Successfully.", data: update }
    } catch (error) {
        throw new Error(error.message)
    }
};
exports.addSubAdmin = async (req) => {
    let data = req.body;
    data.roleId = 2; // 2 for user .... 1 for admin,4 for sub admin
    data.mobile = parseInt(data.mobile);

    //check if given number is already exist

    let isMobileExist = await ustaadModel.findOne({ mobile: data.mobile }).lean();
    if (isMobileExist) throw { message: msg.mobileAlreadyExist };

    let isEmailExist = await ustaadModel.findOne({ Email: data.Email }).lean();
    if (isEmailExist) throw { message: msg.emailAlreadyExist };
    let isUserExist = await ustaadModel.findOne({ Username: data.Username }).lean();
    if (isUserExist) throw { message: msg.userNameExists };
    // data.roleId = 2;
    data["module_access"] = data.module_access;
    let res = new ustaadModel(data);
    let result = await res.save();
    /**
     * if User is registered without errors
     * create a token
     */


    return {
        response: result,
        message: msg.success,
    };
};
exports.getAllCity = async () => {
    try {

        var cities = await cityModel.find({ is_deleted: false }).populate('country').sort({ 'createdAt': -1 }).lean();
        if (!cities) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "City Fetch Successfully.", data: cities };

    } catch (err) {
        throw new Error(err.message);
    }
};

exports.getAllFreeCities = async () => {
    try {
        var cities = await cityModel.find({ is_deleted: false, country: null }).sort({ 'createdAt': -1 }).lean();
        if (!cities) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "City added Successfully.", data: cities };
    } catch (err) {
        throw new Error(err.message);
    }
};

exports.deleteCityByid = async (data) => {
    try {
        if (!data._id || data._id == '') {
            return { status: -1, message: "unsufficient perameter" };
        }
        let city = await cityModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { $set: { is_deleted: true } }).lean();
        if (!city) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "City deleted Successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
};

exports.blockAndUnblockCity = async (data) => {
    try {
        if (!data._id || data._id == '' || data.is_active == undefined || data.is_active == '') {
            return { status: -1, message: "unsufficient perameter" };
        }
        let city = await cityModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), data, { new: true }).lean();
        if (!city) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "City Update Successfully.", data: city };

    } catch (err) {
        throw new Error(err.message);
    }
};

exports.getAllCountry = async () => {
    try {
        let query = [{
            $match: { is_deleted: false }
        }, {
            $lookup: {
                let: { 'id': '$_id' },
                from: 'cities',
                pipeline: [{
                    $match: {
                        $expr: {
                            $eq: ['$$id', '$country']
                        }
                    }
                }],
                as: 'cities'
            }
        }, {
            $sort: {
                _id: -1
            }
        }];

        var country = await countryModel.aggregate(query);

        if (!country) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Country added Successfully.", data: country };

    } catch (err) {
        throw new Error(err.message);
    }

};

exports.deleteCountryByid = async (data) => {
    try {
        if (!data._id || data._id == '') {
            return { status: -1, message: "unsufficient perameter" };
        }
        let city = await countryModel.findByIdAndUpdate(data._id, { is_deleted: true }).lean();
        if (!city) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Country deleted Successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
};


exports.blockAndUnblockCountry = async (data) => {
    try {
        if (!data._id || data._id == '' || data.is_active == undefined || data.is_active == '') {
            return { status: -1, message: "unsufficient perameter" };
        }
        let city = await countryModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), data, { new: true }).lean();
        if (!city) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Country Update Successfully.", data: city };

    } catch (err) {
        throw new Error(err.message);
    }
};

exports.blockAndUnblockSubAdmins = async (data) => {
    try {
        if (!data._id || data._id == '' || data.is_active == undefined || data.is_active == '')
            throw new Error("unsufficient Perameters");

        let checkStatus = await ustaadModel.findByIdAndUpdate(data._id, data, { new: true });
        if (!checkStatus) {
            return { status: -1, message: "something  went wrong, please try After sometime." }
        }
        return { status: 1, message: " status changed Successfully.", data: checkStatus };
    } catch (error) {
        throw new Error(error.message);
    }
};
exports.deleteSubAdminsByid = async (data) => {
    let deleteClient = await ustaadModel.findByIdAndRemove({ _id: data._id });
    if (deleteClient) {
        return {
            response: deleteClient,
            message: "success",
        };
    }
};
exports.getsubAdminByid = async (data) => {
    let user = await ustaadModel.aggregate([{
        $match:
            { _id: mongoose.Types.ObjectId(data.id) }
    }, {
        $lookup: {
            from: "countries",
            localField: "country",
            foreignField: "_id",
            as: "country"
        }
    }, {
        $unwind: {
            path: "$country",
            preserveNullAndEmptyArrays: true
        }
    }, {
        $project:
        {
            "_id": 1,
            "roleId": 1,
            "email": 1,
            "userName": 1,
            "role": 1,
            "region": 1,
            "is_active": 1,
            "is_User_Mgmt": 1,
            "is_geoLocation_mgmt": 1,
            "is_dashboard": 1,
            "is_Tailor_Mgmt": 1,
            "is_Orders_Mgmt": 1,
            "is_Product_Category_Mgmt": 1,
            "is_notifications_mgmt": 1,
            "is_user_mgmt": 1,
            "is_Promotions_Mgmt": 1,
            "is_fabric_type_Mgmt": 1,
            "is_rating_review_Mgmt": 1,
            "is_Refund_Mgmt": 1,
            "is_Charges_Mgmt": 1,
            "is_Revenue_Mgmt": 1,
            "is_CMS_Mgmt": 1,
            "is_reportGeneration_mgmt": 1,
            "is_setting_mgmt": 1,
            "is_Timeslot_mgmt": 1,
            "is_support_mgmt": 1,
            "is_payments_mgmt": 1,
            "clientAdminID": 1,
            "profileImage": 1,
            "requestedEmail": 1,
            "requestedContactNumber": 1,
            "requestedCountryCode": 1,
            "created_at": 1,
            "modified_at": 1,
            "country": "$country.countryName",
            "mobile": 1
        }
    }]);
    if (user) {
        return {
            response: user[0],
            message: "success"
        };
    }

};

exports.getAllSubAdmins = async (req, res) => {
    var clientList = await subAdmins.find({ "roleId": 4 });
    if (!clientList) {
        throw ({ message: msg.fieldNotMatch });
    }
    return {
        response: clientList
    }

};

exports.registerSubAdmin = async (req, res) => {

    let register = new ustaadModel(req);
    register.roleId = 2;
    let result = await register.save();
    if (!result) {
        throw ({ message: "Sorry try later" });
    }
    return {
        response: result,
        message: "success",
    }
}

exports.generateUserIdPass = async (req, res) => {

    let result = await ustaadModel.find({ "generated_user_id": req.generated_user_id });
    if (!result) {
        throw ({ message: "something went wrong please try later." });
    } else {
        console.log(result, "opp", result.length)
        if (result.length == 0) {

            var password = await utils.encryptText(req.generated_password);
            let updateUser = await ustaadModel.findByIdAndUpdate({ _id: req.user_id }, {
                generated_user_id: req.generated_user_id,
                generated_password: password
            }, { new: true });

            if (!updateUser) {
                throw ({ message: "something went wrong please try later." });
            }
            return {
                response: { "generated_user_id": updateUser.generated_user_id },
                message: "success",
            }

        } else {
            return {
                response: null,
                message: "Sub Admin Id is already exit.. ",
            }
        }
    }



}

exports.isGenerateUserIdExit = async (req, res) => {

    let result = await ustaadModel.find({ "generated_user_id": req.generated_user_id.toUpperCase() });
    if (!result) {
        throw ({ message: msg.fieldNotMatch });
    }
    if (result.length == 0) {
        return {
            response: { "generated_user_id": true },
            message: "User ID can be generate .",
        }
    } else {
        return {
            response: { "generated_user_id": result },
            message: "User ID has already generated now..",
        }
    }


}

exports.subAdminList = async (req, res) => {
    let result = await ustaadModel.find({ "roleId": 2 }).populate('country').sort({ 'created_at': 1 });
    if (!result) {
        throw ({ message: "something went wrong please try later." });
    }

    return {
        response: result,
        message: "success",
    }
}
exports.blockAndSubAdmins = async (req, res) => {
    //console.log(req)
    let result = await subAdmins.findByIdAndUpdate({ "_id": req.user_id }, { isBlocked: 1 }, { new: true });

    if (!result) {
        throw ({ message: msg.fieldNotMatch });
    }

    return {
        response: result,
        message: msg.success,
    }
}

function getInterval(opening_time, closing_time) {
    let x = {
        slotInterval: 60,
        openTime: moment(opening_time, ["h:mm A"]).format("HH:mm"),
        closeTime: moment(closing_time, ["h:mm A"]).format("HH:mm")
    };

    //Format the time
    let startTime = moment(x.openTime, "HH:mm");

    //Format the end time and the next day to it 
    let endTime = moment(x.closeTime, "HH:mm");

    //Times
    let allTimes = [];

    //Loop over the times - only pushes time with 30 minutes interval
    while (startTime < endTime) {
        //Push times
        allTimes.push(startTime.format("HH:mm"));
        //Add interval of 30 minutes
        startTime.add(x.slotInterval, 'minutes');
    }

    let timeSlot = allTimes.map((time) => {
        return {
            is_active: false,
            slots: moment(time, ["HH.mm"]).format("hh:mm a"),
        };

    });
    return timeSlot;
}


exports.addTimeSlot = async (data, user) => {
    try {
        let { ...saveTimeSlot } = { ...data, ... { created_by: user._id } };

        //let slot = 24 / parseInt(data.interval);
        var time = [];
        let times = await timeslotModel.find({ created_by: user._id }).lean();
        let saveSlot;
        if (times.length > 0) {

            saveSlot = await timeslotModel.findByIdAndUpdate(times[0]._id, saveTimeSlot);

        } else {

            let timeSlot = getInterval("00:00 AM", "11:59 PM");
            let slotIds = [];
            for (let i = 1; i <= 7; i++) {
                let saveTime = await slotsOfTimeModel.create({
                    day: i,
                    time: timeSlot,
                    created_by: user._id
                });
                if (!saveTime) {
                    throw new Error("Something went Wrong, Please try later");
                }
                slotIds.push(saveTime._id);
            }


            saveSlot = await timeslotModel.create({ ...saveTimeSlot, ...{ timeslot: slotIds } });
        }

        if (!saveSlot) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Timeslot added Successfully.", data: saveSlot };

    } catch (err) {
        throw new Error(err.message);
    }
};

exports.getTimeSlots = async (user) => {
    try {
        let saveSlot = await timeslotModel.find({ created_by: mongoose.Types.ObjectId(user._id) });
        if (!saveSlot) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Timeslot added Successfully.", data: saveSlot };

    } catch (err) {
        throw new Error(err.message);
    }
};

exports.getSlotsOfTime = async (data, userData) => {
    try {
        let saveSlot = await slotsOfTimeModel.findOne({ day: data.day, created_by: mongoose.Types.ObjectId(userData._id) }).lean();
        if (!saveSlot) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Timeslot added Successfully.", data: saveSlot };

    } catch (err) {
        throw new Error(err.message);
    }
};

exports.changeTimeAvalability = async (data) => {
    try {
        let saveSlot = await slotsOfTimeModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data._id) }, {
            $set: { time: data.time }
        }, { new: true, lean: true });
        if (!saveSlot) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Timeslot updated Successfully.", data: saveSlot };

    } catch (err) {
        throw new Error(err.message);
    }
};

exports.getAllStichings = async (data) => {
    try {

        let query = [
            {
                $match: { ustaadId: data._id, status: { $in: [2, 3] } }
            },
           { $sort : { created_at : -1 } },
  
            {
              $lookup: {
                  from: "order",
                  localField: "_id",
                  foreignField: "stichingList",
                  as: "stiching"
              }
          },
          {
              $unwind: {
                  path: "$stiching",
                  preserveNullAndEmptyArrays: true
              }
          },
          {
              $lookup: {
                  from: "address",
                  localField: "stiching.addressId",
                  foreignField: "_id",
                  as: "address"
              }
          },
          {
              $unwind: {
                  path: "$address",
                  preserveNullAndEmptyArrays: true
              }
          },
          {
              $lookup: {
                  from: 'user',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'user'
              }
          }, {
              $unwind: {
                  path: '$user',
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: 'fabricBrand',
                  localField: 'brandId',
                  foreignField: '_id',
                  as: 'brand'
              }
          }, {
              $unwind: {
                  path: '$brand',
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: 'fabricType',
                  localField: 'fabricTypeId',
                  foreignField: '_id',
                  as: 'fabricType'
              }
          }, {
              $unwind: {
                  path: '$fabricType',
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: 'fabric',
                  localField: 'fabricId',
                  foreignField: '_id',
                  as: 'fabric'
              }
          }, {
              $unwind: {
                  path: '$fabric',
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: 'tailor',
                  localField: 'tailorId',
                  foreignField: '_id',
                  as: 'tailor'
              }
          }, {
              $unwind: {
                  path: '$tailor',
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: 'tailorProfile',
                  localField: 'tailor._id',
                  foreignField: 'tailorId',
                  as: 'tailorProfile'
              }
          }, {
              $unwind: {
                  path: '$tailorProfile',
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: 'fabricColor',
                  localField: 'color',
                  foreignField: '_id',
                  as: 'color'
              }
          }, {
              $unwind: {
                  path: '$color',
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: 'familyMember',
                  let: {
                      pid: "$memberId"
                  },
                  pipeline: [{
                      $match: {
                          $expr: {
                              $eq: ["$_id", {
                                  $toObjectId: "$$pid"
                              }]
                          }
                      }
                  }],
                  as: 'memberId'
              }
          }, {
              $unwind: {
                  path: "$memberId",
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: 'measurment',
                  localField: 'measurmentId',
                  foreignField: '_id',
                  as: 'measurment'
              }
          }, {
              $unwind: {
                  path: '$measurment',
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: 'rating',
                  localField: '_id',
                  foreignField: 'stichingId',
                  as: 'rating'
              }
          }, {
              $unwind: {
                  path: '$rating',
                  preserveNullAndEmptyArrays: true
              }
          },
          {
              $lookup: {
                  from: 'model',
                  localField: 'modelId',
                  foreignField: '_id',
                  as: 'model'
              }
          }, {
              $unwind: {
                  path: '$model',
                  preserveNullAndEmptyArrays: true
              }
          }, {
              $lookup: {
                  from: "ustaad",
                  localField: "ustaadId",
                  foreignField: '_id',
                  as: "ustaad"
              }
          }, {
              $unwind: {
                  path: "$ustaad",
                  preserveNullAndEmptyArrays: true
              }
          },
          {
              $lookup:{
                  from:"recordmeasurment",
                  localField:"recordMeasurment",
                  foreignField:"_id",
                  as:"record"
              }
          },{
              $unwind: {
                  path: "$record",
                  preserveNullAndEmptyArrays:true
              }
          },
          {
              $project: {
                  _id: 1,
                  'username': '$user.username',
                  'userImage': '$user.profileImage',
                  'userId': '$user._id',
                  'userMobile': '$user.mobile',
                  'orderId': "$orderId",
                  'color': '$color',
                  'tailorImage': "$tailorProfile.image",
                  'brand': '$brand.name',
                  'fabricName': '$fabricType.name',
                  'fabricId': '$fabricType._id',
                  "created_at": "$created_at",
                  'modified_at': '$modified_at',
                  "fabricPrice":1,
                  "complete_payment" : 1,
                  "stitchingPrice" : 1,
                  'is_member': {
                      $cond: { if: { "$gt": ["$memberId", null] }, then: "4", else: "6" }
                  },
                  'is_rating': {
                      $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
                  },
                  'tailorId': '$tailor._id',
                  'rating': '$rating',
                  'model_name': '$model.name',
                  'model_image': '$model.image',
                  'modelId': "$model._id",
                  'tailor': '$tailorProfile.storeDetails',
                  'tailorProfile': '$tailorProfile.businessLocation',
                  'member': '$memberId',
                  'priceForKid': '$tailorProfile.businessDetails.charges.charge_for_kid',
                  'priceForAdult': '$tailorProfile.businessDetails.charges.charge_for_adult',
                  'toShowPrice': {
                      $cond: {
                          if: { "$gt": ["$memberId", null] },
                          then: {
                              $cond: {
                                  if: { "$eq": ['$memberId.member_is', 0] },
                                  then: "1",
                                  else: "2"
                              }
                          },
                          else: "2"
                      }
                  },
                  'deliveryDate': '$delivery_on',
                  "refer" : 1,
                  "wallet" : 1,
                  "transaction_charge" : 1,
                  "delivery_charge" : 1,
                  "service_charge" : 1,
     
                  "address": "$address",
                  'record': "$record",
                  'image': '$color.image',
                  'measurment': '$measurment',
                  'isMeasurement': '$isMeasurement',
                  'ustaad': '$ustaad.userName',
                  'ustaadId': '$ustaad._id',
                  'ustaadMobile': '$ustaad.mobile',
                  "reason": "$reason",
                  'status': '$status',
                  "contactNo": '$tailor.mobile',
                  'quantity': '$quantity',
                  "payment_mode": "$stiching.payment_mode"
              }
          },
          {
              $project: {
                  _id: 1,
                  'username': '$username',
                  'userImage': '$userImage',
                  'userId': '$userId',
                  'userMobile': '$userMobile',
                  'orderId': "$orderId",
                  'color': '$color',
                  'ustaad': '$ustaad',
                  'ustaadId': '$ustaadId',
                  'ustaadMobile': '$ustaadMobile',
                  'tailorImage': "$tailorImage",
                  'brand': '$brand',
                  'fabricName': '$fabricName',
                  'fabricId': '$fabricId',
                  'modified_at': '$modified_at',
                  'tailor': '$tailor',
                  "created_at": "$created_at",
                  'toShowPrice': '$toShowPrice',
                  "fabricPrice":1,
                  "complete_payment" : 1,
                  "stitchingPrice" : 1,
                  "refer" : 1,
                  "wallet" : 1,
                  "transaction_charge" : 1,
                  "delivery_charge" : 1,
                  "service_charge" : 1,
                  "reaminaing_payment": { $subtract:[{ $add: ["$fabricPrice","$stitchingPrice","$transaction_charge","$delivery_charge","$service_charge"]},"$complete_payment"] },
                  'is_member': {
                      $cond: { if: { $eq: ["is_member", "6"] }, then: { $toBool: 'false' }, else: { $toBool: 'true' } }
                  },
                  'tailorId': '$tailorId',
                  'tailorProfile': '$tailorProfile',
                  'member': '$member',
                  'is_rating': '$is_rating',
                  "address": "$address",
                  'discount': { $toInt: "0" },
                  'offer': { $toInt: "0" },
                  'priceForKid': {
                      $cond: { if: { $eq: ['$toShowPrice', "1"] }, then: { $toInt: "$priceForKid" }, else: { $toInt: "0" } }
                  },
                  'priceForAdult': {
                      $cond: { if: { $eq: ['$toShowPrice', "2"] }, then: { $toInt: "$priceForAdult" }, else: { $toInt: "0" } }
                  },
                  'deliveryDate': '$deliveryDate',
                  'image': '$image',
                  'measurment': '$measurment',
                  'isMeasurement': '$isMeasurement',
                  'total': { $add: ["$fabricPrice","$stitchingPrice","$transaction_charge","$delivery_charge","$service_charge"]},
                  'record': "$record",
                  'status': '$status',
                  "contactNo": '$contactNo',
                  "reason": "$reason",
                  'modelId': "$modelId",
                  'modelName': "$model_name",
                  'model_image': '$model_image',
                  'quantity': '$quantity',
                  "payment_mode": "$payment_mode"
              }
          }
        ]

        let orders = await stichingCartModel.aggregate(query);
        if (!orders) {
            return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Timeslot updated Successfully.", data: orders };

    } catch (err) {
        throw new Error(err.message);
    }
};


exports.addMeasurment = async(data,user)=>{
    try{
        let today = Date.now();
        let saveData = {...data,...{created_at:today,modified_at:today}};
        let measurment = await recordMeasurementModel.create(saveData);
        measurment.save();
        if(!measurment){
             return { status: -1, message: "Something went wrong, Please try later" };
        }

        let stiching = await stichingCartModel.findOneAndUpdate({_id:mongoose.Types.ObjectId(data.stichingId)},{$set:{recordMeasurment:measurment._id,isMeasurement:true}});
        if(!stiching){
            return { status: -1, message: "Something went wrong, Please try later"  };
        }

        let color = await fabricColorModel.findById(stiching.color).lean();
        if(!color){
            return { status: -1, message: "Something went wrong, Please try later"  };
        }
        let fabricPrice = 0;

        if(color.is_meter){
            fabricPrice = color.meter_price * measurment.fabricSize;
        }else{
            fabricPrice = (color.wars_price * (measurment.fabricSize*1.2)).toFixed(2);
        }
        stiching.fabricPrice = fabricPrice;
        let saveStichingPrice = await stiching.save();
        if(!saveStichingPrice){
           return { status: -1, message: "Something went wrong, Please try later"  };
        }

        return { status: 1, message: "Record added Successfully."};

    }catch(err){
        throw new Error(err.message);
    }
};
// exports.trackSubAdmins =async (req,res) =>{

//   let {_id}=req;
//    if(_id){
//     let result = await trackStatus.findByIdAndUpdate(
//       { "_id": _id },
//       { logout: new Date().getTime() },
//       { new: true }
//       );

//       if (!result) {
//       throw ({ message: msg.fieldNotMatch });
//       }

//       return{
//         response: result,
//           message:  msg.success,
//       } 
//    }else{
//         let track= new trackStatus(req);
//         let result = await track.save();
//         if (!result) {
//         throw ({ message: msg.fieldNotMatch });}
//         return{
//         response: result,
//         message:  msg.success,
//         }
//    }

//   }

// exports.getTrackingListById= async( req) =>{
//   let {id}=req;
//   console.log(id)
//   if(id){
//    let result = await trackStatus.find(
//      { "user_id": mongoose.Types.ObjectId(id) });

//      if (!result) {
//      throw ({ message: msg.fieldNotMatch });
//      }

//      return{
//        response: result,
//          message:  msg.success,
//      } 
//   }
// }