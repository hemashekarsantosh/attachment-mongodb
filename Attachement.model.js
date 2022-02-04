const mongoose = require("mongoose");
let mongodb_connection_string = 'mongodb://127.0.0.1:27017/';

//take advantage of openshift env vars when available:
const DBUSER=process.env.DATABASE_USER;
const DBPASS= process.env.DATABASE_PASSWORD;
if(process.env.OPENSHIFT_MONGODB_DB_HOST){

  mongodb_connection_string = DBUSER+':'+DBPASS+'@'+process.env.OPENSHIFT_MONGODB_DB_HOST+':'+process.env.OPENSHIFT_MONGODB_DB_PORT+'/'+process.env.DATABASE_NAME;
  console.log('MONGODB URL'+mongodb_connection_string);
}
const mongoURI = "mongodb://"+mongodb_connection_string;
mongoose.connect(mongoURI);

const Schema = mongoose.Schema;

const AttachmentSchema = new Schema({
    fileId: {
        type: Schema.Types.ObjectId
    },
    appName: {
        type: String
    },
    fileName: {
        type: String
    },
    uploadedBy: {
        type: String
    },
    requestNo:{
        type: String
    }
});

module.exports = AttachmentModel = mongoose.model('AttachmentModel', AttachmentSchema);