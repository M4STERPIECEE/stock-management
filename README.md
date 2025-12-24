# 📦 Stock Management System

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=flat&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=flat&logo=postgresql&logoColor=white)

> A modern, robust, and scalable Stock Management System designed to streamline inventory tracking, customer management, and order processing. Built with performance and user experience in mind.

---

## ✨ Key Features

- **📊 Interactive Dashboard**: Real-time overview of your business performance.
- **📦 Smart Inventory**: Track stock levels, status (In Stock, Low, Out of Stock), and product categories.
- **👥 Customer Management**: Manage client details and order history efficiently.
- **🛒 Order Processing**: Seamless workflow from order creation to delivery status tracking.
- **🔐 Secure Administration**: Dedicated Admin portal with secure authentication.
- **🎨 Modern UI/UX**: Beautiful, responsive interface with **Dark/Light mode** support.
- **⚡ High Performance**: Powered by a lightning-fast NestJS backend and optimized React frontend.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Chakra UI (Custom Themed) + CSS Modules
- **Font**: Poppins (for a clean, modern look)
- **State/Routing**: React Router DOM

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL 15
- **ORM/Query**: TypeORM / SQL
- **Architecture**: Modular Monolith

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions (Automated testing & linting)
- **Package Manager**: pnpm

---

## 🚀 Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

- **Docker** & **Docker Compose** installed.
- **Node.js** (v20+) & **pnpm** (if running locally without Docker).

### 🔧 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/M4STERPIECE77K/stock-management.git
    cd stock-management
    ```

2.  **Environment Setup**
    The project comes with a default `.env` configuration. For production, ensure you update the credentials.
    ```bash
    # The .env file is already set up at the root for Docker Compose
    # DB_USER=postgres
    # DB_PASSWORD=securepassword
    # ...
    ```

3.  **Run with Docker (Recommended)**
    Launch the database and backend services instantly.
    ```bash
    docker-compose up -d --build
    ```

4.  **Run Frontend Locally**
    Open a new terminal for the frontend:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    Access the app at `http://localhost:5173`.

---

## 🗄️ Database Schema

The system is built on a solid relational database foundation:

- **Products**: Handles specific items, pricing, categories, and dynamic stock status.
- **Customers**: Stores client contact info (Email/Phone enforcement) and status.
- **Orders**: Tracks order lifecycle (Pending, Delivered, Cancelled).
- **Order Items**: detailed breakdown of purchased products.
- **Admin Users**: Secure access control for administrators.

---

## 🤝 Contributing

We follow a structured workflow for development:

1.  **Develop Branch**: Main development branch.
2.  **Feature Branches**: Create branches like `feature/my-new-feature` from `develop`.
3.  **Pull Requests**: Submit PRs to `develop`. Our CI pipeline will automatically run tests and linters.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by M4STERPIECE
</p>
