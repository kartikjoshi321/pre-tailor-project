const express = require('express');
const router = express.Router();

const adminController = require('../controller/admin.controller');
const authentication = require('../middlewares/authentication');
const s3bucket = require('../modules/aws-s3');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload/files')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage });

router.post('/login', adminController.loginAdmin);
router.post('/logout', authentication.verifyAdminToken, adminController.logoutAdmin);
router.post('/forgetPassword', adminController.forgetPassword);
router.post('/resetPassword', adminController.resetPassword);
router.post('/changePassword', adminController.changePassword);
//route.post('/editProfile',s3bucket.uploadFiles,adminController.editProfile);
router.post('/adminRegisteration', adminController.createAdminReq);

/* For Category */
router.post('/addCategory', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.addCategory);
router.post('/deleteCategory', authentication.verifyAdminToken, adminController.deleteCategory);
router.post('/updateCategory', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.updateCategory);
router.post('/getAllCategory', authentication.verifyAdminToken, adminController.getAllCategory);
router.post('/changeCategoryStatus', authentication.verifyAdminToken, adminController.changeCategoryStaus);
router.post('/getAllActiveCategories', authentication.verifyAdminToken, adminController.getAllActiveCategory);
router.post('/importCats', authentication.verifyAdminToken, upload.any(), adminController.importCats);

/* For subCategory */
router.post('/addSubCategory', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.addSubCategory);
router.post('/deleteSubCategory', authentication.verifyAdminToken, adminController.deleteSubCategory);
router.post('/updateSubCategory', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.updateSubCategory);
router.post('/changeSubCategoryStatus', authentication.verifyAdminToken, adminController.changeSubCategoryStatus);
router.post('/getAllSubCategory', authentication.verifyAdminToken, adminController.getAllSubCategory);
router.post('/getAllActiveSubCategories', authentication.verifyAdminToken, adminController.getAllActiveSubCategory);
router.post('/getSubCategories', authentication.verifyAdminToken, adminController.getSubCategories);

/* For product Type */
router.post('/addProductType', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.addProductType);
router.post('/deleteProductType', authentication.verifyAdminToken, adminController.deleteProductType);
router.post('/updateProductType', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.updateProductType);
router.post('/changeProductTypeStatus', authentication.verifyAdminToken, adminController.changeProductTypeStatus);
router.post('/getAllProductType', authentication.verifyAdminToken, adminController.getAllProductType);
router.post('/getAllActiveProductType', authentication.verifyAdminToken, adminController.getAllActiveProductType);
router.post('/getProducts', authentication.verifyAdminToken, adminController.getproductTypes);
router.post('/importProducts', authentication.verifyAdminToken, upload.any(), adminController.importProducts);

/* For User Management */
router.post('/getAllUsers', authentication.verifyAdminToken, adminController.getAllUsers);
router.post('/removeUser', authentication.verifyAdminToken, adminController.deleteUser);
router.post('/getUserProfileDetails', authentication.verifyAdminToken, adminController.getUserDetail);
router.post('/changeStatus', authentication.verifyAdminToken, adminController.changeUserStatus);

/* For Tailor Management */
router.post('/getAllTailors', authentication.verifyAdminToken, adminController.getAllTailors);
router.post('/getTailorProfileDetails', authentication.verifyAdminToken, adminController.getTailorDetails);
router.post('/changeProfileStatus', authentication.verifyAdminToken, adminController.changeProfileStatus);
router.post('/saveBasicDetails', authentication.verifyAdminToken, s3bucket.uploadTaylorFiles, adminController.saveBasicDetails);
router.post('/saveBankDetails', authentication.verifyAdminToken, adminController.saveBankDetails);
router.post('/deleteTailor', authentication.verifyAdminToken, adminController.deleteTailor);
router.post('/blockTailor', authentication.verifyAdminToken, adminController.blockTailor);

/*For Brand Managemant */
router.post('/addBrand', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.addBrand);
router.post('/deleteBrand', authentication.verifyAdminToken, adminController.deleteBrand);
router.post('/updateBrand', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.updateBrand);
router.post('/changeBrandStatus', authentication.verifyAdminToken, adminController.changeBrandStatus);
router.post('/getAllBrand', authentication.verifyAdminToken, adminController.getAllbrands);
router.post('/importBrands', authentication.verifyAdminToken, upload.any(), adminController.importBrands);

/*For fabric Type Management */
router.post('/addFabricType', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.addFabricType);
router.post('/deleteFabricType', authentication.verifyAdminToken, adminController.deleteFabricType);
router.post('/updateFabricType', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.updateFabricType);
router.post('/changeFabricTypeStatus', authentication.verifyAdminToken, adminController.changeFabricTypeStatus);
router.post('/getAllFabricType', authentication.verifyAdminToken, adminController.getAllFabricTypes);
router.post('/getAllActiveFabricType', authentication.verifyAdminToken, adminController.getActiveFabricTypes);
router.post('/importFabrics', authentication.verifyAdminToken, upload.any(), adminController.importFabrics);

/*For Fabric Type Brand Management */

router.post('/addFabricTypeBrand', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.addFabricTypeBrand);
router.post('/deleteFabricTypeBrand', authentication.verifyAdminToken, adminController.deleteFabricTypeBrand);
router.post('/updateFabricTypeBrand', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.updateFabricTypeBrand);
router.post('/changeFabricTypeBrandStatus', authentication.verifyAdminToken, adminController.changeFabricTypeBrandStatus);
router.post('/getAllFabricTypeBrand', authentication.verifyAdminToken, adminController.getAllFabricTypeBrands);
router.post('/importBrandsTypes', authentication.verifyAdminToken, upload.any(), adminController.importBrandsTypes);
// router.post('/getAllActiveFabricTypeBrand', authentication.verifyAdminToken,adminController.getActiveFabricTypes);

// Offer mgnt
router.get('/getOffers', authentication.verifyAdminToken, adminController.getOffers);
router.post('/changeOfferStatus', authentication.verifyAdminToken, adminController.changeOfferStatus);

// reward point management
router.post('/updateRewardPoints', authentication.verifyAdminToken, adminController.updateRewardPoints);
router.get('/getRewardPoints', authentication.verifyAdminToken, adminController.getRewardPoints);
router.get('/addRewardPoints', authentication.verifyAdminToken, adminController.addRewardPoints);


// promocode mgnt
router.post('/addPromocode', authentication.verifyAdminToken, s3bucket.uploadFiles, adminController.addPromocode);
router.post('/deletePromocode', authentication.verifyAdminToken, adminController.deletePromocode);
router.post('/blockPromocode', authentication.verifyAdminToken, adminController.blockPromocode);
router.get('/getPromocodes', authentication.verifyAdminToken, adminController.getPromocodes);

// Promotion managment
// OFFER
router.post('/addOffer', adminController.addOffer);
router.post('/deleteOffer', adminController.deleteOffer);
router.post('/blockUnblockOffer', adminController.blockUnblockOffer);
router.post('/editOffer', adminController.editOffer);
router.post('/viewOffer', adminController.viewOffer);
router.get('/getAllOffer', adminController.getAllOffer);

// PROMOTIONAL BANNER
// price controlled
router.post('/addPriceControlled', adminController.addPriceControlled);
router.post('/viewPriceControlled', adminController.viewPriceControlled);
router.post('/deletePriceControlled', adminController.deletePriceControlled);
router.post('/editPriceControlled', adminController.editPriceControlled);
router.get('/getAllPriceControlled', adminController.getAllPriceControlled);

// admin controlled
router.post('/createBanner', s3bucket.createBanner, adminController.createBanner);
router.get('/getAllBanner', adminController.getAllBanner);
router.post('/deleteBanner', adminController.deleteBanner);
router.post('/blockUnblockBanner', adminController.blockUnblockBanner);
router.post('/editBanner', s3bucket.editBanner, adminController.editBanner);
router.post('/getSingleBanner', adminController.getSingleBanner);
router.get('/getPromotional', adminController.getPromotional);
router.post('/acceptRejectPromotional', adminController.acceptRejectPromotional);

router.post('/addReasons', adminController.genrateReason);


// order Managment
router.get('/orderManagement', authentication.verifyAdminToken, adminController.orderManagement);
router.post('/UstaadList', authentication.verifyAdminToken, adminController.UstaadList);
router.post('/AssignUstaad', authentication.verifyAdminToken, adminController.AssignUstaad);
router.post('/productRating', authentication.verifyAdminToken, adminController.productRating);
//Add Model api
router.post('/AddKunduru', authentication.verifyAdminToken, s3bucket.uploadkunduraFiles, adminController.AddKunduru);
router.get("/getKunduru", authentication.verifyAdminToken, adminController.getKunduru);
router.post("/ustaadStatus", authentication.verifyAdminToken, adminController.ustaadStatus);
router.post("/deleteKunduru", authentication.verifyAdminToken, adminController.deleteKunduru);
router.post("/editKunduru", authentication.verifyAdminToken, s3bucket.uploadkunduraFiles, adminController.editKunduru);
router.post("/enableDisableKunduru", authentication.verifyAdminToken, adminController.enableDisableKunduru);
router.get("/issueList", authentication.verifyAdminToken, adminController.issueList);
router.post("/changeIssueStatus", authentication.verifyAdminToken, adminController.changeIssueStatus);

router.post("/recordMeasurment", authentication.verifyAdminToken, adminController.recordMeasurment);
router.post("/getfebric", authentication.verifyAdminToken, adminController.getfebric);
router.post("/getmodelbyid", authentication.verifyAdminToken, adminController.getmodelbyid);

/* charges Model */
router.post("/charges", authentication.verifyAdminToken, adminController.charges);

/* template Model */
router.post("/template", authentication.verifyAdminToken, adminController.addtemplate);

router.post("/getFabricSamples",authentication.verifyAdminToken, adminController.getFabricSamples);

router.post("/updateSubAdmin",authentication.verifyAdminToken, adminController.updateSubAdmin);
router.post("/getModel",authentication.verifyAdminToken, adminController.getModel);

///rating and reward
router.get("/getrating",authentication.verifyAdminToken, adminController.getrating);

router.get("/getRewardsUsers",authentication.verifyAdminToken, adminController.getRewardsUsers);
/* For Paymnet Management*/
    /* For user payment */
router.post("/getPaymentRecords",authentication.verifyAdminToken, adminController.getPaymentRecords);
router.post("/getUserPayments",authentication.verifyAdminToken,adminController.getUserPayments);

    /* For tailor Payment */
// router.post("/getPaymentRecords",authentication.verifyAdminToken,adminController.getPaymentRecords);
router.post("/autoSchedule",authentication.verifyAdminToken, adminController.autoSchedule);
router.post("/getTailorPayments",authentication.verifyAdminToken, adminController.getTailorPayments);
router.post("/payAmountToTailor",authentication.verifyAdminToken, adminController.payAmountToTailor);
router.post("/getCompletePayments",authentication.verifyAdminToken, adminController.getCompletePayments);
    /*For commission */
router.post("/setCommision",authentication.verifyAdminToken, adminController.setCommision);
router.get("/getCities",authentication.verifyAdminToken, adminController.getCities);
router.post("/getCommission",authentication.verifyAdminToken, adminController.getCommission);
router.get("/getAllCommission",authentication.verifyAdminToken, adminController.getAllCommission);
router.post("/getAdminCommissionList",authentication.verifyAdminToken, adminController.getAdminCommissionList);
/* For ustaad payment */
router.get("/getUstaadList",authentication.verifyAdminToken, adminController.getUstaadList);
router.post("/getRemainingUstaadPrice",authentication.verifyAdminToken, adminController.getremainingUstaadPrice);
router.post("/paidUstaad",authentication.verifyAdminToken, adminController.paidUstaad);
/* For Revenue Management */
router.post("/revenueList",authentication.verifyAdminToken, adminController.getRevenueList);
module.exports = router;