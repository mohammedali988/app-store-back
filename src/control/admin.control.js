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
            user
        });

    } catch (error) {
        res.status(error.status || 500).json({ 
            success: false,
            message: error.message || "Error updating user"
        });
    }
});

//check user active======================================================================
export const checkUserActive = async (req, res, next) => {
    if (!req.user.active) {
        return res.status(403).json({ message: "You count its not active, cant doing this process" });
    }
    next();
};

//list of users=========================================================================
export const getAllUsers = Errorhandler(async (req, res) => {
    try {
    
        const users = await userModel.find({ role: "user"}, { password: 0 });

        res.status(200).json({
            message: "Sucesses,to get users",
            data: users
        });

    } catch (error) {
        res.status(500).json({ message: "Error in get message", error });
    }
}
)

//get user by ID=================================================================
export const getUserById = Errorhandler(async (req, res) => {
    const { id } = req.params;

   

    const user = await userModel.findById(id, { password: 0 });

    if (!user) throw new sendError(404, "Error to find user");

    res.status(200).json({
        message: "sucesses",
        data: user
    });
});
