import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {Video} from "../models/video.model.js"
import mongoose, {Mongoose, isValidObjectId} from "mongoose"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const pipeline = [];
    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        });
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    //* fetch videos only that are set isPublished as true
    pipeline.push({ $match: { isPublished: true } });

    //? sortBy can be views, createdAt, duration
    //* sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = await Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { title, description} = req.body;
        const videoPath = req.files?.video[0].path;
        const thumbnailPath = req.files?.thumbnail[0].path;
        
        if(!videoPath) throw new ApiError(400, "Video is required");
        if(!thumbnailPath) throw new ApiError(400, "Thumbnail is required");
    
        const uploadVideo = await uploadOnCloudinary(videoPath);
        if(!uploadVideo) throw new ApiError(400, "Video does not get uploaded in cloudinary");
        
        const uploadThumbnail = await uploadOnCloudinary(thumbnailPath);
        if(!uploadThumbnail) {
            throw new ApiError(400, "Thumbnail does not get uploaded in cloudinary");
        }
    
        const video = await User.create({
            title,
            description,
            owner: userId,
            videofile: uploadVideo.url,
            thumbnail: uploadThumbnail.url,
            duration: uploadVideo.duration,
            cloudinaryVideoID: uploadVideo.public_id,
            cloudinaryThumbnailID: uploadThumbnail.public_id,
        });
    
        if (!video)
          throw ApiError(500, "Something went wrong while uploading on db");
    
    
        return res.status(201).json(
            new ApiResponse(200, video, "Success")
        );
    } 
    catch (error) {
        throw new ApiError(400, e.message);
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const idValid = isValidObjectId(videoId);
    if(!idValid) throw new ApiError(400, "Invalid video id");

    const userValid = isValidObjectId(req.user?._id);
    if(!userValid) throw new ApiError(400, "Invalid user id");

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ]);

    if(!video) throw new ApiError(500, "Failed to fetch video");

    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "video details fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body;

    const valid = isValidObjectId(videoId);
    if(!valid) throw new ApiError(400, "Invalid Video Id");

    if (!(title && description)) {
        throw new ApiError(400, "title and description are required");
    }

    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(404, "No video found")

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You can't delete this video as you are not the owner");
    }

    const newThumbnailPath = req.file?.path;
    if(!newThumbnailPath) throw new ApiError(400, "thumbnail is required");

    const thumbnail = await uploadOnCloudinary(newThumbnailPath);
    if(!thumbnail) throw new ApiError(400, "Thumbnail does not get uploaded in cloudinary");

    const updated = await Video.findByIdAndUpdate(
        videoId,
        {
            title,
            description,
            thumbnail: {
                public_id: thumbnail.public_id,
                url: thumbnail.url
            }
        },
        {new: true}
    );

    if(!updated) {
        throw new ApiError(500, "Failed to update video details in db")
    }

    const checkDelete = await deleteFromCloudinary(video.thumbnail.public_id);
    if (!checkDelete) throw new ApiError(400, "Failed to delete thumbnail from cloudinary");

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Video updated successfully"))
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const valid = isValidObjectId(videoId);
    if(!valid) throw new ApiError(400, "Invalid VideoId")

    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(400, "Video not found")

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You can't delete this video as you are not the owner");
    }

    const deleteVideo = await Video.findByIdAndDelete(videoId);
    if(!deleteVideo) throw new ApiError(400, "Failed to delete the video please try again");


    const videoFile = await deleteFromCloudinary(video.videoFile.public_id);
    if (!videoFile) throw new ApiError(400, "Failed to delete video from cloudinary");

    const thumbnail = await deleteFromCloudinary(video.thumbnail.public_id);
    if (!thumbnail) throw new ApiError(400, "Failed to delete thumbnail from cloudinary");


    const deleteLikes = await Like.deleteMany({ video: videoId })
    if (!deleteLikes) throw new ApiError(400, "Failed to delete likes from mongodb");

    const deleteComments = await Comment.deleteMany({ video: videoId })
    if (!deleteComments) throw new ApiError(400, "Failed to delete likes from mongodb");

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Video deleted successfully")
        );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const valid = isValidObjectId(videoId);
    if(!valid) throw new ApiError(400, "Invalid VideoId");

    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(400, "Video not found");

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You can't delete this video as you are not the owner");
    }

    const updateToggle = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        { new: true},
    )
    if(!updateToggle) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isPublished: updateToggle.isPublished },
                "Video publish toggled successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}