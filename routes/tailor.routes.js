const tailorController = require('../controller/tailor.controller');
const adminController = require('../controller/admin.controller');
const userController = require('../controller/user.controller');
const express = require("express");
const route = express.Router();

const authentication = require("../middlewares/authentication");
const s3bucket = require("../modules/aws-s3");
const router = require('./admin.routes');

route.post("/registerUser", tailorController.registerUser);
route.post("/verifyOtp", authentication.verifyToken, tailorController.verifyOtp);
route.post("/sendResendOtp", authentication.verifyToken, tailorController.sendResendOtp);
route.post("/forgotPassword", tailorController.forgotPassword);
route.post("/loginUser", tailorController.loginUser);
route.post("/loginWithSocialAccount", tailorController.loginWithSocialAccount);
route.post("/resetPassIfForget", authentication.verifyToken, tailorController.resetPassIfForget);

route.post("/changePassword", authentication.verifyToken, tailorController.changePassword);

route.post('/updatedFabric', authentication.verifyToken, tailorController.inventory);
//route.post('/updateProductColor',authentication.verifyToken, tailorController.updateProductColor)
// route.post('/getPickUpLocation', getPickUpLocation);
// route.post('/getDropLocation',  getDropLocation);

route.get("/getCountries", userController.sendCountries);
route.post("/getCities", userController.sendCities);


route.post(
  "/uploadProfile",
  authentication.verifyToken,
  s3bucket.uploadTaylorFiles,
  tailorController.uploadProfile
);
route.post("/saveAddress", authentication.verifyToken, tailorController.saveUserAddress);

/* save Profile routes */
route.post("/saveBusinessType", authentication.verifyToken, tailorController.saveBusinessType);
route.post("/saveAboutYourself", authentication.verifyToken, s3bucket.uploadTaylorFiles, tailorController.saveAboutYourself)
route.post("/saveBusinessLocation", authentication.verifyToken, tailorController.saveBusinessLocation)
route.post("/saveStoreDetails", authentication.verifyToken, s3bucket.uploadTaylorFiles, tailorController.saveStoreDetails)
route.post("/saveBankDetails", authentication.verifyToken, tailorController.saveBankDetails)
route.post("/saveBusinessDetails", authentication.verifyToken, s3bucket.uploadTaylorFiles, tailorController.saveBusinessDetails)

/*M4 api's collection add products */
route.post("/getAllCategories", authentication.verifyToken, adminController.getAllActiveCategory);
route.post("/getSubCategories", authentication.verifyToken, tailorController.getSubCategories);
route.post("/getProductTypes", authentication.verifyToken, tailorController.getProductTypes);
route.post("/fetchBrands", authentication.verifyToken, tailorController.fetchBrands);
route.post("/fetchOlderBrands", authentication.verifyToken, tailorController.fetchOlderBrands);
route.post("/addBrand", authentication.verifyToken, tailorController.addBrand);
route.post("/getImageLink", s3bucket.uploadTaylorFiles, tailorController.getImageLink);
route.post("/addProduct", authentication.verifyToken, tailorController.addProduct);


route.post("/getAllFabricTypes", authentication.verifyToken, adminController.getActiveFabricTypes);
route.post("/getFabricbrands", authentication.verifyToken, tailorController.getFabricBrands);
route.post("/addBrandVariation", authentication.verifyToken, tailorController.addBrandVariation);

route.post("/showfabricBrands", authentication.verifyToken, tailorController.showFabricBrands);
route.post("/changeFabricBrandsStatus", authentication.verifyToken, tailorController.changeFabricBrandsStatus);
route.post("/deleteFabricBrand", authentication.verifyToken, tailorController.deleteFabricBrand);
route.post("/editFabricBrand", authentication.verifyToken, tailorController.editFabricBrand);

route.post("/changeFabricStatus", authentication.verifyToken, tailorController.changeFabricStatus);
route.post("/deleteFabric", authentication.verifyToken, tailorController.deleteFabric);
route.post("/editFabrics", authentication.verifyToken, tailorController.editFabrics);

route.post("/changeColorStatus", authentication.verifyToken, tailorController.changeColorStatus);
route.post("/deleteColor", authentication.verifyToken, tailorController.deleteColor);
route.post("/editColor", authentication.verifyToken, tailorController.updateColor);
route.post("/addColor", authentication.verifyToken, tailorController.addColor);

/*product list */

route.post("/productList", authentication.verifyToken, tailorController.getAllproductList);
route.post("/updateProduct", authentication.verifyToken, tailorController.updateProduct);
route.post("/editProduct", authentication.verifyToken, tailorController.editProduct);
route.post("/deleteProductColor", authentication.verifyToken, tailorController.deleteProductColor);
route.post("/changeProductColorStatus", authentication.verifyToken, tailorController.changeProductColorStatus);
route.post("/updateProductColor", authentication.verifyToken, tailorController.updateProductColor);

//route.post("/entry",tailorController.updateEntry);
route.post("/readyMadeProductInventoryList", authentication.verifyToken, tailorController.readyMadeProductInventoryList);
route.post("/getReadyMadeProductInventoryDetails", authentication.verifyToken, tailorController.getReadyMadeProductInventoryDetails);
//route.post("/updateColorStatus",authentication.verifyToken,tailorController.updateColorStatus);
route.post("/changeSizeStatus", authentication.verifyToken, tailorController.changeSizeStatus);


route.post("/fabricInventoryList", authentication.verifyToken, tailorController.fabricInventoryList);
route.post("/getFabricInventoryDetails", authentication.verifyToken, tailorController.getFabricInventoryDetails);

route.post("/brandList", authentication.verifyToken, tailorController.brandList);
route.post("/deleteBrand", authentication.verifyToken, tailorController.deleteBrand);
route.post("/updateBrand", authentication.verifyToken, tailorController.updateBrand);
route.post("/changeBrandStatus", authentication.verifyToken, adminController.changeBrandStatus);

/*For product List */
route.post("/getProductList", authentication.verifyToken, tailorController.productList);
route.post("/deleteProduct", authentication.verifyToken, tailorController.deleteProduct);
route.post("/updateProductInformation", authentication.verifyToken, tailorController.updateProductInformation);

/*For offers */
route.post('/offers', authentication.verifyToken, tailorController.offers);
route.post('/getCategories', authentication.verifyToken, tailorController.getCategories);
route.post('/getProducts', authentication.verifyToken, tailorController.getProducts);
route.post('/getStiching', authentication.verifyToken, tailorController.getStiching);

/* For promotional banners */

route.post('/promotions', authentication.verifyToken, tailorController.promotions);
route.post('/calculateAmount', authentication.verifyToken, tailorController.getAmount);
route.post('/showPastOrders', authentication.verifyToken, tailorController.showPastOrders);
route.post('/showOrderDetails', authentication.verifyToken, tailorController.showOrderDetails);

//route.post('/');

route.post("/ordersList", authentication.verifyToken, tailorController.getOrders);
route.post("/orderDetails", authentication.verifyToken, tailorController.getOrderDetails);
route.post("/generateInvoice", authentication.verifyToken, tailorController.generateInvoice);

route.post("/updateOrders", authentication.verifyToken, tailorController.updateOrders);
route.post("/updateStichingOrder", authentication.verifyToken, tailorController.updateStichingOrders);
route.post("/fetchReasons", authentication.verifyToken, tailorController.fetchReasons);
route.post("/showOrdersReview", authentication.verifyToken, tailorController.showOrdersReview);

route.post("/profileDetails", authentication.verifyToken, tailorController.profileDetails);
route.post("/updateProfileDetails", authentication.verifyToken, tailorController.updateProfileDetails);

/* For  tailor payment Section */
route.post("/getPaymentDetails", authentication.verifyToken, tailorController.getPaymentDetails);
route.get("/getAnalytics", authentication.verifyToken, tailorController.getAnalytics);
route.post("/getAnalyticsFile", authentication.verifyToken, tailorController.getPDFFile);

/* For template section */
route.post("/getTemplates", authentication.verifyToken, tailorController.getTemplates);

/* For Notification */
route.get("/allowNotification", authentication.verifyToken, tailorController.allowNotification);
route.get("/notifications", authentication.verifyToken, tailorController.allNotifications);
route.get("/checkNotification", authentication.verifyToken, tailorController.checkNotification);

module.exports = route;
