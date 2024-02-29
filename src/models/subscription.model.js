import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "Users"
        },
        channedl: {
            type: Schema.Types.ObjectId,
            ref: "Users"
        },
    },
    {
        timestamps: true,
    }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema);