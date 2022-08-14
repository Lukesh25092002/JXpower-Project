/* This is a middle ware function and is a instance of multer
This object has ability to upload images and files which express in incapable of*/
const multer = require("multer");

const diskStorage = multer.diskStorage({
    destination: function(req,file,cb){
        console.log(file);
        cb(null,"../Public/Uploads");
    },
    filename: function(req,file,cb){
        cb(null,`${file.fieldname}_${Date.now()}`);
    }
});

const upload = multer({
    storage: diskStorage,
    fileFilter: function(req,file,cb){
        if(!file.mimetype.startsWith("image")){
            cb(new Error("This is not image! please upload an image only"));
            return;
        }
        cb(null,true);
    }
});

module.exports = upload;