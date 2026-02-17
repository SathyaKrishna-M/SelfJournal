# 📔 SelfJournal

> **Your thoughts, secured. A private, offline-first digital journal with a soul.**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa&logoColor=white)

---

## ✨ Overview

**SelfJournal** is a modern, aesthetics-focused journaling application designed for privacy and peace of mind. Built with a "Zero-Knowledge" architecture, your entries are encrypted client-side using the Web Crypto API before they ever hit storage.

With a beautiful book-like interface, handwriting typography, and seamless offline capabilities, it offers the tactile feeling of a physical journal with the security of modern encryption.

## 🚀 Key Features

### 🔒 Privacy First
*   **Client-Side Encryption**: AES-GCM encryption ensures only YOU can read your entries.
*   **Local-First Architecture**: Data lives in your browser's IndexedDB.
*   **Zero-Knowledge**: No plaintext data is ever exposed or transmitted.

### ✍️ Premium Writing Experience
*   **Book-Like UI**: Realistic page-turning and two-page layout.
*   **Handwriting Font**: Uses 'Caveat' for a personal, organic feel.
*   **Distraction-Free**: Minimalist editor focused on your thoughts.
*   **Multimedia**: Drag & drop image support with auto-encryption.

### ☁️ Modern Capabilities
*   **PWA Ready**: Installable on desktop and mobile. Works offline.
*   **Google Drive Backup**: Securely backup encrypted snapshots to your personal cloud.
*   **Calendar View**: Visual history of your writing habits.
*   **Search**: Full-text client-side search.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS 3
*   **State Management**: Zustand
*   **Database**: Dexie.js (IndexedDB wrapper)
*   **Editor**: Tiptap (Headless wrapper for ProseMirror)
*   **Encryption**: Web Crypto API
*   **Icons**: Lucide React

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/SathyaKrishna-M/SelfJournal.git
    cd SelfJournal
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

5.  **Preview production build**
    ```bash
    npm run preview
    ```

## 📱 Progressive Web App (PWA)

This application is configured as a PWA. To test offline capabilities:
1.  Run `npm run build`
2.  Serve the `dist` folder (or use `npm run preview`)
3.  Install via the browser's address bar icon.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/SathyaKrishna-M">SathyaKrishna-M</a>
</p>
