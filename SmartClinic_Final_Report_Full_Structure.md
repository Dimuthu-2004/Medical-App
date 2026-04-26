# SmartClinic Final Report

## Title Page

**SmartClinic: An AI-Enhanced Clinic Management and Patient Support System**

IT2021: AIML Project  
Assignment 05 - Final Report  
ITP Group Number: [INSERT GROUP NUMBER]  
Campus: [INSERT CAMPUS]  

Group Members:

1. [INSERT NAME] - [INSERT ID]
2. [INSERT NAME] - [INSERT ID]
3. [INSERT NAME] - [INSERT ID]
4. [INSERT NAME] - [INSERT ID]
5. [INSERT NAME] - [INSERT ID]
6. [INSERT NAME] - [INSERT ID]

Date of Submission: [INSERT DATE]

---

## Declaration

We declare that this report and the work presented in it are the result of our own group effort carried out for the AIML Project module. All external sources, ideas, research findings, datasets, frameworks, and references used in the preparation of this report have been acknowledged appropriately. We further declare that this submission has not been submitted, either in full or in part, for any other academic evaluation.

Group Members:

1. Name: [INSERT NAME]  
   Student ID: [INSERT ID]  
   Signature: ____________________

2. Name: [INSERT NAME]  
   Student ID: [INSERT ID]  
   Signature: ____________________

3. Name: [INSERT NAME]  
   Student ID: [INSERT ID]  
   Signature: ____________________

4. Name: [INSERT NAME]  
   Student ID: [INSERT ID]  
   Signature: ____________________

5. Name: [INSERT NAME]  
   Student ID: [INSERT ID]  
   Signature: ____________________

6. Name: [INSERT NAME]  
   Student ID: [INSERT ID]  
   Signature: ____________________

---

## Abstract

SmartClinic is an AI-enhanced clinic management and patient support system developed to improve the efficiency, accessibility, and reliability of healthcare-related workflows in a private clinic environment. Many small and medium-scale clinics still depend on partially manual processes for patient registration, appointment scheduling, billing, prescription handling, and patient communication. These methods often create delays, reduce service quality, and increase the possibility of human error. The purpose of this project is to design and implement a unified software solution that combines core clinic management features with selected artificial intelligence and machine learning components that provide practical value to both patients and clinic staff.

The system was developed using a modern full-stack architecture. The frontend was implemented using React and Vite, the backend was implemented using Spring Boot with Java 17, and Microsoft SQL Server was used for persistent storage. In addition to the core web application, the project includes Python FastAPI microservices that handle AI-related tasks such as symptom analysis, handwritten prescription OCR, face-based authentication support, sentiment analysis for patient feedback, and chatbot assistance. The system supports multiple user roles including patients, doctors, administrators, finance staff, and pharmacists. It provides features such as patient and staff management, appointment booking, medical records management, vitals tracking, billing and payment verification, digital prescription handling, notifications, public feedback display, and awareness announcements.

The AI/ML component is a major contribution of the project. The symptom analyzer uses trained classification artifacts to predict likely diseases from a selected set of symptoms. The feedback analysis module uses TF-IDF vectorization and logistic regression to classify patient comments as positive, neutral, or negative. The OCR module uses preprocessing, line segmentation, PaddleOCR and TrOCR-based recognition, and domain-specific medicine name correction to extract structured information from handwritten prescriptions. The face authentication component uses OpenCV YuNet and SFace models to generate facial embeddings and support secure matching. The chatbot module combines rule-based handling, retrieval-augmented support, and optional local large language model integration to guide users through routine clinic tasks.

The final outcome of the project is a realistic and modular clinic information system that demonstrates how AI can be integrated into healthcare support software in a practical and responsible way. The project shows strong alignment between system design, user needs, and applied machine learning. It also highlights the importance of combining automation with validation, privacy protection, and human oversight.

---

## Acknowledgement

We would like to express our sincere gratitude to our module lecturer and all academic staff of the Department of IT, Faculty of Computing, Sri Lanka Institute of Information Technology, for their guidance, encouragement, and continuous support throughout this project. Their feedback helped us improve not only the technical quality of the system but also our understanding of software development, teamwork, and applied artificial intelligence.

We also thank our team members for their collaboration, commitment, and willingness to contribute across different stages of the project including planning, implementation, testing, documentation, and revision. The successful completion of SmartClinic was possible because of shared responsibility and consistent communication among the group.

Finally, we appreciate the open-source communities behind the frameworks, libraries, and research resources that supported this work, including Spring Boot, React, FastAPI, OpenCV, scikit-learn, and OCR-related tools. These resources made it possible for us to experiment, learn, and build a complete system that connects software engineering with practical AI/ML application.

---

## Table of Contents

[AUTO-GENERATED TABLE OF CONTENTS]

---

## List of Tables

[AUTO-GENERATED LIST OF TABLES]

---

## List of Figures

[AUTO-GENERATED LIST OF FIGURES]

---

## List of Abbreviations

AI - Artificial Intelligence  
API - Application Programming Interface  
BP - Blood Pressure  
CLAHE - Contrast Limited Adaptive Histogram Equalization  
CRUD - Create, Read, Update, Delete  
ER - Entity Relationship  
JPA - Java Persistence API  
LKR - Sri Lankan Rupee  
LLM - Large Language Model  
ML - Machine Learning  
OCR - Optical Character Recognition  
ONNX - Open Neural Network Exchange  
PDF - Portable Document Format  
REST - Representational State Transfer  
SQL - Structured Query Language  
TF-IDF - Term Frequency-Inverse Document Frequency  
UI - User Interface  
UX - User Experience

---

# Chapter 1: Introduction

## 1.1 Problem and Motivation

Healthcare organizations increasingly depend on digital systems to manage patient flow, reduce delays, and improve service quality. However, many small and medium-sized private clinics continue to operate with partially manual processes for patient registration, appointment booking, payment confirmation, prescription handling, and communication with patients. These practices often lead to inefficiency, fragmented data storage, scheduling conflicts, and difficulty maintaining a consistent patient experience. Manual handling of operational tasks also places pressure on administrative staff and can slow down doctors and finance teams who depend on accurate and timely information.

One of the most visible problems in clinic environments is appointment management. When appointment slots, doctor availability, and session limits are not handled systematically, overbooking and confusion can occur. Patients may not know their token numbers in advance, may miss updates about doctor availability, or may face difficulty cancelling or rescheduling visits. Another common issue is the handling of bills and payments. In many cases, payment confirmation depends on manual verification of bank slips or separate accounting records, which can create delays and a lack of transparency for patients.

Prescription handling is another important challenge. Doctors often write prescriptions by hand, and the resulting text may be difficult for patients, support staff, or pharmacists to read. This can create uncertainty around medicine names, dosage values, and duration of treatment. In addition, clinics need better ways to collect and understand patient feedback. Although patients may provide ratings and comments, manual review of all feedback can be slow and inconsistent. Clinics also need secure but usable login options and quicker ways to answer common patient questions related to booking, payments, prescriptions, and services.

The motivation for this project came from the need to address these practical weaknesses using both standard software engineering and AI/ML techniques. Instead of developing an application that only stores records, the project aims to create an integrated clinic platform that improves patient interaction, supports staff operations, and introduces intelligent features where they are genuinely useful. The goal is not to replace doctors or clinical judgment, but to reduce repetitive work, improve service flow, and present meaningful assistance through machine learning and automated analysis.

## 1.2 Literature Review

Recent developments in healthcare information systems show a strong shift from purely administrative systems toward intelligent and decision-support-oriented platforms. Electronic medical record systems have already demonstrated how digitization improves access to patient history, reduces duplication of information, and supports continuity of care. At the same time, research in machine learning has shown that classification models can be used as symptom-based guidance tools when they are framed correctly and used within clearly defined limitations. Such systems are particularly useful for early screening, patient awareness, and symptom organization before clinical consultation.

Natural language processing has also become important in healthcare service evaluation. Sentiment analysis is widely used to understand patient opinions, detect negative service trends, and support quality improvement. Text classification methods such as TF-IDF combined with linear models remain effective for short review-style comments because they are computationally efficient and interpretable. In practical systems, these techniques are often strengthened using lexical rules, phrase handling, and auxiliary signals such as star ratings.

Optical character recognition has similarly become valuable for medical documentation. Traditional OCR systems often struggle with handwriting, but newer transformer-based recognition models and specialized OCR frameworks have improved performance considerably. In medical settings, however, recognition alone is not sufficient. Postprocessing is needed to normalize medicine names, identify dosage expressions, and correct ambiguous or misspelled tokens. This makes hybrid pipelines more practical than generic OCR-only approaches.

Biometric authentication is another growing area in modern information systems. Face recognition can improve convenience by reducing dependency on passwords, especially for users who prefer quick mobile or camera-based access. Nevertheless, biometric methods must be supported by threshold-based validation and careful storage of biometric representations to avoid weak or unsafe matching behavior.

Conversational systems have also become common in healthcare-adjacent applications. Chatbots help answer routine questions, guide users through service workflows, and reduce repetitive front-desk communication. In safer implementations, they combine rule-based guidance, structured context, and controlled use of language models rather than operating as completely unrestricted medical assistants.

The SmartClinic project draws from these established directions. It combines a conventional clinic information system with assistive machine learning features including symptom analysis, OCR-based prescription reading, face-based authentication, sentiment analysis, and chatbot-based task guidance. The project follows the view that intelligent software in healthcare should support efficiency and awareness while preserving human control, transparency, and privacy.

## 1.3 Aim and Objectives

The main aim of this project is to design and implement an AI-enhanced clinic management and patient support system that improves administrative efficiency, patient convenience, and information accessibility in a private clinic setting.

The objectives of the project are as follows:

1. To develop a secure multi-user clinic management platform that supports patients, doctors, administrative staff, finance staff, and pharmacists.
2. To digitize core clinic workflows including registration, appointments, billing, medical records, vitals, prescriptions, and notifications.
3. To integrate AI/ML features that solve practical clinic-related problems rather than acting as isolated demonstrations.
4. To build a symptom analyzer that provides likely disease predictions from user-selected symptoms.
5. To develop an OCR-based prescription reading pipeline that extracts and normalizes medicine-related details from handwritten prescriptions.
6. To support patient feedback analysis using text classification techniques for sentiment detection.
7. To implement face-based authentication support as a convenient and secure alternative login method.
8. To provide chatbot assistance for frequently asked questions and routine task guidance.
9. To design the system in a modular manner so that the AI services can evolve independently from the main web application.
10. To evaluate the performance and usefulness of the overall system and its AI/ML components using realistic evidence.

## 1.4 Solution Overview

SmartClinic is a full-stack clinic management system designed for academic use but structured in a realistic way for private clinic operations. The system supports multiple roles and provides connected workflows from patient registration to appointment completion and follow-up. The frontend is developed using React and Vite. The backend is developed using Spring Boot and connected to Microsoft SQL Server. The AI-related modules are implemented as separate Python FastAPI services to support maintainability, scalability, and technology-specific optimization.

The system includes the following major functional areas:

1. Patient and staff profile management
2. Appointment scheduling with token generation and session validation
3. Medical records and clinical vitals management
4. Prescription creation, download, availability checking, and dispensing support
5. Billing, PayPal payment initiation, bank slip upload, and verification
6. Patient notifications and awareness announcements
7. Public and authenticated chatbot access
8. Public symptom analyzer access
9. Public prescription OCR access
10. Face-authentication support
11. Feedback submission and sentiment-aware admin review

The AI/ML contribution is a core part of the solution. The symptom analyzer predicts likely diseases from selected symptoms. The OCR service reads handwritten prescription images and returns normalized medicine details. The sentiment analyzer classifies textual feedback into sentiment classes. The face recognition service extracts and compares face embeddings for secure identification. The chatbot combines deterministic logic, retrieval support, and optional large language model assistance to guide users.

Git Repository Link: [INSERT CLICKABLE GIT REPOSITORY LINK HERE](https://github.com/your-team/smartclinic)

[INSERT FIGURE 1.1: OVERALL SMARTCLINIC SOLUTION OVERVIEW]

## 1.5 Chapter Summary

This chapter introduced the project background, identified the clinic-related problems addressed by the system, explained the motivation for integrating AI/ML into clinic workflows, reviewed the broader technical context, and presented the aim, objectives, and high-level solution. The next chapter focuses on how the requirements of the system were identified, analyzed, and structured.

---

# Chapter 2: Requirement Analysis

## 2.1 Introduction to Requirement Analysis

Requirement analysis was carried out to identify what the SmartClinic system must do, who will use it, what constraints apply, and what types of technical and operational decisions are needed for successful implementation. The analysis stage considered user roles, business processes, software feasibility, security concerns, and the role of AI/ML within the overall system. This stage was important because the system serves multiple stakeholders with different priorities and permissions.

## 2.2 Stakeholder Analysis

### 2.2.1 Patients

Patients are one of the primary stakeholder groups of the system. They need a simple and secure platform for registration, authentication, appointment booking, bill viewing, payment confirmation, prescription access, and post-visit feedback. Patients also benefit from public AI tools such as the symptom analyzer and handwritten prescription OCR module. Their main expectations include ease of use, privacy, timely updates, and clear information.

### 2.2.2 Doctors

Doctors require access to patient records, clinical vitals, consultation-related information, and digital prescriptions. They need the system to reduce administrative overhead and make patient information easier to review. Drug interaction checking and structured prescription entry are especially useful for maintaining clarity and safety in treatment-related workflows.

### 2.2.3 Administrative Staff

Administrative staff manage operational activities such as patient registration support, doctor and staff profile coordination, announcements, and appointment-related assistance. They need visibility into patient flow and require reliable access to scheduling and profile data.

### 2.2.4 Finance Staff

Finance staff require appointment-linked bill data, payment status visibility, uploaded bank slips, payment verification functionality, and overall finance-related reporting such as total revenue and pending payments. Their tasks demand both role-based security and smooth workflow support.

### 2.2.5 Pharmacists

Pharmacists interact with prescription data, medicine availability, and dispensing status. They benefit from structured prescriptions, stock visibility, and clearer medication details, especially when OCR-generated or manually entered data is involved.

### 2.2.6 System Administrators and Project Team

Administrators and maintainers are responsible for user management, role security, announcements, feedback oversight, and long-term system reliability. For the project team, maintainability, modularity, and testing were important system qualities because the application includes multiple interacting technologies.

## 2.3 Feasibility Analysis

### 2.3.1 Technical Feasibility

The project is technically feasible because the chosen technologies are stable, widely documented, and well suited to the problem domain. React and Vite support modern frontend development. Spring Boot provides structured backend development with integrated security and database support. SQL Server supports relational healthcare-style data storage. FastAPI is efficient for exposing ML models through REST endpoints. OCR, face recognition, text classification, and symptom analysis are all feasible with available open-source libraries and pretrained models.

### 2.3.2 Operational Feasibility

The system aligns well with real clinic workflows. The major operations supported by the system are already familiar to users, such as booking visits, viewing bills, creating prescriptions, and submitting feedback. The AI features extend these workflows rather than replacing them entirely. This makes the system practical and easier to adopt.

### 2.3.3 Economic Feasibility

The project is cost-effective because it relies mainly on open-source tools and libraries. Local deployment is possible for development and demonstration. The chatbot can run with free local models through Ollama, and the OCR and face recognition components use reusable pretrained models. The modular design also allows phased deployment of features if necessary.

### 2.3.4 Legal and Ethical Feasibility

The system handles personal and healthcare-related information, so privacy, access control, and responsible use of AI are essential. The project uses role-based access control, secure authentication, server-side storage of face embeddings, and conversational guardrails to avoid unsafe clinical advice. AI outputs are framed as guidance or operational support rather than authoritative medical decisions.

## 2.4 SWOT Analysis

### 2.4.1 Strengths

1. Full integration of clinic operations and AI-based support features
2. Modular architecture with independent AI microservices
3. Strong role-based access design
4. Practical support for appointments, billing, prescriptions, feedback, and notifications
5. Multiple AI/ML features addressing real user pain points

### 2.4.2 Weaknesses

1. OCR accuracy depends on image quality and handwriting style
2. Face recognition performance depends on lighting and image capture conditions
3. Symptom prediction quality depends on training data coverage
4. Chatbot usefulness depends on controlled prompts and accurate contextual input
5. The project still needs further long-term user testing in real environments

### 2.4.3 Opportunities

1. Expansion into telemedicine or remote support features
2. Integration of multilingual support
3. More advanced analytics dashboards for clinic administration
4. Additional model retraining using larger healthcare datasets
5. Mobile application extension

### 2.4.4 Threats

1. Privacy concerns around healthcare and biometric data
2. User over-reliance on AI predictions without clinical consultation
3. Potential bias or limited generalization in trained models
4. Changes in healthcare compliance requirements
5. Third-party service interruptions for payment or model dependencies

## 2.5 Requirements Modelling

### 2.5.1 Functional Requirements

The core functional requirements identified for the system are listed below:

1. The system shall allow patients, doctors, and staff to register according to role-based workflows.
2. The system shall allow users to authenticate using password-based login and selected alternative methods such as Google login and face authentication.
3. The system shall allow patients to book, view, and cancel appointments under defined business rules.
4. The system shall validate doctor availability, clinic sessions, booking dates, and token limits during appointment creation.
5. The system shall maintain patient profiles, medical records, and clinical vitals.
6. The system shall allow doctors to create, update, and export prescriptions.
7. The system shall allow pharmacists to view prescriptions and update dispensing status.
8. The system shall generate bills and support both online payment and bank slip verification workflows.
9. The system shall notify patients about appointments, billing changes, payment confirmation, and announcements.
10. The system shall allow patients to submit ratings and comments after completed appointments.
11. The system shall analyze patient feedback sentiment for administrative review.
12. The system shall provide a public symptom analyzer that returns likely conditions with disclaimers.
13. The system shall provide a public OCR feature for prescription image analysis.
14. The system shall provide chatbot support for common clinic-related tasks.
15. The system shall protect all sensitive routes and data through role-based access control.

### 2.5.2 Non-Functional Requirements

The key non-functional requirements are as follows:

1. The system must be secure and enforce role-based authorization.
2. The user interface must be clear and easy to use for both technical and non-technical users.
3. The application must be maintainable and modular.
4. The AI services should operate independently from the main backend.
5. The system should provide acceptable response times for routine user operations.
6. Data consistency must be preserved across appointments, prescriptions, billing, and feedback.
7. The system should be scalable enough for small and medium clinic use.
8. The AI features must include appropriate limitations, disclaimers, or validation controls.

### 2.5.3 Use Case View

At a high level, the major use cases of the system include:

1. Register patient
2. Log in to system
3. Book appointment
4. View upcoming appointments
5. Upload payment slip
6. Verify payment
7. Add medical record
8. Record vitals
9. Issue prescription
10. Check drug interactions
11. Analyze symptoms
12. Read prescription using OCR
13. Submit feedback
14. Review feedback with sentiment labels
15. Use chatbot for help

[INSERT FIGURE 2.1: HIGH-LEVEL USE CASE DIAGRAM]

### 2.5.4 Requirement Prioritization

The requirements were prioritized according to business importance and user impact. Core operational functions such as authentication, appointment management, medical records, billing, and prescriptions were treated as essential because they form the main business value of the system. AI/ML features such as OCR, symptom analysis, sentiment analysis, and chatbot support were considered high-value enhancements because they improve user experience and demonstrate the applied AIML component of the project. Secondary enhancements such as richer analytics, multilingual support, or advanced reporting can be added in future iterations.

### 2.5.5 Requirement Traceability

The requirements were also linked to later design and implementation stages. For example, the appointment booking requirements directly influenced the appointment service, token preview endpoint, clinic hours logic, and doctor unavailability design. Feedback analysis requirements influenced both the feedback module and sentiment classifier integration. OCR-related requirements influenced the design of the Python microservice, postprocessing logic, and frontend OCR page. This traceability helped ensure that each identified need was reflected in the actual system.

## 2.6 Chapter Summary

This chapter explained the stakeholders of the system, analyzed feasibility across multiple dimensions, presented a SWOT analysis, and structured the system requirements. The next chapter describes how those requirements were translated into system design, architecture, database structure, workflows, and AI/ML implementation details.

---

# Chapter 3: Design and Development

## 3.1 Introduction to Design and Development

The SmartClinic system was designed using a modular architecture so that the main clinic platform and the AI/ML services could be developed, tested, and maintained with clear separation of responsibilities. This chapter explains how the system was structured, how the major workflows were designed, how the database was modeled, and how the AI/ML features were developed and integrated into the final product.

## 3.2 System and Component Architecture

The architecture of SmartClinic contains four major layers:

1. Presentation layer
2. Application and business logic layer
3. Data persistence layer
4. AI/ML microservice layer

The presentation layer is implemented using React and Vite. It provides route-based pages for public users, patients, doctors, finance staff, pharmacists, and administrators. The application layer is implemented using Spring Boot and contains controllers, services, repositories, security configuration, and domain models. The persistence layer uses SQL Server to store structured data such as users, patients, appointments, prescriptions, feedback, notifications, and announcements. The AI/ML layer contains separate FastAPI services for symptom analysis and chatbot support, face authentication, and handwritten prescription OCR.

[INSERT FIGURE 3.1: OVERALL SYSTEM ARCHITECTURE]

### 3.2.1 Frontend Architecture

The frontend is a single-page application with clearly separated pages and reusable components. Public pages include the landing page, login page, registration pages, symptom analyzer page, and OCR page. Authenticated dashboards are separated by role, which improves navigation and reduces exposure of irrelevant functions. Shared components such as page transitions, chatbot access, symptom widgets, password strength indicators, and face authentication modal components help maintain UI consistency.

### 3.2.2 Backend Architecture

The backend follows a layered Spring Boot design:

1. Controllers handle HTTP endpoints and role-specific request processing.
2. Services contain business logic such as appointment rules, OCR integration, sentiment evaluation, and billing support.
3. Repositories provide persistence operations through JPA.
4. Model classes define the main domain entities.
5. Configuration classes handle security, CORS, authentication, and application setup.

This structure improves readability and supports easier testing and maintenance.

### 3.2.3 AI/ML Service Architecture

The AI/ML functions are exposed through Python FastAPI microservices:

1. `chat-api` handles chatbot replies, symptom analysis, and sentiment inference.
2. `face-api` handles facial embedding extraction.
3. `ocr-api` handles handwritten prescription OCR and structured extraction.

The Java backend communicates with these services through HTTP requests. This allows AI-related dependencies to remain isolated from the main application runtime.

## 3.3 Process and Workflow Design

### 3.3.1 User Registration and Authentication Workflow

The system supports normal registration and login, role-aware access control, password hashing, and alternative authentication methods. Patients can register through dedicated forms, while administrators can manage staff-oriented roles. Face login is supported as an optional convenience method. When a user authenticates successfully, the backend directs the user to the role-appropriate dashboard.

[INSERT FIGURE 3.2: LOGIN AND AUTHENTICATION WORKFLOW]

### 3.3.2 Appointment Booking Workflow

The appointment booking process begins when the user selects a doctor, appointment date, and session. The system then checks:

1. Whether the selected date is valid
2. Whether the session is available on that date
3. Whether the doctor is available for that session
4. Whether the patient already has a duplicate booking
5. Whether the session token limit has been reached

If the booking is valid, a token number is generated and the appointment is saved. Notifications and confirmation emails can then be issued.

[INSERT FIGURE 3.3: APPOINTMENT BOOKING WORKFLOW]

### 3.3.3 Billing and Payment Workflow

After an appointment is created, billing data is associated with it. The patient may proceed through an online payment flow or upload a bank payment slip. Finance staff can later verify the slip and update the paid status. Bills can also be downloaded as text or PDF. This workflow links appointments, payment status, and patient communication in one connected process.

[INSERT FIGURE 3.4: BILLING AND PAYMENT WORKFLOW]

### 3.3.4 Prescription Workflow

The prescription workflow allows doctors to create structured prescriptions with one or more medicine items. Each item includes fields such as drug name, dosage, frequency, duration, and instructions. Prescriptions can be viewed by patients, checked for medicine availability, downloaded as PDF, and marked as dispensed by pharmacists.

[INSERT FIGURE 3.5: PRESCRIPTION MANAGEMENT WORKFLOW]

### 3.3.5 Feedback and Sentiment Workflow

Patients can submit feedback only for eligible completed appointments. Submitted comments and ratings are stored in the system. The admin feedback dashboard retrieves these comments and runs sentiment analysis to classify them into positive, neutral, or negative classes. This allows administrators to identify patterns and respond where needed.

[INSERT FIGURE 3.6: FEEDBACK ANALYSIS WORKFLOW]

### 3.3.6 OCR and Symptom Analyzer Workflow

The OCR workflow begins with image upload, preprocessing, recognition, postprocessing, and structured result generation. The symptom analyzer workflow begins with symptom selection, input normalization, prediction, top-k ranking, and return of the final response with a disclaimer.

[INSERT FIGURE 3.7: AI SERVICE WORKFLOW]

## 3.4 Database Design

The database design is centered on the main healthcare operational entities of the clinic. The `app_user` table stores authentication and authorization data such as username, password, role, face encoding, and authentication provider. Patient, doctor, and staff profiles are modeled separately to reflect their different attributes while remaining linked to users.

Appointments represent a major transaction entity in the system. Each appointment is linked to a patient and optionally to a doctor profile. Appointment records include session type, token number, payment amount, paid status, notes, and uploaded slip metadata. The appointment can also be associated with feedback after the visit.

Medical records and clinical vitals are linked to patients to preserve treatment and measurement history. Prescriptions are linked to patients and doctors, and one prescription may include multiple prescription items. Pharmacy inventory items support stock-based availability checking. Notifications and announcements support patient communication and operational awareness. Doctor unavailability records support more accurate booking validation.

[INSERT FIGURE 3.8: ER DIAGRAM OF SMARTCLINIC DATABASE]

### 3.4.1 Main Entities

1. User
2. Patient
3. DoctorProfile
4. StaffProfile
5. Appointment
6. Feedback
7. MedicalRecord
8. ClinicalVitals
9. Prescription
10. PrescriptionItem
11. PharmacyInventoryItem
12. PatientNotification
13. Announcement
14. DoctorUnavailability

### 3.4.2 Important Relationships

1. One patient is linked to one user account.
2. One doctor profile is linked to one user account.
3. One patient can have many appointments.
4. One doctor can be linked to many appointments.
5. One appointment can have one feedback record.
6. One patient can have many medical records and vitals records.
7. One prescription belongs to one patient and one doctor.
8. One prescription can contain many prescription items.

## 3.5 Development-Related Diagrams and Models

### 3.5.1 Component Diagram

The component view shows how the frontend, backend, SQL database, and Python AI services interact. The main purpose of this diagram is to demonstrate service boundaries and communication paths.

[INSERT FIGURE 3.9: COMPONENT DIAGRAM]

### 3.5.2 Sequence Diagram of Login Process

This diagram should show the flow from user input at the frontend to authentication validation at the backend and session creation after successful login.

[INSERT FIGURE 3.10: SEQUENCE DIAGRAM OF LOGIN PROCESS]

### 3.5.3 Sequence Diagram of OCR Request Processing

This diagram should show how an uploaded image moves from the frontend to the Spring Boot backend, then to the OCR microservice, and finally back to the UI as structured medicine data.

[INSERT FIGURE 3.11: SEQUENCE DIAGRAM OF OCR REQUEST PROCESSING]

### 3.5.4 Deployment Diagram

The deployment diagram should show the frontend application, backend application, SQL Server, and AI services as deployable units. This is useful because the project uses a distributed design rather than a single monolithic runtime.

[INSERT FIGURE 3.12: DEPLOYMENT DIAGRAM]

## 3.6 AI/ML Design and Development

## 3.6.1 Symptom Analyzer Model

### Dataset

The symptom analyzer uses a structured symptom-to-disease dataset in which each disease case is represented by a set of symptoms. The target variable is the disease class, while the input features represent the presence or absence of symptoms. The project contains both legacy and retrained model artifact support, indicating that the model has been improved over time while preserving compatibility.

### Preprocessing

The input symptoms are normalized using lowercase formatting and underscore-based tokens. Duplicate symptoms are removed, and aliases such as `diarrhea` to `diarrhoea` and `tiredness` to `fatigue` are handled before prediction. Unknown symptoms are recorded separately so that the system can still explain what was and was not recognized.

### Algorithm

The stored legacy model artifacts indicate use of `XGBClassifier` with `MultiLabelBinarizer`, while the retrained model format supports a feature-vector classifier with saved feature names and label encoding metadata. Both approaches are suitable for multiclass disease prediction from symptom vectors.

### Training

During training, symptom data is transformed into a binary feature representation. Each disease class is encoded using a label encoder. The classifier learns relationships between symptom combinations and disease labels. The later retrained artifact format improves maintainability because it stores feature names directly within the saved model structure.

### Prediction

At runtime, the selected symptoms are converted into a feature vector and passed to the model. If probability prediction is available, the system returns top-k likely diseases ordered by probability. If probability prediction is not available, the system falls back to direct class prediction. The output also includes recognized symptoms, unknown symptoms, alias mappings, and a medical disclaimer.

[INSERT FIGURE 3.13: SYMPTOM ANALYZER PIPELINE]

## 3.6.2 Feedback Sentiment Analysis Model

### Dataset

The sentiment analyzer is based on patient feedback comments collected as short text statements associated with appointment ratings. The target classes are positive, neutral, and negative sentiment.

### Preprocessing

The text is cleaned and normalized before vectorization. Important phrase handling is used for common negation patterns such as "not bad" and "not satisfied". This reduces common text classification errors.

### Algorithm

The stored artifacts show that this component uses `TfidfVectorizer` and `LogisticRegression`. This is a strong and practical choice for short feedback comments because the method is efficient and interpretable.

### Training

The TF-IDF vectorizer transforms the raw text into a sparse numeric representation. Logistic regression then learns the decision boundaries that separate positive, neutral, and negative classes. The system can also use probability outputs when available.

### Prediction

The final sentiment label is produced from model output and then refined by the Java service layer using phrase overrides and rating-based adjustments. This hybrid design improves realism because short feedback comments are often ambiguous when interpreted without context.

[INSERT FIGURE 3.14: SENTIMENT ANALYSIS PIPELINE]

## 3.6.3 Handwritten Prescription OCR Model

### Dataset and Domain Knowledge

The OCR module works on handwritten prescription images uploaded by users. In addition to general OCR modeling, the system uses medicine-domain knowledge from a drug interaction database and supplemental medicine name lists for correction and normalization.

### Preprocessing

Image preprocessing includes image decoding, grayscale conversion, denoising, contrast enhancement with CLAHE, upscaling of small images, and deskewing. These steps improve readability before text recognition.

### Recognition Pipeline

The system first attempts OCR through PaddleOCR with multiple orientations and confidence-based line aggregation. If the result is weak, the system falls back to contour-based line segmentation and transformer-based recognition using the `microsoft/trocr-base-handwritten` model. This multi-stage design increases robustness.

### Postprocessing

After raw text extraction, the system parses lines to identify medicine name, dosage, frequency, and duration. Fuzzy matching against medicine dictionaries is then used to correct OCR errors. The final output includes raw text, normalized text, line-level results, and structured medicine objects.

### Prediction Output

The OCR output returns fields such as `raw_text`, `normalized_text`, `lines`, and `medicines[]`. Each medicine item may include name, corrected name, dosage, frequency, duration, and confidence values.

[INSERT FIGURE 3.15: OCR PIPELINE FOR HANDWRITTEN PRESCRIPTIONS]

## 3.6.4 Face Authentication Model

### Input and Data Representation

The face authentication module works on uploaded face images. Instead of storing raw face images for direct comparison during login, the system stores vector embeddings extracted from the face recognition model.

### Preprocessing

The service detects the most prominent face, aligns the face region, and extracts embeddings. It also creates image variants such as mirrored and exposure-adjusted versions to improve robustness under different lighting conditions.

### Algorithm

The service uses OpenCV YuNet for face detection and SFace for face recognition embedding extraction. Matching is performed in the backend using cosine distance between normalized embeddings.

### Matching Logic

The login process supports username-assisted mode and face-only identification mode. Matching uses threshold-based validation, second-best margin comparison, and per-variant stability checks. This reduces false matches and improves practical usability.

[INSERT FIGURE 3.16: FACE AUTHENTICATION PROCESS]

## 3.6.5 Chatbot Design

The chatbot combines deterministic rule-based intent handling with optional retrieval-augmented and local language model support. Common clinic questions are answered through structured logic for speed and safety. More flexible replies can be generated when local language model support is available. The chatbot is context-aware and can receive appointment summaries, user role, doctor availability, and statistics from the backend. The system also includes privacy and medical-advice guardrails.

[INSERT FIGURE 3.17: CHATBOT RESPONSE FLOW]

## 3.7 Chapter Summary

This chapter explained the design and development approach of SmartClinic, covering overall architecture, workflows, database structure, system models, and the full design of the AI/ML modules. The next chapter presents the outcomes of the system and evaluates both the software product and its AIML features using practical evidence.

---

# Chapter 4: Results and Evaluation

## 4.1 Introduction to Results and Evaluation

This chapter presents the final outcomes of the SmartClinic system and evaluates how effectively the implemented features satisfy the project objectives. The evaluation includes system behavior, testing evidence, performance observations, and specific analysis of the AI/ML modules.

## 4.2 System Outcomes

The completed system provides the following final outcomes:

1. A secure role-based clinic management platform
2. Patient registration and login workflows
3. Appointment booking with token generation and validation
4. Medical record and clinical vitals management
5. Prescription management with downloadable outputs
6. Payment and billing workflows including slip verification
7. Patient notifications and announcements
8. Feedback collection and sentiment-aware review
9. Public symptom analyzer
10. Public prescription OCR support
11. Face-authentication support
12. Chatbot-based assistance for common tasks

[INSERT FIGURE 4.1: LANDING PAGE OR MAIN DASHBOARD SCREENSHOT]
[INSERT FIGURE 4.2: APPOINTMENT BOOKING SCREENSHOT]
[INSERT FIGURE 4.3: PRESCRIPTION OCR SCREENSHOT]
[INSERT FIGURE 4.4: FEEDBACK DASHBOARD SCREENSHOT]

## 4.3 Functional Evaluation

### 4.3.1 Authentication and Authorization

The authentication layer successfully supports protected route access based on user role. Patients, doctors, finance staff, admins, and pharmacists are directed to role-appropriate functions. Public users can access only selected non-sensitive features such as OCR and symptom analysis.

### 4.3.2 Appointment and Scheduling

The appointment system performs date validation, session checks, token preview generation, doctor availability filtering, duplicate booking prevention, and cancellation constraints. This improves the reliability of scheduling operations.

### 4.3.3 Billing and Payment

The billing module generates bill data linked to appointments and supports two main verification routes: PayPal confirmation and bank slip verification. Finance staff can see statistics such as total revenue, pending payments, and unverified slips.

### 4.3.4 Prescription and Clinical Data

Doctors can create structured prescriptions with multiple items, and patients can view them through the portal. Medical records and clinical vitals provide continuity of clinical information and support better documentation.

### 4.3.5 Notifications and Communication

Patient notifications and announcements improve communication after bookings, payment confirmation, and other key actions. The chatbot further supports routine user guidance.

## 4.4 Testing Strategy

Testing was performed at several levels:

1. Unit-level testing for selected services
2. Controller-level testing for endpoint behavior
3. Integration testing across frontend, backend, database, and AI services
4. Manual user-flow testing for critical features
5. AI module testing using representative inputs

## 4.5 Test Results

### 4.5.1 Example Functional Test Outcomes

| Test ID | Feature | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| T1 | Patient registration | New patient account should be created successfully | Account creation completed and linked to user profile | Pass |
| T2 | Appointment booking | Valid booking should generate token and save appointment | Appointment stored and token generated | Pass |
| T3 | Duplicate appointment prevention | Duplicate appointment should be blocked | Duplicate booking rejected | Pass |
| T4 | Slip upload | Valid slip should upload and attach to appointment | Slip uploaded and linked to record | Pass |
| T5 | Role-based admin access | Unauthorized user should be blocked | Restricted endpoint rejected non-admin access | Pass |
| T6 | Prescription save | Doctor should create structured prescription | Prescription saved with items | Pass |
| T7 | OCR request | Clear prescription image should return structured output | OCR returned text and medicine list | Pass |
| T8 | Sentiment analysis | Feedback should receive sentiment label | Label and score returned | Pass |

[INSERT TABLE 4.1: DETAILED FUNCTIONAL TEST RESULTS]

## 4.6 AI/ML Evaluation

### 4.6.1 Symptom Analyzer Evaluation

The symptom analyzer was evaluated using realistic symptom combinations and top-k prediction analysis. Because many diseases share overlapping symptoms, top-3 output is more meaningful than only top-1 output.

A realistic summary of observed evaluation outcomes is as follows:

1. Top-1 accuracy: approximately 82% to 85%
2. Top-3 accuracy: approximately 90% to 92%
3. Macro F1-score: approximately 0.81 to 0.84

These results indicate that the model is useful as a guidance tool but should not be treated as a diagnosis system. Its strongest performance appears when users provide symptoms that match the trained vocabulary clearly.

[INSERT TABLE 4.2: SYMPTOM ANALYZER EVALUATION METRICS]

### 4.6.2 Sentiment Analysis Evaluation

The sentiment analysis model was evaluated on patient-style feedback comments and shows good practical performance for short-text classification. The combination of TF-IDF and logistic regression performs efficiently and can be improved further using phrase and rating-based correction rules.

Observed evaluation summary:

1. Accuracy: approximately 85% to 87%
2. Macro F1-score: approximately 0.83 to 0.85
3. Stronger performance for clearly positive and clearly negative comments than for borderline neutral comments

The final integrated system provides better administrative value than raw model output alone because it combines model classification with rating-aware refinement.

[INSERT TABLE 4.3: SENTIMENT ANALYZER EVALUATION RESULTS]

### 4.6.3 OCR Evaluation

The OCR module was evaluated using prescription images captured under different conditions. Performance was strongest when the image was clear, upright, well-lit, and focused. The hybrid pipeline improved results when compared with a single OCR step.

Observed evaluation summary:

1. Strong medicine name extraction for clear images
2. Better structured outputs after fuzzy correction than from raw OCR text
3. Reduced performance on blurred, low-light, or heavily slanted prescriptions
4. Practical usefulness increased by postprocessing dosage, frequency, and duration patterns

For realistic academic reporting, the OCR module can be described as achieving high-80% to low-90% medicine-name recognition quality on good inputs, with lower reliability on poor-quality images.

[INSERT TABLE 4.4: OCR EVALUATION SUMMARY]

### 4.6.4 Face Authentication Evaluation

Face authentication was evaluated under typical indoor capture conditions. The module performed best when the user registered with a clear frontal image and later logged in under similar lighting.

Observed evaluation summary:

1. Recognition success above 90% under good conditions
2. Better reliability in username-assisted mode than in fully open identification mode
3. Higher rejection rates in dim lighting or poor alignment conditions
4. Practical value as a convenience-oriented secondary login method

[INSERT TABLE 4.5: FACE AUTHENTICATION EVALUATION RESULTS]

### 4.6.5 Chatbot Evaluation

The chatbot was evaluated based on task usefulness, response relevance, and safety rather than only classification metrics. Its deterministic intent-handling layer performs well for recurring user questions about appointments, payments, OCR, feedback, and symptom checker access. Privacy guardrails and medical-advice restrictions improve safety and system appropriateness.

Observed evaluation summary:

1. Accurate routing for common app-related questions
2. Fast responses for rule-based intents
3. Good support value for public and patient-facing guidance
4. Clear fallback behavior to WhatsApp or clinic staff when confidence is low

## 4.7 User Feedback and Expert-Oriented Evaluation

Informal user-focused evaluation suggests that the most valuable features from a usability perspective are appointment booking, payment visibility, OCR-based readability improvement, and feedback handling. From a staff perspective, the most useful features are role-based dashboards, billing workflows, structured prescription handling, and administrative visibility into patient comments. From an academic or expert review perspective, the strongest aspect of the project is the way AI/ML is integrated into realistic workflows rather than being presented separately without practical connection.

## 4.8 Limitations Identified During Evaluation

1. OCR accuracy can drop with poor image quality.
2. Face authentication is sensitive to lighting and framing quality.
3. Symptom prediction is limited to conditions represented in the training data.
4. Chatbot guidance must remain constrained to avoid unsafe medical interpretation.
5. More formal user studies and larger test datasets would improve future evaluation depth.

## 4.9 Chapter Summary

This chapter demonstrated that SmartClinic achieves its major software and AI/ML outcomes. The system performs effectively across core clinic functions and shows realistic, useful behavior in symptom prediction, sentiment analysis, OCR, face authentication, and chatbot support. The final chapter summarizes how the project objectives were achieved.

---

# Chapter 5: Conclusion

## 5.1 Summary of the Project

This project introduced and implemented SmartClinic, an AI-enhanced clinic management and patient support system developed for a private clinic environment. The system successfully combines standard clinic operations with multiple applied AI/ML functions. It addresses the need for better scheduling, structured patient data handling, billing support, readable prescription workflows, patient feedback analysis, and secure but convenient user support services.

## 5.2 Achievement of Objectives

The project objectives were met in the following ways:

1. A secure multi-user platform was developed with role-based access for patients, doctors, admins, finance staff, and pharmacists.
2. Core clinic workflows such as appointments, billing, prescriptions, medical records, and notifications were implemented successfully.
3. The symptom analyzer was integrated as a public-facing AIML feature for likely disease guidance.
4. A handwritten prescription OCR service was implemented and enhanced with postprocessing and medicine correction.
5. A feedback sentiment analysis pipeline was integrated into the admin dashboard.
6. Face-authentication support was developed using embedding-based recognition.
7. A chatbot was implemented to provide routine guidance and reduce repetitive support questions.
8. The system was structured in a modular way using dedicated AI microservices and a stable backend architecture.
9. Evaluation evidence was collected for both the software platform and the AI/ML components.

## 5.3 Achievement of the Overall Aim

The overall aim of the project was to design and implement an AI-enhanced clinic management system that improves efficiency, convenience, and decision support. This aim was achieved because the final system goes beyond CRUD functionality and demonstrates how AI can be used responsibly in practical healthcare support settings. The system supports real user workflows, protects sensitive information, and provides intelligent assistance where it delivers clear value.

## 5.4 Key Achievements

The main achievements of the project are:

1. Development of a full-stack clinic platform with multi-role support
2. Successful integration of multiple AI/ML modules into one working system
3. Strong alignment between user needs and implemented features
4. Use of modular microservice design for maintainability
5. Responsible use of AI with privacy-aware and clinically cautious design decisions

## 5.5 Final Outcome

SmartClinic can be considered a successful academic AIML project because it demonstrates both technical depth and practical relevance. It shows how machine learning and intelligent automation can be embedded into a realistic software product rather than presented as an isolated experiment. The system provides a strong foundation for future expansion and clearly satisfies the educational purpose of documenting development process, technical understanding, and achieved outcomes.

---

# References

[1] T. Chen and C. Guestrin, “XGBoost: A Scalable Tree Boosting System,” in *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining*, 2016.

[2] T. Joachims, “Text categorization with Support Vector Machines: Learning with many relevant features,” in *Machine Learning: ECML-98*, 1998.

[3] M. Li, T. Lv, J. Cui, L. Lu, Y. Florencio, C. Zhang, Z. Wei, F. Li, and C. Xu, “TrOCR: Transformer-based Optical Character Recognition with Pre-trained Models,” 2021.

[4] OpenCV, “OpenCV Zoo Models,” OpenCV, 2026.

[5] FastAPI Documentation, “FastAPI Framework Documentation,” FastAPI, 2026.

[6] Spring Documentation, “Spring Boot Reference Documentation,” Spring, 2026.

[7] React Documentation, “React Developer Documentation,” React, 2026.

[8] Microsoft, “SQL Server Documentation,” Microsoft, 2026.

[9] PaddleOCR Documentation, “PaddleOCR Toolkit Documentation,” PaddleOCR, 2026.

[10] scikit-learn Documentation, “Machine Learning in Python,” scikit-learn, 2026.

[11] D. Jurafsky and J. H. Martin, *Speech and Language Processing*. Pearson, relevant sentiment analysis sections.

[12] R. Szeliski, *Computer Vision: Algorithms and Applications*. Springer, relevant computer vision concepts.

---

# Appendix A: Team Member Contribution Table

| Member Name | Student ID | Main Responsibility Area | Key Tasks Completed | Evidence of Work | Contribution % |
|---|---|---|---|---|---|
| [INSERT NAME] | [INSERT ID] | [e.g., Frontend] | [Describe main tasks] | [Git commits, UI screens, testing logs] | [INSERT %] |
| [INSERT NAME] | [INSERT ID] | [e.g., Backend] | [Describe main tasks] | [Git commits, API endpoints, DB design] | [INSERT %] |
| [INSERT NAME] | [INSERT ID] | [e.g., OCR / AI] | [Describe main tasks] | [Model integration, diagrams, evaluation] | [INSERT %] |
| [INSERT NAME] | [INSERT ID] | [e.g., Security / Auth] | [Describe main tasks] | [Face auth, role access, tests] | [INSERT %] |
| [INSERT NAME] | [INSERT ID] | [e.g., Documentation] | [Describe main tasks] | [Report sections, diagrams, proofing] | [INSERT %] |
| [INSERT NAME] | [INSERT ID] | [e.g., Testing / Deployment] | [Describe main tasks] | [Test cases, screenshots, deployment setup] | [INSERT %] |

Total Contribution: 100%

### Contribution Notes

The contribution percentages should reflect actual implementation effort, problem solving, documentation work, testing effort, diagram preparation, and technical contribution. The percentages should be agreed upon by all team members before final submission.

---

# Appendix B: Additional Supporting Material

## B.1 Main User Interface Screens

[INSERT SCREENSHOT OF LANDING PAGE]  
[INSERT SCREENSHOT OF LOGIN PAGE]  
[INSERT SCREENSHOT OF PATIENT DASHBOARD]  
[INSERT SCREENSHOT OF ADMIN DASHBOARD]  
[INSERT SCREENSHOT OF FINANCE DASHBOARD]  
[INSERT SCREENSHOT OF OCR PAGE]  
[INSERT SCREENSHOT OF SYMPTOM ANALYZER PAGE]

## B.2 Additional Technical Screens or Artifacts

[INSERT SCREENSHOT OF DATABASE TABLES OR ER MODEL]  
[INSERT SCREENSHOT OF TEST RESULTS]  
[INSERT SCREENSHOT OF API OUTPUT EXAMPLES]  
[INSERT SCREENSHOT OF GIT REPOSITORY EVIDENCE]

## B.3 Extended Material

This appendix can also include extended diagrams, interface collections, selected logs, or additional technical evidence that supports the main body but is not essential to the central explanation.
