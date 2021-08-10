const ustaadService = require('../services/ustaad.services');

exports.loginSubAdmin = async (req, res) => {
    try {
        let userData = await ustaadService.loginSubAdmin(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        // if (userData.status == 0) {
        //     let userData = await ustaadService.createAdmin(req.body);
        //     if (userData.status == -1) {
        //         throw new Error(userData.message);
        //     }
        //     res.status(200).json({ response: userData.data, message: "Login Successfully" });
        // }
        res.status(200).json({ response: userData.data, message: "Login Successfully" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.addCity = async (req, res) => {
    try {
        let city = await ustaadService.addCity(req.body);
        if (city.status == -1) {
            throw new Error(city.message);
        }
        res.status(200).json({ message: city.message, data: city.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.addCountry = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.countryFlag != undefined || req.files.countryFlag != null) {
                req.body.countryFlag = req.files.countryFlag[0].location ? req.files.countryFlag[0].location : ''
            }

        }
        let city = await ustaadService.addCountry(req.body);
        if (city.status == -1) {
            throw new Error(city.message);
        }
        res.status(200).json({ message: city.message, data: city.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }

};
exports.addSubAdmin = async (req, res) => {
    try {
        let subAdmin = await ustaadService.addSubAdmin(req.body);
        if (subAdmin.status == -1) {
            throw new Error(subAdmin.message);
        }
        res.status(200).json({ message: subAdmin.message, data: subAdmin.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getAllCity = async (req, res) => {

    try {
        let cities = await ustaadService.getAllCity();
        if (cities.status == -1) {
            throw new Error(cities.message);
        }
        res.status(200).json({ message: cities.message, data: cities.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};


exports.getAllFreeCities = async (req, res) => {
    try {
        let cities = await ustaadService.getAllFreeCities();
        if (cities.status == -1) {
            throw new Error(cities.message);
        }
        res.status(200).json({ message: cities.message, data: cities.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.deleteCityByid = async (req, res) => {
    try {

        let city = await ustaadService.deleteCityByid(req.body);
        if (city.status == -1) {
            throw new Error(city.message);
        }
        res.status(200).json({ message: city.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.blockAndUnblockCity = async (req, res) => {
    try {
        let city = await ustaadService.blockAndUnblockCity(req.body);
        if (city.status == -1) {
            throw new Error(city.message);
        }
        res.status(200).json({ message: city.message, data: city.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getAllCountry = async (req, res) => {
    try {
        let country = await ustaadService.getAllCountry();
        if (country.status == -1) {
            throw new Error(country.message);
        }
        res.status(200).json({ message: country.message, data: country.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};
exports.updateCountry = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.countryFlag != undefined || req.files.countryFlag != null) {
                req.body.countryFlag = req.files.countryFlag[0].location ? req.files.countryFlag[0].location : ''
            }
        }

        let country = await ustaadService.updateCountry(req.body);
        if (country.status == -1) {
            throw new Error(country.message);
        }
        res.status(200).json({ response: country.data, message: country.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.deleteCountryByid = async (req, res) => {

    try {
        let country = await ustaadService.deleteCountryByid(req.body);
        if (country.status == -1) {
            throw new Error(country.message);
        }
        res.status(200).json({ message: country.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }

};

exports.blockAndUnblockCountry = async (req, res) => {
    try {
        let country = await ustaadService.blockAndUnblockCountry(req.body);
        if (country.status == -1) {
            throw new Error(country.message);
        }
        res.status(200).json({ message: country.message, data: country.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getAllSubAdmins = async (req, res) => {
    try {
        let r = await ustaadService.getAllSubAdmins(req);
        res.status(200).send(r);

    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
};
exports.blockAndUnblockSubAdmins = async (req, res) => {
    try {
        let r = await ustaadService.blockAndUnblockSubAdmins(req.body);
        res.status(200).send(r);

    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
};
exports.deleteSubAdminsByid = async (req, res) => {
    try {
        let r = await ustaadService.deleteSubAdminsByid(req.body);

        res.status(200).send(r);

    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
};
exports.getsubAdminByid = async (req, res) => {
    try {
        let r = await ustaadService.getsubAdminByid(req.body);

        res.status(200).send(r);

    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
};

exports.registerSubAdminUser = async (req, res) => {
    try {
        let r = await ustaadService.registerSubAdmin(req.body);
        res.status(200).send(r);
    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
};

exports.generateUserIdPassword = async (req, res) => {
    try {

        let r = await ustaadService.generateUserIdPass(req.body);
        res.status(200).send(r);
    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
};
exports.checkGeneratedID = async (req, res) => {
    try {
        let r = await ustaadService.isGenerateUserIdExit(req.body);
        res.status(200).send(r);
    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
};

exports.getSubAdminList = async (req, res) => {
    try {
        let r = await ustaadService.subAdminList(req.body);
        res.status(200).send(r);
    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
}
exports.trackStatuSubAdmins = async (req, res) => {
    try {
        let r = await ustaadService.trackSubAdmins(req.body);
        res.status(200).send(r);
    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
}



exports.getTrackStatuById = async (req, res) => {
    try {
        let r = await ustaadService.getTrackingListById(req.body);
        res.status(200).send(r);
    } catch (err) {
        console.log("Error is : " + err);
        res.status(400).send(err);
    }
}


exports.addTimeSlot = async (req, res) => {
    try {
        let ustaad = await ustaadService.addTimeSlot(req.body, req.ustaadData);
        if (ustaad.status == -1) {
            throw new Error(ustaad.message);
        }
        res.status(200).json({ message: ustaad.message, data: ustaad.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getTimeSlots = async (req, res) => {
    try {
        let ustaad = await ustaadService.getTimeSlots(req.ustaadData);
        if (ustaad.status == -1) {
            throw new Error(ustaad.message);
        }
        res.status(200).json({ message: ustaad.message, data: ustaad.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getSlotsOfTime = async (req, res) => {
    try {
        let ustaad = await ustaadService.getSlotsOfTime(req.body, req.ustaadData);
        if (ustaad.status == -1) {
            throw new Error(ustaad.message);
        }
        res.status(200).json({ message: ustaad.message, data: ustaad.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.changeTimeAvalability = async (req, res) => {
    try {
        let ustaad = await ustaadService.changeTimeAvalability(req.body);
        if (ustaad.status == -1) {
            throw new Error(ustaad.message);
        }
        res.status(200).json({ message: ustaad.message, data: ustaad.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getAllStichings = async (req, res) => {
    try {
        let ustaad = await ustaadService.getAllStichings(req.ustaadData);
        if (ustaad.status == -1) {
            throw new Error(ustaad.message);
        }
        res.status(200).json({ message: ustaad.message, data: ustaad.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.addMeasurment = async (req, res) => {
    try {
        let measurement = await ustaadService.addMeasurment(req.body,req.ustaadData);
        if (measurement.status == -1) {
            throw new Error(measurement.message);
        }
        res.status(200).json({ message: measurement.message, data: measurement.data });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}