# Copilot Instructions for DWEH157 E-commerce App

## Architecture Overview
This is a Firebase-powered e-commerce web application with a static frontend and serverless backend. Key components:
- **Frontend**: Vanilla HTML/CSS/JS with glassmorphism design (backdrop-filter blur effects)
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions, Data Connect with PostgreSQL)
- **Auth**: Google OAuth via Firebase Auth
- **Data**: Products and user profiles stored in Firestore; schema defined in `dataconnect/schema/schema.gql` for PostgreSQL integration
- **Deployment**: Firebase Hosting (not yet configured)

## Key Files & Structure
- `website/assets/structure/index.html`: Main product listing page
- `website/assets/structure/myaccount.html`: User account management
- `website/assets/scripts/script.js`: Product loading and UI interactions
- `website/assets/scripts/auth.js`: Google authentication and user data management
- `website/assets/firebase/functions/index.js`: Cloud Functions (currently boilerplate)
- `website/assets/firebase/dataconnect/`: Data Connect schema and connectors
- `website/assets/css/`: Styling with consistent glassmorphism patterns (see `style.css` and `myaccount-style.css`)

## Developer Workflows
### Local Development
- Run Firebase emulators: `cd website/assets/firebase/functions && npm run serve`
- Serve static files locally (no build step required)
- Test auth and Firestore locally with emulators

### Deployment
- Deploy functions: `cd website/assets/firebase/functions && npm run deploy`
- Static site deployment via Firebase Hosting (configure `firebase.json` if needed)

### Data Management
- User profiles: Stored in Firestore `users/{uid}` with fields like `name`, `email`, `address`, `phoneNumber`
- Products: Firestore `products` collection with `name`, `price`, `image`, `type` (e.g., "featured")
- Schema updates: Modify `dataconnect/schema/schema.gql` and redeploy Data Connect

## Coding Patterns & Conventions
### Firebase Integration
- Use ES module imports from CDN (v12.6.0) in client scripts
- Initialize Firebase once per script with config from `script.js` or `auth.js`
- Auth state: Use `onAuthStateChanged` for UI updates
- Firestore queries: Use `query(collection(db, "collection"), where(...))`

### Styling
- Fonts: "Caveat" (cursive, 700), "Quicksand" (300-700), "Momo Signature", "Caesar Dressing"
- Glassmorphism: `backdrop-filter: blur(20px); background-color: rgba(0,0,0,0.4);`
- Responsive: Mobile-first with max-width 450px for menus
- Colors: Dark theme (#404040 background), white text, rgba overlays

### UI Components
- Hamburger menu: Off-screen slide-in with `.off-screen-menu.active`
- Product cards: `.pr-card` with price overlay and add-to-cart tint
- Profile: Circular avatar with background-image fallback to icon

### File Organization
- Assets: `website/assets/` (css, images, scripts, firebase)
- Backups: `website/backups/01-dev/`, `02-staging/`, `03-production/` for version control
- No build tools; direct file editing and Firebase deployment

## Common Tasks
- Add product: Insert document to Firestore `products` collection
- User registration: Automatic on first Google sign-in, merge missing fields
- Styling updates: Apply glassmorphism consistently across pages
- Auth flow: Redirect to `myaccount.html` on profile button click

## Dependencies
- Firebase SDK: v12.6.0 (CDN imports)
- No frontend frameworks; vanilla JS with modern ES modules
- Functions: Node 22, firebase-admin, firebase-functions</content>
<parameter name="filePath">c:\Users\admin\OneDrive\Desktop\repo\-prte-dw\.github\copilot-instructions.md