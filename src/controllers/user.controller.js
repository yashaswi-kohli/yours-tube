import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler( async (req, res) => {
    const {username, fullname, email, password} = req.body;

    //*  we can check one by one
    // if(fullname === "") {
    //     throw new ApiError(400, "fullname is required")
    // }

    //* or we can do something like this
    if(
        [username, fullname, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(404, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)coverImageLocalPath = req.files.coverImage[0].path
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // console.log("before cloudinary");

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // console.log("after cloudinary");

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required hmm")
    }

    const user = await User.create({
        email,
        fullname,
        username: username.toLowerCase(),
        password, 
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    // console.log("user: ", user);

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

export {registerUser};