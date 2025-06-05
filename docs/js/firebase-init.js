(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyCmzJ4uB_b85aIz8WUNbwApB0ibhU78uEY",
    authDomain: "laboratorio-evcs.firebaseapp.com",
    projectId: "laboratorio-evcs",
    storageBucket: "laboratorio-evcs.firebasestorage.app",
    messagingSenderId: "53045134219",
    appId: "1:53045134219:web:e80d49f77f58870ac8e58e",
    measurementId: "G-R8M9D9H8XB"
  };

  if (window.firebase && !window.firebase.apps.length) {
    const app = firebase.initializeApp(firebaseConfig);
    window.firebaseAuth = firebase.auth();
    window.firebaseDB = firebase.firestore();
    console.log('Firebase inicializado');
  }
})();
