const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const webpush = require('web-push');
const formidable = require('formidable-serverless');
const fs = require('fs');
const UUID = require('uuid-v4');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const serviceAccount = require('./pwagram-fb-key.json');

const {Storage} = require('@google-cloud/storage');
const storage = new Storage({keyFilename: 'pwagram-fb-key.json'});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagram-e7d99.firebaseio.com/',
});

exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    const uuid = UUID();
    let formData = new formidable.IncomingForm();
    formData.parse(request, (err, fields, files) => {
      if (!err) {
        fs.rename(files.file.path, `/tmp/${files.file.name}`);
        let bucket = storage.bucket('pwagram-e7d99.appspot.com');
        bucket.upload(
          `/tmp/${files.file.name}`,
          {
            uploadType: 'media',
            metadata: {
              metadata: {
                contentType: files.file.type,
                firebaseStorageDownloadTokens: uuid,
              },
            },
          },
          (err, file) => {
            if (!err) {
              admin
                .database()
                .ref('posts')
                .push({
                  id: fields.id,
                  title: fields.title,
                  location: fields.location,
                  rawLocation: {
                    lat: fields.rawLocationLat,
                    lng: fields.rawLocationLng,
                  },
                  image: `https://firebasestorage.googleapis.com/v0/b/${
                    bucket.name
                  }/o/${encodeURIComponent(file.name)}?alt=media&token=${uuid}`,
                })
                .then(() => {
                  webpush.setVapidDetails(
                    'mailto:ajan.shresh@gmail.com',
                    'BPMh9Hdrri8tao7OUshwND1y98BYJmRoxDEcbtZ4MJN3MITRPTo2u7YCRO7PFWbgtqzjpS_uH4vaGIsx1BNEvs8',
                    functions.config().pwagram.privatekey
                  );
                  return admin
                    .database()
                    .ref('subscriptions')
                    .once('value');
                })
                .then(subscriptions => {
                  subscriptions.forEach(sub => {
                    const pushConfig = {
                      endpoint: sub.val().endpoint,
                      keys: {
                        auth: sub.val().keys.auth,
                        p256dh: sub.val().keys.p256dh,
                      },
                    };
                    webpush
                      .sendNotification(
                        pushConfig,
                        JSON.stringify({
                          title: 'New Post',
                          content: 'New Post added',
                          openUrl: '/help',
                        })
                      )
                      .catch(err => console.error(err));
                  });
                  return response
                    .status(201)
                    .json({message: 'Data stored', id: fields.id});
                })
                .catch(err => response.status(500).json({error: err}));
            } else {
              console.error(err);
            }
          }
        );
      } else {
        console.error(err);
      }
    });
  });
});
