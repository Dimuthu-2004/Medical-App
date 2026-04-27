# SmartClinic Medical App

SmartClinic is a full-stack clinic management system built for academic project use. It combines a Spring Boot backend, a React frontend, and supporting Python microservices for chatbot, face recognition, and prescription OCR workflows.

## Main Features

- Patient, doctor, staff, admin, finance, and pharmacy role flows
- Appointment booking and patient profile management
- Medical records and clinical vitals tracking
- Feedback collection and admin analytics views
- Billing, payment, and payment-slip handling
- Prescription OCR and medicine-processing support
- Face-authentication support
- Symptom analyzer and chatbot integrations

## Tech Stack

- Backend: Java 17, Spring Boot, Spring Security, Spring Data JPA, Thymeleaf
- Frontend: React, Vite, React Router, Framer Motion
- Database: Microsoft SQL Server
- AI services: FastAPI-based Python microservices

## Project Structure

- `src/` Spring Boot backend source
- `frontend/` React frontend
- `chat-api/` chatbot and symptom-analysis microservice
- `face-api/` face embedding extraction microservice
- `ocr-api/` handwritten prescription OCR microservice
- `scripts/` helper scripts for local development
- `database_setup.sql` database bootstrap script

## Prerequisites

- Java 17
- Maven Wrapper (`mvnw.cmd` is included)
- Node.js 20+
- Python 3.11
- Microsoft SQL Server

## How To Run

### 1. Configure environment

Copy values from `.env.prod.example` or set the equivalent environment variables for:

- database connection
- Google OAuth client credentials
- PayPal sandbox credentials
- mail credentials
- optional external service URLs

### 2. Start the Python services

In separate terminals:

```powershell
cd face-api
py -3.11 -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python main.py
```

```powershell
cd ocr-api
py -3.11 -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python main.py
```

```powershell
cd chat-api
py -3.11 -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python main.py
```

### 3. Start the frontend and backend

The frontend source is in `frontend/`, and the Maven build handles the frontend build for the Spring Boot application.

```powershell
.\mvnw.cmd spring-boot:run
```

Default local URLs:

- Backend app: `http://localhost:8088`
- Face API: `http://127.0.0.1:8000`
- OCR API: `http://127.0.0.1:8001`
- Chat API: `http://127.0.0.1:8002`

## Notes

- Generated files, local virtual environments, logs, datasets, uploads, and IDE files are intentionally excluded from version control.
- Some AI models are downloaded on first run by the related Python service.
- The included report file is `AI-02-G03.pdf`.
