require("dotenv").config();
const express=require("express"), mongoose=require("mongoose"), cookieParser=require("cookie-parser"), path=require("path"), fs=require("fs");
const {EventEmitter}=require("events");
const app=express(), PORT=process.env.PORT||5000;
app.use("/api/payments/webhook",express.raw({type:"application/json"}));
app.use(express.json({limit:"100kb"})); app.use(express.urlencoded({extended:false})); app.use(cookieParser());
app.use(express.static(path.join(__dirname,"public")));
app.get("/api/health",(req,res)=>res.json({status:"ok",app:"CineWorld API"}));
app.use("/api/auth",require("./routes/auth"));
app.use("/api/movies",require("./routes/movies"));
app.use("/api/bookings",require("./routes/bookings"));
app.use("/api/payments",require("./routes/payments"));
app.use("/api/resale",require("./routes/resale"));
app.use((req,res)=>res.status(404).json({message:"Route not found"}));
app.use((err,req,res,next)=>{console.error(err);res.status(err.status||500).json({message:err.status?err.message:"Server error"});});
const events=new EventEmitter();
events.on("server-started",msg=>fs.appendFile(path.join(__dirname,"server-events.log"),`${new Date().toISOString()} ${msg}\n`,err=>err&&console.error(err)));
(async()=>{try{if(!process.env.MONGODB_URI||!process.env.JWT_SECRET)throw Error("Set MONGODB_URI and JWT_SECRET in .env");await mongoose.connect(process.env.MONGODB_URI);console.log("MongoDB connected");app.listen(PORT,()=>{console.log(`CineWorld: http://localhost:${PORT}`);events.emit("server-started",`Listening on ${PORT}`);});}catch(e){console.error("Startup failed:",e.message);process.exit(1);}})();

