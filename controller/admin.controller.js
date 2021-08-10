const adminService = require('../services/admin.services');

exports.createAdminReq = async (req, res) => {
    try {
        let userData = await adminService.createAdmin(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: "Login Successfully" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.loginAdmin = async (req, res) => {
    try {
        let userData = await adminService.loginAdmin(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        if (userData.status == 0) {
            let userData = await adminService.createAdmin(req.body);
            if (userData.status == -1) {
                throw new Error(userData.message);
            }
            res.status(200).json({ response: userData.data, message: "Login Successfully" });
        }
        res.status(200).json({ response: userData.data, message: "Login Successfully" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.logoutAdmin = async (req, res) => {
    try {
        let userData = await adminService.logoutAdmin(req.userId, req.headers.access_token);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: "Login Successfully" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.forgetPassword = async (req, res) => {
    try {
        let userData = await adminService.forgetPassword(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        let userData = await adminService.resetPassword(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        if (userData.status == 0) {
            return res.status(401).json({ message: userData.message });
        }
        res.status(200).json({ message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        console.log("d", req.body)
        let userData = await adminService.changePassword(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: "Login Successfully" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.addCategory = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }
        let userData = await adminService.addCategory(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getAllCategory = async (req, res) => {
    try {
        let userData = await adminService.getAllCategory();
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getAllActiveCategory = async (req, res) => {
    try {
        let userData = await adminService.getAllActiveCategory();
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.importCats = async (req, res) => {
    try {
        if (req.files) {
            if (req.files[0].fieldname == 'image') {
                req.body.image = req.files[0].path ? req.files[0].path : ''
            } else {
                throw new Error('Please provide a excel file.');
            }
        }
        let userData = await adminService.importCats(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.importProducts = async (req, res) => {
    try {
        if (req.files) {
            if (req.files[0].fieldname == 'image') {
                req.body.image = req.files[0].path ? req.files[0].path : ''
            } else {
                throw new Error('Please provide a excel file.');
            }
        }
        let userData = await adminService.importProducts(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.importBrands = async (req, res) => {
    try {
        if (req.files) {
            if (req.files[0].fieldname == 'image') {
                req.body.image = req.files[0].path ? req.files[0].path : ''
            } else {
                throw new Error('Please provide a excel file.');
            }
        }
        let userData = await adminService.importBrands(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        let userData = await adminService.deleteCategory(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.updateCategory = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }
        let userData = await adminService.updateCategory(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.changeCategoryStaus = async (req, res) => {
    try {
        let userData = await adminService.changeCategoryStatus(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.addSubCategory = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.subCategoryImage != undefined || req.files.subCategoryImage != null) {
                req.body.subCategoryImage = req.files.subCategoryImage[0].location ? req.files.subCategoryImage[0].location : ''
            }
        }
        let userData = await adminService.addSubCategory(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.addProductType = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }
        console.log("Its here");
        let userData = await adminService.addProductType(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.deleteProductType = async (req, res) => {
    try {
        let userData = await adminService.deleteProductType(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.updateProductType = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }

        let productTypeData = await adminService.updateProductType(req.body);
        if (productTypeData.status == -1) {
            throw new Error(productTypeData.message);
        }
        res.status(200).json({ message: productTypeData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.updateBrand = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
            if (req.files.brand_doc != undefined || req.files.brand_doc != null) {
                req.body.brand_doc = req.files.brand_doc[0].location ? req.files.brand_doc[0].location : ''
            }
        }

        let productBrand = await adminService.updateBrand(req.body);
        if (productBrand.status == -1) {
            throw new Error(productBrand.message);
        }
        res.status(200).json({ message: productBrand.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.changeProductTypeStatus = async (req, res) => {
    try {
        let productTypeData = await adminService.changeProductType(req.body);
        if (productTypeData.status == -1) {
            throw new Error(productTypeData.message);
        }
        res.status(200).json({ message: productTypeData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getAllProductType = async (req, res) => {
    try {
        let productTypeData = await adminService.getAllProductType();
        if (productTypeData.status == -1) {
            throw new Error(productTypeData.message);
        }
        res.status(200).json({ response: productTypeData.data, message: productTypeData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getAllActiveProductType = async (req, res) => {
    try {
        let userData = await adminService.getAllActiveProductType();
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.deleteSubCategory = async (req, res) => {
    try {
        let userData = await adminService.deleteSubCategory(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.updateSubCategory = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.subCategoryImage != undefined || req.files.subCategoryImage != null) {
                req.body.subCategoryImage = req.files.subCategoryImage[0].location ? req.files.subCategoryImage[0].location : ''
            }
        }
        let userData = await adminService.updateSubCategory(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.changeSubCategoryStatus = async (req, res) => {
    try {
        let userData = await adminService.changeSubCategoryStatus(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getAllSubCategory = async (req, res) => {
    try {
        let userData = await adminService.getAllSubCategory();
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getAllActiveSubCategory = async (req, res) => {
    try {
        let subCategories = await adminService.getAllActiveSubCategory();
        if (subCategories.status == -1) {
            throw new Error(subCategories.message);
        }
        res.status(200).json({ response: subCategories.data, message: subCategories.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getSubCategories = async (req, res) => {
    try {
        let userData = await adminService.getSubCategories(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getproductTypes = async (req, res) => {
    try {
        let productType = await adminService.getProductTypes(req.body);
        if (productType.status == -1) {
            throw new Error(productType.message);
        }
        res.status(200).json({ response: productType.data, message: productType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        let userData = await adminService.getUsers();

        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message, data: userData.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getAllTailors = async (req, res) => {
    try {
        let userData = await adminService.getTailors();

        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message, data: userData.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        let userData = await adminService.removeUser(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getUserDetail = async (req, res) => {
    try {
        let userData = await adminService.userDetails(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message, data: userData.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.changeUserStatus = async (req, res) => {
    try {
        let userData = await adminService.changeStatus(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getTailorDetails = async (req, res) => {
    try {
        let userData = await adminService.getTailorDetails(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message, data: userData.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }

};

exports.changeProfileStatus = async (req, res) => {
    try {
        let userData = await adminService.changeTailorStatus(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.saveBasicDetails = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
            if (req.files.nationalIdImage != undefined || req.files.nationalIdImage != null) {
                req.body.nationalIdImage = req.files.nationalIdImage[0].location ? req.files.nationalIdImage[0].location : ''
            }
        }

        let userData = await adminService.saveBasicDetails(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.saveBankDetails = async (req, res) => {
    try {
        let userData = await adminService.saveBankDetails(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.deleteTailor = async (req, res) => {
    try {
        let userData = await adminService.deleteTailor(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.blockTailor = async (req, res) => {
    try {
        let userData = await adminService.blockTailor(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.addBrand = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
            if (req.files.brand_doc != undefined || req.files.brand_doc != null) {
                req.body.brand_doc = req.files.brand_doc[0].location ? req.files.brand_doc[0].location : ''
            }
        }

        let userData = await adminService.addBrand(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.deleteBrand = async (req, res) => {
    try {
        let brand = await adminService.deleteBrand(req.body);
        if (brand.status == -1) {
            throw new Error(brand.message);
        }
        res.status(200).json({ message: brand.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.changeBrandStatus = async (req, res) => {
    try {
        let brand = await adminService.changeBrandStatus(req.body);
        if (brand.status == -1) {
            throw new Error(brand.message);
        }
        res.status(200).json({ message: brand.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getAllbrands = async (req, res) => {
    try {
        let brands = await adminService.getAllBrands();
        if (brands.status == -1) {
            throw new Error(brands.message);
        }
        res.status(200).json({ response: brands.data, message: brands.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

/*fabric types controllers */

exports.addFabricType = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }

        let fabricType = await adminService.addFabricType(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.deleteFabricType = async (req, res) => {
    try {
        let fabricType = await adminService.deleteFabricType(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.updateFabricType = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }

        let fabricType = await adminService.updateFabricType(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.changeFabricTypeStatus = async (req, res) => {
    try {
        let fabricType = await adminService.changeFabricTypeStatus(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getAllFabricTypes = async (req, res) => {
    try {
        let fabricType = await adminService.getAllFabricTypes(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.importFabrics = async (req, res) => {
    try {
        if (req.files) {
            if (req.files[0].fieldname == 'image') {
                req.body.image = req.files[0].path ? req.files[0].path : ''
            } else {
                throw new Error('Please provide a excel file.');
            }
        }

        let fabricType = await adminService.importFabrics(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getActiveFabricTypes = async (req, res) => {
    try {
        let fabricType = await adminService.getAllActiveFabricTypes();
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

/* fabric type brand Controllers */

exports.addFabricTypeBrand = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }

        let fabricType = await adminService.addFabricBrand(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.deleteFabricTypeBrand = async (req, res) => {
    try {
        let fabricType = await adminService.deleteFabricTypeBrand(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.updateFabricTypeBrand = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }

        let fabricType = await adminService.updateFabricBrand(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.changeFabricTypeBrandStatus = async (req, res) => {
    try {
        let fabricType = await adminService.changeFabricBrandStatus(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getAllFabricTypeBrands = async (req, res) => {
    try {
        let fabricType = await adminService.getAllFabricbrands(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.importBrandsTypes = async (req, res) => {
    try {
        if (req.files) {
            if (req.files[0].fieldname == 'image') {
                req.body.image = req.files[0].path ? req.files[0].path : ''
            } else {
                throw new Error('Please provide a excel file.');
            }
        }

        let fabricType = await adminService.importBrandsTypes(req.body);
        if (fabricType.status == -1) {
            throw new Error(fabricType.message);
        }
        res.status(200).json({ response: fabricType.data, message: fabricType.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.addPromocode = async (req, res) => {
    try {
        if (req.files) {
            console.log("Req.files :", req.files);
            //let image = [];

            //var image = req.files.map(file => file.path)

            //req.body.image = image.length > 0 ? image : '';

            if (req.files.image != undefined || req.files.image != null) {
                for (var i = 0; i < req.files.image.length; i++) {
                    //console.log("image :",image[i]);
                    image.push(req.files.image[i].location);
                }

                req.body.image = image.length > 0 ? image : '';
            }
        }

        let promo = await adminService.addPromocode(req.body);
        if (promo.status == -1) {
            throw new Error(promo.message);
        }
        res.status(200).json({ response: promo.data, message: promo.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.deletePromocode = async (req, res) => {
    try {
        let promo = await adminService.deletePromocode(req.body);
        if (promo.status == -1) {
            throw new Error(promo.message);
        }
        res.status(200).json({ response: promo.data, message: promo.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.blockPromocode = async (req, res) => {
    try {
        let promo = await adminService.blockPromocode(req.body);
        if (promo.status == -1) {
            throw new Error(promo.message);
        }
        res.status(200).json({ response: promo.data, message: promo.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getPromocodes = async (req, res) => {
    try {
        let promo = await adminService.getPromocodes();
        if (promo.status == -1) {
            throw new Error(promo.message);
        }
        res.status(200).json({ response: promo.data, message: promo.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

// exports.getActiveFabricTypes = async (req,res) => {
//     try{
//         let fabricType = await adminService.getAllActiveFabricTypes();
//         if (fabricType.status == -1) {
//             throw new Error(fabricType.message);
//         }
//         res.status(200).json({ response: fabricType.data, message: fabricType.message });
//     }catch(err){
//         res.status(403).json({message: err.message});
//     }
// };

// offer code management
exports.getOffers = async (req, res) => {
    try {
        let offer = await adminService.getOffers();
        if (offer.status == -1) {
            throw new Error(offer.message);
        }
        res.status(200).json({ response: offer.data, message: offer.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.changeOfferStatus = async (req, res) => {
    try {
        let offer = await adminService.changeOfferStatus(req.body);
        if (offer.status == -1) {
            throw new Error(offer.message);
        }
        res.status(200).json({ response: offer.data, message: offer.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

// reward point management

exports.addRewardPoints = async (req, res) => {
    try {
        let reward = await adminService.addRewardPoints(req.body);
        if (reward.status == -1) {
            throw new Error(reward.message);
        }
        res.status(200).json({ response: reward.data, message: reward.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }

}
exports.updateRewardPoints = async (req, res) => {
    try {
        let offer = await adminService.updateRewardPoints(req.body);
        if (offer.status == -1) {
            throw new Error(offer.message);
        }
        res.status(200).json({ response: offer.data, message: offer.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getRewardPoints = async (req, res) => {
    try {
        let offer = await adminService.getRewardPoints();
        if (offer.status == -1) {
            throw new Error(offer.message);
        }
        res.status(200).json({ response: offer.data, message: offer.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};


exports.addOffer = async (req, res) => {
    try {
        var offerStatus = await adminService.addoffer(req.body);

        if (!offerStatus) {
            throw new Error(offerStatus.message);
        }

        res.status(200).json({
            status: offerStatus.status,
            message: offerStatus.message,
            data: offerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.deleteOffer = async (req, res) => {
    try {
        var offerStatus = await adminService.deleteoffer(req.body);

        if (!offerStatus) {
            throw new Error(offerStatus.message);
        }

        res.status(200).json({
            status: offerStatus.status,
            message: offerStatus.message,
            data: offerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.blockUnblockOffer = async (req, res) => {
    try {
        var offerStatus = await adminService.blockunblock(req.body);

        if (!offerStatus) {
            throw new Error(offerStatus.message);
        }

        res.status(200).json({
            status: offerStatus.status,
            message: offerStatus.message,
            data: offerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.editOffer = async (req, res) => {
    try {
        var offerStatus = await adminService.editoffer(req.body);

        if (!offerStatus) {
            throw new Error(offerStatus.message);
        }

        res.status(200).json({
            status: offerStatus.status,
            message: offerStatus.message,
            data: offerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.viewOffer = async (req, res) => {
    try {
        var offerStatus = await adminService.viewoffer(req.body);

        if (!offerStatus) {
            throw new Error(offerStatus.message);
        }

        res.status(200).json({
            status: offerStatus.status,
            message: offerStatus.message,
            data: offerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.getAllOffer = async (req, res) => {
    try {
        var offerStatus = await adminService.getalloffer(req.body);

        if (!offerStatus) {
            throw new Error(offerStatus.message);
        }

        res.status(200).json({
            status: offerStatus.status,
            message: offerStatus.message,
            data: offerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.addPriceControlled = async (req, res) => {
    try {
        var priceStatus = await adminService.addpricecontrolled(req.body);

        if (!priceStatus) {
            throw new Error(priceStatus.message);
        }

        res.status(200).json({
            status: priceStatus.status,
            message: priceStatus.message,
            data: priceStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.viewPriceControlled = async (req, res) => {
    try {
        var priceStatus = await adminService.viewpricecontrolled(req.body);

        if (!priceStatus) {
            throw new Error(priceStatus.message);
        }

        res.status(200).json({
            status: priceStatus.status,
            message: priceStatus.message,
            data: priceStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.deletePriceControlled = async (req, res) => {
    try {
        var priceStatus = await adminService.deletepricecontrolled(req.body);

        if (!priceStatus) {
            throw new Error(priceStatus.message);
        }

        res.status(200).json({
            status: priceStatus.status,
            message: priceStatus.message,
            data: priceStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.editPriceControlled = async (req, res) => {
    try {
        var priceStatus = await adminService.editpricecontrolled(req.body);

        if (!priceStatus) {
            throw new Error(priceStatus.message);
        }

        res.status(200).json({
            status: priceStatus.status,
            message: priceStatus.message,
            data: priceStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.getAllPriceControlled = async (req, res) => {
    try {
        var priceStatus = await adminService.getallpricecontrolled(req.body);

        if (!priceStatus) {
            throw new Error(priceStatus.message);
        }

        res.status(200).json({
            status: priceStatus.status,
            message: priceStatus.message,
            data: priceStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.createBanner = async (req, res) => {
    try {
        if (req.files && req.files.bannerImage != undefined && req.files.bannerImage != null) {
            req.body.bannerImage = req.files.bannerImage[0].location ? req.files.bannerImage[0].location : ''
        }

        var bannerStatus = await adminService.createbanner(req.body);

        if (!bannerStatus) {
            throw new Error(bannerStatus.message);
        }

        res.status(200).json({
            status: bannerStatus.status,
            message: bannerStatus.message,
            data: bannerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};

exports.getAllBanner = async (req, res) => {
    try {
        var getAll = await adminService.getallbanner();

        if (!getAll) {
            throw new Error(getAll.message);
        }

        res.status(200).json({
            status: getAll.status,
            message: getAll.message,
            data: getAll.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.deleteBanner = async (req, res) => {
    try {
        var deleteBanner = await adminService.deletebanner(req.body);

        if (!deleteBanner) {
            throw new Error(deleteBanner.message);
        }

        res.status(200).json({
            status: deleteBanner.status,
            message: deleteBanner.message,
            data: deleteBanner.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.blockUnblockBanner = async (req, res) => {
    try {
        var bannerStatus = await adminService.blockunblockbanner(req.body);

        if (!bannerStatus) {
            throw new Error(bannerStatus.message);
        }

        res.status(200).json({
            status: bannerStatus.status,
            message: bannerStatus.message,
            data: bannerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.editBanner = async (req, res) => {
    try {
        console.log(req.files)
        if (req.files.bannerImage != undefined || req.files.bannerImage != null) {
            req.body.bannerImage = req.files.bannerImage[0].location ? req.files.bannerImage[0].location : ''
        }
        var bannerStatus = await adminService.editbanner(req.body);

        if (!bannerStatus) {
            throw new Error(bannerStatus.message);
        }

        res.status(200).json({
            status: bannerStatus.status,
            message: bannerStatus.message,
            data: bannerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.getSingleBanner = async (req, res) => {
    try {
        var bannerStatus = await adminService.getsinglebanner(req.body);

        if (!bannerStatus) {
            throw new Error(bannerStatus.message);
        }

        res.status(200).json({
            status: bannerStatus.status,
            message: bannerStatus.message,
            data: bannerStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.getPromotional = async (req, res) => {
    try {
        var promotonialStatus = await adminService.getpromotional();

        if (!promotonialStatus) {
            throw new Error(promotonialStatus.message);
        }

        res.status(200).json({
            status: promotonialStatus.status,
            message: promotonialStatus.message,
            data: promotonialStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};


exports.acceptRejectPromotional = async (req, res) => {
    try {
        var promotonialStatus = await adminService.acceptrejectpromotional(req.body);

        if (!promotonialStatus) {
            throw new Error(promotonialStatus.message);
        }

        res.status(200).json({
            status: promotonialStatus.status,
            message: promotonialStatus.message,
            data: promotonialStatus.data
        });

    } catch (error) {
        res.status(400).json({
            status: -1,
            message: error.message
        })
    }
};

exports.genrateReason = async (req, res) => {
    try {
        let reason = await adminService.genrateReason(req.body);
        if (reason.status == -1) {
            throw new Error(reason.message);
        }
        res.status(200).json({ response: reason.data, message: reason.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

///order Managment
exports.orderManagement = async (req, res) => {
    try {
        let orderData = await adminService.orderManagement(req.body);
        if (orderData.status == -1) {
            throw new Error(orderData.message);
        }
        res.status(200).json({ response: orderData, message: orderData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }

}
exports.UstaadList = async (req, res) => {
    try {
        let ustaad = await adminService.UstaadList(req.body);
        console.log("Its here:",ustaad);
        if (ustaad.status == -1) {
            throw new Error(ustaad.message);
        }

        res.status(200).json({ response: ustaad.data, message: ustaad.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }

}

exports.AssignUstaad = async (req, res) => {
    try {
        let AssignUstaad = await adminService.AssignUstaad(req.body);
        if (AssignUstaad.status == -1) {
            throw new Error(AssignUstaad.message);
        }
        res.status(200).json({ response: AssignUstaad, message: AssignUstaad.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }

}
exports.productRating = async (req, res) => {
    try {
        let productRating = await adminService.productRating(req.body);
        if (productRating.status == -1) {
            throw new Error(productRating.message);
        }
        res.status(200).json({ response: productRating, message: productRating.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }

}

exports.issueList = async (req, res) => {
    try {
        let issueList = await adminService.issueList();
        if (issueList.status == -1) {
            throw new Error(issueList.message);
        }
        res.status(200).json({ message: issueList.message, data: issueList.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.changeIssueStatus = async (req, res) => {
    try {
        let issue = await adminService.changeIssueStatus(req.body);
        if (issue.status == -1) {
            throw new Error(issue.message);
        }
        res.status(200).json({ message: issue.message, data: issue.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.AddKunduru = async (req, res) => {

    try {
        if (req.files.image != undefined || req.files.image != null) {
            req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
        }
        let modelData = await adminService.AddKunduru(req.body);
        if (modelData.status == -1) {
            throw new Error(modelData.message);
        }
        res.status(200).json({ message: modelData.message, data: modelData.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.getKunduru = async (req, res) => {
    try {
        let getData = await adminService.getKunduru();
        if (getData.status == -1) {
            throw new Error(getData.message);
        }
        res.status(200).json({ message: getData.message, data: getData.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.ustaadStatus = async (req, res) => {


    try {
        let updateData = await adminService.ustaadStatus(req.body);
        if (updateData.status == -1) {
            throw new Error(updateData.message);
        }
        res.status(200).json({ message: updateData.message, data: updateData.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.editKunduru = async (req, res) => {

    try {
        console.log(req.files)
        if (req.files.image != undefined || req.files.image != null) {
            req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
        }
        let editData = await adminService.editKunduru(req.body);
        if (editData.status == -1) {
            throw new Error(editData.message);
        }
        res.status(200).json({ message: editData.message, data: editData.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.deleteKunduru = async (req, res) => {

    try {
        let deletedData = await adminService.deleteKunduru(req.body);
        if (deletedData.status == -1) {
            throw new Error(deletedData.message);
        }
        res.status(200).json({ message: deletedData.message, data: deletedData.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.enableDisableKunduru = async (req, res) => {
    try {
        let disableData = await adminService.enableDisableKunduru(req.body);
        if (disableData.status == -1) {
            throw new Error(disableData.message);
        }
        res.status(200).json({ message: disableData.message, data: disableData.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }

}
exports.recordMeasurment = async (req, res) => {
    try {
        let recordMeasurment = await adminService.recordMeasurment(req.body);
        if (recordMeasurment.status == -1) {
            throw new Error(recordMeasurment.message);
        }
        res.status(200).json({ message: recordMeasurment.message, data: recordMeasurment.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }

}
exports.getfebric = async (req, res) => {
    try {
        let getfebric = await adminService.getfebric(req.body);
        if (getfebric.status == -1) {
            throw new Error(getfebric.message);
        }
        res.status(200).json({ message: getfebric.message, data: getfebric.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }

}
exports.getmodelbyid = async (req, res) => {
    try {
        let getmodelbyid = await adminService.getmodelbyid(req.body);
        if (getmodelbyid.status == -1) {
            throw new Error(getmodelbyid.message);
        }
        res.status(200).json({ message: getmodelbyid.message, data: getmodelbyid.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }

};

exports.charges = async (req, res) => {
    try {
        let charges = await adminService.charges(req.body);
        if (charges.status == -1) {
            throw new Error(charges.message);
        }
        res.status(200).json({ message: charges.message, data: charges });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.addtemplate = async (req, res) => {
    try{
        let template = await adminService.addtemplate(req.body);
        if(template.status === -1){
            throw new Error(template.message);
        }
        res.status(200).json({ message: template.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getFabricSamples = async (req,res) => {
    try{
        let samples = await adminService.getFabricSamples(req.body);
        if(samples.status === -1){
            throw new Error(samples.message);
        }
        res.status(200).json({message: samples.message,data: samples.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.updateSubAdmin = async (req,res) => {
    try{
        let subAdmin = await adminService.updateSubAdmin(req.body);
        if(subAdmin.status === -1){
            throw new Error(subAdmin.message);
        }
        res.status(200).json({message: subAdmin.message,data: subAdmin.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getModel = async (req,res) => {
    try{
        let model = await adminService.getModel(req.body);
        if(model.status == -1){
            throw new Error(model.message);
        }
        res.status(200).json({message: model.message,data: model.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};
exports.getrating = async (req,res) => {
    try{
        let rating = await adminService.getrating(req.body);
        if(rating.status == -1){
            throw new Error(rating.message);
        }
        res.status(200).json({message: rating.message,data: rating.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getRewardsUsers = async (req,res) => {
    try{
        let users = await adminService.getRewardsUsers(req.body);
        if(users.status == -1){
            throw new Error(users.message);
        }
        res.status(200).json({message: users.message,data: users.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getPaymentRecords = async (req,res) => {
    try{
        let payments = await adminService.getPayments(req.body);
        if(!payments.status == -1){
            throw new Error(payments.message);
        }
        res.status(200).json({message: payments.message, data: payments.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getUserPayments = async (req,res) => {
    try{
        let payments = await adminService.getUserPayments(req.body);
        if(!payments.status == -1){
            throw new Error(payments.message);
        }
        res.status(200).json({message: payments.message, data: payments.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.autoSchedule = async (req,res) => {
    try{
        let schedule = await adminService.setPaymentSchedule(req.body);
        if(!schedule.status == -1){
            throw new Error(schedule.message);
        }
        res.status(200).json({message: schedule.message, data: schedule.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.setCommision = async (req,res) => {
    try{
        let commission = await adminService.setCommision(req.body);
        if(!commission.status == -1){
            throw new Error(commission.message);
        }
        res.status(200).json({message: commission.message, data: commission.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getCities = async (req,res) => {
    try{
        let cities = await adminService.getCities();
        if(cities.status == -1){
            throw new Error(cities.message);
        }
        res.status(200).json({message: cities.message, data: cities.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getCommission = async (req,res) => {
    try{
        let commission = await adminService.getCommission(req.body);
        if(!commission.status == -1){
            throw new Error(commission.message);
        }
        res.status(200).json({message: commission.message, data: commission.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getAllCommission = async (req,res) => {
    try{
        let commission = await adminService.getAllCommission();
        if(!commission.status == -1){
            throw new Error(commission.message);
        }
        res.status(200).json({message: commission.message, data: commission.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
}
exports.getTailorPayments = async (req,res)=>{
    try{
        let commission = await adminService.getTailorPayments(req.body);
        if(!commission.status == -1){
            throw new Error(commission.message);
        }
        res.status(200).json({message: commission.message, data: commission.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.payAmountToTailor = async (req,res)=>{
    try{
        let payAmount = await adminService.payAmountToTailor(req.body);
        if(!payAmount.status == -1){
            throw new Error(payAmount.message);
        }
        res.status(200).json({message: payAmount.message, data: payAmount.data});
    }catch(err){
        res.status(403).json({message:err.message});
    }
};

exports.getCompletePayments = async (req,res)=>{
    try{
        let payAmount = await adminService.getCompletePayments(req.body);
        if(!payAmount.status == -1){
            throw new Error(payAmount.message);
        }
        res.status(200).json({message: payAmount.message, data: payAmount.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getUstaadList = async (req,res) => {
    try{
        let payAmount = await adminService.getUstaadList();
        if(!payAmount.status == -1){
            throw new Error(payAmount.message);
        }
        res.status(200).json({message: payAmount.message, data: payAmount.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getremainingUstaadPrice = async (req,res) => {
    try{
        let payAmount = await adminService.getremainingUstaadPrice(req.body);
        if(!payAmount.status == -1){
            throw new Error(payAmount.message);
        }
        res.status(200).json({message: payAmount.message, data: payAmount.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.paidUstaad = async (req,res) => {
    try{
        let paid = await adminService.priceUstaad(req.body);
        if(!paid.status == -1){
            throw new Error(paid.message);
        }
        res.status(200).json({message: paid.message});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getAdminCommissionList = async (req,res) => {
    try{
        let commission = await adminService.getAdminCommissionList(req.body);
        if(!commission.status == -1){
            throw new Error(commission.message);
        }
        res.status(200).json({message: commission.message , data: commission.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
};

exports.getRevenueList = async (req,res) => {
    try{
        let revenue = await adminService.getRevenueList(req.body);
        if(!revenue.status == -1){
            throw new Error(revenue.message);
        }
        res.status(200).json({message: revenue.message , data: revenue.data});
    }catch(err){
        res.status(403).json({message: err.message});
    }
}