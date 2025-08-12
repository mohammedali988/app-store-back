import { settingModel } from "../model/settings.js";
import { userModel } from "../model/user.model.js";
import { Errorhandler, sendError } from "../service/errorHandler.js";

//admin make user not active=====================================================
export const toggleUserStatus = Errorhandler(async (req, res) => {
  try {
    const { id: userId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) throw new sendError(404, "User not found");

    user.active = !user.active;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User is now ${user.active ? "Active" : "Inactive"}`,
      user,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error updating user",
    });
  }
});

//check user active======================================================================
export const checkUserActive = async (req, res, next) => {
  if (!req.user.active) {
    return res
      .status(403)
      .json({ message: "You count its not active, cant doing this process" });
  }
  next();
};

//list of users=========================================================================
export const getAllUsers = Errorhandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await userModel
      .find({})
      .select("-password")
      .skip(skip)
      .limit(limit);

    const totalRows = await userModel.countDocuments({ role: "user" });
    const noOfPages = Math.ceil(totalRows / limit);

    res.status(200).json({
      message: "Success, to get users",
      data: users,
      meta: {
        totalRows,
        noOfPages,
        currentPage: page,
        perPage: limit,
        hasNext: page < noOfPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error in get users", error });
  }
});

//get user by ID=================================================================
export const getUserById = Errorhandler(async (req, res) => {
  const { id } = req.params;

  const user = await userModel.findById(id, { password: 0 });

  if (!user) throw new sendError(404, "Error to find user");

  res.status(200).json({
    message: "success",
    data: user,
  });
});

//admin change user role =====================================================
export const toggleUserRole = Errorhandler(async (req, res) => {
  try {
    const { id: userId } = req.params;

    const user = await userModel.findById(userId);
    if (!user) throw new sendError(404, "User not found");

    if (user.role === "admin") {
      user.role = "user";
      await user.save();
    } else if (user.role === "user") {
      user.role = "admin";
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: `User is now ${user.role}`,
      user,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error updating user role",
    });
  }
});

//  handle maintenance for the website

export const handleMaintenance = Errorhandler(async (req, res) => {
  try {
    const { status } = req.body;
    const settings = await settingModel.findOneAndUpdate(
      {},
      { isMaintenance: status },
      { new: true, upsert: true }
    );

    if (!settings) res.status(400).json("Some thing went wrong while updating");

    return res.status(200).json({ isMaintenance: settings.isMaintenance });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error updating the maintenance",
    });
  }
});

//get maintance==============================================

export const getMaintenance = Errorhandler(async (req, res) => {
  try {
    const setting = await settingModel.findOne();

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: "No maintenance settings found",
      });
    }

    return res.status(200).json({ isMaintenance: setting.isMaintenance });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error getting the maintenance status",
    });
  }
});

