import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

    const keyword = req.query.keyword || "";
    const query = {
        $or: [
            { title: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } },
        ]
    };

    const videos = await Video.find(query)
        .sort({ createdAt: -1 })

    if (!videos) {
        throw new ApiError(404, "Videos not found")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, videos, "Videos fetched successfully")
        )


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title && !description) {
        throw new ApiError(400, "title and description is required")
    }

    const localFilePath = (req.files?.thumbnail[0]?.path);

    if (!localFilePath) {
        throw new ApiError(400, "thumbnail is required")
    }

    const localVideoPath = (req.files?.videoFile[0]?.path)

    const thumbnail = await uploadOnCloudinary(localFilePath)
    const videoFile = await uploadOnCloudinary(localVideoPath)


    if (!thumbnail && !videoFile) {
        throw new ApiError(400, "thumbnail and video file is required")
    }


    const createdVideo = await Video.create({
        title,
        description,
        thumbnail: thumbnail?.secure_url,
        videoFile: videoFile?.secure_url,
        duration: Math.ceil(videoFile?.duration),
        isPublished: thumbnail?.secure_url && videoFile?.secure_url ? true : false
    })

    if (!createdVideo) {

        throw new ApiError(400, "something went wrong while uploading video")
    }

    return res.status(201).json(
        new ApiResponse(200, createdVideo, "Video uploaded successfully")
    )

})



const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    return res
        .status(201)
        .json(new ApiResponse(202, video, "Video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    const { description } = req.body
    const localFilePath = req.file?.path


    if (!description && !localFilePath) {
        throw new ApiError(400, "All fields all required")
    }

    const thumbnail = await uploadOnCloudinary(localFilePath)

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                description,
                thumbnail: thumbnail?.secure_url
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video Update Successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deleteVideo){
        throw new ApiError(404, "Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, deleteVideo, "Video delete successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    console.log(video);
    

    video.isPublished = !video.isPublished

    await video.save()

    return res
    .status(200)
    .json( new ApiResponse(200, video, "Pbblish status toggle successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
