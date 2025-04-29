// Импорты из папки scripts/
import { Controller } from './scripts/controller.js';
import { Model } from './scripts/model.js';
import { View } from './scripts/view.js';
// import { ModalFactory } from './scripts/modal.factory.js';
// import { AchivesFactory } from './scripts/achives.factory.js';

// Импорт стилей
import './style.css';

// Импорт Firebase (если есть файлы в папке firebase/)
// import initFirebase from './firebase.js';

import { app, db } from '/src/firebase/config';
// import { collection, getDocs } from "firebase/firestore"; 

// const querySnapshot = await getDocs(collection(db, "users"));
// querySnapshot.forEach((doc) => {
//   console.log(`${doc.id} => ${doc.data()}`);
// });


// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  const view = new View();
  const model = new Model(view);
  const controller = new Controller(model, view);
  controller.init();
  view.hideLoaderAfterLoad();
});
