const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const webpush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const serviceAccount = require('./pwagram-fb-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagram-e7d99.firebaseio.com/',
});

exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    admin
      .database()
      .ref('posts')
      .push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image,
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
          .json({message: 'Data stored', id: request.body.id});
      })
      .catch(err => response.status(500).json({error: err}));
  });
});
