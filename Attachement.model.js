const mongoose = require("mongoose");

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