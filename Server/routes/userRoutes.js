import express from "express";
import { getUserData, storeRecentSearchedCities } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRouter=express.Router();

userRouter.get('/',protect,getUserData);
userRouter.post('/store-recent-search',protect,storeRecentSearchedCities);


export default userRouter;
