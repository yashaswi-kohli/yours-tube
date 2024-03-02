import mongoose, {Schema} from "mongoose";

//* yashy subscribe to chai&code
const subscriptionSchema = new Schema(
    {
        subscriber: {  //* the one who is subscribing   (yashy)
            type: Schema.Types.ObjectId,
            ref: "Users"
        },
        channedl: {    // * the channel name who is it's subscrbing to    (chai&code)
            type: Schema.Types.ObjectId,
            ref: "Users"
        },
    },
    {
        timestamps: true,
    }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema);