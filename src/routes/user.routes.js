import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { loginUser, logoutUser, refereshAccessToken, registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(
    //* this is middleware
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
    
    registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT ,logoutUser);
router.route("/refresh-token").post(refereshAccessToken);

export default router;