// Display page logic: render a real-time carousel of dishes

import { db, firebaseReady } from '../firebase-config.js';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// DOM elements
const slidesRoot = document.getElementById('slides');
const carouselEl = document.getElementById('carousel');
const updateBadge = document.getElementById('updateBadge');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Local state
let dishes = [];
let currentIndex = 0;
let timerId = null;
const INTERVAL = 4500; // ms

// Dummy data for preview if Firebase not configured
const dummyDishes = [
  {
    name: 'Spicy Paneer Tikka',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-431972db9adb?q=80&w=1600&auto=format&fit=crop',
    createdAt: new Date()
  },
  {
    name: 'Classic Margherita Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=1600&auto=format&fit=crop',
    createdAt: new Date()
  },
  {
    name: 'Berry Cheesecake',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600&auto=format&fit=crop',
    createdAt: new Date()
  }
];

function renderSlide(idx) {
  if (!dishes.length) return;
  const dish = dishes[idx % dishes.length];

  slidesRoot.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'relative w-full h-full slide-enter';

  const img = document.createElement('img');
  img.src = dish.imageUrl;
  img.alt = dish.name;
  img.loading = 'lazy';
  img.className = 'absolute inset-0 w-full h-full object-cover';

  const overlay = document.createElement('div');
  overlay.className = 'absolute bottom-0 left-0 right-0 p-4 md:p-6 card-overlay';

  const name = document.createElement('div');
  name.className = 'text-white/95 text-xl md:text-3xl font-semibold drop-shadow-lg';
  name.textContent = dish.name || 'Untitled Dish';

  overlay.appendChild(name);
  wrapper.appendChild(img);
  wrapper.appendChild(overlay);
  slidesRoot.appendChild(wrapper);
}

function startAutoPlay() {
  stopAutoPlay();
  timerId = setInterval(() => {
    currentIndex = (currentIndex + 1) % Math.max(dishes.length, 1);
    renderSlide(currentIndex);
  }, INTERVAL);
}

function stopAutoPlay() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function showBadge() {
  updateBadge.classList.remove('hidden');
  setTimeout(() => updateBadge.classList.add('hidden'), 2000);
}

function initRealtime() {
  if (!firebaseReady) {
    dishes = dummyDishes.slice();
    currentIndex = 0;
    renderSlide(currentIndex);
    startAutoPlay();
    return;
  }

  const q = query(collection(db, 'dishes'), orderBy('createdAt', 'desc'));
  let firstLoad = true;

  onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

    // Sort client-side newest first; display still loops through all
    dishes = items.reverse(); // show oldest to newest in sequence

    if (firstLoad) {
      firstLoad = false;
      currentIndex = 0;
      renderSlide(currentIndex);
      startAutoPlay();
    } else {
      // Attempt to keep current index at the same dish name if possible
      currentIndex = currentIndex % Math.max(dishes.length, 1);
      showBadge();
    }
  }, (err) => {
    console.error('onSnapshot error', err);
    // Fallback to dummy
    if (!dishes.length) {
      dishes = dummyDishes.slice();
      currentIndex = 0;
      renderSlide(currentIndex);
      startAutoPlay();
    }
  });
}

// Controls
nextBtn?.addEventListener('click', () => {
  stopAutoPlay();
  currentIndex = (currentIndex + 1) % Math.max(dishes.length, 1);
  renderSlide(currentIndex);
  startAutoPlay();
});

prevBtn?.addEventListener('click', () => {
  stopAutoPlay();
  currentIndex = (currentIndex - 1 + Math.max(dishes.length, 1)) % Math.max(dishes.length, 1);
  renderSlide(currentIndex);
  startAutoPlay();
});

fullscreenBtn?.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      if (carouselEl?.requestFullscreen) {
        await carouselEl.requestFullscreen();
        fullscreenBtn.textContent = 'Exit Fullscreen';
      } else if (slidesRoot?.requestFullscreen) {
        await slidesRoot.requestFullscreen();
        fullscreenBtn.textContent = 'Exit Fullscreen';
      } else {
        await document.documentElement.requestFullscreen();
        fullscreenBtn.textContent = 'Exit Fullscreen';
      }
    } else {
      await document.exitFullscreen();
      fullscreenBtn.textContent = 'Fullscreen';
    }
  } catch (e) {
    console.warn('Fullscreen not supported', e);
  }
});

// Initialize
initRealtime();
