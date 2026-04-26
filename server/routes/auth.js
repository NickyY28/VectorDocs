import express from "express";

const router = express.Router();

//test route
router.get("/", (req,res)=>{
    res.json({message:"auth route working"});
});

export default router;