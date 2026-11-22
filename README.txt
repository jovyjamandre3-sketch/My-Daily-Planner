MY DAILY PLANNER — VS CODE PROJECT

FILES
- index.html        Front Page (page 1)
- dashboard.html    Dashboard (page 2)
- add-work.html     Add/Edit School Work form (page 3)
- school-work.html  School Work list (page 4)
- styles.css        Shared editable design and colors
- firebase.js       Firebase project configuration
- app.js            CRUD, realtime dashboard statistics, navigation actions
- firestore.rules   Firestore access rules

SETUP
1. Open this folder in VS Code.
2. Create a Firebase project at https://console.firebase.google.com/
3. In Firebase Console, add a Web App (</>) and copy its config.
4. Paste your config values into firebase.js, replacing every PASTE_... value.
5. Firebase Console > Authentication > Get started > Sign-in method > enable Anonymous.
6. Firebase Console > Firestore Database > Create database.
7. Open Firestore Rules, replace the rules with the contents of firestore.rules, then Publish.
8. Run the site through a local server (VS Code Live Server extension). Do not open index.html by double-clicking because Firebase modules need a web server.
9. Open index.html using Live Server.

DATABASE
Collection: SchoolWork
Fields: title, subject, description, workType, priority, dueDate, dueTime, status, uid, createdAt
Records are scoped to the anonymous Firebase UID and persist in Firestore.

NOTE
This is a four-page web application, not a FlutterFlow project. Edit the page content in the HTML files, styles in styles.css, and behavior in app.js.
