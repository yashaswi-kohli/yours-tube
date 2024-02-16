import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //cloudnary url
            required: true,
        },
        coverimage: {
            type: String, //cloudnary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

//* this is a middleware which will be used, when data is just going to be saved (that's why we use "pre") there are another also pas and many. Secondly we have use "save", which means to use this middleware just before saving the data, and then we have used callback func

//! we cannot use this () => {}, for callback coz there are errors facing when we use "this" keyword in arrow func,
//Todo  		that's why function(){}

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcypt.hash(this.password, 10);
    }

    //* now we have completed our work, so lets return to next task or middleware & for that we will use next

    next();
});

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function() {
    return jwt.sign(
        {
            _id: this.id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function() {
    return jwt.sign(
        {
            _id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}

export const User = mongoose.model("User", userSchema);
