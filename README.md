# 🏠 HomeX

### *Your Home, Our Experts*

---

## 📖 Overview

**HomeX** is a modern mobile application that simplifies the process of finding trusted home service providers like plumbers, electricians, cleaners, and more.

Instead of wasting time searching manually, users can **book verified professionals in seconds**, track them in real-time, and pay securely — all from one app.

---

## ✨ Key Highlights

* 🔒 Verified Service Providers (CNIC + Face Verification)
* ⚡ Fast & Easy Booking Experience
* 📍 Real-time Service Tracking
* 💬 Built-in Chat System
* 💳 Secure Payments (Stripe Integration)
* ⭐ Ratings & Review System
* 🌍 Designed for Pakistan (Urban + Semi-Urban Areas)

---

## 🎯 Problem It Solves

Many platforms in Pakistan suffer from:

* ❌ No proper verification
* ❌ Limited service coverage
* ❌ Poor user experience

**HomeX provides a complete solution** with trust, transparency, and convenience.

---

## 📱 Features

### 👤 User

* Register / Login
* Browse Services
* Book Services Instantly
* Track Provider Live
* Chat with Provider
* Pay Securely
* Give Reviews & Ratings

### 🧑‍🔧 Service Provider

* Create Profile
* CNIC Verification
* Manage Availability
* Accept / Reject Requests
* Chat with Users
* View Feedback

---

## 🧠 System Modules

* 🔐 Authentication & Verification
* 📅 Booking Management
* 💳 Payment System
* 📍 Tracking System
* 💬 Chat System
* ⭐ Review System

---

## 🏗️ Tech Stack

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| 📱 Frontend  | React Native (Expo)               |
| ⚙️ Backend   | Django (Python)                   |
| 🗄️ Database | Firebase                          |
| 🤖 AI Tools  | YOLOv8, EasyOCR, Face Recognition |
| 💳 Payments  | Stripe API                        |

---

## 🧩 Architecture

* 📌 Modular Architecture
* 📌 RESTful APIs
* 📌 Mobile-First Design
* 📌 Cloud-Based System

Actors:

* User
* Service Provider

---

## 🚀 Getting Started

### 🔧 Installation

```bash
# Clone repository
git clone https://github.com/your-username/homex.git

# Go to project
cd homex
```

### ⚙️ Backend Setup

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

### 📱 Frontend Setup

```bash
npm install
npx expo start
```

---

## 🔑 Environment Variables

The following variables must be defined in `.env` (see `.env.example` for placeholders):

| Variable | Description |
|----------|------------|
| FIREBASE_API_KEY | Firebase Web API key |
| FIREBASE_AUTH_DOMAIN | Firebase Auth domain |
| FIREBASE_PROJECT_ID | Firebase project ID |
| FIREBASE_STORAGE_BUCKET | Firebase Storage bucket |
| FIREBASE_MESSAGING_SENDER_ID | Firebase sender ID |
| FIREBASE_APP_ID | Firebase App ID |
| FIREBASE_MEASUREMENT_ID | Google Analytics measurement ID |
| STRIPE_PUBLISHABLE_KEY | Stripe publishable key (test/live) |
| GOOGLE_IOS_CLIENT_ID | Google OAuth iOS client ID |
| GOOGLE_WEB_CLIENT_ID | Google OAuth web client ID |
| WALLET_BACKEND_URL | Backend URL for Stripe payment intents |
| CNIC_BACKEND_URL | Backend URL for CNIC OCR verification |
| SELFIE_VERIFICATION_URL | Backend URL for face matching |
| CLOUDINARY_URL | Cloudinary upload endpoint |
| CLOUDINARY_UPLOAD_PRESET | Cloudinary upload preset |
| MAPBOX_ACCESS_TOKEN | Mapbox access token (for maps integration) |

---

## 📄 License

This project is for **Final Year Project (Educational Use)**

---

## ⭐ Show Your Support

If you like this project, give it a ⭐ on GitHub and share it! 🚀

---
