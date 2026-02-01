# 💬 Ping - Real-Time Chat App 💬
--> made by: Ursache Ana-Maria

## Details about the project:
Ping is a real-time instant messaging application built to explore bidirectional communication between a client and a server. The project evolved from a basic chat interface into a complex system utilizing high-performance caching for data persistence and specialized socket events for secure messaging.

The application prioritizes user experience with an intuitive chat flow, clear separation of online/offline contacts, and history retention even after page refreshes or session restarts.

All the functionalities and the design was thought having in mind the lighthouse report.

### Technologies used to make this project: 💻
--> JavaScript (Node.js): Used for the backend logic and server-side operations.

--> Socket.io: Powers the bidirectional, real-time communication between the server and the browser.

--> Redis: Acts as a high-speed database to cache chat history and track user status (online/offline).

--> HTML & SCSS(to CSS): Used for creating a modern, semantic, and responsive user interface. 

The main inspiration for the design: https://dribbble.com/shots/23332707-ChaTin-AI-Chatbot-app 

### Functionalities: 💻
--> Real-time Messaging: Users can send and receive messages instantly without refreshing the page.

--> Persistent History: Messages are stored in Redis, allowing users to view their previous conversations upon logging back in.

--> User Status Tracking: The app monitors online users in real-time and updates the contact list for everyone.

--> Private Conversations: Uses a unique chatKey logic (e.g., "UserA : UserB") to ensure messages are only delivered to the intended recipient.

--> Offline Awareness: Users can select offline contacts to view their past message history, even if the other person is not currently connected.

--> Dynamic UI States: The message input automatically disables when a recipient goes offline, preventing "ghost" messages.

### Main Containers: 💻
--> Login Overlay: A clean entry point that captures the username and initializes the session.

--> Sidebar: Manages the conversation list, categorized by "Online (Previously Chatted)", "Offline (Previously Chatted)", and "Other Online Users".

--> Messages Container: Renders the chat bubbles (sent/received) with auto-scroll functionality to keep the latest messages in view.

## Commands for the setup: 💻
--> cloning: git clone https://github.com/ana-maria-ursache/Chat-Application

--> installing dependencies: npm install

--> starting the Redis Server: redis-server

--> running the application: npm start

--> open your browser and navigate to: http://localhost:3000

## 📸 Images: 📸

### Main Login Page
<img width="1366" height="678" alt="image" src="https://github.com/user-attachments/assets/ed2d3c92-d0cb-4dc8-bc36-5b5903bcbdff" />

### Chat Page
<img width="1374" height="704" alt="image" src="https://github.com/user-attachments/assets/96b92954-4a74-44fd-86bf-0eddbe3e69e8" />
