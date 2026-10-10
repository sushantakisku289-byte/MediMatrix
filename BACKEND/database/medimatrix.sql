-- ============================================================
-- MEDIMATRIX
-- Hospital Management & Healthcare Coordination System
-- Database: MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS medimatrix
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE medimatrix;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    full_name VARCHAR(150) NOT NULL,

    role ENUM(
        'ADMIN',
        'HOSPITAL_EMPLOYEE',
        'HOSPITAL_EMPLOYEE_HOD',
        'NURSE',
        'NURSE_HOD',
        'DOCTOR',
        'DOCTOR_HOD',
        'OPD_STAFF',
        'OPD_HOD',
        'IPD_STAFF',
        'IPD_HOD',
        'MEDICINE_STORE'
    ) NOT NULL,

    department_id INT NULL,

    phone VARCHAR(20) NULL,
    email VARCHAR(150) NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    department_code VARCHAR(30) NOT NULL UNIQUE,
    department_name VARCHAR(150) NOT NULL UNIQUE,

    description TEXT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. PATIENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id VARCHAR(50) NOT NULL UNIQUE,
    registration_number VARCHAR(50) NOT NULL UNIQUE,

    full_name VARCHAR(150) NOT NULL,

    date_of_birth DATE NULL,
    age INT NULL,

    gender ENUM(
        'MALE',
        'FEMALE',
        'OTHER'
    ) NOT NULL,

    phone VARCHAR(20) NOT NULL,

    email VARCHAR(150) NULL,

    address TEXT NULL,

    blood_group VARCHAR(10) NULL,

    emergency_contact_name VARCHAR(150) NULL,
    emergency_contact_phone VARCHAR(20) NULL,

    allergies TEXT NULL,
    medical_history TEXT NULL,
    current_medications TEXT NULL,

    registration_status ENUM(
        'REGISTERED',
        'NURSE_PENDING',
        'NURSE_ASSESSED',
        'DOCTOR_PENDING',
        'DOCTOR_REVIEWED',
        'OPD',
        'IPD',
        'EMERGENCY',
        'COMPLETED'
    ) NOT NULL DEFAULT 'REGISTERED',

    created_by INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 4. PATIENT SYMPTOMS
-- ============================================================

CREATE TABLE IF NOT EXISTS patient_symptoms (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,

    primary_symptoms TEXT NOT NULL,
    additional_symptoms TEXT NULL,

    symptom_duration VARCHAR(100) NULL,

    previous_treatment TEXT NULL,

    entered_by INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_symptom_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_symptom_user
        FOREIGN KEY (entered_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 5. NURSE ASSESSMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS nurse_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,

    nurse_id INT NOT NULL,

    assessment_notes TEXT NULL,
    observations TEXT NULL,

    nurse_priority ENUM(
        'LOW',
        'MODERATE',
        'HIGH',
        'EMERGENCY'
    ) NOT NULL DEFAULT 'LOW',

    department_id INT NULL,

    status ENUM(
        'PENDING',
        'COMPLETED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_nurse_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_nurse_user
        FOREIGN KEY (nurse_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_nurse_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 6. PATIENT VITALS
-- ============================================================

CREATE TABLE IF NOT EXISTS patient_vitals (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,
    recorded_by INT NULL,

    temperature DECIMAL(5,2) NULL,
    pulse_rate INT NULL,
    respiratory_rate INT NULL,

    systolic_bp INT NULL,
    diastolic_bp INT NULL,

    oxygen_saturation DECIMAL(5,2) NULL,

    height_cm DECIMAL(6,2) NULL,
    weight_kg DECIMAL(6,2) NULL,

    blood_glucose DECIMAL(7,2) NULL,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vital_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_vital_user
        FOREIGN KEY (recorded_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 7. MEDICAL REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS medical_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,

    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,

    report_type VARCHAR(100) NULL,

    uploaded_by INT NULL,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_report_user
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 8. OCR REPORT DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS ocr_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,

    medical_report_id INT NOT NULL,
    patient_id INT NOT NULL,

    extracted_text LONGTEXT NULL,

    verification_status ENUM(
        'PENDING',
        'VERIFIED',
        'REJECTED'
    ) NOT NULL DEFAULT 'PENDING',

    verified_by INT NULL,
    verified_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ocr_report
        FOREIGN KEY (medical_report_id)
        REFERENCES medical_reports(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ocr_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ocr_verifier
        FOREIGN KEY (verified_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 9. DOCTOR ASSESSMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS doctor_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,

    clinical_notes TEXT NULL,

    diagnosis_notes TEXT NULL,
    treatment_plan TEXT NULL,

    final_priority ENUM(
        'LOW',
        'MODERATE',
        'HIGH',
        'EMERGENCY'
    ) NOT NULL DEFAULT 'LOW',

    disposition ENUM(
        'OPD',
        'IPD',
        'EMERGENCY',
        'FOLLOW_UP'
    ) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (doctor_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 10. OPD RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS opd_records (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,
    doctor_id INT NULL,

    consultation_number VARCHAR(50) NOT NULL UNIQUE,

    consultation_notes TEXT NULL,
    treatment_notes TEXT NULL,

    status ENUM(
        'WAITING',
        'IN_CONSULTATION',
        'COMPLETED',
        'FOLLOW_UP'
    ) NOT NULL DEFAULT 'WAITING',

    follow_up_date DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_opd_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_opd_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 11. IPD ADMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS ipd_admissions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,

    admission_number VARCHAR(50) NOT NULL UNIQUE,

    admitted_by INT NULL,

    ward_name VARCHAR(100) NULL,
    room_number VARCHAR(50) NULL,
    bed_number VARCHAR(50) NULL,

    admission_reason TEXT NULL,

    admission_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    discharge_date DATETIME NULL,

    status ENUM(
        'ADMITTED',
        'TRANSFERRED',
        'DISCHARGED'
    ) NOT NULL DEFAULT 'ADMITTED',

    CONSTRAINT fk_ipd_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ipd_user
        FOREIGN KEY (admitted_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 12. BEDS
-- ============================================================

CREATE TABLE IF NOT EXISTS beds (
    id INT AUTO_INCREMENT PRIMARY KEY,

    ward_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    bed_number VARCHAR(50) NOT NULL,

    bed_type ENUM(
        'GENERAL',
        'SEMI_PRIVATE',
        'PRIVATE',
        'ICU',
        'EMERGENCY'
    ) NOT NULL DEFAULT 'GENERAL',

    status ENUM(
        'AVAILABLE',
        'OCCUPIED',
        'MAINTENANCE'
    ) NOT NULL DEFAULT 'AVAILABLE',

    patient_id INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_bed (
        ward_name,
        room_number,
        bed_number
    ),

    CONSTRAINT fk_bed_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 13. PRESCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    prescription_number VARCHAR(50) NOT NULL UNIQUE,

    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,

    instructions TEXT NULL,

    status ENUM(
        'CREATED',
        'SENT_TO_PHARMACY',
        'PARTIALLY_DISPENSED',
        'DISPENSED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'CREATED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prescription_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_prescription_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 14. PRESCRIPTION ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS prescription_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    prescription_id INT NOT NULL,

    medicine_name VARCHAR(200) NOT NULL,

    dosage VARCHAR(100) NULL,
    frequency VARCHAR(100) NULL,
    duration VARCHAR(100) NULL,

    quantity INT NULL,

    special_instructions TEXT NULL,

    CONSTRAINT fk_prescription_item
        FOREIGN KEY (prescription_id)
        REFERENCES prescriptions(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 15. MEDICINE INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS medicine_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,

    medicine_code VARCHAR(50) NOT NULL UNIQUE,
    medicine_name VARCHAR(200) NOT NULL,

    category VARCHAR(100) NULL,

    batch_number VARCHAR(100) NULL,

    quantity INT NOT NULL DEFAULT 0,

    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    expiry_date DATE NULL,

    reorder_level INT NOT NULL DEFAULT 10,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 16. MEDICINE DISPENSING
-- ============================================================

CREATE TABLE IF NOT EXISTS medicine_dispensing (
    id INT AUTO_INCREMENT PRIMARY KEY,

    prescription_id INT NOT NULL,
    prescription_item_id INT NULL,

    patient_id INT NOT NULL,

    medicine_id INT NOT NULL,

    quantity_dispensed INT NOT NULL,

    dispensed_by INT NOT NULL,

    dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dispense_prescription
        FOREIGN KEY (prescription_id)
        REFERENCES prescriptions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_dispense_item
        FOREIGN KEY (prescription_item_id)
        REFERENCES prescription_items(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_dispense_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_dispense_medicine
        FOREIGN KEY (medicine_id)
        REFERENCES medicine_inventory(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_dispense_user
        FOREIGN KEY (dispensed_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 17. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    payment_number VARCHAR(50) NOT NULL UNIQUE,

    patient_id INT NOT NULL,

    payment_type ENUM(
        'REGISTRATION',
        'OPD',
        'IPD',
        'MEDICINE',
        'OTHER'
    ) NOT NULL,

    reference_id VARCHAR(100) NULL,

    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    payment_method ENUM(
        'CASH',
        'CARD',
        'UPI',
        'ONLINE'
    ) NOT NULL,

    payment_status ENUM(
        'PENDING',
        'PAID',
        'CANCELLED',
        'REFUNDED'
    ) NOT NULL DEFAULT 'PENDING',

    processed_by INT NULL,

    paid_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_user
        FOREIGN KEY (processed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 18. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,

    recipient_user_id INT NOT NULL,

    patient_id INT NULL,

    notification_type VARCHAR(50) NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    priority ENUM(
        'LOW',
        'MODERATE',
        'HIGH',
        'EMERGENCY'
    ) NOT NULL DEFAULT 'LOW',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (recipient_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 19. AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100) NULL,
    entity_id VARCHAR(100) NULL,

    description TEXT NULL,

    ip_address VARCHAR(45) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 20. FOLLOW-UP RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS follow_ups (
    id INT AUTO_INCREMENT PRIMARY KEY,

    patient_id INT NOT NULL,

    doctor_id INT NULL,

    follow_up_date DATE NOT NULL,

    instructions TEXT NULL,

    status ENUM(
        'PENDING',
        'COMPLETED',
        'MISSED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_followup_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_followup_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 21. DEFAULT DEPARTMENTS
-- ============================================================

INSERT IGNORE INTO departments
(department_code, department_name, description)
VALUES
('GEN', 'General Medicine', 'General medical services'),
('CARD', 'Cardiology', 'Heart and cardiovascular care'),
('EYE', 'Ophthalmology', 'Eye care services'),
('ENT', 'ENT', 'Ear, nose and throat services'),
('ORTHO', 'Orthopedics', 'Bone and joint care'),
('DERM', 'Dermatology', 'Skin care services'),
('NEURO', 'Neurology', 'Neurological care'),
('PED', 'Pediatrics', 'Child healthcare services'),
('GYNE', 'Gynecology', 'Women healthcare services'),
('SURGERY', 'General Surgery', 'Surgical services'),
('PULMO', 'Pulmonology', 'Respiratory care services'),
('EMERGENCY', 'Emergency', 'Emergency medical services');


-- ============================================================
-- 22. SAMPLE BEDS
-- ============================================================

INSERT IGNORE INTO beds
(ward_name, room_number, bed_number, bed_type, status)
VALUES
('General Ward', 'G-101', 'B-01', 'GENERAL', 'AVAILABLE'),
('General Ward', 'G-101', 'B-02', 'GENERAL', 'AVAILABLE'),
('General Ward', 'G-101', 'B-03', 'GENERAL', 'AVAILABLE'),
('General Ward', 'G-102', 'B-04', 'GENERAL', 'AVAILABLE'),
('General Ward', 'G-102', 'B-05', 'GENERAL', 'AVAILABLE'),
('ICU', 'ICU-01', 'ICU-B01', 'ICU', 'AVAILABLE'),
('ICU', 'ICU-01', 'ICU-B02', 'ICU', 'AVAILABLE'),
('Emergency', 'ER-01', 'ER-B01', 'EMERGENCY', 'AVAILABLE'),
('Emergency', 'ER-01', 'ER-B02', 'EMERGENCY', 'AVAILABLE');


-- ============================================================
-- 23. SAMPLE MEDICINES
-- ============================================================

INSERT IGNORE INTO medicine_inventory
(
    medicine_code,
    medicine_name,
    category,
    batch_number,
    quantity,
    unit_price,
    expiry_date,
    reorder_level
)
VALUES
(
    'MED-001',
    'Paracetamol 500mg',
    'Analgesic',
    'BATCH-001',
    100,
    2.50,
    '2028-12-31',
    20
),
(
    'MED-002',
    'Amoxicillin 500mg',
    'Antibiotic',
    'BATCH-002',
    50,
    5.00,
    '2028-10-31',
    10
),
(
    'MED-003',
    'Cetirizine 10mg',
    'Antihistamine',
    'BATCH-003',
    80,
    1.50,
    '2028-08-31',
    15
);


-- ============================================================
-- 24. INDEXES
-- ============================================================

CREATE INDEX idx_patient_name
ON patients(full_name);

CREATE INDEX idx_patient_phone
ON patients(phone);

CREATE INDEX idx_patient_status
ON patients(registration_status);

CREATE INDEX idx_notification_read
ON notifications(is_read);

CREATE INDEX idx_notification_priority
ON notifications(priority);

CREATE INDEX idx_prescription_patient
ON prescriptions(patient_id);

CREATE INDEX idx_payment_patient
ON payments(patient_id);

CREATE INDEX idx_audit_created
ON audit_logs(created_at);


-- ============================================================
-- COMPLETE
-- ============================================================

SELECT
    'MediMatrix database setup completed successfully!' AS message;

SHOW TABLES;