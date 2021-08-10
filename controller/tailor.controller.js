const { fabricColorModel } = require('../models/fabricColorModel');
const tailorService = require('../services/tailor.services');

exports.registerUser = async (req, res) => {
    try {
        let userData = await tailorService.registerUser(req);
        if (userData.status == -1) {
            throw new Error(userData.message);
        } else {
            let validTo = '2 days';
            let user = await tailorService.saveToken(userData.data, validTo);
            if (user.status == -1) {
                throw new Error(user.message);
            }
            res.status(200).json({ response: { token: user.data.token }, message: "successfully Registered As Tailor,Please verify the OTP" });
        }
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};


exports.loginUser = async (req, res) => {
    try {
        let userData = await tailorService.loginUser(req);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        let validTo = '30 days';
        let user = await tailorService.saveToken(userData.data, validTo);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, message: "successfully Login" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.loginWithSocialAccount = async (req, res) => {
    try {
        let userData = await tailorService.loginWithSocialAccount(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        let validTo = '30 days';
        let user = await tailorService.saveToken(userData.data, validTo);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, message: "successfully Login" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.sendResendOtp = async (req, res) => {
    try {
        let user = await tailorService.sendResendOtp(req.userData);
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
        let userData = await tailorService.verifyOtp(req.body, req.userData);
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
        let userData = await tailorService.forgotPassword(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        else {
            let validTo = '2 days';
            let user = await tailorService.saveToken(userData.data, validTo);
            if (user.status == -1) {
                throw new Error(user.message);
            }
            res.status(200).json({ response: { token: user.data.token }, message: "OTP send successfully, Please Verify for Reset Password" });
        }
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};


exports.resetPassIfForget = async (req, res) => {
    try {
        let userData = await tailorService.resetPassIfForget(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        let userData = await tailorService.changePassword(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.uploadProfile = async (req, res) => {
    try {


        if (req.files.profileImage != undefined || req.files.profileImage != null) {
            req.body.profileImage = req.files.profileImage[0].location ? req.files.profileImage[0].location : ''
        }

        let userData = await tailorService.uploadProfile(req.body, req.userData);

        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message, data: userData.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.saveUserAddress = async (req, res) => {
    try {
        let userData = await tailorService.saveAddress(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.saveBusinessType = async (req, res) => {
    try {
        let userData = await tailorService.saveBusiness(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ data: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.saveAboutYourself = async (req, res) => {
    try {
        var nationalIdImage = [];
        var passportImage = [];
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
            if (req.files.nationalIdImage != undefined || req.files.nationalIdImage != null) {

                req.files.nationalIdImage.forEach((a) => {
                    nationalIdImage.push(a.location);
                })
                req.body.nationalIdImage = nationalIdImage;
            }

            if (req.files.passportImage != undefined || req.files.passportImage != null) {

                req.files.passportImage.forEach((a) => {
                    passportImage.push(a.location);
                })
                req.body.passportImage = passportImage;
            }
        }
        let userData = await tailorService.aboutYourself(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        if (userData.status == 0) {
            res.status(400).json({ message: error.message });
        }
        res.status(200).json({ data: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.saveBusinessLocation = async (req, res) => {
    try {
        let userData = await tailorService.businessLocation(req.body, req.userData);

        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        if (userData.status == 0) {
            res.status(400).json({ message: error.message });
        }
        res.status(200).json({ data: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.saveStoreDetails = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.business_logo_image != undefined || req.files.business_logo_image != null) {
                req.body.business_logo_image = req.files.business_logo_image[0].location ? req.files.business_logo_image[0].location : ''
            }
        }
        let userData = await tailorService.storeDetails(req.body, req.userData);

        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ data: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.saveBankDetails = async (req, res) => {
    try {
        let userData = await tailorService.bankDetails(req.body, req.userData);

        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ data: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.saveBusinessDetails = async (req, res) => {
    try {
        var imgArr = [];
        if (req.files) {

            if (req.files.trading_license_image != undefined || req.files.trading_license_image != null) {
                req.body.trading_license_image = req.files.trading_license_image[0].location ? req.files.trading_license_image[0].location : ''
            }
            if (req.files.tax_id_image != undefined || req.files.tax_id_image != null) {
                req.body.tax_id_image = req.files.tax_id_image[0].location ? req.files.tax_id_image[0].location : ''
            }
            if (req.files.signature_image != undefined || req.files.signature_image != null) {
                req.body.signature_image = req.files.signature_image[0].location ? req.files.signature_image[0].location : ''
            }
            if (req.files.images != undefined || req.files.images != null) {

                req.files.images.forEach((a) => {
                    imgArr.push(a.location);
                })
                req.body.images = imgArr;
            }
        }

        let userData = await tailorService.businessDetails(req.body, req.userData);

        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ data: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getSubCategories = async (req, res) => {
    try {
        let category = await tailorService.getSubCategories(req.body);

        if (category.status == -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ data: category.data, message: category.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getProductTypes = async (req, res) => {
    try {
        let productType = await tailorService.getProductTypes(req.body);
        if (productType.status == -1) {
            throw new Error(productType.message);
        }
        res.status(200).json({ data: productType.data, message: productType.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.fetchBrands = async (req, res) => {
    try {
        let productBrands = await tailorService.getProductBrands(req.body);
        if (productBrands.status == -1) {
            throw new Error(productBrands.message);
        }
        res.status(200).json({ data: productBrands.data, message: productBrands.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.fetchOlderBrands = async (req, res) => {
    try {
        let productBrands = await tailorService.getOlderBrands(req.userData);
        if (productBrands.status == -1) {
            throw new Error(productBrands.message);
        }
        res.status(200).json({ data: productBrands.data, message: productBrands.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.addBrand = async (req, res) => {
    try {
        let productBrands = await tailorService.addProductBrands(req.body, req.userData);
        if (productBrands.status == -1) {
            throw new Error(productBrands.message);
        }
        res.status(200).json({ data: productBrands.data, message: productBrands.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.addProduct = async (req, res) => {
    try {
        let product = await tailorService.addProduct(req.body, req.userData);
        if (product.status == -1) {
            throw new Error(product.message);
        }
        res.status(200).json({ data: product.data, message: product.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

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

exports.getFabricBrands = async (req, res) => {
    try {
        let brand = await tailorService.getFabricBrand(req.body, req.userData);
        if (brand.status == -1) {
            throw new Error(brand.message);
        }
        res.status(200).json({ data: brand.data, message: brand.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.addBrandVariation = async (req, res) => {
    try {
        let product = await tailorService.addFabricProduct(req.body, req.userData);
        if (product.status == -1) {
            throw new Error(product.message);
        }
        res.status(200).json({ data: product.data, message: product.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.showFabricBrands = async (req, res) => {
    try {
        let fabric = await tailorService.showFabricBrandsList(req.body, req.userData);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ data: fabric.data, message: fabric.message });

    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.changeFabricBrandsStatus = async (req, res) => {
    try {
        let fabric = await tailorService.changeFabricBrandsStatus(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });

    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.deleteFabricBrand = async (req, res) => {
    try {
        let fabric = await tailorService.deleteFabricBrand(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message });

    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.editFabricBrand = async (req, res) => {
    try {
        let fabric = await tailorService.editFabricBrand(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });

    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.changeFabricStatus = async (req, res) => {
    try {
        let fabric = await tailorService.changeBrandStatus(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message });

    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.deleteFabric = async (req, res) => {
    try {
        let fabric = await tailorService.deleteFabric(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.editFabrics = async (req, res) => {
    try {
        let fabric = await tailorService.editFabrics(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });

    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.changeColorStatus = async (req, res) => {
    try {
        let fabric = await tailorService.changeColorStatus(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.deleteColor = async (req, res) => {
    try {
        let fabric = await tailorService.deleteColor(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.updateColor = async (req, res) => {
    try {
        let fabric = await tailorService.updateColor(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.addColor = async (req, res) => {
    try {
        let fabric = await tailorService.addColor(req.body);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getAllproductList = async (req, res) => {
    try {
        let products = await tailorService.getProducts(req.body, req.userData);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};
exports.inventory = async (req, res) => {
    try {
        let products = await tailorService.updatefabric(req.body);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}
exports.productinventory = async (req, res) => {
    try {
        let products = await tailorService.updatefabric(req.body);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}
exports.updateProduct = async (req, res) => {
    try {
        let products = await tailorService.updateProducts(req.body);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.editProduct = async (req, res) => {
    try {
        let products = await tailorService.editProduct(req.body);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.deleteProductColor = async (req, res) => {
    try {
        let products = await tailorService.deleteProductColor(req.body);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.changeProductColorStatus = async (req, res) => {
    try {
        let products = await tailorService.changeProductColorStatus(req.body);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.updateProductColor = async (req, res) => {
    try {
        let products = await tailorService.updateproduct(req.body);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        let products = await tailorService.entryUpdate();
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.readyMadeProductInventoryList = async (req, res) => {
    try {
        let products = await tailorService.readyMadeProductInventoryList(req.body, req.userData);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.changeSizeStatus = async (req, res) => {
    try {
        let products = await tailorService.changeSizeStatus(req.body);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getReadyMadeProductInventoryDetails = async (req, res) => {
    try {
        let products = await tailorService.getReadyMadeProductInventoryDetails(req.body, req.userData);
        if (products.status == -1) {
            throw new Error(products.message);

        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.fabricInventoryList = async (req, res) => {
    try {
        let fabric = await tailorService.fabricInventoryList(req.body, req.userData);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.brandList = async (req, res) => {
    try {
        let products = await tailorService.brandList(req.body, req.userData);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.deleteBrand = async (req, res) => {
    try {
        let brand = await tailorService.deleteBrand(req.body);
        if (brand.status == -1) {
            throw new Error(brand.message);
        }
        res.status(200).json({ message: brand.message, data: brand.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.updateBrand = async (req, res) => {
    try {
        let brand = await tailorService.updateBrand(req.body);
        if (brand.status == -1) {
            throw new Error(brand.message);
        }
        res.status(200).json({ message: brand.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.productList = async (req, res) => {
    try {
        let products = await tailorService.getProductsList(req.body, req.userData);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ messge: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        let products = await tailorService.deleteProduct(req.body, req.userData);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.updateProductInformation = async (req, res) => {
    try {
        let products = await tailorService.updateProductInformation(req.body, req.userData);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getFabricInventoryDetails = async (req, res) => {
    try {
        let fabric = await tailorService.getFabricInventoryDetails(req.body, req.userData);
        if (fabric.status == -1) {
            throw new Error(fabric.message);
        }
        res.status(200).json({ message: fabric.message, data: fabric.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.offers = async (req, res) => {
    try {
        let products = await tailorService.offers(req.body, req.userData);
        if (products.status == -1) {
            throw new Error(products.message);
        }
        res.status(200).json({ message: products.message, data: products.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        let categories = await tailorService.getCategoriesList(req.userData);
        if (categories.status == -1) {
            throw new Error(categories.message);
        }
        res.status(200).json({ message: categories.message, data: categories.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        let brand = await tailorService.getProductLists(req.userData);
        if (brand.status == -1) {
            throw new Error(brand.message);
        }
        res.status(200).json({ message: brand.message, data: brand.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getStiching = async (req, res) => {
    try {
        let stitching = await tailorService.getStichingLists(req.userData);
        if (stitching.status == -1) {
            throw new Error(stitching.message);
        }
        res.status(200).json({ message: stitching.message, data: stitching.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.promotions = async (req, res) => {
    try {
        let promotion = await tailorService.promotion(req.body, req.userData);
        if (promotion.status == -1) {
            throw new Error(promotion.message);
        }
        res.status(200).json({ message: promotion.message, data: promotion.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getAmount = async (req, res) => {
    try {
        let amount = await tailorService.getAmount(req.body, req.userData);
        if (amount.status == -1) {
            throw new Error(amount.message);
        }
        res.status(200).json({ message: amount.message, data: amount.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        let orders = await tailorService.getOrders(req.body, req.userData);
        if (orders.status == -1) {
            throw new Error(orders.message);
        }
        res.status(200).json({ message: orders.message, data: orders.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getOrderDetails = async (req, res) => {
    try {
        let orders = await tailorService.getOrderDetails(req.body, req.userData);
        if (orders.status == -1) {
            throw new Error(orders.message);
        }
        res.status(200).json({ message: orders.message, data: orders.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.generateInvoice = async (req, res) => {
    try {
        let orders = await tailorService.generateInvoice(req.body);
        if (orders.status == -1) {
            throw new Error(orders.message);
        }
        res.status(200).json({ message: orders.message, data: orders.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.updateOrders = async (req, res) => {
    try {
        let orders = await tailorService.updateOrders(req.body, req.userData);
        if (orders.status == -1) {
            throw new Error(orders.message);
        }
        res.status(200).json({ message: orders.message, data: orders.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.updateStichingOrders = async (req, res) => {
    try {
        let orders = await tailorService.updateStichingOrders(req.body);
        if (orders.status == -1) {
            throw new Error(orders.message);
        }
        res.status(200).json({ message: orders.message, data: orders.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.fetchReasons = async (req, res) => {
    try {
        let reasons = await tailorService.fetchReasons();
        if (reasons.status == -1) {
            throw new Error(reasons.message);
        }
        res.status(200).json({ message: reasons.message, data: reasons.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.showPastOrders = async (req, res) => {
    try {
        let orders = await tailorService.getPastOrders(req.body, req.userData);
        if (orders.status == -1) {
            throw new Error(orders.message);
        }
        res.status(200).json({ message: orders.message, data: orders.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.showOrderDetails = async (req, res) => {
    try {
        let orders = await tailorService.showOrderDetails(req.body, req.userData);
        if (orders.status == -1) {
            throw new Error(orders.message);
        }
        res.status(200).json({ message: orders.message, data: orders.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.showOrdersReview = async (req, res) => {
    try {
        let review = await tailorService.showOrdersReview(req.body, req.userData);
        if (review.status == -1) {
            throw new Error(review.message);
        }
        res.status(200).json({ message: review.message, data: review.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.profileDetails = async (req, res) => {
    try {
        let profile = await tailorService.profileDetails(req.body, req.userData);
        if (profile.status == -1) {
            throw new Error(profile.message);
        }
        res.status(200).json({ message: profile.message, data: profile.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.updateProfileDetails = async (req, res) => {
    try {
        let profile = await tailorService.updateProfileDetails(req.body, req.userData);
        if (profile.status == -1) {
            throw new Error(profile.message);
        }
        res.status(200).json({ message: profile.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getPaymentDetails = async (req, res) => {
    try {
        let payment = await tailorService.getPaymentDetails(req.body, req.userData);
        if (payment.status == -1) {
            throw new Error(payment.message);
        }
        res.status(200).json({ message: payment.message, data: payment.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        let details = await tailorService.getAnalytics(req.userData);
        if (details.status == -1) {
            throw new Error(details.message);
        }
        res.status(200).json({ message: details.message, data: details.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getPDFFile = async (req, res, next) => {
    try {
        let PDFfiles = await tailorService.gerPDFfiles(req.body, req.userData);
        if (PDFfiles == -1) {
            throw new Error(PDFfiles.message);
        }
        res.status(200).json({ message: PDFfiles.message, data: PDFfiles.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getTemplates = async (req, res) => {
    try {
        let templates = await tailorService.getTemplates(req.body);
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
        let notification = await tailorService.allowNotification(req.userData);
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
        let notifications = await tailorService.getAllNotifications(req.userData);
        if (notifications == -1) {
            throw new Error(notifications.message);
        }
        res.status(200).send({ message: notifications.message, data: notifications.data });
    } catch (err){
        res.status(403).json({ message: err.message });
    }
}

exports.checkNotification = async (req, res) => {
    try {
        let notifications = await tailorService.checkNotification(req.userData);
        if (notifications == -1) {
            throw new Error(notifications.message);
        }
        res.status(200).send({ message: notifications.message, data: notifications.data });
    } catch (err){
        res.status(403).json({ message: err.message });
    }
}
