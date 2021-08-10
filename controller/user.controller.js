const userService = require("../services/user.services");
var csc = require('country-state-city').default // Returns an array of country names.

exports.sendCountries = async (req, res) => {
    try {
        countrys = await csc.getAllCountries();
        res.status(200).json({ response: countrys, message: "All Countries Fetch" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.sendCities = async (req, res) => {
    try {
        if (!req.body.countryCode || req.body.countryCode == '') { throw new Error("Please give country Name") }
        cities = await csc.getCitiesOfCountry(req.body.countryCode);
        res.status(200).json({ response: cities, message: "All Cities Fetch" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.registerUser = async (req, res) => {
    try {
        let userData = await userService.registerUser(req);
        if (userData.status == -1) {
            throw new Error(userData.message);
        } else {
            let validTo = '2 days';
            let user = await userService.saveToken(userData.data, validTo);
            if (user.status == -1) {
                throw new Error(user.message);
            }
            res.status(200).json({ response: { token: user.data.token }, messsage: "successfully Registered As Tailor,Please verify the OTP" });
        }
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};


exports.loginUser = async (req, res) => {
    try {
        let userData = await userService.loginUser(req);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        let validTo = '30 days';
        let user = await userService.saveToken(userData.data, validTo);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, messsage: "successfully Login" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.loginWithSocialAccount = async (req, res) => {
    try {
        let userData = await userService.loginWithSocialAccount(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        let validTo = '30 days';
        let user = await userService.saveToken(userData.data, validTo);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, messsage: "successfully Login" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.sendResendOtp = async (req, res) => {
    try {
        let user = await userService.sendResendOtp(req.userData);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, message: user.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        let userData = await userService.verifyOtp(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        let userData = await userService.forgotPassword(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        else {
            let validTo = '2 days';
            let user = await userService.saveToken(userData.data, validTo);
            if (user.status == -1) {
                throw new Error(user.message);
            }
            res.status(200).json({ response: { token: user.data.token }, messsage: "OTP send successfully, Please Verify for Reset Password" });
        }
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};


exports.resetPassIfForget = async (req, res) => {
    try {
        let userData = await userService.resetPassIfForget(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.saveUserAddress = async (req, res) => {
    try {
        let userData = await userService.saveAddress(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.saveFamilyMember = async (req, res) => {
    try {
        if (req.files.image != undefined || req.files.image != null) {
            req.body.memberImage = req.files.image[0].location ? req.files.image[0].location : ''
        }
        let userData = await userService.saveMember(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message, data: userData.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}


exports.uploadProfile = async (req, res) => {
    try {
        if (req.files.profileImage != undefined || req.files.profileImage != null) {
            req.body.profileImage = req.files.profileImage[0].location ? req.files.profileImage[0].location : ''
        }
        let userData = await userService.uploadProfile(req.body, req.userData);

        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message, data: userData.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getcategoryList = async (req, res) => {
    try {

        let categoryList = await userService.getAllCategory();

        if (categoryList.status == -1) {
            throw new Error(categoryList.message);
        }
        res.status(200).json({ message: categoryList.message, data: categoryList.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.searchTailorShopThroughCategory = async (req, res) => {
    try {
        let shopList = await userService.searchTailorShopThroughCategory(req.body, req.userData);

        if (shopList.status == -1) {
            throw new Error(shopList.message);
        }
        res.status(200).json({ message: shopList.message, data: shopList.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.searchByTailorOrProduct = async (req, res) => {
    try {
        let shopList = await userService.searchByTailorOrProduct(req.body, req.userData);

        if (shopList.status == -1) {
            throw new Error(shopList.message);
        }
        res.status(200).json({ message: shopList.message, data: shopList.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getImageLink = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }

        if (!req.body.image || req.body.image == '') {
            throw new Error("Please upload the image");
        }
        res.status(200).json({ data: req.body.image, message: "Image uploaded successfully" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getSearchSuggetions = async (req, res) => {
    try {
        let shopList = await userService.getSearchSuggetions(req.body);

        if (shopList.status == -1) {
            throw new Error(shopList.message);
        }
        res.status(200).json({ message: shopList.message, data: shopList.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getSearchHistory = async (req, res) => {
    try {
        let shopList = await userService.getSearchHistory(req.userData);

        if (shopList.status == -1) {
            throw new Error(shopList.message);
        }
        res.status(200).json({ message: shopList.message, data: shopList.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getTailorDetails = async (req, res) => {
    try {
        let tailorShop = await userService.getTailorDetails(req.body);

        if (tailorShop.status == -1) {
            throw new Error(tailorShop.message);
        }
        res.status(200).json({ message: tailorShop.message, data: tailorShop.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getFilterSearch = async (req, res) => {
    try {
        let tailorShop = await userService.getTailorShopThroughFilter(req.body);

        if (tailorShop.status == -1) {
            throw new Error(tailorShop.message);
        }
        res.status(200).json({ message: tailorShop.message, data: tailorShop.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getReadyMadeProductsList = async (req, res) => {
    try {
        let readyMadeProducts = await userService.readyMadeProducts(req.body);

        if (readyMadeProducts.status == -1) {
            throw new Error(readyMadeProducts.message);
        }
        res.status(200).json({ message: readyMadeProducts.message, data: readyMadeProducts.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.tailorCategories = async (req, res) => {
    try {
        let tailorCategories = await userService.getTailorCategories(req.body);

        if (tailorCategories.status == -1) {
            throw new Error(tailorCategories.message);
        }
        res.status(200).json({ message: tailorCategories.message, data: tailorCategories.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        let tailorProducts = await userService.getTailorProducts(req.body, req.userData);

        if (tailorProducts.status == -1) {
            throw new Error(tailorProducts.message);
        }
        res.status(200).json({ message: tailorProducts.message, data: tailorProducts.data });

    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getProductDetails = async (req, res) => {
    try {
        let product = await userService.getProductDetails(req.body);
        if (product.status == -1) {
            throw new Error(product.message);
        }
        res.status(200).json({ message: product.message, data: product.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getSimilarProducts = async (req, res) => {
    try {
        let product = await userService.getSimilarProducts(req.body, req.userData);
        if (product.status == -1) {
            throw new Error(product.message);
        }
        res.status(200).json({ message: product.message, data: product.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.addReadyMadeProductsToCart = async (req, res) => {
    try {
        let cart = await userService.addReadyMadeProductsToCart(req.body, req.userData);
        if (cart.status == -1) {
            throw new Error(cart.message);
        }
        res.status(200).json({ message: cart.message });
    } catch (error) {
        res.status(403).json({ message: error.message });

    }
};

exports.getCartProducts = async (req, res) => {
    try {
        //console.log("Its here 1 :",req.userData);
        let cartDoc = await userService.getCartDetails(req.body, req.userData);
        if (cartDoc.status == -1) {
            throw new Error(cartDoc.message);
        }
        res.status(200).json({ message: cartDoc.message, data: cartDoc.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.orderSummary = async (req, res) => {
    try {
        let cartDoc = await userService.getOrderSummary(req.body, req.userData);
        if (cartDoc.status == -1) {
            throw new Error(cartDoc.message);
        }
        res.status(200).json({ message: cartDoc.message, data: cartDoc.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.setCartQuantity = async (req, res) => {
    try {
        let cartDoc = await userService.setCartQuantity(req.body);
        if (cartDoc.status == -1) {
            throw new Error(cartDoc.message);
        }
        res.status(200).json({ message: cartDoc.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        let cartDoc = await userService.removeProductFromCart(req.body, req.userData);
        if (cartDoc.status == -1) {
            throw new Error(cartDoc.message);
        }
        res.status(200).json({ message: cartDoc.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.saveForLater = async (req, res) => {
    try {
        let cartDoc = await userService.saveForLater(req.body);
        if (cartDoc.status == -1) {
            throw new Error(cartDoc.message);
        }
        res.status(200).json({ message: cartDoc.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.moveToCart = async (req, res) => {
    try {
        let cartDoc = await userService.moveToCart(req.body);
        if (cartDoc.status == -1) {
            throw new Error(cartDoc.message);
        }
        res.status(200).json({ message: cartDoc.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getListOfSaveForLater = async (req, res) => {
    try {
        let cartDoc = await userService.getListOfSaveForLater(req.userData);
        if (cartDoc.status == -1) {
            throw new Error(cartDoc.message);
        }
        res.status(200).json({ message: cartDoc.message, data: cartDoc.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.processAddress = async (req, res) => {
    try {
        let address = await userService.processAddress(req.body, req.userData);
        if (address.status == -1) {
            throw new Error(address.message);
        }
        res.status(200).json({ message: address.message, data: address.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.buyProduct = async (req, res) => {
    try {
        let buyDetail = await userService.addOnBuyProduct(req.body, req.userData);
        if (buyDetail.status == -1) {
            throw new Error(buyDetail.message);
        }
        res.status(200).json({ message: buyDetail.message, data: buyDetail.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.checkProcessToBuy = async (req, res) => {
    try {
        let checkProcess = await userService.checkProcessToBuy(req.userData);
        if (checkProcess.status == -1) {
            throw new Error(checkProcess.message);
        }
        res.status(200).json({ message: checkProcess.message, data: checkProcess.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.continueCheckcout = async (req, res) => {
    try {
        let countinueData = await userService.countinueData(req.body, req.userData);
        if (countinueData.status == -1) {
            throw new Error(countinueData.message);
        }
        res.status(200).json({ message: countinueData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.cardRecords = async (req, res) => {
    try {
        let checkProcess = await userService.countCartRecords(req.userData);
        if (checkProcess.status == -1) {
            throw new Error(checkProcess.message);
        }
        res.status(200).json({ message: checkProcess.message, data: checkProcess.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.placeYourOrder = async (req, res) => {
    try {
        let order = await userService.giveOrder(req.body, req.userData);
        if (order.status == -1) {
            throw new Error(order.message);
        }
        res.status(200).json({ message: order.message, data: order.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.addRemoveToWishList = async (req, res) => {
    try {
        let wishlist = await userService.addRemoveToWishList(req.body, req.userData);
        if (wishlist.status == -1) {
            throw new Error(wishlist.message);
        }
        res.status(200).json({ message: wishlist.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.addRemoveTailorToWishList = async (req, res) => {
    try {
        let wishlist = await userService.addRemoveTailorToWishList(req.body, req.userData);
        if (wishlist.status == -1) {
            throw new Error(wishlist.message);
        }
        res.status(200).json({ message: wishlist.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

// m6 apis
exports.getTailorBrands = async (req, res) => {
    try {
        let { tailor_id } = req.body;
        let brands = await userService.getBrandsList(tailor_id);
        if (brands.status == -1) {
            throw new Error(brands.message);
        }
        res.status(200).json({ message: brands.message, data: brands.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.getFabricColors = async (req, res) => {
    try {
        let colors = await userService.getFabricColorList(req.body);
        if (colors.status == -1) {
            throw new Error(colors.message);
        }
        res.status(200).json({ message: colors.message, data: colors.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getFamilyMember = async (req, res) => {
    try {
        let familyMember = await userService.getFamilyMember(req.userData);
        if (familyMember.status == -1) {
            throw new Error(familyMember.message);
        }
        res.status(200).json({ message: familyMember.message, data: familyMember.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getFabricList = async (req, res) => {
    try {
        let fabric = await userService.getFabricList(req.body, req.userData);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getFabricDetails = async (req, res) => {
    try {
        let fabric = await userService.getFabricDetail(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getTailorTimeSlot = async (req, res) => {
    try {
        let tailor = await userService.getTailorTimeSlot(req.body);
        if (tailor.status == -1) {
            throw new Error(tailor.message);
        }
        res.status(200).json({ message: tailor.message, data: tailor.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getMeasurment = async (req, res) => {
    try {
        let tailor = await userService.getMeasurment(req.body, req.userData);
        if (tailor.status == -1) {
            throw new Error(tailor.message);
        }
        res.status(200).json({ message: tailor.message, data: tailor.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getPreviousMeasurment = async (req,res) => {
    try{
        let measurment = await userService.getPreviousMeasurment(req.body, req.userData);
        if (measurment.status == -1) {
            throw new Error(measurment.message);
        }
        res.status(200).json({ message: measurment.message, data: measurment.data });
    }catch(error){
        res.status(403).json({ message: error.messsage });
    }
}

exports.getPromotions = async (req, res) => {
    try {
        let promotions = await userService.getPromotions();
        if (promotions.status == -1) {
            throw new Error(promotions.message);
        }
        res.status(200).json({ message: promotions.message, data: promotions.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getTailorOffers = async (req, res) => {
    try {
        let offer = await userService.getOffers(req.body);
        if (offer.status == -1) {
            throw new Error(offer.message);
        }
        res.status(200).json({ message: offer.message, data: offer.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.Usergetoffer = async (req, res) => {
    try {
        let offer = await userService.Usergetoffer();
        if (offer.status == -1) {
            throw new Error(offer.message);
        }
        res.status(200).json({ response: offer.data, message: offer.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getOffers = async (req, res) => {
    try {
        let offer = await userService.getOffersForPurchase(req.body, req.userData);
        if (offer.status == -1) {
            throw new Error(offer.message);
        }
        res.status(200).json({ message: offer.message, data: offer.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.applyOffer = async (req, res) => {
    try {
        let offer = await userService.applyOffer(req.body, req.userData);
        if (offer.status == -1) {
            throw new Error(offer.message);
        }
        res.status(200).json({ message: offer.message, data: offer.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        let orders = await userService.getOrders(req.body, req.userData);
        if (orders.status == -1) {
            throw new Error(orders.message);
        }
        res.status(200).json({ message: orders.message, data: orders.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}


exports.orderlisting = async (req, res) => {
    try {
        let order = await userService.orderlisting(req.body, req.userData);
        if (order.status == -1) {
            throw new Error(order.message);
        }
        res.status(200).json({ message: order.message, data: order });
    } catch (error) {

        res.status(403).json({ message: error.message });
    }

}
exports.cancelorder = async (req, res) => {
    try {
        let cancelorder = await userService.cancelorder(req.body, req.userData);
        if (cancelorder.status == -1) {
            throw new Error(order.message);
        }
        res.status(200).json({ message: cancelorder.message, data: cancelorder });
    } catch (error) {

        res.status(403).json({ message: error.message });
    }

}
exports.productrating = async (req, res) => {
    try {
        if (req.files.image != undefined || req.files.image != null) {
            req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
        }
        
        let productrating = await userService.productrating(req.body, req.userData);
        if (productrating.status == -1) {
            throw new Error(productrating.message);
        }
        res.status(200).json({ message: productrating.message, data: productrating });
    } catch (error) {

        res.status(403).json({ message: error.message });
    }

};

// exports.addUserIssue = async (req,res) =>{
//     try{

//         let addUserIssue = await userService.addUserIssue(req.body,req.userData);
//         if(addUserIssue.status == -1){
//             throw new Error(addUserIssue.message);
//         }
//         res.status(200).json({message: addUserIssue.message, data: addUserIssue});
//     }catch(error){

//         res.status(403).json({message: error.message});
//     }

// };

// exports.userIssue = async (req,res) =>{
//     try{

//         let userIssue = await userService.userIssue(req.body,req.userData);
//         if(addUserIssue.status == -1){
//             throw new Error(userIssue.message);
//         }
//         res.status(200).json({message: userIssue.message, data: userIssue});
//     }catch(error){

//         res.status(403).json({message: error.message});
//     }

// }
exports.addcancelreason = async (req, res) => {
    try {

        let addcancelreason = await userService.addcancelreason(req.body, req.userData);
        if (addcancelreason.status == -1) {
            throw new Error(addcancelreason.message);
        }
        res.status(200).json({ message: addcancelreason.message, data: addcancelreason });
    } catch (error) {

        res.status(403).json({ message: error.message });
    }

};
exports.fetchUserReason = async (req, res) => {
    try {

        let fetchUserReason = await userService.fetchUserReason(req.body, req.userData);
        if (fetchUserReason.status == -1) {
            throw new Error(fetchUserReason.message);
        }
        res.status(200).json({ message: fetchUserReason.message, data: fetchUserReason });
    } catch (error) {

        res.status(403).json({ message: error.message });
    }

};

exports.getOrderDetails = async (req, res) => {
    try {
        let order = await userService.getOrderDetails(req.body, req.userData);
        if (order.status == -1) {
            throw new Error(order.message);
        }
        res.status(200).json({ message: order.message, data: order });
    } catch (error) {

        res.status(403).json({ message: error.message });
    }
};

exports.reorder = async (req, res) => {
    try {
        let reorder = await userService.reorder(req.body, req.userData);
        if (reorder.status == -1) {
            throw new Error(reorder.message);
        }
        res.status(200).json({ message: reorder.message, data: reorder });
    } catch (error) {

        res.status(403).json({ message: error.message });
    }
}
exports.reSchedule = async (req, res) => {
    try {
        let reSchedule = await userService.reSchedule(req.body, req.userData);
        if (reSchedule.status == -1) {
            throw new Error(reSchedule.message);
        }
        res.status(200).json({ message: reSchedule.message, data: reSchedule });
    } catch (error) {

        res.status(403).json({ message: error.message });
    }

}

exports.getFavoriteList = async (req, res) => {
    try {
        let favoriteList = await userService.getFavoriteList(req.body, req.userData);
        if (favoriteList.status == -1) {
            throw new Error(favoriteList.message);
        }
        res.status(200).json({ message: favoriteList.message, data: favoriteList.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.removeFavorite = async (req, res) => {
    try {
        let favoriteList = await userService.removeFavorite(req.body);
        if (favoriteList.status == -1) {
            throw new Error(favoriteList.message);
        }
        res.status(200).json({ message: favoriteList.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getRewardPoint = async (req, res) => {
    try {
        let rewardList = await userService.getRewardPoint(req.userData);
        if (rewardList.status == -1) {
            throw new Error(rewardList.message);
        }
        res.status(200).json({ message: rewardList.message, data: rewardList.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.inviteRewardsPoints = async (req, res) => {
    try {
        let rewardList = await userService.inviteRewardsPoints(req.body, req.userData);
        if (rewardList.status == -1) {
            throw new Error(rewardList.message);
        }
        res.status(200).json({ message: rewardList.message, data: rewardList.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getRewardList = async (req, res) => {
    try {
        let rewardList = await userService.getRewardList(req.body, req.userData);
        if (rewardList.status == -1) {
            throw new Error(rewardList.message);
        }
        res.status(200).json({ message: rewardList.message, data: rewardList.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getTotalRewardPoints = async (req, res) => {
    try {
        let totalReward = await userService.getTotalRewardPoints(req.userData);
        if (totalReward.status == -1) {
            throw new Error(totalReward.message);
        }
        res.status(200).json({ message: totalReward.message, data: totalReward.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.raiseIssue = async (req, res) => {
    try {
        let raiseIssue = await userService.raiseIssue(req.body, req.userData);
        if (raiseIssue.status == -1) {
            throw new Error(raiseIssue.message);
        }
        res.status(200).json({ message: raiseIssue.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.issueList = async (req, res) => {
    try {
        let issueList = await userService.issueList(req.userData);
        if (issueList.status == -1) {
            throw new Error(issueList.message);
        }
        res.status(200).json({ message: issueList.message, data: issueList.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.issueDetails = async (req, res) => {
    try {
        let issue = await userService.issueDetails(req.body);
        if (issue.status == -1) {
            throw new Error(issue.message);
        }
        res.status(200).json({ message: issue.message, data: issue.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.viewProfile = async (req, res) => {
    try {
        let user = await userService.viewProfile(req.userData);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ message: user.message, data: user.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        let user = await userService.updateProfile(req.userData, req.body);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ message: user.message, data: user.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.updatePassword = async (req, res) => {
    try {
        let user = await userService.updatePassword(req.userData, req.body);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ message: user.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.deleteFamilyMember = async (req, res) => {
    try {
        let user = await userService.deleteFamilyMember(req.body);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ message: user.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.walletBalance = async (req, res) => {
    try {
        let wallet = await userService.walletBalance(req.body, req.userData);
        if (wallet.status == -1) {
            throw new Error(wallet.message);
        }
        res.status(200).json({ message: wallet.message, data: wallet.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getTemplates = async (req, res) => {
    try {
        let templates = await userService.getTemplates(req.body);
        if (templates == -1) {
            throw new Error(templates.message);
        }
        res.status(200).send({ url: templates.data });
    } catch (err){
        res.status(403).json({ message: err.message });
    }
}

exports.allowNotification = async (req, res) => {
    try {
        let notification = await userService.allowNotification(req.userData);
        if (notification == -1) {
            throw new Error(notification.message);
        }
        res.status(200).send({ message: notification.message, data: notification.data });
    } catch (err){
        res.status(403).json({ message: err.message });
    }
}

exports.allNotifications = async (req, res) => {
    try {
        let notifications = await userService.getAllNotifications(req.userData);
        if (notifications == -1) {
            throw new Error(notifications.message);
        }
        res.status(200).send({ message: notifications.message, data: notifications.data });
    } catch (err){
        res.status(403).json({ message: err.message });
    }
}

exports.getModelList = async(req,res)=>{
    try{
        let modelList = await userService.getModelList();
        if(modelList.status == -1){
            throw new Error(modelList.message);
        }
        res.status(200).send({message: modelList.message,data: modelList.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
}

exports.checkNotification = async (req, res) => {
    try {
        let notifications = await userService.checkNotification(req.userData);
        if (notifications == -1) {
            throw new Error(notifications.message);
        }
        res.status(200).send({ message: notifications.message, data: notifications.data });
    } catch (err){
        res.status(403).json({ message: err.message });
    }
}
