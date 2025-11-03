// Admin page logic: upload dish name + image to Cloudinary and save metadata to Firestore

import { db, firebaseReady } from '../firebase-config.js';
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { cloudName, uploadPreset, cloudinaryEnabled } from '../cloudinary-config.js';

const form = document.getElementById('dishForm');
const nameInput = document.getElementById('dishName');
const categoryInput = document.getElementById('dishCategory');
const fileInput = document.getElementById('dishImage');
const uploadBtn = document.getElementById('uploadBtn');
const progress = document.getElementById('progress');
const warning = document.getElementById('firebaseWarning');
const dishList = document.getElementById('dishList');
const listStatus = document.getElementById('listStatus');

function setDisabled(disabled) {
  [nameInput, categoryInput, fileInput, uploadBtn].forEach(el => el.disabled = disabled);
}

function showWarning() {
  warning.classList.remove('hidden');
}

if (!firebaseReady || !cloudinaryEnabled) {
  if (!cloudinaryEnabled) {
    warning.textContent = 'Cloudinary config not set. Fill cloudinary-config.js to enable uploads.';
  }
  showWarning();
  setDisabled(true);
}

// Real-time list of dishes (no auth)
function renderList(items) {
  listStatus.textContent = `${items.length} item(s)`;
  dishList.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'rounded-xl overflow-hidden bg-white shadow group border border-slate-200';

    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.name;
    img.className = 'w-full h-40 object-cover';

    const body = document.createElement('div');
    body.className = 'p-3 flex items-start justify-between gap-2';

    const info = document.createElement('div');
    info.innerHTML = `
      <div class="font-medium text-slate-800 truncate" title="${item.name}">${item.name}</div>
      ${item.category ? `<div class="text-xs text-slate-500 mt-0.5">${item.category}</div>` : ''}
    `;

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn shrink-0 rounded-md bg-rose-600 text-white px-2 py-1 text-xs hover:bg-rose-500';
    delBtn.dataset.id = item.id;
    delBtn.textContent = 'Delete';

    body.appendChild(info);
    body.appendChild(delBtn);
    card.appendChild(img);
    card.appendChild(body);
    dishList.appendChild(card);
  });
}

if (firebaseReady) {
  const q = query(collection(db, 'dishes'), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    renderList(items);
  }, (err) => {
    console.error('List onSnapshot error', err);
    listStatus.textContent = 'Error loading list';
  });
}

// Delete handler (event delegation)
dishList?.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;
  const ok = confirm('Delete this dish?');
  if (!ok) return;
  try {
    await deleteDoc(doc(db, 'dishes', id));
  } catch (err) {
    console.error(err);
    alert('Failed to delete dish.');
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!firebaseReady) return;
  if (!cloudinaryEnabled) {
    alert('Cloudinary is not configured.');
    return;
  }

  const file = fileInput.files?.[0];
  const name = (nameInput.value || '').trim();
  const category = (categoryInput.value || '').trim();

  if (!name) {
    alert('Please enter a dish name.');
    return;
  }
  if (!file) {
    alert('Please choose an image file.');
    return;
  }

  try {
    setDisabled(true);
    progress.textContent = 'Uploading image...';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Cloudinary upload failed');
    const data = await res.json();
    const imageUrl = data.secure_url;
    progress.textContent = 'Saving to database...';

    const payload = {
      name,
      imageUrl,
      category: category || null,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'dishes'), payload);

    alert('Dish uploaded successfully!');
    form.reset();
  } catch (err) {
    console.error(err);
    alert('Upload failed. Check console for details.');
  } finally {
    setDisabled(false);
    progress.textContent = '';
  }
});
