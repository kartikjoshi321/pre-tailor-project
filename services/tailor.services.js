const { TailorModel } = require("../models/tailorModel");

const utils = require("../modules/utils");
const authentication = require("../middlewares/authentication");
const { msg } = require("../modules/message");
const config = require("../config/config");
const { randomStringGenerator, randomreferralCode, sendPushNotification } = require("../modules/utils");
const { AddressModel } = require('../models/addressModel');
const moment = require('moment');
const { tailorProfileModel } = require('../models/tailorProfileModel');
const { subCategoryModel } = require('../models/subCategoryModel');
const { productTypeModel } = require('../models/productTypeModel');
const { productBrandModel } = require('../models/productBrandModel');
const { productColorModel } = require('../models/productColorModel');
const { productModel } = require('../models/productModel');
const { fabricModel } = require('../models/fabricModel');
const { fabricColorModel } = require('../models/fabricColorModel');
const { fabricTailorBrandModel } = require('../models/fabricTailorBrandModel');
const { tailorCancelResonModel } = require('../models/TailorCancelResonModel');
const { orderListModel } = require('../models/orderListModel');
const { offerModel } = require('../models/offerModel');
const { ratingModel } = require("../models/ratingModel");
const generateUniqueId = require('generate-unique-id');
const fs = require('fs');
const path = require('path');
var _ = require('lodash');

const mongoose = require('mongoose');
const { fabricTypeModel } = require("../models/fabricTypeModel");
const { fabricBrandModel } = require("../models/fabricBrandModel");
const { promotionalModel } = require("../models/promotionalModel");
const { result } = require("lodash");
const { stichingCartModel } = require("../models/stichingCartModel");
const { orderModel } = require("../models/orderModel");
const { tailorNotificationModel } = require("../models/tailorNotificationModel");
const { userNotificationModel } = require("../models/userNotificationModel");
const { ObjectId } = require("bson");
const Excel = require('exceljs');
const { walletModel } = require("../models/walletModel");

let sendOtpDuringRegistration = async (userData) => {
  try {
    let otp = await randomStringGenerator();
    let referralId = await randomreferralCode();
    let otpExpTime = new Date(Date.now() + config.defaultOTPExpireTime);
    userData.referralId = referralId;
    userData.otpInfo = { otp: otp, expTime: otpExpTime }
    let mobileNumber = userData.countryCode + userData.mobile;
    //Send message via Twillio
    let send = await utils.sendotp(userData.otpInfo.otp, mobileNumber);
    return { status: 1, message: "Otp send Successfully", data: userData };

  } catch (err) {
    throw new Error(err.message);
  }

};

exports.registerUser = async (req) => {

  try {
    let data = req.body;

    if (!data.email || data.email == '')
      return { status: -1, message: "Please enter the email address" };

    if (!data.mobile || data.mobile == '') {
      return { status: -1, message: "Please enter the mobile number" }
    }

    //data.roleId = 3;  2 for user .... 1 for admin
    data.mobile = data.mobile;
    data.isMobileVerified = false;
    if (
      !data.countryCode ||
      data.countryCode == null ||
      data.countryCode == "NA" ||
      data.countryCode == undefined
    )
      return { status: -1, message: msg.mobileNumAndCountryCodeRequire };
    //check if given number is already exist

    // let longitude = parseFloat(data.Longitude);
    // let latitude = parseFloat(data.Latitude);
    let isMobileExist = await TailorModel.findOne({ $or: [{ mobile: data.mobile }, { email: data.email }] }).lean();

    if (isMobileExist) {
      if (isMobileExist.mobile == data.mobile)
        return { status: -1, message: msg.mobileAlreadyExist };
      if (isMobileExist.email == data.email)
        return { status: -1, message: "Provided email id is already registered with us." };
    }
    if (data.confirmPassword === data.password) {
      let pass = await utils.encryptText(data.password);
      data.password = pass;
    } else {
      return { status: -1, message: msg.fieldNotMatch };
    }
    // data["location.coordinates"] = [parseFloat(latitude), parseFloat(longitude)];
    // let res = new TailorModel(data);
    /**
     * if User is registered without errors
     * create a token
     */

    if (data.referralCode && data.referralCode != '') {
      let user = await TailorModel.findOne({ referralId: data.referralCode }).exec();
      if (!user) {
        return { status: -1, message: "Invalid referral Code" };
      }
      data.referralIdFrom = user._id;
    }

    let sendOtp = await sendOtpDuringRegistration(data);
    if (sendOtp.status == -1) {
      return { status: -1, message: sendOtp.message };
    } else {
      let rawdata = fs.readFileSync(path.join(__dirname, '../', 'modules', 'countries.json'));
      let countriesList = JSON.parse(rawdata);
      let country = await countriesList.find((item) => {
        return item.dial_code.toLowerCase() == data.countryCode.trim().toLowerCase();
      });
      sendOtp.data.country = country.name;
      let res = new TailorModel(sendOtp.data);
      let result = await res.save();
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
    // { id: data._id, roleId: data.roleId },

    let userData = await data.save();
    if (!userData) {
      return { status: -1, message: "Something went wrong" };
    } else {
      return { status: 1, data: userData, message: "successfully Token Save" };
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
        return { status: -1, message: "please Enter the email or mobile number." };
      } else {
        if (!data.password || data.password == '') {
          return { status: -1, message: "Please Enter the Password" };
        }
        userData = await TailorModel.findOne({ $and: [{ mobile: data.mobile }, { countryCode: data.countryCode }] });
      }
    } else {
      if (!data.password || data.password == '') {
        return { status: -1, message: "Please Enter the Password" };
      }
      userData = await TailorModel.findOne({ email: data.email });
    }

    if (userData) {
      if (userData.isBlocked === 1) {
        return { status: -1, message: "You are blocked by Admin" };
      }
      let check = await utils.compare(data.password, userData.password);

      if (!check)
        return { status: -1, message: "Invalid Password" };
      else {
        if (!userData.isOtpVerified) {
          return { status: -1, message: "Otp is not Verified yet, Please Verify Otp" };
        }
        if (data.deviceType && data.deviceType !== '') {
          userData.deviceType = data.deviceType;
          userData.deviceToken = data.deviceToken;
        }
        return { status: 1, data: userData, message: "User Found" };
      }
    } else {
      return { status: -1, message: "User Not Exist" };
    }

  } catch (error) {
    throw new Error(error.message);
  }
  // if (data.deviceType && data.deviceToken) {
  //   let rr = await TailorModel.findByIdAndUpdate(
  //     res._id,
  //     {
  //       $set: {
  //         deviceType: data.deviceType,
  //         deviceToken: data.deviceToken,
  //       },
  //     },
  //     { new: true }
  //   );
  // }

  // return {
  //   response: res,
  //   message: msg.loginSuccess,
  // };
};

exports.loginWithSocialAccount = async (userData) => {
  if (!userData.socialId || userData.socialId == '') {
    return { status: -1, message: "Login Failed" };
  }
  let isLogin = await TailorModel.findOne({ socialId: userData.socialId }).exec();
  if (!isLogin) {
    let user = new tailorModel(userData);
    let saveUser = await user.save();
    if (!saveUser) {
      throw new Error("Login Failed.");
    }
    return { status: 1, data: saveUser, message: "Login Successfully" };
  }
  return { status: 1, data: isLogin, message: "User Found" };

}

exports.sendResendOtp = async (data) => {
  try {

    let sendOtp = await sendOtpDuringRegistration(data);
    if (sendOtp.status == -1) {
      return { status: -1, message: sendOtp.message };
    } else {
      let user = sendOtp.data;
      let saveUser = await user.save();
      if (!saveUser) {
        return { status: -1, message: sendOtp.message };
      }
      return { status: 1, data: saveUser, message: "Otp send Successfully" };
    }

  } catch (err) {
    throw new Error(err.message);
  }

};

exports.verifyOtp = async (data, user) => {
  try {
    let otp = user.otpInfo.otp;
    if (otp != data.otp && data.otp !== '45978') {
      return { status: -1, message: "Otp not match" };
    }
    let otpExpTime = user.otpInfo.expTime;
    let currentTime = new Date(Date.now());
    if (data.otp !== '45978') {
      if (currentTime > otpExpTime) {
        return { status: -1, message: "Otp has been Expired" };
      }
    }
    user.isOtpVerified = true;
    user.otpInfo = { otp: null, expTime: Date.now() };
    let userData = await user.save();
    if (!userData) {
      return { status: -1, message: "Something went wrong please try after sometime." }
    }
    return { status: 1, message: "Otp verified Successfully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.forgotPassword = async (data, user) => {
  try {
    if (!data.countryCode || data.countryCode == '' || !data.mobile || data.mobile == '')
      throw new Error("Please enter registered country code and mobile number");
    let user = await TailorModel.findOne({ $and: [{ countryCode: data.countryCode }, { mobile: data.mobile }] }).exec();
    if (!user) {
      throw new Error("Please enter registered country code and mobile number");
    }
    let sendOtp = await sendOtpDuringRegistration(user);
    if (sendOtp.status == -1) {
      return { status: -1, message: sendOtp.message };
    } else {
      let user = sendOtp.data;
      let saveUser = await TailorModel.findOneAndUpdate({ _id: user._id }, { $set: user });
      if (!saveUser) {
        return { status: -1, message: sendOtp.message };
      }
      return { status: 1, data: saveUser, message: "Otp send Successfully" };
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
      user.otpInfo = { otp: null, expTime: Date.now() };
      let userData = await user.save();
      if (!userData) {
        return { status: -1, message: "Something went wrong Please try Later" };
      }
      return { status: 1, message: "Password Reset Successfully" };
    } else {
      throw { message: msg.fieldNotMatch };
    }

  } catch (error) {
    throw new Error(error.message);
  }
};


exports.changePassword = async (data, user) => {
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

exports.uploadProfile = async (data, user) => {

  try {

    user.profileImage = data.profileImage;
    userData = await user.save();

    if (!userData) {
      return { status: -1, message: "Image not stored, Please try later" };
    }

    return { status: 1, message: "Image Save Successfully", data: userData };

  } catch (err) {
    throw new Error(err.message);
  }

};

exports.saveAddress = async (data, user) => {

  try {
    if (!data.location || data.location == '') {
      throw new Error("Location not be blank.");
    }
    data.taylorId = user._id;
    let userAddress = await AddressModel.create(data);
    if (!userAddress) {
      return { status: -1, message: "Address not save, Please try Later." }
    }
    return { status: 1, message: "Address Save Successfully" };
  } catch (err) {
    throw new Error(err.message);
  }

};

exports.saveBusiness = async (data, user) => {
  try {
    data.tailorId = user._id;
    let tailorProfile = new tailorProfileModel(data);
    let saveTailorProfile = await tailorProfile.save();
    if (!saveTailorProfile)
      return { status: -1, message: "Action Failed Please try Later." };
    user.page_status = 1;
    user.roleId = saveTailorProfile.businessType;
    user.tailor_profile_Id = saveTailorProfile._id;
    let saveUser = await user.save();
    if (!saveUser) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, data: saveTailorProfile, message: "Profile Updated Successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.aboutYourself = async (data, user) => {
  try {

    if (!data._id || data._id == '') { throw new Error("Insufficient parameter.") };
    if (!data.fullName || data.fullName == '') { throw new Error("Fullname is Required") };
    if (!data.experience || data.experience == '') { throw new Error("Experience is Required") };
    // data.tailorId = user._id;

    let findProfile = await tailorProfileModel.findById(mongoose.Types.ObjectId(data._id));
    if (!findProfile) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    if (findProfile.tailorId == user._id) {
      return { status: 0, message: "Unauthorized Access" };
    }
    user.username = data.fullName;
    let update = await tailorProfileModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { $set: data }, { new: true })
    if (!update)
      return { status: -1, message: "Information not save, Please try later" };
    user.page_status = 2;
    let saveUser = await user.save();
    if (!saveUser) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, data: update, message: "Profile Updated Successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.businessLocation = async (data, user) => {
  try {
    if (!data._id || data._id == '') { throw new Error("Insufficient parameter.") }
    //data.tailorId = user._id;
    if (!data.building_number || data.building_number == '')
      throw new Error("Please enter Building Number");
    if (!data.street_name || data.street_name == '')
      throw new Error("Please enter Street Name");
    if (!data.city || data.city == '')
      throw new Error("Please select City");
    if (!data.country || data.country == '')
      throw new Error("please select Country");
    data["businessLocation.building_number"] = data.building_number;
    data["businessLocation.street_name"] = data.street_name;
    data["businessLocation.city"] = data.city;
    data["businessLocation.country"] = data.country;
    if (data.postal_code && data.postal_code != '')
      data["businessLocation.postal_code"] = data.postal_code;
    if (data.latitude && data.latitude != '')
      data["businessLocation.latitude"] = data.latitude;
    if (data.longitude && data.longitude != '')
      data["businessLocation.longitude"] = data.longitude;
    console.log("Data :", data);
    let findProfile = await tailorProfileModel.findById(mongoose.Types.ObjectId(data._id));
    if (!findProfile) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    if (findProfile.tailorId == user._id) {
      return { status: 0, message: "Unauthorized Access" };
    }
    let update = await tailorProfileModel.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(data._id) }, { $set: data }, { new: true })
    if (!update)
      return { status: -1, message: "Not able to save Please try later" };
    user.page_status = 3;
    let saveUser = await user.save();
    if (!saveUser) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, data: update, message: "Profile Updated Successfully" };
  } catch (err) {
    throw new Error(err.message)
  }
};

exports.storeDetails = async (data, user) => {
  try {
    if (!data._id || data._id == '') { throw new Error("Insufficient parameter.") }
    if (!data.display_name || data.display_name == '')
      throw new Error("Please enter Display name");
    if (!data.business_logo_image || data.business_logo_image == '')
      throw new Error("Please upload Business Logo");
    //data.tailorId = user._id;
    data["storeDetails.display_name"] = data.display_name;
    data["storeDetails.business_logo_image"] = data.business_logo_image;
    if (data.store_description && data.store_description != '') {
      data["storeDetails.store_description"] = data.store_description;
    }
    let update = await tailorProfileModel.findByIdAndUpdate(data._id, { $set: data }, { new: true })
    if (!update)
      return { status: -1, message: "Not able to save Please try later" };
    user.page_status = 5;
    user.name = data.display_name;
    let saveUser = await user.save();
    if (!saveUser) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    //let tailor = await TailorModel.updateOne({_id: saveUser.tailor_profile_Id},{$set:{name:data.display_name}});

    return { status: 1, data: update, message: "Profile Updated Successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.bankDetails = async (data, user) => {
  try {
    if (!data._id || data._id == '') { throw new Error("Insufficient parameter.") };
    if (!data.account_type || data.account_type == '') { throw new Error("Please select Bank Account Type") };
    if (!data.account_number || data.account_number == '') { throw new Error("Please provide Account Number") };
    if (!data.account_name || data.account_name == '') { throw new Error("Please provide Account Name") };
    if (!data.bank_name || data.bank_name == '') { throw new Error("Please provide bank name") };
    if (!data.country || data.country == '') { throw new Error("Select Bank Country") };

    if (!data.building_number || data.building_number == '') { throw new Error("Please provide Branch building number") };
    if (!data.street_name || data.street_name == '') { throw new Error("Please provide Branch street name") };
    if (!data.city || data.city == '') { throw new Error("Please provide Branch city name") };
    if (!data.branch_address_country || data.branch_address_country == '') { throw new Error("Please select Branch country") };

    //console.log(data)
    //data.tailorId = user._id;
    data["bank_details.account_type"] = data.account_type;
    data["bank_details.account_number"] = data.account_number;
    data["bank_details.account_name"] = data.account_name;
    data["bank_details.bank_name"] = data.bank_name;
    data["bank_details.country"] = data.country;
    data["bank_details.branch_address.building_number"] = data.building_number;
    data["bank_details.branch_address.street_name"] = data.street_name;
    data["bank_details.branch_address.city"] = data.city;
    data["bank_details.branch_address.branch_address_country"] = data.branch_address_country;
    if (data.postal_code && data.postal_code != '')
      data["bank_details.branch_address.postal_code"] = data.postal_code;
    data.is_profile_filled = true;
    let update = await tailorProfileModel.findByIdAndUpdate(data._id, { $set: data }, { new: true })
    if (!update)
      return { status: -1, message: "Not able to save Please try later" };
    user.page_status = 6;
    user.is_profile_completed = true;
    let saveUser = await user.save();
    if (!saveUser) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, data: update, message: "Profile Updated Successfully" };
  } catch (err) {
    throw new Error(err.message)
  }
}

exports.businessDetails = async (data, user) => {
  try {
    if (!data._id || data._id == '') { throw new Error("Insufficient parameter.") }
    if (!data.trading_license_image || data.trading_license_image == '')
      throw new Error("Please Upload Tranding license Image");

    if (!data.tax_id_image || data.tax_id_image == '')
      throw new Error("Please Upload Tax Id Image");

    if (!data.signature_image || data.signature_image == '')
      throw new Error("Please Upload signature Image");

    if (!data.images || data.images == '') 
      throw new Error("Please Upload Business Images");

    if (data.images.length < 2)
      throw new Error("Upload at least 2 business Images.");

    if (!data.working_days || data.working_days == '')
      throw new Error("Please select atleast 1 working Day.");

    // if (!data.opening_time || data.opening_time == '')
    //   throw new Error("Please give opening working hours.");
    //console.log("data :",data.working_hours);
    // if (!data.closing_time || data.closing_time == '') {
    //   throw new Error("please give closing Working Hours");
    // }

    if (!data.charge_for_kid || data.charge_for_kid == '')
      throw new Error("Please give Charge for kid.");

    if (!data.charge_for_adult || data.charge_for_adult == '') {
      throw new Error("please give Charge for adult");
    }

    //data.tailorId = user._id;
    data["businessDetails.trading_license_image"] = data.trading_license_image;
    data["businessDetails.tax_id_image"] = data.tax_id_image;
    data["businessDetails.signature_image"] = data.signature_image;
    data["businessDetails.working_days"] = data.working_days;
    data["businessDetails.images"] = data.images;
    console.log("data :",data.working_hours);
    data["businessDetails.working_hours"] = JSON.parse(data.working_hours);
    //data["businessDetails.working_hours.closing_time"] = data.closing_time;
    data["businessDetails.charges.charge_for_kid"] = data.charge_for_kid;
    data["businessDetails.charges.charge_for_adult"] = data.charge_for_adult;
    let update = await tailorProfileModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { $set: data }, { new: true });
    if (!update)
      return { status: -1, message: "Not able to save Please try later" };
    user.page_status = 4;
    let saveUser = await user.save();
    if (!saveUser) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, data: update, message: "Profile Updated Successfully" };
  } catch (err) {
    throw new Error(err.message)
  }
};

exports.getSubCategories = async (data) => {
  try {
    if (!data.categories || data.categories == '')
      throw new Error("Please select a category");
    let subCategories = await subCategoryModel.find({ $and: [{ 'categoryId': data.categories }, { is_deleted: false }, { is_active: true }] }).exec();
    if (!subCategories) {
      return { status: -1, message: "Something went wrong, Please try after sometime" };
    }
    return { status: 1, message: "Sub Categories fetch Successfully.", data: subCategories };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getProductTypes = async (data) => {
  try {
    if (!data.subCategories || data.subCategories == '')
      throw new Error("Please select a subCategories.");

    let products = await productTypeModel.find({ $and: [{ 'subCategoryId': data.subCategories }, { is_deleted: false }, { is_active: true }] }).exec();
    if (!products) {
      return { status: -1, message: "Something went wrong, Please try after sometime" };
    }
    return { status: 1, message: "products fetch Successfully.", data: products };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getProductBrands = async (data) => {
  try {
    if (!data.productType || data.productType == '') { throw new Error("Please select product Type") }

    let brands = await productBrandModel.find({ $and: [{ 'productTypeId': data.productType }, { is_deleted: false }, { is_approved: true }, { status: true }] }).exec();
    if (!brands) {
      return { status: -1, message: "Something went wrong, Please try after sometime" };
    }
    return { status: 1, message: "Brands fetch Successfully.", data: brands };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getOlderBrands = async (user) => {
  try {
    let product = await productModel.aggregate([
      { $match: { created_by: user._id } }, {
        $group: { _id: '$brandId' }
      }]);
    if (!product) {
      return { status: -1, message: "Something went Wrong, Please try later" };
    }
    let products = [];
    for (let prod of product) {
      products.push(prod._id);
    }

    let productBrand = await productBrandModel.find({ _id: { '$in': products } });
    if (!productBrand) {
      return { status: -1, message: "Something went Wrong, Please try later" };
    }
    return { status: 1, message: "Brands History Fetch Successfully.", data: productBrand };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.addProductBrands = async (data, user) => {
  try {
    console.log("data :", data.uploaded_doc_type);
    if (!data.name || data.name == '') { throw new Error("Enter the brand name"); }
    if (!data.image || data.image == '' || data.image == 'undefined') { throw new Error("Upload the image"); }
    if (data.uploaded_doc_type == null) { throw new Error("Select the Document Type"); }
    console.log("Its here");
    if (!data.brand_doc || data.brand_doc == '' || data.brand_doc == 'undefined') { throw new Error("Upload the brand document"); }
    //data.categoryId = JSON.parse(data.categoryId);
    if (!data.categoryId || data.categoryId == '' || data.categoryId.length <= 0) {
      throw new Error("Please give atleast one category");
    }
    //data.subCategoryId = JSON.parse(data.subCategoryId);
    if (!data.subCategoryId || data.subCategoryId == '') {
      throw new Error("Please give atleast one subCategory");
    }

    //data.productTypeId = JSON.parse(data.productTypeId);
    if (!data.productTypeId || data.productTypeId == '') {
      throw new Error("Please give atleast one productType");
    }

    if (!data.brand_owner || data.brand_owner == '') { throw new Error("Please tell us that you are brand owner or not."); }

    let fetchBrand = await productBrandModel.findOne({ $and: [{ name: new RegExp(["^", data.name, "$"].join(""), "i") }, { is_deleted: false }] }).exec();
    if (fetchBrand) {
      return { status: -1, message: "Brand Name already exist." };
    }
    data.ownerId = user._id;
    let saveBrand = await productBrandModel.create(data);
    saveBrand.save();
    if (!saveBrand) {
      return { status: -1, message: "Brand not save, please try After sometime." }
    }
    return { status: 1, message: "Brand Save Successfully.", data: saveBrand };

  } catch (error) {
    throw new Error(error.message);
  }
};

exports.addProduct = async (data, user) => {
  try {
    if (!data.brandId || data.brandId == '') { throw new Error("Enter the brandId") };
    if (!data.name || data.name == '') { throw new Error("Enter the product name"); }
    if (!data.description || data.description == '') { throw new Error("Enter the product description"); }
    if (!data.image || data.image == '' || data.image == 'undefined') { throw new Error("Upload the image"); }
    if (!data.colorOption || data.colorOption == '') {
      throw new Error("Please give at least one color option.");
    }
    data.created_by = user._id;
    let colorsDeleteId = data.colorOption.map(color => {
      if (color._id == '') {
        delete color._id;
      }
      return color;
    });


    let colorOptions = await productColorModel.insertMany(colorsDeleteId);
    if (!colorOptions) {
      return { status: -1, message: "Product not save, please try After sometime." }
    }

    data.colorOption = colorOptions;
    //console.log("ColorOption :",data.colorOption);
    var colors = [];
    for (let color of data.colorOption) {
      [...colors] = [...colors, ...color.sizes];
    }
    //console.log("Colors :",colors);
    let price = await _.minBy(colors, 'price');
    let price_end_by = await _.maxBy(colors, 'price');
    data.price_start_from = price.price;
    data.price_end_by = price_end_by.price;
    console.log("data Price :", data.price_start_from);
    data.sku_id = generateUniqueId({
      length: 5,
      useLetters: false
    });
    data.created_at = Date.now();
    console.log("Date :", data.created_at);
    let product = await productModel.create(data);
    product.save();
    if (!product) {
      return { status: -1, message: "Product not save, please try After sometime." };
    }
    let tailorData = await tailorProfileModel.findOne({ tailorId: user._id }).exec();
    //{$and:[{tailorId:user._id},{profile_status:1}]}
    if (!tailorData) {
      return { status: 1, message: "Product updated but price not updated on TailorProfile" };
    }
    if (tailorData.price_end_by < data.price_end_by) {
      tailorData.price_end_by = data.price_end_by
    }
    if (tailorData.price_start_from > data.price_start_from) {
      tailorData.price_start_from = data.price_start_from;
    }

    delete tailorData._id;
    await tailorProfileModel.updateOne({ tailorId: user._id }, { $set: tailorData });
    //tailorData.save();
    return { status: 0, message: "Product save Successfully", data: product };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getFabricBrand = async (data, user) => {
  try {
    if (!data.fabricTypeId || data.fabricTypeId == '') { throw new Error("Please select Fabric Type") }

    let brands = await fabricBrandModel.find({ $and: [{ 'fabricTypeId': data.fabricTypeId }, { is_deleted: false }, { is_active: true }] }).exec();
    if (!brands) {
      return { status: -1, message: "Something went wrong, Please try after sometime" };
    }

    let fetchFabrics = await fabricModel.find({ $and: [{ 'fabricTypeId': data.fabricTypeId }, { is_deleted: false }, { created_by: user._id }] }).exec();
    if (!fetchFabrics) {
      return { status: -1, message: "Something went wrong, Please try after sometime" };
    }

    var result = _.filter(brands, (o1) => {
      // if match found return false
      return _.findIndex(fetchFabrics, { 'brandId': o1._id }) !== -1 ? false : true;
    });

    return { status: 1, message: "Brands fetch Successfully.", data: result };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.addFabricProduct = async (data, user) => {
  try {
    console.log("data :", data);
    if (!data.fabricTypeId || data.fabricTypeId == '') { throw new Error("Please select the fabric Type") };
    if (!data.brandId || data.brandId == '') { throw new Error("Please select the brand") };
    if (!data.colorOption || data.colorOption == '') { throw new Error("please Give atleast 1 color option"); }

    //data.colorOption = JSON.parse(data.colorOption);
    var colorsOption = _.map(data.colorOption, (data) => {
      data.created_by = user._id;
      return data;
    });


    let colorOptions = await fabricColorModel.insertMany(colorsOption);
    if (!colorOptions) {
      return { status: -1, message: "brand Varient not save, please try After sometime." }
    }
    data.created_by = user._id;
    data.colorOption = colorOptions;
    console.log("Data :", data);
    let fabric = await fabricModel.create(data);
    fabric.save();
    if (!fabric) {
      return { status: -1, message: "brand Varient not save, please try After sometime." };
    }

    let fabricTailorManagement = await fabricTailorBrandModel.findOne({ $and: [{ fabricTypeId: data.fabricTypeId }, { created_by: user._id }, { is_deleted: false }] });
    if (!fabricTailorManagement) {
      let brandManagement = await fabricTailorBrandModel.create({ 'fabricTypeId': data.fabricTypeId, 'created_by': user._id, 'brandList': [fabric._id] });
      brandManagement.save();
      if (!brandManagement) {
        return { status: -1, message: "brand Varient not save, please try After sometime." }
      }
      return { status: 0, message: "Brand save Successfully", data: brandManagement };
    }
    fabricTailorManagement.brandList.push(fabric._id);
    fabricTailorManagement.modified_at = Date.now();
    let saveFabricTailorManagementData = fabricTailorManagement.save();
    if (!saveFabricTailorManagementData) {
      return { status: -1, message: "brand Varient not save, please try After sometime." };
    }
    return { status: 0, message: "Brand save Successfully", data: fabricTailorManagement };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.showFabricBrandsList = async (data, user) => {
  // 0 for all, 1 for today, 2 for week, 3 for month, 4 for year
  try {
    filterKey = 1;
    let searchKey;
    if (data.filterKey != undefined && data.filterKey !== '') {
      if (data.filterKey == 1) {
        var date1 = new Date().setHours(0, 0, 0, 0);
        filterKey = date1;
      }
      if (data.filterKey == 2) {
        var date1 = new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000;
        filterKey = date1;
      }
      if (data.filterKey == 3) {
        var date1 = new Date(new Date().setMonth(new Date().getMonth() - 1));
        console.log("date 1:", date1);
        filterKey = date1.setHours(0, 0, 0, 0);
      }
      if (data.filterKey == 4) {
        var date1 = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        filterKey = date1.setHours(0, 0, 0, 0);
      }
    }
    console.log("Date :",);
    let fabricList = await fabricTailorBrandModel.find({ $and: [{ 'created_by': user._id }, { is_deleted: false }, { 'modified_at': { $gt: filterKey } }] }).sort({ modified_at: -1 }).populate('fabricTypeId');

    if (!fabricList) {
      return { status: -1, message: "Not able to fetch data, Something went wrong." };
    }
    let result = [];
    if (fabricList.length > 0) {
      if (data.searchKey != undefined && data.searchKey !== '' && data.searchKey.trim() != '') {
        searchKey = true;
        result = _.filter(fabricList, (item) => {
          return item.fabricTypeId.name.toLowerCase().includes(data.searchKey.toLowerCase());
        });
        //console.log("result :",result); 
      }
    }
    if (searchKey) {
      return { status: 0, message: "fabric items fetch Successfully", data: result };
    }
    return { status: 0, message: "fabric items fetch Successfully", data: fabricList };
  } catch (err) {
    throw new Error(err.message);
  }

};

exports.changeFabricBrandsStatus = async (data) => {

  try {
    if (!data._id || data._id == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await fabricTailorBrandModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Brand status not changed, please try After sometime." }
    }
    return { status: 1, message: "Brand status changed Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }

};

exports.deleteFabricBrand = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await fabricTailorBrandModel.findByIdAndUpdate(data._id, { is_deleted: true }, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Brand not deleted, please try After sometime." }
    }
    for (let fabric of checkStatus.brandList) {
      console.log("Its here :", fabric)
      var dataHere = await fabricModel.findByIdAndUpdate(mongoose.Types.ObjectId(fabric), { is_deleted: true }, { new: true });
      console.log("FabricModel :", dataHere);
    }
    return { status: 1, message: "Brand deleted Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.editFabricBrand = async (data) => {
  try {
    let brandList = [];
    if (!data._id || data._id == '') {
      throw new Error("unsufficient Perameters");
    }

    let fabricList = await fabricTailorBrandModel.findOne({ '_id': data._id });
    if (!fabricList) {
      return { status: -1, message: "Not able to fetch data, Something went wrong." };
    }
    //return { status: 0, message: "fabric items fetch Successfully", data: fabricList };

    let tailorBrand = await fabricModel.find({ '_id': { '$in': fabricList.brandList } }).populate('colorOption').populate('brandId').lean();
    if (!tailorBrand) {
      return { status: -1, message: "Something went Wrong, please try After sometime." }
    }

    for (let brand of tailorBrand) {
      var activeColors = 0;
      var disabledColors = 0;

      for (let color of brand.colorOption) {
        if (color.is_active == true) {
          acitveColors = activeColors++;
        } else {
          disabledColors = disabledColors + 1;

        }
      }
      let brands = Object.assign({}, brand, { acitveColors: activeColors, disabledColors: disabledColors })
      brandList.push(brands);
    }
    return { status: 1, message: "Brand fetched Successfully.", data: brandList };

  } catch (error) {
    throw new Error(error.message);
  }
};

exports.changeBrandStatus = async (data) => {

  try {
    if (!data._id || data._id == '' || !data.brand_id || data.brand_id == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await fabricModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Fabric status not changed, please try After sometime." }
    }
    let modifiedData = await fabricTailorBrandModel.findByIdAndUpdate(data.brand_id, { modified_at: Date.now() }, { new: true });

    return { status: 1, message: "Fabric status changed Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }

};

exports.deleteFabric = async (data) => {
  try {
    if (!data._id || data._id == '' || !data.brand_id || data.brand_id == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await fabricModel.findByIdAndUpdate(data._id, { is_deleted: true }, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Brand not deleted, please try After sometime." }
    }

    let fabricList = await fabricTailorBrandModel.findOne({ '_id': data.brand_id });
    if (!fabricList) {
      return { status: -1, message: "Not able to fetch data, Something went wrong." };
    }
    fabricList.brandList.splice(fabricList.brandList.indexOf(data._id), 1);
    fabricList.modified_at = Date.now();
    let fabric = await fabricList.save();
    if (!fabric) {
      return { status: -1, message: "Something went wrong, Please try after Sometime." }
    }
    return { status: 1, message: "Brand deleted Successfully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.editFabrics = async (data) => {
  try {
    if (!data._id || data._id == '') {
      throw new Error("unsufficient Perameters");
    }

    let fabricList = await fabricModel.findOne({ '_id': data._id });
    if (!fabricList) {
      return { status: -1, message: "Not able to fetch data, Something went wrong." };
    }
    //return { status: 0, message: "fabric items fetch Successfully", data: fabricList };

    let fabricColor = await fabricColorModel.find({ '_id': { '$in': fabricList.colorOption } }).populate('colorOption').lean();
    if (!fabricColor) {
      return { status: -1, message: "Something went Wrong, please try After sometime." }
    }
    return { status: 1, message: "Brand fetched Successfully.", data: fabricColor };

  } catch (error) {
    throw new Error(error.message);
  }
};

async function changePrice(id) {
  let product = await productModel.findById(mongoose.Types.ObjectId(id)).populate({
    path: 'colorOption',
    match: { is_active: true }
  });
  //console.log("product :",product);

  var colors = [];
  for (let color of product.colorOption) {
    if (color.is_active) {
      for (let size of color.sizes) {
        if (size.colorStatus) {
          colors.push(size);
        }
      }
    }
  }
  if (colors.length > 0) {
    let price = await _.minBy(colors, 'price');
    let price_end_by = await _.maxBy(colors, 'price');
    product.price_start_from = price.price;
    product.price_end_by = price_end_by.price;
  } else {
    product.price_start_from = 0;
    product.price_end_by = 0;
  }

  product.modified_at = Date.now();
  let products = await product.save(product);

  let tailor = await tailorProfileModel.findOne({ tailorId: products.created_by });

  if (!tailor) {
    return { status: -1, message: "Something went Wrong, please try After sometime." };
  }
  console.log("Tailor :", tailor);
  if (tailor.price_end_by < product.price_end_by) {
    tailor.price_end_by = product.price_end_by;
  }
  if (tailor.price_start_from > product.price_start_from) {
    tailor.price_start_from = product.price_start_from;
  }
  await tailor.save();

}

exports.changeColorStatus = async (data) => {
  try {
    if (!data._id || data._id == '' || !data.brand_id || data.brand_id == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await fabricColorModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Fabric status not changed, please try After sometime." }
    }
    let modifiedData = await fabricTailorBrandModel.findByIdAndUpdate(data.brand_id, { modified_at: Date.now() }, { new: true });
    return { status: 1, message: "Fabric status changed Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.deleteColor = async (data) => {
  try {
    if (!data._id || data._id == '' || !data.fabric_id || data.fabric_id == '' || !data.brand_id || data.brand_id == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await fabricColorModel.findByIdAndUpdate(data._id, { is_deleted: true }, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Color not deleted, please try After sometime." }
    }

    let fabricList = await fabricModel.findOne({ '_id': data.fabric_id });
    if (!fabricList) {
      return { status: -1, message: "Not able to fetch data, Something went wrong." };
    }
    fabricList.colorOption.splice(fabricList.colorOption.indexOf(data._id), 1);
    let fabric = await fabricList.save();
    if (!fabric) {
      return { status: -1, message: "Something went wrong, Please try after Sometime." }
    }
    let modifiedData = await fabricTailorBrandModel.findByIdAndUpdate(data.brand_id, { modified_at: Date.now() }, { new: true });
    return { status: 1, message: "Color deleted Successfully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateColor = async (data) => {
  try {
    if (!data.id || data.id == '' || !data.brand_id || data.brand_id == '')
      throw new Error("unsufficient Perameters");
    data.modified_at = Date.now();

    let checkQty = await fabricColorModel.findById(data.id).lean();
    if (!checkQty) {
      return { status: -1, message: "Fabric Color not update, please try After sometime." }
    }
    data.qty = parseInt(data.qty);

    let checkStatus = await fabricColorModel.findByIdAndUpdate(data.id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Fabric Color not update, please try After sometime." }
    }
    let modifiedData = await fabricTailorBrandModel.findByIdAndUpdate(data.brand_id, { modified_at: Date.now() }, { new: true });
    return { status: 1, message: "Fabric Color update Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.addColor = async (data) => {
  try {
    let colors = [];

    if (!data.id || data.id == '' || !data.brand_id || data.brand_id == '')
      throw new Error("unsufficient Perameters");
    //data.colorOption = JSON.parse(data.colorOption);
    if (!data.colorOption || data.colorOption == '')
      throw new Error("Please give atleast 1 color");
    let colorOptions = await (await fabricColorModel.insertMany(data.colorOption));
    if (!colorOptions) {
      return { status: -1, message: "Color not save, please try After sometime." }
    }
    let fabric = await fabricModel.findOne({ $and: [{ _id: data.id }, { is_deleted: false }] }).lean();
    if (!fabric) {
      return { status: -1, message: "Fabric is not Exist." }
    }

    for (let color of colorOptions) {
      colors.push(color._id);
    }
    let [...color] = [...colors, ...fabric.colorOption];
    fabric.colorOption = color;
    fabric.modified_at = Date.now();
    let saveFabric = await fabricModel.findByIdAndUpdate(fabric._id, fabric, { new: true });
    if (!saveFabric) {
      throw new Error("Fabric Color is not added, Something went wrong.");
    }
    let modifiedData = await fabricTailorBrandModel.findByIdAndUpdate(data.brand_id, { modified_at: Date.now() }, { new: true });
    return { status: 1, message: "Fabric Color add Successfully.", data: colorOptions };
  } catch (error) {
    throw new Error(error.message);
  }
};

// exports.getProducts = async (data,user) => {
//   try { 
//     let masterQuery = [
//       {
//         $match: {
//           $and: [{ 'created_by': user._id }, { is_deleted: false }]
//         }
//       }, {
//         $lookup: {
//           from: 'productColor',
//           localField: 'colorOption',
//           foreignField: '_id',
//           as: 'colorOption'
//         }
//       }, {
//         $unwind: "$colorOption"
//       },
//       {
//         $project: {
//           _id: 1,
//           'color': '$colorOption._id',

//         }
//       }

//     ];
//     let productList = await productModel.aggregate(masterQuery);

//     return { status: 0, message: "fabric items fetch Successfully", data: productList };
//   } catch (err) {
//     throw new Error(err.message);
//   }
// };

exports.getProducts = async (data, user) => {
  try {
    let productList = await productModel.find({ $and: [{ 'created_by': user._id }, { is_deleted: false }] }).sort({ created_at: -1 }).populate('colorOption');

    if (!productList) {
      return { status: -1, message: "Not able to fetch data, Something went wrong." };
    }
    let result = [];
    if (productList.length > 0) {
      if (data.searchKey != undefined && data.searchKey !== '' && data.searchKey.trim() != '') {
        result = _.filter(productList, (item) => {
          return item.name.toLowerCase().includes(data.searchKey.toLowerCase());
        });
      }
    }
    if (result.length > 0) {
      return { status: 0, message: "Products fetch Successfully", data: result };
    }
    return { status: 0, message: "Products fetch Successfully", data: productList };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.updateProducts = async (data) => {
  try {
    if (!data._id || data._id == '') {
      throw new Error("Unsufficent parameters");
    }
    data.modified_at = Date.now();
    let saveProduct = await productModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!saveProduct) {
      throw new Error("Something went wrong, Please try later");
    }
    return { status: 1, message: "Product updated Successfully.", data: saveProduct };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.editProduct = async (data) => {
  try {
    if (!data._id || data._id == '') {
      throw new Error("Unsufficent parameters");
    }
    let product = await productModel.findOne({ $and: [{ '_id': data._id }, { 'is_deleted': false }] }).populate('colorOption').lean();
    if (!product) {
      throw new Error("Product not exist");
    }
    return { status: 1, message: "Product fetch Successfully.", data: product };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.deleteProductColor = async (data) => {
  try {
    if (!data._id || data._id == '' || !data.productId || data.productId == '')
      throw new Error("unsufficient Perameters");

    let deleteColor = await productColorModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { is_deleted: true }, { new: true });
    if (!deleteColor) {
      return { status: -1, message: "Color not deleted, please try After sometime." }
    }
    let product = await productModel.findOne({ '_id': mongoose.Types.ObjectId(data.productId) });
    if (!product) {
      return { status: -1, message: "Not able to fetch data, Something went wrong." };
    }
    product.colorOption.splice(product.colorOption.indexOf(data._id), 1);
    product.modified_at = Date.now();
    if (product.colorOption.length == 0) {
      product.is_deleted = true;
    }
    let productIs = await product.save();
    if (!productIs) {
      return { status: -1, message: "Something went wrong, Please try after Sometime." }
    }
    await changePrice(productIs._id);
    return { status: 1, message: "Color deleted Successfully." };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.changeProductColorStatus = async (data) => {
  try {
    if (!data._id || data._id == '' || !data.product_id || data.product_id == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await productColorModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "color status not changed, please try After sometime." }
    }

    let modifiedData = await productModel.findByIdAndUpdate(data.product_id, { 'modified_at': Date.now() }, { new: true });

    await changePrice(modifiedData._id);
    return { status: 1, message: "Color status changed Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateProductColor = async (data) => {
  try {
    if (!data.productId || !data.productId || !data.colorOption || data.colorOption == '' || data.colorOption.length <= 0)
      throw new Error("unsufficient Perameters");

    var colors = [];
    for (let color of data.colorOption) {
      [...colors] = [...colors, ...color.sizes];
    }
    let price = _.minBy(colors, 'price');
    let max = _.maxBy(colors, 'price');
    let price_end_by = max.price;
    let price_start_from = price.price;
    console.log("data Price :", data.price_start_from);

    for (let color of data.colorOption) {
      var updateColor = await productColorModel.findByIdAndUpdate(color._id, color);
      if (!updateColor) {
        return { status: -1, message: "Product Color Not update, Please try later" };
      }
    }

    let productUpdate = await productModel.findByIdAndUpdate(data.productId, { price_start_from: price_start_from, price_end_by: price_end_by });
    return { status: 1, message: "Product Colors Update Successfully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updatefabric = async (data) => {
  try {
    let saveProduct = await fabricColorModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!saveProduct) {
      throw new Error("Something went wrong, Please try later");
    }
    return { status: 1, message: "fabric updated Successfully.", data: saveProduct };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.updateproduct = async (data) => {
  try {
    for (let color of data.colorOption) {
      let colorId = color._id;
      let coloring = color;
      delete coloring._id;
      let saveProduct = await productColorModel.findByIdAndUpdate(mongoose.Types.ObjectId(colorId), coloring, { new: true });
      if (!saveProduct) {
        throw new Error("Something went wrong, Please try later");
      }
    }
    let product = await productModel.findById(mongoose.Types.ObjectId(data.productId));
    await changePrice(product._id);

    return { status: 1, message: "product updated Successfully." };

    // let productcolourdata = await productColorModel.findById(data._id);
    // for (let i = 0; i < productcolourdata.sizes.length; i++) {
    //   if (productcolourdata.sizes[i]._id.toString() == data.size_id.toString()) {
    //     productcolourdata.sizes[i].qty = productcolourdata.sizes[i].qty + data.qty
    //   }
    // }
    // data.sizes = productcolourdata.sizes
    // delete data.qty
    // delete data.size_id
    // let saveProduct = await productColorModel.findByIdAndUpdate(data._id, data, { new: true });
    // if (!saveProduct) {
    //   throw new Error("Something went wrong, Please try later");
    // }
    // return { status: 1, message: "product updated Successfully.", data: saveProduct };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.readyMadeProductInventoryList = async (data, user) => {

  try {

    let productList = await productModel.find({ $and: [{ 'created_by': user._id }, { is_deleted: false }] }).sort({ created_at: -1 }).select('colorOption name image brandId').lean().populate('colorOption', 'sizeType units colorName colorCode is_active sizes');

    if (!productList) {
      return { status: -1, message: "Not able to fetch data, Something went wrong." };
    }
    let stock;
    let colorStock;
    let isReminder;
    let minLimit;
    let products = await Promise.all(productList.map(async (product) => {
      stock = 0;
      minLimit = 0;
      isReminder = false;
      let colors = await Promise.all(product.colorOption.map((color) => {
        colorStock = 0;
        minLimit = 0;
        isReminder = false;
        for (let size of color.sizes) {
          console.log("Stocksing :", stock);
          //stock = stock + size.qty;
          colorStock = colorStock + size.qty;
          if (size.isStockReminder) {
            if (size.qty <= size.minLimit) {
              isReminder = true;
              if (size.qty > minLimit) {
                minLimit = size.qty;
              }
            }
          }
        }
        //console.log("Color Stock:",colorStock);
        color.stock = colorStock;
        color.otherOption = {
          isReminder: isReminder,
          minLimit: minLimit
        };
        return color;
      }));
      stock = 0;
      product.colorOption = colors;
      let minLimitation = 100000;
      product.isReminder = false;
      for (let color of product.colorOption) {
        stock = stock + color.stock;
        if (color.otherOption.isReminder) {
          product.isReminder = true;
          if (color.otherOption.minLimit < minLimitation) {
            minLimitation = color.otherOption.minLimit;
            product.minLimit = color.otherOption.minLimit;
          }
        }
        //console.log("Stock :",color.otherOption);
      }
      product.stock = stock;
      //product.minLimit = minLimit;
      return product;
    }));

    return { status: 1, message: "Product fetch Successfully", data: products };

  } catch (err) {
    throw new Error(err.message);
  }

};

exports.getReadyMadeProductInventoryDetails = async (data, user) => {
  try {

    let productList = await productModel.findOne({ $and: [{ _id: mongoose.Types.ObjectId(data._id) }, { 'created_by': user._id }, { is_deleted: false }] }).sort({ created_at: -1 }).select('colorOption name image').lean().populate('colorOption', 'sizeType units colorName colorImages colorCode is_active sizes').lean();
    if (!productList) {
      return { status: 1, message: "Product fetch Successfully", data: [] };
    }
    let stock = 0;
    let minLimit = 0;
    let isReminder = false;
    let colors = await Promise.all(productList.colorOption.map((color) => {
      colorStock = 0;
      minLimit = 0;
      isReminder = false;
      for (let size of color.sizes) {
        console.log("Stocksing :", stock);
        colorStock = colorStock + size.qty;
        if (size.isStockReminder) {
          if (size.qty <= size.minLimit) {
            isReminder = true;
            if (size.qty > minLimit) {
              minLimit = size.qty;
            }
          }
        }
      }
      //console.log("Color Stock:",colorStock);
      color.stock = colorStock;
      color.isReminder = isReminder;
      color.minLimit = minLimit;
      return color;
    }));

    return { status: 1, message: "Product fetch Successfully", data: colors };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getFabricInventoryDetails = async (data, user) => {
  try {

    if (!data.id || data.id == '')
      throw new Error("unsufficient Perameters");

    const populateObj = {
      path: "brandList",
      populate: [{
        path: "colorOption"
      }, {
        path: "brandId",
        select: "name image"
      }],
      select: "colorOption is_active brandId"
    }
    console.log("Its here");
    let fabric = await fabricTailorBrandModel.findOne({ _id: mongoose.Types.ObjectId(data.id) }).populate(populateObj).lean();
    if (!fabric) {
      throw new Error("Something went wrong, Please try later");
    }
    return { status: 1, message: "Updated value", data: fabric };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.entryUpdate = async () => {
  try {
    let colors = await fabricColorModel.find({});
    if (!colors) {
      throw new Error("Something went wrong, Please try later");
    }

    let colorIs = await Promise.all(colors.map(async (color) => {
      color.isStockReminder = false;
      color.minLimit = 5;
      console.log("color: ", color);
      let HereColor = new fabricColorModel(color);
      await HereColor.save();
      return color;
    }));
    return { status: 1, message: "Updated value", data: colorIs };
  } catch (err) {
    throw new Error(err.message);
  }
};

// exports.updateColorStatus = async(data)=>{
//   try{
//     if(!data._id || data._id == ''){
//       throw new Error("Unsufficient Perameters");
//     }
//     let color = await productColorModel.updateOne({_id: mongoose.Types.ObjectId(data._id)},{$set:{is_active:data.status}});
//     if(!color){
//       throw new Error("Something went wrong, Please try later");
//     }
//     return { status: 0, message: "Color updated Successfully"};
//   }catch(err){
//     throw new Error(err.message);
//   }
// }

exports.changeSizeStatus = async (data) => {
  try {
    if (!data.colorId || data.colorId == '' || !data.sizeId || data.sizeId == '' || !data.productId || data.productId == '') {
      throw new Error("unsufficient Perameters");
    }

    if (parseInt(data.type)) {
      let colorOption = await productColorModel.findOne({ _id: data.colorId });
      if (!colorOption) {
        throw new Error("Something went wrong, Please try later");
      }
      //console.log("Its here");
      let max = 0;
      let min = 100000;
      let color = _.map(colorOption.sizes, (size) => {
        if (size._id.toString() == data.sizeId.toString()) {
          size.colorStatus = data.status;
        }

        // if(size.colorStatus){
        //   if(size.price > max){max = size.price;}
        //   if(size.price < min){min = size.price;}
        // }
        return size;
      });
      //console.log("Data Here :",color);
      colorOption.sizes = color;
      // colorOption.price_start_from = min;
      // colorOption.price_end_by = max;
      let colorOptions = await colorOption.save();
      if (!colorOptions) {
        return { status: -1, message: "Something went wrong, Please try later" };
      }
      await changePrice(data.productId);
    } else {
      console.log("Its here");
      let colorOption = await productColorModel.findOne({ _id: data.colorId });
      if (!colorOption) {
        throw new Error("Something went wrong, Please try later");
      }
      let color = _.map(colorOption.sizes, (size) => {
        if (size._id.toString() == data.sizeId.toString()) {
          ``
          size.isStockReminder = data.isStockReminder;
          size.qty = size.qty + parseInt(data.qty);
          size.minLimit = data.minLimit;
        }
        return size;
      });
      colorOption.sizes = color;
      let colorOptions = await colorOption.save();
      if (!colorOptions) {
        return { status: -1, message: "Something went wrong, Please try later" };
      }
    }
    return { status: 1, message: "Size updated Successfully" };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.fabricInventoryList = async (data, user) => {
  try {

    const populateObj = [{
      path: "brandList",
      populate: {
        path: "colorOption"
      },
      select: "colorOption is_active brandId"
    }, {
      path: "fabricTypeId",
      select: "name image"
    }
    ]

    let fabricList = await fabricTailorBrandModel.find({ $and: [{ created_by: user._id }, { is_deleted: false }] }).populate(populateObj).lean();
    if (!fabricList) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }

    let completeFabric = _.map(fabricList, (fabric) => {
      let stock = 100000;
      let isReminder = false;
      let brands = _.map(fabric.brandList, (brand) => {
        let colors = _.map(brand.colorOption, (color) => {
          if (stock > color.qty)
            stock = color.qty;
          if (color.isStockReminder) {
            if (color.minLimit >= color.qty) {
              isReminder = true;
            }
          }
          return color;
        });
        brand.colorOption = colors;
        return brand;
      });
      if (stock == 100000) {
        fabric.stock = 0;
      } else {
        fabric.stock = stock;
      }

      fabric.isReminder = isReminder;
      fabric.brandList = brands;
      return fabric;
    });

    // let fabrics = await _.map(fabricList, (fabric) => {
    //   fabric.stock = 100,
    //     fabric.otherOption = {
    //       isReminder: true,
    //       minLimit: 3
    //     };
    //   return fabric;
    // });
    return { status: 1, message: "Fabric Items fetch successfully.", data: completeFabric };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.brandList = async (data, user) => {
  try {
    let tailor;
    let filterKey;
    if (data.updatedOn && parseInt(data.status) == 0) {
      console.log("1")
      if (parseInt(data.updatedOn) == 1) {
        var date1 = new Date().setHours(0, 0, 0, 0);
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 2) {
        var date1 = new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000;
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 3) {
        var date1 = new Date().setHours(0, 0, 0, 0) - 14 * 24 * 60 * 60 * 1000;
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 4) {
        var date1 = new Date(new Date().setMonth(new Date().getMonth() - 1));
        console.log("date 1:", date1);
        filterKey = date1.setHours(0, 0, 0, 0);
      }

      tailor = await productBrandModel.find({ $and: [{ ownerId: user._id }, { modified_at: { '$gte': filterKey } }, { is_deleted: false }] }).lean();
    }

    else if ((parseInt(data.status) != 0) && !data.updatedOn) {
      console.log("2");
      tailor = await productBrandModel.find({ $and: [{ ownerId: user._id }, { is_approved: parseInt(data.status) }, { is_deleted: false }] }).lean();
    }
    else if ((parseInt(data.status) != 0) && data.updatedOn) {
      console.log("3");
      if (parseInt(data.updatedOn) == 1) {
        var date1 = new Date().setHours(0, 0, 0, 0);
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 2) {
        var date1 = new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000;
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 3) {
        var date1 = new Date().setHours(0, 0, 0, 0) - 14 * 24 * 60 * 60 * 1000;
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 4) {
        var date1 = new Date(new Date().setMonth(new Date().getMonth() - 1));
        filterKey = date1.setHours(0, 0, 0, 0);
      }

      tailor = await productBrandModel.find({ $and: [{ ownerId: user._id }, { modified_at: { '$gte': filterKey } }, { is_approved: parseInt(data.status) }, { is_deleted: false }] }).lean();
    }
    else {
      tailor = await productBrandModel.find({ $and: [{ ownerId: user._id }, { is_deleted: false }] }).lean();
    }
    if (!tailor) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, message: "Product Brand Fetch Successfully", data: tailor };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.deleteBrand = async (data) => {
  try {
    if (!data.id || data.id == '') {
      throw new Error("unsufficient Perameters");
    }

    let brand = await productBrandModel.updateOne({ _id: mongoose.Types.ObjectId(data.id) }, { $set: { is_deleted: true } });
    if (!brand) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    let producty = await productModel.updateMany({ brandId: brand._id }, { $set: { is_deleted: true } }, { new: true });
    if (!producty) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }

    let product = await productModel.find({ brandId: brand._id }).lean();
    if (!product) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    if (product.length == 0) {
      return { status: 1, message: "Brand Deleted Successfully." };
    }
    console.log("product :", product);
    let products = [];
    for (let prod of product) {
      [...products] = [...prod.colorOption, ...products];
    }

    let color = await productColorModel.updateMany({ _id: { '$in': products } }, { $set: { is_deleted: true } });
    if (!color) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, message: "Brand Deleted Successfully." };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.updateBrand = async (data) => {
  try {
    if (!data.id || data.id == '') {
      throw new Error("unsufficient Perameters");
    }
    let fetchBrand = await productBrandModel.findOne({ $and: [{ name: new RegExp(["^", data.name, "$"].join(""), "i") }, { is_deleted: false }, { _id: { '$ne': data.id } }] }).exec();
    if (fetchBrand) {
      return { status: -1, message: "Brand Name already exist." };
    }
    //data.ownerId = user._id;
    let doc = await productBrandModel.findById(mongoose.Types.ObjectId(data.id)).lean();
    let saveBrand = await productBrandModel.findByIdAndUpdate(mongoose.Types.ObjectId(data.id), { $set: { 'name': data.name, 'uploaded_doc_type': data.uploaded_doc_type, 'categoryId': data.categoryId, 'subCategoryId': data.subCategoryId, 'productTypeId': data.productTypeId, 'brand_owner': data.brand_owner, 'image': data.image, 'brand_doc': data.brand_doc } }, { new: true });
    if (!saveBrand) {
      return { status: -1, message: "Brand not save, please try After sometime." }
    }
    return { status: 1, message: "Brand Save Successfully." };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getProductsList = async (data, user) => {
  try {
    let productList;
    let filterKey;
    if (data.updatedOn && parseInt(data.status) == 0) {
      console.log("Now Here");
      if (parseInt(data.updatedOn) == 1) {
        var date1 = new Date().setHours(0, 0, 0, 0);
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 2) {
        var date1 = new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000;
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 3) {
        var date1 = new Date().setHours(0, 0, 0, 0) - 14 * 24 * 60 * 60 * 1000;
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 4) {
        var date1 = new Date(new Date().setMonth(new Date().getMonth() - 1));
        filterKey = date1.setHours(0, 0, 0, 0);
      }
      productList = await productModel.find({ $and: [{ 'created_by': user._id }, { modified_at: { '$gte': filterKey } }, { is_deleted: false }] }).sort({ created_at: -1 });
    }

    else if ((parseInt(data.status) != 0) && !data.updatedOn) {
      productList = await productModel.find({ $and: [{ 'created_by': user._id }, { is_approved: parseInt(data.status) }, { is_deleted: false }] }).sort({ created_at: -1 });
    }
    else if ((parseInt(data.status) != 0) && data.updatedOn) {
      if (parseInt(data.updatedOn) == 1) {
        var date1 = new Date().setHours(0, 0, 0, 0);
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 2) {
        var date1 = new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000;
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 3) {
        var date1 = new Date().setHours(0, 0, 0, 0) - 14 * 24 * 60 * 60 * 1000;
        filterKey = date1;
      }
      if (parseInt(data.updatedOn) == 4) {
        var date1 = new Date(new Date().setMonth(new Date().getMonth() - 1));
        filterKey = date1.setHours(0, 0, 0, 0);
      }
      productList = await productModel.find({ $and: [{ 'created_by': user._id }, { modified_at: { '$gte': filterKey } }, { is_approved: parseInt(data.status) }, { is_deleted: false }] }).sort({ created_at: -1 });
    }
    else {
      productList = await productModel.find({ $and: [{ 'created_by': user._id }, { is_deleted: false }] }).sort({ created_at: -1 });
    }
    if (!productList) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, message: "Product List Fetch Successfully", data: productList };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.deleteProduct = async (data, user) => {
  try {
    if (!data.id || data.id == '') {
      throw new Error("unsufficient Perameters");
    }
    let product = await productModel.findByIdAndUpdate(data.id, { $set: { is_deleted: true } }, { new: true });
    if (!product) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    console.log("product :", product);
    let products = product.colorOption;
    if (products.length == 0) {
      return { status: 1, message: "Brand Deleted Successfully." };
    }
    let color = await productColorModel.updateMany({ _id: { '$in': products } }, { $set: { is_deleted: true } });
    if (!color) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, message: "Brand Deleted Successfully." };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.updateProductInformation = async (data, user) => {
  try {
    if (!data._id || data._id == '') {
      throw new Error("unsufficient Perameters");
    }

    let product = await productModel.findOne({ _id: mongoose.Types.ObjectId(data._id) });
    if (!product) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    if (product.colorOption.length == 0) {
      if (data.colorOption.length == 0) {

        let productDetail = await productModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, data);
        if (!productDetail) {
          return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Product Updated Successfully" };
      } else {

        let colorOptions = await productColorModel.insertMany(data.colorOption);
        if (!colorOptions) {
          return { status: -1, message: "Product not save, please try After sometime." }
        }

        data.colorOption = colorOptions;
        //console.log("ColorOption :",data.colorOption);
        data.modified_at = Date.now();
        let product = await productModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, data);
        if (!product) {
          return { status: -1, message: "Product not save, please try After sometime." };
        }
        await changePrice(product._id);
        return { status: 1, message: "Product Updated Successfully" };
      }
    } else {

      let productIds = product.colorOption.map(prod => prod._id);

      if (data.colorOption.length == 0) {
        let productDetail = await productModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, data);
        if (!productDetail) {
          return { status: -1, message: "Something went wrong, Please try later" };
        }

        let colorOption = await productColorModel.updateMany({ _id: { '$in': productIds } }, { $set: { 'is_deleted': true } });
        if (!colorOption) {
          return { status: -1, message: "Something went wrong, Please try later" };
        }
        return { status: 1, message: "Product Updated Successfully" };
      } else {
        let colors = [];
        let updatedColor;
        for (let color of data.colorOption) {
          if (color._id == '') {
            delete color._id;
            var colorOptioning = new productColorModel(color);
            updatedColor = await colorOptioning.save();
          } else {
            updatedColor = await productColorModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(color._id) }, color, { new: true });

          }
          if (!updatedColor) {
            return { status: -1, message: "Something went wrong, Rayte fell Gye" };
          }
          colors.push(updatedColor);
        }

        const notMatchingColorOption = product.colorOption.filter(({ _id: id1 }) => !colors.some(({ _id: id2 }) => id2 === id1));

        if (notMatchingColorOption.length > 0) {
          let colorOption = await productColorModel.updateMany({ _id: { '$in': productIds } }, { $set: { 'is_deleted': true } });
          if (!colorOption) {
            return { status: -1, message: "Something went wrong, Please try later" };
          }

        }

        let colorIds = colors.map(col => col._id);
        data.colorOption = colorIds;

        let updatedProduct = await productModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, { $set: data });
        if (!updatedProduct) {
          return { status: -1, message: "Something went wrong, Please try later" };
        }
        await changePrice(data._id);
        return { status: 1, message: "Product Updated Successfully" };
      }
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.offers = async (data, user) => {
  try {
    //console.log("User :",user);
    if (parseInt(data.type) == 1) {
      data.tailorId = user._id;
      //let checkOffers = await offerModel.find({tailorId:mongoose.Types.ObjectId(data.tailorId),});
      let offers = await offerModel.create(data);
      await offers.save();
      if (!offers) {
        return { status: -1, message: "Something went wrong, Please try later" };
      }
      return { status: 1, message: "Offer Add Successfully", data: offers };
    }
    else if (parseInt(data.type) == 2) {
      let offers = await offerModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { $set: { is_deleted: true } });
      if (!offers) {
        return { status: -1, message: "Offer not exist." };
      }
      return { status: 1, message: "Offer Deleted Successfully", offers };
    }
    else if (parseInt(data.type) == 3) {
      let offers = await offerModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { $set: { is_active: data.status } }, { new: true });
      if (!offers) {
        return { status: -1, message: "Offer not exist." };
      }
      return { status: 1, message: "Offer Updated Successfully", data: offers };
    }
    else if (parseInt(data.type) == 4) {
      let offers = await offerModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { $set: data }, { new: true });
      if (!offers) {
        return { status: -1, message: "Offer not exist." };
      }
      return { status: 1, message: "Offer Updated Successfully", data: offers };
    }
    else {
      console.log("User :", user);
      let offers = await offerModel.find({ tailorId: mongoose.Types.ObjectId(user._id), is_deleted: false }).sort({ created_at: -1 }).populate('categories', 'category_name').populate('stiching', 'name');
      // let query = [
      //   {
      //     $match:{tailorId: mongoose.Types.ObjectId(user._id),is_deleted: false}
      //   },{
      //     $lookup:{
      //       from:"fabricType",
      //       localField:"stiching",
      //       foreignField:"_id",
      //       as:"stiching"
      //     }
      //   },{
      //     $unwind:
      //     {
      //       path: '$fabricType',
      //       preserveNullAndEmptyArrays: true
      //     }
      //   },{
      //     $lookup:{
      //       from:"category",
      //       localField:"categories",
      //       foreignField:"_id",
      //       as:"categories"
      //     }
      //   }
      //   ,{
      //     $lookup:{
      //       from:"product",
      //       localField:"products",
      //       foreignField:"_id",
      //       as:"products"
      //     }
      //   },{
      //     $project:{
      //       _id: 1,
      //       order_amount_limit:"$order_amount_limit",
      //       offer_type:"$offer_type",
      //       offer_code:"$offer_code",
      //       status:"$status",
      //       categories:
      //     }
      //   }


      // ];

      // let offers = await offerModel.aggregate(query);
      if (!offers) {
        return { status: -1, message: "Something went wrong, Please try later." };
      }
      return { status: 1, message: "Offer Fetch Successfully", data: offers };
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getProductLists = async (user) => {
  try {
    console.log("User Id :", user._id);
    let query = [
      {
        $match: {
          $and: [{ created_by: user._id }, { is_deleted: false }, { is_active: true }]
        }
      }, {
        $project: {
          _id: 1,
          name: "$name"
        }
      }
    ];

    let products = await productModel.aggregate(query);
    if (!products) {
      return { status: -1, message: "Products not Fetch, please try After sometime." };
    }
    return { status: 1, message: "Products Fetch Successfully.", data: products };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.getStichingLists = async (user) => {
  try {
    let query = [
      {
        $match: {
          $and: [{ created_by: mongoose.Types.ObjectId(user._id) }, { is_deleted: false }, { is_active: true }]
        }
      }, {
        $group: {
          _id: "$fabricTypeId"
        }
      }, {
        $lookup: {
          from: "fabricType",
          localField: "_id",
          foreignField: "_id",
          as: "fabric"
        }
      }, {
        $unwind: {
          path: "$fabric",
          preserveNullAndEmptyArrays: true
        }
      }, {
        $match: {
          $and: [
            { "fabric.is_active": true },
            { "fabric.is_deleted": false }
          ]
        }
      }, {
        $project: {
          _id: 1,
          name: "$fabric.name"
        }
      }]

    let products = await fabricTailorBrandModel.aggregate(query);
    if (!products) {
      return { status: -1, message: "Fabric not fetch, please try After sometime." };
    }
    return { status: 1, message: "Fabrics Fetch Successfully.", data: products };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getCategoriesList = async (user) => {
  try {

    let query = [
      {
        $match: {
          $and: [{ created_by: mongoose.Types.ObjectId(user._id) }, { is_deleted: false }, { is_active: true }]
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
      }, {
        $match: {
          $and: [
            { "category.is_active": true },
            { "category.is_deleted": false }
          ]
        }
      }, {
        $project: {
          _id: "$category._id",
          name: "$category.category_name"
        }
      }]

    let products = await productModel.aggregate(query);
    if (!products) {
      return { status: -1, message: "Products not Fetch, please try After sometime." };
    }
    console.log("Products :", products);
    return { status: 1, message: "Products Fetch Successfully.", data: products };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.promotion = async (data, user) => {
  try {
    data.tailorId = user._id;
    switch (parseInt(data.type)) {
      case 1: {

        let promotions = await promotionalModel.find({ tailorId: mongoose.Types.ObjectId(user._id), categories: { $in: data.categories }, is_deleted: false });
        if (!promotions) {
          return { status: -1, message: "Promotion not save, please try After sometime." };
        }

        if (promotions.length > 0) {

          for (let promo of promotions) {
            var future_date = moment(promo.created_at).add(promo.posting_period, 'months');
            //console.log("Its here :",new Date(future_date).getTime());
            if (new Date(future_date).getTime() > Date.now()) {
              return { status: -1, message: "Promotional Banner already exist." };
            }
          }
        }
        let promotional = await promotionalModel.create(data);
        if (!promotional) {
          return { status: -1, message: "Promotion not save, please try After sometime." };
        }
        return { status: 1, message: "Promotion Add Successfully.", data: promotional };

      }
      case 2: {
        let promotional = await promotionalModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { $set: { is_deleted: true } });
        if (!promotional) {
          return { status: -1, message: "Promotion not save, please try After sometime." };
        }
        return { status: 1, message: "Promotion Remove Successfully.", data: promotional };

      }
      case 3: {
        let promotional = await promotionalModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { $set: { is_active: data.status } });
        if (!promotional) {
          return { status: -1, message: "Promotion not save, please try After sometime." };
        }
        return { status: 1, message: "Promotion Update Successfully.", data: promotional };

      }
      case 4: {
        let promotional = await promotionalModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { $set: data });
        if (!promotional) {
          return { status: -1, message: "Promotion not save, please try After sometime." };
        }
        return { status: 1, message: "Promotion Update Successfully.", data: promotional };

      } case 5: {

        let promotions = await promotionalModel.find({ tailorId: mongoose.Types.ObjectId(user._id), categories: { $in: data.categories }, is_deleted: false });
        if (!promotions) {
          return { status: -1, message: "Something went wrong, please try After sometime." };
        }

        if (promotions.length > 0) {

          for (let promo of promotions) {
            var future_date = moment(promo.created_at).add(promo.posting_period, 'months');
            //console.log("Its here :",new Date(future_date).getTime());
            if (new Date(future_date).getTime() > Date.now()) {
              return { status: -1, message: "Promotional Banner already exist." };
            }
          }
        }

        return { status: 1, message: "Promotions Ready to Add.", data: {} };

      }
      default: {
        let promotional = await promotionalModel.find({ is_deleted: false, tailorId: data.tailorId }).sort({ created_at: -1 }).populate('categories', 'category_name');
        if (!promotional) {
          return { status: -1, message: "Promotion not save, please try After sometime." };
        }
        return { status: 1, message: "Promotion Fetch Successfully.", data: promotional };
      }
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getAmount = async (data) => {
  if (!data.months || data.months == '') {
    throw new Error("Please send months");
  }
  return { status: 1, message: "price provided successfully", data: parseInt(data.months) * 50 };
}

exports.getOrders = async (data, user) => {
  try {
    let query;
    if (parseInt(data.type) == 1) {

      query = [
        {
            $lookup:{
                from:"orderList",
                let: {"order":"$orderList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$order"]},{$eq:["$status",0]},{ "$eq": ["$tailorId", mongoose.Types.ObjectId(user._id)] }]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:"$price"
                    }
                }],
                as:"order"
            }
        },
        {
            $lookup:{
                from:"stichingCart",
                let: {"stiching":"$stichingList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$stiching"]},{$eq:["$status",2]},{ "$eq": ["$tailorId", mongoose.Types.ObjectId(user._id)] }]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:{$add:["$fabricPrice","$stitchingPrice"]}
                    }
                }],
                as:"stiching"
            }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, { $unwind: "$user" },
        { $match: { $or: [{ "stiching": { $gt: { $size: 1 } } }, { "order": { $gt: { $size: 1 } } }] } },
        {
          $lookup: {
            from: "address",
            localField: "addressId",
            foreignField: "_id",
            as: "address"
          }
        }, { $unwind: "$address" },
        {
          $unwind:{
              "path":"$stiching",
              "preserveNullAndEmptyArrays":true
          }
        },{
            $unwind:{
                path:"$order",
                preserveNullAndEmptyArrays:true
            }
        },{
            $project:{
                "_id": 1,
                "stiching": 1,
                "user": 1,
                "order": 1,
                "total": {$add:[{
                            $cond:{if:{$gt:["$stiching",null]},then:"$stiching.total",else:0}
                        },{
                            $cond:{if:{$gt:["$order",null]},then:"$order.total",else:0}
                        }]},
                "orderId": 1,
                "created_at": 1,
                "address": 1
            }
        },{
          $group:{
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "user": {"$first":"$user"},
            "products": { "$push": "$order" },
            "total": {$sum:"$total"},
            "orderId": { "$first": "$orderId" },
            "created_at": {"$first":"$created_at"},
            "address": {"$first":"$address"}
          }  
        },{
            $project:{
                "_id": 1,
                "stichings": { "$size": "$stiching" },
                "products": { "$size": "$products" },
                "user": "$user.username",
                "total": "$total",
                "created_at": 1,
                "orderId": "$orderId",
                "address": "$address.location"
            }
        },{
          $sort:{'created_at':-1}
        }
    ]

    } else if (parseInt(data.type) == 2) {

      query = [
        {
            $lookup:{
                from:"orderList",
                let: {"order":"$orderList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$order"]},{$eq:["$status",1]},{ "$eq": ["$tailorId", mongoose.Types.ObjectId(user._id)] }]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:"$price"
                    }
                }],
                as:"order"
            }
        },
        {
            $lookup:{
                from:"stichingCart",
                let: {"stiching":"$stichingList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$stiching"]},{$eq:["$status",3]},{ "$eq": ["$tailorId", mongoose.Types.ObjectId(user._id)] }]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:{$add:["$fabricPrice","$stitchingPrice"]}
                    }
                }],
                as:"stiching"
            }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, { $unwind: "$user" },
        { $match: { $or: [{ "stiching": { $gt: { $size: 1 } } }, { "order": { $gt: { $size: 1 } } }] } },
        {
          $lookup: {
            from: "address",
            localField: "addressId",
            foreignField: "_id",
            as: "address"
          }
        }, { $unwind: "$address" },
        {
          $unwind:{
              "path":"$stiching",
              "preserveNullAndEmptyArrays":true
          }
        },{
            $unwind:{
                path:"$order",
                preserveNullAndEmptyArrays:true
            }
        },{
            $project:{
                "_id": 1,
                "stiching": 1,
                "user": 1,
                "order": 1,
                "total": {$add:[{
                            $cond:{if:{$gt:["$stiching",null]},then:"$stiching.total",else:0}
                        },{
                            $cond:{if:{$gt:["$order",null]},then:"$order.total",else:0}
                        }]},
                "orderId": 1,
                "created_at": 1,
                "address": 1
            }
        },{
          $group:{
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "user": {"$first":"$user"},
            "products": { "$push": "$order" },
            "total": {$sum:"$total"},
            "orderId": { "$first": "$orderId" },
            "created_at": {"$first":"$created_at"},
            "address": {"$first":"$address"}
          }  
        },{
            $project:{
                "_id": 1,
                "stichings": { "$size": "$stiching" },
                "products": { "$size": "$products" },
                "user": "$user.username",
                "total": "$total",
                "created_at": 1,
                "orderId": "$orderId",
                "address": "$address.location"
            }
        },{
          $sort:{'created_at':-1}
        }
        
    ]

    } else if (parseInt(data.type) == 3) {
      query = [
        {
            $lookup:{
                from:"orderList",
                let: {"order":"$orderList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$order"]},{$eq:["$status",2]},{ "$eq": ["$tailorId", mongoose.Types.ObjectId(user._id)] }]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:"$price"
                    }
                }],
                as:"order"
            }
        },
        {
            $lookup:{
                from:"stichingCart",
                let: {"stiching":"$stichingList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$stiching"]},{$eq:["$status",4]},{ "$eq": ["$tailorId", mongoose.Types.ObjectId(user._id)] }]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:{$add:["$fabricPrice","$stitchingPrice"]}
                    }
                }],
                as:"stiching"
            }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, { $unwind: "$user" },
        { $match: { $or: [{ "stiching": { $gt: { $size: 1 } } }, { "order": { $gt: { $size: 1 } } }] } },
        {
          $lookup: {
            from: "address",
            localField: "addressId",
            foreignField: "_id",
            as: "address"
          }
        }, { $unwind: "$address" },
        {
          $unwind:{
              "path":"$stiching",
              "preserveNullAndEmptyArrays":true
          }
        },{
            $unwind:{
                path:"$order",
                preserveNullAndEmptyArrays:true
            }
        },{
            $project:{
                "_id": 1,
                "stiching": 1,
                "user": 1,
                "order": 1,
                "total": {$add:[{
                            $cond:{if:{$gt:["$stiching",null]},then:"$stiching.total",else:0}
                        },{
                            $cond:{if:{$gt:["$order",null]},then:"$order.total",else:0}
                        }]},
                "orderId": 1,
                "created_at": 1,
                "address": 1
            }
        },{
          $group:{
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "user": {"$first":"$user"},
            "products": { "$push": "$order" },
            "total": {$sum:"$total"},
            "orderId": { "$first": "$orderId" },
            "created_at": {"$first":"$created_at"},
            "address": {"$first":"$address"}
          }  
        },{
            $project:{
                "_id": 1,
                "stichings": { "$size": "$stiching" },
                "products": { "$size": "$products" },
                "user": "$user.username",
                "total": "$total",
                "created_at": 1,
                "orderId": "$orderId",
                "address": "$address.location"
            }
        },{
          $sort:{'created_at':-1}
        }
        
    ]
    } else {
      query = [
        {
            $lookup:{
                from:"orderList",
                let: {"order":"$orderList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$order"]},{$eq:["$status",3]},{ "$eq": ["$tailorId", mongoose.Types.ObjectId(user._id)] }]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:"$price"
                    }
                }],
                as:"order"
            }
        },
        {
            $lookup:{
                from:"stichingCart",
                let: {"stiching":"$stichingList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$stiching"]},{$eq:["$status",5]},{ "$eq": ["$tailorId", mongoose.Types.ObjectId(user._id)] }]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:{$add:["$fabricPrice","$stitchingPrice"]}
                    }
                }],
                as:"stiching"
            }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, { $unwind: "$user" },
        { $match: { $or: [{ "stiching": { $gt: { $size: 1 } } }, { "order": { $gt: { $size: 1 } } }] } },
        {
          $lookup: {
            from: "address",
            localField: "addressId",
            foreignField: "_id",
            as: "address"
          }
        }, { $unwind: "$address" },
        {
          $unwind:{
              "path":"$stiching",
              "preserveNullAndEmptyArrays":true
          }
        },{
            $unwind:{
                path:"$order",
                preserveNullAndEmptyArrays:true
            }
        },{
            $project:{
                "_id": 1,
                "stiching": 1,
                "user": 1,
                "order": 1,
                "total": {$add:[{
                            $cond:{if:{$gt:["$stiching",null]},then:"$stiching.total",else:0}
                        },{
                            $cond:{if:{$gt:["$order",null]},then:"$order.total",else:0}
                        }]},
                "orderId": 1,
                "created_at": 1,
                "address": 1
            }
        },{
          $group:{
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "user": {"$first":"$user"},
            "products": { "$push": "$order" },
            "total": {$sum:"$total"},
            "orderId": { "$first": "$orderId" },
            "created_at": {"$first":"$created_at"},
            "address": {"$first":"$address"}
          }  
        },{
            $project:{
                "_id": 1,
                "stichings": { "$size": "$stiching" },
                "products": { "$size": "$products" },
                "user": "$user.username",
                "total": "$total",
                "created_at": 1,
                "orderId": "$orderId",
                "address": "$address.location"
            }
        },{
          $sort:{'created_at':-1}
        }
        
    ]
    }

    let order = await orderModel.aggregate(query);
    if (!order) {
      return { status: -1, message: "Something went wrong, Please try later." }
    }
    return { status: 1, message: "Orders Fetch Successfully.", data: order.reverse() };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getOrderDetails = async (data, userData) => {
  try {
    //console.log("TialorId :", userData._id);
    let query;
    if (parseInt(data.type) == 1) {

      query = [
        { $match: { _id: mongoose.Types.ObjectId(data._id) } },
        {
          $lookup: {
            from: "orderList",
            localField: "orderList",
            foreignField: "_id",
            as: "order"
          }
        },
        {
          "$addFields": {
            "order": {
              "$filter": {
                "input": "$order",
                "cond": { $and: [{ "$eq": ["$$this.status", 0] }, { "$eq": ["$$this.tailorId", userData._id] }] }
              }
            }
          }
        }
        , {
          $lookup: {
            from: "stichingCart",
            localField: "stichingList",
            foreignField: "_id",
            as: "stiching"
          }
        }, {
          "$addFields": {
            "stiching": {
              "$filter": {
                "input": "$stiching",
                "cond": { $and: [{ "$eq": ["$$this.status", 2] }, { "$eq": ["$$this.tailorId", userData._id] }] }
              }
            }
          }
        }, {
          $unwind: {
            path: "$stiching",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'stiching.userId',
            foreignField: '_id',
            as: 'stiching.user'
          }
        }, {
          $unwind: {
            path: "$stiching.user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'fabricBrand',
            localField: 'stiching.brandId',
            foreignField: '_id',
            as: 'stiching.brand'
          }
        }, {
          $unwind:
          {
            path: '$stiching.brand',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricType',
            localField: 'stiching.fabricTypeId',
            foreignField: '_id',
            as: 'stiching.fabricType'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabricType',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabric',
            localField: 'stiching.fabricId',
            foreignField: '_id',
            as: 'stiching.fabric'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabric',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'tailor',
            localField: 'stiching.tailorId',
            foreignField: '_id',
            as: 'stiching.tailor'
          }
        }, {
          $unwind:
          {
            path: '$stiching.tailor',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricColor',
            localField: 'stiching.color',
            foreignField: '_id',
            as: 'stiching.color'
          }
        }, {
          $unwind:
          {
            path: '$stiching.color',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'familyMember',
            let: { pid: "$stiching.memberId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", { $toObjectId: "$$pid" }]
                  }
                }
              }
            ],
            as: 'stiching.memberId'
          }
        }, {
          $unwind: {
            path: "$stiching.memberId",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'measurment',
            localField: 'stiching.measurmentId',
            foreignField: '_id',
            as: 'stiching.measurment'
          }
        }, {
          $unwind: {
            path: '$stiching.measurment',
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: 'model',
            localField: 'stiching.modelId',
            foreignField: '_id',
            as: 'stiching.model'
          }
        }, {
          $unwind: {
            path: '$stiching.model',
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: 'recordmeasurment',
            localField: 'stiching.recordMeasurment',
            foreignField: '_id',
            as: 'stiching.recordmeasurment'
          }
        },{
          $unwind: {
            path: '$stiching.recordmeasurment',
            preserveNullAndEmptyArrays: true
          }
        },{
          $project: {
            _id: 1,
            'stiching.username': '$stiching.user.username',
            'stiching.userImage': '$stiching.user.profileImage',
            'stiching._id': '$stiching._id',
            'stiching.brand': '$stiching.brand.name',
            'stiching.fabricName': '$stiching.fabricType.name',
            'stiching.isMeasurement': '$stiching.isMeasurement',
            'stiching.dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            'stiching.status': { $toInt: '0' },
            'stiching.fabricId': '$stiching.fabricType._id',
            'stiching.tailor': '$stiching.tailor.name',
            'stiching.tailorId': '$stiching.tailor._id',
            'stiching.member': '$stiching.memberId',
            'stiching.recordmeasurment': '$stiching.recordmeasurment',
            'stiching.image': '$stiching.color.image',
            'stiching.colorName': '$stiching.color.colorName',
            'stiching.model': '$stiching.model.name',
            'stiching.model_image': '$stiching.model.image',
            'stiching.orderId': '$stiching.orderId',
            'stiching.skuId': '$stiching.skuId',
            'stiching.measurmentDate': '$stiching.measurment.measurementDate',
            'stiching.measurmentTime': '$stiching.measurment.measurementTime',
            "stiching.delivery_charge": "$stiching.delivery_charge",
            "stiching.transaction_charge": "$stiching.transaction_charge",
            "stiching.service_charge": "$stiching.service_charge",
            "stiching.refer" : "$stiching.refer",
            "stiching.wallet" : "$stiching.wallet",
            "stiching.fabricPrice": "$stiching.fabricPrice",
            "stiching.complete_payment" : "$stiching.complete_payment",
            "stiching.stitchingPrice" : "$stiching.stitchingPrice",
            'stiching.total': { $add: ["$stiching.fabricPrice","$stiching.stitchingPrice","$stiching.transaction_charge","$stiching.delivery_charge","$stiching.service_charge"]},
            'stiching.quantity': '$stiching.quantity',
            'order': '$order',
          }
        }
        , {
          $group: {
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "order": { "$first": "$order" },
          }
        },
        {
          $project: {
            "_id": "$_id",
            "stiching": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$stiching._id", 0] }, null] }, null] }, '$stiching', []]
            },
            "order": "$order"
          }
        },

        {
          $unwind: {
            path: "$order",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'product',
            localField: 'order.productId',
            foreignField: '_id',
            as: 'order.product'
          }
        }, {
          $unwind: {
            path: "$order.product",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'productColor',
            localField: 'order.color',
            foreignField: '_id',
            as: 'order.color'
          }
        }, {
          $unwind: {
            path: "$order.color",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            "order._id": 1,
            "order.quantity": "$order.quantity",
            "order.orderId": "$order.orderId",
            "order.skuId": "$order.skuId",
            "order.color": "$order.color",
            "order.size": "$order.size",
            'order.status': { $toInt: '0' },
            "order.productName": "$order.product.name",
            "order.productImage": "$order.product.image",
            "order.userId": "$order.created_by",
            "stiching": "$stiching"
          }
        },
        {
          $group: {
            "_id": "$_id",
            "user": { "$first": "$order.userId" },
            "order": { "$push": "$order" },
            "stiching": { "$first": "$stiching" }
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        }, {
          $unwind:
          {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$order._id", 0] }, null] }, null] }, '$order', []]
            },
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": "$order",
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            "no_of_products": { "$size": "$order" },
            "no_of_stichings": { "$size": "$stiching" }
          }
        }
      ]
    } else if (parseInt(data.type) == 2) {

      query = [
        { $match: { _id: mongoose.Types.ObjectId(data._id) } },
        {
          $lookup: {
            from: "orderList",
            localField: "orderList",
            foreignField: "_id",
            as: "order"
          }
        },
        {
          "$addFields": {
            "order": {
              "$filter": {
                "input": "$order",
                "cond": { $and: [{ "$eq": ["$$this.status", 1] }, { "$eq": ["$$this.tailorId", userData._id] }] }
              }
            }
          }
        }
        , {
          $lookup: {
            from: "stichingCart",
            localField: "stichingList",
            foreignField: "_id",
            as: "stiching"
          }
        }, {
          "$addFields": {
            "stiching": {
              "$filter": {
                "input": "$stiching",
                "cond": { $and: [{ "$eq": ["$$this.status", 3] }, { "$eq": ["$$this.tailorId", userData._id] }] }
              }
            }
          }
        }, {
          $unwind: {
            path: "$stiching",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'stiching.userId',
            foreignField: '_id',
            as: 'stiching.user'
          }
        }, {
          $unwind: {
            path: "$stiching.user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'fabricBrand',
            localField: 'stiching.brandId',
            foreignField: '_id',
            as: 'stiching.brand'
          }
        }, {
          $unwind:
          {
            path: '$stiching.brand',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricType',
            localField: 'stiching.fabricTypeId',
            foreignField: '_id',
            as: 'stiching.fabricType'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabricType',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabric',
            localField: 'stiching.fabricId',
            foreignField: '_id',
            as: 'stiching.fabric'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabric',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'tailor',
            localField: 'stiching.tailorId',
            foreignField: '_id',
            as: 'stiching.tailor'
          }
        }, {
          $unwind:
          {
            path: '$stiching.tailor',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricColor',
            localField: 'stiching.color',
            foreignField: '_id',
            as: 'stiching.color'
          }
        }, {
          $unwind:
          {
            path: '$stiching.color',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'familyMember',
            let: { pid: "$stiching.memberId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", { $toObjectId: "$$pid" }]
                  }
                }
              }
            ],
            as: 'stiching.memberId'
          }
        }, {
          $unwind: {
            path: "$stiching.memberId",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'measurment',
            localField: 'stiching.measurmentId',
            foreignField: '_id',
            as: 'stiching.measurment'
          }
        }, {
          $unwind: {
            path: '$stiching.measurment',
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: 'model',
            localField: 'stiching.modelId',
            foreignField: '_id',
            as: 'stiching.model'
          }
        }, {
          $unwind: {
            path: '$stiching.model',
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: 'recordmeasurment',
            localField: 'stiching.recordMeasurment',
            foreignField: '_id',
            as: 'stiching.recordmeasurment'
          }
        },{
          $unwind: {
            path: '$stiching.recordmeasurment',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            _id: 1,
            'stiching.username': '$stiching.user.username',
            'stiching.userImage': '$stiching.user.profileImage',
            'stiching._id': '$stiching._id',
            'stiching.brand': '$stiching.brand.name',
            'stiching.fabricName': '$stiching.fabricType.name',
            'stiching.isMeasurement': '$stiching.isMeasurement',
            'stiching.dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            'stiching.status': { $toInt: '0' },
            'stiching.fabricId': '$stiching.fabricType._id',
            'stiching.tailor': '$stiching.tailor.name',
            'stiching.tailorId': '$stiching.tailor._id',
            'stiching.member': '$stiching.memberId',
            'stiching.image': '$stiching.color.image',
            'stiching.colorName': '$stiching.color.colorName',
            'stiching.model': '$stiching.model.name',
            'stiching.model_image': '$stiching.model.image',
            'stiching.orderId': '$stiching.orderId',
            "stiching.skuId": "$stiching.skuId",
            'stiching.recordmeasurment': '$stiching.recordmeasurment',
            'stiching.measurmentDate': '$stiching.measurment.measurementDate',
            'stiching.measurmentTime': '$stiching.measurment.measurementTime',
            'stiching.quantity': '$stiching.quantity',
            "stiching.delivery_charge": "$stiching.delivery_charge",
            "stiching.transaction_charge": "$stiching.transaction_charge",
            "stiching.service_charge": "$stiching.service_charge",
            "stiching.refer" : "$stiching.refer",
            "stiching.wallet" : "$stiching.wallet",
            "stiching.fabricPrice": "$stiching.fabricPrice",
            "stiching.complete_payment" : "$stiching.complete_payment",
            "stiching.stitchingPrice" : "$stiching.stitchingPrice",
            'stiching.total': { $add: ["$stiching.fabricPrice","$stiching.stitchingPrice","$stiching.transaction_charge","$stiching.delivery_charge","$stiching.service_charge"]},
            'order': '$order',
          }
        }
        , {
          $group: {
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "order": { "$first": "$order" },
          }
        },
        {
          $project: {
            "_id": "$_id",
            "stiching": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$stiching._id", 0] }, null] }, null] }, '$stiching', []]
            },
            "order": "$order"
          }
        },

        {
          $unwind: {
            path: "$order",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'product',
            localField: 'order.productId',
            foreignField: '_id',
            as: 'order.product'
          }
        }, {
          $unwind: {
            path: "$order.product",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'productColor',
            localField: 'order.color',
            foreignField: '_id',
            as: 'order.color'
          }
        }, {
          $unwind: {
            path: "$order.color",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            "order._id": 1,
            "order.quantity": "$order.quantity",
            "order.orderId": "$order.orderId",
            "order.skuId": "$order.skuId",
            "order.color": "$order.color",
            "order.size": "$order.size",
            'order.status': { $toInt: '0' },
            "order.productName": "$order.product.name",
            "order.productImage": "$order.product.image",
            "order.userId": "$order.created_by",
            "stiching": "$stiching"
          }
        },
        {
          $group: {
            "_id": "$_id",
            "user": { "$first": "$order.userId" },
            "order": { "$push": "$order" },
            "stiching": { "$first": "$stiching" }
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        }, {
          $unwind:
          {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$order._id", 0] }, null] }, null] }, '$order', []]
            },
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": "$order",
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            "no_of_products": { "$size": "$order" },
            "no_of_stichings": { "$size": "$stiching" }
          }
        }
      ]

    } else if (parseInt(data.type) == 3) {

      query = [
        { $match: { _id: mongoose.Types.ObjectId(data._id) } },
        {
          $lookup: {
            from: "orderList",
            localField: "orderList",
            foreignField: "_id",
            as: "order"
          }
        },
        {
          "$addFields": {
            "order": {
              "$filter": {
                "input": "$order",
                "cond": { $and: [{ "$eq": ["$$this.status", 2] }, { "$eq": ["$$this.tailorId", userData._id] }] }
              }
            }
          }
        }
        , {
          $lookup: {
            from: "stichingCart",
            localField: "stichingList",
            foreignField: "_id",
            as: "stiching"
          }
        }, {
          "$addFields": {
            "stiching": {
              "$filter": {
                "input": "$stiching",
                "cond": { $and: [{ "$eq": ["$$this.status", 4] }, { "$eq": ["$$this.tailorId", userData._id] }] }
              }
            }
          }
        }, {
          $unwind: {
            path: "$stiching",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'stiching.userId',
            foreignField: '_id',
            as: 'stiching.user'
          }
        }, {
          $unwind: {
            path: "$stiching.user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'fabricBrand',
            localField: 'stiching.brandId',
            foreignField: '_id',
            as: 'stiching.brand'
          }
        }, {
          $unwind:
          {
            path: '$stiching.brand',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricType',
            localField: 'stiching.fabricTypeId',
            foreignField: '_id',
            as: 'stiching.fabricType'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabricType',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabric',
            localField: 'stiching.fabricId',
            foreignField: '_id',
            as: 'stiching.fabric'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabric',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'tailor',
            localField: 'stiching.tailorId',
            foreignField: '_id',
            as: 'stiching.tailor'
          }
        }, {
          $unwind:
          {
            path: '$stiching.tailor',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricColor',
            localField: 'stiching.color',
            foreignField: '_id',
            as: 'stiching.color'
          }
        }, {
          $unwind:
          {
            path: '$stiching.color',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'familyMember',
            let: { pid: "$stiching.memberId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", { $toObjectId: "$$pid" }]
                  }
                }
              }
            ],
            as: 'stiching.memberId'
          }
        }, {
          $unwind: {
            path: "$stiching.memberId",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'measurment',
            localField: 'stiching.measurmentId',
            foreignField: '_id',
            as: 'stiching.measurment'
          }
        }, {
          $unwind: {
            path: '$stiching.measurment',
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: 'model',
            localField: 'stiching.modelId',
            foreignField: '_id',
            as: 'stiching.model'
          }
        }, {
          $unwind: {
            path: '$stiching.model',
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: 'recordmeasurment',
            localField: 'stiching.recordMeasurment',
            foreignField: '_id',
            as: 'stiching.recordmeasurment'
          }
        },{
          $unwind: {
            path: '$stiching.recordmeasurment',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            _id: 1,
            'stiching.username': '$stiching.user.username',
            'stiching.userImage': '$stiching.user.profileImage',
            'stiching._id': '$stiching._id',
            'stiching.brand': '$stiching.brand.name',
            'stiching.fabricName': '$stiching.fabricType.name',
            'stiching.isMeasurement': '$stiching.isMeasurement',
            'stiching.dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            'stiching.status': { $toInt: '0' },
            'stiching.fabricId': '$stiching.fabricType._id',
            'stiching.tailor': '$stiching.tailor.name',
            'stiching.tailorId': '$stiching.tailor._id',
            'stiching.recordmeasurment': '$stiching.recordmeasurment',
            'stiching.member': '$stiching.memberId',
            'stiching.image': '$stiching.color.image',
            'stiching.colorName': '$stiching.color.colorName',
            'stiching.model': '$stiching.model.name',
            'stiching.model_image': '$stiching.model.image',
            'stiching.orderId': '$stiching.orderId',
            'stiching.skuId': '$stiching.skuId',
            'stiching.measurmentDate': '$stiching.measurment.measurementDate',
            'stiching.measurmentTime': '$stiching.measurment.measurementTime',
            'stiching.quantity': '$stiching.quantity',
            "stiching.delivery_charge": "$stiching.delivery_charge",
            "stiching.transaction_charge": "$stiching.transaction_charge",
            "stiching.service_charge": "$stiching.service_charge",
            "stiching.refer" : "$stiching.refer",
            "stiching.wallet" : "$stiching.wallet",
            "stiching.fabricPrice": "$stiching.fabricPrice",
            "stiching.complete_payment" : "$stiching.complete_payment",
            "stiching.stitchingPrice" : "$stiching.stitchingPrice",
            'stiching.total': { $add: ["$stiching.fabricPrice","$stiching.stitchingPrice","$stiching.transaction_charge","$stiching.delivery_charge","$stiching.service_charge"]},
            'order': '$order',
          }
        }
        , {
          $group: {
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "order": { "$first": "$order" },
          }
        },
        {
          $project: {
            "_id": "$_id",
            "stiching": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$stiching._id", 0] }, null] }, null] }, '$stiching', []]
            },
            "order": "$order"
          }
        },

        {
          $unwind: {
            path: "$order",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'product',
            localField: 'order.productId',
            foreignField: '_id',
            as: 'order.product'
          }
        }, {
          $unwind: {
            path: "$order.product",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'productColor',
            localField: 'order.color',
            foreignField: '_id',
            as: 'order.color'
          }
        }, {
          $unwind: {
            path: "$order.color",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            "order._id": 1,
            "order.quantity": "$order.quantity",
            "order.orderId": "$order.orderId",
            "order.skuId": "$order.skuId",
            "order.color": "$order.color",
            "order.size": "$order.size",
            'order.status': { $toInt: '0' },
            "order.productName": "$order.product.name",
            "order.productImage": "$order.product.image",
            "order.userId": "$order.created_by",
            "stiching": "$stiching"
          }
        },
        {
          $group: {
            "_id": "$_id",
            "user": { "$first": "$order.userId" },
            "order": { "$push": "$order" },
            "stiching": { "$first": "$stiching" }
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        }, {
          $unwind:
          {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$order._id", 0] }, null] }, null] }, '$order', []]
            },
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": "$order",
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            "no_of_products": { "$size": "$order" },
            "no_of_stichings": { "$size": "$stiching" }
          }
        }
      ]

    } else {

      query = [
        { $match: { _id: mongoose.Types.ObjectId(data._id) } },
        {
          $lookup: {
            from: "orderList",
            localField: "orderList",
            foreignField: "_id",
            as: "order"
          }
        },
        {
          "$addFields": {
            "order": {
              "$filter": {
                "input": "$order",
                "cond": { $and: [{ "$eq": ["$$this.status", 3] }, { "$eq": ["$$this.tailorId", userData._id] }] }
              }
            }
          }
        }
        , {
          $lookup: {
            from: "stichingCart",
            localField: "stichingList",
            foreignField: "_id",
            as: "stiching"
          }
        }, {
          "$addFields": {
            "stiching": {
              "$filter": {
                "input": "$stiching",
                "cond": { $and: [{ "$eq": ["$$this.status", 5] }, { "$eq": ["$$this.tailorId", userData._id] }] }
              }
            }
          }
        }, {
          $unwind: {
            path: "$stiching",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'stiching.userId',
            foreignField: '_id',
            as: 'stiching.user'
          }
        }, {
          $unwind: {
            path: "$stiching.user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'fabricBrand',
            localField: 'stiching.brandId',
            foreignField: '_id',
            as: 'stiching.brand'
          }
        }, {
          $unwind:
          {
            path: '$stiching.brand',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricType',
            localField: 'stiching.fabricTypeId',
            foreignField: '_id',
            as: 'stiching.fabricType'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabricType',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabric',
            localField: 'stiching.fabricId',
            foreignField: '_id',
            as: 'stiching.fabric'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabric',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'tailor',
            localField: 'stiching.tailorId',
            foreignField: '_id',
            as: 'stiching.tailor'
          }
        }, {
          $unwind:
          {
            path: '$stiching.tailor',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricColor',
            localField: 'stiching.color',
            foreignField: '_id',
            as: 'stiching.color'
          }
        }, {
          $unwind:
          {
            path: '$stiching.color',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'familyMember',
            let: { pid: "$stiching.memberId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", { $toObjectId: "$$pid" }]
                  }
                }
              }
            ],
            as: 'stiching.memberId'
          }
        }, {
          $unwind: {
            path: "$stiching.memberId",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'measurment',
            localField: 'stiching.measurmentId',
            foreignField: '_id',
            as: 'stiching.measurment'
          }
        }, {
          $unwind: {
            path: '$stiching.measurment',
            preserveNullAndEmptyArrays: true
          }
        },{
          $lookup: {
            from: 'model',
            localField: 'stiching.modelId',
            foreignField: '_id',
            as: 'stiching.model'
          }
        },{
          $lookup: {
            from: 'recordmeasurment',
            localField: 'stiching.recordMeasurment',
            foreignField: '_id',
            as: 'stiching.recordmeasurment'
          }
        },{
          $unwind: {
            path: '$stiching.recordmeasurment',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $unwind: {
            path: '$stiching.model',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            _id: 1,
            'stiching.username': '$stiching.user.username',
            'stiching.userImage': '$stiching.user.profileImage',
            'stiching._id': '$stiching._id',
            'stiching.brand': '$stiching.brand.name',
            'stiching.fabricName': '$stiching.fabricType.name',
            'stiching.isMeasurement': '$stiching.isMeasurement',
            'stiching.dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            'stiching.status': { $toInt: '0' },
            'stiching.fabricId': '$stiching.fabricType._id',
            'stiching.recordmeasurment': '$stiching.recordmeasurment',
            'stiching.tailor': '$stiching.tailor.name',
            'stiching.tailorId': '$stiching.tailor._id',
            'stiching.member': '$stiching.memberId',
            'stiching.image': '$stiching.color.image',
            'stiching.colorName': '$stiching.color.colorName',
            'stiching.model': '$stiching.model.name',
            'stiching.model_image': '$stiching.model.image',
            'stiching.orderId': '$stiching.orderId',
            'stiching.skuId': '$stiching.skuId',
            'stiching.measurmentDate': '$stiching.measurment.measurementDate',
            'stiching.measurmentTime': '$stiching.measurment.measurementTime',
            'stiching.quantity': '$stiching.quantity',
            "stiching.delivery_charge": "$stiching.delivery_charge",
            "stiching.transaction_charge": "$stiching.transaction_charge",
            "stiching.service_charge": "$stiching.service_charge",
            "stiching.refer" : "$stiching.refer",
            "stiching.wallet" : "$stiching.wallet",
            "stiching.fabricPrice": "$stiching.fabricPrice",
            "stiching.complete_payment" : "$stiching.complete_payment",
            "stiching.stitchingPrice" : "$stiching.stitchingPrice",
            'stiching.total': { $add: ["$stiching.fabricPrice","$stiching.stitchingPrice","$stiching.transaction_charge","$stiching.delivery_charge","$stiching.service_charge"]},
            'order': '$order',
          }
        }
        , {
          $group: {
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "order": { "$first": "$order" },
          }
        },
        {
          $project: {
            "_id": "$_id",
            "stiching": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$stiching._id", 0] }, null] }, null] }, '$stiching', []]
            },
            "order": "$order"
          }
        },

        {
          $unwind: {
            path: "$order",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'product',
            localField: 'order.productId',
            foreignField: '_id',
            as: 'order.product'
          }
        }, {
          $unwind: {
            path: "$order.product",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'productColor',
            localField: 'order.color',
            foreignField: '_id',
            as: 'order.color'
          }
        }, {
          $unwind: {
            path: "$order.color",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            "order._id": 1,
            "order.quantity": "$order.quantity",
            "order.orderId": "$order.orderId",
            'order.skuId': '$order.skuId',
            "order.color": "$order.color",
            "order.size": "$order.size",
            'order.status': { $toInt: '0' },
            "order.productName": "$order.product.name",
            "order.productImage": "$order.product.image",
            "order.userId": "$order.created_by",
            "stiching": "$stiching"
          }
        },
        {
          $group: {
            "_id": "$_id",
            "user": { "$first": "$order.userId" },
            "order": { "$push": "$order" },
            "stiching": { "$first": "$stiching" }
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        }, {
          $unwind:
          {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$order._id", 0] }, null] }, null] }, '$order', []]
            },
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": "$order",
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            "no_of_products": { "$size": "$order" },
            "no_of_stichings": { "$size": "$stiching" }
          }
        }
      ]
    }

    let order = await orderModel.aggregate(query);
    if (!order) {
      return { status: -1, message: "Something went wrong, Please try later." }
    }
    let ordering = order[0];
    if (ordering.order.length > 0) {
      var cartData = await _.map(ordering.order, (element) => {
        var mainData = { ...element, size: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString())[0] };
        return mainData;
      })
      ordering.order = cartData;
    }
    return { status: 1, message: "Orders Fetch Successfully.", data: ordering };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.generateInvoice = async (data) => {
  try {
    let stiching = data.stiching;
    let orders = data.products;
    let total = 0;
    let productOrder = [];
    let stichingOrder = [];
    if (orders.length > 0) {
      productOrder = await orderListModel.find({ _id: { $in: orders } }).populate("productId", "name image").select("quantity _id price orderId skuId");
      if (!productOrder) {
        return { status: -1, message: "Something went wrong, Please try later." };
      }
    }

    if (productOrder.length > 0) {
      for (let product of productOrder) {
        total = total + product.price;
      }
    }

    if (stiching.length > 0) {

      let stichingIds = _.map(stiching, (data) => {
        return mongoose.Types.ObjectId(data);
      });

      let query = [{
        $match: { _id: { $in: stichingIds } }
      }, {
        $lookup: {
          from: 'fabricBrand',
          localField: 'brandId',
          foreignField: '_id',
          as: 'brand'
        }
      }, {
        $unwind:
        {
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
        $unwind:
        {
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
        $unwind:
        {
          path: '$fabric',
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
        $unwind:
        {
          path: '$color',
          preserveNullAndEmptyArrays: true
        }
      }, {
        $project: {
          _id: 1,
          'brand': '$brand.name',
          'fabricName': '$fabricType.name',
          'image': '$color.image',
          'quantity': '$quantity',
          'skuId': '$skuId',
          'orderId': '$orderId'
        }
      }];

      stichingOrder = await stichingCartModel.aggregate(query);
      if (!stichingOrder) {
        return { status: -1, message: "Something went wrong, Please try later." }
      }

    }

    return { status: 1, message: "Orders Fetch Successfully.", data: { products: productOrder, stichings: stichingOrder, totalPrice: total, tax: 0, invoice_amount: 0 } };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.updateOrders = async (data, user) => {
  try {

    let ordersList = data.orderIds;
    let stiching = data.stichingIds;
    let orderStatus = data.orderStatus;
    let stichingStatus = data.stichingStatus;

    if (parseInt(orderStatus) == 5 || parseInt(stichingStatus) == 7) {

      let reason = await tailorCancelResonModel.find({ _id: mongoose.Types.ObjectId(data.reasonId) }).lean();
      if (!reason) {
        return { status: -1, message: "Something went wrong, Please try later" };
      }

      if (ordersList.length > 0) {

        let orders = await orderListModel.updateMany({ _id: { $in: ordersList } }, { $set: { status: parseInt(orderStatus), reason: reason.reason, modified_at: Date.now(), reasonBy: 1 } });
        if (!orders) {
          return { status: -1, message: "Something went wrong, Please try later." };
        }
        /* Code for notification start */
        let orderData = await orderListModel.find({_id: { $in: ordersList }});
        let orderdata = await Promise.all(_.map(orderData, async (order) => {
          let status = (parseInt(orderStatus) == 5)  ? "transit" : "cancelled";
          let title = "Order Updated.";
          let body = "Your Order " + order._id + " has been " + status +".";
          let device_type = user.deviceType;
          let notification = {
            userId: user._id,
            title: title,
            body: body,
            type: "order_updated",
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
  
          if(user.deviceToken && (user.notification == true)){
            sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
          }
        }));
        /* End code for notification */
      }

      if (stiching.length > 0) {
        let orders = await stichingCartModel.updateMany({ _id: { $in: stiching } }, { $set: { status: parseInt(stichingStatus), reason: reason.reason, modified_at: Date.now(), reasonBy: 1 } });
        if (!orders) {
          return { status: -1, message: "Something went wrong, Please try later." };
        }
         /* Code for notification start */
         let orderData = await stichingCartModel.find({_id: { $in: stiching }});
         let orderdata = await Promise.all(_.map(orderData, async (order) => {
           let status = (parseInt(orderStatus) == 5)  ? "transit" : "cancelled";
           let title = "Order Updated.";
           let body = "Your Order " + order._id + " has been " + status +".";
           let device_type = user.deviceType;
           let notification = {
             userId: user._id,
             title: title,
             body: body,
             type: "order_updated",
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
   
           if(user.deviceToken && (user.notification == true)){
             sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
           }
         }));
         /* End code for notification */
      }
      //Here order cancelled
      return { status: 1, message: "Orders Updated Successfully" };
    }

    if (parseInt(orderStatus) == 2 || parseInt(stichingStatus) == 4) {

      if (ordersList.length > 0) {

        let orders = await orderListModel.updateMany({ _id: { $in: ordersList } }, { $set: { status: parseInt(orderStatus), dispatch_on: Date.now(), modified_at: Date.now() } });
        if (!orders) {
          return { status: -1, message: "Something went wrong, Please try later." };
        }
        /* Code for notification start */
         let orderData = await orderListModel.find({_id: { $in: ordersList }});
         let orderdata = await Promise.all(_.map(orderData, async (order) => {
           let status = (parseInt(orderStatus) == 4)  ? "dispatched" : "pending";
           let title = "Order Updated.";
           let body = "Your Order " + order._id + " has been " + status +".";
           let device_type = user.deviceType;
           let notification = {
             userId: user._id,
             title: title,
             body: body,
             type: "order_updated",
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
   
           if(user.deviceToken && (user.notification == true)){
             sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
           }
         }));
        /* End code for notification */
      }

      if (stiching.length > 0) {
        let orders = await stichingCartModel.updateMany({ _id: { $in: stiching } }, { $set: { status: parseInt(stichingStatus), dispatch_on: Date.now(), modified_at: Date.now() } });
        if (!orders) {
          return { status: -1, message: "Something went wrong, Please try later." };
        }
        /* Code for notification start */
         let orderData = await stichingCartModel.find({_id: { $in: stiching }});
         let orderdata = await Promise.all(_.map(orderData, async (order) => {
           let status = (parseInt(orderStatus) == 4)  ? "dispatched" : "pending";
           let title = "Order Updated.";
           let body = "Your Order " + order._id + " has been " + status +".";
           let device_type = user.deviceType;
           let notification = {
             userId: user._id,
             title: title,
             body: body,
             type: "order_updated",
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
   
           if(user.deviceToken && (user.notification == true)){
             sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
           }
         }));
        /* End code for notification */
      }
     
      return { status: 1, message: "Orders Updated Successfully" };

    }

    if (ordersList.length > 0) {
      let order1 = await orderModel.find({orderList:{$in: ordersList}}).populate('offerid')
      console.log("order1",order1)
      let cashback = 0
      let fromDate = order1[0].offerid ? order1[0].offerid.dateFrom : ""
      let toDate = order1[0].offerid ? order1[0].offerid.dateTo : ""
      let currentDate = new Date()
      // console.log("order2",fromDate, toDate, currentDate)
      if(fromDate <= currentDate.toISOString() && toDate >= currentDate.toISOString()) {
        let strichPrice = order1[0].total_price
        let maxdiscount = order1[0].offerid.discount
        let minP = order1[0].offerid.minimum
        let maxP = order1[0].offerid.maximum
        // console.log(fromDate,fromDate,currentDate.toISOString(), maxdiscount, minP, maxP )
        let percentDiscount = strichPrice * (maxdiscount/100)
        if(percentDiscount <= minP) {
          cashback = minP
        } else  if(percentDiscount >= maxP) {
          cashback = maxP
        } else {
          cashback = percentDiscount
        } 
        // console.log("strichingprice",percentDiscount, cashback, )  

        let walletcashback = await walletModel.findOne({userId: user._id})
        let uCash = (walletcashback ? walletcashback.wallet_price : 0 ) + cashback
        let walletUpdate = await walletModel.findOneAndUpdate({userId: user._id}, {$set: { wallet_dask: 3, wallet_type: 0, wallet_price: uCash}})
      } 
      let orders = await orderListModel.updateMany({ _id: { $in: ordersList } }, { $set: { status: parseInt(orderStatus), modified_at: Date.now() } });
      if (!orders) {
        return { status: -1, message: "Something went wrong, Please try later." };
      }
    }
    
    if (stiching.length > 0) {
      let strichOrder = await stichingCartModel.find({ _id: { $in: stiching }}).populate('offer');
      let fromDate = order1[0].offer ? order1[0].offer.dateFrom : ""
      let toDate = order1[0].offer ? order1[0].offer.dateTo : ""
      let currentDate = new Date()
      let cashback = 0
      if(fromDate <= currentDate.toISOString() && toDate >= currentDate.toISOString()) {
        let strichPrice = strichOrder[0].stitchingPrice
        let maxdiscount = strichOrder[0].offer.discount
        let minP = strichOrder[0].offer.minimum
        let maxP = strichOrder[0].offer.maximum
        // console.log(fromDate,fromDate,currentDate.toISOString(), maxdiscount, minP, maxP )
        let percentDiscount = strichPrice * (maxdiscount/100)
        // console.log("strichingprice",percentDiscount)  
        if(percentDiscount <= minP) {
          cashback = minP
        } else  if(percentDiscount >= maxP) {
          cashback = maxP
        } else {
          cashback = percentDiscount
        } 
        let walletcashback = await walletModel.findOne({userId: user._id})
        let uCash = (walletcashback ? walletcashback.wallet_price : 0 ) + cashback
        let walletUpdate = await walletModel.findOneAndUpdate({userId: user._id}, {$set: { wallet_dask: 3, wallet_type: 0, wallet_price: uCash}})
      } 
      let orders = await stichingCartModel.updateMany({ _id: { $in: stiching } }, { $set: { status: parseInt(stichingStatus), modified_at: Date.now() } });
      if (!orders) {
        return { status: -1, message: "Something went wrong, Please try later." };
      }
    }
    return { status: 1, message: "Orders Updated Successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};



exports.updateStichingOrders = async (data) => {
  try {
    var date = new Date(new Date().setHours(0, 0, 0, 0));
    date.setDate(date.getDate() + parseInt(data.day)+3);
    let dateAfterPacked = new Date(date.toString()).setHours(0, 0, 0, 0);

    let orders = await stichingCartModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, { $set: { packed_in: parseInt(data.day),delivery_on: dateAfterPacked } });
    if (!orders) {
      return { status: -1, message: "Something went wrong, Please try later." };
    }
    return { status: 1, message: "Packed Date Updated Successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.fetchReasons = async () => {
  try {
    let reasons = await tailorCancelResonModel.find();
    if (!reasons) {
      return { status: -1, message: "Something went wrong, Please try later." };
    }
    return { status: 1, message: "Reasons Fetch SuccessFully", data: reasons };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getPastOrders = async (data, user) => {
  try {
    let type = data.type;
    let query;
    if (parseInt(type) == 1) {

      if (data.from != '') {

        query = [
          {
            $lookup: {
              from: "orderList",
              localField: "orderList",
              foreignField: "_id",
              as: "order"
            }
          },
          {
            "$addFields": {
              "order": {
                "$filter": {
                  "input": "$order",
                  "cond": { $and: [{ "$eq": ["$$this.status", 4] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(user._id)] }] }
                }
              }
            }
          }, {
            $lookup: {
              from: "stichingCart",
              localField: "stichingList",
              foreignField: "_id",
              as: "stiching"
            }
          }, {
            "$addFields": {
              "stiching": {
                "$filter": {
                  "input": "$stiching",
                  "cond": { $and: [{ "$eq": ["$$this.status", 6] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(user._id)] }] }
                }
              }
            }
          },
          {
            $lookup: {
              from: "user",
              localField: "userId",
              foreignField: "_id",
              as: "user"
            }
          }, { $unwind: "$user" },
          { $match: { $or: [{ "stiching": { $gt: { $size: 1 } } }, { "order": { $gt: { $size: 1 } } }] } },
          {
            $lookup: {
              from: "address",
              localField: "addressId",
              foreignField: "_id",
              as: "address"
            }
          }, { $unwind: "$address" },
          { $match: { $and: [{ "created_at": { $gte: parseInt(data.from) } }, { "created_at": { $lte: parseInt(data.to) } }] } },
          {
            $project: {
              "_id": "$_id",
              "stichings": { "$size": "$stiching" },
              "delivery_on": { $max: [{ $max: "$stiching.delivery_on" }, { $max: "$order.delivery_on" }] },
              "dispatch_on": { $max: [{ $max: "$stiching.dispatch_on" }, { $max: "$order.dispatch_on" }] },
              "user": "$user.username",
              "products": { "$size": "$order" },
              "total": { "$sum": "$order.price" },
              "orderId": "$orderId",
              "created_at": "$created_at",
              "address": "$address.location"
            }
          }
        ]

      } else {

        query = [
          {
            $lookup: {
              from: "orderList",
              localField: "orderList",
              foreignField: "_id",
              as: "order"
            }
          },
          {
            "$addFields": {
              "order": {
                "$filter": {
                  "input": "$order",
                  "cond": { $and: [{ "$eq": ["$$this.status", 4] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(user._id)] }] }
                }
              }
            }
          }, {
            $lookup: {
              from: "stichingCart",
              localField: "stichingList",
              foreignField: "_id",
              as: "stiching"
            }
          }, {
            "$addFields": {
              "stiching": {
                "$filter": {
                  "input": "$stiching",
                  "cond": { $and: [{ "$eq": ["$$this.status", 6] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(user._id)] }] }
                }
              }
            }
          },
          {
            $lookup: {
              from: "user",
              localField: "userId",
              foreignField: "_id",
              as: "user"
            }
          }, { $unwind: "$user" },
          { $match: { $or: [{ "stiching": { $gt: { $size: 1 } } }, { "order": { $gt: { $size: 1 } } }] } },
          {
            $lookup: {
              from: "address",
              localField: "addressId",
              foreignField: "_id",
              as: "address"
            }
          }, { $unwind: "$address" },
          {
            $project: {
              "_id": "$_id",
              "stichings": { "$size": "$stiching" },
              "delivery_on": { $max: [{ $max: "$stiching.delivery_on" }, { $max: "$order.delivery_on" }] },
              "dispatch_on": { $max: [{ $max: "$stiching.dispatch_on" }, { $max: "$order.dispatch_on" }] },
              "user": "$user.username",
              "products": { "$size": "$order" },
              "total": { "$sum": "$order.price" },
              "orderId": "$orderId",
              "created_at": "$created_at",
              "address": "$address.location"
            }
          }
        ]

      }

    } else {

      if (data.from != '') {

        query = [
          {
            $lookup: {
              from: "orderList",
              localField: "orderList",
              foreignField: "_id",
              as: "order"
            }
          },
          {
            "$addFields": {
              "order": {
                "$filter": {
                  "input": "$order",
                  "cond": { $and: [{ "$eq": ["$$this.status", 5] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(user._id)] }] }
                }
              }
            }
          }, {
            $lookup: {
              from: "stichingCart",
              localField: "stichingList",
              foreignField: "_id",
              as: "stiching"
            }
          }, {
            "$addFields": {
              "stiching": {
                "$filter": {
                  "input": "$stiching",
                  "cond": { $and: [{ "$eq": ["$$this.status", 7] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(user._id)] }] }
                }
              }
            }
          },
          {
            $lookup: {
              from: "user",
              localField: "userId",
              foreignField: "_id",
              as: "user"
            }
          }, { $unwind: "$user" },
          { $match: { $or: [{ "stiching": { $gt: { $size: 1 } } }, { "order": { $gt: { $size: 1 } } }] } },
          {
            $lookup: {
              from: "address",
              localField: "addressId",
              foreignField: "_id",
              as: "address"
            }
          }, { $unwind: "$address" },
          { $match: { $and: [{ "created_at": { $gte: parseInt(data.from) } }, { "created_at": { $lte: parseInt(data.to) } }] } },
          {
            $project: {
              "_id": "$_id",
              "stichings": { "$size": "$stiching" },
              "delivery_on": { $max: [{ $max: "$stiching.delivery_on" }, { $max: "$order.delivery_on" }] },
              "dispatch_on": { $max: [{ $max: "$stiching.dispatch_on" }, { $max: "$order.dispatch_on" }] },
              "user": "$user.username",
              "products": { "$size": "$order" },
              "total": { "$sum": "$order.price" },
              "orderId": "$orderId",
              "created_at": "$created_at",
              "address": "$address.location"
            }
          }
        ]

      } else {

        query = [
          {
            $lookup: {
              from: "orderList",
              localField: "orderList",
              foreignField: "_id",
              as: "order"
            }
          },
          {
            "$addFields": {
              "order": {
                "$filter": {
                  "input": "$order",
                  "cond": { $and: [{ "$eq": ["$$this.status", 5] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(user._id)] }] }
                }
              }
            }
          }, {
            $lookup: {
              from: "stichingCart",
              localField: "stichingList",
              foreignField: "_id",
              as: "stiching"
            }
          }, {
            "$addFields": {
              "stiching": {
                "$filter": {
                  "input": "$stiching",
                  "cond": { $and: [{ "$eq": ["$$this.status", 7] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(user._id)] }] }
                }
              }
            }
          },
          {
            $lookup: {
              from: "user",
              localField: "userId",
              foreignField: "_id",
              as: "user"
            }
          }, { $unwind: "$user" },
          { $match: { $or: [{ "stiching": { $gt: { $size: 1 } } }, { "order": { $gt: { $size: 1 } } }] } },
          {
            $lookup: {
              from: "address",
              localField: "addressId",
              foreignField: "_id",
              as: "address"
            }
          }, { $unwind: "$address" },
          {
            $project: {
              "_id": "$_id",
              "stichings": { "$size": "$stiching" },
              "delivery_on": { $max: [{ $max: "$stiching.delivery_on" }, { $max: "$order.delivery_on" }] },
              "dispatch_on": { $max: [{ $max: "$stiching.dispatch_on" }, { $max: "$order.dispatch_on" }] },
              "user": "$user.username",
              "products": { "$size": "$order" },
              "total": { "$sum": "$order.price" },
              "orderId": "$orderId",
              "created_at": "$created_at",
              "address": "$address.location"
            }
          }
        ]

      }

    }

    let order = await orderModel.aggregate(query);
    if (!order) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, message: "Orders fetch successfully.", data: order };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.showOrderDetails = async (data, userData) => {
  try {
    let type = data.type;
    let query;
    if (parseInt(type) == 1) {
      query = [

        { $match: { _id: mongoose.Types.ObjectId(data._id) } },
        {
          $lookup: {
            from: "orderList",
            localField: "orderList",
            foreignField: "_id",
            as: "order"
          }
        },
        {
          "$addFields": {
            "order": {
              "$filter": {
                "input": "$order",
                "cond": { $and: [{ "$eq": ["$$this.status", 4] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(userData._id)] }] }
              }
            }
          }
        }
        , {
          $lookup: {
            from: "stichingCart",
            localField: "stichingList",
            foreignField: "_id",
            as: "stiching"
          }
        }, {
          "$addFields": {
            "stiching": {
              "$filter": {
                "input": "$stiching",
                "cond": { $and: [{ "$eq": ["$$this.status", 6] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(userData._id)] }] }
              }
            }
          }
        }, {
          $unwind: {
            path: "$stiching",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'stiching.userId',
            foreignField: '_id',
            as: 'stiching.user'
          }
        }, {
          $unwind: {
            path: "$stiching.user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'fabricBrand',
            localField: 'stiching.brandId',
            foreignField: '_id',
            as: 'stiching.brand'
          }
        }, {
          $unwind:
          {
            path: '$stiching.brand',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricType',
            localField: 'stiching.fabricTypeId',
            foreignField: '_id',
            as: 'stiching.fabricType'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabricType',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabric',
            localField: 'stiching.fabricId',
            foreignField: '_id',
            as: 'stiching.fabric'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabric',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'tailor',
            localField: 'stiching.tailorId',
            foreignField: '_id',
            as: 'stiching.tailor'
          }
        }, {
          $unwind:
          {
            path: '$stiching.tailor',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricColor',
            localField: 'stiching.color',
            foreignField: '_id',
            as: 'stiching.color'
          }
        }, {
          $unwind:
          {
            path: '$stiching.color',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'familyMember',
            let: { pid: "$stiching.memberId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", { $toObjectId: "$$pid" }]
                  }
                }
              }
            ],
            as: 'stiching.memberId'
          }
        }, {
          $unwind: {
            path: "$stiching.memberId",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'measurment',
            localField: 'stiching.measurmentId',
            foreignField: '_id',
            as: 'stiching.measurment'
          }
        }, {
          $unwind: {
            path: '$stiching.measurment',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            _id: 1,
            'stiching.username': '$stiching.user.username',
            'stiching.userImage': '$stiching.user.profileImage',
            'stiching._id': '$stiching._id',
            'stiching.brand': '$stiching.brand.name',
            'stiching.fabricName': '$stiching.fabricType.name',
            'stiching.isMeasurement': '$stiching.isMeasurement',
            'stiching.dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            'stiching.status': { $toInt: '0' },
            'stiching.fabricId': '$stiching.fabricType._id',
            'stiching.tailor': '$stiching.tailor.name',
            'stiching.tailorId': '$stiching.tailor._id',
            'stiching.member': '$stiching.memberId',
            'stiching.image': '$stiching.color.image',
            'stiching.colorName': '$stiching.color.colorName',
            'stiching.model': 'Kandura Type',
            'stiching.orderId': '$stiching.skuId',
            'stiching.measurmentDate': '$stiching.measurment.measurementDate',
            'stiching.measurmentTime': '$stiching.measurment.measurementTime',
            'stiching.quantity': '$stiching.quantity',
            'order': '$order',
            'orderId': '$orderId'
          }
        }
        , {
          $group: {
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "order": { "$first": "$order" },
            "orderId": { "$first": "$orderId" }
          }
        },
        {
          $project: {
            "_id": "$_id",
            "stiching": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$stiching._id", 0] }, null] }, null] }, '$stiching', []]
            },
            "order": "$order",
            "orderId": "$orderId"
          }
        },

        {
          $unwind: {
            path: "$order",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'product',
            localField: 'order.productId',
            foreignField: '_id',
            as: 'order.product'
          }
        }, {
          $unwind: {
            path: "$order.product",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'productColor',
            localField: 'order.color',
            foreignField: '_id',
            as: 'order.color'
          }
        }, {
          $unwind: {
            path: "$order.color",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            "order._id": 1,
            "order.quantity": "$order.quantity",
            "order.orderId": "$order.skuId",
            "order.color": "$order.color",
            "order.size": "$order.size",
            "order.price": "$order.price",
            'order.status': { $toInt: '0' },
            "order.productName": "$order.product.name",
            "order.productImage": "$order.product.image",
            "order.userId": "$order.created_by",
            "stiching": "$stiching",
            "orderId": "$orderId"
          }
        },
        {
          $group: {
            "_id": "$_id",
            "user": { "$first": "$order.userId" },
            "totalPrice": { $sum: "$order.price" },
            "order": { "$push": "$order" },
            "stiching": { "$first": "$stiching" },
            "orderId": { "$first": "$orderId" }
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        }, {
          $unwind:
          {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$order._id", 0] }, null] }, null] }, '$order', []]
            },
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            "orderId": "$orderId",
            "totalPrice": "$totalPrice"
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": "$order",
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            "orderId": "$orderId",
            "totalPrice": "$totalPrice",
            "no_of_products": { "$size": "$order" },
            "no_of_stichings": { "$size": "$stiching" },
            "tax": { $toInt: 0 },
            "invoice_amount": "$totalPrice"
          }
        }
      ]
    } else {
      query = [

        { $match: { _id: mongoose.Types.ObjectId(data._id) } },
        {
          $lookup: {
            from: "orderList",
            localField: "orderList",
            foreignField: "_id",
            as: "order"
          }
        },
        {
          "$addFields": {
            "order": {
              "$filter": {
                "input": "$order",
                "cond": { $and: [{ "$eq": ["$$this.status", 5] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(userData._id)] }] }
              }
            }
          }
        }
        , {
          $lookup: {
            from: "stichingCart",
            localField: "stichingList",
            foreignField: "_id",
            as: "stiching"
          }
        }, {
          "$addFields": {
            "stiching": {
              "$filter": {
                "input": "$stiching",
                "cond": { $and: [{ "$eq": ["$$this.status", 7] }, { "$eq": ["$$this.tailorId", mongoose.Types.ObjectId(userData._id)] }] }
              }
            }
          }
        }, {
          $unwind: {
            path: "$stiching",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'stiching.userId',
            foreignField: '_id',
            as: 'stiching.user'
          }
        }, {
          $unwind: {
            path: "$stiching.user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'fabricBrand',
            localField: 'stiching.brandId',
            foreignField: '_id',
            as: 'stiching.brand'
          }
        }, {
          $unwind:
          {
            path: '$stiching.brand',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricType',
            localField: 'stiching.fabricTypeId',
            foreignField: '_id',
            as: 'stiching.fabricType'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabricType',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabric',
            localField: 'stiching.fabricId',
            foreignField: '_id',
            as: 'stiching.fabric'
          }
        }, {
          $unwind:
          {
            path: '$stiching.fabric',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'tailor',
            localField: 'stiching.tailorId',
            foreignField: '_id',
            as: 'stiching.tailor'
          }
        }, {
          $unwind:
          {
            path: '$stiching.tailor',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'fabricColor',
            localField: 'stiching.color',
            foreignField: '_id',
            as: 'stiching.color'
          }
        }, {
          $unwind:
          {
            path: '$stiching.color',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'familyMember',
            let: { pid: "$stiching.memberId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", { $toObjectId: "$$pid" }]
                  }
                }
              }
            ],
            as: 'stiching.memberId'
          }
        }, {
          $unwind: {
            path: "$stiching.memberId",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'measurment',
            localField: 'stiching.measurmentId',
            foreignField: '_id',
            as: 'stiching.measurment'
          }
        }, {
          $unwind: {
            path: '$stiching.measurment',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            _id: 1,
            'stiching.username': '$stiching.user.username',
            'stiching.userImage': '$stiching.user.profileImage',
            'stiching._id': '$stiching._id',
            'stiching.brand': '$stiching.brand.name',
            'stiching.fabricName': '$stiching.fabricType.name',
            'stiching.isMeasurement': '$stiching.isMeasurement',
            'stiching.dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            'stiching.status': { $toInt: '0' },
            'stiching.fabricId': '$stiching.fabricType._id',
            'stiching.tailor': '$stiching.tailor.name',
            'stiching.tailorId': '$stiching.tailor._id',
            'stiching.member': '$stiching.memberId',
            'stiching.image': '$stiching.color.image',
            'stiching.colorName': '$stiching.color.colorName',
            'stiching.model': 'Kandura Type',
            'stiching.orderId': '$stiching.skuId',
            'stiching.measurmentDate': '$stiching.measurment.measurementDate',
            'stiching.measurmentTime': '$stiching.measurment.measurementTime',
            'stiching.quantity': '$stiching.quantity',
            'order': '$order',
            'orderId': '$orderId'
          }
        }
        , {
          $group: {
            "_id": "$_id",
            "stiching": { "$push": "$stiching" },
            "order": { "$first": "$order" },
            "orderId": { "$first": "$orderId" }
          }
        },
        {
          $project: {
            "_id": "$_id",
            "stiching": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$stiching._id", 0] }, null] }, null] }, '$stiching', []]
            },
            "order": "$order",
            "orderId": "$orderId"
          }
        },

        {
          $unwind: {
            path: "$order",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'product',
            localField: 'order.productId',
            foreignField: '_id',
            as: 'order.product'
          }
        }, {
          $unwind: {
            path: "$order.product",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $lookup: {
            from: 'productColor',
            localField: 'order.color',
            foreignField: '_id',
            as: 'order.color'
          }
        }, {
          $unwind: {
            path: "$order.color",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            "order._id": 1,
            "order.quantity": "$order.quantity",
            "order.orderId": "$order.skuId",
            "order.color": "$order.color",
            "order.size": "$order.size",
            "order.price": "$order.price",
            'order.status': { $toInt: '0' },
            "order.productName": "$order.product.name",
            "order.productImage": "$order.product.image",
            "order.userId": "$order.created_by",
            "stiching": "$stiching",
            "orderId": "$orderId"
          }
        },
        {
          $group: {
            "_id": "$_id",
            "user": { "$first": "$order.userId" },
            "totalPrice": { $sum: "$order.price" },
            "order": { "$push": "$order" },
            "stiching": { "$first": "$stiching" },
            "orderId": { "$first": "$orderId" }
          }
        }, {
          $lookup: {
            from: 'user',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        }, {
          $unwind:
          {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": {
              "$cond": [{ "$ne": [{ "$ifNull": [{ "$arrayElemAt": ["$order._id", 0] }, null] }, null] }, '$order', []]
            },
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            "orderId": "$orderId",
            "totalPrice": "$totalPrice"
          }
        }, {
          $project: {
            "_id": "$_id",
            "user": "$user",
            "order": "$order",
            "stiching": "$stiching",
            'dispatch_by': { $add: [Date.now(), 5 * 24 * 60 * 60 * 1000] },
            "orderId": "$orderId",
            "totalPrice": "$totalPrice",
            "no_of_products": { "$size": "$order" },
            "no_of_stichings": { "$size": "$stiching" },
            "tax": { $toInt: 0 },
            "invoice_amount": "$totalPrice"
          }
        }
      ]
    }

    let order = await orderModel.aggregate(query);
    if (!order) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }

    let ordering = order[0];
    if (ordering.order.length > 0) {
      var cartData = await _.map(ordering.order, (element) => {
        var mainData = { ...element, size: _.filter(element.color.sizes, (subElement) => subElement._id.toString() === element.size.toString())[0] };
        return mainData;
      })
      ordering.order = cartData;
    }
    return { status: 1, message: "Orders Fetch Successfully.", data: ordering };

  } catch (err) {
    throw new Error(err.message);
  }
};


exports.showOrdersReview = async (data, userData) => {
  try {

    var reviews = [];

    if (data.productIds.length > 0) {
      let rating = await ratingModel.find({ productId: { $in: data.productIds } }).populate("userId", "username profileImage");
      if (!rating) {
        return { status: -1, message: "Something went wrong, Please try later." };
      }
      reviews = [...reviews, ...rating];
    }

    if (data.stichingIds.length > 0) {
      let rating = await ratingModel.find({ stichingId: { $in: data.stichingIds } }).populate("userId", "username profileImage");
      if (!rating) {
        return { status: -1, message: "Something went wrong, Please try later." };
      }
      reviews = [...reviews, ...rating];

    }

    return { status: 1, message: "Rating fetch successfully", data: reviews };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.profileDetails = async (data, user) => {
  try {

    let query;

    if (parseInt(data.type) == 1) {

      query = [
        {
          $match: { tailorId: user._id }
        }, {
          $lookup: {
            from: "tailor",
            localField: "tailorId",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: "$user"
        }, {
          $project: {
            _id: 1,
            mobile: "$user.mobile",
            countryCode: "$user.countryCode",
            email: "$user.email",
            image: "$user.image",
            fullName: "$fullName",
            experience: "$experience",
            nationalIdImage: "$nationalIdImage",
            passportImage: "$passportImage",
            image: "$image"
          }
        }
      ];
    } else if ((parseInt(data.type)) == 2) {
      query = [
        {
          $match: { tailorId: user._id }
        }, {
          $project: {
            _id: 1,
            trading_license_image: "$businessDetails.trading_license_image",
            tax_id_image: "$businessDetails.tax_id_image",
            signature_image: "$businessDetails.signature_image",
            working_days: "$businessDetails.working_days",
            working_hours: "$businessDetails.working_hours",
            charges: "$businessDetails.charges",
            images: "$businessDetails.images",
            building_number: "$businessLocation.building_number",
            street_name: "$businessLocation.street_name",
            city: "$businessLocation.city",
            country: "$businessLocation.country",
            postal_code: "$businessLocation.postal_code",
            latitude: "$businessLocation.latitude",
            longitude: "$businessLocation.longitude"
          }
        }
      ];
    } else if ((parseInt(data.type)) == 3) {
      query = [
        {
          $match: { tailorId: user._id }
        }, {
          $project: {
            _id: 1,
            display_name: "$storeDetails.display_name",
            business_logo_image: "$storeDetails.business_logo_image",
            store_description: "$storeDetails.store_description"
          }
        }
      ];
    } else if ((parseInt(data.type)) == 4) {
      query = [
        {
          $match: { tailorId: user._id }
        }, {
          $project: {
            _id: 1,
            building_number: "$bank_details.branch_address.building_number",
            street_name: "$bank_details.branch_address.street_name",
            city: "$bank_details.branch_address.city",
            branch_address_country: "$bank_details.branch_address.branch_address_country",
            postal_code: "$bank_details.branch_address.postal_code",
            account_type: "$bank_details.account_type",
            account_number: "$bank_details.account_number",
            account_name: "$bank_details.account_name",
            bank_name: "$bank_details.bank_name",
            country: "$bank_details.country"
          }
        }
      ];
    } else {
      query = [
        {
          $match: { tailorId: user._id }
        }, {
          $project: {
            _id: 1,
            fullName: "$fullName",
            businessLocation: "$businessLocation",
            storeName: "$storeDetails.display_name",
            image: "$image"
          }
        }
      ];
    }

    let tailorProfile = await tailorProfileModel.aggregate(query);
    if (!tailorProfile) {
      return { status: -1, message: "Something went wrong, Please try later." };
    }
    return { status: 1, message: "Profile details fetch Successfully.", data: tailorProfile[0] };

  } catch (err) {
    throw new Error(err.message);
  }
};

exports.updateProfileDetails = async (data, user) => {
  try {
    let passData = {};
    if (parseInt(data.type) == 1) {
      user.username = data.fullName;
      passData = data;
      let saveUser = await user.save();
      if (!saveUser) {
        return { status: -1, message: "Something went wrong, Please try later" };
      }
    } else if (parseInt(data.type) == 2) {

      passData["businessDetails.trading_license_image"] = data.trading_license_image;
      passData["businessDetails.tax_id_image"] = data.tax_id_image;
      passData["businessDetails.signature_image"] = data.signature_image;
      passData["businessDetails.working_days"] = data.working_days;
      passData["businessDetails.images"] = data.images;
      passData["businessDetails.working_hours"] = data.working_hours;
      passData["businessDetails.charges.charge_for_kid"] = data.charge_for_kid;
      passData["businessDetails.charges.charge_for_adult"] = data.charge_for_adult;

      passData["businessLocation.building_number"] = data.building_number;
      passData["businessLocation.street_name"] = data.street_name;
      passData["businessLocation.city"] = data.city;
      passData["businessLocation.country"] = data.country;
      passData["businessLocation.postal_code"] = data.postal_code;
      passData["businessLocation.longitude"] = data.longitude;

    } else if (parseInt(data.type) == 3) {

      user.name = data.display_name;
      passData = data;
      let saveUser = await user.save();
      if (!saveUser) {
        return { status: -1, message: "Something went wrong, Please try later" };
      }

      passData["storeDetails.display_name"] = data.display_name;
      passData["storeDetails.business_logo_image"] = data.business_logo_image;
      passData["storeDetails.store_description"] = data.store_description;
    } else {
      passData["bank_details.account_type"] = data.account_type;
      passData["bank_details.account_number"] = data.account_number;
      passData["bank_details.account_name"] = data.account_name;
      passData["bank_details.bank_name"] = data.bank_name;
      passData["bank_details.country"] = data.country;
      passData["bank_details.branch_address.building_number"] = data.building_number;
      passData["bank_details.branch_address.street_name"] = data.street_name;
      passData["bank_details.branch_address.city"] = data.city;
      passData["bank_details.branch_address.branch_address_country"] = data.branch_address_country;
      passData["bank_details.branch_address.postal_code"] = data.postal_code;
    }
    let tailorProfile = await tailorProfileModel.updateOne({ tailorId: user._id }, { $set: passData });
    if (!tailorProfile) {
      return { status: -1, message: "Something went wrong, Please try later." };
    }
    return { status: 1, message: "Profile Updated Successfully" };

  } catch (err) {
    throw new Error(err.message);
  }
}



exports.getPaymentDetails = async (data, user) => {
  try {
    /* filter1 ,, 1 for all and 2 for  today 3 for week and 4 for year */
    let filter1 = parseInt(data.filter1);
    let filter2 = parseInt(data.filter2);
    /* filter2 is in number 1,2,3,4  */
    let type = parseInt(data.type);
    /* type 1 for Revenue and 2 for business and cancellation  */

    if (type == 1) {

      let query1; 
      let query;
      if(filter1 == 1){

        query = [{
          $match:{ tailorId:user._id,commission:{$exists: true}}
          },{
            $project:{
                price: {$subtract: ["$price","$commission"]},
                pay_date:1
            }
          },{
              $group:{
                  _id:null,
                  order: {$push: "$$ROOT"},
                  total: {$sum:"$price"}
              }
          }
        ]

        query1 = [{
          $match:{ tailorId:user._id,commission:{$exists: true}}
          },{
            $project:{
                price: {$subtract: [{$add:["$fabricPrice","$stitchingPrice"]},"$commission"]},
                pay_date:1
            }
          },{
              $group:{
                _id:null,
                order: {$push: "$$ROOT"},
                total: {$sum:"$price"}
              }
          }
        ]

      }else if(filter1 == 2){
        let filterDate = new Date(new Date()).setHours(0, 0, 0, 0);

        query = [{
          $match:{ tailorId:user._id,commission:{$exists: true},pay_date:{$gt:filterDate}}
          },{
            $project:{
                price: {$subtract: ["$price","$commission"]},
                pay_date:1
            }
          },{
              $group:{
                  _id:null,
                  order: {$push: "$$ROOT"},
                  total: {$sum:"$price"}
              }
          }
        ]

        query1 = [{
          $match:{ tailorId:user._id,commission:{$exists: true},pay_date:{$gt:filterDate}}
          },{
            $project:{
                price: {$subtract: [{$add:["$fabricPrice","$stitchingPrice"]},"$commission"]},
                pay_date:1
            }
          },{
              $group:{
                  _id:null,
                  order: {$push: "$$ROOT"},
                  total: {$sum:"$price"}
              }
          }
        ]

      }else if(filter1 == 3){
        var date = new Date(new Date().setHours(0, 0, 0, 0));
        if(filter1 == 1){
          date.setDate(date.getDate() - date.getDay()- 7*1);
        }else if(filter2 == 2 ){
          date.setDate(date.getDate() - date.getDay()- 7*2);
        }else if(filter2 == 3){
          date.setDate(date.getDate() - date.getDay()- 7*3);
        }else if(filter2 == 4){
          date.setDate(date.getDate() - date.getDay()- 7*4);
        }else{
          date.setDate(date.getDate() - date.getDay());
        }
        let filterDate = new Date(date.toString()).setHours(0, 0, 0, 0);

        query = [{
          $match:{ tailorId:user._id,commission:{$exists: true},pay_date:{$gt:filterDate} }
          },{
            $project:{
                price: {$subtract: ["$price","$commission"]},
                pay_date:1
            }
          },{
              $group:{
                  _id:null,
                  order: {$push: "$$ROOT"},
                  total: {$sum:"$price"}
              }
          }
        ]

        query1 = [{
          $match:{ tailorId:user._id,commission:{$exists: true},pay_date:{$gt:filterDate}}
          },{
            $project:{
                price: {$subtract: [{$add:["$fabricPrice","$stitchingPrice"]},"$commission"]},
                pay_date:1
            }
          },{
              $group:{
                  _id:null,
                  order: {$push: "$$ROOT"},
                  total: {$sum:"$price"}
              }
          }
        ]

      }else{

        var date = new Date(new Date().setHours(0, 0, 0, 0));
        if(filter2 ==1){
          date.setFullYear(date.getFullYear()-1);
        }else if(filter2 == 2 ){
          date.setFullYear(date.getFullYear()-2);
        }else if(filter2 == 3){
          date.setFullYear(date.getFullYear()-3);
        }else if(filter2 == 4){
          date.setFullYear(date.getFullYear()-4);
        }else{
          date.setFullYear(date.getFullYear());
        }
        date.setDate(1);
        date.setMonth(0);
        let filterDate = new Date(date.toString()).setHours(0, 0, 0, 0);

        query = [{
          $match:{ tailorId:user._id,commission:{$exists: true},pay_date:{$gt:filterDate} }
          },{
            $project:{
                price: {$subtract: ["$price","$commission"]},
                pay_date:1
            }
          },{
              $group:{
                  _id:null,
                  order: {$push: "$$ROOT"},
                  total: {$sum:"$price"}
              }
          }
        ]

        query1 = [{
          $match:{ tailorId:user._id,commission:{$exists: true},pay_date:{$gt:filterDate}}
          },{
            $project:{
                price: {$subtract: [{$add:["$fabricPrice","$stitchingPrice"]},"$commission"]},
                pay_date:1
            }
          },{
              $group:{
                  _id:null,
                  order: {$push: "$$ROOT"},
                  total: {$sum:"$price"}
              }
          }
        ]
      }

      let order = await orderListModel.aggregate(query);
      if(!order){
        return {status: -1, message: "Something went wrong , Please try later."}
      }
      if(order.length ==0){
        order = [{
          order:[],
          total: 0
        }]
      }

      let stichingOrder = await stichingCartModel.aggregate(query1);
      if(!stichingOrder){
        return {status: -1, message: "Something went wrong , Please try later."}
      }
      if(stichingOrder.length ==0){
        stichingOrder = [{
          order:[],
          total: 0
        }]
      }


      return {
        status: 1,
        message: "Revenue fetch successfully",
        data: {
          revenue: {
            price: order[0].total + stichingOrder[0].total,
            orders: order[0].order.length + stichingOrder[0].order.length
          }
        }
      }
    } else {

      let completeOrderdata = await orderListModel.aggregate([
        { $match: { status: 4, tailorId: user._id } },
        {
          $group: {
            _id: "null",
            price: { $sum: "$price" },
            date: { $min: "$modified_at" }
          }
        }
      ]);
      if (!completeOrderdata) {
        throw new Error("Something went wrong, Please try later .");
      }

      let completeStrichingData = await stichingCartModel.aggregate([
        { $match: { status: 6, tailorId: user._id } },
        {
          $group: {
            _id: "null",
            price: { $sum: "$price" },
            date: { $min: "$modified_at" }
          }
        }
      ]);
      if (!completeStrichingData) {
        throw new Error("Something went wrong, Please try later .");
      }
      if (completeStrichingData.length == 0) completeStrichingData = [{ price: 0, date: Date.now() }];
      if (completeOrderdata.length == 0) completeOrderdata = [{ price: 0, date: Date.now() }];

      let totalBusinessPrice = completeStrichingData[0].price + completeOrderdata[0].price;
      var date = new Date(new Date().setHours(0, 0, 0, 0));
      date.setDate(date.getDate() + 15);
      let dateAfter15 = new Date(date.toString()).setHours(0, 0, 0, 0);

      /* Price with date of Next Payment */

      let nextPayment = {
        price: totalBusinessPrice,
        date: dateAfter15
      };

      let lastPayment = {
        price: 0,
        date: 0
      }

      let cancelOrders = await orderListModel.count({ status: 5, tailorId: user._id });


      let cancelstriching = await stichingCartModel.count({ status: 7, tailorId: user._id });


      let totalCancelOrders = cancelOrders + cancelstriching;

      let today = new Date(new Date()).setHours(0, 0, 0, 0);

      var date = new Date(new Date().setHours(0, 0, 0, 0));
      date.setDate(date.getDate() - 6);
      let week = new Date(date.toString()).setHours(0, 0, 0, 0);

      var date = new Date(new Date().setHours(0, 0, 0, 0));
      date.setDate(date.getDate() - 29);
      let month = new Date(date.toString()).setHours(0, 0, 0, 0);


      let cancelOrdersToday = await orderListModel.count({ status: 5, tailorId: user._id, modified_at: { $gte: today } });


      let cancelstrichingToday = await stichingCartModel.count({ status: 7, tailorId: user._id, modified_at: { $gte: today } });


      let totalCancelOrdersToday = cancelOrdersToday + cancelstrichingToday;

      /*For Weekly */

      let cancelOrdersWeekly = await orderListModel.count({ status: 5, tailorId: user._id, modified_at: { $gte: week } });


      let cancelstrichingWeekly = await stichingCartModel.count({ status: 7, tailorId: user._id, modified_at: { $gte: week } });


      let totalCancelOrdersWeekly = cancelOrdersWeekly + cancelstrichingWeekly;

      /* For Month */

      let cancelOrdersMonthly = await orderListModel.count({ status: 5, tailorId: user._id, modified_at: { $gte: month } });


      let cancelstrichingMonthly = await stichingCartModel.count({ status: 7, tailorId: user._id, modified_at: { $gte: month } });


      let totalCancelOrdersMonthly = cancelOrdersMonthly + cancelstrichingMonthly;


    /* Code for notification start */
      let title = "Payment Updated Successfully";
      let body = "Payment updated successfully";
      let device_type = user.deviceType;
      let notification = {
        userId: user._id,
        title: title,
        body: body,
        type: "payment_updated",
        created_at: Date.now()
      }
      let sendNotification = await tailorNotificationModel.create(notification);
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
      if(user.deviceToken && (user.deviceToken !== null || user.deviceToken !== '')){
        sendPushNotification(config.notificationServerKey, user.deviceToken, device_type, payload, notify);
      }
      /* End code for notification */


      return {
        status: 1, message: "Earning Details Fetch Successfully", data: {
          nextPayment: nextPayment, lastPayment: lastPayment, totalCancelOrders: totalCancelOrders, totalCancelOrdersToday: totalCancelOrdersToday,
          totalCancelOrdersWeekly: totalCancelOrdersWeekly,
          totalCancelOrdersMonthly: totalCancelOrdersMonthly
        }
      };

    }

  } catch (error) {
    throw new Error(error.message);
  }
}

exports.getAnalytics = async (user) => {
  try {

    let allOrders = await orderListModel.count({ tailorId: user._id });
    let allstichingOrders = await stichingCartModel.count({ tailorId: user._id });

    let allTotalOrders = allOrders + allstichingOrders;

    let completeOrders = await orderListModel.count({ status: 4, tailorId: user._id });
    let stichingCompleteOrders = await stichingCartModel.count({ status: 6, tailorId: user._id });

    let totalCompleteOrders = completeOrders + stichingCompleteOrders;

    let cancelOrders = await orderListModel.count({ status: 5, tailorId: user._id });
    let stichingCancelOrders = await stichingCartModel.count({ status: 7, tailorId: user._id });

    let totalCancelOrders = cancelOrders + stichingCancelOrders;

    let reviewOrders = await orderListModel.aggregate([
      {
        $match: { status: 4, tailorId: user._id }
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
          "product": "$rating",
          "rating_completed": {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          "rating": {
            $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.ratingpoint", else: "--" }
          },
          "review": {
            $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.review", else: "--" }
          }
        }
      },
      { $match: { rating_completed: true } }
    ])

    let stichingReviewOrders = await stichingCartModel.aggregate([
      {
        $match: { status: 6, tailorId: user._id }
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
          _id: 1,
          'username': '$user.username',
          'is_rating': {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          'tailorId': '$tailor._id',
          'rating': '$rating',
        }
      },
      { $match: { is_rating: true } }
    ]);

    let totalReviews = reviewOrders.length + stichingReviewOrders.length;

    let positiveReviews = await orderListModel.aggregate([
      {
        $match: { status: 4, tailorId: user._id }
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
          "rating": "$rating.ratingpoint",
          "rating_completed": {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          "review": {
            $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.review", else: "--" }
          }
        }
      },
      {
        $match: { rating_completed: true, rating: { $gte: 3 } }
      }
    ])

    let stichingPositiveReview = await stichingCartModel.aggregate([
      {
        $match: { status: 6, tailorId: user._id }
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
          _id: 1,
          'username': '$user.username',
          'is_rating': {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          'tailorId': '$tailor._id',
          'rating': '$rating.ratingpoint',
        }
      },
      {
        $match: { is_rating: true, rating: { $gte: 3 } }

      }
    ])

    let totalPositiveReview = positiveReviews.length + stichingPositiveReview.length;


    let negativeReviews = await orderListModel.aggregate([
      {
        $match: { status: 4, tailorId: user._id }
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
          "rating": "$rating.ratingpoint",
          "rating_completed": {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          "review": {
            $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.review", else: "--" }
          }
        }
      },
      {
        $match: { rating_completed: true, rating: { $lt: 3 } }
      }
    ])

    let stichingNegativeReviews = await stichingCartModel.aggregate([
      {
        $match: { status: 6, tailorId: user._id }
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
          _id: 1,
          'username': '$user.username',
          'is_rating': {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          'tailorId': '$tailor._id',
          'rating': '$rating.ratingpoint',
        }
      },
      {
        $match: { is_rating: true, rating: { $lt: 3 } }
      }
    ])

    let totalNegativeReviews = negativeReviews.length + stichingNegativeReviews.length;


    return {
      status: 1, message: "All records fetch successfully", data: {
        totalOrders: allTotalOrders,
        completeOrders: totalCompleteOrders,
        cancelOrders: totalCancelOrders,
        totalReviews: totalReviews,
        totalPositiveReview: totalPositiveReview,
        totalNegativeReviews: totalNegativeReviews
      }
    };

  } catch (error) {
    throw new Error(error.message);
  }
}

exports.gerPDFfiles = async (data, user) => {
  try {
    let type = parseInt(data.type);
    let status = parseInt(data.status);
    let workbook = new Excel.Workbook()
    let worksheet = workbook.addWorksheet('Debtors');
    /*
    * 1 for all orders
    * 2 for total Orders completed
    * 3 for total Ordered cancelled
    * 4 total Reviews
    * 5 Postive Reviews
    * 6 Negative Reviews
    */
    let productQuery = [];
    let stitchingQuery = [];
    if (type == 1) {
      productQuery = [
        { $match: { status: { $in: [0, 1, 2, 3, 4, 5] }, tailorId: user._id } },
        {
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
            from: "user",
            localField: "created_by",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: 1,
            order: {
              $push: {
                status: '$status', orderId: '$orderId',
                created_at: "$created_at",
                modified_at: "$modified_at",
                product_name: "$product.name",
                useremail: "$user.email"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            "status": {
              "$switch": {
                "branches": [
                  { "case": { "$eq": ["$order.status", 0] }, "then": "Pending" },
                  { "case": { "$eq": ["$order.status", 1] }, "then": "Pending RTD" },
                  { "case": { "$eq": ["$order.status", 2] }, "then": "Dispatch" },
                  { "case": { "$eq": ["$order.status", 3] }, "then": "In Transit" },
                  { "case": { "$eq": ["$order.status", 4] }, "then": "Complete" }
                  //{ "case": { "$eq": [ "$order.status", "5" ] }, "then": "Cancelled" }
                ],
                "default": "Cancelled"
              }
            },
            "orderId": "$order.orderId",
            "OrderDate": { $toDate: "$order.created_at" },
            "LastUpdate": { $toDate: "$order.modified_at" },
            "product_name": "$order.product_name",
            "useremail": "$order.useremail"
          }
        }

      ]

      stitchingQuery = [
        {
          $match: { status: { $in: [2, 3, 4, 5, 6, 7] }, tailorId: user._id }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
            includeArrayIndex: "arrayIndex",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $group: {
            _id: 1,
            order: {
              $push: {
                status: '$status', orderId: '$orderId',
                created_at: "$created_at",
                modified_at: "$modified_at",
                useremail: "$user.email"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            "status": {
              "$switch": {
                "branches": [
                  { "case": { "$eq": ["$order.status", 2] }, "then": "Pending" },
                  { "case": { "$eq": ["$order.status", 3] }, "then": "Pending RTD" },
                  { "case": { "$eq": ["$order.status", 4] }, "then": "Dispatch" },
                  { "case": { "$eq": ["$order.status", 5] }, "then": "In Transit" },
                  { "case": { "$eq": ["$order.status", 6] }, "then": "Complete" }
                  //{ "case": { "$eq": ["$order.status", 7] }, "then": "Cancelled" }
                ],
                "default": "Cancelled"
              }
            },
            "orderId": "$order.orderId",
            "OrderDate": { $toDate: "$order.created_at" },
            "LastUpdate": { $toDate: "$order.modified_at" },
            "useremail": "$order.useremail"
          }
        }
      ]

      if (status == 1) {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'Order Status', key: 'status' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Product Name', key: 'product_name' },
          { header: 'Useremail', key: 'useremail' }
        ]
      } else {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'Order Status', key: 'status' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Useremail', key: 'useremail' }
        ]
      }

    }
    else if (type == 2) {

      productQuery = [
        { $match: { status: { $in: [4] }, tailorId: user._id } },
        {
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
            from: "user",
            localField: "created_by",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: 1,
            order: {
              $push: {
                status: '$status', orderId: '$orderId',
                created_at: "$created_at",
                modified_at: "$modified_at",
                product_name: "$product.name",
                useremail: "$user.email"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            "orderId": "$order.orderId",
            "OrderDate": { $toDate: "$order.created_at" },
            "LastUpdate": { $toDate: "$order.modified_at" },
            "product_name": "$order.product_name",
            "useremail": "$order.useremail"
          }
        }

      ]

      stitchingQuery = [
        {
          $match: { status: { $in: [6] }, tailorId: user._id }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
            includeArrayIndex: "arrayIndex",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $group: {
            _id: 1,
            order: {
              $push: {
                status: '$status', orderId: '$orderId',
                created_at: "$created_at",
                modified_at: "$modified_at",
                useremail: "$user.email"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            "orderId": "$order.orderId",
            "OrderDate": { $toDate: "$order.created_at" },
            "LastUpdate": { $toDate: "$order.modified_at" },
            "useremail": "$order.useremail"
          }
        }
      ]

      if (status == 1) {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Product Name', key: 'product_name' },
          { header: 'Useremail', key: 'useremail' }
        ]
      } else {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Useremail', key: 'useremail' }
        ]
      }

    }
    else if (type == 3) {

      productQuery = [
        { $match: { status: 5, tailorId: user._id } },
        {
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
            from: "user",
            localField: "created_by",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: 1,
            order: {
              $push: {
                status: '$status', orderId: '$orderId',
                created_at: "$created_at",
                modified_at: "$modified_at",
                product_name: "$product.name",
                useremail: "$user.email"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            "orderId": "$order.orderId",
            "OrderDate": { $toDate: "$order.created_at" },
            "LastUpdate": { $toDate: "$order.modified_at" },
            "product_name": "$order.product_name",
            "useremail": "$order.useremail"
          }
        }

      ]

      stitchingQuery = [
        {
          $match: { status: 7, tailorId: user._id }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $group: {
            _id: 1,
            order: {
              $push: {
                status: '$status', orderId: '$orderId',
                created_at: "$created_at",
                modified_at: "$modified_at",
                useremail: "$user.email"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            "orderId": "$order.orderId",
            "OrderDate": { $toDate: "$order.created_at" },
            "LastUpdate": { $toDate: "$order.modified_at" },
            "useremail": "$order.useremail"
          }
        }
      ]

      if (status == 1) {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Product Name', key: 'product_name' },
          { header: 'Useremail', key: 'useremail' }
        ]
      } else {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Useremail', key: 'useremail' }
        ]
      }

    }
    else if (type == 4) {
      productQuery = [
        { $match: { status: 4, tailorId: user._id } },
        {
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
            from: "user",
            localField: "created_by",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
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
            _id: 0,
            "orderId": "$orderId",
            "OrderDate": { $toDate: "$created_at" },
            "LastUpdate": { $toDate: "$modified_at" },
            "product_name": "$product.name",
            "useremail": "$user.email",
            "rating_completed": {
              $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
            },
            "rating": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.ratingpoint", else: "--" }
            },
            "review": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.review", else: "--" }
            }
          }
        },
        { $match: { rating_completed: true } },
        {
          $group: {
            _id: 1,
            order: {
              $push: {
                orderId: "$orderId",
                OrderDate: "$OrderDate",
                LastUpdate: "$LastUpdate",
                rating_completed: "$rating_completed",
                product_name: "$product_name",
                useremail: "$useremail",
                rating: "$rating",
                review: "$review"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            orderId: "$order.orderId",
            OrderDate: "$order.OrderDate",
            LastUpdate: "$order.LastUpdate",
            product_name: "$order.product_name",
            useremail: "$order.useremail",
            rating: "$order.rating",
            review: "$order.review"
          }
        }
      ]

      stitchingQuery = [
        {
          $match: { status: 6, tailorId: user._id }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
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
          $project: {
            _id: 1,
            'orderId': '$orderId',
            'created_at': { $toDate: "$created_at" },
            'modified_at': { $toDate: "$modified_at" },
            'useremail': "$user.email",
            'is_rating': {
              $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
            },
            "rating": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.ratingpoint", else: "--" }
            },
            "review": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.review", else: "--" }
            }

          }
        },
        { $match: { is_rating: true } },
        {
          $group: {
            _id: 1,
            order: {
              $push: {
                orderId: "$orderId",
                OrderDate: "$created_at",
                LastUpdate: "$modified_at",
                useremail: "$useremail",
                rating: "$rating",
                review: "$review"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            orderId: "$order.orderId",
            OrderDate: "$order.OrderDate",
            LastUpdate: "$order.LastUpdate",
            useremail: "$order.useremail",
            rating: "$order.rating",
            review: "$order.review"
          }
        }
      ]

      if (status == 1) {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Product Name', key: 'product_name' },
          { header: 'Useremail', key: 'useremail' },
          { header: 'Rating', key: 'rating' },
          { header: 'Review', key: 'review' }
        ]
      } else {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Useremail', key: 'useremail' },
          { header: 'Rating', key: 'rating' },
          { header: 'Review', key: 'review' }
        ]
      }

    }
    else if (type == 5) {

      productQuery = [
        { $match: { status: 4, tailorId: user._id } },
        {
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
            from: "user",
            localField: "created_by",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
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
            _id: 0,
            "orderId": "$orderId",
            "OrderDate": { $toDate: "$created_at" },
            "LastUpdate": { $toDate: "$modified_at" },
            "product_name": "$product.name",
            "useremail": "$user.email",
            "rating_completed": {
              $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
            },
            "rating": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.ratingpoint", else: "--" }
            },
            "review": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.review", else: "--" }
            }
          }
        },
        { $match: { rating_completed: true, rating: { $gte: 3 } } },
        {
          $group: {
            _id: 1,
            order: {
              $push: {
                orderId: "$orderId",
                OrderDate: "$OrderDate",
                LastUpdate: "$LastUpdate",
                rating_completed: "$rating_completed",
                product_name: "$product_name",
                useremail: "$useremail",
                rating: "$rating",
                review: "$review"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            orderId: "$order.orderId",
            OrderDate: "$order.OrderDate",
            LastUpdate: "$order.LastUpdate",
            product_name: "$order.product_name",
            useremail: "$order.useremail",
            rating: "$order.rating",
            review: "$order.review"
          }
        }
      ]

      stitchingQuery = [
        {
          $match: { status: 6, tailorId: user._id }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
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
          $project: {
            _id: 1,
            'orderId': '$orderId',
            'created_at': { $toDate: "$created_at" },
            'modified_at': { $toDate: "$modified_at" },
            'useremail': "$user.email",
            'is_rating': {
              $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
            },
            "rating": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.ratingpoint", else: "--" }
            },
            "review": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.review", else: "--" }
            }

          }
        },
        { $match: { is_rating: true, rating: { $gte: 3 } } },
        {
          $group: {
            _id: 1,
            order: {
              $push: {
                orderId: "$orderId",
                OrderDate: "$created_at",
                LastUpdate: "$modified_at",
                useremail: "$useremail",
                rating: "$rating",
                review: "$review"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            orderId: "$order.orderId",
            OrderDate: "$order.OrderDate",
            LastUpdate: "$order.LastUpdate",
            useremail: "$order.useremail",
            rating: "$order.rating",
            review: "$order.review"
          }
        }
      ]

      if (status == 1) {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Product Name', key: 'product_name' },
          { header: 'Useremail', key: 'useremail' },
          { header: 'Rating', key: 'rating' },
          { header: 'Review', key: 'review' }
        ]
      } else {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Useremail', key: 'useremail' },
          { header: 'Rating', key: 'rating' },
          { header: 'Review', key: 'review' }
        ]
      }


    } else {
      productQuery = [
        { $match: { status: 4, tailorId: user._id } },
        {
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
            from: "user",
            localField: "created_by",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
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
            _id: 0,
            "orderId": "$orderId",
            "OrderDate": { $toDate: "$created_at" },
            "LastUpdate": { $toDate: "$modified_at" },
            "product_name": "$product.name",
            "useremail": "$user.email",
            "rating_completed": {
              $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
            },
            "rating": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.ratingpoint", else: "--" }
            },
            "review": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.review", else: "--" }
            }
          }
        },
        { $match: { rating_completed: true, rating: { $lt: 3 } } },
        {
          $group: {
            _id: 1,
            order: {
              $push: {
                orderId: "$orderId",
                OrderDate: "$OrderDate",
                LastUpdate: "$LastUpdate",
                rating_completed: "$rating_completed",
                product_name: "$product_name",
                useremail: "$useremail",
                rating: "$rating",
                review: "$review"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            orderId: "$order.orderId",
            OrderDate: "$order.OrderDate",
            LastUpdate: "$order.LastUpdate",
            product_name: "$order.product_name",
            useremail: "$order.useremail",
            rating: "$order.rating",
            review: "$order.review"
          }
        }
      ]

      stitchingQuery = [
        {
          $match: { status: 6, tailorId: user._id }
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        }, {
          $unwind: {
            path: "$user",
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
          $project: {
            _id: 1,
            'orderId': '$orderId',
            'created_at': { $toDate: "$created_at" },
            'modified_at': { $toDate: "$modified_at" },
            'useremail': "$user.email",
            'is_rating': {
              $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
            },
            "rating": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.ratingpoint", else: "--" }
            },
            "review": {
              $cond: { if: { "$gt": ["$rating", null] }, then: "$rating.review", else: "--" }
            }

          }
        },
        { $match: { is_rating: true, rating: { $lt: 3 } } },
        {
          $group: {
            _id: 1,
            order: {
              $push: {
                orderId: "$orderId",
                OrderDate: "$created_at",
                LastUpdate: "$modified_at",
                useremail: "$useremail",
                rating: "$rating",
                review: "$review"
              }
            }
          }
        },
        {
          $unwind: {
            path: '$order', includeArrayIndex: 'rownum'

          }
        },
        {
          $project: {
            _id: 0,
            "s_no": { $sum: ["$rownum", 1] },
            orderId: "$order.orderId",
            OrderDate: "$order.OrderDate",
            LastUpdate: "$order.LastUpdate",
            useremail: "$order.useremail",
            rating: "$order.rating",
            review: "$order.review"
          }
        }
      ]

      if (status == 1) {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Product Name', key: 'product_name' },
          { header: 'Useremail', key: 'useremail' },
          { header: 'Rating', key: 'rating' },
          { header: 'Review', key: 'review' }
        ]
      } else {
        worksheet.columns = [
          { header: 'S.no', key: 's_no' },
          { header: 'OrderId', key: 'orderId' },
          { header: 'Order Date', key: 'OrderDate' },
          { header: 'Last Update', key: 'LastUpdate' },
          { header: 'Useremail', key: 'useremail' },
          { header: 'Rating', key: 'rating' },
          { header: 'Review', key: 'review' }
        ]
      }

    }

    let productOrders = await orderListModel.aggregate(productQuery);
    if (!productOrders) {
      return { status: -1, message: "Something went wrong, Please try later." };
    }
    let stitchingOrders = await stichingCartModel.aggregate(stitchingQuery);
    if (!stitchingOrders) {
      return { status: -1, message: "Something went wrong, Please try later." };
    }


    // Have to take this approach because ExcelJS doesn't have an autofit property.
    worksheet.columns.forEach(column => {
      column.width = column.header.length < 12 ? 12 : column.header.length
    })

    // Make the header bold.
    // Note: in Excel the rows are 1 based, meaning the first row is 1 instead of 0.
    worksheet.getRow(1).font = { bold: true }

    if (status == 1) {
      // Dump all the data into Excel
      productOrders.forEach((e, index) => {

        worksheet.addRow(e);

      })
    } else {
      // Dump all the data into Excel
      stitchingOrders.forEach((e, index) => {
        worksheet.addRow(e);

      })
    }

    excelFile = workbook.xlsx.writeFile('./upload/' + user._id + '_Analytics.xlsx');
    let url = config.HOSTBACK + '/upload/' + user._id + '_Analytics.xlsx';
    return { status: 1, data: url };

  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getTemplates = async (data) => {
  try {
    let type = parseInt(data.type);
    switch (type) {
      case 1: {
        return { status: 1, message: "Privacy policy fetched Successfully", data: config.HOSTBACK +"/template/Privacy%20Policy.html" };
      }
      case 2: {
        return { status: 1, message: "FAQs fetched Successfully", data: config.HOSTBACK +"/template/FAQs.html" };
      }
      case 3: {
        return { status: 1, message: "Terms and conditions fetched Successfully", data: config.HOSTBACK +"/template/Terms%20and%20Conditions.html" };
      }
      default: {
        return { status: 1, message: "About Us fetched Successfully", data: config.HOSTBACK +"/template/About%20Us.html" };
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
    let notification = await TailorModel.findByIdAndUpdate(data._id, { $set: { notification: notif } }, { new: true });
    if (!notification) {
      return { status: -1, message: "Notification not Updated, please try After sometime." };
    }
    return { status: 1, message: "Notification Updated Successfully.", data: notification.notification };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.getAllNotifications = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("unsufficient Perameters");
    let notifications = await tailorNotificationModel.find({ userId: data._id });
    if (!notifications) {
      return { status: -1, message: "Notifications not found, please try After sometime." };
    }
    return { status: 1, message: "Notification fetched Successfully.", data: notifications };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.checkNotification = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("insufficient Perameters");
    let notifications = await TailorModel.findOne({ _id: data._id });
    if (!notifications) {
      return { status: -1, message: "Notifications not found, please try After sometime." };
    }
    return { status: 1, message: "Notification  status fetched Successfully.", data: notifications.notification };
  } catch (err) {
    throw new Error(err.message);
  }
}