const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const multer = require("multer");
const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const { GridFsStorage } = require("multer-gridfs-storage");
const Attachement = require("./Attachement.model");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const mongoURI = "mongodb://root:root@localhost:27017";
const conn = mongoose.createConnection(mongoURI);


let gfs;
conn.once("open", () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
});

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
        .catch(() => {
          res.status(500).json({
            message: "Error uploading File",
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