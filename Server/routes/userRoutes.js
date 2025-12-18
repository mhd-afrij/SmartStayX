import express from "express";
import { getUserData, storeRecentSearchedCities } from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const userRouter=express.Router();

userRouter.get('/',protect,getUserData);
userRouter.post('/store-recent-search',protect,storeRecentSearchedCities);


export default userRouter;
