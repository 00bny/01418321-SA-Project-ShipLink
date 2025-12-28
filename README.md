# ShipLink — SA Project

ShipLink is a **System Analysis implementation project** for a multi-carrier shipping management platform.  
It supports both **branch employees** and **shipping companies** with workflows from order creation and pickup handling to parcel delivery and returns.

## System Analysis Document

A dedicated **System Analysis document (Thai)** has been prepared covering:
- Project background, problem analysis, objectives, and scope  
- As-Is / To-Be Business Process & Use Case design  
- ER Diagram, Database design, and Data Dictionary  
- System design (UML diagrams) and UI/UX  
- SQL testing, system testing, and conclusion
  
You can read the full document here:  
[System Analysis Report — ShipLink Parcel Delivery Management System](https://docs.google.com/document/d/1Dgx8ZvJpC75xFyj5MyLZ4iRcALis6IVs0h9kyF97GLI/edit?usp=sharing)

## Features

- **Role-based flows**
  - Branch staff: create orders, manage pickups, manage branch wallet and transactions
  - Branch manager: view dashboards, manage staff and branch operations
  - Shipping company: accept jobs, update delivery status, manage company wallet and returns

- **Order & pickup management**
  - Create new shipping orders
  - Record pickup requests
  - Track status through the order lifecycle

- **Wallet & transaction handling**
  - Branch wallet top-up / withdraw
  - Company wallet and transaction history

- **Containerized environment**
  - Application + database defined via `docker-compose.yml`
  - Database schema initialized from `db/init.sql`

## Tech Stack

- **Backend:** Node.js (Express-style controllers/routes)
- **Frontend:** HTML, CSS, vanilla JavaScript (modular structure)
- **Database:** SQL database (schema in `db/init.sql`)
- **Containerization:** Docker & Docker Compose

## Project Structure

```text
backend/
  src/
    config/        # DB connection & configuration
    controllers/   # Business logic
    models/        # Data models
    routes/        # API routes

db/
  init.sql         # Database schema & seed data

frontend/
  public/
    css/           # Stylesheets
    js/            # Frontend logic (modular)
  pages/           # HTML interfaces for each role

docker-compose.yml # Services & containers
package.json       # Node dependencies
```

## Prerequisites
- Docker and Docker Compose installed  
- Node.js (only required if running without Docker)

## Running with Docker (Recommended)

### 1. Clone the repository
```bash
git clone https://github.com/00bny/01418321-SA-Project-ShipLink.git
cd 01418321-SA-Project-ShipLink
```

### 2. Start the stack
```bash
docker compose up --build
```

✔ This will:
- Build the Node.js backend  
- Start the frontend + static pages  
- Start the SQL database  
- Initialize schema from `db/init.sql`

## Access the App

- **Web UI:** http://localhost:<frontend-port>  
- **API:** http://localhost:<backend-port>  
- **Database UI (optional / if configured):** http://localhost:<db-admin-port>

Check the `ports` section inside `docker-compose.yml` for exact values.

## Running Locally Without Docker

If you prefer to run only the Node.js backend directly:

### Install dependencies
```bash
npm install
```

### Configure environment
Create a `.env` file  
(or configure `DBConnector.js / db.js`)  
with your database credentials.

### Create database & schema
Import:
```
db/init.sql
```
into your SQL server (e.g., MySQL / MariaDB)

### Start the backend
```bash
npm start
```
(or another script defined in `package.json`)

## Notes
This repository is primarily for academic purposes as part of the **System Analysis course**.

The project demonstrates a layered architecture:
```
Routes → Controllers → Models → Database
```

## Authors
ShipLink is developed by a student team as part of course:  
**01418321 — System Analysis and Design, Kasetsart University**
