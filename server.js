const aws = require('aws-sdk');
const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const cors = require('cors');

const s3 = new aws.S3({
  secretAccessKey: process.env.SECRET_KEY,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION
});

const app = express();
app.use(cors());

const upload = multer({
  storage: multerS3({
    s3: s3,
    acl: 'public-read',
    bucket: 'ts-image-upload-test',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function(req, file, callback) {
      callback(
        null,
        `${file.originalname.split('.')[0]}-${Date.now().toString()}${path.extname(
          file.originalname
        )}`
      );
    }
  })
});

const singleUpload = upload.single('image');

app.post('/upload', function(req, res) {
  console.log('Uploading...');
  singleUpload(req, res, function(err, some) {

    if (err) {
      console.error(err);
      return res.status(422).send({
        errors: [{ title: 'Image Upload Error', detail: err.message }]
      });
    }

    console.log('Uploaded -- ', req.file.location);
    return res.json({ url: req.file.location });
  });
});

app.listen(4200);
