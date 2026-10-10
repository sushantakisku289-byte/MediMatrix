# MediMatrix – Smart Healthcare Management and Patient Triage System

## Overview
MediMatrix is a healthcare management web application designed to streamline patient registration, symptom-based department routing, staff workflows, and hospital operations.

## Key Features
- Patient registration and patient record management
- Symptom-based department routing
- Role-based dashboards for administrators, doctors, nurses, and hospital employees
- Department and user management
- Billing and IPD bed management
- Notifications and patient workflow tracking
- Patient registration document printing

## Technology Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask
- **Database:** MySQL
- **Version Control:** Git and GitHub

## Project Structure
- `BACKEND/` – Flask application, API routes, database models, and SQL files
- `FRONTEND/` – User interface, dashboards, stylesheets, and browser scripts

## Setup
1. Install Python and MySQL.
2. Clone this repository.
3. Install the backend dependencies from `BACKEND/requirements.txt`.
4. Configure your local database and environment variables.
5. Import the database schema from `BACKEND/database/medimatrix.sql`, if applicable.
6. Start the Flask backend using the project's configured entry point.
7. Open the frontend using the project's configured local server.

## Security
Do not commit `.env` files, passwords, API keys, patient information, or other confidential data.

## Project Status
Developed as a healthcare technology project. Features should be tested in a controlled environment before real clinical use.
