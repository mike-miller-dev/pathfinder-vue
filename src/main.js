import { createApp } from 'vue'
import App from './App.vue'
import Toast from "vue-toastification";

import './assets/main.css'
import "vue-toastification/dist/index.css";


const app = createApp(App);
const options = {
    // You can set your default options here
};



app.use(Toast, options).mount('#app')
