import { Router } from "express"
import { autharication } from "../middleware/auth.middleware.js"
import { addRatingAndReview } from "../control/ratingAndReview.controll.js"
import { ratingAndReviewModel } from "../model/ratingAndreview.model.js"
import { deleteMiddleware, getMiddleware } from "../middleware/query.midlleware.js"
import { excuteMiddleware } from "../middleware/excute.middleware.js"
import { filterMiddleware } from "../middleware/feature.middleware.js"

const ratingAndReviewRoter = Router({mergeParams:true})
ratingAndReviewRoter.post("/",autharication,addRatingAndReview)
ratingAndReviewRoter.delete("/",autharication,deleteMiddleware(ratingAndReviewModel),excuteMiddleware)
ratingAndReviewRoter.delete("/:id",autharication,deleteMiddleware(ratingAndReviewModel),filterMiddleware("id","_id"),excuteMiddleware)
ratingAndReviewRoter.get("/",getMiddleware(ratingAndReviewModel),filterMiddleware("userId","id"),excuteMiddleware)

export{ratingAndReviewRoter}