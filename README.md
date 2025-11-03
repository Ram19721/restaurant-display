# Smart Restaurant Display System

Static two-page web app using Firebase (Firestore + Storage) to show a real-time carousel of dishes and an admin uploader.

## Setup
1. Open `firebase-config.js` and replace placeholders with your Firebase project credentials.
2. Deploy the folder to GitHub Pages or Firebase Hosting (static hosting).

## Pages
- `index.html` — Display carousel with real-time updates.
- `admin.html` — Upload dish name + image to Storage and Firestore.

## Notes
- Without credentials, `index.html` will show dummy sample dishes; `admin.html` disables upload.
- Uses Firebase v11 CDN modular SDK and Tailwind CDN.

## Admin Authentication (Google)
The admin page is protected by Firebase Authentication (Google Sign-In).

Steps:
- In Firebase Console → Build → Authentication → Sign-in method → Enable Google provider.
- Optionally add your domain to Authorized domains (for GitHub Pages/Hosting).
- Reload `admin.html`, click “Sign in with Google”, then upload.

### Security Rules (sample)
Adjust to your needs. The following allows public reads for display and restricts writes to authenticated users.

Firestore rules (simplified):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dishes/{docId} {
      allow read: if true;            // public display
      allow write: if request.auth != null; // only signed-in users
    }
  }
}
```

Storage rules (simplified):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /dishes/{allPaths=**} {
      allow read: if true;                // public images
      allow write: if request.auth != null; // only signed-in users
    }
  }
}
```

For production, consider restricting by user email domain or specific UIDs.
