const { AdminModel } = require("../models/adminModel");
const { msg } = require("../modules/message");
const authentication = require("../middlewares/authentication");
const utils = require('../modules/utils');
const { categoryModel } = require('../models/categoryModel');
const { subCategoryModel } = require('../models/subCategoryModel');
const { UserModel } = require('../models/userModel');
const { TailorModel } = require('../models/tailorModel');
const { AddressModel } = require('../models/addressModel');
const { tailorProfileModel } = require('../models/tailorProfileModel');
const { productTypeModel } = require('../models/productTypeModel');
const { productBrandModel } = require('../models/productBrandModel');
const { fabricTypeModel } = require('../models/fabricTypeModel');
const { fabricBrandModel } = require('../models/fabricBrandModel');
const { ustaadModel } = require('../models/ustaadModel');
const { promocodeModel } = require('../models/promocodeModel');
const { offerModel } = require('../models/offerModel');
const { priceControlledModel } = require('../models/priceControlled');
const { bannerModel } = require('../models/banner');
const { rewardPointsModel } = require('../models/rewardPointsModel');
const { adminOfferModel } = require('../models/adminOffer');
const { promotionalModel } = require('../models/promotionalModel');
const { orderListModel } = require('../models/orderListModel');
const { orderModel } = require('../models/orderModel');
const { tailorCancelResonModel } = require('../models/TailorCancelResonModel');
const { ratingModel } = require('../models/ratingModel');
const { fabricModel } = require('../models/fabricModel');
const { issueModel } = require('../models/issueModel');
const XLSX = require('xlsx')
const mongoose = require('mongoose');
const { sign } = require("jsonwebtoken");
const { stichingCartModel } = require("../models/stichingCartModel");
const { kunduraModel } = require("../models/kunduraModel")
const generateUniqueId = require('generate-unique-id');
const { recordMeasurementModel } = require('../models/recordMeasurmentModel');
const { measurmentModel } = require('../models/measurmentModel');
const { chargesModel } = require('../models/chargesModel');
const { paymentScheduleModel } = require('../models/paymentScheduleModel');
const { commissionModel } = require('../models/commissionModel');
const { cityModel } = require('../models/cityModel');
const fs = require('fs');
const path = require('path');
const NodeGeocoder = require('node-geocoder');
const moment = require('moment');
const { QueryInstance } = require("twilio/lib/rest/preview/understand/assistant/query");


exports.createAdmin = async (data) => {
  try {
    data.roleId = 1;
    if (!data.email || data.email == '')
      throw new Error("Please enter the email");
    if (!data.password || data.password == '')
      throw new Error("Please enter the password.");
    let user = await AdminModel.findOne({});
    if (!user) {
      let pass = await utils.encryptText(data.password);
      data.password = pass;

      data.token = await authentication.generateToken('30 days');

      let adminUser = new AdminModel(data);
      let admin = await adminUser.save();
      if (!admin) {
        return { status: -1, message: "something went wrong try after sometime" };
      }
      return { data: admin, message: msg.success, status: 1 };
    } else {
      return { status: -1, message: "Admin already Created." };
    }
  } catch (err) {
    throw new Error(err.message);
  }

};

exports.loginAdmin = async (data) => {

  try {
    if (!data.password || data.password == '')
      throw new Error("Please Enter the password");
    if (!data.role || data.role == '')
      throw new Error("Please Select the role");

    let admin;
    if (parseInt(data.role) == 1) {

      let admin_check = await AdminModel.find({ roleId: 1 }).lean();

      // Check if Admin exist, if not then Create one
      if (admin_check.length == 0) {
        return { status: 0, data: admin_check };
      }
      admin = await AdminModel.findOne({ email: data.email }).exec();
      if (!admin)
        throw new Error("Email id not Exist");
      console.log("admin :", admin);
      let check = await utils.compare(data.password, admin.password);
      if (!check) {
        throw new Error(msg.invalidPass);
      }

    } else {

      admin = await ustaadModel.findOne({ generated_user_id: data.user_id }).exec();
      if (!admin)
        throw new Error("userId is not Exist");
      console.log("admin :", admin);
      let check = await utils.compare(data.password, admin.generated_password);
      if (!check) {
        throw new Error(msg.invalidPass);
      }

    }

    let token = authentication.generateToken('30 days');
    console.log("Token :", token);
    admin.token = token;
    let adminUser = await admin.save();
    if (!adminUser) {
      return { status: -1, message: "Something went wrong, Please try Later" };
    }
    return { status: 1, data: adminUser, message: "Login Successfully" };

  } catch (error) {
    throw new Error(error.message);
  }
};



exports.logoutAdmin = async (userId, token) => {
  let result;
  let admin = await restrictedtokens.findOne({ userId: userId }).lean();

  let obj = {
    userId: userId,
    token: token,
  };
  if (!admin || admin == null) {
    let tok = new restrictedtokens(obj);
    result = await tok.save();
  } else {
    result = await restrictedtokens
      .findOneAndUpdate(
        { userId: userId },
        { $set: { token: token } },
        { new: true }
      )
      .lean();
  }
  if (!result) throw { message: msg.tokenNotSaved };
  return { message: msg.logoutSuccessfully };
};

exports.forgetPassword = async (data) => {
  try {
    if (!data.email || data.email == '')
      throw new Error("Please enter the email");

    let admin = await AdminModel.findOne({ email: data.email }).exec();
    if (!admin) {
      return { status: -1, message: "Email not exist" };
    }

    let tokenForLinkValidation = authentication.generateToken('2 days');
    admin.linkToken = tokenForLinkValidation;
    let saveAdmin = await admin.save();

    let baseUrl = "http://localhost:4200/reset-password/";
    let url = baseUrl + tokenForLinkValidation;
    let subject = "Forgot Password Email";
    let html =
      "<p>Hey! welcome  please Click " +
      ` <a href=${url}>here</a>` +
      " to change your password.</p>";
    let sendData = {
      toEmail: data.email,
      subject: subject,
      html: html,
    };
    console.log(sendData);
    // await sendEmailUsingSendgrid(sendData);
    return { status: 1, message: "Link is send on your Email id ." }

  } catch (error) {
    throw new Error(error.message);
  }
};

exports.resetPassword = async (data) => {
  try {
    if (!data.id || data.id == '')
      return { status: 0, message: "Invalid Link" };
    if (!data.confirmNewPassword || data.confirmNewPassword == '')
      throw new Error("Confirm Password Not be blank");
    if (!data.newPassword || data.newPassword == '')
      throw new Error("New Password Not be blank");
    let admin = await AdminModel.findOne({ linkToken: data.id });
    if (!admin || admin == null) {
      return { status: 0, message: "Invalid Link" };
    }
    if (data.confirmNewPassword === data.newPassword) {
      var password = await utils.encryptText(data.newPassword);
      admin.password = password;
      admin.linkToken = '' //remove
      let saveAdmin = admin.save();
      if (!saveAdmin) {
        throw new Error("Something went Wrong");
      }
      return { status: 1, message: "Password Changed Successfully, Please Login" };
    } else {
      throw { message: msg.fieldNotMatch };
    }

  } catch (error) {
    throw new Error(err.message);
  }
};

exports.changePassword = async (data) => {
  console.log("node", data)
  let userId = data._id
  console.log(userId);
  let admin = await AdminModel.findById(userId).lean();
  //console.log(admin,"hiii")

  if (!admin || admin == null) throw { message: msg.userNotExist };


  let check = await bcrypt.compare(data.oldPassword, admin.password);
  if (!check) throw { message: msg.invalidPass };
  //console.log(check)
  if (data.newPassword === data.confirmPassword) {
    var pass = await bcrypt.hash(data.newPassword, 10);
  } else {
    throw { message: msg.fieldNotMatch };
  }


  let a = await AdminModel.update({ _id: userId }, { $set: { password: pass } });

  return { message: msg.passwordUpdated };
};

exports.getAllCategory = async () => {
  try {
    let categories = await categoryModel.find({ is_deleted: false }).exec();
    if (!categories) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "Category Save Successfully.", data: categories };
  } catch (error) {
    throw new Error(error.message);
  }

};

exports.getAllActiveCategory = async () => {
  try {
    let categories = await categoryModel.find({ $and: [{ is_deleted: false }, { is_active: true }] }).exec();
    if (!categories) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "Category Save Successfully.", data: categories };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.importCats = async (data) => {
  try {

    var workbook = XLSX.readFile(data.image);
    var sheet_name_list = workbook.SheetNames;
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    for (let i = 0; i < xlData.length; i++) {
      xlData[i].subCategoryImage = ' ';
    }
    let categories = await subCategoryModel.insertMany(xlData);
    if (!categories) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "Categories Saved Successfully.", data: categories };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.importProducts = async (data) => {
  try {

    var workbook = XLSX.readFile(data.image);
    var sheet_name_list = workbook.SheetNames;
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    for (let i = 0; i < xlData.length; i++) {
      xlData[i].image = ' ';
      if (xlData[i].categoryId != undefined) {
        xlData[i].categoryId = xlData[i].categoryId.replace(/“/g, '"');
        xlData[i].categoryId = xlData[i].categoryId.replace(/”/g, '"');
        xlData[i].categoryId = JSON.parse(xlData[i].categoryId);
      }
      if (xlData[i].subCategoryId != undefined) {
        xlData[i].subCategoryId = xlData[i].subCategoryId.replace(/“/g, '"');
        xlData[i].subCategoryId = xlData[i].subCategoryId.replace(/”/g, '"');
        xlData[i].subCategoryId = JSON.parse(xlData[i].subCategoryId);
      }
    }
    let categories = await productTypeModel.insertMany(xlData);
    if (!categories) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "Products Saved Successfully.", data: categories };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.importBrands = async (data) => {
  try {

    var workbook = XLSX.readFile(data.image);
    var sheet_name_list = workbook.SheetNames;
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    for (let i = 0; i < xlData.length; i++) {
      xlData[i].image = ' ';
      xlData[i].productTypeId = JSON.parse(xlData[i].productTypeId);
      if (xlData[i].categoryId != undefined) {
        xlData[i].categoryId = xlData[i].categoryId.replace(/“/g, '"');
        xlData[i].categoryId = xlData[i].categoryId.replace(/”/g, '"');
        xlData[i].categoryId = JSON.parse(xlData[i].categoryId);
      }
      if (xlData[i].subCategoryId != undefined) {
        xlData[i].subCategoryId = xlData[i].subCategoryId.replace(/“/g, '"');
        xlData[i].subCategoryId = xlData[i].subCategoryId.replace(/”/g, '"');
        xlData[i].subCategoryId = JSON.parse(xlData[i].subCategoryId);
      }
    }

    let categories = await productBrandModel.insertMany(xlData);
    if (!categories) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "Products Saved Successfully.", data: categories };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.addCategory = async (data) => {
  try {
    if (!data.category_name || data.category_name == '') {
      throw new Error("Please give the Category Name");
    }
    let fetchCategory = await categoryModel.findOne({ $and: [{ category_name: new RegExp(["^", data.category_name, "$"].join(""), "i") }, { is_deleted: false }] }).exec();
    if (fetchCategory) {
      return { status: -1, message: "Category Name already exist." };
    }
    let category = await categoryModel.create(data);
    category.save();
    if (!category) {
      return { status: -1, message: "Category not save, please try After sometime." }
    }
    return { status: 1, message: "Category Save Successfully.", data: category };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.deleteCategory = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("unsufficient Perameters");
    let category = await categoryModel.findByIdAndUpdate(data._id, { $set: { is_deleted: true } }, { new: true });
    if (!category) {
      return { status: -1, message: "Category not Delete, please try After sometime." };
    }
    return { status: 1, message: "Category Delete Successfully.", data: category };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateCategory = async (data) => {
  try {
    if (!data._id || data._id == '' || !data.category_name || data.category_name == '') {
      throw new Error("unsufficient Perameters");
    }
    let fetchCategory = await categoryModel.findOne({ $and: [{ category_name: { $regex: new RegExp(data.category_name, "i") } }, { _id: { $ne: data._id } }] }).exec();
    if (fetchCategory) {
      return { status: -1, message: "Category Name already exist." };
    }
    let category = await categoryModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!category) {
      return { status: -1, message: "Category not Delete, please try After sometime." }
    }
    return { status: 1, message: "Category Delete Successfully.", data: category };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.changeCategoryStatus = async (data) => {
  try {
    if (!data._id || data._id == '' || data.is_active == undefined || data.is_active == '')
      throw new Error("unsufficient Perameters");
    let category = await categoryModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!category) {
      return { status: -1, message: "Category not Delete, please try After sometime." }
    }
    return { status: 1, message: "Category Delete Successfully.", data: category };
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.addSubCategory = async (data) => {
  try {
    if (!data.categoryId || data.categoryId == '') {
      throw new Error("Insufficient Parameters");
    }
    if (!data.subCategory_name || data.subCategory_name == '') {
      throw new Error("Please provide Sub Category name")
    }
    if (!data.subCategoryImage || data.subCategoryImage == '') {
      throw new Error("Image is not provided.")
    }
    let fetchSubCategory = await subCategoryModel.findOne({ $and: [{ subCategory_name: new RegExp(["^", data.subCategory_name, "$"].join(""), "i") }, { is_deleted: false }] }).exec();
    if (fetchSubCategory) {
      return { status: -1, message: "Sub Category Name already exist." };
    }
    let checkCategoryExist = await categoryModel.findById(data.categoryId)
    if (!checkCategoryExist) {
      return { status: -1, message: "such Category does not exit." };
    }
    let saveSubCategory = await subCategoryModel.create(data);
    saveSubCategory.save();
    if (!saveSubCategory) {
      return { status: -1, message: "Sub Category not save, please try After sometime." }
    }
    return { status: 1, message: "Sub Category Save Successfully.", data: saveSubCategory };
  } catch (error) {
    throw new Error(error.message)
  }
}

exports.addProductType = async (data) => {
  try {
    if (!data.name || data.name == '') {
      throw new Error("Please enter Product Type.");
    }
    if (!data.description || data.description == '') {
      throw new Error("Please enter description.");
    }
    data.categoryId = JSON.parse(data.categoryId);
    if (!data.categoryId || data.categoryId == '' || data.categoryId.length <= 0) {
      throw new Error("Please give atleast one categoryId");
    }
    data.subCategoryId = JSON.parse(data.subCategoryId);
    if (!data.subCategoryId || data.subCategoryId == '' || data.subCategoryId.length <= 0) {
      throw new Error("Please give atleast one subCategoryId");
    }
    console.log("Image :", data.image);
    if (!data.image || data.image == '' || data.image == 'undefined') {
      throw new Error("Please provide the image.");
    }
    let fetchProductType = await productTypeModel.findOne({ $and: [{ name: new RegExp(["^", data.name, "$"].join(""), "i") }, { is_deleted: false }] }).exec();
    if (fetchProductType) {
      return { status: -1, message: "Product Type Name already exist." };
    }
    let saveProductType = await productTypeModel.create(data);
    saveProductType.save();
    if (!saveProductType) {
      return { status: -1, message: "Product Type not save, please try After sometime." }
    }
    return { status: 1, message: "Product Type Save Successfully.", data: saveProductType };
  } catch (error) {
    throw new Error(error.message)
  }
};

exports.deleteProductType = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Parameters");
    let productType = await productTypeModel.findByIdAndUpdate(data._id, { $set: { is_deleted: true } }, { new: true });
    if (!productType) {
      return { status: -1, message: "productType not Delete, please try After sometime." };
    }
    return { status: 1, message: "Product Type Deleted Successfully.", data: productType };
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.deleteBrand = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Parameters");
    let brand = await productBrandModel.findByIdAndUpdate(data._id, { $set: { is_deleted: true } }, { new: true });
    if (!brand) {
      return { status: -1, message: "Product Brand not Delete, please try After sometime." };
    }
    return { status: 1, message: "Product Type Deleted Successfully.", data: brand };
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.updateProductType = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Paramaters");

    if (data.categoryId) {
      data.categoryId = JSON.parse(data.categoryId);
      if (data.categoryId.length <= 0) {
        throw new Error("Please give atleast one categoryId");
      }
    }

    if (data.subCategoryId) {
      data.subCategoryId = JSON.parse(data.subCategoryId);
      if (data.subCategoryId.length <= 0) {
        throw new Error("Please give atleast one subCategoryId");
      }
    }

    if (data.image) {
      if (data.image == 'undefined') {
        throw new Error("image not be blank.");
      }
    }

    let update = await productTypeModel.findByIdAndUpdate(data._id, { $set: data }, { new: true })
    if (!update) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Sub Category updated Successfully.", data: update }
  } catch (error) {
    throw new Error(error.message)
  }
};

exports.updateBrand = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Paramaters");

    if (data, categoryId) {
      data.categoryId = JSON.parse(data.categoryId);
      if (data.categoryId.length <= 0) {
        throw new Error("Please give atleast one categoryId");
      }
    }

    if (data.subCategoryId) {
      data.subCategoryId = JSON.parse(data.subCategoryId);
      if (data.subCategoryId.length <= 0) {
        throw new Error("Please give atleast one subCategoryId");
      }
    }

    if (data.productTypeId) {
      data.productTypeId = JSON.parse(data.productTypeId);
      if (data.productTypeId.length <= 0) {
        throw new Error("Please give atleast one productTypeId");
      }
    }

    if (data.image) {
      if (data.image == 'undefined') {
        throw new Error("Brand Image not be blank.");
      }
    }

    if (data.brand_doc) {
      if (data.brand_doc == 'undefined') {
        throw new Error("Brand document not be blank.");
      }
    }

    data.modified_at = Date.now();
    let update = await productTypeModel.findByIdAndUpdate(data._id, { $set: data }, { new: true })
    if (!update) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Sub Category updated Successfully.", data: update }
  } catch (error) {
    throw new Error(error.message)
  }
};

exports.changeProductType = async (data) => {
  try {
    if (!data._id || data._id == '' || data.is_active == undefined || data.is_active == '')
      throw new Error("unsufficient Perameters");
    let fetchProductType = await productTypeModel.findById(data._id)
    if (!fetchProductType) {
      return { status: -1, message: "Sub Category not Exist,Please try later." }
    }
    let checkStatus = await productTypeModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Sub Category status not changed, please try After sometime." }
    }
    return { status: 1, message: "Sub Category status changed Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.changeBrandStatus = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await productBrandModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Product Brand status not changed, please try After sometime." }
    }
    return { status: 1, message: "Product Brand status changed Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getAllActiveProductType = async () => {
  try {
    let productType = await productTypeModel.find({ $and: [{ is_deleted: false }, { is_active: true }] }).exec();
    if (!productType) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "ProductType Fetch Successfully.", data: productType };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getProductTypes = async (data) => {
  try {
    if (!data.subCategories || data.subCategories == '' || data.subCategories.length == 0)
      throw new Error("Please select a subCategories.");

    let products = await productTypeModel.find({ $and: [{ 'subCategoryId': { '$in': data.subCategories } }, { is_deleted: false }] }).exec();
    if (!products) {
      return { status: -1, message: "Something went wrong, Please try after sometime" };
    }
    return { status: 1, message: "products fetch Successfully.", data: products };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getAllProductType = async () => {
  try {
    let productTypes = await productTypeModel.find({ is_deleted: false }).populate('categoryId').populate('subCategoryId').exec();
    if (!productTypes) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "All products type fetch Successfully. ", data: productTypes };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getAllBrands = async () => {
  try {
    let brands = await productBrandModel.find({ is_deleted: false }).populate('categoryId').populate('subCategoryId').populate('productTypeId').exec();
    if (!brands) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "All products type fetch Successfully. ", data: brands };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.deleteSubCategory = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Parameters");
    let subCategory = await subCategoryModel.findByIdAndUpdate(data._id, { $set: { is_deleted: true } }, { new: true });
    if (!subCategory) {
      return { status: -1, message: "Sub Category not Delete, please try After sometime." };
    }
    return { status: 1, message: "Sub Category Delete Successfully.", data: subCategory };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateSubCategory = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Paramaters");
    let fetchSubCategory = await subCategoryModel.findById(data._id)
    if (!fetchSubCategory) {
      return { status: -1, message: "Sub Category not Exist,Please try later." }
    }
    let update = await subCategoryModel.findByIdAndUpdate(data._id, { $set: data }, { new: true })
    if (!update) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Sub Category updated Successfully.", data: update }
  } catch (error) {
    throw new Error(error.message)
  }
}

exports.changeSubCategoryStatus = async (data) => {
  try {
    if (!data._id || data._id == '' || data.is_active == undefined || data.is_active == '')
      throw new Error("unsufficient Perameters");
    let fetchSubCategory = await subCategoryModel.findById(data._id)
    if (!fetchSubCategory) {
      return { status: -1, message: "Sub Category not Exist,Please try later." }
    }
    let checkStatus = await subCategoryModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Sub Category status not changed, please try After sometime." }
    }
    return { status: 1, message: "Sub Category status changed Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getSubCategories = async (data) => {
  try {
    if (!data.categories || data.categories == '' || data.categories.length == 0)
      throw new Error("Please select a categories");
    console.log("Categories :", data.categories);
    let subCategories = await subCategoryModel.find({ $and: [{ 'categoryId': { '$in': data.categories } }, { is_deleted: false }] }).exec();
    console.log("SubCategories :", subCategories);
    if (!subCategories) {
      return { status: -1, message: "Something went wrong, Please try after sometime" };
    }
    return { status: 1, message: "Sub Categories fetch Successfully.", data: subCategories };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getAllSubCategory = async () => {
  try {
    console.log("Its Here");
    let subCategories = await subCategoryModel.find({ is_deleted: false }).populate('categoryId').exec();
    if (!subCategories) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "Done Successfully. ", data: subCategories };
  } catch (error) {
    throw new Error(error.message);
  }

};

exports.getAllActiveSubCategory = async () => {
  try {
    let subCategories = await subCategoryModel.find({ $and: [{ is_deleted: false }, { is_active: true }] }).exec();
    if (!subCategories) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "SubCategories Fetch Successfully.", data: subCategories };
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.getUsers = async () => {
  try {
    let users = await UserModel.find().populate('addresses');
    if (!users) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    return { status: 1, message: "All users fetch Successfully", data: users };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.removeUser = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("unsufficient Parameters");

    let tailors = await UserModel.findByIdAndRemove(mongoose.Types.ObjectId(data._id));
    if (!tailors) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    return { status: 1, message: "User Delete SuccessFully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.changeStatus = async (data) => {
  try {
    if (!data._id || data._id == '') { throw new Error("unsufficient Parameters"); }
    if (!data.status || data.status == '') { throw new Error("Select the status"); }

    let user = await UserModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { isBlocked: data.status }, { new: true });
    if (!user) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    return { status: 1, message: "User Updated SuccessFully." };

  } catch (error) {
    throw new Error(error.message);
  }
};

exports.userDetails = async (data) => {
  try {
    if (!data._id || data._id == '') { throw new Error("unsufficient Parameters"); }
    let user = await UserModel.findOne(mongoose.Types.ObjectId(data._id)).populate('addresses');
    if (!user) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    let userAddress = await AddressModel.findOne(user._id);
    user.address = userAddress;
    return { status: 1, message: "User Fetch SuccessFully.", data: user };

  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getTailors = async () => {
  try {
    let tailors = await tailorProfileModel.find({ is_profile_filled: true, is_deleted: false }).populate('tailorId').sort({ created_at: -1 });
    if (!tailors) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    return { status: 1, message: "All Tailors fetch Successfully", data: tailors };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getTailorDetails = async (data) => {
  try {

    if (!data._id || data._id == '') { throw new Error("unsufficient Parameters"); }
    let tailors = await tailorProfileModel.findOne({ _id: data._id }).populate('tailorId');

    if (!tailors) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    return { status: 1, message: "Tailor data fetch Successfully", data: tailors };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.changeTailorStatus = async (data) => {
  try {
    if (!data._id || data._id == '') { throw new Error("unsufficient Parameters"); }
    if (!data.status || data.status == '') { throw new Error("Select the status"); }
    let user = await tailorProfileModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { profile_status: data.status }, { new: true });
    if (!user) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    return { status: 1, message: "User Updated SuccessFully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.deleteTailor = async (data) => {
  try {
    if (!data._id || data._id == '') { throw new Error("unsufficient Parameters"); }
    let user = await tailorProfileModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { is_deleted: true }, { new: true });
    if (!user) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    return { status: 1, message: "Tailor deleted successfully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.blockTailor = async (data) => {
  try {
    if (!data._id || data._id == '') { throw new Error("unsufficient Parameters"); }
    // if (!data.status || data.status == '') { throw new Error("Select the status"); }
    let user = await tailorProfileModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { is_block: data.status }, { new: true });
    if (!user) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    let stat = data.status ? 'blocked' : 'unblocked';
    return { status: 1, message: `Tailor ${stat} successfully.` };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.saveBasicDetails = async (data) => {
  try {
    if (!data._id || data._id == '') { throw new Error("unsufficient Parameters"); }
    if (!data.fullName || data.fullName == '') { throw new Error("Enter the name"); }
    if (!data.country || data.country == '') { throw new Error("Enter the country"); }
    if (!data.city || data.city == '') { throw new Error("Enter the city"); }
    if (!data.address || data.address == '') { throw new Error("Enter the address"); }
    if (!data.mobile || data.mobile == '') { throw new Error("Enter the mobile"); }
    if (!data.email || data.email == '') { throw new Error("Enter the email"); }

    //if (!data.dob || data.dob == '') {throw new Error("Enter the dob");}
    let user = await TailorModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id), { email: data.email, mobile: data.mobile, fullName: data.fullName }, { new: true });
    if (!user) {
      return { status: -1, message: "Something went Wrong,Please try later." };
    }
    let dataTo = {};
    dataTo["businessLocation.street_name"] = data.address;
    dataTo["businessLocation.city"] = data.city;
    dataTo["businessLocation.country"] = data.country;
    dataTo["fullName"] = data.fullName;
    dataTo["image"] = data.image;
    dataTo["nationalIdImage"] = data.nationalIdImage;
    console.log("Data :", dataTo);
    let tailorProfile = await tailorProfileModel.findOneAndUpdate({ tailorId: user._id }, { $set: dataTo }, { new: true });
    if (!tailorProfile) {
      return { status: -1, message: "Something went Wrong, Please try later." };
    }
    return { status: 1, message: "User Updated SuccessFully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.saveBankDetails = async (data) => {
  try {
    if (!data._id || data._id == '') { throw new Error("unsufficient Parameters"); }
    if (!data.fullName || data.fullName == '') { throw new Error("Enter the fullName"); }
    if (!data.country || data.country == '') { throw new Error("Enter the country"); }
    if (!data.city || data.city == '') { throw new Error("Enter the city"); }
    if (!data.street_name || data.street_name == '') { throw new Error("Enter the street_name"); }
    if (!data.account_name || data.account_name == '') { throw new Error("Enter the account_name"); }
    if (!data.account_number || data.account_number == '') { throw new Error("Enter the account_number"); }
    if (!data.bank_name || data.bank_name == '') { throw new Error("Enter the bank_name"); }
    if (!data.postal_code || data.postal_code == '') { throw new Error("Enter the postal_code"); }
    //if (!data.dob || data.dob == '') {throw new Error("Enter the dob");}
    // let user = await TailorModel.findByIdAndUpdate(mongoose.Types.ObjectId(data._id),{email:data.email,mobile:data.mobile},{new:true});
    // if (!user) {
    //   return { status: -1, message: "Something went Wrong,Please try later." };
    // }
    let dataTo = {};
    dataTo["bank_details.branch_address.street_name"] = data.street_name;
    dataTo["bank_details.branch_address.city"] = data.city;
    dataTo["bank_details.country"] = data.country;
    dataTo["bank_details.branch_address.postal_code"] = data.postal_code;
    dataTo["bank_details.bank_name"] = data.bank_name;
    dataTo["bank_details.account_number"] = data.account_number;
    dataTo["bank_details.account_name"] = data.account_name;
    dataTo["fullName"] = data.fullName;
    console.log("Data :", dataTo);
    let tailorProfile = await tailorProfileModel.findOneAndUpdate({ tailorId: data._id }, { $set: dataTo }, { new: true });
    console.log(tailorProfile, "tailorProfile")
    if (!tailorProfile) {
      return { status: -1, message: "Something went Wrong, Please try later." };
    }
    return { status: 1, message: "User Updated SuccessFully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.addBrand = async (data) => {
  try {
    if (data.brand_id) {
      if (data.image == '') delete data.data.image;
      if (data.brand_doc == '') delete data.brand_doc;
      if (data.uploaded_doc_type == '') delete data.uploaded_doc_type;
      data.categoryId = JSON.parse(data.categoryId);
      if (!data.categoryId || data.categoryId == '' || data.categoryId.length <= 0) {
        throw new Error("Please give atleast one categoryId");
      }
      data.subCategoryId = JSON.parse(data.subCategoryId);
      if (!data.subCategoryId || data.subCategoryId == '' || data.subCategoryId.length <= 0) {
        throw new Error("Please give atleast one subCategoryId");
      }

      data.productTypeId = JSON.parse(data.productTypeId);
      if (!data.productTypeId || data.productTypeId == '' || data.productTypeId.length <= 0) {
        throw new Error("Please give atleast one subCategoryId");
      }
      data.add_by = 'admin';
      data.is_approved = true;
      // let fetchBrand = await productBrandModel.findOne({ name: { $regex: new RegExp(data.name, "i") } }).exec();
      // if (fetchBrand) {
      //   return { status: -1, message: "Brand Name already exist." };
      // }
      let saveBrand = await productBrandModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.brand_id) }, {
        $set: data
      }, { new: true, lean: true });
      if (!saveBrand) {
        return { status: -1, message: "Brand not save, please try After sometime." }
      }
      return { status: 1, message: "Brand Updated Successfully.", data: saveBrand };
    } else {
      if (!data.name || data.name == '') { throw new Error("Enter the brand name"); }
      if (!data.image || data.image == '' || data.image == 'undefined') { throw new Error("Upload the image"); }
      if (!data.uploaded_doc_type == undefined) { throw new Error("Select the Document Type"); }
      if (!data.brand_doc || data.brand_doc == '' || data.brand_doc == 'undefined') { throw new Error("Upload the brand document"); }
      data.categoryId = JSON.parse(data.categoryId);
      if (!data.categoryId || data.categoryId == '' || data.categoryId.length <= 0) {
        throw new Error("Please give atleast one categoryId");
      }
      data.subCategoryId = JSON.parse(data.subCategoryId);
      if (!data.subCategoryId || data.subCategoryId == '' || data.subCategoryId.length <= 0) {
        throw new Error("Please give atleast one subCategoryId");
      }

      data.productTypeId = JSON.parse(data.productTypeId);
      if (!data.productTypeId || data.productTypeId == '' || data.productTypeId.length <= 0) {
        throw new Error("Please give atleast one subCategoryId");
      }
      data.add_by = 'admin';
      data.is_approved = true;
      // let fetchBrand = await productBrandModel.findOne({ name: { $regex: new RegExp(data.name, "i") } }).exec();
      // if (fetchBrand) {
      //   return { status: -1, message: "Brand Name already exist." };
      // }
      let saveBrand = await productBrandModel.create(data);
      saveBrand.save();
      if (!saveBrand) {
        return { status: -1, message: "Brand not save, please try After sometime." }
      }
      return { status: 1, message: "Brand Save Successfully.", data: saveBrand };
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.addFabricType = async (data) => {
  try {
    if (!data.name || data.name == '') {
      throw new Error("Please enter Fabric Type.");
    }
    if (!data.description || data.description == '') {
      throw new Error("Please enter description.");
    }
    if (!data.image || data.image == '' || data.image == 'undefined') {
      throw new Error("Please provide the image.");
    }
    let fetchFabricType = await fabricTypeModel.findOne({ $and: [{ name: { $regex: new RegExp(data.name, "i") } }, { is_deleted: false }] }).exec();
    if (fetchFabricType) {
      return { status: -1, message: "Fabric Brand Name already exist." };
    }
    let saveFabricType = await fabricTypeModel.create(data);
    saveFabricType.save();
    if (!saveFabricType) {
      return { status: -1, message: "Fabric brand not save, please try After sometime." }
    }
    return { status: 1, message: "Fabric Brand Save Successfully.", data: saveFabricType };
  } catch (error) {
    throw new Error(error.message)
  }
};

exports.deleteFabricType = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Parameters");
    let fabricType = await fabricTypeModel.findByIdAndUpdate(data._id, { $set: { is_deleted: true } }, { new: true });
    if (!fabricType) {
      return { status: -1, message: "FabricType not Delete, please try After sometime." };
    }
    return { status: 1, message: "Fabric Type Deleted Successfully.", data: fabricType };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateFabricType = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Paramaters");

    // if (data.image){
    //   if(data.image == 'undefined') {
    //     throw new Error("image not be blank.");
    //   }
    // }

    let update = await fabricTypeModel.findByIdAndUpdate(data._id, { $set: data }, { new: true })
    if (!update) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Sub Category updated Successfully.", data: update }
  } catch (error) {
    throw new Error(error.message)
  }
};

exports.changeFabricTypeStatus = async (data) => {
  try {
    if (!data._id || data._id == '' || data.is_active == undefined || data.is_active == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await fabricTypeModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Fabric Type status not changed, please try After sometime." }
    }
    return { status: 1, message: "Fabric Type status changed Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getAllFabricTypes = async () => {
  try {
    let fabricTypes = await fabricTypeModel.find({ is_deleted: false }).sort({ created_at: -1 }).exec();
    if (!fabricTypes) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "All fabric type fetch Successfully. ", data: fabricTypes };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.importFabrics = async (data) => {
  try {
    var workbook = XLSX.readFile(data.image);
    var sheet_name_list = workbook.SheetNames;
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    let fabricTypes = await fabricTypeModel.insertMany(xlData);
    if (!fabricTypes) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "All fabric type added successfully. ", data: fabricTypes };
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getAllActiveFabricTypes = async () => {
  try {
    let fabricType = await fabricTypeModel.find({ $and: [{ is_deleted: false }, { is_active: true }] }).exec();
    if (!fabricType) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "fabricType Fetch Successfully.", data: fabricType };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.addFabricBrand = async (data) => {
  try {
    if (!data.name || data.name == '') { throw new Error("Enter the brand name"); }
    if (!data.image || data.image == '' || data.image == 'undefined') { throw new Error("Upload the image"); }

    // if (!data.fabricTypeId || data.fabricTypeId == '' || data.fabricTypeId.length <= 0) {
    //   throw new Error("Please give atleast one fabric type");
    // }
    if (data.fabricTypeId != undefined) {
      if (data.fabricTypeId || data.fabricTypeId != '' || data.fabricTypeId.length > 0) {
        data.fabricTypeId = JSON.parse(data.fabricTypeId);
      }
    }
    let fetchBrand = await fabricBrandModel.findOne({ $and: [{ name: { $regex: new RegExp(data.name, "i") } }, { is_deleted: false }] }).exec();
    if (fetchBrand) {
      return { status: -1, message: "Brand Name already exist." };
    }

    let saveBrand = await fabricBrandModel.create(data);
    saveBrand.save();
    if (!saveBrand) {
      return { status: -1, message: "Brand not save, please try After sometime." }
    }
    return { status: 1, message: "Brand Save Successfully.", data: saveBrand };

  } catch (error) {
    throw new Error(error.message);
  }
};

exports.deleteFabricTypeBrand = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Parameters");
    let brand = await fabricBrandModel.findByIdAndUpdate(data._id, { $set: { is_deleted: true } }, { new: true });
    if (!brand) {
      return { status: -1, message: "Product Brand not Delete, please try After sometime." };
    }
    return { status: 1, message: "Product Type Deleted Successfully.", data: brand };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.updateFabricBrand = async (data) => {
  try {
    if (!data._id || data._id == '')
      throw new Error("Insufficient Paramaters");

    if (data.fabricTypeId) {
      data.fabricTypeId = JSON.parse(data.fabricTypeId);
      if (data.fabricTypeId.length <= 0) {
        throw new Error("Please give atleast one fabricTypeId");
      }
    }

    data.modified_at = Date.now();
    let update = await fabricBrandModel.findByIdAndUpdate(data._id, { $set: data }, { new: true })
    if (!update) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Sub Category updated Successfully.", data: update }
  } catch (error) {
    throw new Error(error.message)
  }
};

exports.changeFabricBrandStatus = async (data) => {
  try {
    if (!data._id || data._id == '' || data.is_active == undefined || data.is_active == '')
      throw new Error("unsufficient Perameters");

    let checkStatus = await fabricBrandModel.findByIdAndUpdate(data._id, data, { new: true });
    if (!checkStatus) {
      return { status: -1, message: "Brand status not changed, please try After sometime." }
    }
    return { status: 1, message: "Brand status changed Successfully.", data: checkStatus };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getAllFabricbrands = async (data) => {
  try {
    let brands = await fabricBrandModel.find({ is_deleted: false }).populate('fabricTypeId').sort({ created_at: -1 }).exec();
    if (!brands) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "All brands fetch Successfully. ", data: brands };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.importBrandsTypes = async (data) => {
  try {

    var workbook = XLSX.readFile(data.image);
    var sheet_name_list = workbook.SheetNames;
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    for (let i = 0; i < xlData.length; i++) {
      xlData[i].image = ' ';
      if (xlData[i].fabricTypeId != undefined) {
        xlData[i].fabricTypeId = xlData[i].fabricTypeId.replace(/“/g, '"');
        xlData[i].fabricTypeId = xlData[i].fabricTypeId.replace(/”/g, '"');
        xlData[i].fabricTypeId = JSON.parse(xlData[i].fabricTypeId);
      }
    }

    let categories = await fabricBrandModel.insertMany(xlData);
    if (!categories) {
      return { status: -1, message: "Something have a problem, Please try afterSometime" };
    }
    return { status: 1, message: "Products added successfully.", data: categories };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.addPromocode = async (data) => {
  try {
    if (data.promo_id) {
      if (data.image == '') delete data.image;
      let promo_id = data.promo_id;
      delete data.promo_id;
      let promo = await promocodeModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(promo_id) }, {
        $set: data
      }, { new: true, lean: true });
      if (!promo) {
        return { status: -1, message: "Something went wrong, Please try after sometime" };
      }
      return { status: 1, message: "Promocode updated successfully. ", data: promo };
    } else {
      let promocode = await promocodeModel.create(data);
      if (!promocode) {
        return { status: -1, message: "Something went wrong, Please try after sometime" };
      }
      return { status: 1, message: "Promocode added successfully. ", data: promocode };
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.deletePromocode = async (data) => {
  try {
    let promo = await promocodeModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.promo_id) }, {
      $set: { is_deleted: true, updated_at: new Date().getTime() }
    }, { new: true, lean: true });
    if (!promo) {
      return { status: -1, message: "Something went wrong, Please try afterSometime" };
    }
    return { status: 1, message: "Promocode deleted successfully. ", data: promo };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.blockPromocode = async (data) => {
  try {
    let promo = await promocodeModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.promo_id) }, {
      $set: { is_blocked: data.status, updated_at: new Date().getTime() }
    }, { new: true, lean: true });
    if (!promo) {
      return { status: -1, message: "Something went wrong, Please try afterSometime" };
    }
    if (data.status) {
      return { status: 1, message: "Promocode blocked successfully. ", data: promo };
    } else {
      return { status: 1, message: "Promocode unblocked successfully. ", data: promo };
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.getPromocodes = async () => {
  try {
    let promos = await promocodeModel.find({ is_deleted: false });
    if (promos) {
      return { status: 1, message: "Promocode blocked successfully. ", data: promos };
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

// offer mgnt
exports.getOffers = async () => {
  try {
    let offers = await offerModel.find({ is_deleted: false });

    if (offers) {
      return { status: 1, message: "Offer List. ", data: offers};
    }
    
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.changeOfferStatus = async (data) => {
  try {
    let { offer_id, status } = data;
    let offers = await offerModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(offer_id) }, {
      $set: { status: status }
    }, { new: true, lean: true });
    if (offers) {
      let msg = (status == 1 ? 'Offer Approved Successfully' : 'Offer Rejected Successfully')
      return { status: 1, message: msg, data: offers };
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

// reward point mgnt

exports.addRewardPoints = async (data) => {
  try {

    //signup reward

    let reward = await rewardPointsModel.create({})
    if (reward) {
      return { status: 1, message: 'Data updated successfully', data: reward };
    }
  } catch (err) {
    throw new Error(err.message);
  }

}
exports.updateRewardPoints = async (data) => {
  try {
    let reward = await rewardPointsModel.findOneAndUpdate({}, {
      $set: data
    }, { new: true, lean: true, upsert: true });
    if (reward) {
      return { status: 1, message: 'Data updated successfully', data: reward };
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.getRewardPoints = async (data) => {
  try {
    let reward = await rewardPointsModel.findOne({});
    if (reward) {
      return { status: 1, message: 'Reward Point Data', data: reward };
    }
  } catch (err) {
    throw new Error(err.message);
  }
}


exports.addoffer = async (body) => {
  try {
    var dataToSave = {
      title: body.title,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      minimum: body.minimum,
      maximum: body.maximum,
      paymentMethod: body.paymentMethod,
      paymentBank: body.paymentBank,
      discount: body.discount
    }
    console.log("Data Here :", dataToSave);
    var offerAdded = await adminOfferModel.create(dataToSave)
    offerAdded.save();

    if (!offerAdded) {
      return {
        status: -1,
        message: 'Something went wrong.'
      }
    }

    return {
      status: 0,
      message: 'Offer added successfully.',
      data: offerAdded
    }
  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.deleteoffer = async (body) => {
  try {
    var deleted = await adminOfferModel.findOneAndUpdate({
      _id: body.offerId
    }, { is_deleted: true }).lean();

    if (!deleted) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Offer deleted successfully.',
      data: deleted
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.blockunblock = async (body) => {
  try {

    var statusx = await adminOfferModel.findOne({
      _id: body.offerId
    }).lean()

    if (!statusx) {
      return {
        status: -1,
        message: 'Something went wrong.'
      }
    }

    if (statusx.is_block === true) {
      var unblockOffer = await adminOfferModel.findByIdAndUpdate(
        { _id: body.offerId },
        { is_block: false },
        { new: true }
      );
      return {
        status: 0,
        message: 'Offer unblock successfully',
        data: unblockOffer
      }
    } else {
      var blockOffer = await adminOfferModel.findByIdAndUpdate(
        { _id: body.offerId },
        { is_block: true },
        { new: true }
      );
      return {
        status: 0,
        message: 'Offer block successfully.',
        data: blockOffer
      }
    }


  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.editoffer = async (body) => {
  try {
    var edited = await adminOfferModel.findOneAndUpdate({
      _id: body.offerId
    },
      { $set: body }, { new: true }).lean()


    if (!edited) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Offer edited successfully.',
      data: edited
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.viewoffer = async (body) => {
  try {
    var view = await adminOfferModel.findOne({
      _id: body.offerId
    }).lean()


    if (!view) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Offer fetched successfully.',
      data: view
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.getalloffer = async (body) => {
  try {
    var getall = await adminOfferModel.find({ is_deleted: false }).sort({ _id: -1 });

    if (!getall) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Offer fetched successfully.',
      data: getall
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.addpricecontrolled = async (body) => {
  try {
    var dataToSave = {
      duration: body.duration,
      price: body.price
    }
    var savePriceControlled = await priceControlledModel.create(dataToSave)
    savePriceControlled.save();

    if (!savePriceControlled) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Price controlled added.',
      data: savePriceControlled
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.viewpricecontrolled = async (body) => {
  try {

    var viewPrice = await priceControlledModel.findOne({
      _id: body.priceControlledId
    }).lean();

    if (!viewPrice) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }
    return {
      status: 0,
      message: 'Price fetched successfully.',
      data: viewPrice
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.deletepricecontrolled = async (body) => {
  try {

    var deletePrice = await priceControlledModel.findByIdAndDelete({
      _id: body.priceControlledId
    }).lean()

    if (!deletePrice) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }
    return {
      status: 0,
      message: 'Price deleted successfully.',
      data: deletePrice
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.editpricecontrolled = async (body) => {
  try {
    var editPrice = await priceControlledModel.findOneAndUpdate(
      { _id: body.priceControlledId },
      { $set: { duration: body.duration, price: body.price } },
      { new: true }
    )
      .lean();

    if (!editPrice) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Price edited successfully.',
      data: editPrice
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.getallpricecontrolled = async (body) => {
  try {
    var getAllPrice = await priceControlledModel.find({}).sort({ _id: -1 }).lean();

    if (!getAllPrice) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Price fetched successfully.',
      data: getAllPrice
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.createbanner = async (body) => {
  try {
    var dataToSave = {
      title: body.title,
      bannerImage: body.bannerImage,
      description: body.description,
      orderType: body.orderType,
      discount: body.discount
    }

    var bannerStatus = await bannerModel.create(dataToSave)
    bannerStatus.save();

    if (!bannerStatus) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Banner added successfully.',
      data: bannerStatus
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.getallbanner = async () => {
  try {
    var getAll = await bannerModel.find().sort({ _id: -1 });

    if (!getAll) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Banner fetched successfully',
      data: getAll
    }
  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.deletebanner = async (body) => {
  try {
    var deleteBanner = await bannerModel.findByIdAndDelete({
      _id: body.bannerId
    }).lean()


    if (!deleteBanner) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Banner deleted successfully',
      data: deleteBanner
    }
  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.blockunblockbanner = async (body) => {
  try {

    var statusx = await bannerModel.findOne({
      _id: body.bannerId
    }).lean()

    if (!statusx) {
      return {
        status: -1,
        message: 'Something went wrong.'
      }
    }

    if (statusx.is_block === true) {
      var unblockOffer = await bannerModel.findByIdAndUpdate(
        { _id: body.bannerId },
        { is_block: false },
        { new: true }
      );
      return {
        status: 0,
        message: 'Offer unblock successfully',
        data: unblockOffer
      }
    } else {
      var blockOffer = await bannerModel.findByIdAndUpdate(
        { _id: body.bannerId },
        { is_block: true },
        { new: true }
      );
      return {
        status: 0,
        message: 'Offer block successfully.',
        data: blockOffer
      }
    }


  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.editbanner = async (body) => {
  try {
    var dataToSave = {
      title: body.title,
      bannerImage: body.bannerImage,
      description: body.description,
      orderType: body.orderType,
      discount: body.discount
    }

    if (!body.bannerImage) {
      delete dataToSave.bannerImage
    }

    var editBanner = await bannerModel.findOneAndUpdate(
      { _id: body.bannerId },
      { $set: dataToSave },
      { new: true }
    )
      .lean();


    if (!editBanner) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Banner edited successfully',
      data: editBanner
    }
  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.getsinglebanner = async (body) => {
  try {
    var getBanner = await bannerModel.findOne({
      _id: body.bannerId
    }).lean();

    if (!getBanner) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Banner fetched successfully',
      data: getBanner
    }
  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.getpromotional = async () => {
  try {
    var getProm = await promotionalModel.find()
      .sort({ _id: -1 })
      .lean()

    if (!getProm) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Promotional fetched successfully.',
      data: getProm
    }
  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}


exports.acceptrejectpromotional = async (body) => {
  try {
    var findPromo = await promotionalModel.findOne({
      _id: body.promoId
    }).lean()

    if (findPromo.status == 1) {
      var unblockOffer = await promotionalModel.findByIdAndUpdate(
        { _id: body.promoId },
        { status: 2 },
        { new: true }
      );
      return {
        status: 0,
        message: 'Offer Reject successfully',
        data: unblockOffer
      }
    } else {
      var blockOffer = await promotionalModel.findByIdAndUpdate(
        { _id: body.promoId },
        { status: 1 },
        { new: true }
      );
      return {
        status: 0,
        message: 'Offer Approve successfully.',
        data: blockOffer
      }
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
};


exports.genrateReason = async (data) => {
  try {

    let reason = await tailorCancelResonModel.create(data);
    reason.save();
    if (!reason) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Reason created Successfully.", data: reason };
  } catch (error) {
    throw new Error(error.message);
  }
};
//// order managment
exports.orderManagement = async (data) => {
  try {
    // let pendingOrderdata = await orderListModel.aggregate(query)
    let pendingOrderdata = await orderListModel.aggregate([
      { $match: { status: { $in: [0, 1] } } },
      { $sort : { created_at : -1 } },

      {
        $lookup: {
          from: "tailorProfile",
          localField: "tailorId",
          foreignField: "tailorId",
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
          from: "product",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "user",
          localField: "created_by",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "order",
          localField: "_id",
          foreignField: "orderList",
          as: "order"
        }
      },
      {
        $unwind: {
          path: "$order",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "productBrand",
          localField: "brandId",
          foreignField: "_id",
          as: "brand"
        }
      },
      {
        $unwind: {
          path: "$brand",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "productColor",
          localField: "color",
          foreignField: "_id",
          as: "color"
        }
      },
      {
        $unwind: {
          path: "$color",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: "$color.sizes"
      },
      { "$addFields": { "size": { $toObjectId: "$size" } } },
      { $match: { $expr: { $eq: ["$color.sizes._id", "$size"] } } },
      {
        $lookup: {
          from: "address",
          localField: "order.addressId",
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
          'userMobile': '$user.mobile',
          'orderId': "$orderId",
          'tailorImage': "$tailor.image",
          'created_at': '$created_at',
          'modified_at': '$modified_at',
          'color': '$color',
          'address': '$address',
          'product_name': '$product.name',
          'product_image': '$product.image',
          'brand': '$brand.name',
          'rating': '$rating',
          'is_rating': {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          'tailor': '$tailor.storeDetails',
          'tailorId': '$tailor.tailorId',
          'tailorProfile': '$tailor.businessLocation',
          'deliveryDate': '$delivery_on',
          'vat': { $toInt: '0' },
          'delivery': { $toInt: '0' },
          'promoCode': { $toInt: '0' },
          'redeem_point': { $toInt: '0' },
          'image': '$color.image',
          'size': '$size',
          'unit_price': '$unit_price',
          'refer': '$refer',
          'price': { $subtract: ['$price', '$refer'] },
          'status': '$status',
          'reason': '$reason',
          "contactNo": '$tailor.mobile',
          'quantity': '$quantity',
          "payment_mode": "$order.payment_mode"
        }
      },
      {
        $project: {
          _id: 1,
          'username': '$username',
          'userImage': '$userImage',
          'userMobile': '$userMobile',
          'orderId': "$orderId",
          'tailorImage': "$tailorImage",
          'created_at': '$created_at',
          'modified_at': '$modified_at',
          'orderid': '$orderId',
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
            $multiply:
              ["$unit_price", "$quantity"]
          },
          'price': "$price",
          'vat': '$vat',
          'delivery': '$delivery',
          'promoCode': '$promoCode',
          'redeem_point': '$refer',
          'reason': '$reason',
          'total': {
            $add: ["$vat", "$delivery", "$refer", "$promoCode", "$price"
            ]
          },
          'status': '$status',
          "contactNo": '$contactNo',
          'quantity': '$quantity',
          "payment_mode": "$payment_mode"
        }
      }

    ]);
    //.populate('productId').populate({path: "created_by", populate : [{path: "addresses" }]}).populate({path: "_id",model: "order"})


    let ongoingOrderdata = await orderListModel.aggregate([
      { $match: { status: { $in: [2, 3] } } },
      { $sort : { created_at : -1 } },

      {
        $lookup: {
          from: "tailorProfile",
          localField: "tailorId",
          foreignField: "tailorId",
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
          from: "product",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "user",
          localField: "created_by",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "order",
          localField: "_id",
          foreignField: "orderList",
          as: "order"
        }
      },
      {
        $unwind: {
          path: "$order",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "productBrand",
          localField: "brandId",
          foreignField: "_id",
          as: "brand"
        }
      },
      {
        $unwind: {
          path: "$brand",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "productColor",
          localField: "color",
          foreignField: "_id",
          as: "color"
        }
      },
      {
        $unwind: {
          path: "$color",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: "$color.sizes"
      },
      { "$addFields": { "size": { $toObjectId: "$size" } } },
      { $match: { $expr: { $eq: ["$color.sizes._id", "$size"] } } },
      {
        $lookup: {
          from: "address",
          localField: "order.addressId",
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
          'userMobile': '$user.mobile',
          'orderId': "$orderId",
          'tailorImage': "$tailor.image",
          'created_at': '$created_at',
          'modified_at': '$modified_at',
          'color': '$color',
          'address': '$address',
          'product_name': '$product.name',
          'product_image': '$product.image',
          'brand': '$brand.name',
          'rating': '$rating',
          'is_rating': {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          'tailor': '$tailor.storeDetails',
          'tailorId': '$tailor.tailorId',
          'tailorProfile': '$tailor.businessLocation',
          'deliveryDate': '$delivery_on',
          'vat': { $toInt: '0' },
          'delivery': { $toInt: '0' },
          'promoCode': { $toInt: '0' },
          'redeem_point': { $toInt: '0' },
          'image': '$color.image',
          'size': '$size',
          'unit_price': '$unit_price',
          'refer': '$refer',
          'price': { $subtract: ['$price', '$refer'] },
          'status': '$status',
          'reason': '$reason',
          "contactNo": '$tailor.mobile',
          'quantity': '$quantity',
          "payment_mode": "$order.payment_mode"
        }
      },
      {
        $project: {
          _id: 1,
          'username': '$username',
          'userImage': '$userImage',
          'userMobile': '$userMobile',
          'orderId': "$orderId",
          'tailorImage': "$tailorImage",

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
            $multiply:
              ["$unit_price", "$quantity"]
          },
          'price': "$price",
          'vat': '$vat',
          'delivery': '$delivery',
          'promoCode': '$promoCode',
          'redeem_point': '$refer',
          'reason': '$reason',
          'total': {
            $add: ["$vat", "$delivery", "$refer", "$promoCode", "$price"
            ]
          },
          'status': '$status',
          "contactNo": '$contactNo',
          'quantity': '$quantity',
          "payment_mode": "$payment_mode"
        }
      }

    ]);

    let cancelOrderdata = await orderListModel.aggregate([
      { $match: { status: { $in: [5] } } },
      { $sort : { created_at : -1 } },

      {
        $lookup: {
          from: "tailorProfile",
          localField: "tailorId",
          foreignField: "tailorId",
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
          from: "product",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "user",
          localField: "created_by",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "order",
          localField: "_id",
          foreignField: "orderList",
          as: "order"
        }
      },
      {
        $unwind: {
          path: "$order",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "productBrand",
          localField: "brandId",
          foreignField: "_id",
          as: "brand"
        }
      },
      {
        $unwind: {
          path: "$brand",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "productColor",
          localField: "color",
          foreignField: "_id",
          as: "color"
        }
      },
      {
        $unwind: {
          path: "$color",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: "$color.sizes"
      },
      { "$addFields": { "size": { $toObjectId: "$size" } } },
      { $match: { $expr: { $eq: ["$color.sizes._id", "$size"] } } },
      {
        $lookup: {
          from: "address",
          localField: "order.addressId",
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
          'userMobile': '$user.mobile',
          'created_at': '$created_at',
          'modified_at': '$modified_at',
          'tailorImage': "$tailor.image",
          'color': '$color',
          'orderId': "$orderId",
          'address': '$address',
          'product_name': '$product.name',
          'product_image': '$product.image',
          'brand': '$brand.name',
          'rating': '$rating',
          'is_rating': {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          'tailor': '$tailor.storeDetails',
          'tailorId': '$tailor.tailorId',
          'tailorProfile': '$tailor.businessLocation',
          'deliveryDate': '$delivery_on',
          'vat': { $toInt: '0' },
          'delivery': { $toInt: '0' },
          'promoCode': { $toInt: '0' },
          'redeem_point': { $toInt: '0' },
          'image': '$color.image',
          'size': '$size',
          'unit_price': '$unit_price',
          'refer': '$refer',
          'price': { $subtract: ['$price', '$refer'] },
          'status': '$status',
          'reason': '$reason',
          "contactNo": '$tailor.mobile',
          'quantity': '$quantity',
          "payment_mode": "$order.payment_mode"
        }
      },
      {
        $project: {
          _id: 1,
          'username': '$username',
          'userImage': '$userImage',
          'userMobile': '$userMobile',
          'orderId': "$orderId",
          'created_at': '$created_at',
          'tailorImage': "$tailorImage",
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
            $multiply:
              ["$unit_price", "$quantity"]
          },
          'price': "$price",
          'vat': '$vat',
          'delivery': '$delivery',
          'promoCode': '$promoCode',
          'redeem_point': '$refer',
          'reason': '$reason',
          'total': {
            $add: ["$vat", "$delivery", "$refer", "$promoCode", "$price"
            ]
          },
          'status': '$status',
          "contactNo": '$contactNo',
          'quantity': '$quantity',
          "payment_mode": "$payment_mode"
        }
      }

    ]);

    let completeOrderdata = await orderListModel.aggregate([
      { $match: { status: { $in: [4] } } },
      { $sort : { created_at : -1 } },

      {
        $lookup: {
          from: "tailorProfile",
          localField: "tailorId",
          foreignField: "tailorId",
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
          from: "product",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "user",
          localField: "created_by",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "order",
          localField: "_id",
          foreignField: "orderList",
          as: "order"
        }
      },
      {
        $unwind: {
          path: "$order",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "productBrand",
          localField: "brandId",
          foreignField: "_id",
          as: "brand"
        }
      },
      {
        $unwind: {
          path: "$brand",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "productColor",
          localField: "color",
          foreignField: "_id",
          as: "color"
        }
      },
      {
        $unwind: {
          path: "$color",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: "$color.sizes"
      },
      { "$addFields": { "size": { $toObjectId: "$size" } } },
      { $match: { $expr: { $eq: ["$color.sizes._id", "$size"] } } },
      {
        $lookup: {
          from: "address",
          localField: "order.addressId",
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
          'userMobile': '$user.mobile',
          'created_at': '$created_at',
          'tailorImage': "$tailor.image",
          'orderId': "$orderId",
          'modified_at': '$modified_at',
          'color': '$color',
          'address': '$address',
          'product_name': '$product.name',
          'product_image': '$product.image',
          'brand': '$brand.name',
          'rating': '$rating',
          'is_rating': {
            $cond: { if: { "$gt": ["$rating", null] }, then: { $toBool: 1 }, else: { $toBool: 0 } }
          },
          'tailor': '$tailor.storeDetails',
          'tailorId': '$tailor.tailorId',
          'tailorProfile': '$tailor.businessLocation',
          'deliveryDate': '$delivery_on',
          'vat': { $toInt: '0' },
          'delivery': { $toInt: '0' },
          'promoCode': { $toInt: '0' },
          'redeem_point': { $toInt: '0' },
          'image': '$color.image',
          'size': '$size',
          'unit_price': '$unit_price',
          'refer': '$refer',
          'price': { $subtract: ['$price', '$refer'] },
          'status': '$status',
          'reason': '$reason',
          "contactNo": '$tailor.mobile',
          'quantity': '$quantity',
          "payment_mode": "$order.payment_mode"
        }
      },
      {
        $project: {
          _id: 1,
          'username': '$username',
          'userImage': '$userImage',
          'userMobile': '$userMobile',
          'orderId': "$orderId",
          'tailorImage': "$tailorImage",

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
            $multiply:
              ["$unit_price", "$quantity"]
          },
          'price': "$price",
          'vat': '$vat',
          'delivery': '$delivery',
          'promoCode': '$promoCode',
          'redeem_point': '$refer',
          'reason': '$reason',
          'total': {
            $add: ["$vat", "$delivery", "$refer", "$promoCode", "$price"
            ]
          },
          'status': '$status',
          "contactNo": '$contactNo',
          'quantity': '$quantity',
          "payment_mode": "$payment_mode"
        }
      }

    ])

    let pendingstrichingData = await stichingCartModel.aggregate([
      { $match: { status: { $in: [2, 3] } } },
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
    ])

    let ongoingstrichingData = await stichingCartModel.aggregate([
      { $match: { status: { $in: [4, 5] } } },
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
    ])
    let cancelstrichingData = await stichingCartModel.aggregate([
      { $match: { status: { $in: [7] } } },
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
    ])
    let completestrichingData = await stichingCartModel.aggregate([
      { $match: { status: { $in: [6] } } },
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
    ]);

    if (!pendingOrderdata) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    // return { status: 1, message: "order and striching data get Successfully.", pendingOrderdata: pendingOrderdata};
    return {
      status: 1, message: "order and striching data get Successfully.", pendingOrderdata: pendingOrderdata, ongoingOrderdata: ongoingOrderdata,
      cancelOrderdata: cancelOrderdata, completeOrderdata: completeOrderdata, pendingstrichingData: pendingstrichingData, ongoingstrichingData: ongoingstrichingData, cancelstrichingData: cancelstrichingData, completestrichingData: completestrichingData
    };
  } catch (error) {
    throw new Error(error.message);
  }

}

exports.UstaadList = async (data) => {
  try {

    let lat = data.Latitude;
    let long = data.Longitude;
    let weekDay = moment(new Date(data.measurementDate)).weekday() + 1;
    let dateOf = data.measurementDate;
    let city;
    let geocoder;
    const options = {
      provider: 'google',
      httpAdapter: 'https',
      apiKey: 'AIzaSyDjRNiBtDmQhXdbOOo1paVmox4XpPMz5pQ',
      formatter: 'json'
    };

    geocoder = NodeGeocoder(options);
    let getFullRecord = await geocoder.reverse({ lat: lat, lon: long });
    if (!getFullRecord) {
      return { status: -1, message: "Issue with this address, Please enter the address again." };
    }

    city = getFullRecord[0].city;

    let query = [{
      $match: {
        "region": {
          $regex: city, $options: "i"

        }
      }
    }, {
      $lookup: {
        from: "timeslot",
        localField: "_id",
        foreignField: "created_by",
        as: "time"
      }
    }, {
      $match: {
        "time": { $gt: [{ $size: "time" }, 0] }
      }
    }, {
      $unwind: {
        path: "$time",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $match: { "time.holidays": { $ne: dateOf }, "time.working_days": { $ne: weekDay } }
    }, {
      $project: {
        _id: "$_id",
        userName: 1,
        profileImage: 1,

      }
    }]

    let ustaadData = await ustaadModel.aggregate(query);
    if (!ustaadData) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Ustaad Fetch Successfully", data: ustaadData };

  } catch (error) {
    throw new Error(error.message);
  }
}

exports.AssignUstaad = async (data) => {
  try {
    if (!data.stichingId || data.stichingId == null || data.stichingId == undefined) {
      return { status: -1, message: "stichingId is required" }
    }
    if (!data.ustadId || data.ustadId == null || data.ustadId == undefined) {
      return { status: -1, message: "ustadId is required" }
    } let updateSData = await stichingCartModel.findByIdAndUpdate(data.stichingId, { $set: { ustaadId: data.ustadId, ustaad_status: 0 } }, { new: true })

    if (!updateSData) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    let measurment = await measurmentModel.update({ _id: mongoose.Types.ObjectId(data.measurmentId) }, { $set: { ustaadId: data.ustadId } })
    if (!measurment) {
      return { status: -1, message: "Something went wrong, Please try later." };
    }

    return { status: 1, message: "Ustaad Assign successfully.", data: updateSData };
  } catch (error) {
    throw new Error(error.message);
  }
}


exports.productRating = async (data) => {
  try {

    let tailorrating = await ratingModel.find({ tailorId: data.tailorId })
    let data = tailorrating.map(value => {
      console.log(value)
    })
    let avg = tailorrating.ratingpoint;


    if (!tailorrating) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Success.", data: tailorrating };
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.issueList = async (user) => {
  try {

    let query = [{
      $lookup: {
        from: "user",
        localField: "created_by",
        foreignField: "_id",
        as: "user"
      }
    }, {
      "$unwind": "$user"
    },
    {
      $project: {
        _id: 1,
        issue_regarding: "$issue_regarding",
        issue_type: "$issue_type",
        description: "$description",
        images: "$images",
        orderId: "$orderId",
        created_at: "$created_at",
        status: "$status",
        active_status: "$active_status",
        open_status: "$open_status",
        close_status: "$close_status",
        username: "$user.username",
        mobile: "$user.mobile",
        email: "$user.email",
        countryCode: "$user.countryCode",
        profileImage: "$user.profileImage"
      }
    }, { "$sort": { "created_at": -1 } }];

    let issue = await issueModel.aggregate(query);
    if (!issue) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    return { status: 1, message: "Issue fetch successfully", data: issue };
  } catch (err) {
    throw new Error(err.message);
  }
}

exports.changeIssueStatus = async (data) => {
  try {
    let status = parseInt(data.status);
    //let activeData = 

    let issue = await issueModel.findById(mongoose.Types.ObjectId(data._id));
    if (!issue) {
      return { status: -1, message: "Something went wrong, Please try later" };
    }
    if (status == 1) {
      issue.status = 1,
        issue.open_status.status = true,
        issue.open_status.created_on = Date.now()
    } else {
      issue.status = 2,
        issue.close_status.status = true,
        issue.close_status.created_on = Date.now()
    }
    issue.save();
    return { status: 1, message: "Issue fetch successfully", data: issue };
  } catch (err) {
    throw new Error(err.message);
  }
}
exports.AddKunduru = async (data) => {
  try {
    if (data.parameter && typeof (data.parameter) === 'string') {
      data.parameter = JSON.parse(data.parameter);
    }
    let saveData = await kunduraModel.create(data);

    saveData.save();
    if (!saveData) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Model added  Successfully.", data: saveData };
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.getKunduru = async (data) => {
  try {

    let getdata = await kunduraModel.find({ is_deleted: false }).sort({ createdAt: -1 });
    if (!getdata) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Data get  Successfully.", data: getdata };
  } catch (error) {
    throw new Error(error.message);
  }
};


exports.ustaadStatus = async (data, user) => {
  try {

    let ustaadStatus = await stichingCartModel.findOneAndUpdate({ _id: data.stichingId }, {
      $set: {
        ustaad_status: data.ustaad_status

      }
    });
    console.log(ustaadStatus)
    // let ustaaddata = await stichingCartModel.findOne({ustaadId: data.ustaadId,stichingId:data.stichingId})
    if (!ustaadStatus) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Data get  Successfully.", data: ustaadStatus };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getModel = async (data) => {
  try {
    let model = await kunduraModel.findById(mongoose.Types.ObjectId(data.id)).lean();
    if (!model) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }
    return { status: 1, data: model, message: "Model fetch successfully" };
  } catch (err) {
    throw new Error(error.message);
  }
};

exports.editKunduru = async (data) => {
  try {
    if (data.parameter && typeof (data.parameter) === 'string') {
      data.parameter = JSON.parse(data.parameter);
    }
    var edited = await kunduraModel.findOneAndUpdate({ _id: data._id },
      { $set: data }, { new: true }).lean()
    if (!edited) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'kunduru model edited successfully.',
      data: edited
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}

exports.deleteKunduru = async (data) => {
  try {
    var deletekunduru = await kunduraModel.findByIdAndUpdate({
      _id: data.kunduru_id
    }, { $set: { is_deleted: true } }, { new: true }).lean()


    if (!deletekunduru) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }

    return {
      status: 0,
      message: 'Model deleted successfully',
      data: deletekunduru
    }
  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}

exports.enableDisableKunduru = async (data) => {
  try {
    var updateKunduru = await kunduraModel.findByIdAndUpdate(
      data._id,
      { isActive: data.isActive },
      { new: true }
    ).lean()
    if (!updateKunduru) {
      return {
        status: -1,
        message: 'Something went wrong'
      }
    }
    return {
      status: 0,
      message: 'kunduru updated successfully',
      data: updateKunduru
    }

  } catch (error) {
    return {
      status: -1,
      message: error.message
    }
  }
}



exports.recordMeasurment = async (data) => {
  try {
    console.log(data)
    if (data.stichingId == '' || data.stichingId == undefined || data.stichingId == null) {
      return {
        status: -1,
        message: "stichingId is required"
      }
    }
    if (data.ustaadId == '' || data.ustaadId == undefined || data.ustaadId == null) {
      return {
        status: -1,
        message: "ustaadId is required"
      }
    }
    if (data.parameters && typeof (data.parameters) === 'string') {
      data.parameters = JSON.parse(data.parameters);
    }
    let stichData = await stichingCartModel.findById({ _id: data.stichingId })
    data.userId = stichData.userId
    let recordM = new recordMeasurementModel(data);
    let rMeasure = await recordM.save();
    let recordMeasurment1 = await stichingCartModel.findOneAndUpdate({ _id: data.stichingId }, {
      $set: {
        ustaad_status: 3, modified_at: new Date()
      }
    });
    if (!recordMeasurment1) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Measuremeent recorded Successfully.", data: rMeasure };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getfebric = async (data) => {
  try {

    let getfebric = await stichingCartModel.find({ _id: data.stichingId }).populate('fabricTypeId').populate('fabricId')
    if (!getfebric) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Measurment get  Successfully.", data: getfebric };
  } catch (error) {
    throw new Error(error.message);
  }
};
exports.getmodelbyid = async (data) => {
  try {

    let getmodelbyid = await kunduraModel.findById({ _id: data.modelId })
    if (!getmodelbyid) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Measurment get  Successfully.", data: getmodelbyid };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.charges = async (data) => {
  try {
    let type = parseInt(data.type);

    switch (type) {
      case 1: {
        let charge = await chargesModel.create(data);
        charge.save();
        if (!charge) {
          return { status: -1, message: "Something went wrong, Please try later." };
        }
        return { status: 1, message: "Charges Add Successfully.", data: charge };
      }
      case 2: {
        let charge = await chargesModel.findOne({});
        if (!charge) {
          return { status: -1, message: "Something went wrong, Please try later." };
        }
        return { status: 1, message: "Charges Fetch Successfully.", data: charge };
      }
      default: {
        let charge = await chargesModel.updateMany({}, { $set: data });
        if (!charge) {
          return { status: -1, message: "Something went wrong, Please try later." };
        }
        return { status: 1, message: "Charges Update Successfully.", data: charge };
      }
    }

  } catch (error) {
    throw new Error(error.message);
  }
}

exports.addtemplate = async (data) => {
  try {
    let title = data.title;
    let template = data.template;
    fs.writeFileSync(path.join(__dirname, '../', '/template/' + title + '.html'), template);
    console.log("2", template);
    return { status: 1, message: "Template Added Successfully." };
  } catch (error) {
    throw new Error(error.message);
  }
}

exports.getFabricSamples = async (data) => {
  try {

    let ids = data.ids.map(data => mongoose.Types.ObjectId(data));

    let samples = await fabricModel.aggregate([
      {
        $match:
          { "_id": { $in: ids } }
      },
      {
        $lookup: {
          from: "fabricType",
          localField: "fabricTypeId",
          foreignField: "_id",
          as: "fabric"
        }
      }, {
        $unwind: {
          path: "$fabric",
          preserveNullAndEmptyArrays: true
        }
      }, {
        $project: {
          _id: 1,
          fabricName: "$fabric.name",
          description: "$fabric.description",
          image: "$fabric.image"
        }
      }
    ]);

    if (!samples) {
      return { status: -1, message: "Something went wrong, Please try later." };
    }
    return { status: 1, message: "Fabrics Fetch Successfully", data: samples };

  } catch (err) {
    throw new Error(err.message);
  }
}

exports.updateSubAdmin = async (data) => {
  try {

    let Id = data.id;
    delete data.id;
    let subAdmin = await ustaadModel.updateOne({ _id: mongoose.Types.ObjectId(Id) }, { $set: data });
    if (!subAdmin) {
      return { status: -1, message: "Something went wrong, Please try later." };
    }
    return { status: 1, message: "Ustaad Updated Successfully", data: subAdmin };

  } catch (err) {
    throw new Error(err.message);
  }
}

exports.getrating = async (data) => {
  try {

    // let getrating = await ratingModel.find({ productId : { '$exists' : true }}).populate('userId').populate('tailorId').populate('productId')
    // let getrating2 = await ratingModel.find({ stichingId : { '$exists' : true }}).populate('userId').populate('tailorId').populate('stichingId')

    let getrating = await ratingModel.find({ }).populate('userId').populate('tailorId').populate('orderId').populate('stichingId')
    if (!getrating) {
      return { status: -1, message: "Not able to update right now,please try later" }
    }
    return { status: 1, message: "Measurment get  Successfully.", data: getrating };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.getRewardsUsers = async () => {
  try {
    let query = [{
        $lookup: {
            from:"reward",
            let:{"id":"$_id"},
            pipeline:[
                {
                    $match:{
                        $expr:{
                            $and:[
                                {$eq:["$$id","$userId"]},
                                {$eq:["$refer_by",1]}
                                ]   
                        }
                    }
                }
                ],
            as:"referUsers"
        }
    },{$match:{
        "referUsers":{$gt:[{$size:"referUsers"},0]}
        }
    },{
        $unwind:{
            path:"$referUsers",
            preserveNullAndEmptyArrays:true
        }
    },{
        $lookup:{
            from:"user",
            localField:"referUsers.createdBy",
            foreignField:"_id",
            as:"referUsers.createdBy"
        }
    },{
        $unwind:{
            path:"$referUsers.createdBy",
            preserveNullAndEmptyArrays:true
        }
    },{
        $group:{
            _id:"$_id",
            email:{$first:"$email"},
            address:{$first:"$addresses"},
            profileImage:{$first:"$profileImage"},
            username:{$first:"$username"},
            mobile:{$first:"$mobile"},
            countryCode:{$first:"$countryCode"},
            referUsers:{$push:"$referUsers"},
            created_at:{$first:"$created_at"},
            // referralId:{$first:"$referralId"},

        }
    },{
        $lookup:{
            from:"address",
            localField:"address",
            foreignField:"_id",
            as:"address"
        }
    }]

    let users = await UserModel.aggregate(query);
    if(!users){
      return { status: -1, message: "Something Went Wrong, Please try later" };
    }
    return { status: 1, message: "Users Fetch SuccessFully",data: users };

  } catch (error) {
    throw new Error(error.message);
  }
}

exports.getPayments = async(data)=>{
  /*
    type 1 for user
    type 2 for tailor
    type 3 for ustaad
    type 4 for commission
  */
  try{
    let type = parseInt(data.type);
    let query = [];

    if(type == 1){
      query = [
        {
            $lookup:{
                from:"orderList",
                let: {"order":"$orderList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$order"]},{$eq:["$status",4]}]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:{$add:["$transaction_charge","$delivery_charge","$price"]}
                    }
                }],
                as:"order"
            }  
        },{
            $unwind:{
                path:"$order",
                preserveNullAndEmptyArrays:true
            }
        },{
            $lookup:{
                from:"stichingCart",
                let: {"stiching":"$stichingList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$stiching"]},{$eq:["$status",6]}]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:{$add:["$transaction_charge","$delivery_charge","$service_charge","$fabricPrice","$stitchingPrice"]}
                    }
                }],
                as:"stiching"
            }
        },{
            $unwind:{
                path:"$stiching",
                preserveNullAndEmptyArrays:true
            }
        },{$project:{
            _id:1,
            transactionId:1,
            payment_mode:1,
            created_at:1,
            stiching:1,
            order:1,
            userId:1
            }
        },{$group:{
            _id:"$userId"
            }
        },{
            $lookup:{
                from:"user",
                localField:"_id",
                foreignField:"_id",
                as:"user"
            }
        },{
            $unwind:"$user"
        },{
            $lookup:{
                from:"address",
                localField:"user.addresses",
                foreignField:"_id",
                as:"user.addresses"
            }
        }
      ]
    }else if(type ==2){
      query = [
        {
            $lookup:{
                from:"orderList",
                let: {"order":"$orderList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$order"]},{$eq:["$status",4]}]
                        }
                    }
                },{
                    $project:{
                       tailorId:1
                    }
                }],
                as:"order"
            }  
        },{
            $unwind:{
                path:"$order",
                preserveNullAndEmptyArrays:true
            }
        },{
            $lookup:{
                from:"stichingCart",
                let: {"stiching":"$stichingList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$stiching"]},{$eq:["$status",6]}]
                        }
                    }
                },{
                    $project:{
                        tailorId:1
                    }
                }],
                as:"stiching"
            }
        },{
            $unwind:{
                path:"$stiching",
                preserveNullAndEmptyArrays:true
            }
        },{
            $project:{
            _id:1,
            transactionId:1,
            payment_mode:1,
            created_at:1,
            tailorId: ["$stiching.tailorId","$order.tailorId"],
            userId:1
            }
        },{
            $unwind:{
                path: "$tailorId",
                preserveNullAndEmptyArrays:true
            }
        },{
            $group:{
            _id:"$tailorId"
           }
        },{
          $lookup: {
            from: 'tailor',
            localField: '_id',
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
            localField: '_id',
            foreignField: 'tailorId',
            as: 'tailorProfile'
          }
        }, {
          $unwind: {
            path: '$tailorProfile',
            preserveNullAndEmptyArrays: true
          }
        },{$match:{
            "tailor":{$exists: true}
          }
        },{
            $project:{
                _id:"$tailor._id",
                shopName:"$tailor.name",
                email:"$tailor.email",
                mobile: "$tailor.mobile",
                username: "$tailor.username",
                image:"$tailorProfile.storeDetails.business_logo_image",
                location: "$tailorProfile.businessLocation"
            }
        }
      ];
    }

    let order = await orderModel.aggregate(query);
    if(!order){
      throw new Error("Something went wrong, Please try later");
    }
    return { status: 1, message: "Payment Fetch Successfully",data: order };

  }catch(err){
    throw new Error(err.message);
  }
};

exports.getUserPayments = async(data)=>{
  /*
    type 1 for order
    type 2 for stitching
  */
  try{
    let type = parseInt(data.type);
    let user = mongoose.Types.ObjectId(data.userId);
    let query =[];
    if(type == 1){

      query = [
        {$match:{ userId:user }},
        {
            $lookup:{
                from:"orderList",
                let: {"order":"$orderList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$order"]},{$eq:["$status",4]}]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:{$add:["$transaction_charge","$delivery_charge","$price"]}
                    }
                }],
                as:"order"
            }  
        },{
            $unwind:{
                path:"$order",
                preserveNullAndEmptyArrays:true
            }
        },{
          $match:{
              "order":{$exists:true}
          }
        },
        {$project:{
            _id:1,
            transactionId:1,
            payment_mode:1,
            created_at:1,
            order:1,
            price:"$order.total",
            userId:1
            }
        },{
          $sort:{created_at:-1}
        },{
          $group:{
              _id: null,
              orders: {$push:'$$ROOT'},
              total:{$sum:"$price"}
          }
        }
      ]

      // let order = await orderListModel.aggregate(query);
      // if(!order){
      //   throw new Error("Something went wrong, Please try later");
      // }
      // return { status: 1, message: "Payment Fetch Successfully",data: order };

    }else {

      query = [
        {$match:{ userId:user }},
        {
            $lookup:{
                from:"stichingCart",
                let: {"stiching":"$stichingList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$stiching"]},{$eq:["$status",6]}]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        total:{$add:["$transaction_charge","$delivery_charge","$service_charge","$fabricPrice","$stitchingPrice"]}
                    }
                }],
                as:"stiching"
            }
        },{
            $unwind:{
                path:"$stiching",
                preserveNullAndEmptyArrays:true
            }
        },{
          $match:{
              "stiching":{$exists:true}
          }
        },
        {$project:{
            _id:1,
            transactionId:1,
            payment_mode:1,
            created_at:1,
            stiching:1,
            price:"$stiching.total",
            userId:1
            }
        },{
          $sort:{created_at:-1}
        },{
          $group:{
              _id: null,
              orders: {$push:'$$ROOT'},
              total:{$sum:"$price"}
          }
        }
      ]

      // let order = await stichingCartModel.aggregate(query);
      // if(!order){
      //   throw new Error("Something went wrong, Please try later");
      // }
      // return { status: 1, message: "Payment Fetch Successfully",data: order };

    }
    let order = await orderModel.aggregate(query);
    if(!order){
      throw new Error("Something went wrong, Please try later");
    }

    if(order.length == 0){
      return { status: 1, message: "Payment Fetch Successfully",data: {
        _id: null,
        orders: [],
        total: 0   
      } };
    }
    return { status: 1, message: "Payment Fetch Successfully",data: order };

  }catch(err){
    throw new Error(err.message);
  }
};

exports.setPaymentSchedule = async(data)=>{
  try{
    let paymentSchedule = await paymentScheduleModel.findOne().lean();
    if(!paymentSchedule){
      let payment = await paymentScheduleModel.create(data);
      return { status: 1,message:"Payment Updated Successfully",data: payment };
    }else{
      let payment = await paymentScheduleModel.updateOne({_id:paymentSchedule._id},data);
      return { status: 1,message:"Payment added Successfully",data: payment };
    }
  }catch(err){
    throw new Error(err.message);
  }
}

exports.setCommision = async(data)=>{
  try{
    let commission = await commissionModel.findOne({city:data.city}).lean();
    if(commission){
      let saveCommission = await commissionModel.updateOne({_id:commission._id},data);
      return { status: 1,message:"Commission Updated Successfully",data: saveCommission };
    }
    let addCommission = await commissionModel.create(data);
    if(!addCommission){
      return { status:-1, message:"Something went wrong,Please try later" };
    }
    return { status: 1, message: "Commission Added Successfully", data: addCommission };
  }catch(err){
    throw new Error(err.message);
  }
}

exports.getCities = async(data)=>{
  try{
    let cities = await cityModel.find({is_deleted:false}).select("cityName");
    if(!cities){
      return { status:-1, message: "Something went wrong, Please try later."};
    }
    return { status: 1, message: "Cities Fetch Successfully.",data: cities };
  }catch(err){
    throw new Error(err.message);
  }
}

exports.getCommission = async(data)=>{
  try{
    let commission = await commissionModel.findOne({city:mongoose.Types.ObjectId(data.city)}).lean();
    if(!commission){
      return { status: 1, message: "Commission not exist.", data: commission };
    }
    return { status: 1, message: "Commission Added Successfully", data: commission };
  }catch(err){
    throw new Error(err.message);
  }
};

exports.getAllCommission = async() => {
  try{
    let query = [
      {
          $lookup:{
           from:"cities",
           localField:"city",
           foreignField:"_id",
           as:"city"
          }
      },{
          $unwind:"$city"
      },{
          $match:{"city.is_deleted":false}
      },{
          $project:{
              _id:1,
              commission:1,
              cityName:"$city.cityName",
              cityId: "$city._id"
          }
      }
    ]
    let commission = await commissionModel.aggregate(query);
    if(!commission){
      return { status: 1, message: "Commission not exist.", data: commission };
    }
    return { status: 1, message: "Commission Added Successfully", data: commission };
  }catch(err){
    throw new Error(err.message);
  }
};

exports.getTailorPayments = async(data)=>{
  /*
    type 1 for order
    type 2 for stitching
  */
    try{
      let type = parseInt(data.type);
      let commission = 0;
      let tailorId = mongoose.Types.ObjectId(data.tailorId);
      let query =[];
      let getComission = await paymentScheduleModel.findOne({}).lean();
      if(!getComission){
        return { status: 1, message: "No Schedule Added", data: [] };
      }

      /*Start First define the date in miliseconds to konw the last schedule date */

      

      /* End Here */

      /* Start for get the tailor location */

      let tailor = await tailorProfileModel.findOne({tailorId:tailorId}).populate('businessLocation');
      if(!tailor){
        return { status: -1, message: "Something went wrong, Please try later." };
      }

      let city = await cityModel.aggregate([
        {
            $match:{
                "cityName":{$regex:new RegExp("^" + tailor.businessLocation.city, "i")},is_deleted:false
            }
        },{
            $lookup: {
                from:"commission",
                localField:"_id",
                foreignField:"city",
                as:"commission"
            }
        },{
            $unwind: "$commission"
        },{
            $project:{
                "commission":"$commission.commission"
            }
        }
        ]); 

        if(city.length == 0){
          commission = 0;
        }else{
          commission = city[0].commission;
        }

      /* End Here */
      if(type == 1){
  
        query = [
          {
              $lookup:{
                  from:"orderList",
                  let: {"order":"$orderList"},
                  pipeline:[{
                      $match: {
                          $expr:{
                                 $and:[{ $in:["$_id","$$order"]},{$eq:["$status",4]},{$eq:["$tailorId",tailorId]}]
                          }
                      }
                  },{
                    $match:{
                      "commission":{$exists:false}
                    }
                  }],
                  as:"order"
              }  
          },{
              $unwind:{
                  path:"$order",
                  preserveNullAndEmptyArrays:true
              }
          },{$match:
              {"order":{"$exists":true}}
          },{
              $project:{
              _id:1,
              transactionId:1,
              payment_mode:1,
              totalAmount: "$order.price",
              commission: {$cond:{if:{ $eq:[commission,0] },then:0,else:{$multiply:[{$divide: ["$order.price",100]},commission]}}},
              amountToPaid: {$cond:{if:{ $eq:[commission,0] },then:0,else:{$subtract: ["$order.price",{$multiply:[{$divide: ["$order.price",100]},commission]}]}}},
              created_at:1,
              order:1
              }
          }
        ]
  
      }else {
  
        query = [
          {
              $lookup:{
                  from:"stichingCart",
                  let: {"stiching":"$stichingList"},
                  pipeline:[{
                      $match: {
                          $expr:{
                                 $and:[{ $in:["$_id","$$stiching"]},{$eq:["$status",6]},{$eq:["$tailorId",tailorId]}]
                          }
                      }
                  },{
                    $match:{
                      "commission":{$exists:false}
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
          },{
              $unwind:{
                  path:"$stiching",
                  preserveNullAndEmptyArrays:true
              }
          },{$match:
              {"stiching":{"$exists":true}}
          },{
              $project:{
              _id:1,
              transactionId:1,
              payment_mode:1,
              totalAmount: "$stiching.total",
              commission: {$cond:{if:{ $eq:[commission,1] },then:0,else:{$multiply:[{$divide: ["$stiching.total",100]},commission]}}},
              amountToPaid: {$cond:{if:{ $eq:[commission,1] },then:0,else:{$subtract: ["$stiching.total",{$multiply:[{$divide: ["$stiching.total",100]},commission]}]}}},
              created_at:1,
              stiching:1
              }
          }
        ]
  
      }
      let order = await orderModel.aggregate(query);
      if(!order){
        throw new Error("Something went wrong, Please try later");
      }
  
      if(order.length == 0){
        return { status: 1, message: "Payment Fetch Successfully",data: {
          _id: null,
          orders: [],
          total: 0   
        } };
      }

      return { status: 1, message: "Payment Fetch Successfully",data: order };
  
    }catch(err){
      throw new Error(err.message);
    }
};

exports.payAmountToTailor = async (data)=>{
  try{
    let id = mongoose.Types.ObjectId(data.order_id);
    let type = parseInt(data.type);
    let commission = parseFloat(data.commission).toFixed(2);

    if(type == 1){

      let order = await orderListModel.updateOne({_id:id},{commission:commission,pay_date:Date.now()});
      if(!order){
        throw new Error("Something went wrong, Please try later");
      }
      return { status:1, message: "Order Updated Successfully",data: order};
    }else{
      let order = await stichingCartModel.updateOne({_id:id},{commission:commission,pay_date:Date.now()});
      if(!order){
        throw new Error("Something went wrong, Please try later");
      }
      return { status:1, message: "Order Updated Successfully",data: order};
    }

  }catch(err){
    throw new Error(err.message);
  }
};

exports.getCompletePayments = async(data)=>{
  try{
    let type = parseInt(data.type);
    let tailorId = mongoose.Types.ObjectId(data.tailorId);
    if(type == 1){
  
      query = [
        {
            $lookup:{
                from:"orderList",
                let: {"order":"$orderList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$order"]},{$eq:["$status",4]},{$eq:["$tailorId",tailorId]},{$ifNull: ['$commission', false]}]
                        }
                    }
                }],
                as:"order"
            }  
        },{
            $unwind:{
                path:"$order",
                preserveNullAndEmptyArrays:true
            }
        },{$match:
            {"order":{"$exists":true}}
        },{
            $project:{
            _id:1,
            transactionId:1,
            payment_mode:1,
            totalAmount: "$order.price",
            commission: "$order.commission",
            created_at:1,
            order:1
            }
        }
      ]

    }else {

      query = [
        {
            $lookup:{
                from:"stichingCart",
                let: {"stiching":"$stichingList"},
                pipeline:[{
                    $match: {
                        $expr:{
                               $and:[{ $in:["$_id","$$stiching"]},{$eq:["$status",6]},{$eq:["$tailorId",tailorId]},{$ifNull: ['$commission', false]}]
                        }
                    }
                },{
                    $project:{
                        _id:1,
                        orderId:1,
                        commission: 1,
                        total:{$add:["$fabricPrice","$stitchingPrice"]}
                    }
                }],
                as:"stiching"
            }
        },{
            $unwind:{
                path:"$stiching",
                preserveNullAndEmptyArrays:true
            }
        },{$match:
            {"stiching":{"$exists":true}}
        },{
            $project:{
            _id:1,
            transactionId:1,
            payment_mode:1,
            totalAmount: "$stiching.total",
            commission: "$stiching.commission",
            created_at:1,
            stiching:1
            }
        }
      ]

    }
    let order = await orderModel.aggregate(query);
    if(!order){
      throw new Error("Something went wrong, Please try later");
    }

    return { status: 1, message: "Payment Fetch Successfully",data: order };
  }catch(err){
    throw new Error(err.message);
  }
};

exports.getUstaadList = async()=>{
  try{

    let query = [
      {
        $match:{"ustaadId":{$exists: true}}
      },{
        $group:{
          _id:"$ustaadId"
        }
      },{
        $lookup: {
          from:"ustaad",
          localField:"_id",
          foreignField:"_id",
          as:"ustaad"
        }
      },
      {
        $unwind: {
          path: "$ustaad",
          preserveNullAndEmptyArrays:true
        }
      },{
          $lookup:{
              from:"countries",
              localField:"ustaad.country",
              foreignField:"_id",
              as:"country"
          }
      },{
          $unwind:{
              path:"$country",
              preserveNullAndEmptyArrays:true
          }
      },{
          $project:{
              "_id":"$ustaad._id",
              "userName":"$ustaad.userName",
              "region":"$ustaad.region",
              "profileImage":"$ustaad.profileImage",
              "mobile":"ustaad.mobile",
              "country":"$country.countryName",
          }
      }
    ];

    let ustaad = await stichingCartModel.aggregate(query);
    if(!ustaad){
      throw new Error("Something went wrong, Please try later");
    }
    return { status: 1,message: "Ustaad Fetch Successfully",data: ustaad };
  }catch(err){
    throw new Error(err.message);
  }
};

exports.getremainingUstaadPrice = async (data)=>{
  try{

    let id = mongoose.Types.ObjectId(data._id);
    let type = parseInt(data.type);
    let query = [];

    if(type == 1){
      query.push({
        $match:{"ustaadId":id,"paid":false}
      });
    }else{
      query.push({
        $match:{"ustaadId":id,"paid":true}
      });

    }

    query.push({
      $project:{
            "orderId":1,
            "skuId":1,
            "created_at": 1,
            "modified_at": 1,
            "service_charge":1
      }
    });

    let ustaad = await stichingCartModel.aggregate(query);
    if(!ustaad){
      throw new Error("Something went wrong, Please try later");
    }
    return { status: 1,message: "Payment Fetch Successfully",data: ustaad };
  }catch(err){
    throw new Error(err.message);
  }
};

exports.priceUstaad = async (data) => {
  try{
    let id = mongoose.Types.ObjectId(data._id);
    let price = await stichingCartModel.updateOne({_id:id},{paid: true});
    if(!price){
      throw new Error("Something went wrong, Please try later");
    }
    return { status: 1, message: "Price paid to Ustaad Successfully."};
  }catch(err){
    throw new Error(err.message);
  }
};

exports.getAdminCommissionList = async (data) => {
  try{
    let type = parseInt(data.type);
    let order; 
    if(type == 1){
      order = await orderListModel.aggregate([{
        $match: {
        "commission":{$exists: true}
        }},{
          $group:{
            _id: null,
            orders: {$push : "$$ROOT"},
            total: {$sum: "$commission"}
          }
        }
      ]);

    }else{
      order = await stichingCartModel.aggregate([{
        $match: {
        "commission":{$exists: true}
        }},{
          $group: {
            _id: null,
            order: {$push: "$$ROOT"},
            total: {$sum: "$commission"}
          }
        }
      ]);
    }

    if(!order){
      throw new Error("Something went wrong, Please try later");
    }

    return { status: 1, message: "Order Fetch Successfully", data: order };

  }catch(err){
    throw new Error(err.message);
  }
};

exports.getRevenueList = async(data)=>{
try{
    let type = parseInt(data.type);
    let order ;
    if(type == 1){
      let query = [
        {
          $match: {
           "commission":{$exists: true}
           }
       },{
           $lookup:{
               from:"tailorProfile",
               localField:"tailorId",
               foreignField:"tailorId",
               as:"tailor"
           }
       },{
           $unwind: "$tailor"
       },{
           $project:{
               orderId: 1,
               created_at: 1,
               total_order_amount: "$price",
               amount_earned_by_tailor:{$subtract:["$price","$commission"]},
               amount_earned_by_admin:"$commission",
               tailor: "$tailor.storeDetails.display_name"
           }
       },{
           $group:{
               _id:null,
               order: {$push: "$$ROOT"},
               total: {$sum: "$amount_earned_by_admin"}
           }
       }
      ]

      order = await orderListModel.aggregate(query);

    }else{
      let query = [
        {
          $match: {
           "commission":{$exists: true}
           }
        },{
            $lookup:{
                from:"tailorProfile",
                localField:"tailorId",
                foreignField:"tailorId",
                as:"tailor"
            }
        },{
            $unwind: "$tailor"
        },{
            $project:{
                orderId: 1,
                created_at: 1,
                total_order_amount: {$add:["$fabricPrice","$stitchingPrice"]},
                amount_earned_by_tailor:{$subtract:[{$add:["$fabricPrice","$stitchingPrice"]},"$commission"]},
                amount_earned_by_admin:"$commission",
                tailor: "$tailor.storeDetails.display_name"
            }
        },{
            $group:{
                _id:null,
                order: {$push: "$$ROOT"},
                total: {$sum: "$amount_earned_by_admin"}
            }
        }
      ]

      order = await stichingCartModel.aggregate(query);

    }

    if(!order){
      throw new Error("Something went wrong, Please try later");
    }
    return { status: 1, message: "Revenue Details", data: order };

  }catch(err){
    throw new Error(err.message);
  }
}