import jwt from "jsonwebtoken";
import { OPTIONS } from "../constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // console.log("username: ", username, fullname, email, password);

    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)coverImageLocalPath = req.files.coverImage[0].path
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // console.log("username: ", username, fullname, email, password);

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

const loginUser = asyncHandler( async (req, res) => {
    // 1. get user details from frontend()
    // 2. validation - not empty
    // 3. check if user exists by email or username
    // 4. then check if the given password is correct in db
    // 5. then create access and refresh token, and store refresh token in db encrypt
    // 6. send cookies(access and refresh token)

    //* 1. get user details from frontend()
    const {username, email, password} = req.body;

    //* 2. validation - not empty
    if(!username && !email) {
        throw new ApiError(400, "usernames or email is required");
    }

    //* 3. check if user exists by email or username
    const user = await User.findOne({
        $or: [{username}, {email}]
    });
    if(!user) {
        throw new ApiError(404, "User does not exist");
    }

    //* 4. then check if the given password is correct in db
    const passwordValid = user.isPasswordCorrect(password);
    if(!passwordValid) {
        throw new ApiError(401, "Invalid User credentials");
    }

    //* 5. creating access and refresh token, and saving refresh token in db
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);

    //* 6. send cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken", accessToken, OPTIONS)
    .cookie("refreshToken", refreshToken, OPTIONS)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    //* first we have to clear cookies(which contain access and refresh token)
    //* from database we have to clear our refresh token also

    // console.log(req.user);

    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", OPTIONS)
    .clearCookie("refreshToken", OPTIONS)
    .json(new ApiResponse(200, {}, "User logged Out"))
    
})

const refereshAccessToken = asyncHandler( async (req, res) => {
    const currentRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!currentRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {
        const decodeToken = jwt.verify(currentRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodeToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(user.refreshToken !== currentRefreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const {accessToken, refreshToken} = generateAccessAndRefereshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, OPTIONS)
        .cookie("refreshToken", refreshToken, OPTIONS)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})



export {
    loginUser,
    logoutUser,
    registerUser,
    refereshAccessToken,
};