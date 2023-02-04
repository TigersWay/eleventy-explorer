import Alpine from 'alpinejs';
window.Alpine = Alpine;
Alpine.start();

import { render } from 'timeago.js';
render(document.querySelectorAll('[datetime]'));
