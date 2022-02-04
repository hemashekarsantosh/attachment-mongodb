const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const multer = require("multer");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const { GridFsStorage } = require("multer-gridfs-storage");


let mongodb_connection_string = 'mongodb://127.0.0.1:27017/';

//take advantage of openshift env vars when available:
const DBUSER=process.env.DATABASE_USER;
const DBPASS= process.env.DATABASE_PASSWORD;


console.log('MONGODB URL'+process.env.OPENSHIFT_MONGODB_DB_HOST);
console.log('MONGODB USer'+process.env.DATABASE_USER);
console.log('MONGODB secret'+process.env.DATABASE_PASSWORD);

if(process.env.OPENSHIFT_MONGODB_DB_HOST){

  mongodb_connection_string = DBUSER+':'+DBPASS+'@'+process.env.OPENSHIFT_MONGODB_DB_HOST+':'+process.env.OPENSHIFT_MONGODB_DB_PORT+'/'+process.env.DATABASE_NAME;
  console.log('MONGODB URL'+mongodb_connection_string);
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const mongoURI = "mongodb://"+mongodb_connection_string;
const conn = await mongoose.createConnection(mongoURI);


let gfs;
conn.once("open", () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
});

const Attachement = require("./Attachement.model");

const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      bucketName: "test",
      filename: file.originalname,
    };
  },
});

let upload = null;

storage.on("connection", (db) => {
  upload = multer({ storage: storage }).single("file");
});

app.post("/api/file/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({
        message: "Error uploading File - " + err,
      });
    } else {
      const attachment = new Attachement({
        fileId: req.file.id,
        appName: req.body.appName,
        fileName: req.file.fileName,
        uploadedBy: req.body.uploadedBy,
        requestNo: req.body.requestNo,
      });
      attachment
        .save()
        .then(() => {
          res.json({ attachment: attachment });
        })
        .catch((err) => {
          res.status(500).json({
            message: "Error uploading File "+err,
          });
        });
    }
  });
});

app.get("/api/file/download/:id", (req, res) => {
  console.log(req.params.id);
  const fileId = new mongoose.mongo.ObjectId(req.params.id);
  gfs.collection("test");
  gfs.files.findOne({ _id: fileId }, (err, file) => {
    if (err) {
      res.status(401).json({
        message: "File Not found for Download",
      });
    } else if(file!=null){
      res.set('Content-Disposition', 'attachment; filename=' + file.filename);
      res.set("content-type", file.contentType);
    }
  });

  var gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "test",
  });
  var readstream = gridfsbucket.openDownloadStream(fileId);
  readstream.on("data", (chunk) => {
    res.write(chunk);
  });
  readstream.on("end", () => {
    res.status(200).end();
  });
  readstream.on("error", (err) => {
    console.log(err);
    res.status(500).json({
      message: "File download failed - " + err,
    });
  });
});

app.delete("/api/file/delete/:id", (req, res) => {
  const fileId = new mongoose.mongo.ObjectId(req.params.id);
  var gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "test",
  });
  gridfsbucket
    .delete(fileId)
    .then(() => {
      console.log("Deleted File successfully");
      res.json({
        message: "File deleted successfully",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        message: "File Deletion failed - " + err,
      });
    });
});

module.exports = app;
