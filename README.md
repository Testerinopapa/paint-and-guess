# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a59e01f3-9797-488f-bd5b-b2f008c93bcb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a59e01f3-9797-488f-bd5b-b2f008c93bcb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

## Local Development

### Prerequisites

- Node.js (v18 or higher recommended) - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or bun (package manager)

### Getting Started

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```sh
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Start the servers**
   
   You'll need to run both the frontend and backend servers:
   
   **Terminal 1 - Backend Server:**
   ```sh
   npm run dev:backend
   # or
   cd backend && npm run dev
   ```
   The backend will run on `http://localhost:3001`
   
   **Terminal 2 - Frontend Server:**
   ```sh
   npm run dev
   ```
   The frontend will be available at `http://localhost:8080`

4. **Open your browser**
   - Navigate to `http://localhost:8080`
   - The application will automatically reload when you make changes to the code
   - For single-player mode, visit `http://localhost:8080/single`
   - For multiplayer mode, visit `http://localhost:8080` (default)

### Configuration

- **Default Port**: The dev server runs on port `8080` by default
- **Custom Port**: You can change the port by setting the `PORT` environment variable:
  ```sh
  # On macOS/Linux
  PORT=3000 npm run dev
  
  # On Windows PowerShell
  $env:PORT=3000; npm run dev
  
  # On Windows Command Prompt
  set PORT=3000 && npm run dev
  ```

### Troubleshooting

- **Port already in use**: If port 8080 is already in use, either:
  - Stop the other service using that port
  - Use a different port by setting the `PORT` environment variable
- **Windows firewall issues**: If you can't access the app, check your Windows firewall settings
- **Dependencies not installing**: Try deleting `node_modules` and `package-lock.json` (or `bun.lockb`), then run `npm install` again

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Frontend:**
  - Vite
  - TypeScript
  - React
  - shadcn-ui
  - Tailwind CSS
  - Fabric.js (canvas drawing)
  - Socket.io Client (real-time multiplayer)

- **Backend:**
  - Node.js
  - Express
  - Socket.io (WebSocket server)
  - In-memory game state (MVP - can be extended with database)

## Multiplayer Mode

The game now supports real-time multiplayer mode! 

### Features:
- Create or join rooms
- Real-time drawing synchronization
- Word guessing with scoring
- Round-based gameplay with drawer rotation
- Live chat
- Player scores and leaderboard

### How to Play:
1. Start both frontend and backend servers
2. Open `http://localhost:8080` in your browser
3. Enter your name and create or join a room
4. Wait for at least 2 players, then click "Start Game"
5. Take turns drawing and guessing words!

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a59e01f3-9797-488f-bd5b-b2f008c93bcb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
