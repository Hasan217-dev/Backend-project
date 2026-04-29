import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req , res)=>{
    
    const {username , fullName , email , password} = req.body
    
    if(
        [username , fullName , email , password].some((field)=> field?.trim() === "")
    ) {
        throw new ApiError(400 , "All fileds are required")
    } 

   const existedUser = User.findOne({
     $or : [{ email } , { username }]
   })
   if(existedUser) {
    throw new ApiError(409 , "User with email or username already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path

   if(!avatarLocalPath){
    throw new ApiError(400 , "Avatar file is required")
   }


  const avatar  = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400 ,  "Avatar file is required")
  }

 const user = await User.created({
    fullName ,
    avatar : avatar.url ,
    coverImage : coverImage?.url || "" ,
    email ,
    password ,
    username : username.toLowerCase()
 })
  const createdUser = await User.findById(user._id).selectt("-password refreshToken")

  if(!createdUser){
    throw new ApiError(500 , "Something went wrong while registration a user")
  }

  return res.status(201).json(
    new ApiResponse(200 , createdUser , "User register successfully")
  )

})

export {registerUser}


// 1- Get user details from frontend
// 2- validation - not empty
//3- check if the user already exists : username , email
//4- check for images , check for avatar
//5- upload them to cloudinary
//6- created user object - create entry ion db
//7- removed password and refresh token filed from response
//8- check for user creation , retun res