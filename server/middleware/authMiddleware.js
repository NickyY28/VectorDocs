import jwt from "jsonwebtoken";

const authMiddleware = (req,res,next) =>{
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({message: "No token provided"});
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;  //attaching user to request so that every route after this knows which user is making the request
        next();
    } catch (error) {
        return res.status(401).json({message : "Invalid or expired token"});
    }
};

export default authMiddleware;