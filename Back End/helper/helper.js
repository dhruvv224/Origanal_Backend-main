const bcrypt = require('bcrypt');
module.exports = {
    commonQuery: async function (model, query, data, update = {}, select = "", populate = null, perPage, page) {
        try {
            let res;
            switch (query) {
                case "find":
                    res = await model.find(data);
                    break;
                case "findPopulate":
                    res = await model.find(data).populate(populate);
                    break;
                case "findPopulatePagination":
                    res = await model.find(data).sort(update).populate(populate).limit(perPage).skip(perPage * (page - 1)).select(select);
                    break;
                // case "findPopulatePagination":
                //     res = await model.find(data).sort(update).populate(populate).limit(perPage).skip(perPage * (page - 1));
                //     break;
                case "findOne":
                    res = await model.findOne(data).select(select).populate(populate);
                    break;
                case "create":
                    res = await model.create(data);
                    break;
                case "findOneAndUpdate":
                    res = await model.findOneAndUpdate(data, update, { new: true }).select(select);
                    break;
                case "upsert":
                    res = await model.findOneAndUpdate(data, update, { upsert: true, new: true });
                    break;
                case "deleteOne":
                    res = await model.deleteOne(data);
                    break;
                case "findSort":
                    res = await model.find(data).sort(update).select(select);
                    break;
                case "countDocuments":
                    res = await model.find(data).countDocuments();
                    break;
            }

            if (!res || !data) {
                return {
                    status: 2,
                    message: "Error, please try again."
                }
            } else {
                return {
                    status: 1,
                    data: res
                }
            }
        } catch (error) {
            return {
                status: 0,
                error: error
            }
        }
    },
    createBcryptPassword: async function (password) {
        try {
            let hash_password = await bcrypt.hash(password, 10);
            return hash_password;
        } catch (err) {
            return {
                status: 0,
                message: "Error, please try again"
            };
        }
    },
    checkBcryptPassword: async function (password, savedPassword) {
        try {
            let is_match = await bcrypt.compare(password, savedPassword);
            if (!is_match) {
                return { status: 2, message: 'password do not match.' };
            } else {
                return { status: 1, message: 'Welcome to Project.' };
            };
        } catch (err) {
            return {
                status: 0,
                message: "password do not match"
            };
        }
    }
}