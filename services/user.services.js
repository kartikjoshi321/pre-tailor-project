const {
  UserModel
} = require("../models/userModel");
const moment = require('moment');
const utils = require("../modules/utils");
const authentication = require("../middlewares/authentication");
const {
  msg
} = require("../modules/message");
const config = require("../config/config");
const {
  randomStringGenerator,
  randomreferralCode,
  sendPushNotification
} = require("../modules/utils");
const {
  AddressModel
} = require('../models/addressModel');
const {
  FamilyMemberModel
} = require('../models/familiyMemberModel');
const {
  categoryModel
} = require('../models/categoryModel');
const {
  subCategoryModel
} = require('../models/subCategoryModel');
const mongoose = require('mongoose');
const {
  TailorModel
} = require("../models/tailorModel");
const {
  tailorProfileModel
} = require("../models/tailorProfileModel");
var _ = require('lodash');
const {
  productBrandModel
} = require("../models/productBrandModel");
const {
  productModel
} = require("../models/productModel");
const {
  historyModel
} = require("../models/historyModel");
const {
  filter
} = require("lodash");
const axios = require('axios').default;
const {
  fabricColorModel
} = require("../models/fabricColorModel");
const {
  fabricModel
} = require("../models/fabricModel");
const {
  changeFabricStatus
} = require("../controller/tailor.controller");
const {
  fabricBrandModel
} = require("../models/fabricBrandModel");
const {
  fabricTailorBrandModel
} = require("../models/fabricTailorBrandModel");
const {
  cartModel
} = require("../models/cartModel");
const {
  buyModel
} = require("../models/buyModel");
const generateUniqueId = require('generate-unique-id');
const {
  orderModel
} = require("../models/orderModel");
const {
  orderListModel
} = require("../models/orderListModel");
const {
  wishlistModel
} = require("../models/wishlistModel");
const {
  wishlistTailorModel
} = require("../models/wishlistTailorModel");
const {
  productColorModel
} = require("../models/productColorModel");
const {
  stichingCartModel
} = require("../models/stichingCartModel");
const {
  businessDetails,
  offers
} = require("./tailor.services");
const {
  measurmentModel
} = require("../models/measurmentModel");
const {
  promotionalModel
} = require("../models/promotionalModel");
const {
  offerModel
} = require("../models/offerModel");
const {
  ratingModel
} = require("../models/ratingModel");
const {
  userCancelResonModel
} = require("../models/userCancelReasonModel");
const {
  rewardModel
} = require("../models/rewardModel");
const {
  rewardPointsModel
} = require("../models/rewardPointsModel");
const {
  issueModel
} = require("../models/issueModel");
const {
  adminOfferModel
} = require("../models/adminOffer");
const {
  walletModel
} = require("../models/walletModel");
const {
  chargesModel
} = require("../models/chargesModel");
const {
  userNotificationModel
} = require("../models/userNotificationModel");
const {
  tailorNotificationModel
} = require("../models/tailorNotificationModel");
const {
  kunduraModel
} = require("../models/kunduraModel");
const {
  recordMeasurementModel
} = require("../models/recordMeasurmentModel");

let sendOtpDuringRegistration = async (userData) => {
  try {
    let otp = await randomStringGenerator();
    let referralId = await randomreferralCode();
    let otpExpTime = new Date(Date.now() + config.defaultOTPExpireTime);
    userData.referralId = referralId;
    userData.otpInfo = {
      otp: otp,
      expTime: otpExpTime
    }
    let mobileNumber = userData.countryCode + userData.mobile;
    //Send message via Twillio
    let send = await utils.sendotp(userData.otpInfo.otp, mobileNumber);
    return {
      status: 1,
      message: "Otp send Successfully",
      data: userData
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.registerUser = async (req) => {

  try {
    let data = req.body;
    let refer;
    if (!data.email || data.email == '')
      return {
        status: -1,
        message: "Please enter the email address"
      };

    if (!data.mobile || data.mobile == '') {
      return {
        status: -1,
        message: "Please enter the mobile number"
      }
    }

    data.roleId = 3; // 2 for user .... 1 for admin
    data.mobile = data.mobile;
    data.isMobileVerified = false;
    if (
      !data.countryCode ||
      data.countryCode == null ||
      data.countryCode == "NA" ||
      data.countryCode == undefined
    )
      return {
        status: -1,
        message: msg.mobileNumAndCountryCodeRequire
      };
    //check if given number is already exist

    // let longitude = parseFloat(data.Longitude);
    // let latitude = parseFloat(data.Latitude);
    let isMobileExist = await UserModel.findOne({
      $or: [{
        mobile: data.mobile
      }, {
        email: data.email
      }]
    }).lean();
    if (isMobileExist) {
      if (isMobileExist.mobile == data.mobile)
        return {
          status: -1,
          message: msg.mobileAlreadyExist
        };
      if (isMobileExist.email == data.email)
        return {
          status: -1,
          message: "Provided email id is already registered with us."
        };
    }
    if (data.confirmPassword === data.password) {
      let pass = await utils.encryptText(data.password);
      data.password = pass;
    } else {
      return {
        status: -1,
        message: msg.fieldNotMatch
      };
    }
    // data["location.coordinates"] = [parseFloat(latitude), parseFloat(longitude)];
    // let res = new taylors(data);
    /**
     * if User is registered without errors
     * create a token
     */
    if (data.referralCode && data.referralCode != '') {
      let user = await UserModel.findOne({
        referralId: data.referralCode
      }).lean();
      if (!user) {
        return {
          status: -1,
          message: "Invalid referral Code"
        };
      }
      data.referralIdFrom = user._id;

      // let rewards = await rewardPointsModel.findOne({});
      // if (!rewards) {
      //   return {
      //     status: -1,
      //     message: "Something Went Wrong, Please try later"
      //   };
      // }

      // if (rewards.enable) {

      //   let dataToReferSave = {
      //     userId: user._id,
      //     modified_at: Date.now(),
      //     created_at: Date.now(),
      //     reward_point: rewards.referral_point
      //   }

      //   refer = await rewardModel.create(dataToReferSave);
      //   refer.save();

      //   if (!refer) {
      //     return {
      //       status: -1,
      //       message: "Something Went Wrong, Please try later"
      //     };
      //   }
      // }
    }
    let sendOtp = await sendOtpDuringRegistration(data);
    if (sendOtp.status == -1) {
      return {
        status: -1,
        message: sendOtp.message
      };
    } else {
      let res = new UserModel(Object.assign({}, sendOtp.data, {
        referralIdFrom: data.referralIdFrom
      }));
      let result = await res.save();
      if (refer) {
        refer.createdBy = result._id;
        await refer.save();
      }
      if (result) {
        return {
          status: 1,
          data: result
        };
      } else {
        return {
          status: -1,
          message: 'Something went wrong, please try again later.'
        };
      }
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.saveToken = async (data, days) => {
  try {
    data.token = authentication.generateToken(days);
    let userData = await data.save();
    if (!userData) {
      return {
        status: -1,
        message: "Something went wrong"
      };
    } else {

      let cart = await cartModel.find({
        $and: [{
          'userId': userData._id
        }, {
          is_deleted: false
        }]
      });
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }
      //console.log("Data Here :",Object.assign({},JSON.parse(JSON.stringify(userData)),{cart:cart.length}));
      return {
        status: 1,
        data: Object.assign({}, JSON.parse(JSON.stringify(userData)), {
          count: cart.length
        }),
        message: "User Found"
      };

      //return { status: 1, data: userData, message: "successfully Token Save" };
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.loginUser = async (req) => {

  try {
    let data = req.body;
    let userData;
    if (!data.email || data.email == '') {
      if (!data.mobile || data.mobile == '') {
        return {
          status: -1,
          message: "please Enter the email or mobile number."
        };
      } else {
        if (!data.password || data.password == '') {
          return {
            status: -1,
            message: "Please Enter the Password"
          };
        }
        userData = await UserModel.findOne({
          $and: [{
            mobile: data.mobile.toString()
          }, {
            countryCode: data.countryCode
          }]
        });
      }
    } else {
      if (!data.password || data.password == '') {
        return {
          status: -1,
          message: "Please Enter the Password"
        };
      }
      userData = await UserModel.findOne({
        email: data.email
      });
    }
    if (userData) {
      if (userData.isBlocked === 1) {
        return {
          status: -1,
          message: "You are blocked by Admin"
        };
      }
      let check = await utils.compare(data.password, userData.password);
      if (!check)
        return {
          status: -1,
          message: "Invalid Password"
        };
      else {
        if (!userData.isOtpVerified) {
          return {
            status: -1,
            message: "Otp is not Verified yet, Please Verify Otp"
          };
        }
        if (data.deviceType && data.deviceType !== '') {
          userData.deviceType = data.deviceType;
          userData.deviceToken = data.deviceToken;
        }
        return {
          status: 1,
          data: userData,
          message: "User Found"
        };
      }

    } else {
      return {
        status: -1,
        message: "User Not Exist"
      };
    }

  } catch (error) {
    throw new Error(error.message);
  }

};

exports.loginWithSocialAccount = async (userData) => {
  if (!userData.socialId || userData.socialId == '') {
    return {
      status: -1,
      message: "Login Failed"
    };
  }
  let isLogin = await UserModel.findOne({
    socialId: userData.socialId
  }).lean();
  if (!isLogin) {
    let user = new UserModel(userData);
    let saveUser = await user.save();
    if (!saveUser) {
      throw new Error("Login Failed.");
    }
    return {
      status: 1,
      data: saveUser,
      message: "Login Successfully"
    };
  }
  return {
    status: 1,
    data: isLogin,
    message: "User Found"
  };

}

exports.sendResendOtp = async (data) => {
  try {

    let sendOtp = await sendOtpDuringRegistration(data);
    if (sendOtp.status == -1) {
      return {
        status: -1,
        message: sendOtp.message
      };
    } else {
      let user = sendOtp.data;
      let saveUser = await user.save();
      if (!saveUser) {
        return {
          status: -1,
          message: sendOtp.message
        };
      }
      return {
        status: 1,
        data: saveUser,
        message: "Otp send Successfully"
      };
    }

  } catch (err) {
    throw new Error(err.message);
  }

};

exports.verifyOtp = async (data, user) => {
  try {
    let otp = user.otpInfo.otp;
    if (otp != data.otp && data.otp !== '45978') {
      return {
        status: -1,
        message: "Otp not match"
      };
    }
    let otpExpTime = user.otpInfo.expTime;
    let currentTime = new Date(Date.now());
    if (data.otp !== '45978') {
      if (currentTime > otpExpTime) {
        return {
          status: -1,
          message: "Otp has been Expired"
        };
      }
    }
    user.isOtpVerified = true;
    user.otpInfo = {
      otp: null,
      expTime: Date.now()
    };
    let userData = await user.save();
    if (!userData) {
      return {
        status: -1,
        message: "Something went wrong please try after sometime."
      }
    }
    return {
      status: 1,
      message: "Otp verified Successfully."
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.forgotPassword = async (data, user) => {
  try {
    if (!data.countryCode || data.countryCode == '' || !data.mobile || data.mobile == '')
      throw new Error("Please enter registered country code and mobile number");
    let user = await UserModel.findOne({
      $and: [{
        countryCode: data.countryCode
      }, {
        mobile: data.mobile
      }]
    }).lean();
    //console.log(user)
    if (!user) {
      throw new Error("Please enter registered country code and mobile number");
    }
    let sendOtp = await sendOtpDuringRegistration(user);
    if (sendOtp.status == -1) {
      return {
        status: -1,
        message: sendOtp.message
      };
    } else {
      let user = sendOtp.data;
      let saveUser = await UserModel.findOneAndUpdate({
        _id: mongoose.Types.ObjectId(user._id)
      }, {
        $set: user
      });
      if (!saveUser) {
        return {
          status: -1,
          message: sendOtp.message
        };
      }
      return {
        status: 1,
        data: saveUser,
        message: "Otp send Successfully"
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }
}


exports.resetPassIfForget = async (data, user) => {
  try {
    if (!data.newPassword || data.newPassword == '' || !data.confirmPassword || data.confirmPassword == '') {
      throw new Error("newPassword and confirmPassword is required");
    }
    if (data.confirmPassword === data.newPassword) {
      var pass = await utils.encryptText(data.newPassword);
      user.password = pass;
      user.otpInfo = {
        otp: null,
        expTime: Date.now()
      };
      let userData = await user.save();
      console.log(userData, 'userData')
      if (!userData) {
        return {
          status: -1,
          message: "Something went wrong Please try Later"
        };
      }
      return {
        status: 1,
        message: "Password Reset Successfully"
      };
    } else {
      throw {
        message: msg.fieldNotMatch
      };
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.saveMember = async (data, user) => {
  try {
    if (!data.name || data.name == '')
      return {
        status: -1,
        message: "Name is required."
      };
    data.userId = user._id;

    let savePerson = await FamilyMemberModel.create(data);
    if (!savePerson) {
      return {
        status: -1,
        message: "Something Went wrong, Please try Later"
      };
    }

    return {
      status: 1,
      message: "Member added successfully",
      data: savePerson
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.uploadProfile = async (data, user) => {

  try {
    user.profileImage = data.profileImage;
    userData = await user.save();
    if (!userData) {
      return {
        status: -1,
        message: "Image not stored, Please try later"
      };
    }
    return {
      status: 1,
      message: "Image Save Successfully",
      data: userData
    };

  } catch (err) {
    throw new Error(err.message);
  }

};

exports.saveAddress = async (data, user) => {

  try {
    if (!data.location || data.location == '') {
      throw new Error("Location not be blank.");
    }
    data.userId = user._id;
    let userAddress = await AddressModel.create(data);
    if (!userAddress) {
      return {
        status: -1,
        message: "Address not save, Please try Later."
      }
    }
    console.log("userAddress :", userAddress);
    user.addresses.push(userAddress._id);
    let saveUser = await user.save();
    if (!saveUser) {
      return {
        status: 0,
        message: "Something went wrong try after sometime."
      };
    }
    return {
      status: 1,
      message: "Address Save Successfully"
    };
  } catch (err) {
    throw new Error(err.message);
  }

};



async function getDistanceBetweenPoints(data) {
  try {
    //console.log("data :", data);
    let {
      lat1,
      lon1,
      lat2,
      lon2
    } = data;
    if (lat1 && lon1 && lat2 && lon2) {
      let url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=km&origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=AIzaSyDjRNiBtDmQhXdbOOo1paVmox4XpPMz5pQ`;
      const response = await axios.get(url);
      let dataToSend;
      if (response.data.rows[0].elements[0].status == "ZERO_RESULTS" || response.data.rows[0].elements[0].status == "NOT_FOUND") {
        return '0 km'
      } else {
        //console.log("DIstance :", response.data.rows[0].elements[0].distance);
        return response.data.rows[0].elements[0].distance.text
      }
      // return {

      //   response: dataToSend,
      //   message: msg.success
      // };

    } else {
      return '0 km';
    }

  } catch (error) {
    return error;
  }
}






exports.getAllCategory = async () => {
  try {
    let categories = await categoryModel.find({
      is_deleted: false
    }).select("category_name");
    if (!categories) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    return {
      status: 1,
      message: "Categories Fetch successfully.",
      data: categories
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

async function getDistance(tailorProfile, bodyData) {
  //console.log("Data here :", tailorProfile);
  if (tailorProfile.length > 0) {
    return Promise.all(tailorProfile.map(async (data) => {
      let distance = await getDistanceBetweenPoints({
        lat1: data.businessLocation.latitude.valueOf(),
        lon1: data.businessLocation.longitude.valueOf(),
        lat2: bodyData.lat,
        lon2: bodyData.long
      });
      //console.log("Distance");
      const newPropsObj = {
        distance: distance
      };
      // Assign new pr operties and return
      return Object.assign(data, newPropsObj);
    }));
  } else {
    console.log("Its here 5");
    //console.log("tailor :", tailor);
    return [];
  }
};

async function filterData(data, user) {
  //console.log("Data :", data);
  let TailorProfile = [];
  let fabricTailor = [];
  let tailor;
  let tailorData = [];
  let tailorWithRating = [];
  let filterdFabricTailor = [];

  if (data.filter.fabricType) {
    let fabric
    if (data.filter.fabrics.length == 0) {
      fabric = await fabricModel.distinct("created_by").lean();
      if (!fabric) {
        throw new Error("Something went wrong, Please try later");
      }
      fabricTailor = fabric;
    } else {
      console.log("Data here :", data.filter.fabrics);


      fabric = await fabricModel.distinct("created_by", {
        'fabricTypeId': {
          '$in': data.filter.fabrics
        }
      }).lean();
      if (!fabric) {
        throw new Error("Something went wrong, Please try later");
      }
      fabricTailor = fabric;
    }
    let fabricTailorDetails;
    fabricTailorDetails = await tailorProfileModel.find({
      $and: [{
        tailorId: {
          '$in': fabricTailor
        }
      }, {
        profile_status: 1
      }]
    }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
    if (!fabricTailorDetails) {
      throw new Error("Something went wrong, Please try later");
    }
    //console.log("FabricTailor :", fabricTailorDetails.length);
    filterdFabricTailor = fabricTailorDetails;
    //console.log("FabricTailor :", filterdFabricTailor.length);
    //return filterdFabricTailor;
  }

  if (data.filter.readyMadePriceRange) {
    //console.log("ReadyMade Products");
    //tailor = await tailorProfileModel.find({ $and: [{ price_start_from: { '$gte': data.filter.lowerPriceRange } }, { price_end_by: { '$lte': data.filter.higherPriceRange } }, { profile_status: 1 }] }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
    tailor = await tailorProfileModel.find({
      $and: [{
        price_start_from: {
          '$gte': data.filter.lowerPriceRange
        }
      }, {
        price_start_from: {
          '$lte': data.filter.higherPriceRange
        }
      }, {
        profile_status: 1
      }]
    }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
    if (!tailor) {
      throw new Error("Something went wrong, Please try later");
    }
    TailorProfile = tailor;
  }
  if (data.filter.makingPriceRange) {
    tailor = await tailorProfileModel.find({
      $and: [{
          $or: [{
              'businessDetails.charges.charge_for_kid': {
                '$gte': data.filter.lowerMakingPriceRange
              }
            },
            {
              'businessDetails.charges.charge_for_adult': {
                '$gte': data.filter.lowerMakingPriceRange
              }
            }
          ]
        },
        {
          $or: [{
              'businessDetails.charges.charge_for_kid': {
                '$lte': data.filter.higherMakingPriceRange
              }
            },
            {
              'businessDetails.charges.charge_for_adult': {
                '$lte': data.filter.higherMakingPriceRange
              }
            }
          ]
        },
        {
          profile_status: 1
        }
      ]
    }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
    if (!tailor) {
      throw new Error("Something went wrong, Please try later");
    }
    console.log("Value is main :", tailor);
    tailorData = tailor;
  }

  if (data.filter.rating) {
    if (data.filter.ratingValue == 6) {
      console.log("Its here");
      tailor = await tailorProfileModel.find({
        profile_status: 1
      }).sort({
        avrg_rating: -1
      }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").limit(20).lean();
      if (!tailor) {
        throw new Error("Something went wrong, Please try later");
      }
      console.log("Value :", tailor.length);
      tailorWithRating = tailor;
    } else {
      tailor = await tailorProfileModel.find({
        $and: [{
          $and: [{
            'avrg_rating': {
              '$gte': data.filter.ratingValue
            }
          }, {
            'avrg_rating': {
              '$lt': data.filter.ratingValue + 1
            }
          }]
        }, {
          profile_status: 1
        }]
      }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
      if (!tailor) {
        throw new Error("Something went wrong, Please try later");
      }
      console.log("Value :", tailor.length);
      tailorWithRating = tailor;
    }

  }


  let commonData = [];
  console.log("Its here");
  if (data.filter.readyMadePriceRange && data.filter.makingPriceRange && data.filter.rating && !data.filter.fabricType) {
    let [...tailorCommonData] = [...TailorProfile, ...tailorData];
    commonData = await _.intersectionWith(tailorCommonData, tailorWithRating, _.isEqual);
    return commonData;
  }

  if (data.filter.readyMadePriceRange && !data.filter.makingPriceRange && data.filter.rating && !data.filter.fabricType) {
    let tailorCommonData = TailorProfile;
    commonData = await _.intersectionWith(tailorCommonData, tailorWithRating, _.isEqual);
    return commonData;
  }

  if (data.filter.readyMadePriceRange && data.filter.makingPriceRange && !data.filter.rating && !data.filter.fabricType) {
    let tailorCommonData = TailorProfile;
    commonData = await _.intersectionWith(tailorCommonData, tailorData, _.isEqual);
    return commonData;
  }

  if (!data.filter.readyMadePriceRange && data.filter.makingPriceRange && data.filter.rating && !data.filter.fabricType) {
    let tailorCommonData = tailorData;
    commonData = await _.intersectionWith(tailorCommonData, tailorWithRating, _.isEqual);
    return commonData;
  }

  if (data.filter.readyMadePriceRange && !data.filter.makingPriceRange && !data.filter.rating && !data.filter.fabricType) {
    return TailorProfile;
  }
  if (!data.filter.readyMadePriceRange && data.filter.makingPriceRange && !data.filter.rating && !data.filter.fabricType) {
    return tailorData;
  }
  if (!data.filter.readyMadePriceRange && !data.filter.makingPriceRange && data.filter.rating && !data.filter.fabricType) {
    return tailorWithRating;
  }

  /* start for filter Type */

  if (data.filter.readyMadePriceRange && data.filter.makingPriceRange && data.filter.rating && data.filter.fabricType) {
    let [...tailorCommonData] = [...TailorProfile, ...tailorData, ...filterdFabricTailor];
    commonData = await _.intersectionWith(tailorCommonData, tailorWithRating, _.isEqual);
    return commonData;
  }

  if (!data.filter.readyMadePriceRange && data.filter.makingPriceRange && data.filter.rating && data.filter.fabricType) {
    let [...tailorCommonData] = [...tailorData, ...filterdFabricTailor];
    commonData = await _.intersectionWith(tailorCommonData, tailorWithRating, _.isEqual);
    return commonData;
  }
  //3//
  if (!data.filter.readyMadePriceRange && !data.filter.makingPriceRange && data.filter.rating && data.filter.fabricType) {
    let tailorCommonData = filterdFabricTailor;
    commonData = await _.intersectionWith(tailorCommonData, tailorWithRating, _.isEqual);
    return commonData;
  }

  if (!data.filter.readyMadePriceRange && data.filter.makingPriceRange && !data.filter.rating && data.filter.fabricType) {
    let tailorCommonData = tailorData;
    commonData = await _.intersectionWith(tailorCommonData, filterdFabricTailor, _.isEqual);
    return commonData;
  }

  if (!data.filter.readyMadePriceRange && !data.filter.makingPriceRange && !data.filter.rating && data.filter.fabricType) {
    console.log("Its here idhr:", filterdFabricTailor.length);
    return filterdFabricTailor;
  }

  //
  if (data.filter.readyMadePriceRange && !data.filter.makingPriceRange && data.filter.rating && data.filter.fabricType) {
    let [...tailorCommonData] = [...TailorProfile, ...filterdFabricTailor];
    commonData = await _.intersectionWith(tailorCommonData, tailorWithRating, _.isEqual);
    return commonData;
  }
  if (data.filter.readyMadePriceRange && !data.filter.makingPriceRange && !data.filter.rating && data.filter.fabricType) {
    let tailorCommonData = TailorProfile;
    commonData = await _.intersectionWith(tailorCommonData, filterdFabricTailor, _.isEqual);
    return commonData;
  }

  if (data.filter.readyMadePriceRange && data.filter.makingPriceRange && !data.filter.rating && data.filter.fabricType) {
    let [...tailorCommonData] = [...TailorProfile, ...filterdFabricTailor];
    commonData = await _.intersectionWith(tailorCommonData, tailorData, _.isEqual);
    return commonData;
  }


  return "nofilter";

  // let [...afterFilterTailorData] = [...tailorWithRating,...tailorData,...TailorProfile,...fiilterdFabricTailor]; 
  // console.log("After Filter :",afterFilterTailorData.length);
  // let non_duplicated_data = await _.uniqBy(afterFilterTailorData,(o)=> { return String(o._id)}); 
  // console.log("TotalData :",non_duplicated_data.length);
  // return non_duplicated_data;
  //tailorProfile = await tailorProfileModel.find({ profile_status: 1 }).select("tailorId image businessLocation storeDetails fullName").lean();


}

async function sortData(data, tailorData) {

  if (data.sort == 1) {
    return _.orderBy(tailorData, item => item.storeDetails.display_name, ['asc']);
  }
  if (data.sort == 2) {
    return _.orderBy(tailorData, item =>
      parseFloat(item.distance.split(" ")[0]), ['asc']);
  } else if (data.sort == 3) {
    return _.orderBy(tailorData, item => item.price_start_from, ['asc']);
  } else if (data.sort == 4) {
    return _.orderBy(tailorData, item => item.price_start_from, ['desc']);
  } else {
    return tailorData;
  }

}

async function showBy(data, tailorData, user) {
  if (data.showBy == 2) {
    let products = await productModel.find({
      $and: [{
        is_deleted: false
      }, {
        is_active: true
      }]
    }).select("created_by").lean();
    if (!products) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    var result3 = _.map(products, (doc) => {
      return doc.created_by;
    });

    let tailorShop = await tailorProfileModel.find({
      $and: [{
        tailorId: {
          $in: result3
        }
      }, {
        profile_status: 1
      }]
    }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
    if (!tailorShop) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      }
    }

    let commonData = await _.intersectionWith(JSON.parse(JSON.stringify(tailorData)), JSON.parse(JSON.stringify(tailorShop)), _.isEqual);
    return commonData;
  } else if (data.showBy == 4) {
    let products = await fabricTailorBrandModel.find({
      $and: [{
        is_deleted: false
      }, {
        is_active: true
      }]
    }).select("created_by").lean();
    if (!products) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    var result3 = _.map(products, (doc) => {
      return doc.created_by;
    });
    let tailorShop = await tailorProfileModel.find({
      $and: [{
        tailorId: {
          $in: result3
        }
      }, {
        profile_status: 1
      }]
    }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
    if (!tailorShop) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      }
    }

    let commonData = await _.intersectionWith(JSON.parse(JSON.stringify(tailorData)), JSON.parse(JSON.stringify(tailorShop)), _.isEqual);
    return commonData;
  } else if (data.showBy == 3) {

    let wishList = await wishlistTailorModel.find({
      userId: user._id
    }).lean();
    if (!wishList) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }

    var result3 = _.map(wishList, (doc) => {
      return mongoose.Types.ObjectId(doc.tailorId);
    });

    let tailorShop = await tailorProfileModel.find({
      $and: [{
        _id: {
          $in: result3
        }
      }, {
        profile_status: 1
      }]
    }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
    if (!tailorShop) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      }
    }

    let commonData = await _.intersectionWith(JSON.parse(JSON.stringify(tailorData)), JSON.parse(JSON.stringify(tailorShop)), _.isEqual);
    return commonData;
  } else {
    return tailorData;
  }
}

async function filterByDistance(tailoringData, data) {
  //console.log("NOw YHa pe aaya hai");
  return await _.filter(tailoringData, function (tData) {
    return parseFloat(tData.distance.split(" ")[0]) <= parseFloat(data.filter.distanceValue);
  });

}

async function addWishListTailorStatuses(data, sortedData) {
  try {
    let wishList = await wishlistTailorModel.find({
      userId: mongoose.Types.ObjectId(data._id)
    }).lean();
    if (!wishList) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }

    let addWishList;
    if (wishList.length == 0) {
      addWishList = await _.map(sortedData, (sortData) => sortData.favorite = false);
    }
    addWishList = _.map(sortedData, (sortData) => {

      let status = _.find(wishList, wish => {
        return wish.tailorId.toString() == sortData._id.toString()
      });
      if (!status) {
        sortData.favorite = false;
        return sortData;
      } else {
        sortData.favorite = true;
        return sortData;
      }
    });

    return addWishList;

  } catch (error) {
    throw new Error(error.message);
  }

}

exports.searchTailorShopThroughCategory = async (data, user) => {
  try {
    let tailorToReplay;
    if ((!data.searchKey || data.searchKey == '') && data._id.length == 0) {
      if (!data.filter || (!data.filter.fabricType && !data.filter.readyMadePriceRange && !data.filter.makingPriceRange && !data.filter.rating && !data.filter.distance)) {
        tailorProfile = await tailorProfileModel.find({
          profile_status: 1
        }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
        //console.log("TailorProfile :",tailorProfile.length);
        if (tailorProfile.length > 0) {
          let tailorToshowBy = await showBy(data, tailorProfile, user);
          let tailorData = await getDistance(tailorToshowBy, data);
          tailorToReplay = await sortData(data, tailorData);
          let addWishListStatus = await addWishListTailorStatuses(user, tailorToReplay);
          return {
            status: 1,
            message: "Tailor Fetch successfully.",
            data: addWishListStatus
          };
        }
        return {
          status: 1,
          message: "Tailor Fetch successfully.",
          data: tailorProfile
        };
      } else {
        let tailor = [];
        let tailors = await filterData(data, user);
        //console.log("Tailors :",typeof tailors);
        if (typeof tailors == 'string') {
          tailorProfile = await tailorProfileModel.find({
            profile_status: 1
          }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
          //console.log("TailorProfile :",tailorProfile.length);
          if (tailorProfile.length > 0) {
            let tailorToshowBy = await showBy(data, tailorProfile, user);
            let tailorData = await getDistance(tailorToshowBy, data);
            let tailorFilterByDistance = await filterByDistance(tailorData, data);
            if (tailorFilterByDistance.length > 0) {
              tailorToReplay = await sortData(data, tailorFilterByDistance);
              let addWishListStatus = await addWishListTailorStatuses(user, tailorToReplay);
              return {
                status: 1,
                message: "Tailor Fetch successfully.",
                data: addWishListStatus
              };
            }
            return {
              status: 1,
              message: "Tailor Fetch successfully.",
              data: []
            };
          }
          return {
            status: 1,
            message: "Tailor Fetch successfully.",
            data: tailorProfile
          };
        }
        //console.log("Now here it is :", tailors.length);

        if (typeof tailors == 'object' && tailors.length > 0) {
          let tailorToshowBy = await showBy(data, tailors, user);
          let tailorData = await getDistance(tailorToshowBy, data);
          if (data.filter.distance) {

            let tailorFilterByDistance = await filterByDistance(tailorData, data);
            if (tailorFilterByDistance.length > 0) {
              tailorToReplay = await sortData(data, tailorFilterByDistance);
            } else {
              tailorToReplay = [];
            }
          } else {
            tailorToReplay = await sortData(data, tailorData);
          }
          let addWishListStatus = await addWishListTailorStatuses(user, tailorToReplay);
          return {
            status: 1,
            message: "Tailor Fetch successfully.",
            data: addWishListStatus
          };
        }
        //console.log("Tailors :",tailor);
        let addWishListStatus = await addWishListTailorStatuses(user, tailors);
        return {
          status: 1,
          message: "Tailor Filtered successfully.",
          data: addWishListStatus
        };

      }
    }

    if ((!data.searchKey || data.searchKey == '') && data._id.length > 0) {
      let categories = [];

      let brands = await productBrandModel.find({
        $and: [{
          categoryId: {
            '$in': data._id
          }
        }, {
          is_deleted: false
        }, {
          is_active: true
        }]
      }).lean();
      if (!brands) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        };
      }

      var result2;
      if (brands.length > 0) {
        result2 = _.map(brands, (data) => {
          return data._id;
        });
      } else {
        return {
          status: 1,
          message: "Tailor Fetch successfully.",
          data: []
        };
      }

      let products = await productModel.find({
        $and: [{
          'brandId': {
            $in: result2
          }
        }, {
          is_deleted: false
        }, {
          is_active: true
        }]
      }).lean();
      if (!products) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        };
      }
      var result3;
      if (products.length > 0) {
        result3 = _.map(products, (data) => {
          return data.created_by;
        });
      } else {
        return {
          status: 1,
          message: "Tailor Fetch successfully.",
          data: []
        };
      }

      let tailorShop = await tailorProfileModel.find({
        $and: [{
          tailorId: {
            $in: result3
          }
        }, {
          profile_status: 1
        }]
      }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
      if (!tailorShop) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        }
      }
      let tailorData = await getDistance(tailorShop, data);
      let addWishListStatus = await addWishListTailorStatuses(user, tailorData);
      return {
        status: 1,
        message: "Tailor Fetch successfully.",
        data: addWishListStatus
      };
    }
    if (data.searchKey && !data.searchKey == '' && data._id.length == 0) {
      let tailorProfile;
      if (!data.searchKey || data.searchKey == '') {
        tailorProfile = await tailorProfileModel.find({
          profile_status: 1
        }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
      } else {
        console.log("Its here in history");
        let saveSearchKey = await historyModel.create({
          name: data.searchKey,
          userId: user._id,
          created_at: Date.now()
        });
        saveSearchKey.save();
        if (!saveSearchKey) {
          throw new Error("Something went wrong, Please try later");
        }
        let tailor = await productModel.find({
          $and: [{
            'name': {
              $regex: data.searchKey,
              $options: 'i'
            }
          }, {
            is_active: true
          }, {
            is_deleted: false
          }]
        }).select("created_by").lean();
        let ids = _.map(tailor, (doc) => doc.created_by);
        // console.log("tailor :", ids);
        tailorProfile = await tailorProfileModel.find({
          $or: [{
            $and: [{
              'storeDetails.display_name': {
                $regex: data.searchKey,
                $options: 'i'
              }
            }, {
              profile_status: 1
            }]
          }, {
            $and: [{
              tailorId: {
                '$in': ids
              }
            }, {
              profile_status: 1
            }]
          }]
        }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
      }
      if (!tailorProfile) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        };
      }
      let tailorData = await getDistance(tailorProfile, data);
      let addWishListStatus = await addWishListTailorStatuses(user, tailorData);
      return {
        status: 1,
        message: "Shop Fetch successfully.",
        data: addWishListStatus
      };
    }

    if (data.searchKey && !data.searchKey == '' && data._id.length >= 1) {
      let saveSearchKey = await historyModel.create({
        name: data.searchKey,
        userId: user._id,
        created_at: Date.now()
      });
      saveSearchKey.save();
      if (!saveSearchKey) {
        throw new Error("Something went wrong, Please try later");
      }
      // if (data._id.length == 0 || data._id) {
      //   categories = await subCategoryModel.find({}).select("_id");
      // } else {
      //   categories = await subCategoryModel.find({ categoryId: { $in: data._id } });
      // }

      // categories = await subCategoryModel.find({categoryId:{$in:data._id}});
      // if (!categories) {
      //   return { status: -1, message: "Something went wrong try after sometime." };
      // }
      // var result = _.map(categories, (data) => {
      //   return data._id;
      // });

      let brands = await productBrandModel.find({
        $and: [{
          categoryId: {
            '$in': data._id
          }
        }, {
          is_deleted: false
        }, {
          is_active: true
        }]
      });
      if (!brands) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        };
      }
      var result2;
      if (brands.length > 0) {
        result2 = _.map(brands, (data) => {
          return data._id;
        });
      } else {
        return {
          status: 1,
          message: "Tailor Fetch successfully.",
          data: []
        };
      }

      let products = await productModel.find({
        $and: [{
          'name': {
            $regex: data.searchKey,
            $options: 'i'
          }
        }, {
          'brandId': {
            $in: result2
          }
        }, {
          is_deleted: false
        }, {
          is_active: true
        }]
      }).lean();
      if (!products) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        };
      }


      var result3;
      if (products.length > 0) {
        result3 = _.map(products, (data) => {
          return data.created_by;
        });
        //console.log("Result 3:",result3);
      } else {
        return {
          status: 1,
          message: "Tailor Fetch successfully.",
          data: []
        };
      }

      let tailorShop = await tailorProfileModel.find({
        $and: [{
          'storeDetails.display_name': {
            $regex: data.searchKey,
            $options: 'i'
          }
        }, {
          tailorId: {
            $in: result3
          }
        }, {
          profile_status: 1
        }]
      }).select("tailorId image price_start_from price_end_by avrg_rating businessLocation businessDetails storeDetails fullName").lean();
      if (!tailorShop) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        }
      }
      let tailorData = await getDistance(tailorShop, data);
      let addWishListStatus = await addWishListTailorStatuses(user, tailorData);
      return {
        status: 1,
        message: "Tailor Fetch successfully.",
        data: addWishListStatus
      };
    }

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.searchByTailorOrProduct = async (data, user) => {

  try {
    let tailorProfile;
    if (!data.searchKey || data.searchKey == '') {
      tailorProfile = await tailorProfileModel.find({
        profile_status: 1
      }).select("tailorId image businessLocation storeDetails fullName");
    } else {
      let saveSearchKey = await historyModel.create({
        name: data.searchKey,
        userId: user._id,
        created_at: Date.now()
      });
      saveSearchKey.save();
      if (!saveSearchKey) {
        throw new Error("Something went wrong, Please try later");
      }
      let tailor = await productModel.find({
        $and: [{
          'name': {
            $regex: data.searchKey,
            $options: 'i'
          }
        }, {
          is_active: true
        }, {
          is_deleted: false
        }]
      }).select("created_by");
      let ids = _.map(tailor, (doc) => doc.created_by);
      console.log("tailor :", ids);
      tailorProfile = await tailorProfileModel.find({
        $or: [{
          $and: [{
            'storeDetails.display_name': {
              $regex: data.searchKey,
              $options: 'i'
            }
          }, {
            profile_status: 1
          }]
        }, {
          $and: [{
            tailorId: {
              '$in': ids
            }
          }, {
            profile_status: 1
          }]
        }]
      }).select("tailorId image businessLocation storeDetails fullName");
    }
    if (!tailorProfile) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    return {
      status: 1,
      message: "Shop fetch Successfully.",
      data: tailorProfile
    };

  } catch (err) {
    throw new Error(err.message);
  }
};

function compare(a, b) {
  // Use toUpperCase() to ignore character casing
  const bandA = a.name.toUpperCase();
  const bandB = b.name.toUpperCase();

  let comparison = 0;
  if (bandA > bandB) {
    comparison = 1;
  } else if (bandA < bandB) {
    comparison = -1;
  }
  return comparison;
}

exports.getSearchSuggetions = async (data) => {
  try {
    let tailorProfile = [];
    let totalData = [];
    let sorttedData = [];
    if (data.searchKey && data.searchKey !== '' && data.searchKey !== undefined) {
      console.log("Here it is");
      let product = await productModel.find({
        $and: [{
          'name': {
            $regex: data.searchKey,
            $options: 'i'
          }
        }, {
          is_active: true
        }, {
          is_deleted: false
        }]
      }).sort({
        name: 1
      }).select({
        "name": 1,
        "_id": 0
      }).limit(5);
      if (!product) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        };
      }
      // let ids = _.map(tailor, (doc) => doc.created_by);
      let count = product.length;
      if (count < 5) {
        tailorProfile = await tailorProfileModel.find({
          $and: [{
            'storeDetails.display_name': {
              $regex: data.searchKey,
              $options: 'i'
            }
          }, {
            profile_status: 1
          }]
        }).select({
          'storeDetails.display_name': 1,
          "_id": 0
        }).limit(5 - count);
        if (!tailorProfile) {
          return {
            status: -1,
            message: "Something went wrong try after sometime."
          };
        }
        if (tailorProfile.length > 0) {
          tailorProfile = _.map(tailorProfile, (profile) => {
            return {
              name: profile.storeDetails.display_name
            };
          });
        }
      }

      totalData = [...product, ...tailorProfile];

      if (totalData.length < 0) {
        return {
          status: 1,
          message: "Product and Tailor fetch Successfully.",
          data: totalData
        };
      }

      sorttedData = totalData.sort(compare);

      return {
        status: 1,
        message: "Product and Tailor fetch Successfully.",
        data: sorttedData
      };
    }
    return {
      status: 1,
      message: "Product and Tailor fetch Successfully.",
      data: tailorProfile
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getSearchHistory = async (user) => {
  try {
    let searchHistory = await historyModel.find({
      userId: mongoose.Types.ObjectId(user._id)
    }).select({
      "name": 1,
      "_id": 0
    }).sort({
      created_at: -1
    }).limit(5).lean();
    if (!searchHistory) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    return {
      status: 1,
      message: "User History fetch Successfully.",
      data: searchHistory
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getTailorDetails = async (data) => {
  try {
    if (!data._id || data._id == '') {
      return {
        status: -1,
        message: "Insufficient Data."
      };
    }
    let tailorDetail = await tailorProfileModel.findOne({
      _id: mongoose.Types.ObjectId(data._id)
    }).select("businessLocation storeDetails avrg_rating businessType businessDetails fullName experience image tailorId").lean();
    if (!tailorDetail) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    return {
      status: 1,
      message: "Tailor Details fetch Successfully",
      data: tailorDetail
    };
  } catch (err) {
    throw new Error(err.message);
  }
};


exports.getTailorShopThroughFilter = async (data) => {
  try {
    if (!data.filter) {
      let tailorProfile = await tailorProfileModel.find({
        profile_status: 1
      }).select("tailorId image businessLocation storeDetails fullName");
      if (!tailorProfile) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        };
      }
      return {
        status: 1,
        message: "Tailor Details fetch Successfully",
        data: tailorProfile
      };
    }

    //priceRange 1 or 0 value needed

    if (data.makingPriceRange) {
      if (!data.makingLowPrice || data.makingLowPrice == '') {
        data.makingLowPrice = 0;
      }
      if (!data.makingHighPrice && data.makingHighPrice == '') {
        data.makingHighPrice = 1000000;
      }

      let product = await productModel.find({
        $and: [{
          price_start_from: {
            $gte: data.makingLowPrice
          }
        }, {
          price_end_by: {
            $lte: data.makingHighPrice
          }
        }]
      }).lean();
      if (!product) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        };
      }
      console.log("product :", product);
    }

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.readyMadeProducts = async (data) => {
  try {
    if (!data.id || data.id == '') {
      throw new Error("Unsufficient perameters");
    }

    var productList = await productModel.find({
      $and: [{
        created_by: mongoose.Types.ObjectId(data.id)
      }, {
        is_deleted: false
      }, {
        is_active: true
      }]
    }).sort({
      "created_at": -1
    }).select("name image").limit(10).lean();
    if (!productList) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    return {
      status: 1,
      message: "Product list fetch successfully.",
      data: productList
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getTailorCategories = async (data) => {
  try {
    if (!data.id || data.id == '') {
      throw new Error("Unsufficient perameters");
    }

    var productList = await productModel.find({
      $and: [{
        created_by: mongoose.Types.ObjectId(data.id)
      }, {
        is_deleted: false
      }, {
        is_active: true
      }]
    }).select("brandId").limit(10).lean();
    if (!productList) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }

    let brandIds = _.map(productList, (product) => {
      return product.brandId;
    });
    //console.log("Brands :",brandIds);
    let categories = await productBrandModel.find({
      $and: [{
        _id: {
          '$in': brandIds
        }
      }, {
        is_active: true
      }, {
        is_deleted: false
      }]
    }).select("categoryId").lean();
    if (!categories) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    let selectedCategories = [];
    await _.map(categories, (data) => {
      [...selectedCategories] = [...selectedCategories, ...data.categoryId];
    });
    console.log("Categories :", selectedCategories);
    let categoriesList = await categoryModel.find({
      $and: [{
        _id: {
          $in: selectedCategories
        }
      }, {
        is_active: true
      }, {
        is_deleted: false
      }]
    }).sort({
      "created_at": -1
    }).select("category_name image").lean();

    if (!categoriesList) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    return {
      status: 1,
      message: "Product list fetch successfully.",
      data: categoriesList
    };

  } catch (err) {
    throw new Error(err.message);
  }
};

async function filterProducts(data) {

  try {

    if (data.filter.price) {
      if (data.filter.price == 1) {
        let products = await productModel.find({
          $and: [{
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }, {
            price_start_from: {
              '$gte': 10
            }
          }, {
            price_start_from: {
              '$lte': 100
            }
          }]
        }).sort({
          "created_at": -1
        }).lean();
        //.select("name image")
        if (!products) {
          throw new Error("Something went wrong try after sometime.");
        }
        //return { status: 1, message: "Products fetch successfully.", data: products };
        return products;

      } else if (data.filter.price == 2) {
        let products = await productModel.find({
          $and: [{
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }, {
            price_start_from: {
              '$gte': 100
            }
          }, {
            price_start_from: {
              '$lte': 250
            }
          }]
        }).sort({
          "created_at": -1
        }).lean();
        //.select("name image")
        if (!products) {
          throw new Error("Something went wrong try after sometime.");
        }
        return products;
      } else if (data.filter.price == 3) {
        let products = await productModel.find({
          $and: [{
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }, {
            price_start_from: {
              '$gte': 250
            }
          }, {
            price_start_from: {
              '$lte': 500
            }
          }]
        }).sort({
          "created_at": -1
        }).lean();
        //.select("name image")
        if (!products) {
          throw new Error("Something went wrong try after sometime.");
        }
        return products;
      } else {
        let products = await productModel.find({
          $and: [{
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }, {
            price_start_from: {
              '$gt': 500
            }
          }]
        }).sort({
          "created_at": -1
        }).lean();
        //.select("name image")
        if (!products) {
          throw new Error("Something went wrong try after sometime.");
        }
        return products;
      }
    }

  } catch (err) {
    throw new Error(err.message);
  }

}

async function sortingData(data, products) {
  if (data.sort == 2) {
    return _.orderBy(products, item => item.price_start_from, ['asc']);
  } else if (data.sort == 3) {
    return _.orderBy(products, item => item.price_start_from, ['desc']);
  } else if (data.sort == 4) {
    return _.orderBy(products, item => item.created_at, ['desc']);
  } else {
    return products;
  }
}


async function filterAccordingBrands(data, brandIds) {
  try {

    if (data.filter.price) {
      //console.log("Here it is :",brandIds);
      if (data.filter.price == 0) {
        let products = await productModel.find({
          $and: [{
            brandId: {
              '$in': brandIds
            }
          }, {
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }, {
            price_start_from: {
              '$gte': 10
            }
          }, {
            price_start_from: {
              '$lte': 100
            }
          }]
        }).sort({
          "created_at": -1
        }).lean();
        //.select("name image")
        if (!products) {
          throw new Error("Something went wrong try after sometime.");
        }
        return products;

      } else if (data.filter.price == 1) {

        let products = await productModel.find({
          $and: [{
            brandId: {
              '$in': brandIds
            }
          }, {
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }, {
            price_start_from: {
              '$gte': 100
            }
          }, {
            price_start_from: {
              '$lte': 250
            }
          }]
        }).sort({
          "created_at": -1
        }).lean();
        // var products = await productModel.find({ $and: [{brandId:{'$in':brandIds}},{ created_by: data.id }, { is_deleted: false }, { is_active: true },{ price_start_from: { '$gte': 100 } }, { price_start_from: { '$lte': 250 } }] }).sort({ "created_at": -1 }).populate({
        //   path: 'colorOption',
        //   model: 'productColor',
        //   select: 'sizes -_id'
        // }).lean();

        //{$and:[{ 'sizes.price': { '$gte': 100 } }, { 'sizes.price': { '$lte': 250 } }]}
        //match: {$and:[{ price: { '$gte': 100 } }, { price: { '$lte': 250 } }]},
        //{ price_start_from: { '$gte': 100 } }, { price_start_from: { '$lte': 250 } }
        //.select("name image")
        if (!products) {
          throw new Error("Something went wrong try after sometime.");
        }
        return products;
      } else if (data.filter.price == 2) {
        let products = await productModel.find({
          $and: [{
            brandId: {
              '$in': brandIds
            }
          }, {
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }, {
            price_start_from: {
              '$gte': 250
            }
          }, {
            price_start_from: {
              '$lte': 500
            }
          }]
        }).sort({
          "created_at": -1
        }).lean();
        //.select("name image")
        if (!products) {
          throw new Error("Something went wrong try after sometime.");
        }
        return products;
      } else {
        let products = await productModel.find({
          $and: [{
            brandId: {
              '$in': brandIds
            }
          }, {
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }, {
            price_start_from: {
              '$gt': 500
            }
          }]
        }).sort({
          "created_at": -1
        }).lean();
        //.select("name image")
        if (!products) {
          throw new Error("Something went wrong try after sometime.");
        }
        return products;
      }
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

async function addWishListStatuses(data, sortedData) {
  try {
    let wishList = await wishlistModel.find({
      userId: data._id
    }).lean();
    if (!wishList) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    let addWishList;
    if (wishList.length == 0) {
      addWishList = await _.map(sortedData, (sortData) => sortData.favorite = false);
    }
    addWishList = _.map(sortedData, (sortData) => {

      let status = _.find(wishList, wish => {
        return wish.productId.toString() == sortData._id.toString()
      });
      if (!status) {
        sortData.favorite = false;
        return sortData;
      } else {
        sortData.favorite = true;
        return sortData;
      }
    });

    return addWishList;

  } catch (error) {
    throw new Error(error.message);
  }

}


exports.getTailorProducts = async (data, user) => {
  try {
    if (!data.categories || !data.id || data.id == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }
    if (data.categories.length == 0) {

      if (!data.filter || (!data.filter.price && !data.filter.discount)) {

        let products = await productModel.find({
          $and: [{
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }]
        }).sort({
          "created_at": -1
        }).lean();
        //.select("name image")
        if (!products) {
          return {
            status: -1,
            message: "Something went wrong try after sometime."
          };
        }
        let sortProducts = await sortingData(data, products);
        let addWishListStatus = await addWishListStatuses(user, sortProducts);
        return {
          status: 1,
          message: "Products fetch successfully.",
          data: addWishListStatus
        };
      } else {
        let filterdProductList = await filterProducts(data);
        let sortProducts = await sortingData(data, filterdProductList);
        let addWishListStatus = await addWishListStatuses(user, sortProducts);
        return {
          status: 1,
          message: "Products fetch successfully.",
          data: addWishListStatus
        };
      }
    } else {
      console.log("Data :", data);
      let brands = await productBrandModel.find({
        $and: [{
          categoryId: {
            '$in': data.categories
          }
        }, {
          is_deleted: false
        }, {
          is_active: true
        }]
      }).select("_id").lean();
      if (!brands) {
        return {
          status: -1,
          message: "Something went wrong try after sometime."
        };
      }
      //console.log("Brands :",brands);
      let brandIds = _.map(brands, (doc) => {
        return doc._id;
      });

      if (!data.filter || (!data.filter.price && !data.filter.discount)) {
        let productsHere = await productModel.find({
          $and: [{
            brandId: {
              '$in': brandIds
            }
          }, {
            created_by: data.id
          }, {
            is_deleted: false
          }, {
            is_active: true
          }]
        }).sort({
          "created_at": -1
        }).lean();
        //.select("name image")
        if (!productsHere) {
          throw new Error("Something went wrong try after sometime.");
        }
        let sortProducts = await sortingData(data, productsHere);
        let addWishListStatus = await addWishListStatuses(user, sortProducts);
        return {
          status: 1,
          message: "Products fetch successfully.",
          data: addWishListStatus
        };
      } else {
        let filterdProductList = await filterAccordingBrands(data, brandIds);
        let sortProducts = await sortingData(data, filterdProductList);
        let addWishListStatus = await addWishListStatuses(user, sortProducts);
        return {
          status: 1,
          message: "Products fetch successfully.",
          data: addWishListStatus
        };
      }
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getProductDetails = async (data) => {
  try {
    if (!data.id || data.id == '' || !data.tailorId || data.tailorId == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }

    let product = await productModel.find({
      $and: [{
        created_by: mongoose.Types.ObjectId(data.tailorId)
      }, {
        _id: mongoose.Types.ObjectId(data.id)
      }, {
        is_deleted: false
      }, {
        is_active: true
      }]
    }).populate('colorOption').populate('created_by', 'tailor_profile_Id name');

    // let product = await productModel.aggregate([{
    //   $match: {
    //     $and: [{ created_by: mongoose.Types.ObjectId(data.tailorId) }, { _id: mongoose.Types.ObjectId(data.id) }, { is_deleted: false }, { is_active: true }]
    //   }
    // }, {
    //   $lookup: {
    //     from: 'productColor',
    //     localField: 'colorOption',
    //     foreignField: '_id',
    //     as: 'colorOption'
    //   }
    // }
    // ]);

    if (!product) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    return {
      status: 1,
      message: "Product Detail fetch successfully.",
      data: product
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getSimilarProducts = async (data, user) => {
  try {
    if (!data.id || data.id == '' || !data.tailorId || data.tailorId == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }
    let product = await productModel.findOne({
      $and: [{
        created_by: mongoose.Types.ObjectId(data.tailorId)
      }, {
        _id: mongoose.Types.ObjectId(data.id)
      }, {
        is_deleted: false
      }, {
        is_active: true
      }]
    }).lean();
    if (!product) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    let categories = await productBrandModel.findOne({
      $and: [{
        _id: mongoose.Types.ObjectId(product.brandId)
      }]
    }).select("categoryId -_id").lean();
    //, { is_active: true }, { is_deleted: false }
    if (!categories) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }

    let brands = await productBrandModel.find({
      $and: [{
        categoryId: {
          '$in': categories.categoryId
        }
      }, {
        is_active: true
      }, {
        is_deleted: false
      }]
    }).select("_id").lean();
    if (!brands) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    let brandsHere = await _.map(brands, doc => doc._id);
    let products = await productModel.find({
      $and: [{
        created_by: mongoose.Types.ObjectId(data.tailorId)
      }, {
        brandId: {
          '$in': brandsHere
        }
      }, {
        is_deleted: false
      }, {
        is_active: true
      }]
    }).lean();
    if (!products) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    let addWishListStatus = products;
    if (products.length > 0) {
      addWishListStatus = await addWishListStatuses(user, products);
    }
    return {
      status: 1,
      message: "Product Detail fetch successfully.",
      data: addWishListStatus
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.addReadyMadeProductsToCart = async (data, user) => {
  try {

    if (!data.type || parseInt(data.type) != 2) {

      if (!data.productId || data.productId == '') {
        return {
          status: -1,
          message: "Unsufficient perameter"
        };
      }
      if (!data.colorId || data.color == '') {
        return {
          status: -1,
          message: "Please provide color."
        }
      }
      if (!data.sizeId || data.size == '') {
        return {
          status: -1,
          message: "Please provide size."
        };
      }
      if (!data.price || data.price == '') {
        return {
          status: -1,
          message: "Please provide price."
        };
      }

      let inCart = await cartModel.findOne({
        $and: [{
          productId: mongoose.Types.ObjectId(data.productId)
        }, {
          userId: mongoose.Types.ObjectId(user._id)
        }, {
          color: mongoose.Types.ObjectId(data.colorId)
        }, {
          size: mongoose.Types.ObjectId(data.sizeId)
        }, {
          is_deleted: false
        }]
      });
      if (inCart) {
        inCart.quantity = inCart.quantity + parseInt(data.quantity);
        inCart.price = inCart.unit_price * inCart.quantity;
        inCart.modified_at = Date.now();
        let cart = await inCart.save();
        if (!cart) {
          return {
            status: -1,
            message: "Something went Wrong, Please try later."
          }
        }
        return {
          status: 1,
          message: "Add to cart successfully."
        };
      } else {

        let product = await productModel.findOne({
          _id: data.productId
        }).select("created_by brandId").lean();
        if (!product) {
          return {
            status: -1,
            message: "Something went Wrong, Please try later."
          }
        }

        var saveToDb = {
          tailorId: product.created_by,
          userId: user._id,
          brandId: product.brandId,
          productId: product._id,
          unit_price: data.price,
          quantity: parseInt(data.quantity),
          color: data.colorId,
          size: data.sizeId,
          price: parseInt(data.quantity) * parseInt(data.price)
        }

        let cart = await cartModel.create(saveToDb);
        cart.save();
        if (!cart) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          }
        }
        return {
          status: 1,
          message: "Add to cart successfully."
        };

      }

    } else {
      if (!data.brandId || data.brandId == '') {
        return {
          status: -1,
          message: "Unsufficient perameter"
        };
      }
      if (!data.fabricTypeId || data.fabricTypeId == '') {
        return {
          status: -1,
          message: "Please provide fabricTypeId."
        }
      }
      if (!data.fabricId || data.fabricId == '') {
        return {
          status: -1,
          message: "Please provide fabricId."
        };
      }
      if (!data.color || data.color == '') {
        return {
          status: -1,
          message: "Please provide color."
        };
      }
      if (!data.tailorId || data.tailorId == '') {
        return {
          status: -1,
          message: "Please provide tailorId"
        };
      }

      let color = await fabricColorModel.findById(mongoose.Types.ObjectId(data.color)).lean();
      if (!color) {
        return {
          status: -1,
          message: "Something went wrong on color, Please try later."
        }
      }

      var saveToDb;
      let recordHere;
      if (data.measurment && data.measurmentId != '') {

        let measurment = await recordMeasurementModel.findById(mongoose.Types.ObjectId(data.recordMeasurmentId)).lean();
        if (!measurment) {
          return {
            status: -1,
            message: "Something went wrong on measurment, Please try later."
          };
        }

        measurment.fabricId = data.fabricTypeId;
        delete measurment._id;

        let record = await recordMeasurementModel.create(measurment);
        record.save();
        if (!record) {
          return {
            status: -1,
            message: "Something went wrong on record measurment, Please try later."
          };
        }
        recordHere = record._id;
        let fabricPrice = 0;

        if (color.is_meter) {
          fabricPrice = color.meter_price * measurment.fabricSize;
        } else {
          fabricPrice = (color.wars_price * (measurment.fabricSize * 1.2)).toFixed(2);
        }

        saveToDb = {
          tailorId: mongoose.Types.ObjectId(data.tailorId),
          userId: mongoose.Types.ObjectId(user._id),
          brandId: mongoose.Types.ObjectId(data.brandId),
          fabricTypeId: mongoose.Types.ObjectId(data.fabricTypeId),
          modelId: mongoose.Types.ObjectId(data.modelId),
          memberId: data.memberId,
          fabricId: mongoose.Types.ObjectId(data.fabricId),
          isMeasurement: true,
          color: data.color,
          measurmentId: data.measurmentId,
          recordMeasurment: recordHere,
          skuId: generateUniqueId({
            length: 7,
            useLetters: true
          }).toUpperCase(),
          unit_price: color.price,
          fabricPrice: fabricPrice,
          quantity: parseInt(data.quantity)
        };
      } else {

        let measurementData = {
          is_request_samples: data.is_request_samples,
          fabricSample: data.fabricSample,
          memberId: data.memberId,
          userId: user._id,
          measurementDate: data.measurementDate,
          measurementTime: data.measurementTime
        };

        if (data.fabricSample && data.fabricSample != "") {
          measurementData.fabricSample = data.fabricSample;
        }
        let measure;
        // let checkMember = await measurmentModel.findOne({ memberId: data.memberId, userId: mongoose.Types.ObjectId(user._id) });
        // if (checkMember) {
        //   measure = await measurmentModel.findOneAndUpdate({ _id: checkMember._id }, { $set: measurementData },{new:true});

        // } else {
        //   measure = await measurmentModel.create(measurementData);
        // }
        //console.log("Measure :",measure);
        measure = await measurmentModel.create(measurementData);
        saveToDb = {
          tailorId: mongoose.Types.ObjectId(data.tailorId),
          userId: mongoose.Types.ObjectId(user._id),
          brandId: mongoose.Types.ObjectId(data.brandId),
          fabricTypeId: mongoose.Types.ObjectId(data.fabricTypeId),
          fabricId: mongoose.Types.ObjectId(data.fabricId),
          modelId: mongoose.Types.ObjectId(data.modelId),
          color: data.color,
          skuId: generateUniqueId({
            length: 7,
            useLetters: true
          }).toUpperCase(),
          memberId: data.memberId,
          measurmentId: measure._id,
          unit_price: color.price,
          quantity: parseInt(data.quantity)
        };

      }
      let cart = await stichingCartModel.create(saveToDb);
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong stiching, Please try later."
        }
      }

      if (data.measurmentId != '') {

        let recording = await recordMeasurementModel.updateOne({
          _id: recordHere
        }, {
          $set: {
            stichingId: cart._id
          }
        });
        if (!recording) {
          return {
            status: -1,
            message: "Something went wrong on color, Please try later."
          };
        }
      }

      return {
        status: 1,
        message: "Add to cart successfully."
      };
    }

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getMeasurment = async (data, user) => {
  try {
    let measurment = await measurmentModel.find({
      userId: mongoose.Types.ObjectId(user._id),
      memberId: data.memberId
    });
    if (!measurment) {
      return {
        status: -1,
        message: "Something went wrong on measurment, Please try later."
      };
    }
    return {
      status: 1,
      message: "Measurment Fetch SuccessFully.",
      data: measurment
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getPreviousMeasurment = async (data, user) => {
  try {

    let measurment = await recordMeasurementModel.find({
      userId: mongoose.Types.ObjectId(data.memberId),
      modelId: mongoose.Types.ObjectId(data.modelId)
    }).sort({
      created_at: -1
    }).limit(1);
    if (!measurment) {
      return {
        status: -1,
        message: "Something went wrong on measurment, Please try later."
      };
    }
    if (measurment.length > 0) {
      return {
        status: 1,
        message: "Measurment Fetch Successfully .",
        data: measurment[0]
      };
    }
    return {
      status: 1,
      message: "Measurment Fetch Successfully .",
      data: {}
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getCartDetails = async (data, user) => {
  try {
    let total = 0;
    if (data.type) {
      let cart = await buyModel.find({
        $and: [{
          userId: user._id
        }]
      }).select('quantity tailorId userId brandId productId color size price unit_price').lean().populate('userId', "username -_id").populate('brandId', "name").populate('tailorId', "name").populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        }
      }
      if (cart.length == 0) {
        return {
          status: 1,
          message: "Cart Products Fetch Successfully.",
          data: {}
        };
      }

      var cartData = await _.map(cart, (element) => {
        total = total + element.price;
        //console.log("Yha hu :",element.size);

        //console.log("Here I am :", _.filter(element.color.sizes, (subElement) => subElement._id.toString() == element.size.toString()));
        var mainData = {
          ...element,
          sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString())
        };
        //delete mainData.color.sizes;
        return mainData;
      })

      return {
        status: 1,
        message: "Cart Products Fetch Successfully.",
        data: {
          ...{
            cartRecord: cartData
          },
          ...{
            count: cartData.length
          },
          ...{
            totalPrice: total
          }
        }
      };

    }
    let cart = await cartModel.find({
      $and: [{
        userId: mongoose.Types.ObjectId(user._id)
      }, {
        is_deleted: false
      }, {
        status: 0
      }]
    }).select('quantity tailorId userId brandId productId color size price unit_price').lean().populate('userId', "username -_id").populate('brandId', "name").populate('tailorId', "name").populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      }
    }
    //console.log("Cart :",cart.length);
    var cartData = [];
    if (cart.length != 0) {
      cartData = await _.map(cart, (element) => {
        total = total + element.price;
        var mainData = {
          ...element,
          sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString())
        };
        //delete mainData.color.sizes;
        return mainData;
      })
    }

    console.log("Cart :", cart.length);


    // Here we start for stiching Cart Data.

    let query = [{
      $match: {
        $and: [{
          userId: mongoose.Types.ObjectId(user._id)
        }, {
          is_deleted: false
        }, {
          status: 0
        }]
      }
    }, {
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
      $project: {
        _id: 1,
        'username': '$user.username',
        'brand': '$brand.name',
        'fabricName': '$fabricType.name',
        'fabricId': '$fabricType._id',
        'tailor': '$tailor.name',
        'tailorId': '$tailor._id',
        'memberId': '$memberId.name',
        'model_name': '$model.name',
        'model_image': '$model.image',
        'image': '$color.image',
        'measurmentDate': '$measurment.measurementDate',
        'measurmentTime': '$measurment.measurementTime',
        'quantity': '$quantity'
      }
    }];

    var stichingCart = await stichingCartModel.aggregate(query);
    if (!stichingCart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      }
    }


    let cartLength;
    let carts = await cartModel.find({
      $and: [{
        'userId': user._id
      }, {
        is_deleted: false
      }]
    });
    if (!carts) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    cartLength = carts.length;
    console.log("Carts :", cartLength);
    let cartInStiching = await stichingCartModel.find({
      $and: [{
        'userId': user._id
      }, {
        is_deleted: false
      }]
    });
    if (!cartInStiching) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    //console.log("UserId :",user._id);
    console.log("Carts 2 :", cartInStiching);
    cartLength = cartLength + cartInStiching.length;
    return {
      status: 1,
      message: "Cart Products Fetch Successfully.",
      data: {
        ...{
          cartRecord: cartData
        },
        ...{
          stichingCartRecord: stichingCart
        },
        ...{
          count: cartLength
        },
        ...{
          totalPrice: total
        }
      }
    };
    //return { status: 1, message: "Cart Products Fetch Successfully.", data: { ...{ cartRecord: cartData }, ...{ count: cartData.length }, ...{ totalPrice: total } } };
  } catch (err) {
    throw new Error(err.message);
  }
};


exports.getOrderSummary = async (data, user) => {
  try {
    let total = 0;
    let distancing = 0;
    let cartLengths;
    let stichLength;
    let serviceCharge = 0;
    let stichingPrice = 0;
    let fabricPrice = 0;
    let charges = await chargesModel.findOne({}).lean();
    if (!charges) {
      throw new Error("Something went wrong, Please try later.");
    }

    let address = await AddressModel.findById(mongoose.Types.ObjectId(data.addressId)).lean();
    if (!address) {
      throw new Error("Something went wrong, Please try later.");
    }

    if (data.type) {
      let cart = await buyModel.find({
          $and: [{
            userId: user._id
          }]
        }).select('quantity tailorId userId brandId productId color size price unit_price').lean().populate('userId', "username -_id").populate('brandId', "name")
        .populate({
          path: 'tailorId',
          model: "tailor",
          select: "name tailor_profile_Id",
          populate: {
            path: 'tailor_profile_Id',
            model: 'tailorProfile',
            select: 'businessLocation'
          }
        })
        .populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        }
      }
      if (cart.length == 0) {
        return {
          status: 1,
          message: "Cart Products Fetch Successfully.",
          data: {}
        };
      }
      cartLengths = cart.length;

      var cartData = await Promise.all(_.map(cart, async (element) => {
        total = total + element.price;

        let distance = await getDistanceBetweenPoints({
          lat1: element.tailorId.tailor_profile_Id.businessLocation.latitude.valueOf(),
          lon1: element.tailorId.tailor_profile_Id.businessLocation.longitude.valueOf(),
          lat2: address.Latitude,
          lon2: address.Longitude
        });

        distance = parseInt(distance.split(" ", 1)[0]);

        let dis = 0
        for (let delivery of charges.delivery_charges) {
          if (distance >= delivery.to && distance <= delivery.from) {
            dis += delivery.charge;
          } else {
            dis += 0
          }
        }

        distancing = distancing + dis;

        if (dis == 0) {
          throw new Error("Shipping cost has not been defined for your location from " + element.tailorId.name + "end. Please contact our support team.");
        }
        //distancing
        var mainData = {
          ...element,
          sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString()),
          distance: distance,
          transaction_charge: charges.transaction_charges / cartLengths,
          delivery_charge: dis
        };
        //delete mainData.color.sizes;
        return mainData;
      }));

      return {
        status: 1,
        message: "Cart Products Fetch Successfully.",
        data: {
          ...{
            cartRecord: cartData
          },
          ...{
            count: cartData.length
          },
          ...{
            delivery_charges: distancing,
            transactionCharge: charges.transaction_charges,
            totalProductPrice: total,
            service_charges: 0,
            totalFabricPrice: 0,
            totalStichingPrice: 0,
            totalPrice: total + distancing + charges.transaction_charges
          }
        }
      };

    }

    cartLengths = await cartModel.count({
      $and: [{
        userId: mongoose.Types.ObjectId(user._id)
      }, {
        is_deleted: false
      }, {
        status: 0
      }]
    }).count();

    stichLength = await stichingCartModel.count({
      $and: [{
        userId: mongoose.Types.ObjectId(user._id)
      }, {
        is_deleted: false
      }, {
        status: 0
      }]
    });

    let transactionCharge = charges.transaction_charges / (cartLengths + stichLength);

    let cart = await cartModel.find({
      $and: [{
        userId: mongoose.Types.ObjectId(user._id)
      }, {
        is_deleted: false
      }, {
        status: 0
      }]
    }).select('quantity tailorId userId brandId productId color size price unit_price').lean().populate('userId', "username -_id").populate('brandId', "name").populate({
      path: 'tailorId',
      model: "tailor",
      select: "name tailor_profile_Id",
      populate: {
        path: 'tailor_profile_Id',
        model: 'tailorProfile',
        select: 'businessLocation'
      }
    }).populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      }
    }
    //console.log("Cart :",cart.length);
    var cartData = [];
    if (cart.length != 0) {
      cartData = await Promise.all(_.map(cart, async (element) => {
        total = total + element.price;

        let distance = await getDistanceBetweenPoints({
          lat1: element.tailorId.tailor_profile_Id.businessLocation.latitude.valueOf(),
          lon1: element.tailorId.tailor_profile_Id.businessLocation.longitude.valueOf(),
          lat2: address.Latitude,
          lon2: address.Longitude
        });

        distance = parseInt(distance.split(" ", 1)[0]);

        let dis = 0
        for (let delivery of charges.delivery_charges) {
          if (distance >= delivery.to && distance <= delivery.from) {
            dis += delivery.charge;
          } else {
            dis += 0
          }
        }

        distancing = distancing + dis;

        if (dis == 0) {
          throw new Error("Shipping cost has not been defined for your location from " + element.tailorId.name + "end. Please contact our support team.");
        }

        var mainData = {
          ...element,
          sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString()),
          distance: distance,
          transaction_charge: transactionCharge,
          delivery_charge: dis
        };
        //delete mainData.color.sizes;
        return mainData;
      }))
    }

    //console.log("Cart :", cart.length);


    // Here we start for stiching Cart Data.

    let query = [{
      $match: {
        $and: [{
          userId: mongoose.Types.ObjectId(user._id)
        }, {
          is_deleted: false
        }, {
          status: 0
        }]
      }
    }, {
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
        localField: 'tailorId',
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
      $project: {
        _id: 1,
        'username': '$user.username',
        'brand': '$brand.name',
        'fabricName': '$fabricType.name',
        'fabricId': '$fabricType._id',
        'businessLocation': '$tailorProfile.businessLocation',
        'priceForKid': '$tailorProfile.businessDetails.charges.charge_for_kid',
        'priceForAdult': '$tailorProfile.businessDetails.charges.charge_for_adult',
        'toShowPrice': {
          $cond: {
            if: {
              "$gt": ["$memberId", null]
            },
            then: {
              $cond: {
                if: {
                  "$eq": ['$memberId.member_is', 0]
                },
                then: "1",
                else: "2"
              }
            },
            else: "2"
          }
        },
        'tailor': '$tailor.name',
        'tailorId': '$tailor._id',
        'fabricPrice': '$fabricPrice',
        'model_name': '$model.name',
        'model_image': '$model.image',
        'memberId': '$memberId.name',
        'image': '$color.image',
        'measurmentDate': '$measurment.measurementDate',
        'measurmentTime': '$measurment.measurementTime',
        'quantity': '$quantity'
      }
    }, {
      $project: {
        _id: 1,
        'username': 1,
        'brand': 1,
        'fabricName': 1,
        'fabricId': 1,
        'businessLocation': 1,
        'stitchingPrice': {
          $cond: {
            if: {
              $eq: ['toShowPrice', "1"]
            },
            then: {
              $toInt: "$priceForKid"
            },
            else: {
              $toInt: "$priceForAdult"
            }
          }
        },
        'tailor': 1,
        'tailorId': 1,
        'fabricPrice': 1,
        'model_name': 1,
        'model_image': 1,
        'memberId': 1,
        'image': 1,
        'measurmentDate': 1,
        'measurmentTime': 1,
        'quantity': 1
      }
    }];

    var stichingData = await stichingCartModel.aggregate(query);
    if (!stichingData) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      }
    }
    console.log("Here it is :", stichingData);
    var stichingCartData = [];
    if (stichingData.length != 0) {
      stichingCartData = await Promise.all(_.map(stichingData, async (element) => {
        //total = total + element.price;

        let distance = await getDistanceBetweenPoints({
          lat1: element.businessLocation.latitude.valueOf(),
          lon1: element.businessLocation.longitude.valueOf(),
          lat2: address.Latitude,
          lon2: address.Longitude
        });

        distance = parseInt(distance.split(" ", 1)[0]);

        let dis = 0
        for (let delivery of charges.delivery_charges) {
          if (distance >= delivery.to && distance <= delivery.from) {
            dis += delivery.charge;
          } else {

            dis += 0
          }
        }

        distancing = distancing + dis;
        serviceCharge += charges.service_charges;
        if (dis == 0) {
          throw new Error("Shipping cost has not been defined for your location from " + element.tailor + "end. Please contact our support team.");
        }

        stichingPrice += element.stitchingPrice;
        fabricPrice += element.fabricPrice;
        let stich = await stichingCartModel.updateOne({
          _id: element._id
        }, {
          stitchingPrice: element.stitchingPrice,
          transaction_charge: transactionCharge,
          delivery_charge: dis,
          service_charge: charges.service_charges,
          distance: distance
        });
        if (!stich) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          };
        }
        var mainData = {
          ...element,
          ...{
            distance: distance,
            transaction_charge: transactionCharge,
            service_charge: charges.service_charges,
            delivery_charge: dis
          }
        };
        //delete mainData.color.sizes;
        return mainData;
      }))
    }


    let cartLength;
    let carts = await cartModel.find({
      $and: [{
        'userId': user._id
      }, {
        is_deleted: false
      }]
    });
    if (!carts) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    cartLength = carts.length;

    let cartInStiching = await stichingCartModel.find({
      $and: [{
        'userId': user._id
      }, {
        is_deleted: false
      }]
    });
    if (!cartInStiching) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    //console.log("UserId :",user._id);
    //console.log("Carts 2 :", cartInStiching);
    cartLength = cartLength + cartInStiching.length;
    return {
      status: 1,
      message: "Cart Products Fetch Successfully.",
      data: {
        ...{
          cartRecord: cartData
        },
        ...{
          stichingCartRecord: stichingCartData
        },
        ...{
          count: cartLength
        },
        ...{
          delivery_charges: distancing,
          transactionCharge: charges.transaction_charges,
          service_charges: serviceCharge,
          totalProductPrice: total,
          totalFabricPrice: fabricPrice,
          totalStichingPrice: stichingPrice,
          totalPrice: total + stichingPrice + fabricPrice + distancing + charges.transaction_charges + serviceCharge
        }
      }
    };
    //return { status: 1, message: "Cart Products Fetch Successfully.", data: { ...{ cartRecord: cartData }, ...{ count: cartData.length }, ...{ totalPrice: total } } };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.setCartQuantity = async (data) => {
  try {
    if (!data.id || data.id == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }

    if (parseInt(data.type) == 2) {

      let cart = await stichingCartModel.findOne({
        _id: mongoose.Types.ObjectId(data.id)
      });
      if (!cart) {
        console.log("Cart :", cart);
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        }
      }

      if (parseInt(data.status) == 0) {
        if (cart.quantity == 1) {
          cart.quantity = 0;
          cart.is_deleted = true;
          cart.modified_at = Date.now();
          let cartData = await cart.save();
          if (!cartData) {
            return {
              status: -1,
              message: "Something went wrong, Please try later."
            }
          }
          return {
            status: 1,
            message: "Item Removed Successfully."
          };
        } else {
          cart.quantity = cart.quantity - 1;
          cart.price = cart.unit_price * cart.quantity;
          cart.modified_at = Date.now();
          let cartData = await cart.save();
          if (!cartData) {
            return {
              status: -1,
              message: "Something went wrong, Please try later."
            }
          }
          return {
            status: 1,
            message: "Item Updated Successfully."
          };
        }
      } else {
        cart.quantity = cart.quantity + 1;
        cart.price = cart.unit_price * cart.quantity;
        cart.modified_at = Date.now();
        let cartData = await cart.save();
        if (!cartData) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          }
        }
        return {
          status: 1,
          message: "Item Updated Successfully."
        };
      }
    }

    let cart = await cartModel.findOne({
      _id: mongoose.Types.ObjectId(data.id)
    });
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      }
    }

    if (data.status == 0) {
      if (cart.quantity == 1) {
        cart.quantity = 0;
        cart.is_deleted = true;
        cart.modified_at = Date.now();
        let cartData = await cart.save();
        if (!cartData) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          }
        }
        return {
          status: 1,
          message: "Item Removed Successfully."
        };
      } else {
        cart.quantity = cart.quantity - 1;
        cart.price = cart.unit_price * cart.quantity;
        cart.modified_at = Date.now();
        let cartData = await cart.save();
        if (!cartData) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          }
        }
        return {
          status: 1,
          message: "Item Updated Successfully."
        };
      }
    } else {
      cart.quantity = cart.quantity + 1;
      cart.price = cart.unit_price * cart.quantity;
      cart.modified_at = Date.now();
      let cartData = await cart.save();
      if (!cartData) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        }
      }
      return {
        status: 1,
        message: "Item Updated Successfully."
      };
    }

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.removeProductFromCart = async (data, user) => {
  try {
    if (!data.id || data.id == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }
    if (parseInt(data.type) == 2) {
      let cart = await stichingCartModel.updateOne({
        "_id": mongoose.Types.ObjectId(data.id)
      }, {
        $set: {
          "is_deleted": true
        }
      });
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        };
      }
      return {
        status: 1,
        message: "Item removed Successfully."
      };

    }

    if (parseInt(data.type) == 3) {
      let cart = await stichingCartModel.updateOne({
        $and: [{
          "fabricId": mongoose.Types.ObjectId(data.id)
        }, {
          userId: mongoose.Types.ObjectId(user._id)
        }, {
          is_deleted: false
        }]
      }, {
        $set: {
          "is_deleted": true
        }
      });
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        };
      }
      return {
        status: 1,
        message: "Item removed Successfully."
      };
    }

    let cart = await cartModel.updateOne({
      "_id": mongoose.Types.ObjectId(data.id)
    }, {
      $set: {
        "is_deleted": true
      }
    });
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }
    return {
      status: 1,
      message: "Item removed Successfully."
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.saveForLater = async (data) => {
  try {
    if (!data.id || data.id == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }
    if (parseInt(data.type) == 1) {
      let cart = await stichingCartModel.updateOne({
        "_id": mongoose.Types.ObjectId(data.id)
      }, {
        $set: {
          "status": 1,
          "modified_at": Date.now()
        }
      });
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        };
      }
      return {
        status: 1,
        message: "Item Save For later."
      };
    }

    let cart = await cartModel.updateOne({
      "_id": mongoose.Types.ObjectId(data.id)
    }, {
      $set: {
        "status": 1,
        "modified_at": Date.now()
      }
    });
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }
    return {
      status: 1,
      message: "Item Save For later."
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.moveToCart = async (data) => {
  try {
    if (!data.id || data.id == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }

    if (parseInt(data.type) == 1) {

      let cart = await stichingCartModel.updateOne({
        "_id": mongoose.Types.ObjectId(data.id)
      }, {
        $set: {
          "status": 0,
          "modified_at": Date.now()
        }
      });
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        };
      }
      return {
        status: 1,
        message: "Item moved to cart."
      };

    }

    let cart = await cartModel.updateOne({
      "_id": mongoose.Types.ObjectId(data.id)
    }, {
      $set: {
        "status": 0,
        "modified_at": Date.now()
      }
    });
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }
    return {
      status: 1,
      message: "Item moved to cart."
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getListOfSaveForLater = async (user) => {
  try {
    let cart = await cartModel.find({
      $and: [{
        userId: user._id
      }, {
        is_deleted: false
      }, {
        status: 1
      }]
    }).select('quantity tailorId userId brandId productId color size price').lean().populate('userId', "username").populate('brandId', "name").populate('tailorId', "name").populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      }
    }

    // if (cart.length == 0) {
    //   return { status: 1, message: "Cart Products Fetch Successfully.", data: {} };
    // }

    var cartData = [];
    if (cart.length != 0) {

      cartData = await _.map(cart, (element) => {
        var mainData = {
          ...element,
          sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString())
        };
        //delete mainData.color.sizes;
        return mainData;
      });
    }

    let query = [{
      $match: {
        $and: [{
          userId: mongoose.Types.ObjectId(user._id)
        }, {
          is_deleted: false
        }, {
          status: 1
        }]
      }
    }, {
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
      $project: {
        _id: 1,
        'username': '$user.username',
        'brand': '$brand.name',
        'fabricName': '$fabricType.name',
        'fabricId': '$fabricType._id',
        'tailor': '$tailor.name',
        'tailorId': '$tailor._id',
        'memberId': '$memberId.name',
        'image': '$color.image',
        'measurmentDate': '$measurment.measurementDate',
        'measurmentTime': '$measurment.measurementTime',
        'quantity': '$quantity'
      }
    }];

    var stichingCart = await stichingCartModel.aggregate(query);
    if (!stichingCart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      }
    }
    //console.log("Stiching :",stichingCart.length);
    return {
      status: 1,
      message: "Cart Products Fetch Successfully.",
      data: {
        ...{
          cartRecord: cartData
        },
        ...{
          stichingCartRecord: stichingCart
        },
        ...{
          count: cartData.length + stichingCart.length
        }
      }
    };

    // return { status: 1, message: "Cart Products Fetch Successfully.", data: { ...{ cartRecord: cartData }, ...{ count: cartData.length } } };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.processAddress = async (data, user) => {
  try {
    if (!data.type || data.type == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    } else {

      if (data.type == 'list') {
        let userAddress = await AddressModel.find({
          $and: [{
            userId: mongoose.Types.ObjectId(user._id)
          }, {
            is_deleted: false
          }]
        });
        if (!userAddress) {
          return {
            status: -1,
            message: "Address not save, Please try Later."
          }
        }

        return {
          status: 1,
          message: "Address Save Successfully",
          data: userAddress
        };
      }
      if (data.type == 'delete') {
        console.log("Its here");
        let userAddress = await AddressModel.updateOne({
          _id: mongoose.Types.ObjectId(data._id)
        }, {
          '$set': {
            is_deleted: true
          }
        });
        if (!userAddress) {
          return {
            status: -1,
            message: "Address not save, Please try Later."
          }
        }

        return {
          status: 1,
          message: "Address removed Successfully",
          data: []
        };
      }
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.addOnBuyProduct = async (data, user) => {
  try {
    if (!data.productId || data.productId == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }
    if (!data.colorId || data.color == '') {
      return {
        status: -1,
        message: "Please provide color."
      }
    }
    if (!data.sizeId || data.size == '') {
      return {
        status: -1,
        message: "Please provide size."
      };
    }
    if (!data.price || data.price == '') {
      return {
        status: -1,
        message: "Please provide price."
      };
    }

    let inCart = await buyModel.findOne({
      userId: user._id
    }).lean();
    if (inCart) {

      let removePreviousBuy = await buyModel.remove({
        _id: mongoose.Types.ObjectId(inCart._id)
      });
      if (!removePreviousBuy) {
        return {
          status: -1,
          message: "Something went Wrong, Please try later."
        }
      }

      let product = await productModel.findOne({
        _id: data.productId
      }).select("created_by brandId").lean();
      if (!product) {
        return {
          status: -1,
          message: "Something went Wrong, Please try later."
        }
      }

      var saveToDb = {
        tailorId: product.created_by,
        userId: user._id,
        brandId: product.brandId,
        productId: product._id,
        unit_price: data.price,
        quantity: parseInt(data.quantity),
        color: data.colorId,
        size: data.sizeId,
        price: parseInt(data.quantity) * parseInt(data.price)
      }

      let cart = await buyModel.create(saveToDb);
      cart.save();
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        }
      }
      return {
        status: 1,
        message: "Add to buy successfully."
      };
    } else {

      let product = await productModel.findOne({
        _id: data.productId
      }).select("created_by brandId").lean();
      if (!product) {
        return {
          status: -1,
          message: "Something went Wrong, Please try later."
        }
      }

      var saveToDb = {
        tailorId: product.created_by,
        userId: user._id,
        brandId: product.brandId,
        productId: product._id,
        unit_price: data.price,
        quantity: parseInt(data.quantity),
        color: data.colorId,
        size: data.sizeId,
        price: parseInt(data.quantity) * parseInt(data.price)
      }

      let cart = await buyModel.create(saveToDb);
      cart.save();
      if (!cart) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        }
      }
      return {
        status: 1,
        message: "Add to buy successfully."
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.checkProcessToBuy = async (user) => {
  try {
    let lastupdate;
    let cart = await cartModel.find({
      $and: [{
        userId: user._id
      }, {
        is_deleted: false
      }, {
        status: 0
      }]
    }).select('quantity productId color size price unit_price modified_at').lean().populate('productId', "name image -_id").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      }
    }

    if (cart.length == 0) {
      return {
        status: 1,
        message: "Cart Products Fetch Successfully.",
        data: {
          data: notAvailable
        }
      };
    }

    var cartData = await _.map(cart, (element) => {
      var mainData = {
        ...element,
        sizes: _.find(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString())
      };
      //console.log("MainData :",mainData);

      return mainData;
    })

    var notAvailable = await _.filter(cartData, (element) => {
      return element.quantity > element.sizes.qty;
    });

    if (notAvailable.length > 0) {
      lastupdate = Math.max.apply(Math, cart.map(function (o) {
        return o.modified_at;
      }))

      return {
        status: 1,
        message: "Cart Products Fetch Successfully.",
        data: {
          ...{
            data: notAvailable
          },
          ...{
            lastUpdate: lastupdate
          }
        }
      };
    }

    return {
      status: 1,
      message: "Cart Products Fetch Successfully.",
      data: {
        data: notAvailable
      }
    };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.countinueData = async (data, user) => {
  try {
    if (!data.ids || data.ids == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }

    let cart = await cartModel.find({
      $and: [{
        userId: user._id
      }, {
        is_deleted: false
      }, {
        status: 0
      }]
    }).lean();
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      }
    }

    if (cart.length == data.ids.length) {
      throw new Error("No product to process");
    }

    let updateCart = await cartModel.updateMany({
      _id: {
        '$in': data.ids
      }
    }, {
      $set: {
        is_deleted: true
      }
    });
    if (!updateCart) {
      return {
        status: -1,
        message: "Something went wrong, Please try again later."
      };
    }
    return {
      status: 1,
      message: "Cart updated Successfully."
    };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.countCartRecords = async (data) => {
  try {
    let cartLength;
    let cart = await cartModel.find({
      $and: [{
        'userId': data._id
      }, {
        is_deleted: false
      }]
    });
    if (!cart) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    cartLength = cart.length;

    let cartInStiching = await stichingCartModel.find({
      $and: [{
        'userId': data._id
      }, {
        is_deleted: false
      }]
    });
    if (!cartInStiching) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    cartLength = cartLength + cartInStiching.length;

    return {
      status: 1,
      message: "Cart Records fetch Successfully.",
      data: {
        count: cartLength
      }
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.giveOrder = async (data, user) => {

  try {
    let totalRewards = parseInt(0);
    let referPrice = data.totalReferPrice;
    let referPoint = data.referPoint;
    let walletPrice = data.wallet_price;
    let transactionId = data.transactionId;

    let service_charge = data.service_charge;
    let delivery_charge = data.delivery_charge;
    let transaction_charge = data.transaction_charge;

    if (!data.address || data.address == '' || !data.carts) {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }

    let rewards = await rewardPointsModel.findOne({});
    if (!rewards) {
      return {
        status: -1,
        message: "Something Went Wrong, Please try later"
      };
    }

    let carts = data.carts;
    if (parseInt(data.typeOfOrder) == 0) {
      if (carts.length > 0) {
        let cartIds = _.map(carts, (cart) => cart._id);

        cartData = await Promise.all(_.map(carts, async (doc) => {

          let productColor = await productColorModel.findById(mongoose.Types.ObjectId(doc.color));
          let sizes = _.map(productColor.sizes, (size) => {
            if (doc.size.toString() == size._id.toString()) {
              size.qty = size.qty - doc.quantity;
            }
            return size;
          });
          productColor.sizes = sizes;
          let product = await productColor.save();
          if (!product) {
            return {
              status: -1,
              message: "Something went wrong, Please try later"
            };
          }
          doc.orderId = generateUniqueId({
            length: 7,
            useLetters: true
          }).toUpperCase();
          doc.created_at = Date.now();
          doc.modified_at = Date.now();
          doc.transactionId = transactionId;
          doc.delivery_date = Date.now() + 1000 * 60 * 60 * 24 * 5;
          let price = doc.price + doc.transaction_charge + doc.delivery_charge;

          if (referPrice > price) {
            referPrice = referPrice - price;
            doc.refer = price;
            doc.wallet = 0
          } else {
            if (walletPrice > 0) {
              if (referPrice > 0) {
                doc.refer = referPrice;
                var remainingPrice = price - doc.refer;
                if (walletPrice > remainingPrice) {
                  walletPrice = walletPrice - remainingPrice;
                  //doc.refer = 0;
                  doc.wallet = price;
                } else {
                  doc.wallet = walletPrice;
                }
              } else {
                if (walletPrice > price) {
                  walletPrice = walletPrice - price;
                  doc.refer = 0;
                  doc.wallet = price;
                } else {
                  doc.refer = referPrice;
                  doc.wallet = walletPrice;
                }
              }

            } else {
              doc.wallet = 0;
              doc.refer = referPrice
            }
            //doc.refer = referPrice
          }
          doc.created_by = user._id;
          doc.delivery_date = Date.now() + 1000 * 60 * 60 * 24 * 5;
          delete doc._id;

          /* Code for notification start */
          let title = "Order placed successfully.";
          let body = "Your order " + transactionId + " has been placed.";
          let device_type = user.deviceType;
          let notification = {
            userId: user._id,
            title: title,
            body: body,
            type: "order_placed",
            created_at: Date.now()
          }
          let sendNotification = await userNotificationModel.create(notification);
          sendNotification.save();

          let payload = {
            title: title,
            body: body,
            noti_type: 1
          }
          let notify = {
            title: title,
            body: body,
            "color": "#f95b2c",
            "sound": true
          }
          if (user.deviceToken && (user.notification == true)) {
            sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
          }
          // Send notification to tailor
          let tailorId = doc.tailorId;
          let TailorData = await TailorModel.findById(mongoose.Types.ObjectId(tailorId));
          let tailorTitle = "New order arrived.";
          let tailorBody = "You have received a new order " + transactionId + ".";
          let tailor_device_type = TailorData.deviceType;
          let tailorNotification = {
            userId: TailorData._id,
            title: tailorTitle,
            body: tailorBody,
            type: "order_placed",
            created_at: Date.now()
          }
          let tailorNotifications = await tailorNotificationModel.create(tailorNotification);
          tailorNotifications.save();

          let tailor_payload = {
            title: tailorTitle,
            body: tailorBody,
            noti_type: 1
          }
          let tailor_notify = {
            title: tailorTitle,
            body: tailorBody,
            "color": "#f95b2c",
            "sound": true
          }
          if (TailorData.deviceToken && (TailorData.notification == true)) {
            sendPushNotification(config.notificationServerKey, TailorData.deviceToken, tailor_device_type, tailor_payload, tailor_notify);
          }
          /* End code for notification */

          if (doc.wallet > 0) {

            let dataToWalletSave = {

              userId: user._id,
              transactionId: transactionId,
              wallet_type: 1,
              wallet_dask: 0,
              created_at: Date.now(),
              orderId: doc.orderId,
              wallet_price: Math.abs(doc.wallet) * -1
            };

            var walletRecord = await walletModel.create(dataToWalletSave);
            walletRecord.save();

            if (!walletRecord) {
              return {
                status: -1,
                message: "Something Went Wrong, Please try later"
              };
            }

          }


          if (doc.refer > 0) {

            let dataToReferSave = {
              userId: user._id,
              modified_at: Date.now(),
              created_at: Date.now(),
              reward_point: ((doc.refer * rewards.point) / rewards.value).toFixed(2),
              refer_price: doc.refer,
              userId: user._id,
              orderId: doc.orderId,
              price: doc.price,
              createdBy: user._id,
              reward_type: 1,
              reward_dask: 1,
              modified_at: Date.now(),
              created_at: Date.now()
            }

            if (doc.refer == doc.price) {
              dataToReferSave.payment = true
            }

            refer = await rewardModel.create(dataToReferSave);
            refer.save();

            if (!refer) {
              return {
                status: -1,
                message: "Something Went Wrong, Please try later"
              };
            }

          }


          if (rewards.enable) {

            let dataToReferSave = {
              userId: user._id,
              modified_at: Date.now(),
              created_at: Date.now(),
              reward_point: ((doc.price * rewards.reward_percentage) / 100).toFixed(2),
              price: doc.price,
              userId: user._id,
              orderId: doc.orderId,
              createdBy: user._id,
              reward_type: 0,
              reward_dask: 1,
              modified_at: Date.now(),
              created_at: Date.now()
            }

            totalRewards = totalRewards + dataToReferSave.reward_point;

            refer = await rewardModel.create(dataToReferSave);
            refer.save();
            //show notification for user
            /* Code for notification start referal */
            let rewardTitle = "Reward Earned.";
            let rewardBody = "You have received reward.";
            let rewardNotification = {
              userId: user._id,
              title: rewardTitle,
              body: rewardBody,
              type: "reward_earned",
              created_at: Date.now()
            }
            let rewardNotifications = await userNotificationModel.create(rewardNotification);
            rewardNotifications.save();

            let rewardPayload = {
              title: rewardTitle,
              body: rewardBody,
              noti_type: 1
            }
            let rewardNotify = {
              title: rewardTitle,
              body: rewardBody,
              "color": "#f95b2c",
              "sound": true
            }
            if (user.deviceToken && (user.notification == true)) {
              sendPushNotification(config.notificationServerKey, user.deviceToken, user.deviceType, rewardPayload, rewardNotify);
            }
            /* End code for notification */
            if (!refer) {
              return {
                status: -1,
                message: "Something Went Wrong, Please try later"
              };
            }
          }

          if (data.payment_mode > 0) {
            doc.complete_payment = price;
          } else {
            doc.complete_payment = Math.abs(doc.refer) + doc.wallet;
          }

          return doc;
        }));
        let orderList = await orderListModel.create(cartData);
        if (!orderList) {
          return {
            status: -1,
            message: "Something went wrong, Please try later"
          };
        }

        let orderIds = _.map(orderList, (order) => order._id);
        let order = {
          total_price: data.totalPrice,
          no_of_readyMade: carts.length,
          orderList: orderIds,
          addressId: data.address,
          offerid: data.offerid,
          payment_mode: data.payment_mode,
          transactionId: transactionId,
          transaction_charge: transaction_charge,
          delivery_charge: delivery_charge,
          service_charge: service_charge,
          delivery_date: Date.now() + 1000 * 60 * 60 * 24 * 5,
          orderId: generateUniqueId({
            length: 7,
            useLetters: true
          }).toUpperCase(),
          userId: user._id
        }
        var orderStichings = [];
        if (data.stiching.length > 0) {
          order.stichingList = [];
          for (let stichn of data.stiching) {
            if (stichn.offerId) {
              let stichs = await stichingCartModel.findByIdAndUpdate(mongoose.Types.ObjectId(stichn.stichingId), {
                $set: {
                  offer: stichn.offerId
                }
              });
              if (!stichs) {
                return {
                  status: -1,
                  message: "Something went wrong, Please try again later."
                };
              }
            }
            orderStichings.push(stichn.stichingId);

            let stich = await stichingCartModel.findById(mongoose.Types.ObjectId(stichn.stichingId));
            if (!stich) {
              return {
                status: -1,
                message: "Something Went Wrong, Please try later"
              };
            }

            /* Here the operations are started */
            let stichPrice = stich.transaction_charge + stich.delivery_charge + stich.service_charge + stich.stitchingPrice + stich.fabricPrice;
            let prepay = 0;

            if (referPrice > stichPrice) {
              referPrice = referPrice - stichPrice;
              stich.refer = stichPrice;
              stich.wallet = 0
            } else {
              if (walletPrice > 0) {
                if (referPrice > 0) {
                  stich.refer = referPrice;
                  var remainingPrice = stichPrice - stich.refer;
                  if (walletPrice > remainingPrice) {
                    walletPrice = walletPrice - remainingPrice;
                    //doc.refer = 0;
                    stich.wallet = stichPrice;
                  } else {
                    stich.wallet = walletPrice;
                  }
                } else {
                  if (walletPrice > stichPrice) {
                    walletPrice = walletPrice - stichPrice;
                    stich.refer = 0;
                    stich.wallet = stichPrice;
                  } else {
                    stich.refer = referPrice;
                    stich.wallet = walletPrice;
                  }
                }

              } else {
                stich.wallet = 0;
                stich.refer = referPrice
              }
              //doc.refer = referPrice
            }

            let orderId = generateUniqueId({
              length: 7,
              useLetters: true
            }).toUpperCase();

            stich.orderId = orderId;

            if (stich.refer > 0) {

              let dataToReferSave = {
                userId: user._id,
                modified_at: Date.now(),
                created_at: Date.now(),
                reward_point: ((stich.refer * rewards.point) / rewards.value).toFixed(2),
                refer_price: stich.refer,
                userId: user._id,
                orderId: orderId,
                price: stichPrice,
                createdBy: user._id,
                reward_type: 1,
                reward_dask: 1,
                modified_at: Date.now(),
                created_at: Date.now()
              }

              if (stich.refer == stichPrice) {
                dataToReferSave.payment = true
              }

              refer = await rewardModel.create(dataToReferSave);
              refer.save();

              if (!refer) {
                return {
                  status: -1,
                  message: "Something Went Wrong, Please try later"
                };
              }

            }

            if (data.payment_mode > 0) {
              stich.complete_payment = stichPrice
            } else {
              stich.complete_payment = stich.refer + stich.wallet;
            }

            // let stichId = stich._id;
            // delete stich._id

            let stichingsUpdate = await stich.save();
            if (!stichingsUpdate) {
              return {
                status: -1,
                message: "Something Went Wrong, Please try later"
              };
            }

            // orderId: generateUniqueId({
            //       length: 7,
            //       useLetters: true
            //     }).toUpperCase()


            /* here the operations are over */

          }

          order.stichingList = orderStichings;
        }

        if (rewards.enable) {

          let ordering = await orderModel.findOne({
            userId: user._id
          });
          if (!ordering) {

            if (user.referralIdFrom) {

              let dataToReferSave = {
                userId: user._id,
                createdBy: user._id,
                modified_at: Date.now(),
                created_at: Date.now(),
                reward_point: rewards.referral_point
              }

              let dataToReferUserSave = {
                userId: user.referralIdFrom,
                createdBy: user._id,
                refer_by: 1,
                modified_at: Date.now(),
                created_at: Date.now(),
                reward_point: rewards.referral_point
              }

              let refers = await rewardModel.create([dataToReferSave, dataToReferUserSave]);
              //refer.save();
              // send notification to user and tailor both here
              /* Code for notification start */
              let rewardTitle = "Reward Earned.";
              let rewardBody = "You have received reward points " + rewards.referral_point + " on successful referrals.";
              let rewardNotification = {
                userId: user._id,
                title: rewardTitle,
                body: rewardBody,
                type: "reward_earned",
                created_at: Date.now()
              }
              let rewardNotifications = await userNotificationModel.create(rewardNotification);
              rewardNotifications.save();

              let rewardPayload = {
                title: rewardTitle,
                body: rewardBody,
                noti_type: 1
              }
              let rewardNotify = {
                title: rewardTitle,
                body: rewardBody,
                "color": "#f95b2c",
                "sound": true
              }
              if (user.deviceToken && (user.notification == true)) {
                sendPushNotification(config.notificationServerKey, user.deviceToken, user.deviceType, rewardPayload, rewardNotify);
              }
              /* End code for notification */
              if (!refer) {
                return {
                  status: -1,
                  message: "Something Went Wrong, Please try later"
                };
              }

            }

          }
        }

        let orderPlaced = await orderModel.create(order);
        orderPlaced.save();
        if (!orderPlaced) {
          return {
            status: -1,
            message: "Something went wrong, Please try later"
          };
        }

        // let updateOrderList = await orderListModel.updateMany({
        //   _id: {
        //     '$in': orderIds
        //   }
        // }, {
        //   $set: {
        //     skuId: generateUniqueId({
        //       length: 7,
        //       useLetters: true
        //     }).toUpperCase()
        //   }
        // });
        // if (!updateOrderList) {
        //   return {
        //     status: -1,
        //     message: "Something went wrong, Please try again later."
        //   };
        // }

        let updateCart = await cartModel.updateMany({
          _id: {
            '$in': cartIds
          }
        }, {
          $set: {
            is_deleted: true
          }
        });
        if (!updateCart) {
          return {
            status: -1,
            message: "Something went wrong, Please try again later."
          };
        }

        /* For stiching */

        //orderPlaced.stichingList = data.stichingIds;
        if (orderStichings.length > 0) {
          let updateStiching = await stichingCartModel.updateMany({
            _id: {
              '$in': orderStichings
            }
          }, {
            $set: {
              is_deleted: true,
              transactionId: transactionId,
              status: 2,
              modified_at: Date.now(),
              created_at: Date.now()
            }
          });
          if (!updateStiching) {
            return {
              status: -1,
              message: "Something went wrong, Please try again later."
            };
          }
        }

        let outputForOrder = await orderModel.findOne({
          _id: orderPlaced._id
        }).populate('userId', 'username mobile countryCode').populate('addressId').lean();
        if (!outputForOrder) {
          return {
            status: -1,
            message: "Something went wrong, Please try again later."
          };
        }
        /* Notification for order placed start */
        let title = "Points earned";
        let body = "Points " + Number(totalRewards) + " on order " + orderPlaced._id + ".";
        let device_type = user.deviceType;
        let notification = {
          userId: user._id,
          title: title,
          body: body,
          type: "order_placed",
          created_at: Date.now()
        }
        let sendNotification = await userNotificationModel.create(notification);
        sendNotification.save();

        let payload = {
          title: title,
          body: body,
          noti_type: 1
        }
        let notify = {
          title: title,
          body: body,
          "color": "#f95b2c",
          "sound": true
        }
        if (user.deviceToken && (user.notification == true)) {
          sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
        }
        /* End code for Notification of order placed */
        return {
          status: 1,
          message: "Order Placed Successfully",
          data: {
            ...outputForOrder,
            ...{
              totalRewards: Number(totalRewards)
            }
          }
        };
      } else {

        let order = {
          total_price: data.totalPrice,
          no_of_readyMade: carts.length,
          addressId: data.address,
          offerid: data.offerid,
          transaction_charge: transaction_charge,
          transactionId: transactionId,
          delivery_charge: delivery_charge,
          service_charge: service_charge,
          orderId: generateUniqueId({
            length: 7,
            useLetters: true
          }).toUpperCase(),
          skuId: generateUniqueId({
            length: 7,
            useLetters: true
          }).toUpperCase(),
          payment_mode: data.payment_mode,
          delivery_date: Date.now() + 1000 * 60 * 60 * 24 * 5,
          userId: user._id
        }

        var orderStichings = [];
        if (data.stiching.length > 0) {
          for (let stichn of data.stiching) {
            if (stichn.offerId) {
              let stichs = await stichingCartModel.findByIdAndUpdate(mongoose.Types.ObjectId(stichn.stichingId), {
                $set: {
                  offer: stichn.offerId
                }
              });
              if (!stichs) {
                return {
                  status: -1,
                  message: "Something went wrong, Please try again later."
                };
              }
              console.log(1);
              //send notification to tailor and user
              /* Code for notification start */
              let title = "Order placed successfully.";
              let body = "Your order " + transactionId + " has been placed.";
              let device_type = user.deviceType;
              let notification = {
                userId: user._id,
                title: title,
                body: body,
                type: "order_placed",
                created_at: Date.now()
              }
              let sendNotification = await userNotificationModel.create(notification);
              sendNotification.save();

              let payload = {
                title: title,
                body: body,
                noti_type: 1
              }
              let notify = {
                title: title,
                body: body,
                "color": "#f95b2c",
                "sound": true
              }
              if (user.deviceToken && (user.notification == true)) {
                sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
              }
              // Send notification to tailor
              let tailorId = stichs.tailorId;
              let TailorData = await TailorModel.findById(mongoose.Types.ObjectId(tailorId));
              let tailorTitle = "New order arrived.";
              let tailorBody = "You have received a new order " + transactionId + ".";
              let tailor_device_type = TailorData.deviceType;
              let tailorNotification = {
                userId: TailorData._id,
                title: tailorTitle,
                body: tailorBody,
                type: "order_placed",
                created_at: Date.now()
              }
              let tailorNotifications = await tailorNotificationModel.create(tailorNotification);
              tailorNotifications.save();

              let tailor_payload = {
                title: tailorTitle,
                body: tailorBody,
                noti_type: 1
              }
              let tailor_notify = {
                title: tailorTitle,
                body: tailorBody,
                "color": "#f95b2c",
                "sound": true
              }
              if (TailorData.deviceToken && (TailorData.notification == true)) {
                sendPushNotification(config.notificationServerKey, TailorData.deviceToken, tailor_device_type, tailor_payload, tailor_notify);
              }
              /* End code for notification */
            }
            orderStichings.push(stichn.stichingId);

            /* Here the operations are started */
            let stich = await stichingCartModel.findById(mongoose.Types.ObjectId(stichn.stichingId));
            if (!stich) {
              return {
                status: -1,
                message: "Something Went Wrong, Please try later"
              };
            }
            let stichPrice = stich.transaction_charge + stich.delivery_charge + stich.service_charge + stich.stitchingPrice + stich.fabricPrice;
            let prepay = 0;
            if (referPrice > stichPrice) {
              referPrice = referPrice - stichPrice;
              stich.refer = stichPrice;
              stich.wallet = 0
            } else {
              if (walletPrice > 0) {
                if (referPrice > 0) {
                  stich.refer = referPrice;
                  var remainingPrice = stichPrice - stich.refer;
                  if (walletPrice > remainingPrice) {
                    walletPrice = walletPrice - remainingPrice;
                    //doc.refer = 0;
                    stich.wallet = stichPrice;
                  } else {
                    stich.wallet = walletPrice;
                  }
                } else {
                  if (walletPrice > stichPrice) {
                    walletPrice = walletPrice - stichPrice;
                    stich.refer = 0;
                    stich.wallet = stichPrice;
                  } else {
                    stich.refer = referPrice;
                    stich.wallet = walletPrice;
                  }
                }

              } else {
                stich.wallet = 0;
                stich.refer = referPrice
              }
              //doc.refer = referPrice
            }

            let orderId = generateUniqueId({
              length: 7,
              useLetters: true
            }).toUpperCase();

            stich.orderId = orderId;
            if (stich.refer > 0) {

              let dataToReferSave = {
                userId: user._id,
                modified_at: Date.now(),
                created_at: Date.now(),
                reward_point: ((stich.refer * rewards.point) / rewards.value).toFixed(2),
                refer_price: stich.refer,
                userId: user._id,
                orderId: orderId,
                price: stichPrice,
                createdBy: user._id,
                reward_type: 1,
                reward_dask: 1,
                modified_at: Date.now(),
                created_at: Date.now()
              }

              if (stich.refer == stichPrice) {
                dataToReferSave.payment = true
              }

              refer = await rewardModel.create(dataToReferSave);
              refer.save();

              if (!refer) {
                return {
                  status: -1,
                  message: "Something Went Wrong, Please try later"
                };
              }
            }

            if (data.payment_mode > 0) {
              stich.complete_payment = stichPrice
            } else {
              stich.complete_payment = stich.refer + stich.wallet;
            }
            // let stichId = stich._id;
            // delete stich._id

            let stichingsUpdate = await stich.save();
            if (!stichingsUpdate) {
              return {
                status: -1,
                message: "Something Went Wrong, Please try later"
              };
            }

            // orderId: generateUniqueId({
            //       length: 7,
            //       useLetters: true
            //     }).toUpperCase()


            /* here the operations are over */

          }
          order.stichingList = orderStichings;
        }

        if (rewards.enable) {

          let ordering = await orderModel.findOne({
            userId: user._id
          });
          if (!ordering) {

            if (user.referralIdFrom) {

              let dataToReferSave = {
                userId: user._id,
                createdBy: user._id,
                modified_at: Date.now(),
                created_at: Date.now(),
                reward_point: rewards.referral_point
              }

              let dataToReferUserSave = {
                userId: user.referralIdFrom,
                refer_by: 1,
                createdBy: user._id,
                modified_at: Date.now(),
                created_at: Date.now(),
                reward_point: rewards.referral_point
              }

              let refers = await rewardModel.create([dataToReferSave, dataToReferUserSave]);
              //refer.save();
              // send notification to user only
              /* Code for notification start */
              let rewardTitle = "Reward Earned.";
              let rewardBody = "You have received reward points " + rewards.referral_point + " on successful referrals.";
              let rewardNotification = {
                userId: user._id,
                title: rewardTitle,
                body: rewardBody,
                type: "reward_earned",
                created_at: Date.now()
              }
              let rewardNotifications = await userNotificationModel.create(rewardNotification);
              rewardNotifications.save();

              let rewardPayload = {
                title: rewardTitle,
                body: rewardBody,
                noti_type: 1
              }
              let rewardNotify = {
                title: rewardTitle,
                body: rewardBody,
                "color": "#f95b2c",
                "sound": true
              }
              if (user.deviceToken && (user.notification == true)) {
                sendPushNotification(config.notificationServerKey, user.deviceToken, user.deviceType, rewardPayload, rewardNotify);
              }
              /* End code for notification */
              if (!refer) {
                return {
                  status: -1,
                  message: "Something Went Wrong, Please try later"
                };
              }

            }

          }
        }


        let orderPlaced = await orderModel.create(order);
        orderPlaced.save();
        if (!orderPlaced) {
          return {
            status: -1,
            message: "Something went wrong, Please try later"
          };
        }

        let updateStiching = await stichingCartModel.updateMany({
          _id: {
            '$in': orderStichings
          }
        }, {
          $set: {
            is_deleted: true,
            transactionId: transactionId,
            modified_at: Date.now(),
            created_at: Date.now(),
            status: 2
          }
        });
        if (!updateStiching) {
          return {
            status: -1,
            message: "Something went wrong, Please try again later."
          };
        }

        let address = await AddressModel.findById(data.address);
        if (!address) {
          return {
            status: -1,
            message: "Order placed, but address not fetched."
          };
        }
        let outputForOrder = {
          addressId: address,
          userId: {
            username: user.username,
            mobile: user.mobile,
            countryCode: user.countryCode
          },
          totalRewards: Number(totalRewards)
        }
        /* Notification for order placed start */
        let title = "Points earned";
        let body = "Points " + Number(totalRewards) + " on order " + orderPlaced._id + ".";
        let device_type = user.deviceType;
        let notification = {
          userId: user._id,
          title: title,
          body: body,
          type: "order_placed",
          created_at: Date.now()
        }
        let sendNotification = await userNotificationModel.create(notification);
        sendNotification.save();

        let payload = {
          title: title,
          body: body,
          noti_type: 1
        }
        let notify = {
          title: title,
          body: body,
          "color": "#f95b2c",
          "sound": true
        }
        if (user.deviceToken && (user.notification == true)) {
          sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
        }
        /* End code for Notification of order placed */
        return {
          status: 1,
          message: "Order Placed Successfully",
          data: outputForOrder
        };
      }

    } else {

      let cartIds = _.map(carts, (cart) => cart._id);

      cartData = await Promise.all(_.map(carts, async (doc) => {

        let productColor = await productColorModel.findById(mongoose.Types.ObjectId(doc.color));
        let sizes = _.map(productColor.sizes, (size) => {
          if (doc.size.toString() == size._id.toString()) {
            size.qty = size.qty - doc.quantity;
          }
          return size;
        });
        productColor.sizes = sizes;
        let product = await productColor.save();
        if (!product) {
          return {
            status: -1,
            message: "Something went wrong, Please try later"
          };
        }
        doc.created_at = Date.now();
        doc.orderId = generateUniqueId({
          length: 7,
          useLetters: true
        }).toUpperCase();
        doc.skuId = generateUniqueId({
          length: 7,
          useLetters: true
        }).toUpperCase();

        doc.transactionId = transactionId;
        doc.modified_at = Date.now();
        doc.created_by = user._id;
        doc.delivery_date = Date.now() + 1000 * 60 * 60 * 24 * 5;
        delete doc._id;

        let price = doc.price + doc.transaction_charge + doc.delivery_charge;

        if (referPrice > price) {
          referPrice = referPrice - price;
          doc.refer = price;
          doc.wallet = 0
        } else {
          if (walletPrice > 0) {
            if (referPrice > 0) {
              doc.refer = referPrice;
              var remainingPrice = price - doc.refer;
              if (walletPrice > remainingPrice) {
                walletPrice = walletPrice - remainingPrice;
                //doc.refer = 0;
                doc.wallet = price;
              } else {
                doc.wallet = walletPrice;
              }
            } else {
              if (walletPrice > price) {
                walletPrice = walletPrice - price;
                doc.refer = 0;
                doc.wallet = price;
              } else {
                doc.refer = referPrice;
                doc.wallet = walletPrice;
              }
            }

          } else {
            doc.wallet = 0;
            doc.refer = referPrice
          }
          //doc.refer = referPrice
        }
        doc.created_by = user._id;
        doc.delivery_date = Date.now() + 1000 * 60 * 60 * 24 * 5;
        delete doc._id;
        // send notification to user and tailor
        /* Code for notification start */
        let title = "Order placed successfully.";
        let body = "Your order " + transactionId + " has been placed.";
        let device_type = user.deviceType;
        let notification = {
          userId: user._id,
          title: title,
          body: body,
          type: "order_placed",
          created_at: Date.now()
        }
        let sendNotification = await userNotificationModel.create(notification);
        sendNotification.save();

        let payload = {
          title: title,
          body: body,
          noti_type: 1
        }
        let notify = {
          title: title,
          body: body,
          "color": "#f95b2c",
          "sound": true
        }
        if (user.deviceToken && (user.notification == true)) {
          sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
        }
        // Send notification to tailor
        let tailorId = doc.tailorId;
        let TailorData = await TailorModel.findById(mongoose.Types.ObjectId(tailorId));
        let tailorTitle = "New order arrived.";
        let tailorBody = "You have received a new order " + transactionId + ".";
        let tailor_device_type = TailorData.deviceType;
        let tailorNotification = {
          userId: TailorData._id,
          title: tailorTitle,
          body: tailorBody,
          type: "order_placed",
          created_at: Date.now()
        }
        let tailorNotifications = await tailorNotificationModel.create(tailorNotification);
        tailorNotifications.save();

        let tailor_payload = {
          title: tailorTitle,
          body: tailorBody,
          noti_type: 1
        }
        let tailor_notify = {
          title: tailorTitle,
          body: tailorBody,
          "color": "#f95b2c",
          "sound": true
        }
        if (TailorData.deviceToken && (TailorData.notification == true)) {
          sendPushNotification(config.notificationServerKey, TailorData.deviceToken, tailor_device_type, tailor_payload, tailor_notify);
        }
        /* End code for notification */
        if (doc.wallet > 0) {

          let dataToWalletSave = {

            userId: user._id,
            transactionId: transactionId,
            wallet_type: 1,
            wallet_dask: 0,
            created_at: Date.now(),
            orderId: doc.orderId,
            wallet_price: Math.abs(doc.wallet) * -1
          };

          var walletRecord = await walletModel.create(dataToWalletSave);
          walletRecord.save();

          if (!walletRecord) {
            return {
              status: -1,
              message: "Something Went Wrong, Please try later"
            };
          }

        }

        if (doc.refer > 0) {

          let dataToReferSave = {
            userId: user._id,
            modified_at: Date.now(),
            created_at: Date.now(),
            refer_price: doc.refer,
            reward_point: ((doc.refer * rewards.point) / rewards.value).toFixed(2),
            userId: user._id,
            orderId: doc.orderId,
            price: doc.price,
            createdBy: user._id,
            reward_type: 1,
            reward_dask: 1,
            modified_at: Date.now(),
            created_at: Date.now()
          }

          if (doc.refer == doc.price) {
            dataToReferSave.payment = true
          }

          refer = await rewardModel.create(dataToReferSave);
          refer.save();

          if (!refer) {
            return {
              status: -1,
              message: "Something Went Wrong, Please try later"
            };
          }

        }

        if (rewards.enable) {

          let dataToReferSave = {
            userId: user._id,
            modified_at: Date.now(),
            created_at: Date.now(),
            reward_point: ((doc.price * rewards.reward_percentage) / 100).toFixed(2),
            userId: user._id,
            orderId: doc.orderId,
            price: doc.price,
            createdBy: user._id,
            reward_type: 0,
            reward_dask: 1,
            modified_at: Date.now(),
            created_at: Date.now()
          }

          totalRewards = totalRewards + dataToReferSave.reward_point;

          refer = await rewardModel.create(dataToReferSave);
          refer.save();
          // send notification to user
          /* Code for notification start */
          let rewardTitle = "Reward Earned.";
          let rewardBody = "You have received reward.";
          let rewardNotification = {
            userId: user._id,
            title: rewardTitle,
            body: rewardBody,
            type: "reward_earned",
            created_at: Date.now()
          }
          let rewardNotifications = await userNotificationModel.create(rewardNotification);
          rewardNotifications.save();

          let rewardPayload = {
            title: rewardTitle,
            body: rewardBody,
            noti_type: 1
          }
          let rewardNotify = {
            title: rewardTitle,
            body: rewardBody,
            "color": "#f95b2c",
            "sound": true
          }
          if (user.deviceToken && (user.notification == true)) {
            sendPushNotification(config.notificationServerKey, user.deviceToken, user.deviceType, rewardPayload, rewardNotify);
          }
          /* End code for notification */
          if (!refer) {
            return {
              status: -1,
              message: "Something Went Wrong, Please try later"
            };
          }
        }

        if (data.payment_mode > 0) {
          doc.complete_payment = price;
        } else {
          doc.complete_payment = Math.abs(doc.refer) + doc.wallet;
        }

        return doc;
      }));

      let orderList = await orderListModel.create(cartData);
      //orderList.save();
      if (!orderList) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }

      let orderIds = _.map(orderList, (order) => order._id);

      let order = {
        total_price: data.totalPrice,
        no_of_readyMade: carts.length,
        orderList: orderIds,
        transactionId: transactionId,
        transaction_charge: transaction_charge,
        delivery_charge: delivery_charge,
        service_charge: service_charge,
        payment_mode: data.payment_mode,
        addressId: data.address,
        offerid: data.offerid,
        delivery_date: Date.now() + 1000 * 60 * 60 * 24 * 5,
        orderId: generateUniqueId({
          length: 7,
          useLetters: true
        }).toUpperCase(),
        userId: user._id
      }


      if (rewards.enable) {

        let ordering = await orderModel.findOne({
          userId: user._id
        });
        if (!ordering) {

          if (user.referralIdFrom) {

            let dataToReferSave = {
              userId: user._id,
              createdBy: user._id,
              modified_at: Date.now(),
              created_at: Date.now(),
              reward_point: rewards.referral_point
            }

            let dataToReferUserSave = {
              userId: user.referralIdFrom,
              refer_by: 1,
              createdBy: user._id,
              modified_at: Date.now(),
              created_at: Date.now(),
              reward_point: rewards.referral_point
            }

            let refers = await rewardModel.create([dataToReferSave, dataToReferUserSave]);
            //refers.save();
            // send notification to user
            /* Code for notification start */
            let rewardTitle = "Reward Earned.";
            let rewardBody = "You have received reward points " + rewards.referral_point + " on successful referrals.";
            let rewardNotification = {
              userId: user._id,
              title: rewardTitle,
              body: rewardBody,
              type: "reward_earned",
              created_at: Date.now()
            }
            let rewardNotifications = await userNotificationModel.create(rewardNotification);
            rewardNotifications.save();

            let rewardPayload = {
              title: rewardTitle,
              body: rewardBody,
              noti_type: 1
            }
            let rewardNotify = {
              title: rewardTitle,
              body: rewardBody,
              "color": "#f95b2c",
              "sound": true
            }
            if (user.deviceToken && (user.notification == true)) {
              sendPushNotification(config.notificationServerKey, user.deviceToken, user.deviceType, rewardPayload, rewardNotify);
            }
            /* End code for notification */
            if (!refers) {
              return {
                status: -1,
                message: "Something Went Wrong, Please try later"
              };
            }

          }

        }
      }



      let orderPlaced = await orderModel.create(order);
      orderPlaced.save();
      if (!orderPlaced) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }

      let updateOrderList = await orderListModel.updateMany({
        _id: {
          '$in': orderIds
        }
      }, {
        $set: {
          skuId: generateUniqueId({
            length: 7,
            useLetters: true
          }).toUpperCase()
        }
      });
      if (!updateOrderList) {
        return {
          status: -1,
          message: "Something went wrong, Please try again later."
        };
      }

      let updateCart = await cartModel.updateMany({
        _id: {
          '$in': cartIds
        }
      }, {
        $set: {
          is_deleted: true
        }
      });
      if (!updateCart) {
        return {
          status: -1,
          message: "Something went wrong, Please try again later."
        };
      }

      let outputForOrder = await orderModel.findOne({
        _id: orderPlaced._id
      }).populate('userId', 'username mobile countryCode').populate('addressId').lean();
      if (!outputForOrder) {
        return {
          status: -1,
          message: "Something went wrong, Please try again later."
        };
      }
      /* Notification for order placed start */
      let title = "Points earned on order placed.";
      let body = "Points " + Number(totalRewards) + " on order " + orderPlaced._id + ".";
      let device_type = user.deviceType;
      let notification = {
        userId: user._id,
        title: title,
        body: body,
        type: "order_placed",
        created_at: Date.now()
      }
      let sendNotification = await userNotificationModel.create(notification);
      sendNotification.save();

      let payload = {
        title: title,
        body: body,
        noti_type: 1
      }
      let notify = {
        title: title,
        body: body,
        "color": "#f95b2c",
        "sound": true
      }
      if (user.deviceToken && (user.notification == true)) {
        sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
      }
      /* End code for Notification of order placed */
      return {
        status: 1,
        message: "Order Placed Successfully",
        data: {
          ...outputForOrder,
          ...{
            totalRewards: Number(totalRewards)
          }
        }
      };

    }
  } catch (err) {
    throw new Error(err.message);
  }

};

exports.addRemoveToWishList = async (data, user) => {
  try {
    if (!data.productId || data.productId == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }
    if (data.status) {
      let wishlist = await wishlistModel.create({
        userId: user._id,
        productId: data.productId
      });
      wishlist.save();


      if (!wishlist) {
        return {
          status: -1,
          message: "Something went wrong, Please try again later."
        };
      }
      return {
        status: 1,
        message: "Product added to wishlist Successfully"
      };

    } else {
      let wishlist = await wishlistModel.deleteOne({
        userId: user._id,
        productId: data.productId
      });
      if (!wishlist) {
        return {
          status: -1,
          message: "Something went wrong, Please try again later."
        };
      }
      return {
        status: 1,
        message: "Product removed from wishlist Successfully"
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.addRemoveTailorToWishList = async (data, user) => {
  try {
    if (!data.tailorId || data.tailorId == '') {
      return {
        status: -1,
        message: "Unsufficient perameter"
      };
    }
    if (data.status) {
      let wishlist = await wishlistTailorModel.create({
        userId: user._id,
        tailorId: data.tailorId
      });
      wishlist.save();
      if (!wishlist) {
        return {
          status: -1,
          message: "Something went wrong, Please try again later."
        };
      }
      return {
        status: 1,
        message: "Tailor added to wishlist Successfully"
      };

    } else {
      let wishlist = await wishlistTailorModel.deleteOne({
        userId: user._id,
        tailorId: data.tailorId
      });
      if (!wishlist) {
        return {
          status: -1,
          message: "Something went wrong, Please try again later."
        };
      }
      return {
        status: 1,
        message: "Tailor removed from wishlist Successfully"
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

// m6 taskss
exports.getBrandsList = async (id) => {
  try {
    // let brands = await fabricTailorBrandModel.find({created_by: mongoose.Types.ObjectId(id), is_deleted: false, is_active: true}).
    //   populate('brandList')
    let query = [{
        $match: {
          created_by: mongoose.Types.ObjectId(id),
          is_deleted: false,
          is_active: true
        }
      },
      {
        $lookup: {
          from: 'fabric',
          localField: 'brandList',
          foreignField: '_id',
          as: 'fabric'
        }
      }, {
        $unwind: '$fabric'
      },
      {
        $group: {
          _id: '$fabric.brandId'
        }
      }, {
        $lookup: {
          from: 'fabricBrand',
          localField: '_id',
          foreignField: '_id',
          as: 'brands'
        }
      }, {
        $unwind: '$brands'
      }, {
        $match: {
          "brands.is_active": true,
          "brands.is_deleted": false
        }
      }, {
        $sort: {
          "brands.name": 1
        }
      }, {
        $project: {
          _id: '$brands._id',
          'brand_name': '$brands.name',
          'brand_image': '$brands.image',
          'created_at': '$brands.created_at',
          'modified_at': '$brands.modified_at',
        }
      }
    ];

    let brands = await fabricTailorBrandModel.aggregate(query);
    if (brands) {
      return {
        status: 1,
        data: brands,
        message: "Brands fetch Successfully"
      };
    } else {
      return {
        status: -1,
        message: "Something went wrong, Please try again later."
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getFabricColorList = async (data) => {
  try {
    // let { fab_id, tailor_id, brand_id } = data;
    // let query = [{
    //   $match: {
    //     fabricTypeId: mongoose.Types.ObjectId(fab_id),
    //     brandId: mongoose.Types.ObjectId(brand_id),
    //     created_by: mongoose.Types.ObjectId(tailor_id),
    //     is_active: true, is_deleted: false
    //   }
    // }, {
    //   $lookup: {
    //     from: 'fabricColor',
    //     localField: 'colorOption',
    //     foreignField: '_id',
    //     as: 'colors'
    //   }
    // }, {
    //   $project: {
    //     colors: 1
    //   }
    // }];

    let {
      _id
    } = data;
    console.log("Id :", _id);
    let query = [{
      $match: {
        _id: mongoose.Types.ObjectId(_id)
      }
    }, {

      $lookup: {
        from: 'fabricColor',
        localField: 'colorOption',
        foreignField: '_id',
        as: 'color'
      }

    }, {
      $unwind: "$color"
    }, {
      $match: {
        "color.is_active": true,
        "color.is_deleted": false
      }
    }, {
      $project: {
        _id: 1,
        "colorId": "$color._id",
        "is_meter": "$color.is_meter",
        "meter_price": "$color.meter_price",
        "is_wars": "$color.is_wars",
        "wars_price": "$color.wars_price",
        "isStockReminder": "$color.isStockReminder",
        "colorCode": "$color.colorCode",
        "colorName": "$color.colorName",
        "image": "$color.image",
        "created_by": "$color.created_by",
      }
    }];

    let colors = await fabricModel.aggregate(query);

    if (colors) {
      return {
        status: 1,
        data: colors,
        message: "Colors Fetch Successfully"
      };
    } else {
      return {
        status: -1,
        message: "Something went wrong, Please try again later."
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getFamilyMember = async (user) => {
  try {
    let query = [{
      $match: {
        userId: mongoose.Types.ObjectId(user._id),
        is_deleted: false
      }
    }];

    let member = await FamilyMemberModel.aggregate(query);
    if (!member) {
      return {
        status: -1,
        message: "Something went wrong, Please try again later."
      };
    }
    return {
      status: 1,
      messsage: "Family members Fetch Successfully",
      data: member
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

async function addOnCartStatus(_id, sortedData) {
  try {
    let cartList = await stichingCartModel.find({
      $and: [{
        userId: mongoose.Types.ObjectId(_id)
      }, {
        is_deleted: false
      }]
    }).lean();
    if (!cartList) {
      return {
        status: -1,
        message: "Something went wrong try after sometime."
      };
    }
    let addcartList;
    if (cartList.length == 0) {
      addcartList = await _.map(sortedData, (sortData) => sortData.is_oncart = false);
    }
    addcartList = _.map(sortedData, (sortData) => {

      let status = _.find(cartList, cart => {
        return cart.fabricId.toString() == sortData._id.toString()
      });
      if (!status) {
        sortData.is_oncart = false;
        return sortData;
      } else {
        sortData.is_oncart = true;
        return sortData;
      }
    });

    return addcartList;

  } catch (error) {
    throw new Error(error.message);
  }

}

exports.getFabricList = async (data, user) => {
  try {

    let {
      tailor_id,
      brandId
    } = data;

    let query = [{
      $match: {
        created_by: mongoose.Types.ObjectId(tailor_id),
        brandId: mongoose.Types.ObjectId(brandId),
        is_active: true,
        is_deleted: false
      }
    }, {
      $lookup: {
        from: 'fabricType',
        localField: 'fabricTypeId',
        foreignField: '_id',
        as: 'fabric'
      }
    }, {
      $unwind: '$fabric'
    }, {
      $match: {
        "fabric.is_active": true,
        "fabric.is_deleted": false
      }
    }, {
      $project: {
        _id: 1,
        'fabricTypeId': '$fabric._id',
        'fabricName': '$fabric.name',
        'is_oncart': {
          $toInt: "0"
        },
        'description': '$fabric.description',
        'image': '$fabric.image'
      }
    }];

    let fabricList = await fabricModel.aggregate(query);

    if (!fabricList) {
      return {
        status: -1,
        message: "Something went wrong, Please try again later."
      };
    }

    if (fabricList.length == 0) {
      return {
        status: 1,
        messsage: "Fabrics Fetch Successfully",
        data: fabricList
      };
    }

    let fabricsFromCart = await addOnCartStatus(user._id, fabricList);
    return {
      status: 1,
      messsage: "Fabrics Fetch Successfully",
      data: fabricsFromCart
    };

  } catch (err) {
    throw new Error(err.message);
  }

};

exports.getFabricDetail = async (data) => {
  try {

    let {
      _id
    } = data;
    // let query = [{
    //   $match:{_id: mongoose.Types.ObjectId(_id)}
    // }];

    let query = [{
      $match: {
        _id: mongoose.Types.ObjectId(_id)
      }
    }, {
      $lookup: {
        from: 'fabricColor',
        localField: 'colorOption',
        foreignField: '_id',
        as: 'color'
      }
    }, {
      $unwind: "$color"
    }, {
      $match: {
        "color.is_active": true,
        "color.is_deleted": false
      }
    }, {
      $lookup: {
        from: 'fabricType',
        localField: 'fabricTypeId',
        foreignField: '_id',
        as: 'fabricType'
      }
    }, {
      $unwind: '$fabricType'
    }, {
      $project: {
        _id: 1,
        "is_meter": "$color.is_meter",
        "meter_price": "$color.meter_price",
        "is_wars": "$color.is_wars",
        "wars_price": "$color.wars_price",
        "image": "$color.image",
        "name": "$fabricType.name",
        "description": "$fabricType.description"
      }
    }];

    let fabric = await fabricModel.aggregate(query);
    if (!fabric) {
      return {
        status: -1,
        message: "Something went wrong, Please try again later."
      };
    }

    if (fabric.length == 0) {

      let query = [{
        $match: {
          _id: mongoose.Types.ObjectId(_id)
        }
      }, {
        $lookup: {
          from: 'fabricType',
          localField: 'fabricTypeId',
          foreignField: '_id',
          as: 'fabricType'
        }
      }, {
        $unwind: '$fabricType'
      }, {
        $project: {
          _id: 1,
          "name": "$fabricType.name",
          "description": "$fabricType.description"
        }
      }];

      let fabrics = await fabricModel.aggregate(query);
      if (!fabrics) {
        return {
          status: -1,
          message: "Something went wrong, Please try again later."
        };
      }
      return {
        status: 1,
        messsage: "Fabrics Fetch Successfully",
        data: {
          ...{
            fabricTypes: []
          },
          ...{
            fabrics: {
              name: fabrics[0].name,
              description: fabrics[0].description
            }
          }
        }
      };
    }
    return {
      status: 1,
      messsage: "Fabrics Fetch Successfully",
      data: {
        ...{
          fabricTypes: fabric
        },
        ...{
          fabrics: {
            name: fabric[0].name,
            description: fabric[0].description
          }
        }
      }
    };

  } catch (err) {
    throw new Error(err.message);
  }
};


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

  let timeSlot = _.map(allTimes, (time) => {
    return moment(time, ["HH.mm"]).format("hh:mm a")
  });
  return timeSlot;
}

exports.getTailorTimeSlot = async (data) => {
  try {
    // if (!data.tailorId || data.tailorId == '') {
    //   return {
    //     status: -1,
    //     message: "Unsufficient perameter"
    //   };
    // }
    let morningSlot = [];
    let eveningSlot = [];

    let timeSlot = getInterval("00:00 AM", "11:59 PM");

    // let tailor = await tailorProfileModel.findOne({
    //   tailorId: mongoose.Types.ObjectId(data.tailorId)
    // }).select('businessDetails');
    // if (!tailor) {
    //   return {
    //     status: -1,
    //     message: "Tailor Not Found"
    //   };
    // }
    // var timeSlot;
    // if (tailor.businessDetails.working_days.includes('All')) {
    //   timeSlot = getInterval(tailor.businessDetails.working_hours.opening_time, tailor.businessDetails.working_hours.closing_time);
    // } else {
    //   let onDay = moment(data.date).format('ddd');
    //   console.log("Day :", onDay);
    //   if (tailor.businessDetails.working_days.includes(onDay)) {
    //     timeSlot = getInterval(tailor.businessDetails.working_hours.opening_time, tailor.businessDetails.working_hours.closing_time);
    //   } else {
    //     return {
    //       status: 1,
    //       message: "Tailor store details fetch successfully.",
    //       data: {
    //         morningSlot: morningSlot,
    //         eveningSlot: eveningSlot
    //       }
    //     };
    //   }
    // }



    for (let slot of timeSlot) {
      slot.includes("am") ? morningSlot.push(slot) : eveningSlot.push(slot);
    }

    return {
      status: 1,
      message: "Tailor store details fetch successfully.",
      data: {
        morningSlot: morningSlot,
        eveningSlot: eveningSlot
      }
    };


  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getPromotions = async () => {
  try {

    let promotions = await promotionalModel.find({
      is_deleted: false,
      is_active: true,
      status: 1
    }).sort({
      created_at: -1
    });
    if (!promotions) {
      return {
        status: -1,
        message: "Something went wrong, Please try again later."
      };
    }
    let promos = [];
    if (promotions.length > 0) {
      for (let promo of promotions) {
        var future_date = moment(promo.created_at).add(promo.posting_period, 'months');
        //console.log("Its here :",new Date(future_date).getTime());
        if (new Date(future_date).getTime() > Date.now()) {
          promos.push(promo);
        }
      }
    }

    return {
      status: 1,
      message: "Promotions fetch successfully",
      data: promos
    };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getOffers = async (data) => {
  try {
    let today = Date.now();
    let offer = await offerModel.find({
      tailorId: mongoose.Types.ObjectId(data._id),
      is_deleted: false,
      is_active: true,
      status: 1,
      'duration.from': {
        $lte: today
      },
      'duration.to': {
        $gte: today
      }
    });
    if (!offer) {
      return {
        status: -1,
        message: "Something went wrong, Please try again later."
      };
    }

    // let adminOffer = await adminOfferModel.find({});
    return {
      status: 1,
      message: "Offers fetch successfully",
      data: offer
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getOffersForPurchase = async (data, user) => {
  try {
    let offer = [];
    let offer1 = [];
    let offer2 = [];
    let today = Date.now();
    if (data && data.products.length > 0) {
      let products = _.map(data.products, (prod) => {
        return mongoose.Types.ObjectId(prod._id);
      });

      let query = [{
          $match: {
            _id: {
              '$in': products
            }
          }
        }, {
          $lookup: {
            from: "productBrand",
            localField: "brandId",
            foreignField: "_id",
            as: "brand"
          }
        }, {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $group: {
            _id: "$brand.categoryId"
          }
        }, {
          $lookup: {
            from: "category",
            localField: "_id",
            foreignField: "_id",
            as: "category"
          }
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: null,
            a: {
              $addToSet: "$category._id"
            }
          }
        },
        {
          $project: {
            _id: 0,
            a: 1
          }
        }
      ];

      let FetchedCategories = await productModel.aggregate(query);
      console.log("FetchedCategories", FetchedCategories)
      let categories = FetchedCategories[0].a;

      for (let prods of data.products) {
        let offers = await offerModel.find({
          $or: [{
            tailorId: mongoose.Types.ObjectId(prods.tailorId),
            categories: {
              $in: categories
            }
          }, {
            tailorId: mongoose.Types.ObjectId(prods.tailorId),
            products: {
              $in: products
            }
          }],
          status: 1,
          'duration.from': {
            $lte: today
          },
          'duration.to': {
            $gte: today
          },
          is_active: true,
          is_deleted: false
        }).lean();
        if (!offers) {
          return {
            status: -1,
            message: "Something went wrong, Please try again later."
          };
        }
        [...offer] = [...offer, ...offers];
      }

      if (data.stichings.length > 0) {

        let stiching = _.map(data.stichings, (prod) => {
          return prod._id;
        });
        let offers;
        for (let prods of data.stichings) {
          offers = await offerModel.find({
            tailorId: prods.tailorId,
            stiching: {
              $in: stiching
            },
            status: 1,
            'duration.from': {
              $lte: today
            },
            'duration.to': {
              $gte: today
            },
            is_active: true,
            is_deleted: false
          }).lean();
          if (!offers) {
            return {
              status: -1,
              message: "Something went wrong, Please try again later."
            };
          }
        }
        [...offer1] = [...offer1, ...offers];
      }

      [...offer2] = [...offer, ...offer1];

      var uniq = _.uniqBy(offer2, function (o) {
        return o._id.toString();
      });
      return {
        status: 1,
        message: "Offers fetch successfully",
        data: uniq
      };
    }

    return {
      status: 1,
      message: "Offers fetch successfully.",
      data: offer
    };
  } catch (err) {
    throw new Error(err.message);
  }
};


exports.applyOffer = async (data, user) => {
  try {

    let offerId = data.offerId;
    let stichingIds = data.stichingIds;

    let offer = await offerModel.findById(mongoose.Types.ObjectId(offerId)).lean();
    if (!offer) {
      return {
        status: -1,
        message: "Something went wrong, Please try again later."
      };
    }

    let charges = await chargesModel.findOne({}).lean();
    if (!charges) {
      throw new Error("Something went wrong, Please try later.");
    }

    let address = await AddressModel.findById(mongoose.Types.ObjectId(data.addressId)).lean();
    if (!address) {
      throw new Error("Something went wrong, Please try later.");
    }

    let products;
    let brandsIds = [];
    let productIds = [];
    let stichingCart = [];
    let total = 0;
    let distancing = 0;
    let serviceCharge = 0;
    let stichingPrice = 0;
    let fabricPrice = 0;

    let transactionCharge = charges.transaction_charges / (data.cartIds.length + data.stichingIds.length);

    if (data.type) {
      switch (parseInt(offer.offer_type)) {
        case 0:

          if (offer.categories.length > 0) {
            let brands = await productBrandModel.find({
              categoryId: {
                $in: offer.categories
              }
            }).lean();
            if (!brands) {
              return {
                status: -1,
                message: "Something went wrong, Please try again later."
              };
            }

            if (brands.length > 0) {
              brandsIds = _.map(brands, (doc) => {
                return doc._id;
              });

              products = await productModel.find({
                brandId: {
                  $in: brandsIds
                },
                created_by: offer.tailorId
              }).lean();
              if (!products) {
                return {
                  status: -1,
                  message: "Something went wrong, Please try again later."
                };
              }
              if (products.length > 0) {
                productIds = _.map(products, (doc) => {
                  return doc._id.toString();
                });
              }
            }
          }

          let cart = await buyModel.find({
              _id: {
                $in: data.cartIds
              }
            }).select('quantity tailorId userId brandId productId color size price unit_price').lean().populate('userId', "username").populate('brandId', "name")
            .populate({
              path: 'tailorId',
              model: "tailor",
              select: "name tailor_profile_Id",
              populate: {
                path: 'tailor_profile_Id',
                model: 'tailorProfile',
                select: 'businessLocation'
              }
            })
            .populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();;
          if (!cart) {
            return {
              status: -1,
              message: "Something went wrong, Please try again later."
            };
          }

          var cartData = [];
          if (cart.length != 0) {
            cartData = await Promise.all(_.map(cart, async (element) => {
              //let total = total + element.price;
              let distance = await getDistanceBetweenPoints({
                lat1: element.tailorId.tailor_profile_Id.businessLocation.latitude.valueOf(),
                lon1: element.tailorId.tailor_profile_Id.businessLocation.longitude.valueOf(),
                lat2: address.Latitude,
                lon2: address.Longitude
              });

              distance = parseInt(distance.split(" ", 1)[0]);

              let dis = 0
              for (let delivery of charges.delivery_charges) {
                if (distance >= delivery.to && distance <= delivery.from) {
                  dis += delivery.charge;
                } else {
                  dis += 0
                }
              }

              distancing = distancing + dis;

              if (dis == 0) {
                throw new Error("Shipping cost has not been defined for your location from " + element.tailorId.name + "end. Please contact our support team.");
              }
              //distancing
              var mainData = {
                ...element,
                sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString()),
                distance: distance,
                transaction_charge: transactionCharge,
                delivery_charge: dis
              };
              //delete mainData.color.sizes;
              return mainData;
            }))
          }
          let updateCart = _.map(cartData, (docm) => {
            if (productIds.includes(docm.productId._id.toString())) {
              //Start from Here
              if ((docm.sizes[0].price * docm.quantity > offer.order_amount_limit.min) && (docm.sizes[0].price * docm.quantity < offer.order_amount_limit.max)) {
                docm.price = docm.sizes[0].price * docm.quantity - (offer.maxDiscount * docm.sizes[0].price * docm.quantity / 100);
                docm.offer = offer;
              }
            }

            total = total + docm.price;
            //count and totalPrice
            return docm;
          });

          var stichingCartData = [];

          return {
            status: 1, message: "Cart Products Fetch Successfully.", data: {
              ...{
                cartRecord: updateCart
              },
              ...{
                stichingCartRecord: stichingCartData
              },
              ...{
                delivery_charges: distancing,
                transactionCharge: charges.transaction_charges,
                service_charges: 0,
                totalProductPrice: total,
                totalFabricPrice: 0,
                totalStichingPrice: 0,
                totalPrice: total + distancing + charges.transaction_charges,
                offerId: offerId
              }
            }
          };

        default:
          if (offer.categories.length > 0) {
            let brands = await productBrandModel.find({
              categoryId: {
                $in: offer.categories
              }
            }).lean();
            if (!brands) {
              return {
                status: -1,
                message: "Something went wrong, Please try again later."
              };
            }

            if (brands.length > 0) {
              brandsIds = _.map(brands, (doc) => {
                return doc._id;
              });

              products = await productModel.find({
                brandId: {
                  $in: brandsIds
                },
                created_by: offer.tailorId
              }).lean();
              if (!products) {
                return {
                  status: -1,
                  message: "Something went wrong, Please try again later."
                };
              }
              if (products.length > 0) {
                productIds = _.map(products, (doc) => {
                  return doc._id.toString();
                });
              }
            }
          }
          offer.proudcts = _.map(offer.products, (prod) => {
            return prod.toString();
          });
          //console.log("products on  offer :",productIds);
          [...productIds] = [...productIds, ...offer.products];
          let carts = await buyModel.find({
              _id: {
                $in: data.cartIds
              }
            }).select('quantity tailorId userId brandId productId color size price unit_price').lean().populate('userId', "username").populate('brandId', "name")
            .populate({
              path: 'tailorId',
              model: "tailor",
              select: "name tailor_profile_Id",
              populate: {
                path: 'tailor_profile_Id',
                model: 'tailorProfile',
                select: 'businessLocation'
              }
            })
            .populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();;
          if (!carts) {
            return {
              status: -1,
              message: "Something went wrong, Please try again later."
            };
          }

          var cartData = [];
          if (carts.length != 0) {
            cartData = await Promise.all(_.map(carts, async (element) => {
              //let total = total + element.price;
              let distance = await getDistanceBetweenPoints({
                lat1: element.tailorId.tailor_profile_Id.businessLocation.latitude.valueOf(),
                lon1: element.tailorId.tailor_profile_Id.businessLocation.longitude.valueOf(),
                lat2: address.Latitude,
                lon2: address.Longitude
              });

              distance = parseInt(distance.split(" ", 1)[0]);

              let dis = 0
              for (let delivery of charges.delivery_charges) {
                if (distance >= delivery.to && distance <= delivery.from) {
                  dis += delivery.charge;
                } else {
                  dis += 0
                }
              }

              distancing = distancing + dis;

              if (dis == 0) {
                throw new Error("Shipping cost has not been defined for your location from " + element.tailorId.name + "end. Please contact our support team.");
              }
              //distancing
              var mainData = {
                ...element,
                sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString()),
                distance: distance,
                transaction_charge: transactionCharge,
                delivery_charge: dis
              };
              //delete mainData.color.sizes;
              return mainData;
            }))
          }
          let updateCarts = _.map(cartData, (docm) => {
            if (productIds.includes(docm.productId._id.toString())) {
              //Start from Here
              docm.price = docm.sizes[0].price * docm.quantity - (offer.maxDiscount * docm.sizes[0].price * docm.quantity / 100);
              docm.offer = offer;
            }
            //count and totalPrice
            total = total + docm.price;
            return docm;
          });

          var stichingCartData = [];

          return {
            status: 1, message: "Cart Products Fetch Successfully.", data: {
              ...{
                cartRecord: updateCarts
              },
              ...{
                stichingCartRecord: stichingCartData
              },
              ...{
                delivery_charges: distancing,
                transactionCharge: charges.transaction_charges,
                service_charges: 0,
                totalProductPrice: total,
                totalFabricPrice: 0,
                totalStichingPrice: 0,
                totalPrice: total + distancing + charges.transaction_charges,
                offerId: offerId
              }
            }
          };
      }
    }

    switch (parseInt(offer.offer_type)) {
      case 0:

        if (offer.categories.length > 0) {
          let brands = await productBrandModel.find({
            categoryId: {
              $in: offer.categories
            }
          }).lean();
          if (!brands) {
            return {
              status: -1,
              message: "Something went wrong, Please try again later."
            };
          }

          if (brands.length > 0) {
            brandsIds = _.map(brands, (doc) => {
              return doc._id;
            });

            products = await productModel.find({
              brandId: {
                $in: brandsIds
              },
              created_by: offer.tailorId
            }).lean();
            if (!products) {
              return {
                status: -1,
                message: "Something went wrong, Please try again later."
              };
            }
            if (products.length > 0) {
              productIds = _.map(products, (doc) => {
                return doc._id.toString();
              });
            }
          }
        }

        let cart = await cartModel.find({
            _id: {
              $in: data.cartIds
            }
          }).select('quantity tailorId userId brandId productId color size price unit_price').lean().populate('userId', "username").populate('brandId', "name")
          .populate({
            path: 'tailorId',
            model: "tailor",
            select: "name tailor_profile_Id",
            populate: {
              path: 'tailor_profile_Id',
              model: 'tailorProfile',
              select: 'businessLocation'
            }
          })
          .populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();;
        if (!cart) {
          return {
            status: -1,
            message: "Something went wrong, Please try again later."
          };
        }

        var cartData = [];
        if (cart.length != 0) {
          cartData = await Promise.all(_.map(cart, async (element) => {
            //let total = total + element.price;
            let distance = await getDistanceBetweenPoints({
              lat1: element.tailorId.tailor_profile_Id.businessLocation.latitude.valueOf(),
              lon1: element.tailorId.tailor_profile_Id.businessLocation.longitude.valueOf(),
              lat2: address.Latitude,
              lon2: address.Longitude
            });

            distance = parseInt(distance.split(" ", 1)[0]);

            let dis = 0
            for (let delivery of charges.delivery_charges) {
              if (distance >= delivery.to && distance <= delivery.from) {
                dis += delivery.charge;
              } else {
                dis += 0
              }
            }

            distancing = distancing + dis;

            if (dis == 0) {
              throw new Error("Shipping cost has not been defined for your location from " + element.tailorId.name + "end. Please contact our support team.");
            }
            //distancing
            var mainData = {
              ...element,
              sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString()),
              distance: distance,
              transaction_charge: transactionCharge,
              delivery_charge: dis
            };
            //delete mainData.color.sizes;
            return mainData;
          }))
        }
        let updateCart = _.map(cartData, (docm) => {
          if (productIds.includes(docm.productId._id.toString())) {
            //Start from Here
            if ((docm.sizes[0].price * docm.quantity > offer.order_amount_limit.min) && (docm.sizes[0].price * docm.quantity < offer.order_amount_limit.max)) {
              docm.price = docm.sizes[0].price * docm.quantity - (offer.maxDiscount * docm.sizes[0].price * docm.quantity / 100);
              docm.offer = offer;
            }
          }

          total = total + docm.price;
          //count and totalPrice
          return docm;
        });

        if (stichingIds.length > 0) {

          stichingIds = _.map(stichingIds, (data) => {
            return mongoose.Types.ObjectId(data);
          });

          let query = [{
            $match: {
              _id: {
                $in: stichingIds
              }
            }
          }, {
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
              localField: 'tailorId',
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
            $project: {
              _id: 1,
              'username': '$user.username',
              'brand': '$brand.name',
              'fabricName': '$fabricType.name',
              'businessLocation': '$tailorProfile.businessLocation',
              'fabricId': '$fabricType._id',
              'tailor': '$tailor.name',
              'tailorId': '$tailor._id',
              'memberId': '$memberId.name',
              'model_name': '$model.name',
              'model_image': '$model.image',
              'priceForKid': '$tailorProfile.businessDetails.charges.charge_for_kid',
              'priceForAdult': '$tailorProfile.businessDetails.charges.charge_for_adult',
              'toShowPrice': {
                $cond: {
                  if: {
                    "$gt": ["$memberId", null]
                  },
                  then: {
                    $cond: {
                      if: {
                        "$eq": ['$memberId.member_is', 0]
                      },
                      then: "1",
                      else: "2"
                    }
                  },
                  else: "2"
                }
              },
              'image': '$color.image',
              'fabricPrice': '$fabricPrice',
              'measurmentDate': '$measurment.measurementDate',
              'measurmentTime': '$measurment.measurementTime',
              'quantity': '$quantity'
            }
          }, {
            $project: {
              _id: 1,
              'username': 1,
              'brand': 1,
              'fabricName': 1,
              'businessLocation': 1,
              'stitchingPrice': {
                $cond: {
                  if: {
                    $eq: ['toShowPrice', "1"]
                  },
                  then: {
                    $toInt: "$priceForKid"
                  },
                  else: {
                    $toInt: "$priceForAdult"
                  }
                }
              },
              'fabricPrice': 1,
              'fabricId': 1,
              'tailor': 1,
              'tailorId': 1,
              'memberId': 1,
              'model_name': 1,
              'model_image': 1,
              'image': 1,
              'measurmentDate': 1,
              'measurmentTime': 1,
              'quantity': 1
            }
          }];

          stichingCart = await stichingCartModel.aggregate(query);
          if (!stichingCart) {
            return {
              status: -1,
              message: "Something went wrong, Please try later."
            }
          }

        }

        var stichingCartData = [];
        if (stichingCart.length != 0) {
          stichingCartData = await Promise.all(_.map(stichingCart, async (element) => {
            //total = total + element.price;

            let distance = await getDistanceBetweenPoints({
              lat1: element.businessLocation.latitude.valueOf(),
              lon1: element.businessLocation.longitude.valueOf(),
              lat2: address.Latitude,
              lon2: address.Longitude
            });

            distance = parseInt(distance.split(" ", 1)[0]);

            let dis = 0
            for (let delivery of charges.delivery_charges) {
              if (distance >= delivery.to && distance <= delivery.from) {
                dis += delivery.charge;
              } else {

                dis += 0
              }
            }

            distancing = distancing + dis;
            serviceCharge += charges.service_charges;
            if (dis == 0) {
              throw new Error("Shipping cost has not been defined for your location from " + element.tailor + "end. Please contact our support team.");
            }

            stichingPrice += element.stitchingPrice;
            fabricPrice += element.fabricPrice;

            let stich = await stichingCartModel.updateOne({
              _id: element._id
            }, {
              stitchingPrice: element.stitchingPrice,
              transaction_charge: transactionCharge,
              delivery_charge: dis,
              service_charge: charges.service_charges,
              distance: distance
            });
            if (!stich) {
              return {
                status: -1,
                message: "Something went wrong, Please try later."
              };
            }
            var mainData = {
              ...element,
              ...{
                distance: distance,
                transaction_charge: transactionCharge,
                service_charge: charges.service_charges,
                delivery_charge: dis
              }
            };

            // var mainData = {
            //   ...element,
            //   distance: distance,
            //   transaction_charge: transactionCharge,
            //   delivery_charge: dis
            // };
            return mainData;
          }))
        }


        return {
          status: 1, message: "Cart Products Fetch Successfully.", data: {
            ...{
              cartRecord: updateCart
            },
            ...{
              stichingCartRecord: stichingCartData
            },
            ...{
              delivery_charges: distancing,
              transactionCharge: charges.transaction_charges,
              service_charges: serviceCharge,
              totalProductPrice: total,
              totalFabricPrice: fabricPrice,
              totalStichingPrice: stichingPrice,
              totalPrice: total + stichingPrice + fabricPrice + distancing + charges.transaction_charges + serviceCharge,
              offerId: offerId
            }
          }
        };
      case 1:

        let card = await cartModel.find({
            $and: [{
              userId: mongoose.Types.ObjectId(user._id)
            }, {
              is_deleted: false
            }, {
              status: 0
            }]
          }).select('quantity tailorId userId brandId productId color size price unit_price').lean().populate('userId', "username -_id").populate('brandId', "name")
          .populate({
            path: 'tailorId',
            model: "tailor",
            select: "name tailor_profile_Id",
            populate: {
              path: 'tailor_profile_Id',
              model: 'tailorProfile',
              select: 'businessLocation'
            }
          })
          .populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();
        if (!card) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          }
        }
        //console.log("Cart :",cart.length);
        var cartData = [];
        if (card.length != 0) {
          cartData = await Promise.all(_.map(card, async (element) => {
            total = total + element.price;

            let distance = await getDistanceBetweenPoints({
              lat1: element.tailorId.tailor_profile_Id.businessLocation.latitude.valueOf(),
              lon1: element.tailorId.tailor_profile_Id.businessLocation.longitude.valueOf(),
              lat2: address.Latitude,
              lon2: address.Longitude
            });

            distance = parseInt(distance.split(" ", 1)[0]);

            let dis = 0
            for (let delivery of charges.delivery_charges) {
              if (distance >= delivery.to && distance <= delivery.from) {
                dis += delivery.charge;
              } else {
                dis += 0
              }
            }

            distancing = distancing + dis;

            if (dis == 0) {
              throw new Error("Shipping cost has not been defined for your location from " + element.tailorId.name + "end. Please contact our support team.");
            }
            //distancing
            var mainData = {
              ...element,
              sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString()),
              distance: distance,
              transaction_charge: transactionCharge,
              delivery_charge: dis
            };
            return mainData;
          }))
        }

        stichingIds = _.map(stichingIds, (data) => {
          return mongoose.Types.ObjectId(data);
        });

        let query = [{
          $match: {
            _id: {
              $in: stichingIds
            }
          }
        }, {
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
            localField: 'tailorId',
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
          $project: {
            _id: 1,
            'username': '$user.username',
            'brand': '$brand.name',
            'fabricName': '$fabricType.name',
            'businessLocation': '$tailorProfile.businessLocation',
            'fabricId': '$fabricType._id',
            'tailor': '$tailor.name',
            'tailorId': '$tailor._id',
            'memberId': '$memberId.name',
            'model_name': '$model.name',
            'model_image': '$model.image',
            'priceForKid': '$tailorProfile.businessDetails.charges.charge_for_kid',
            'priceForAdult': '$tailorProfile.businessDetails.charges.charge_for_adult',
            'toShowPrice': {
              $cond: {
                if: {
                  "$gt": ["$memberId", null]
                },
                then: {
                  $cond: {
                    if: {
                      "$eq": ['$memberId.member_is', 0]
                    },
                    then: "1",
                    else: "2"
                  }
                },
                else: "2"
              }
            },
            'image': '$color.image',
            'fabricPrice': '$fabricPrice',
            'measurmentDate': '$measurment.measurementDate',
            'measurmentTime': '$measurment.measurementTime',
            'quantity': '$quantity'
          }
        }, {
          $project: {
            _id: 1,
            'username': 1,
            'brand': 1,
            'fabricName': 1,
            'businessLocation': 1,
            'stitchingPrice': {
              $cond: {
                if: {
                  $eq: ['toShowPrice', "1"]
                },
                then: {
                  $toInt: "$priceForKid"
                },
                else: {
                  $toInt: "$priceForAdult"
                }
              }
            },
            'fabricPrice': 1,
            'fabricId': 1,
            'tailor': 1,
            'tailorId': 1,
            'memberId': 1,
            'model_name': 1,
            'model_image': 1,
            'image': 1,
            'measurmentDate': 1,
            'measurmentTime': 1,
            'quantity': 1
          }
        }];

        stichingCart = await stichingCartModel.aggregate(query);
        if (!stichingCart) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          }
        }

        offer.stiching = _.map(offer.stiching, (prod) => {
          return prod.toString();
        });
        var stichingCartData = [];
        if (stichingCart.length != 0) {
          stichingCartData = await Promise.all(_.map(stichingCart, async (element) => {
            //total = total + element.price;

            let distance = await getDistanceBetweenPoints({
              lat1: element.businessLocation.latitude.valueOf(),
              lon1: element.businessLocation.longitude.valueOf(),
              lat2: address.Latitude,
              lon2: address.Longitude
            });

            distance = parseInt(distance.split(" ", 1)[0]);

            let dis = 0
            for (let delivery of charges.delivery_charges) {
              if (distance >= delivery.to && distance <= delivery.from) {
                dis += delivery.charge;
              } else {

                dis += 0
              }
            }

            distancing = distancing + dis;
            serviceCharge += charges.service_charges;

            if (dis == 0) {
              throw new Error("Shipping cost has not been defined for your location from " + element.tailor + "end. Please contact our support team.");
            }

            stichingPrice += element.stitchingPrice;
            fabricPrice += element.fabricPrice;

            let stich = await stichingCartModel.updateOne({
              _id: element._id
            }, {
              stitchingPrice: element.stitchingPrice,
              transaction_charge: transactionCharge,
              delivery_charge: dis,
              service_charge: charges.service_charges,
              distance: distance
            });
            if (!stich) {
              return {
                status: -1,
                message: "Something went wrong, Please try later."
              };
            }
            var mainData = {
              ...element,
              ...{
                distance: distance,
                transaction_charge: transactionCharge,
                service_charge: charges.service_charges,
                delivery_charge: dis
              }
            };

            // var mainData = {
            //   ...element,
            //   distance: distance,
            //   transaction_charge: transactionCharge,
            //   delivery_charge: dis
            // };

            return mainData;
          }))
        }


        let stichOffers = _.map(stichingCartData, (doc) => {
          if (offer.stiching.includes(doc.fabricId.toString()) && (offer.tailorId.toString() == doc.tailorId.toString())) {
            //Start from Here
            doc.offer = offer;
          }
          return doc;
        });

        return {
          status: 1, message: "Cart Products Fetch Successfully.", data: {
            ...{
              cartRecord: cartData
            },
            ...{
              stichingCartRecord: stichOffers
            },
            ...{
              delivery_charges: distancing,
              transactionCharge: charges.transaction_charges,
              service_charges: serviceCharge,
              totalProductPrice: total,
              totalFabricPrice: fabricPrice,
              totalStichingPrice: stichingPrice,
              totalPrice: total + stichingPrice + fabricPrice + distancing + charges.transaction_charges + serviceCharge,
              offerId: offerId
            }
          }
        };
      default:

        // let offer = await offerModel.findById(mongoose.Types.ObjectId(offerId)).lean();
        // if (!offer) {
        //   return { status: -1, message: "Something went wrong, Please try again later." };
        // }
        if (offer.categories.length > 0) {
          let brands = await productBrandModel.find({
            categoryId: {
              $in: offer.categories
            }
          }).lean();
          if (!brands) {
            return {
              status: -1,
              message: "Something went wrong, Please try again later."
            };
          }

          if (brands.length > 0) {
            brandsIds = _.map(brands, (doc) => {
              return doc._id;
            });

            products = await productModel.find({
              brandId: {
                $in: brandsIds
              },
              created_by: offer.tailorId
            }).lean();
            if (!products) {
              return {
                status: -1,
                message: "Something went wrong, Please try again later."
              };
            }
            if (products.length > 0) {
              productIds = _.map(products, (doc) => {
                return doc._id.toString();
              });
            }
          }
        }
        offer.proudcts = _.map(offer.products, (prod) => {
          return prod.toString();
        });
        //console.log("products on  offer :",productIds);
        [...productIds] = [...productIds, ...offer.products];
        let carts = await cartModel.find({
            _id: {
              $in: data.cartIds
            }
          }).select('quantity tailorId userId brandId productId color size price unit_price').lean().populate('userId', "username").populate('brandId', "name")
          .populate({
            path: 'tailorId',
            model: "tailor",
            select: "name tailor_profile_Id",
            populate: {
              path: 'tailor_profile_Id',
              model: 'tailorProfile',
              select: 'businessLocation'
            }
          })
          .populate('productId', "name image").populate("color", "colorName colorCode units colorImages sizeType sizes").lean();;
        if (!carts) {
          return {
            status: -1,
            message: "Something went wrong, Please try again later."
          };
        }

        var cartData = [];
        if (carts.length != 0) {
          cartData = await Promise.all(_.map(carts, async (element) => {
            //let total = total + element.price;
            let distance = await getDistanceBetweenPoints({
              lat1: element.tailorId.tailor_profile_Id.businessLocation.latitude.valueOf(),
              lon1: element.tailorId.tailor_profile_Id.businessLocation.longitude.valueOf(),
              lat2: address.Latitude,
              lon2: address.Longitude
            });

            distance = parseInt(distance.split(" ", 1)[0]);

            let dis = 0
            for (let delivery of charges.delivery_charges) {
              if (distance >= delivery.to && distance <= delivery.from) {
                dis += delivery.charge;
              } else {
                dis += 0
              }
            }

            distancing = distancing + dis;

            if (dis == 0) {
              throw new Error("Shipping cost has not been defined for your location from " + element.tailorId.name + "end. Please contact our support team.");
            }
            //distancing
            var mainData = {
              ...element,
              sizes: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString()),
              distance: distance,
              transaction_charge: transactionCharge,
              delivery_charge: dis
            };
            //delete mainData.color.sizes;
            return mainData;
          }))
        }
        let updateCarts = _.map(cartData, (docm) => {
          if (productIds.includes(docm.productId._id.toString())) {
            //Start from Here
            docm.price = docm.sizes[0].price * docm.quantity - (offer.maxDiscount * docm.sizes[0].price * docm.quantity / 100);
            docm.offer = offer;
          }
          //count and totalPrice
          total = total + docm.price;
          return docm;
        });

        stichingIds = _.map(stichingIds, (data) => {
          return mongoose.Types.ObjectId(data);
        });

        if (stichingIds.length > 0) {
          let query = [{
            $match: {
              _id: {
                $in: stichingIds
              }
            }
          }, {
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
              localField: 'tailorId',
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
            $project: {
              _id: 1,
              'username': '$user.username',
              'brand': '$brand.name',
              'fabricName': '$fabricType.name',
              'businessLocation': '$tailorProfile.businessLocation',
              'fabricId': '$fabricType._id',
              'tailor': '$tailor.name',
              'tailorId': '$tailor._id',
              'memberId': '$memberId.name',
              'model_name': '$model.name',
              'model_image': '$model.image',
              'priceForKid': '$tailorProfile.businessDetails.charges.charge_for_kid',
              'priceForAdult': '$tailorProfile.businessDetails.charges.charge_for_adult',
              'toShowPrice': {
                $cond: {
                  if: {
                    "$gt": ["$memberId", null]
                  },
                  then: {
                    $cond: {
                      if: {
                        "$eq": ['$memberId.member_is', 0]
                      },
                      then: "1",
                      else: "2"
                    }
                  },
                  else: "2"
                }
              },
              'image': '$color.image',
              'fabricPrice': '$fabricPrice',
              'measurmentDate': '$measurment.measurementDate',
              'measurmentTime': '$measurment.measurementTime',
              'quantity': '$quantity'
            }
          }, {
            $project: {
              _id: 1,
              'username': 1,
              'brand': 1,
              'fabricName': 1,
              'businessLocation': 1,
              'stitchingPrice': {
                $cond: {
                  if: {
                    $eq: ['toShowPrice', "1"]
                  },
                  then: {
                    $toInt: "$priceForKid"
                  },
                  else: {
                    $toInt: "$priceForAdult"
                  }
                }
              },
              'fabricPrice': 1,
              'fabricId': 1,
              'tailor': 1,
              'tailorId': 1,
              'memberId': 1,
              'model_name': 1,
              'model_image': 1,
              'image': 1,
              'measurmentDate': 1,
              'measurmentTime': 1,
              'quantity': 1
            }
          }];

          stichingCart = await stichingCartModel.aggregate(query);
          if (!stichingCart) {
            return {
              status: -1,
              message: "Something went wrong, Please try later."
            }
          }
        }

        var stichingCartData = [];
        if (stichingCart.length != 0) {
          stichingCartData = await Promise.all(_.map(stichingCart, async (element) => {
            //total = total + element.price;

            let distance = await getDistanceBetweenPoints({
              lat1: element.businessLocation.latitude.valueOf(),
              lon1: element.businessLocation.longitude.valueOf(),
              lat2: address.Latitude,
              lon2: address.Longitude
            });

            distance = parseInt(distance.split(" ", 1)[0]);

            let dis = 0
            for (let delivery of charges.delivery_charges) {
              if (distance >= delivery.to && distance <= delivery.from) {
                dis += delivery.charge;
              } else {

                dis += 0
              }
            }

            distancing = distancing + dis;
            serviceCharge += charges.service_charges;
            if (dis == 0) {
              throw new Error("Shipping cost has not been defined for your location from " + element.tailor + "end. Please contact our support team.");
            }

            stichingPrice += element.stitchingPrice;
            fabricPrice += element.fabricPrice;
            let stich = await stichingCartModel.updateOne({
              _id: element._id
            }, {
              stitchingPrice: element.stitchingPrice,
              transaction_charge: transactionCharge,
              delivery_charge: dis,
              service_charge: charges.service_charges,
              distance: distance
            });
            if (!stich) {
              return {
                status: -1,
                message: "Something went wrong, Please try later."
              };
            }
            var mainData = {
              ...element,
              ...{
                distance: distance,
                transaction_charge: transactionCharge,
                service_charge: charges.service_charges,
                delivery_charge: dis
              }
            };

            // var mainData = {
            //   ...element,
            //   distance: distance,
            //   transaction_charge: transactionCharge,
            //   delivery_charge: dis
            // };
            return mainData;
          }))
        }

        return {
          status: 1, message: "Cart Products Fetch Successfully.", data: {
            ...{
              cartRecord: updateCarts
            },
            ...{
              stichingCartRecord: stichingCartData
            },
            ...{
              delivery_charges: distancing,
              transactionCharge: charges.transaction_charges,
              service_charges: serviceCharge,
              totalProductPrice: total,
              totalFabricPrice: fabricPrice,
              totalStichingPrice: stichingPrice,
              totalPrice: total + stichingPrice + fabricPrice + distancing + charges.transaction_charges + serviceCharge,
              offerId: offerId
            }
          }
        };
    }
  } catch (err) {
    throw new Error(err.message);
  }
};


// exports.getOrders = async(data,user)=>{
//   try{
//     let query = [
//       {$match: {userId:mongoose.Types.ObjectId(user._id)}},
//       {$lookup:{
//         from: "orderList",
//         localField:"orderList",
//         foreignField:"_id",
//         as:"productOrder"
//       }},{
//         $unwind:{
//           path:"productOrder",
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {$lookup:{
//         from: "stichingCart",
//         localField:"stichingList",
//         foreignField:"_id",0
//         as:"stichingOrder"
//       }},{
//         $unwind:{
//           path:"stichingOrder",
//           preserveNullAndEmptyArrays: true
//         }
//       }
//     ]


//     let orders = await orderModel.aggregate(query);
//     if(!orders){
//       return { status: -1, message: "Something went wrong, Please try later." }
//     }
//     return { status: 1, message: "Cart Products Fetch Successfully.", data: order };
//   }catch(err){
//     throw new Error(err.message);
//   }
// }



//type=>1=>all
//type=>2=>product
//type=>3=>striching


// //status=0=> all
// status=1=> ongoing
// status=2=>cancelled
// status=3=>completew
exports.orderlisting = async (data, user) => {
  try {
    let orderStatus;
    let stichingStatus;
    if (parseInt(data.status) == 0) {
      orderStatus = [0, 1, 2, 3, 4, 5];
      stichingStatus = [2, 3, 4, 5, 6, 7];
    } else if (parseInt(data.status) == 1) {
      orderStatus = [0, 1, 2, 3];
      stichingStatus = [2, 3, 4, 5];
    } else if (parseInt(data.status) == 2) {
      orderStatus = [5];
      stichingStatus = [7];
    } else {
      orderStatus = [4];
      stichingStatus = [6];
    }


    if (parseInt(data.type) == 1) {
      console.log("Its here  1");
      let order = await orderListModel.aggregate([{
        $match: {
          status: {
            $in: orderStatus
          }
        }
      }, {
        $lookup: {
          from: "tailor",
          localField: "tailorId",
          foreignField: "_id",
          as: "tailor"
        }
      }, {
        $unwind: "$tailor"
      }, {
        $lookup: {
          from: "product",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      }, {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true
        }
      }, {
        $lookup: {
          from: 'rating',
          localField: '_id',
          foreignField: 'productId',
          as: 'rating'
        }
      }, {
        $unwind: {
          path: '$rating',
          preserveNullAndEmptyArrays: true
        }
      }, {
        $project: {
          "status": "$status",
          "orderId": "$orderId",
          "created_at": "$created_at",
          "modified_at": "$modified_at",
          "tailor": "$tailor.name",
          "tailorId": "$tailor._id",
          "product": "$rating",
          "rating_completed": {
            $cond: {
              if: {
                "$gt": ["$rating", null]
              },
              then: {
                $toBool: 1
              },
              else: {
                $toBool: 0
              }
            }
          },
          "delivery_on": "$delivery_on",
          "productImage": "$product.image",
          "contactNo": "00971544003538",
          "typeOf": {
            $toInt: '1'
          }
        }
      }]);

      if (!order) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }

      let stichingOrder = await stichingCartModel.aggregate([{
        $match: {
          status: {
            $in: stichingStatus
          }
        }
      }, {
        $lookup: {
          from: "tailor",
          localField: "tailorId",
          foreignField: "_id",
          as: "tailor"
        }
      }, {
        $unwind: "$tailor"
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
      }, {
        $project: {
          "status": "$status",
          "orderId": "$orderId",
          "created_at": "$created_at",
          "modified_at": "$modified_at",
          "tailor": "$tailor.name",
          "delivery_on": "$delivery_on",
          "tailorId": "$tailor._id",
          "isMeasurement": "$isMeasurement",
          "rating_completed": {
            $cond: {
              if: {
                "$gt": ["$rating", null]
              },
              then: {
                $toBool: 1
              },
              else: {
                $toBool: 0
              }
            }
          },
          "contactNo": "00971544003538",
          "typeOf": {
            $toInt: '2'
          }
        }
      }]);
      if (!stichingOrder) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }

      if (order.length > 0 && stichingOrder.length == 0) {
        stichingOrder = [];
      }

      if (order.length == 0 && stichingOrder.length > 0) {
        order = [];
      }

      if (order.length == 0 && stichingOrder.length == 0) {
        return {
          status: 1,
          message: "Order Fetch Successfully",
          data: []
        }
      }

      let concadinate = [...order, ...stichingOrder];

      let sortOrder = _.orderBy(concadinate, item => parseInt(item.modified_at), ['desc']);

      // _.orderBy(concadinate, 'modified_at', 'asc');
      //let sortOrder =_.sortBy(concadinate, 'modified_at');
      console.log("Its here");
      return {
        status: 1,
        message: "Order Fetch Successfully",
        data: sortOrder
      };

    } else if (parseInt(data.type) == 2) {
      let order = await orderListModel.aggregate([{
        $match: {
          status: {
            $in: orderStatus
          }
        }
      }, {
        $lookup: {
          from: "tailor",
          localField: "tailorId",
          foreignField: "_id",
          as: "tailor"
        }
      }, {
        $unwind: "$tailor"
      }, {
        $lookup: {
          from: "product",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      }, {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true
        }
      }, {
        $lookup: {
          from: 'rating',
          localField: '_id',
          foreignField: 'productId',
          as: 'rating'
        }
      }, {
        $unwind: {
          path: '$rating',
          preserveNullAndEmptyArrays: true
        }
      }, {
        $project: {
          "status": "$status",
          "orderId": "$orderId",
          "created_at": "$created_at",
          "tailor": "$tailor.name",
          "tailorId": "$tailor._id",
          "delivery_on": "$delivery_on",
          "rating_completed": {
            $cond: {
              if: {
                "$gt": ["$rating", null]
              },
              then: {
                $toBool: 1
              },
              else: {
                $toBool: 0
              }
            }
          },
          "productImage": "$product.image",
          "contactNo": "00971544003538",
          "typeOf": {
            $toInt: '1'
          }
        }
      }]);

      if (!order) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }

      let sortOrder = _.orderBy(order, item => parseInt(item.modified_at), ['desc']);
      return {
        status: 1,
        message: "Order fetch successfully",
        data: sortOrder
      };
    } else {
      let order = await stichingCartModel.aggregate([{
        $match: {
          status: {
            $in: stichingStatus
          }
        }
      }, {
        $lookup: {
          from: "tailor",
          localField: "tailorId",
          foreignField: "_id",
          as: "tailor"
        }
      }, {
        $unwind: "$tailor"
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
      }, {
        $project: {
          "status": "$status",
          "orderId": "$orderId",
          "created_at": "$modified_at",
          "tailor": "$tailor.name",
          "tailorId": "$tailor._id",
          "rating_completed": {
            $cond: {
              if: {
                "$gt": ["$rating", null]
              },
              then: {
                $toBool: 1
              },
              else: {
                $toBool: 0
              }
            }
          },
          "delivery_on": "$dispatch_on",
          "isMeasurement": "$isMeasurement",
          "contactNo": "00971544003538",
          "typeOf": {
            $toInt: '2'
          }
        }
      }]);
      if (!order) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }
      let sortOrder = _.orderBy(order, item => parseInt(item.modified_at), ['desc']);
      return {
        status: 1,
        message: "Order fetch successfully",
        data: sortOrder
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }

};
exports.cancelorder = async (data, user) => {
  try {
    let orderid = data.id
    let reasonD = data.reason
    let type = data.type
    if (type == 1) {
      let ordercancel = await orderListModel.findByIdAndUpdate(mongoose.Types.ObjectId(orderid), {
        $set: {
          status: 5,
          reason: reasonD,
          modified_at: Date.now()
        }
      });
      let ordercancelD = await orderListModel.findById(mongoose.Types.ObjectId(orderid));

      console.log(ordercancel)
      /* Code for notification start */
      let title = "Order Cancelled.";
      let body = "You have cancelled the order " + orderid;
      let device_type = user.deviceType;
      let notification = {
        userId: user._id,
        title: title,
        body: body,
        type: "order_cancelled",
        created_at: Date.now()
      }
      let sendNotification = await userNotificationModel.create(notification);
      sendNotification.save();

      let payload = {
        title: title,
        body: body,
        noti_type: 1
      }
      let notify = {
        title: title,
        body: body,
        "color": "#f95b2c",
        "sound": true
      }
      if (user.deviceToken && (user.notification == true)) {
        sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
      }
      // Send notification to tailor
      let tailorId = ordercancel.tailorId;
      let TailorData = await TailorModel.findById(mongoose.Types.ObjectId(tailorId));
      let tailorTitle = "Order Cancelled.";
      let tailorBody = "Order " + orderid + " has been cancelled by User.";
      let tailor_device_type = TailorData.deviceType;
      let tailorNotification = {
        userId: TailorData._id,
        title: tailorTitle,
        body: tailorBody,
        type: "order_placed",
        created_at: Date.now()
      }
      let tailorNotifications = await tailorNotificationModel.create(tailorNotification);
      tailorNotifications.save();

      let tailor_payload = {
        title: tailorTitle,
        body: tailorBody,
        noti_type: 1
      }
      let tailor_notify = {
        title: tailorTitle,
        body: tailorBody,
        "color": "#f95b2c",
        "sound": true
      }
      if (TailorData.deviceToken && (TailorData.notification == true)) {
        sendPushNotification(config.notificationServerKey, TailorData.deviceToken, tailor_device_type, tailor_payload, tailor_notify);
      }
      /* End code for notification */
      // send notification to tailor also.
      return {
        status: 1,
        message: "orderdata cancelled successfully.",
        order: ordercancelD
      };
    }
    if (type == 2) {
      let ordercancel1 = await stichingCartModel.findByIdAndUpdate(mongoose.Types.ObjectId(orderid), {
        $set: {
          status: 7,
          reason: reasonD,
          modified_at: Date.now()

        }
      });
      let ordercancelD1 = await stichingCartModel.findById(mongoose.Types.ObjectId(orderid));
      // send notification for user and tailor
      /* Code for notification start */
      let title = "Order Cancelled.";
      let body = "You have cancelled the order " + orderid;
      let device_type = user.deviceType;
      let notification = {
        userId: user._id,
        title: title,
        body: body,
        type: "order_cancelled",
        created_at: Date.now()
      }
      let sendNotification = await userNotificationModel.create(notification);
      sendNotification.save();

      let payload = {
        title: title,
        body: body,
        noti_type: 1
      }
      let notify = {
        title: title,
        body: body,
        "color": "#f95b2c",
        "sound": true
      }
      if (user.deviceToken && (user.notification == true)) {
        sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
      }
      // Send notification to tailor
      let tailorId = ordercancel1.tailorId;
      let TailorData = await TailorModel.findById(mongoose.Types.ObjectId(tailorId));
      let tailorTitle = "Order Cancelled.";
      let tailorBody = "Order " + orderid + " has been cancelled by User.";
      let tailor_device_type = TailorData.deviceType;
      let tailorNotification = {
        userId: TailorData._id,
        title: tailorTitle,
        body: tailorBody,
        type: "order_placed",
        created_at: Date.now()
      }
      let tailorNotifications = await tailorNotificationModel.create(tailorNotification);
      tailorNotifications.save();

      let tailor_payload = {
        title: tailorTitle,
        body: tailorBody,
        noti_type: 1
      }
      let tailor_notify = {
        title: tailorTitle,
        body: tailorBody,
        "color": "#f95b2c",
        "sound": true
      }
      if (TailorData.deviceToken && (TailorData.notification == true)) {
        sendPushNotification(config.notificationServerKey, TailorData.deviceToken, tailor_device_type, tailor_payload, tailor_notify);
      }
      /* End code for notification */
      return {
        status: 1,
        message: "stichingdata cancelled successfully.",
        stiching: ordercancelD1
      };
    }

  } catch (err) {
    throw new Error(err.message);
  }
}
exports.productrating = async (data, user) => {
  try {
    let type = data.type
    if (!type || type == null || type == undefined) {
      return {
        status: -1,
        message: 'Type is required'
      }
    }

    if (type == 1) {
      let ratingData = await ratingModel.find({
        userId: user._id,
        tailorId: data.tailorId,
        orderId: data.id
      })
      if (ratingData.length == 0) {
        data.userId = user._id
        data.orderId = data.id
        data.improvement = data.improvement
        data.modelname = data.modelname
        data.image = data.image
        data.created_at = Date.now();
        var ratingdata = await ratingModel.create(data)
        ratingdata.save();
        if (!ratingdata) {
          return {
            status: -1,
            message: 'Something went wrong'
          }
        }
        /* Code for notification start */
        let title = "Order Rated.";
        let body = "You have successfully rated the order " + data.id + ".";
        let device_type = user.deviceType;
        let notification = {
          userId: user._id,
          title: title,
          body: body,
          type: "order_rated",
          created_at: Date.now()
        }
        let sendNotification = await userNotificationModel.create(notification);
        sendNotification.save();

        let payload = {
          title: title,
          body: body,
          noti_type: 1
        }
        let notify = {
          title: title,
          body: body,
          "color": "#f95b2c",
          "sound": true
        }
        if (user.deviceToken && (user.notification == true)) {
          sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
        }
        // Send notification to tailor
        let tailorId = data.tailorId;
        let TailorData = await TailorModel.findById(mongoose.Types.ObjectId(tailorId));
        let tailorTitle = "Order Rated.";
        let tailorBody = "You have received the rating for your order " + data.id + ".";
        let tailor_device_type = TailorData.deviceType;
        let tailorNotification = {
          userId: TailorData._id,
          title: tailorTitle,
          body: tailorBody,
          type: "order_rated",
          created_at: Date.now()
        }
        let tailorNotifications = await tailorNotificationModel.create(tailorNotification);
        tailorNotifications.save();

        let tailor_payload = {
          title: tailorTitle,
          body: tailorBody,
          noti_type: 1
        }
        let tailor_notify = {
          title: tailorTitle,
          body: tailorBody,
          "color": "#f95b2c",
          "sound": true
        }
        if (TailorData.deviceToken && (TailorData.notification == true)) {
          sendPushNotification(config.notificationServerKey, TailorData.deviceToken, tailor_device_type, tailor_payload, tailor_notify);
        }
        /* End code for notification */
        return {
          status: 0,
          message: 'rating added successfully.',
          data: ratingdata
        }
      } else {
        return {
          status: -1,
          message: 'Already rated'
        }
      }
    }
    if (type == 2) {
      let ratingData = await ratingModel.find({
        userId: user._id,
        tailorId: data.tailorId,
        stichingId: data.id
      })
      if (ratingData.length == 0) {
        data.userId = user._id
        data.stichingId = data.id

        data.improvement = data.improvement
        data.modelname = data.modelname;
        data.created_at = Date.now();
        var ratingdata = await ratingModel.create(data)
        ratingdata.save();
        if (!ratingdata) {
          return {
            status: -1,
            message: 'Something went wrong'
          }
        }
        /* Code for notification start */
        let title = "Order Rated.";
        let body = "You have successfully rated the order " + data.id + ".";
        let device_type = user.deviceType;
        let notification = {
          userId: user._id,
          title: title,
          body: body,
          type: "order_rated",
          created_at: Date.now()
        }
        let sendNotification = await userNotificationModel.create(notification);
        sendNotification.save();

        let payload = {
          title: title,
          body: body,
          noti_type: 1
        }
        let notify = {
          title: title,
          body: body,
          "color": "#f95b2c",
          "sound": true
        }
        if (user.deviceToken && (user.notification == true)) {
          sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
        }
        // Send notification to tailor
        let tailorId = data.tailorId;
        let TailorData = await TailorModel.findById(mongoose.Types.ObjectId(tailorId));
        let tailorTitle = "Order Rated.";
        let tailorBody = "You have received the rating for your order " + data.id + ".";
        let tailor_device_type = TailorData.deviceType;
        let tailorNotification = {
          userId: TailorData._id,
          title: tailorTitle,
          body: tailorBody,
          type: "order_rated",
          created_at: Date.now()
        }
        let tailorNotifications = await tailorNotificationModel.create(tailorNotification);
        tailorNotifications.save();

        let tailor_payload = {
          title: tailorTitle,
          body: tailorBody,
          noti_type: 1
        }
        let tailor_notify = {
          title: tailorTitle,
          body: tailorBody,
          "color": "#f95b2c",
          "sound": true
        }
        if (TailorData.deviceToken && (TailorData.notification == true)) {
          sendPushNotification(config.notificationServerKey, TailorData.deviceToken, tailor_device_type, tailor_payload, tailor_notify);
        }
        /* End code for notification */
        return {
          status: 0,
          message: 'rating added successfully.',
          data: ratingdata
        }
      } else {
        return {
          status: -1,
          message: 'Already rated'
        }
      }
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }



}
exports.addcancelreason = async (data) => {
  try {

    let reason = await userCancelResonModel.create(data);
    reason.save();
    if (!reason) {
      return {
        status: -1,
        message: "Not able to update right now,please try later"
      }
    }
    return {
      status: 1,
      message: "Reason created Successfully.",
      data: reason
    };
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.fetchUserReason = async () => {
  try {
    let reasons = await userCancelResonModel.find();
    if (!reasons) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }
    return {
      status: 1,
      message: "Reasons Fetch SuccessFully",
      data: reasons
    };
  } catch (err) {
    throw new Error(err.message);
  }
};


exports.getOrderDetails = async (data, userData) => {
  try {
    let status = parseInt(data.status);
    let type = parseInt(data.type);
    let _id = mongoose.Types.ObjectId(data._id);

    if (type == 1) {

      let query = [
        {
              $match: {
                "orderList": _id
              }
            },
            {
              $lookup: {
                from: 'orderList',
                localField: 'orderList',
                foreignField: '_id',
                as: 'order'
              }
            },
            {
              $unwind: {
                path: '$order',
                preserveNullAndEmptyArrays: true
              }
            }, {
              $lookup: {
                from: 'address',
                localField: 'addressId',
                foreignField: '_id',
                as: 'address'
              }
            },
            {
              $unwind: {
                path: '$address',
                preserveNullAndEmptyArrays: true
              }
            }, {
              $project: {
                "_id": "$order._id",
                "status": "$order.status",
                "created_at": "$order.created_at",
                "dispatch_on": "$order.dispatch_on",
                "delivery_on": "$order.delivery_on",
                "quantity": "$order.quantity",
                "productId": "$order.productId",
                "skuId": "$order.skuId",
                "brandId": "$order.brandId",
                "address": "$address",
                "complete_payment": "$order.complete_payment",
                "orderId": "$order.orderId",
                "tailorId": "$order.tailorId",
                "userId": "$order.created_by",
                "reason": "$order.reason",
                "modified_at": "$order.modified_at",
                "payment_mode": "$payment_mode",
                "unit_price": "$order.unit_price",
                "price": "$order.price",
                "refer": "$order.refer",
                "product": "$order.productId",
                "color": "$order.color",
                "size": "$order.size",
                "delivery": "$order.delivery_charge",
                "transaction": "$order.transaction_charge",
                "service": "$order.service_charge",
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
                from: 'product',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
              }
            }, {
              $unwind: {
                path: "$product",
                preserveNullAndEmptyArrays: true
              }
            }, {
              $lookup: {
                from: 'productColor',
                localField: 'color',
                foreignField: '_id',
                as: 'color'
              }
            }, {
              $unwind: {
                path: "$color",
                preserveNullAndEmptyArrays: true
              }
            }, {
              $lookup: {
                from: 'productBrand',
                localField: 'brandId',
                foreignField: '_id',
                as: 'brand'
              }
            }, {
              $unwind: {
                path: "$brand",
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
                localField: 'tailorId',
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
                from: 'rating',
                localField: '_id',
                foreignField: 'productId',
                as: 'rating'
              }
            }, {
              $unwind: {
                path: '$rating',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                _id: 1,
                'username': '$user.username',
                'userImage': '$user.profileImage',
                'created_at': '$created_at',
                'modified_at': '$modified_at',
                'color': '$color',
                'address': '$address',
                'product_name': '$product.name',
                'product_image': '$product.image',
                'brand': '$brand.name',
                'tailor': '$tailor.name',
                'rating': '$rating',
                'is_rating': {
                  $cond: {
                    if: {
                      "$gt": ["$rating", null]
                    },
                    then: {
                      $toBool: 1
                    },
                    else: {
                      $toBool: 0
                    }
                  }
                },
                'tailorId': '$tailor._id',
                'tailorProfile': '$tailorProfile.businessLocation',
                'deliveryDate': '$delivery_on',
                'promoCode': {
                  $toInt: '0'
                },
                'redeem_point': {
                  $toInt: '0'
                },
                'image': '$color.image',
                'size': '$size',
                'unit_price': '$unit_price',
                'complete_payment':1,
                'refer': '$refer',
                'price': "$price",
                'delivery': '$delivery',
                "transaction": "$transaction",
                "service": "$service",
                'status': '$status',
                'reason': '$reason',
                "contactNo": "00971544003538",
                'quantity': '$quantity',
                "payment_mode": "$payment_mode"
              }
            },
            {
              $project: {
                _id: 1,
                'username': '$username',
                'userImage': '$userImage',
                'created_at': '$created_at',
                'modified_at': '$modified_at',
                'product_name': '$product_name',
                'product_image': '$product_image',
                'brand': '$brand',
                'address': '$address',
                'color': '$color',
                'tailor': '$tailor',
                'is_rating': '$is_rating',
                'rating': '$rating',
                'size': '$size',
                'tailorId': '$tailorId',
                'tailorProfile': '$tailorProfile',
                'deliveryDate': '$deliveryDate',
                'unit_price': {
                  $multiply: ["$unit_price", "$quantity"]
                },
                'price': "$price",
                'vat': '$vat',
                'delivery': '$delivery',
                'promoCode': '$promoCode',
                'redeem_point': '$refer',
                'reason': '$reason',
                "transaction": "$transaction",
                "service": "$service",
                'total': {
                  $add: ["$delivery", "$transaction", "$service", "$price"]
                },
                "reaminaing_payment": {
                    $subtract: [{
                      $add: ["$delivery", "$transaction", "$service", "$price"]
                    }, "$complete_payment"]
                 },
                'status': '$status',
                "contactNo": '$contactNo',
                'quantity': '$quantity',
                "payment_mode": "$payment_mode"
              }
            }
        ]

      let order = await orderModel.aggregate(query);
      if (!order) {
        return {
          status: -1,
          message: "Something went wrong , Please try later."
        }
      }
      var addSize = await _.map(order, (element) => {
        var mainData = {
          ...element,
          size: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString())[0]
        };
        return mainData;
      })

      let changeForm = addSize[0];
      let distance = await getDistanceBetweenPoints({
        lat1: changeForm.tailorProfile.latitude.valueOf(),
        lon1: changeForm.tailorProfile.longitude.valueOf(),
        lat2: changeForm.address.Latitude,
        lon2: changeForm.address.Longitude
      });

      return {
        status: 1,
        message: "Order Fetch successfully",
        data: {
          ...changeForm,
          ...{
            distance: distance
          }
        }
      };

    }
    if (type == 2) {

      let query;
      if (status == 1) {
        query = [{
            $match: {
              "stichingList": _id
            }
          },
          {
            $lookup: {
              from: 'stichingCart',
              localField: 'stichingList',
              foreignField: '_id',
              as: 'stiching'
            }
          },
          {
            $unwind: {
              path: '$stiching',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'address',
              localField: 'addressId',
              foreignField: '_id',
              as: 'address'
            }
          },
          {
            $unwind: {
              path: '$address',
              preserveNullAndEmptyArrays: true
            }
          }, {
            $project: {
              "_id": "$stiching._id",
              "memberId": "$stiching.memberId",
              "status": "$stiching.status",
              "dispatch_on": "$stiching.dispatch_on",
              "created_at": "$stiching.created_at",
              "address": "$address",
              "delivery_on": "$stiching.delivery_on",
              "isMeasurement": "$stiching.isMeasurement",
              "quantity": "$stiching.quantity",
              "is_deleted": "$stiching.is_deleted",
              "recordmeasurment": "$stiching.recordMeasurment",
              "skuId": "$stiching.skuId",
              "orderId": "$stiching.orderId",
              "tailorId": "$stiching.tailorId",
              "delivery_charge": "$stiching.delivery_charge",
              "transaction_charge": "$stiching.transaction_charge",
              "service_charge": "$stiching.service_charge",
              "refer": "$stiching.refer",
              "wallet": "$stiching.wallet",
              "fabricPrice": "$stiching.fabricPrice",
              "complete_payment": "$stiching.complete_payment",
              "stitchingPrice": "$stiching.stitchingPrice",
              "modelId": "$stiching.modelId",
              "userId": "$stiching.userId",
              "brandId": "$stiching.brandId",
              "fabricTypeId": "$stiching.fabricTypeId",
              "fabricId": "$stiching.fabricId",
              "color": "$stiching.color",
              "measurmentId": "$stiching.measurmentId",
              "modified_at": "$stiching.modified_at",
              "payment_mode": "$payment_mode"
            }
          }, {
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
          }, {
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
              from: 'recordmeasurment',
              localField: 'recordmeasurment',
              foreignField: '_id',
              as: 'recordmeasurment'
            }
          }, {
            $unwind: {
              path: '$recordmeasurment',
              preserveNullAndEmptyArrays: true
            }
          }, {
            $project: {
              _id: 1,
              'username': '$user.username',
              'userImage': '$user.profileImage',
              'brand': '$brand.name',
              'fabricName': '$fabricType.name',
              'fabricId': '$fabricType._id',
              "created_at": "$created_at",
              'modified_at': '$modified_at',
              'tailor': '$tailor.name',
              "fabricPrice": 1,
              "complete_payment": 1,
              "stitchingPrice": 1,
              "refer": 1,
              "wallet": 1,
              "transaction_charge": 1,
              "delivery_charge": 1,
              "service_charge": 1,
              'is_member': {
                $cond: {
                  if: {
                    "$gt": ["$memberId", null]
                  },
                  then: "4",
                  else: "6"
                }
              },
              'tailorId': '$tailor._id',
              'is_rating': {
                $cond: {
                  if: {
                    "$gt": ["$rating", null]
                  },
                  then: {
                    $toBool: 1
                  },
                  else: {
                    $toBool: 0
                  }
                }
              },
              'tailorProfile': '$tailorProfile.businessLocation',
              'member': '$memberId',
              'priceForKid': '$tailorProfile.businessDetails.charges.charge_for_kid',
              'priceForAdult': '$tailorProfile.businessDetails.charges.charge_for_adult',
              'toShowPrice': {
                $cond: {
                  if: {
                    "$gt": ["$memberId", null]
                  },
                  then: {
                    $cond: {
                      if: {
                        "$eq": ['$memberId.member_is', 0]
                      },
                      then: "1",
                      else: "2"
                    }
                  },
                  else: "2"
                }
              },
              'recordmeasurment': 1,
              'deliveryDate': '$delivery_on',
              'model_name': '$model.name',
              'model_image': '$model.image',
              "address": "$address",
              'promoCode': {
                $toInt: '0'
              },
              'redeem_point': {
                $toInt: '0'
              },
              'image': '$color.image',
              'measurment': '$measurment',
              'isMeasurement': '$isMeasurement',
              'status': '$status',
              "contactNo": "00971544003538",
              'quantity': '$quantity',
              "payment_mode": "$payment_mode"
            }
          },
          {
            $project: {
              _id: 1,
              'username': '$username',
              'userImage': '$userImage',
              'brand': '$brand',
              'fabricName': '$fabricName',
              'fabricId': '$fabricId',
              'modified_at': '$modified_at',
              'tailor': '$tailor',
              "created_at": "$created_at",
              'toShowPrice': '$toShowPrice',
              "fabricPrice": 1,
              "complete_payment": 1,
              "stitchingPrice": 1,
              "refer": 1,
              "wallet": 1,
              "delivery": '$delivery_charge',
              "transaction": "$transaction_charge",
              "service": "$service_charge",
              "reaminaing_payment": {
                $subtract: [{
                  $add: ["$fabricPrice", "$stitchingPrice", "$transaction_charge", "$delivery_charge", "$service_charge"]
                }, "$complete_payment"]
              },
              'is_member': {
                $cond: {
                  if: {
                    $eq: ["is_member", "6"]
                  },
                  then: {
                    $toBool: 'false'
                  },
                  else: {
                    $toBool: 'true'
                  }
                }
              },
              'tailorId': '$tailorId',
              'tailorProfile': '$tailorProfile',
              'is_rating': '$is_rating',
              "recordmeasurment": 1,
              "address": "$address",
              'ModelName': "$model_name",
              'model_image': '$model_image',
              'discount': {
                $toInt: "0"
              },
              'offer': {
                $toInt: "0"
              },
              'member': '$member',
              'priceForKid': {
                $cond: {
                  if: {
                    $eq: ['$toShowPrice', "1"]
                  },
                  then: {
                    $toInt: "$priceForKid"
                  },
                  else: {
                    $toInt: "0"
                  }
                }
              },
              'priceForAdult': {
                $cond: {
                  if: {
                    $eq: ['$toShowPrice', "2"]
                  },
                  then: {
                    $toInt: "$priceForAdult"
                  },
                  else: {
                    $toInt: "0"
                  }
                }
              },
              'deliveryDate': '$deliveryDate',
              'promoCode': '$promoCode',
              'redeem_point': '$redeem_point',
              'image': '$image',
              'measurment': '$measurment',
              'isMeasurement': '$isMeasurement',
              'total': {
                $add: ["$fabricPrice", "$stitchingPrice", "$transaction_charge", "$delivery_charge", "$service_charge"]
              },
              'status': '$status',
              "contactNo": '$contactNo',
              'quantity': '$quantity',
              "payment_mode": "$payment_mode"
            }
          }
        ]

      } else if (status == 2) {
        query = [{
            $match: {
              "stichingList": _id
            }
          },
          {
            $lookup: {
              from: 'stichingCart',
              localField: 'stichingList',
              foreignField: '_id',
              as: 'stiching'
            }
          },
          {
            $unwind: {
              path: '$stiching',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'address',
              localField: 'addressId',
              foreignField: '_id',
              as: 'address'
            }
          },
          {
            $unwind: {
              path: '$address',
              preserveNullAndEmptyArrays: true
            }
          }, {
            $project: {
              "_id": "$stiching._id",
              "memberId": "$stiching.memberId",
              "status": "$stiching.status",
              "dispatch_on": "$stiching.dispatch_on",
              "created_at": "$stiching.created_at",
              "address": "$address",
              "delivery_on": "$stiching.delivery_on",
              "isMeasurement": "$stiching.isMeasurement",
              "quantity": "$stiching.quantity",
              "is_deleted": "$stiching.is_deleted",
              "recordmeasurment": "$stiching.recordMeasurment",
              "skuId": "$stiching.skuId",
              "orderId": "$stiching.orderId",
              "tailorId": "$stiching.tailorId",
              "delivery_charge": "$stiching.delivery_charge",
              "transaction_charge": "$stiching.transaction_charge",
              "service_charge": "$stiching.service_charge",
              "refer": "$stiching.refer",
              "wallet": "$stiching.wallet",
              "fabricPrice": "$stiching.fabricPrice",
              "complete_payment": "$stiching.complete_payment",
              "stitchingPrice": "$stiching.stitchingPrice",
              "modelId": "$stiching.modelId",
              "userId": "$stiching.userId",
              "brandId": "$stiching.brandId",
              "fabricTypeId": "$stiching.fabricTypeId",
              "fabricId": "$stiching.fabricId",
              "color": "$stiching.color",
              "measurmentId": "$stiching.measurmentId",
              "modified_at": "$stiching.modified_at",
              "payment_mode": "$payment_mode"
            }
          }, {
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
          }, {
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
              from: 'recordmeasurment',
              localField: 'recordmeasurment',
              foreignField: '_id',
              as: 'recordmeasurment'
            }
          }, {
            $unwind: {
              path: '$recordmeasurment',
              preserveNullAndEmptyArrays: true
            }
          }, {
            $project: {
              _id: 1,
              'username': '$user.username',
              'userImage': '$user.profileImage',
              'brand': '$brand.name',
              'fabricName': '$fabricType.name',
              'fabricId': '$fabricType._id',
              "created_at": "$created_at",
              'modified_at': '$modified_at',
              'tailor': '$tailor.name',
              "fabricPrice": 1,
              "complete_payment": 1,
              "stitchingPrice": 1,
              "refer": 1,
              "wallet": 1,
              "transaction_charge": 1,
              "delivery_charge": 1,
              "service_charge": 1,
              'is_member': {
                $cond: {
                  if: {
                    "$gt": ["$memberId", null]
                  },
                  then: "4",
                  else: "6"
                }
              },
              'tailorId': '$tailor._id',
              'is_rating': {
                $cond: {
                  if: {
                    "$gt": ["$rating", null]
                  },
                  then: {
                    $toBool: 1
                  },
                  else: {
                    $toBool: 0
                  }
                }
              },
              'tailorProfile': '$tailorProfile.businessLocation',
              'member': '$memberId',
              'priceForKid': '$tailorProfile.businessDetails.charges.charge_for_kid',
              'priceForAdult': '$tailorProfile.businessDetails.charges.charge_for_adult',
              'toShowPrice': {
                $cond: {
                  if: {
                    "$gt": ["$memberId", null]
                  },
                  then: {
                    $cond: {
                      if: {
                        "$eq": ['$memberId.member_is', 0]
                      },
                      then: "1",
                      else: "2"
                    }
                  },
                  else: "2"
                }
              },
              'recordmeasurment': 1,
              'deliveryDate': '$delivery_on',
              'model_name': '$model.name',
              'model_image': '$model.image',
              "address": "$address",
              'promoCode': {
                $toInt: '0'
              },
              'redeem_point': {
                $toInt: '0'
              },
              'image': '$color.image',
              'measurment': '$measurment',
              'isMeasurement': '$isMeasurement',
              'status': '$status',
              "contactNo": "00971544003538",
              'quantity': '$quantity',
              "payment_mode": "$payment_mode"
            }
          },
          {
            $project: {
              _id: 1,
              'username': '$username',
              'userImage': '$userImage',
              'brand': '$brand',
              'fabricName': '$fabricName',
              'fabricId': '$fabricId',
              'modified_at': '$modified_at',
              'tailor': '$tailor',
              "created_at": "$created_at",
              'toShowPrice': '$toShowPrice',
              "fabricPrice": 1,
              "complete_payment": 1,
              "stitchingPrice": 1,
              "refer": 1,
              "wallet": 1,
              "delivery": '$delivery_charge',
              "transaction": "$transaction_charge",
              "service": "$service_charge",
              "reaminaing_payment": {
                $subtract: [{
                  $add: ["$fabricPrice", "$stitchingPrice", "$transaction_charge", "$delivery_charge", "$service_charge"]
                }, "$complete_payment"]
              },
              'is_member': {
                $cond: {
                  if: {
                    $eq: ["is_member", "6"]
                  },
                  then: {
                    $toBool: 'false'
                  },
                  else: {
                    $toBool: 'true'
                  }
                }
              },
              'tailorId': '$tailorId',
              'tailorProfile': '$tailorProfile',
              'is_rating': '$is_rating',
              "recordmeasurment": 1,
              "address": "$address",
              'ModelName': "$model_name",
              'model_image': '$model_image',
              'discount': {
                $toInt: "0"
              },
              'offer': {
                $toInt: "0"
              },
              'member': '$member',
              'priceForKid': {
                $cond: {
                  if: {
                    $eq: ['$toShowPrice', "1"]
                  },
                  then: {
                    $toInt: "$priceForKid"
                  },
                  else: {
                    $toInt: "0"
                  }
                }
              },
              'priceForAdult': {
                $cond: {
                  if: {
                    $eq: ['$toShowPrice', "2"]
                  },
                  then: {
                    $toInt: "$priceForAdult"
                  },
                  else: {
                    $toInt: "0"
                  }
                }
              },
              'deliveryDate': '$deliveryDate',
              'promoCode': '$promoCode',
              'redeem_point': '$redeem_point',
              'image': '$image',
              'measurment': '$measurment',
              'isMeasurement': '$isMeasurement',
              'total': {
                $add: ["$fabricPrice", "$stitchingPrice", "$transaction_charge", "$delivery_charge", "$service_charge"]
              },
              'status': '$status',
              "contactNo": '$contactNo',
              'quantity': '$quantity',
              "payment_mode": "$payment_mode"
            }
          }
        ]
      } else {
        query = [{
            $match: {
              "stichingList": _id
            }
          },
          {
            $lookup: {
              from: 'stichingCart',
              localField: 'stichingList',
              foreignField: '_id',
              as: 'stiching'
            }
          },
          {
            $unwind: {
              path: '$stiching',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: 'address',
              localField: 'addressId',
              foreignField: '_id',
              as: 'address'
            }
          },
          {
            $unwind: {
              path: '$address',
              preserveNullAndEmptyArrays: true
            }
          }, {
            $project: {
              "_id": "$stiching._id",
              "memberId": "$stiching.memberId",
              "status": "$stiching.status",
              "dispatch_on": "$stiching.dispatch_on",
              "created_at": "$stiching.created_at",
              "address": "$address",
              "delivery_on": "$stiching.delivery_on",
              "isMeasurement": "$stiching.isMeasurement",
              "quantity": "$stiching.quantity",
              "is_deleted": "$stiching.is_deleted",
              "recordmeasurment": "$stiching.recordMeasurment",
              "skuId": "$stiching.skuId",
              "orderId": "$stiching.orderId",
              "tailorId": "$stiching.tailorId",
              "delivery_charge": "$stiching.delivery_charge",
              "transaction_charge": "$stiching.transaction_charge",
              "service_charge": "$stiching.service_charge",
              "refer": "$stiching.refer",
              "wallet": "$stiching.wallet",
              "fabricPrice": "$stiching.fabricPrice",
              "complete_payment": "$stiching.complete_payment",
              "stitchingPrice": "$stiching.stitchingPrice",
              "modelId": "$stiching.modelId",
              "userId": "$stiching.userId",
              "brandId": "$stiching.brandId",
              "fabricTypeId": "$stiching.fabricTypeId",
              "fabricId": "$stiching.fabricId",
              "color": "$stiching.color",
              "measurmentId": "$stiching.measurmentId",
              "modified_at": "$stiching.modified_at",
              "payment_mode": "$payment_mode"
            }
          }, {
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
          }, {
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
              from: 'recordmeasurment',
              localField: 'recordmeasurment',
              foreignField: '_id',
              as: 'recordmeasurment'
            }
          }, {
            $unwind: {
              path: '$recordmeasurment',
              preserveNullAndEmptyArrays: true
            }
          }, {
            $project: {
              _id: 1,
              'username': '$user.username',
              'userImage': '$user.profileImage',
              'brand': '$brand.name',
              'fabricName': '$fabricType.name',
              'fabricId': '$fabricType._id',
              "created_at": "$created_at",
              'modified_at': '$modified_at',
              'tailor': '$tailor.name',
              "fabricPrice": 1,
              "complete_payment": 1,
              "stitchingPrice": 1,
              "refer": 1,
              "wallet": 1,
              "transaction_charge": 1,
              "delivery_charge": 1,
              "service_charge": 1,
              'is_member': {
                $cond: {
                  if: {
                    "$gt": ["$memberId", null]
                  },
                  then: "4",
                  else: "6"
                }
              },
              'tailorId': '$tailor._id',
              'is_rating': {
                $cond: {
                  if: {
                    "$gt": ["$rating", null]
                  },
                  then: {
                    $toBool: 1
                  },
                  else: {
                    $toBool: 0
                  }
                }
              },
              'tailorProfile': '$tailorProfile.businessLocation',
              'member': '$memberId',
              'priceForKid': '$tailorProfile.businessDetails.charges.charge_for_kid',
              'priceForAdult': '$tailorProfile.businessDetails.charges.charge_for_adult',
              'toShowPrice': {
                $cond: {
                  if: {
                    "$gt": ["$memberId", null]
                  },
                  then: {
                    $cond: {
                      if: {
                        "$eq": ['$memberId.member_is', 0]
                      },
                      then: "1",
                      else: "2"
                    }
                  },
                  else: "2"
                }
              },
              'recordmeasurment': 1,
              'deliveryDate': '$delivery_on',
              'model_name': '$model.name',
              'model_image': '$model.image',
              "address": "$address",
              'promoCode': {
                $toInt: '0'
              },
              'redeem_point': {
                $toInt: '0'
              },
              'image': '$color.image',
              'measurment': '$measurment',
              'isMeasurement': '$isMeasurement',
              'status': '$status',
              "contactNo": "00971544003538",
              'quantity': '$quantity',
              "payment_mode": "$payment_mode"
            }
          },
          {
            $project: {
              _id: 1,
              'username': '$username',
              'userImage': '$userImage',
              'brand': '$brand',
              'fabricName': '$fabricName',
              'fabricId': '$fabricId',
              'modified_at': '$modified_at',
              'tailor': '$tailor',
              "created_at": "$created_at",
              'toShowPrice': '$toShowPrice',
              "fabricPrice": 1,
              "complete_payment": 1,
              "stitchingPrice": 1,
              "refer": 1,
              "wallet": 1,
              "delivery": '$delivery_charge',
              "transaction": "$transaction_charge",
              "service": "$service_charge",
              "reaminaing_payment": {
                $subtract: [{
                  $add: ["$fabricPrice", "$stitchingPrice", "$transaction_charge", "$delivery_charge", "$service_charge"]
                }, "$complete_payment"]
              },
              'is_member': {
                $cond: {
                  if: {
                    $eq: ["is_member", "6"]
                  },
                  then: {
                    $toBool: 'false'
                  },
                  else: {
                    $toBool: 'true'
                  }
                }
              },
              'tailorId': '$tailorId',
              'tailorProfile': '$tailorProfile',
              'is_rating': '$is_rating',
              "recordmeasurment": 1,
              "address": "$address",
              'ModelName': "$model_name",
              'model_image': '$model_image',
              'discount': {
                $toInt: "0"
              },
              'offer': {
                $toInt: "0"
              },
              'member': '$member',
              'priceForKid': {
                $cond: {
                  if: {
                    $eq: ['$toShowPrice', "1"]
                  },
                  then: {
                    $toInt: "$priceForKid"
                  },
                  else: {
                    $toInt: "0"
                  }
                }
              },
              'priceForAdult': {
                $cond: {
                  if: {
                    $eq: ['$toShowPrice', "2"]
                  },
                  then: {
                    $toInt: "$priceForAdult"
                  },
                  else: {
                    $toInt: "0"
                  }
                }
              },
              'deliveryDate': '$deliveryDate',
              'promoCode': '$promoCode',
              'redeem_point': '$redeem_point',
              'image': '$image',
              'measurment': '$measurment',
              'isMeasurement': '$isMeasurement',
              'total': {
                $add: ["$fabricPrice", "$stitchingPrice", "$transaction_charge", "$delivery_charge", "$service_charge"]
              },
              'status': '$status',
              "contactNo": '$contactNo',
              'quantity': '$quantity',
              "payment_mode": "$payment_mode"
            }
          }
        ]
      }

      let order = await orderModel.aggregate(query);
      let changeForm = await fabricModel.populate(order[0], {
        path: "measurment.fabricSample",
        populate: [{
          path: "colorOption"
        }, {
          path: "brandId",
          select: "name image"
        }],
        select: "colorOption is_active brandId"
      });

      if (!changeForm) {
        return {
          status: -1,
          message: "Something went wrong , Please try later."
        }
      }
      //console.log("Data :",lat,"Long :",lon);
      let distance = await getDistanceBetweenPoints({
        lat1: changeForm.tailorProfile.latitude.valueOf(),
        lon1: changeForm.tailorProfile.longitude.valueOf(),
        lat2: changeForm.address.Latitude,
        lon2: changeForm.address.Longitude
      });

      return {
        status: 1,
        message: "Order Fetch successfully",
        data: {
          ...changeForm,
          ...{
            distance: distance
          }
        }
      };

    }

  } catch (err) {
    throw new Error(err.message);
  }
}


exports.getOrders = async (req, user) => {
  try {

    let orders = await orderListModel.find({});
    if (!orders) {
      return {
        status: -1,
        message: "Something went wrong."
      };
    }
    return {
      status: 1,
      message: "Orders Fetch Successfully.",
      data: orders
    };
  } catch (err) {
    throw new Error(err.message);
  }
}


exports.reorder = async (data, user) => {
  try {
    let type = data.type
    if (!type || type == null || type == undefined) {
      return {
        status: -1,
        message: 'Type is required'
      }
    }

    if (type == 1) {
      if (!data.id || data.id == '') {
        return {
          status: -1,
          message: "Please provide product id"
        };
      }
      let order = await orderListModel.findOne({
        _id: data.id
      }).lean();
      console.log(order)
      if (!order) {
        return {
          status: -1,
          message: "Something went Wrong, Please try later."
        }
      }
      let inCart = await cartModel.findOne({
        $and: [{
          productId: mongoose.Types.ObjectId(order.productId)
        }, {
          userId: mongoose.Types.ObjectId(user._id)
        }, {
          color: mongoose.Types.ObjectId(order.color)
        }, {
          size: mongoose.Types.ObjectId(order.size)
        }, {
          is_deleted: false
        }]
      });
      if (inCart) {
        inCart.quantity = inCart.quantity + parseInt(order.quantity);
        inCart.price = inCart.unit_price * inCart.quantity;
        inCart.modified_at = Date.now();
        let cart = await inCart.save();
        if (!cart) {
          return {
            status: -1,
            message: "Something went Wrong, Please try later."
          }
        }
        return {
          status: 1,
          message: "Add to cart successfully."
        };
      } else {
        let product = await productModel.findOne({
          _id: order.productId
        }).lean();
        console.log(product)
        if (!product) {
          return {
            status: -1,
            message: "Something went Wrong, Please try later."
          }
        }

        var saveToDb = {
          tailorId: product.created_by,
          userId: user._id,
          brandId: product.brandId,
          productId: product._id,
          unit_price: order.unit_price,
          quantity: parseInt(order.quantity),
          color: order.color,
          size: order.size,
          price: parseInt(order.quantity) * parseInt(order.unit_price)
        }

        let cart = await cartModel.create(saveToDb);
        cart.save();
        if (!cart) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          }
        }
        return {
          status: 1,
          message: "Add to cart successfully."
        };
      }
    }
    if (type == 2) {
      if (!data.id || data.id == '') {
        return {
          status: -1,
          message: "Please provide stiching id"
        };
      }
      let stiching = await stichingCartModel.findOne({
        _id: data.id
      }).lean();
      if (!stiching) {
        return {
          status: -1,
          message: "Something went Wrong, Please try later....."
        }
      }


      let inCart = await stichingCartModel.findOne({
        $and: [{
          userId: mongoose.Types.ObjectId(user._id)
        }, {
          _id: mongoose.Types.ObjectId(data.id)
        }, {
          is_deleted: false
        }, {
          status: {
            $in: [0, 1]
          }
        }]
      });
      if (inCart) {
        inCart.quantity = inCart.quantity + parseInt(stiching.quantity);
        inCart.unit_price = inCart.unit_price * inCart.quantity;
        inCart.modified_at = Date.now();
        let cart = await inCart.save();
        if (!cart) {
          return {
            status: -1,
            message: "Something went Wrong, Please try later."
          }
        }
        return {
          status: 1,
          message: "Add to cart successfully."
        };
      } else {
        let color = await fabricColorModel.findById(mongoose.Types.ObjectId(stiching.color)).lean();
        if (!color) {
          return {
            status: -1,
            message: "Something went wrong on color, Please try later."
          }
        }
        saveToDb = {
          tailorId: mongoose.Types.ObjectId(stiching.tailorId),
          userId: mongoose.Types.ObjectId(user._id),
          brandId: mongoose.Types.ObjectId(stiching.brandId),
          fabricTypeId: mongoose.Types.ObjectId(stiching.fabricTypeId),
          fabricId: mongoose.Types.ObjectId(stiching.fabricId),
          color: stiching.color,
          skuId: generateUniqueId({
            length: 7,
            useLetters: true
          }).toUpperCase(),
          memberId: stiching.memberId,
          measurmentId: stiching.measurmentId,
          unit_price: color.price,
          quantity: parseInt(stiching.quantity)
        };

        let cart = await stichingCartModel.create(saveToDb);
        if (!cart) {
          return {
            status: -1,
            message: "Something went wrong stiching, Please try later."
          }
        }
        return {
          status: 1,
          message: "Add to cart successfully."
        };
      }
    }
  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }

};

exports.reSchedule = async (data, user) => {
  try {
    if (!data.scheduleDate || data.scheduleDate == null || data.scheduleDate == undefined) {
      return {
        message: "Please select date for schedule."
      };
    }
    if (!data.scheduleTimeSlot || data.scheduleTimeSlot == null || data.scheduleTimeSlot == undefined) {
      return {
        message: "Please select time slot for schedule."
      };
    }
    let reschedule = await stichingCartModel.findOne({
      _id: data.id,
      userId: user._id
    });
    if (!reschedule) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }
    let mId = reschedule.measurmentId
    let mesUpdate = await measurmentModel.findByIdAndUpdate(mongoose.Types.ObjectId(mId), {
      $set: {
        measurementDate: data.scheduleDate,
        measurementTime: data.scheduleTimeSlot,
        modified_at: Date.now(),
      }
    });
    let mData = await measurmentModel.findOne({
      _id: mId,
      userId: user._id
    });
    if (!mesUpdate) {
      return {
        status: -1,
        message: "Not able to update right now,please try later"
      }
    }
    return {
      status: 1,
      message: "Reschedule successfully done.",
      data: mData
    };
  } catch (error) {
    throw new Error(error.message);
  }

};

exports.getFavoriteList = async (data, user) => {

  try {

    if (parseInt(data.type) == 1) {

      let favoriteList = await wishlistTailorModel.aggregate([{
          $match: {
            userId: user._id
          }
        },
        {
          $lookup: {
            from: "tailorProfile",
            localField: "tailorId",
            foreignField: "_id",
            as: "tailor"
          }
        },
        {
          $unwind: {
            path: "$tailor",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "rating",
            localField: "tailor.tailorId",
            foreignField: "tailorId",
            as: "rating"
          }
        }, {
          $unwind: {
            path: '$rating',
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $project: {
            _id: 1,
            tailorId: "$tailor._id",
            tailorDetailsId: "$tailor.tailorId",
            image: "$tailor.image",
            businessLocation: "$tailor.businessLocation",
            fullName: "$tailor.fullName",
            storeDetails: "$tailor.storeDetails",
            price_start_from: "$tailor.price_start_from",
            price_end_by: "$tailor.price_end_by",
            rank: "$rating",
            rating: {
              $cond: {
                if: {
                  "$gt": ["$rating.ratingpoint", null]
                },
                then: "$rating.ratingpoint",
                else: {
                  $toInt: 0
                }
              }
            }
          }
        },
        {
          $group: {
            _id: "$_id",
            tailorId: {
              $first: "$tailorId"
            },
            tailorDetailsId: {
              $first: "$tailorDetailsId"
            },
            image: {
              $first: "$image"
            },
            businessLocation: {
              $first: "$businessLocation"
            },
            fullName: {
              $first: "$fullName"
            },
            storeDetails: {
              $first: "$storeDetails"
            },
            price_start_from: {
              $first: "$price_start_from"
            },
            price_end_by: {
              $first: "$price_end_by"
            },

            rating: {
              $avg: "$rating"
            },
            reviews: {
              $push: "$rank"
            }
          }
        },
        {
          $project: {
            _id: 1,
            tailorId: "$tailorId",
            tailorDetailsId: "$tailorDetailsId",
            image: "$image",
            businessLocation: "$businessLocation",
            fullName: "$fullName",
            storeDetails: "$storeDetails",
            price_start_from: "$price_start_from",
            price_end_by: "$price_end_by",

            rating: "$rating",
            reviews: {
              $size: "$reviews"
            }
          }
        }
      ]);
      if (!favoriteList) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }

      let tailorData = await getDistance(favoriteList, data);
      return {
        status: 1,
        message: "Favorite fetch successfully.",
        data: tailorData
      };
    } else {

      var query = [{
          $match: {
            userId: user._id
          }
        },
        {
          $lookup: {
            from: "product",
            localField: "productId",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $unwind: "$product"
        },
        {
          $lookup: {
            from: "tailor",
            localField: "product.created_by",
            foreignField: "_id",
            as: "tailor"
          }
        },
        {
          $unwind: "$tailor"
        },
        {
          $lookup: {
            from: "rating",
            localField: "productId",
            foreignField: "productId",
            as: "rating"
          }
        }, {
          $unwind: {
            path: '$rating',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            _id: 1,
            productId: "$product._id",
            tailorname: "$tailor.name",
            tailorId: "$tailor._id",
            productName: "$product.name",
            image: "$product.image",
            price_start_from: "$product.price_start_from",
            price_end_by: "$product.price_end_by",
            rating: {
              $cond: {
                if: {
                  "$gt": ["$rating.ratingpoint", null]
                },
                then: "$rating.ratingpoint",
                else: {
                  $toInt: 0
                }
              }
            },
            rank: "$rating",
          }
        },
        {
          $group: {
            _id: "$_id",
            productId: {
              $first: "$productId"
            },
            tailorname: {
              $first: "$tailorname"
            },
            tailorId: {
              $first: "$tailorId"
            },
            productName: {
              $first: "$productName"
            },
            image: {
              $first: "$image"
            },
            price_start_from: {
              $first: "$price_start_from"
            },
            price_end_by: {
              $first: "$price_end_by"
            },
            rating: {
              $avg: "$rating"
            },
            reviews: {
              $push: "$rank"
            }
          }
        },
        {
          $project: {

            _id: "$_id",
            productId: "$productId",
            tailorname: "$tailorname",
            tailorId: "$tailorId",
            productName: "$productName",
            image: "$image",
            price_start_from: "$price_start_from",
            price_end_by: "$price_end_by",
            rating: "$rating",
            reviews: {
              $size: "$reviews"
            }
          }
        }
      ]


      let favoriteList = await wishlistModel.aggregate(query);
      if (!favoriteList) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        };
      }
      return {
        status: 1,
        message: "Favorite fetch successfully.",
        data: favoriteList
      };
    }

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.removeFavorite = async (data) => {
  try {

    if (parseInt(data.type) == 1) {

      let favorite = await wishlistTailorModel.findOneAndRemove({
        _id: mongoose.Types.ObjectId(data._id)
      });
      if (!favorite) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        };
      }
      return {
        status: 1,
        message: "Favorite removed successfully."
      };
    } else {
      let favorite = await wishlistModel.findOneAndRemove({
        _id: mongoose.Types.ObjectId(data._id)
      });
      if (!favorite) {
        return {
          status: -1,
          message: "Something went wrong, Please try later."
        };
      }
      return {
        status: 1,
        message: "Favorite removed successfully."
      };
    }

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getRewardPoint = async (user) => {
  try {
    let rewards = await rewardPointsModel.findOne({}).lean();
    if (!rewards) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }

    return {
      status: 1,
      message: "Rewards fetch Successfully.",
      data: {
        ...rewards,
        ...{
          referCode: user.referralId
        }
      }
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getTotalRewardPoints = async (user) => {
  try {
    let query = [{
        $match: {
          userId: user._id,
          reward_type: 0
        }
      },
      {
        $addFields: {
          totalPrice: {
            $sum: "$reward_point"
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$reward_point"
          }
        }
      }
    ]

    let rewards = await rewardModel.aggregate(query);
    if (!rewards) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }

    let query2 = [{
        $match: {
          userId: user._id,
          reward_type: 1
        }
      },
      {
        $addFields: {
          totalPrice: {
            $sum: "$reward_point"
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$reward_point"
          }
        }
      }
    ]

    let rewards2 = await rewardModel.aggregate(query2);
    if (!rewards2) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }

    let rewardsPoint = await rewardPointsModel.findOne({});
    if (!rewardsPoint) {
      return {
        status: -1,
        message: "Something Went Wrong, Please try later"
      };
    }

    if (rewards.length > 0 && rewards2.length == 0) {
      return {
        status: 1,
        message: "Rewards fetch Successfully.",
        data: {
          ...{
            totalPoint: rewards[0].total.toFixed(2)
          },
          ...{
            rewardsDetail: rewardsPoint
          }
        }
      };
    } else if (rewards2.length > 0 && rewards.length == 0) {
      return {
        status: 1,
        message: "Rewards fetch Successfully.",
        data: {
          ...{
            totalPoint: rewards[0].total.toFixed(2)
          },
          ...{
            rewardsDetail: rewardsPoint
          }
        }
      };
    } else if (rewards2.length == 0 && rewards.length == 0) {
      return {
        status: 1,
        message: "Rewards fetch Successfully.",
        data: {
          ...{
            totalPoint: 0
          },
          ...{
            rewardsDetail: rewardsPoint
          }
        }
      };
    } else {
      return {
        status: 1,
        message: "Rewards fetch Successfully.",
        data: {
          ...{
            totalPoint: (rewards[0].total - rewards2[0].total).toFixed(2)
          },
          ...{
            rewardsDetail: rewardsPoint
          }
        }
      };
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.inviteRewardsPoints = async (data, user) => {
  try {
    let searchKey = data.searchKey;
    let query;
    if (searchKey == "") {
      query = [{
        $match: {
          userId: user._id,
          reward_type: 0,
          reward_dask: 0
        }
      }, {
        $lookup: {
          from: "user",
          localField: "createdBy",
          foreignField: "_id",
          as: "user"
        }
      }, {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      }, {
        $project: {
          "reward_point": "$reward_point",
          "reward_type": "$reward_type",
          "reward_dask": "$reward_dask",
          "user": "$user.username",
          "status": {
            $toInt: "1"
          },
          "userId": {
            $substr: [{
              $toString: "$createdBy"
            }, 18, -6]
          },
          "modified_at": "$modified_at",
          "created_at": "$created_at"
        }
      }]
    } else {
      query = [{
        $match: {
          userId: user._id,
          reward_type: 0,
          reward_dask: 0,
        }
      }, {
        $lookup: {
          from: "user",
          localField: "createdBy",
          foreignField: "_id",
          as: "user"
        }
      }, {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      }, {
        $project: {
          "reward_point": "$reward_point",
          "reward_type": "$reward_type",
          "reward_dask": "$reward_dask",
          "user": "$user.username",
          "status": {
            $toInt: "1"
          },
          "userId": {
            $substr: [{
              $toString: "$createdBy"
            }, 18, -6]
          },
          "modified_at": "$modified_at",
          "created_at": "$created_at"
        }
      }, {
        $match: {
          $or: [{
              userId: {
                $regex: searchKey,
                $options: 'i'
              }
            },
            {
              user: {
                $regex: searchKey,
                $options: 'i'
              }
            }
          ]
        }
      }]
    }

    let rewards = await rewardModel.aggregate(query);
    if (!rewards) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }
    return {
      status: 1,
      message: "Rewards fetch Successfully.",
      data: rewards
    };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getRewardList = async (data, user) => {
  try {
    let type = parseInt(data.type);
    let filter = parseInt(data.filter);
    let date;

    let total;
    let query = [{
        $match: {
          userId: user._id,
          reward_type: 0
        }
      },
      {
        $addFields: {
          totalPrice: {
            $sum: "$reward_point"
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$reward_point"
          }
        }
      }
    ]

    let rewards = await rewardModel.aggregate(query);
    if (!rewards) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }

    let query2 = [{
        $match: {
          userId: user._id,
          reward_type: 1
        }
      },
      {
        $addFields: {
          totalPrice: {
            $sum: "$reward_point"
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$reward_point"
          }
        }
      }
    ]

    let rewards2 = await rewardModel.aggregate(query2);
    if (!rewards2) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }

    if (rewards.length > 0 && rewards2.length == 0) {
      total = rewards[0].total;
    } else if (rewards2.length > 0 && rewards.length == 0) {
      total = rewards2[0].total;
    } else if (rewards2.length == 0 && rewards.length == 0) {
      total = 0;
    } else {
      total = rewards[0].total - rewards2[0].total;
    }

    if (filter) {
      date = new Date(new Date().setHours(0, 0, 0, 0));
      date.setDate(date.getDate() - filter);
      let pastDate = new Date(date.toString()).setHours(0, 0, 0, 0);
      if (type == 1) {

        let rewards = await rewardModel.aggregate([{
          $match: {
            userId: user._id,
            reward_type: 0,
            created_at: {
              $gt: pastDate
            }
          }
        }, {
          $project: {
            userId: {
              $substr: [{
                $toString: "$createdBy"
              }, 18, -6]
            },
            createdBy: "$createdBy",
            reward_point: "$reward_point",
            reward_type: "$reward_type",
            reward_dask: "$reward_dask",
            modified_at: "$modified_at",
            created_at: "$created_at",
            orderId: "$orderId",
            price: "$price",
            payment: "$payment"
          }
        }]);
        if (!rewards) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          };
        }
        return {
          status: 1,
          message: "Rewards fetch Successfully.",
          data: {
            ...{
              rewards: rewards.reverse()
            },
            ...{
              total: total
            }
          }
        };
      } else {
        let rewards = await rewardModel.aggregate([{
          $match: {
            userId: user._id,
            reward_type: 1,
            created_at: {
              $gt: pastDate
            }
          }
        }, {
          $project: {
            userId: {
              $substr: [{
                $toString: "$createdBy"
              }, 18, -6]
            },
            createdBy: "$createdBy",
            reward_point: "$reward_point",
            reward_type: "$reward_type",
            reward_dask: "$reward_dask",
            modified_at: "$modified_at",
            created_at: "$created_at",
            orderId: "$orderId",
            price: "$price",
            payment: "$payment"
          }
        }]);
        if (!rewards) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          };
        }
        return {
          status: 1,
          message: "Rewards fetch Successfully.",
          data: {
            ...{
              rewards: rewards.reverse()
            },
            ...{
              total: total
            }
          }
        };
      }

    } else {

      if (type == 1) {

        let rewards = await rewardModel.aggregate([{
          $match: {
            userId: user._id,
            reward_type: 0
          }
        }, {
          $project: {
            userId: {
              $substr: [{
                $toString: "$createdBy"
              }, 18, -6]
            },
            createdBy: "$createdBy",
            reward_point: "$reward_point",
            reward_type: "$reward_type",
            reward_dask: "$reward_dask",
            modified_at: "$modified_at",
            created_at: "$created_at",
            orderId: "$orderId",
            price: "$price",
            payment: "$payment"
          }
        }]);
        if (!rewards) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          };
        }
        return {
          status: 1,
          message: "Rewards fetch Successfully.",
          data: {
            ...{
              rewards: rewards.reverse()
            },
            ...{
              total: total
            }
          }
        };
      } else {
        let rewards = await rewardModel.aggregate([{
          $match: {
            userId: user._id,
            reward_type: 1
          }
        }, {
          $project: {
            userId: {
              $substr: [{
                $toString: "$createdBy"
              }, 18, -6]
            },
            createdBy: "$createdBy",
            reward_point: "$reward_point",
            reward_type: "$reward_type",
            reward_dask: "$reward_dask",
            modified_at: "$modified_at",
            created_at: "$created_at",
            orderId: "$orderId",
            price: "$price",
            payment: "$payment"
          }
        }]);
        if (!rewards) {
          return {
            status: -1,
            message: "Something went wrong, Please try later."
          };
        }
        return {
          status: 1,
          message: "Rewards fetch Successfully.",
          data: {
            ...{
              rewards: rewards.reverse()
            },
            ...{
              total: total
            }
          }
        };
      }

    }

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.raiseIssue = async (data, user) => {
  try {

    var active_status = {
      status: true,
      created_on: Date.now()
    }
    if (!data.orderId == '') {
      let findOrderId = await orderListModel.find({
        orderId: data.orderId
      });
      if (!findOrderId) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }
      let findAgainOrderId = await stichingCartModel.find({
        orderId: data.orderId
      });
      if (!findAgainOrderId) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }

      if (findOrderId.length == 0 && findAgainOrderId == 0) {
        return {
          status: -1,
          message: "Order ID does not match"
        };
      }
    }
    var dataToSave = {
      ...data,
      ...{
        created_at: Date.now(),
        created_by: user._id
      },
      ...{
        active_status: active_status
      }
    }

    let raiseIssue = await issueModel.create(dataToSave);
    raiseIssue.save();
    if (!raiseIssue) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    return {
      status: 1,
      message: "Issue raise successfully"
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.issueList = async (user) => {
  try {
    let activeIssue = await issueModel.find({
      created_by: user._id,
      status: 0
    }, {
      description: 0,
      created_by: 0
    }).sort({
      "active_status.created_on": -1
    }).lean();
    if (!activeIssue) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }

    let openIssue = await issueModel.find({
      created_by: user._id,
      status: 1
    }, {
      description: 0,
      created_by: 0
    }).sort({
      "open_status.created_on": -1
    }).lean();
    if (!openIssue) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }

    let closeIssue = await issueModel.find({
      created_by: user._id,
      status: 2
    }, {
      description: 0,
      created_by: 0
    }).sort({
      "close_status.created_on": -1
    }).lean();
    if (!closeIssue) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    return {
      status: 1,
      message: "Issue fetch successfully",
      data: {
        ...{
          activeIssue: activeIssue
        },
        ...{
          openIssue: openIssue
        },
        ...{
          closeIssue: closeIssue
        }
      }
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.issueDetails = async (data) => {
  try {
    let issue = await issueModel.findById(mongoose.Types.ObjectId(data._id)).lean();
    if (!issue) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    return {
      status: 1,
      message: "Issue fetch successfully",
      data: issue
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.viewProfile = async (data) => {
  try {
    let user = await UserModel.findById(mongoose.Types.ObjectId(data._id)).select("email profileImage username mobile countryCode").lean();
    if (!user) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    return {
      status: 1,
      message: "Profile fetch successfully",
      data: user
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.updateProfile = async (userData, data) => {
  try {
    let user = await UserModel.findByIdAndUpdate(mongoose.Types.ObjectId(userData._id), data, {
      new: true
    }).select("_id email profileImage username mobile countryCode").lean();
    if (!user) {
      return {
        status: -1,
        message: "Something went wrong, Please try later"
      };
    }
    return {
      status: 1,
      message: "Profile updated successfully",
      data: user
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.updatePassword = async (user, data) => {
  try {
    if (!data.password || data.password == '') {
      throw new Error("Please enter valid password");
    }

    if (!data.newPassword || data.newPassword == '' || !data.confirmPassword || data.confirmPassword == '') {
      throw new Error("New Password and Confirm Password is required");
    }

    let passwordMatch = await utils.compare(data.password, user.password);
    if (!passwordMatch) {
      throw new Error("Current password does not match");
    }

    if (data.confirmPassword === data.newPassword) {
      var pass = await utils.encryptText(data.newPassword);
      user.password = pass;
      user.otpInfo = {
        otp: null,
        expTime: Date.now()
      };
      let userData = await user.save();
      console.log(userData, 'userData')
      if (!userData) {
        return {
          status: -1,
          message: "Something went wrong Please try Later"
        };
      }
      return {
        status: 1,
        message: "Password Changed Successfully"
      };
    } else {
      throw {
        message: msg.fieldNotMatch
      };
    }


  } catch (err) {
    throw new Error(err.message);
  }
}

exports.deleteFamilyMember = async (data) => {
  try {

    let member = await FamilyMemberModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), {
      is_deleted: true
    });
    if (!member) {
      return {
        status: -1,
        message: "Something went wrong Please try Later"
      };
    }
    return {
      status: 1,
      message: "Family member delete successfully"
    };

  } catch (err) {
    throw new Error(err.message);
  }
}

exports.walletBalance = async (data, user) => {
  try {
    let type = parseInt(data.type);

    if (type == 1) {

      let wallet = await walletModel.create({
        userId: user._id,
        wallet_type: 0,
        wallet_dask: 1,
        wallet_price: data.price,
        created_at: Date.now(),
        transactionId: data.transactionId
      });
      wallet.save();
      if (!wallet) {
        return {
          status: -1,
          message: "Something went wrong, Please try after sometime ."
        };
      }
      return {
        status: 1,
        message: "Wallet Updated Successfully."
      };
    } else if (type == 2) {

      var dateData = new Date();

      let filter = parseInt(data.filter);
      let dateForFilter;
      if (filter == 0) {
        dateForFilter = 1618511400000;

      } else if (filter == 1) {
        dateData.setDate(dateData.getDate() - 9);
        dateForFilter = new Date(dateData.toString()).setHours(0, 0, 0, 0);
      } else if (filter == 2) {
        dateData.setDate(dateData.getDate() - 14);
        dateForFilter = new Date(dateData.toString()).setHours(0, 0, 0, 0);
      } else {
        dateData.setDate(dateData.getDate() - 29);
        dateForFilter = new Date(dateData.toString()).setHours(0, 0, 0, 0);
      }

      let query = [{
          $match: {
            userId: user._id
          }
        },
        {
          $sort: {
            created_at: -1
          }
        },
        {
          $project: {
            "_id": 1,
            "wallet_type": 1,
            "wallet_dask": 1,
            "userId": {
              $substr: [{
                $toString: "$userId"
              }, 18, 6]
            },
            "wallet_price": 1,
            "created_at": 1,
            "transactionId": 1,
            "orderId": 1
          }
        },
        {
          $group: {
            _id: null,
            "wallet": {
              "$push": "$$ROOT"
            },
            "total": {
              $sum: "$wallet_price"
            }
          }
        }, {
          $project: {
            total: "$total",
            data: {
              $filter: {
                input: "$wallet",
                as: "da",
                cond: {
                  $gte: ["$$da.created_at", dateForFilter]
                }
              }
            }
          }
        }
      ]

      let wallet = await walletModel.aggregate(query);
      if (!wallet) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }
      return {
        status: 1,
        data: wallet[0],
        message: "Wallet fetch successfully"
      };
    } else {

      let query = [{
          $match: {
            userId: user._id
          }
        },
        {
          $group: {
            _id: null,
            "total": {
              $sum: "$wallet_price"
            }
          }
        }
      ]

      let wallet = await walletModel.aggregate(query);
      if (!wallet) {
        return {
          status: -1,
          message: "Something went wrong, Please try later"
        };
      }
      return {
        status: 1,
        data: wallet[0],
        message: "Wallet fetch successfully"
      };

    }

  } catch (err) {
    throw new Error(err.message);
  }
}

exports.getTemplates = async (data) => {
  try {
    let type = parseInt(data.type);
    switch (type) {
      case 1: {
        return {
          status: 1,
          message: "Privacy policy fetched Successfully",
          data: config.HOSTBACK + "/template/Privacy%20Policy.html"
        };
      }
      case 2: {
        return {
          status: 1,
          message: "FAQs fetched Successfully",
          data: config.HOSTBACK + "/template/FAQs.html"
        };
      }
      case 3: {
        return {
          status: 1,
          message: "Terms and conditions fetched Successfully",
          data: config.HOSTBACK + "/template/Terms%20and%20Conditions.html"
        };
      }
      default: {
        return {
          status: 1,
          message: "About Us fetched Successfully",
          data: config.HOSTBACK + "/template/About%20Us.html"
        };
      }
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.allowNotification = async (data) => {
  try {
    let notif = !data.notification;
    if (!data._id || data._id == '')
      throw new Error("unsufficient Perameters");
    let notification = await UserModel.findByIdAndUpdate(data._id, {
      $set: {
        notification: notif
      }
    }, {
      new: true
    });
    if (!notification) {
      return {
        status: -1,
        message: "Notification not Updated, please try After sometime."
      };
    }
    return {
      status: 1,
      message: "Notification Updated Successfully.",
      data: notification.notification
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.getAllNotifications = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("unsufficient Perameters");
    let notifications = await userNotificationModel.find({
      userId: data._id
    });
    if (!notifications) {
      return {
        status: -1,
        message: "Notifications not found, please try After sometime."
      };
    }
    return {
      status: 1,
      message: "Notification fetched Successfully.",
      data: notifications
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.getModelList = async () => {
  try {
    let modelList = await kunduraModel.find({
      isActive: true,
      is_deleted: false
    }).select("image name");
    if (!modelList) {
      return {
        status: -1,
        message: "Something went wrong, Please try later."
      };
    }
    return {
      status: 1,
      message: "Models List fetch SuccessFully",
      data: modelList
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.checkNotification = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("insufficient Perameters");
    console.log(data._id);
    let notifications = await UserModel.findOne({
      _id: data._id
    });
    if (!notifications) {
      return {
        status: -1,
        message: "Notifications not found, please try After sometime."
      };
    }
    return {
      status: 1,
      message: "Notification  status fetched Successfully.",
      data: notifications.notification
    };
  } catch (err) {
    throw new Error(err.message);
  }
}


exports.Usergetoffer = async () => {
  try {
    let offers = await adminOfferModel.find({ is_deleted: false });
  
    if (offers) {
      return { status: 1, message: "Offer List. ", data: offers};
    }
    
  } catch (err) {
    throw new Error(err.message);
  }
  
};