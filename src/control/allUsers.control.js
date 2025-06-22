import bcrypt from "bcrypt"
import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import { Errorhandler, sendError } from "../service/errorHandler.js"
import { sendEmail } from "../utils/nodemailer/nodemailer.utils.js"
import { userModel } from "../model/user.model.js"
import fs from 'fs';
import path from 'path';
import { updatedEmail } from "../utils/nodemailer/updatemessage.nodemailer.js"
dotenv.config()
//signup user=============================================================
export const signup = Errorhandler(async(req,res)=>{
    const {password} = req.body
      const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = bcrypt.hashSync(password,saltRounds)
    const signupResult = await userModel.create({...req.body,password:hashedPassword})
    if(!signupResult)throw new sendError(400,"Error in sign")
    //    await sendEmail(signupResult.email)
        res.status(200).json({
         message:"sucesses, verify your email", 
         data:signupResult  
    
        })
})

//log In user===============================================================
export const logIn = Errorhandler(async(req,res)=>{
    const {email,password}=req.body
    const loginResult = await userModel.findOne({email})
    if(!loginResult)throw new sendError (400,"Email Not Found")
    const isMatch= bcrypt.compareSync(password,loginResult.password)
    if(!isMatch)throw new sendError(400,"Error in login process")
        const token = jwt.sign({name:loginResult.name,email:loginResult.email,_id:loginResult._id,role:loginResult.role},process.env.SECRET_KEY)
        res.status(200).json({
            message:"sucesses",
            token
        })
})

//update password=============================================================
export const ubdatePassword = Errorhandler(async(req,res)=>{
    const {email}=req.docodedToken
    const{password}= req.body
    const hashedPassword = bcrypt.hashSync(password,+process.env.SALT_ROUNDS)
    const ubdateUser= await userModel.findOneAndUpdate({email},{password:hashedPassword})
    if(!ubdateUser)throw new sendError(400,"Error in ubdating password")
     res.status(200).json({
     message:"sucesses, to ubdate password",
     
     })
 })

 //get my count =====================================================
 export const getMyAccounnData = Errorhandler(async(req,res)=>{
    const {email}=req.docodedToken
    const myAccount= await userModel.findOne({email},{password:0})
    if(!myAccount)throw new sendError(400,"Error in get my account data")
       
     res.status(200).json({
     message:"sucesses",
     data : myAccount
     })
 })

//ubdate my Account=========================================================
// export const ubdateAccountData = Errorhandler(async (req, res) => {
//     const { email: oldEmail } = req.docodedToken;
//     const { email, phone, address, name } = req.body;

//     const user = await userModel.findOne({ email: oldEmail });
//     if (!user) throw new sendError(404, "User not found");

//     const updateFields = { email, phone, address, name };

//     if (req.file) {
//         const newImagePath = req.file.filename; 
//         if (user.Image) {
//             const oldImagePath = path.join("public", user.Image); 
            
//             if (fs.existsSync(oldImagePath)) {
//                 try {
//                     fs.unlinkSync(oldImagePath); 
//                 } catch (err) {
//                     console.error(" Error deleting old image:", err);
//                 }
//             }
//         }

//         updateFields.Image = newImagePath;
//     }

//     const updatedUser = await userModel.findOneAndUpdate(
//         { email: oldEmail },
//         updateFields,
//         { new: true }
//     );

//     if (!updatedUser) throw new sendError(400, "Error updating account data");

//     if (email && email !== oldEmail) {
//         updatedUser.active = true; 
//         await updatedEmail(email); 
//         await updatedUser.save(); 
//     }

//     res.status(200).json({
//         message: "Success",
//         data: updatedUser
//     });
// });
export const ubdateAccountData = Errorhandler(async (req, res) => {
  const { email: oldEmail } = req.docodedToken;
  const { email, phone, address, name } = req.body;

  const user = await userModel.findOne({ email: oldEmail });
  if (!user) throw new sendError(404, "User not found");

  const updateFields = { email, phone, address, name ,personalImages};

  const updatedUser = await userModel.findOneAndUpdate(
    { email: oldEmail },
    updateFields,
    { new: true }
  );

  if (!updatedUser) throw new sendError(400, "Error updating account data");

  if (email && email !== oldEmail) {
    updatedUser.active = true;
    await updatedEmail(email);
    await updatedUser.save();
  }

  res.status(200).json({
    message: "Success",
    data: updatedUser,
  });
});
