let deferredPrompt;
let enableNotificationsButtons = document.querySelectorAll(
  '.enable-notifications'
);

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => console.log('Service worker registered.'));
}

window.addEventListener('beforeinstallprompt', event => {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotificaiton() {
  if ('serviceWorker' in navigator) {
    const options = {
      body: 'You successfully subscribed to our Notification service!',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US', // BCP 47
      vibrate: [100, 50, 200], // vibration pause vibration ...
      badge: '/src/images/icons/app-icon-96x96.png',
    };
    navigator.serviceWorker.ready.then(swreg => {
      swreg.showNotification('Successfully subscribed (from sw)', options);
    });
  }
}

function askForNotificationPermission() {
  Notification.requestPermission(result => {
    console.log(`User Choice ${result}`);
    if (result !== 'granted') {
      console.log('No notification permission granted!');
    } else {
      // Hide Button
      displayConfirmNotificaiton();
    }
  });
}

if ('Notification' in window) {
  enableNotificationsButtons.forEach(button => {
    button.style.display = 'inline-block';
    button.addEventListener('click', askForNotificationPermission);
  });
}
