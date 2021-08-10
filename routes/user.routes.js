const userController = require('../controller/user.controller');
const adminController = require('../controller/admin.controller');
const express = require("express");
const app = express();
const route = express.Router();

const authentication = require("../middlewares/authentication");
const s3bucket = require("../modules/aws-s3");

route.post("/registerUser", userController.registerUser);
route.post("/verifyOtp", authentication.verifyUserToken, userController.verifyOtp);
route.post("/sendResendOtp", authentication.verifyUserToken, userController.sendResendOtp);
route.post("/forgotPassword", userController.forgotPassword);
route.post("/loginUser", userController.loginUser);
route.post("/loginWithSocialAccount", userController.loginWithSocialAccount);
route.post("/resetPassIfForget", authentication.verifyUserToken, userController.resetPassIfForget);

route.post("/uploadProfile", authentication.verifyUserToken, s3bucket.uploadUserFiles, userController.uploadProfile);

route.get("/getCountries", userController.sendCountries);
route.post("/getCities", userController.sendCities);
route.post("/saveAddress", authentication.verifyUserToken, userController.saveUserAddress);
route.post("/addFamilyMember", authentication.verifyUserToken, s3bucket.uploadFiles, userController.saveFamilyMember);

/*M4 apis */
route.post("/getCategoryList", authentication.verifyUserToken, userController.getcategoryList);
route.post("/searchThroughCategory", authentication.verifyUserToken, userController.searchTailorShopThroughCategory);
route.post("/searchByTailorOrProduct", authentication.verifyUserToken, userController.searchByTailorOrProduct);
route.post("/getSearchSuggetions", authentication.verifyUserToken, userController.getSearchSuggetions);
route.post("/getSearchHistory", authentication.verifyUserToken, userController.getSearchHistory);
route.post("/getTailorDetails", authentication.verifyUserToken, userController.getTailorDetails);
route.post("/getFabricTypes", authentication.verifyUserToken, adminController.getActiveFabricTypes);
route.post("/getImageLink", s3bucket.uploadTaylorFiles, userController.getImageLink);

/*M5 apis */
route.post("/readyMadeProductsList", authentication.verifyUserToken, userController.getReadyMadeProductsList);
route.post("/tailorCategories", authentication.verifyUserToken, userController.tailorCategories);
route.post("/getProducts", authentication.verifyUserToken, userController.getProducts);
route.post("/getProductDetails", authentication.verifyUserToken, userController.getProductDetails);
route.post("/similarProducts", authentication.verifyUserToken, userController.getSimilarProducts);

/*For Cart */
route.post("/productsOnCart", authentication.verifyUserToken, userController.cardRecords);
route.post("/addToCart", authentication.verifyUserToken, userController.addReadyMadeProductsToCart);
route.post("/showCart", authentication.verifyUserToken, userController.getCartProducts);
route.post("/changeQuantity", authentication.verifyUserToken, userController.setCartQuantity);
route.post("/removeFromCart", authentication.verifyUserToken, userController.removeFromCart);
route.post("/saveForLater", authentication.verifyUserToken, userController.saveForLater);
route.post("/moveToCart", authentication.verifyUserToken, userController.moveToCart);
route.post("/listOfSaveForLater", authentication.verifyUserToken, userController.getListOfSaveForLater);

route.post("/getProductOffers", authentication.verifyUserToken, userController.getOffers);

route.get("/Usergetoffer",authentication.verifyUserToken, userController.Usergetoffer);

route.post("/applyOffer", authentication.verifyUserToken, userController.applyOffer);

route.post("/orderSummary", authentication.verifyUserToken, userController.orderSummary);

/*process to buy */
route.post("/processToBuy", authentication.verifyUserToken, userController.checkProcessToBuy);
route.post("/continueCheckout", authentication.verifyUserToken, userController.continueCheckcout);

/*For Address */
route.post("/address", authentication.verifyUserToken, userController.processAddress);
route.post("/buyNow", authentication.verifyUserToken, userController.buyProduct);
route.post("/placeOrder", authentication.verifyUserToken, userController.placeYourOrder);


/* M8 API */
route.post("/orderlisting", authentication.verifyUserToken, userController.orderlisting);
route.post("/cancelOrder", authentication.verifyUserToken, userController.cancelorder)
route.post("/productrating", authentication.verifyUserToken,s3bucket.uploadratingFiles, userController.productrating)
route.post("/reorder", authentication.verifyUserToken, userController.reorder)
route.post("/addCancelReason", authentication.verifyUserToken, userController.addcancelreason)
route.post("/fetchCancelReason", authentication.verifyUserToken, userController.fetchUserReason)
// route.post("/addUserIssue",authentication.verifyUserToken,userController.addUserIssue)
// route.post("/userIssue",authentication.verifyUserToken,userController.userIssue)
route.post("/reSchedule", authentication.verifyUserToken, userController.reSchedule)
//route.post("/orderdetails",authentication.verifyUserToken,userController.orderdetails)


/* For wishlist */
route.post("/addRemoveToWishList", authentication.verifyUserToken, userController.addRemoveToWishList);
route.post("/addRemoveTailorToWishList", authentication.verifyUserToken, userController.addRemoveTailorToWishList);

/* stiching handmade product */

route.post("/getFamilyMember", authentication.verifyUserToken, userController.getFamilyMember);
route.post("/getTailorBrands", authentication.verifyUserToken, userController.getTailorBrands);
route.post("/getFabricList", authentication.verifyUserToken, userController.getFabricList);
route.post("/getFabricColors", authentication.verifyUserToken, userController.getFabricColors);
route.post("/getFabricDetails", authentication.verifyUserToken, userController.getFabricDetails);
route.post("/getTailorTimeSlot", authentication.verifyUserToken, userController.getTailorTimeSlot);
route.post("/getMeasurment", authentication.verifyUserToken, userController.getMeasurment);

route.post("/getOldMeasurment",authentication.verifyUserToken, userController.getPreviousMeasurment);
//route.post("/getRecord",authentication.verifyUserToken, userController.getMeasurmentRecord);

/* For get Promotions */

route.post("/getPromotions", authentication.verifyUserToken, userController.getPromotions);

/*For get Offers */

route.post("/getOffers", authentication.verifyUserToken, userController.getTailorOffers);

/* For order section */

route.post("/ordersList", authentication.verifyUserToken, userController.getOrders);
route.post("/orderDetails", authentication.verifyUserToken, userController.getOrderDetails);

/* For favorites section */

route.post("/favoriteList", authentication.verifyUserToken, userController.getFavoriteList);
route.post("/removeFavorite", authentication.verifyUserToken, userController.removeFavorite);

/* For getting Reward record */

route.post("/reward-point", authentication.verifyUserToken, userController.getRewardPoint);
route.post("/invite-rewards-points", authentication.verifyUserToken, userController.inviteRewardsPoints);
route.post("/getRewardList", authentication.verifyUserToken, userController.getRewardList);
route.post("/totalReward-points", authentication.verifyUserToken, userController.getTotalRewardPoints);

/* For Raise issue and fetch issue */

route.post("/raise-issue", authentication.verifyUserToken, userController.raiseIssue);
route.get("/issueList", authentication.verifyUserToken, userController.issueList);
route.post("/issueDetails", authentication.verifyUserToken, userController.issueDetails);

/* For edit profile */

route.get("/viewProfile", authentication.verifyUserToken, userController.viewProfile);
route.post("/updateProfile", authentication.verifyUserToken, userController.updateProfile);
route.post("/updatePassword", authentication.verifyUserToken, userController.updatePassword);
//address list api already there
route.post("/deleteFamilyMember", authentication.verifyUserToken, userController.deleteFamilyMember);

/* For wallet api's */

route.post("/wallet-balance", authentication.verifyUserToken, userController.walletBalance);

/* For templates */
route.post("/getTemplates", authentication.verifyUserToken, userController.getTemplates);

/* For notification */
route.get("/allowNotification", authentication.verifyUserToken, userController.allowNotification);
route.get("/notifications", authentication.verifyUserToken, userController.allNotifications);
route.get("/checkNotification", authentication.verifyUserToken, userController.checkNotification);

/*For Model Implementation*/

route.get("/modelList", authentication.verifyUserToken, userController.getModelList);

module.exports = route;