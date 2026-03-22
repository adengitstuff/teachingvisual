import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database'


const firebaseConfig = {
  apiKey: "AIzaSyCwSf1gG_lge0qzw5U-tk19-VMdP86ybPc",
  authDomain: "teachvisual-fed50.firebaseapp.com",
  databaseURL: "https://teachvisual-fed50-default-rtdb.firebaseio.com",
  projectId: "teachvisual-fed50",
  storageBucket: "teachvisual-fed50.firebasestorage.app",
  messagingSenderId: "726122355072",
  appId: "1:726122355072:web:a9765d4d7a471030adc965"
};

const app = initializeApp(firebaseConfig);
export const realtimedb = getDatabase(app)