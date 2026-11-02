const jwt=require("jsonwebtoken");
function requireAuth(req,res,next){const token=req.cookies.cineworld_token||(req.headers.authorization||"").replace(/^Bearer\s+/,"");if(!token)return res.status(401).json({message:"Please log in first."});try{req.user=jwt.verify(token,process.env.JWT_SECRET);next();}catch{return res.status(401).json({message:"Session expired. Please log in again."});}}
function requireAdmin(req,res,next){if(req.user?.role!=="admin")return res.status(403).json({message:"Admin access required."});next();}
module.exports={requireAuth,requireAdmin};

