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

let isTransitioning = false;

function renderSlide(idx, force = false) {
  // Prevent multiple transitions
  if (isTransitioning) return;
  
  if (!dishes.length) {
    console.log('No dishes to display');
    return;
  }
  
  // Don't re-render if it's the same slide and not forced
  const newIndex = idx % dishes.length;
  if (currentIndex === newIndex && !force) return;
  
  isTransitioning = true;
  currentIndex = newIndex;
  const dish = dishes[currentIndex];
  
  if (!dish || !dish.imageUrl) {
    console.error('Invalid dish data:', dish);
    isTransitioning = false;
    return;
  }

  // Create new slide wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'absolute inset-0 w-full h-full transition-opacity duration-500 opacity-0';
  
  // Create a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'absolute inset-0 flex items-center justify-center bg-black';
  loadingIndicator.innerHTML = '<div class="animate-pulse text-white">Loading...</div>';
  wrapper.appendChild(loadingIndicator);
  
  // Add the wrapper to the DOM first
  slidesRoot.innerHTML = '';
  slidesRoot.appendChild(wrapper);
  
  // Force a reflow to ensure the element is in the DOM
  void wrapper.offsetWidth;
  
  // Create image element
  const img = new Image();
  
  img.onload = function() {
    // Remove loading indicator
    wrapper.removeChild(loadingIndicator);
    
    // Clear any existing content
    wrapper.innerHTML = '';
    
    const isPortrait = img.naturalHeight > img.naturalWidth;
    
    // Toggle portrait mode class on carousel
    if (isPortrait) {
      carouselEl.classList.add('portrait-mode');
      
      // Create portrait container with side blurs
      const portraitContainer = document.createElement('div');
      portraitContainer.className = 'portrait-container';
      
      // Add image to portrait container
      const imgClone = img.cloneNode();
      imgClone.className = 'portrait-image';
      portraitContainer.appendChild(imgClone);
      wrapper.appendChild(portraitContainer);
    } else {
      carouselEl.classList.remove('portrait-mode');
      // For landscape, use standard image display
      const imgClone = img.cloneNode();
      imgClone.className = 'slide-image';
      wrapper.appendChild(imgClone);
    }
  
    // Create overlay with dish name
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    
    const name = document.createElement('div');
    name.className = 'text-white/95 text-xl md:text-3xl font-semibold drop-shadow-lg';
    name.textContent = dish.name || 'Untitled Dish';
    
    overlay.appendChild(name);
    wrapper.appendChild(overlay);
    
    // Fade in the new slide
    setTimeout(() => {
      wrapper.style.opacity = '1';
    }, 50);
    
    // Re-enable transitions
    setTimeout(() => {
      isTransitioning = false;
    }, 500);
  };
  
  // Handle image load errors
  img.onerror = function() {
    console.error('Failed to load image:', dish.imageUrl);
    
    // Show error message
    wrapper.innerHTML = `
      <div class="w-full h-full flex items-center justify-center bg-black text-white p-4 text-center">
        <div>
          <p class="text-xl font-medium mb-2">Image not available</p>
          <p class="text-sm opacity-75">${dish.name || 'Dish'}</p>
        </div>
      </div>
    `;
    
    // Still fade in the error message
    setTimeout(() => {
      wrapper.style.opacity = '1';
    }, 50);
    
    // Re-enable transitions
    setTimeout(() => {
      isTransitioning = false;
    }, 500);
  };
  
  // Start loading the image
  img.src = dish.imageUrl;
  img.alt = dish.name || 'Dish Image';
}

function startAutoPlay() {
  stopAutoPlay();
  if (dishes.length <= 1) return; // Don't auto-play if only one or no items
  
  timerId = setInterval(() => {
    const nextIndex = (currentIndex + 1) % dishes.length;
    renderSlide(nextIndex);
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

// Navigation functions
function goToNextSlide() {
  if (dishes.length <= 1) return;
  stopAutoPlay();
  const nextIndex = (currentIndex + 1) % dishes.length;
  renderSlide(nextIndex);
  startAutoPlay();
}

function goToPrevSlide() {
  if (dishes.length <= 1) return;
  stopAutoPlay();
  const prevIndex = (currentIndex - 1 + dishes.length) % dishes.length;
  renderSlide(prevIndex);
  startAutoPlay();
}

// Add event listeners for navigation
if (nextBtn) {
  nextBtn.addEventListener('click', goToNextSlide);
}

if (prevBtn) {
  prevBtn.addEventListener('click', goToPrevSlide);
}

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    goToNextSlide();
  } else if (e.key === 'ArrowLeft') {
    goToPrevSlide();
  }
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
