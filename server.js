const express = require("express");
const fs = require("fs");
const multer = require("multer");
const session = require("express-session");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(session({
  secret: "kirby-secret",
  resave: false,
  saveUninitialized: false
}));

app.use("/uploads", express.static("uploads"));
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

const load = f => JSON.parse(fs.readFileSync(f,"utf8"));
const save = (f,d) => fs.writeFileSync(f,JSON.stringify(d,null,2));

/* 🔐 ログイン */
app.post("/login",(req,res)=>{
  const {username,password} = req.body;
  const users = load("users.json");
  const user = users.find(u=>u.username===username && u.password===password);
  if(!user) return res.json({error:"ログイン失敗"});
  req.session.user = user;
  res.json({ok:true});
});

app.get("/me",(req,res)=>{
  res.json(req.session.user || null);
});

/* 🖼 画像＋コメント投稿 */
app.post("/post", upload.single("image"), (req,res)=>{
  if(!req.session.user) return res.sendStatus(403);

  const data = load("comments.json");

  data.push({
    id: crypto.randomUUID(),
    user: req.session.user.username,
    plan: req.session.user.plan,
    comment: req.body.comment,
    image: req.file?.filename || null,
    time: Date.now()
  });

  save("comments.json",data);
  res.json({ok:true});
});

/* 💬 取得 */
app.get("/comments",(req,res)=>{
  res.json(load("comments.json").slice(-30));
});

/* ⬇ ダウンロード（有料チェック） */
app.get("/download/:file",(req,res)=>{
  if(!req.session.user) return res.sendStatus(403);
  if(req.session.user.plan!=="paid"){
    return res.status(403).send("有料版限定です");
  }
  res.download(path.join(__dirname,"uploads",req.params.file));
});

app.listen(3000,()=>console.log("http://localhost:3000"));
