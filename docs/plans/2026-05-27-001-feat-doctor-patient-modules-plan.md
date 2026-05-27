---
title: Doctor & Patient Module Enhancement Plan
type: feat
status: active
date: 2026-05-27
---

# Doctor & Patient Module Enhancement Plan

## Summary

Enhance the ClinicFlow system with a complete role-based permission system, doctor profile achievements, real SMS/WhatsApp reminders, patient self-booking with clash detection and alternative slot suggestions, and structured patient history storage. The plan spans both backend (Spring Boot) and frontend (React Native/Expo).

---

## Problem Frame

The current system has basic login with no backend security, simulated SMS reminders (console-only), no patient self-service portal, no structured achievements for doctor profiles, and limited slot clash detection. Doctors and receptionists need proper role-based access, patients need self-booking capabilities, and the clinic needs real messaging and reminder delivery.

---

## Requirements

- R1. Role-based authentication and authorization (JWT) with DOCTOR and RECEPTIONIST roles
- R2. Doctor profile with structured achievements/awards field
- R3. Real SMS gateway integration (Twilio) for reminders and bulk messaging
- R4. WhatsApp reminder integration (Twilio WhatsApp API)
- R5. Automated reminder scheduler that sends reminders before appointments
- R6. Patient self-registration and login portal
- R7. Patient self-booking with real-time slot clash detection and alternative slot suggestions
- R8. Structured patient history with visit timeline (not single TEXT field)
- R9. Doctor-side "My Patients" view filtered by assigned doctor
- R10. Patient-side appointment management (view/cancel bookings)
- R11. Doctor assignment to patients for continuity of care

---

## Scope Boundaries

- No admin role or dashboard (future work)
- No video consultation or telemedicine features
- No payment/billing integration
- No file upload for lab reports/prescriptions (future work)
- No native mobile app for patients (patient portal is added within existing Expo app with patient-specific screens)

---

## Context & Research

### Relevant Code and Patterns

- **Backend auth:** `Clinic/src/main/java/com/Clinc_Flow/Clinic/user/` — User entity, UserService, UserController, SecurityConfig
- **Doctor entity:** `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/Doctor.java`
- **Appointment clash detection:** `Clinic/src/main/java/com/Clinc_Flow/Clinic/appointment/AppointmentService.java` — existing overlap query
- **Schedule & slots:** `Clinic/src/main/java/com/Clinc_Flow/Clinic/schedule/ScheduleController.java` — slot generation from availability
- **Reminder skeleton:** `Clinic/src/main/java/com/Clinc_Flow/Clinic/reminder/ReminderService.java` — simulated send only
- **SMS skeleton:** `Clinic/src/main/java/com/Clinc_Flow/Clinic/sms/SmsController.java` — simulated send only
- **Frontend auth context:** `mobile/src/context/AuthContext.js` — currently hardcoded default user
- **Frontend API patterns:** `mobile/src/api/patientApi.js`, `mobile/src/api/doctorApi.js` — fetch-based API client pattern
- **Appointment booking screen:** `mobile/src/screens/AppointmentBookingScreen.js` — existing booking UI with doctor/patient selection
- **Migration pattern:** `Clinic/src/main/resources/db/migration/V*.sql`

### Institutional Learnings

- Password is stored as plaintext — must switch to BCrypt when implementing JWT auth
- Backend currently has zero auth enforcement on any endpoint — SecurityConfig permits all `/api/**`
- Frontend has hardcoded default DOCTOR user in AuthContext — must be replaced with real JWT token flow
- Frontend probes backend IPs dynamically in `patientApi.js` with `ensureApiConnected()`

---

## Key Technical Decisions

- **JWT with Spring Security**: Use Spring Security's built-in JWT support with `spring-boot-starter-security` and `jjwt` library. Issue tokens on login, validate on every request via a custom `OncePerRequestFilter`.
- **BCrypt for passwords**: Replace plaintext comparison with `BCryptPasswordEncoder`.
- **Twilio for SMS + WhatsApp**: Use Twilio Java SDK. Separate service abstraction so provider can be swapped later.
- **Spring @Scheduled for reminders**: Use `@EnableScheduling` with a cron job that runs every 5 minutes to process pending reminders.
- **Separate patient_visits table**: Instead of appending to `medical_history` TEXT field, create a `patient_visits` table with structured diagnosis, prescription, notes, and doctor reference.
- **Patient-doctor assignment**: Add `assigned_doctor_id` FK to patients table for continuity of care.
- **Patient auth**: Add `PATIENT` role to users table. Patient self-registration creates a `User` with PATIENT role + a `Patient` record.
- **Same Expo app for patients**: Patient screens are added as additional stacks in the same app, gated by `user.role === 'PATIENT'`.

---

## Implementation Units

- U1. **[JWT Authentication & RBAC Backend]**

**Goal:** Replace plaintext login with JWT-based authentication. Add role-based authorization to all endpoints.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/config/JwtAuthFilter.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/config/JwtTokenProvider.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/user/dto/AuthResponse.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/config/NoAuthEndpoint.java` (annotation for public endpoints)
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/config/SecurityConfig.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/user/UserService.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/user/UserController.java`
- Modify: `Clinic/src/main/resources/application.properties`
- Test: `Clinic/src/test/java/com/Clinc_Flow/Clinic/user/UserControllerTest.java`

**Approach:**
- Add `spring-boot-starter-security` and `io.jsonwebtoken:jjwt` dependencies to `pom.xml`
- Create `JwtTokenProvider` for generating and validating JWT tokens with user ID and role embedded
- Create `JwtAuthFilter` that reads `Authorization: Bearer <token>` header, validates, and sets `SecurityContext`
- Update `SecurityConfig` to require authentication on all `/api/**` except `/api/auth/**` and public endpoints
- Add `NoAuthEndpoint` annotation for marking specific endpoints as public
- Update `UserController.login()` to return JWT token in response body
- Switch `UserService` to use `BCryptPasswordEncoder` for password comparison
- Add `POST /api/auth/register` endpoint for patient self-registration
- Add method-level security annotations (`@PreAuthorize`) for role-based access on sensitive endpoints

**Test scenarios:**
- Happy path: Valid credentials return JWT with correct user ID and role
- Happy path: Authenticated request with valid JWT accesses protected endpoint successfully
- Error path: Invalid credentials return 401 with error message
- Error path: Expired/invalid JWT returns 401
- Error path: RECEPTIONIST cannot access doctor-only endpoints
- Integration: Patient registration creates both User and Patient records
- Integration: Token refresh or re-issue on subsequent logins

**Verification:**
- `POST /api/auth/login` returns `{ token, user }` with valid JWT
- All existing endpoints still work when called with valid token
- Unauthenticated requests to protected endpoints return 401
- Role-gated endpoints reject unauthorized roles

---

- U2. **[Frontend JWT Integration]**

**Goal:** Replace hardcoded default user with real JWT-based authentication flow. Store token, attach to requests, handle logout.

**Requirements:** R1

**Dependencies:** U1

**Files:**
- Modify: `mobile/src/context/AuthContext.js`
- Modify: `mobile/src/api/authApi.js`
- Modify: `mobile/src/App.js`
- Create: `mobile/src/api/client.js` (axios/fetch wrapper with auth header injection)
- Modify: `mobile/src/api/patientApi.js` (use auth client)
- Modify: `mobile/src/api/doctorApi.js` (use auth client)
- Modify: `mobile/src/api/appointmentApi.js` (use auth client)
- Modify: `mobile/src/api/reminderApi.js` (use auth client)
- Modify: `mobile/src/api/smsApi.js` (use auth client)

**Approach:**
- Create a centralized `client.js` that wraps fetch with automatic `Authorization: Bearer <token>` header from stored token
- Store token in `AsyncStorage` (or `expo-secure-store` for better security)
- `AuthContext` manages user state AND token state; initializes from stored token on app launch
- `LoginScreen` calls `authApi.login()`, stores returned token, sets user
- `authApi.js` no longer uses `ensureApiConnected()` for auth endpoints — login is always unauthenticated
- All other API modules import `client.js` instead of raw fetch, ensuring authenticated requests
- `LogoutBtn` clears token from storage and resets user to null
- Remove hardcoded default user from `AuthContext`

**Test scenarios:**
- Happy path: Login stores token and navigates to main app
- Happy path: App restart with stored token auto-authenticates
- Error path: Expired token on API call shows login screen
- Error path: Logout clears token and shows login screen

**Verification:**
- Login flow works end-to-end from UI
- API calls include Authorization header
- Closing and reopening app preserves session

---

- U3. **[Doctor Achievements & Profile Enhancement]**

**Goal:** Add structured achievements/awards to Doctor profile. Allow doctors to edit their own profile.

**Requirements:** R2

**Dependencies:** U1

**Files:**
- Create: `Clinic/src/main/resources/db/migration/V10__add_doctor_achievements.sql`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/Doctor.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/dto/DoctorRequest.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/dto/DoctorResponse.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/DoctorService.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/DoctorController.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/dto/AchievementDto.java`
- Test: `Clinic/src/test/java/com/Clinc_Flow/Clinic/doctor/DoctorServiceTest.java`

**Approach:**
- Add `achievements` JSONB column to doctors table (stores array of `{ title, year, description }`)
- Doctor entity gets `List<Achievement>` field with JPA converter or `@Type(JsonType)`
- DoctorRequest/DoctorResponse include achievements
- `DoctorController` adds `PUT /api/doctors/{id}/profile` endpoint restricted to the doctor themselves (check JWT subject matches doctor ID)
- Only the doctor themselves (or admin/receptionist) can edit; implement `@PreAuthorize` with SpEL

**Test scenarios:**
- Happy path: Doctor adds achievement with title, year, description
- Happy path: Doctor updates their own profile successfully
- Error path: Non-owner cannot edit doctor's profile
- Edge case: Empty achievements list
- Edge case: Achievement with missing fields (validate required fields)

**Verification:**
- `GET /api/doctors/{id}` returns achievements in response
- `PUT /api/doctors/{id}/profile` with valid token updates achievements
- 403 returned when unauthorized user tries to edit

---

- U4. **[Frontend Doctor Profile with Achievements]**

**Goal:** Update DoctorFormScreen to support achievements editing. Show achievements on DoctorDetailScreen.

**Requirements:** R2

**Dependencies:** U3

**Files:**
- Modify: `mobile/src/screens/DoctorFormScreen.js`
- Modify: `mobile/src/screens/DoctorDetailScreen.js`

**Approach:**
- DoctorFormScreen: Add "Achievements" section with dynamic list of achievement entries (title + year + description), ability to add/remove entries
- DoctorDetailScreen: Show achievements as a styled list/timeline below qualifications
- Profile editing is only allowed if the logged-in user is the doctor (check `user.doctorId`)

**Test scenarios:**
- Happy path: Doctor adds 3 achievements and saves
- Happy path: Achievements display on detail screen
- Edge case: Empty achievements state
- Error path: Non-doctor user sees read-only view

**Verification:**
- Achievements persist after save and re-fetch
- Detail screen shows all achievements correctly

---

- U5. **[Twilio SMS & WhatsApp Gateway]**

**Goal:** Replace simulated SMS with real Twilio integration for SMS and WhatsApp messages.

**Requirements:** R3, R4

**Dependencies:** U1

**Files:**
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/notification/NotificationService.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/notification/TwilioConfig.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/notification/NotificationProvider.java`
- Modify: `Clinic/src/main/resources/application.properties`
- Modify: `Clinic/pom.xml`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/reminder/ReminderService.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/sms/SmsController.java`

**Approach:**
- Add Twilio Java SDK to `pom.xml`
- Create `TwilioConfig` bean that initializes Twilio with account SID and auth token from config
- Create `NotificationService` interface with methods: `sendSms(phone, message)`, `sendWhatsApp(phone, message)`
- Implement `TwilioNotificationService` that calls Twilio API for SMS and WhatsApp
- Add `twilio.account-sid`, `twilio.auth-token`, `twilio.from-number`, `twilio.whatsapp-from-number` to `application.properties`
- Update `ReminderService.processPendingReminders()` to call `NotificationService` instead of logging
- Update `SmsController.bulkSend()` to call `NotificationService` instead of logging
- Add appropriate error handling (retry logic for transient failures)

**Test scenarios:**
- Happy path: SMS is sent via Twilio API successfully
- Happy path: WhatsApp message is sent via Twilio WhatsApp API
- Error path: Invalid phone number returns error
- Error path: Twilio API failure triggers retry
- Integration: Reminder processing sends actual message

**Verification:**
- `NotificationService.sendSms()` actually delivers SMS to recipient
- `NotificationService.sendWhatsApp()` actually delivers WhatsApp message
- Reminder processing sends real messages when cron runs

---

- U6. **[Automated Reminder Scheduler]**

**Goal:** Schedule automatic reminder processing that sends pending reminders before appointments.

**Requirements:** R5

**Dependencies:** U5

**Files:**
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/reminder/ReminderScheduler.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/ClinicApplication.java` (add `@EnableScheduling`)
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/reminder/ReminderService.java`

**Approach:**
- Create `ReminderScheduler` with `@Scheduled(fixedRate = 300000)` (every 5 minutes)
- Calls `reminderService.processPendingReminders()` to send all pending reminders whose `reminderTime` has passed
- Add `@EnableScheduling` to main application class
- Update `ReminderService.createFromAppointment()` to also create WhatsApp reminders alongside SMS
- Add reminder creation trigger when appointment status changes to CONFIRMED (in AppointmentService)

**Test scenarios:**
- Happy path: Pending reminder is automatically sent within 5 minutes
- Happy path: Multiple pending reminders are all sent in one cycle
- Edge case: Reminder with future reminderTime is skipped
- Error path: Failed send marks reminder for retry
- Integration: Creating a CONFIRMED appointment creates a reminder automatically

**Verification:**
- Reminders are sent automatically without manual trigger
- Scheduler logs show processing activity
- Reminders marked as `sent = true` after delivery

---

- U7. **[Patient-Doctor Assignment & My Patients View]**

**Goal:** Add assigned doctor to patient records. Create doctor-specific patient listing.

**Requirements:** R9, R11

**Dependencies:** U1

**Files:**
- Create: `Clinic/src/main/resources/db/migration/V11__add_patient_assigned_doctor.sql`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/Patient.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/PatientController.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/PatientService.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/PatientRepository.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/dto/PatientRequest.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/dto/PatientResponse.java`

**Approach:**
- Add `assigned_doctor_id` FK to patients table (nullable)
- Add `GET /api/patients/my-patients` endpoint that returns patients assigned to the currently authenticated doctor
- Add `GET /api/patients/unassigned` for receptionist to see unassigned patients
- Update patient create/update to support setting `assignedDoctorId`
- Update `PatientRepository` with `findByAssignedDoctorId`

**Test scenarios:**
- Happy path: Doctor sees only their assigned patients in "My Patients"
- Happy path: Receptionist can assign patient to a doctor
- Edge case: Patient with no assigned doctor appears in unassigned list
- Error path: Non-doctor user gets 403 on my-patients endpoint

**Verification:**
- `GET /api/patients/my-patients` returns filtered list based on JWT doctor ID
- Patient form shows doctor assignment dropdown

---

- U8. **[Structured Patient History / Visit Timeline]**

**Goal:** Replace single TEXT field with structured patient_visits table for visit history.

**Requirements:** R8

**Dependencies:** U1

**Files:**
- Create: `Clinic/src/main/resources/db/migration/V12__create_patient_visits_table.sql`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/PatientVisit.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/PatientVisitRepository.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/PatientVisitService.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/dto/PatientVisitRequest.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/dto/PatientVisitResponse.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/patient/PatientController.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/appointment/AppointmentService.java` (save visit notes creates PatientVisit record)

**Approach:**
- Create `patient_visits` table with columns: id, patient_id (FK), doctor_id (FK), appointment_id (FK), visit_date, diagnosis (TEXT), prescription (TEXT), additional_notes (TEXT), created_at
- `PatientVisit` JPA entity with ManyToOne to Patient and Doctor
- `GET /api/patients/{id}/visits` returns all visits for a patient, ordered by date descending
- `POST /api/patients/{id}/visits` creates a new visit record
- Update `AppointmentService.addVisitNotes()` to also create a `PatientVisit` record alongside updating medical history
- Migrate existing medical_history TEXT data by parsing into initial visit entries (or keep as-is, new data uses new structure)

**Test scenarios:**
- Happy path: Visit notes saved as structured record with diagnosis, prescription, notes
- Happy path: Patient visit history returns chronologically ordered list
- Edge case: Patient with no visits returns empty list
- Integration: Saving appointment visit notes creates PatientVisit record
- Happy path: Visit record includes doctor attribution

**Verification:**
- `GET /api/patients/{id}/visits` returns structured JSON array of visits
- Appointment visit notes flow creates both appointment update AND visit record
- Visit records show correct doctor, date, and notes

---

- U9. **[Frontend Patient History Timeline]**

**Goal:** Display structured patient visit history as a timeline on PatientDetailScreen.

**Requirements:** R8

**Dependencies:** U8

**Files:**
- Modify: `mobile/src/api/patientApi.js` (add getVisits method)
- Modify: `mobile/src/screens/PatientDetailScreen.js`

**Approach:**
- Add `patientApi.getVisits(id)` method calling `GET /api/patients/{id}/visits`
- PatientDetailScreen: Replace the flat medical history text with a scrollable timeline view
- Each timeline entry shows: visit date, doctor name, diagnosis, prescription, notes
- Style timeline with date markers, connecting line, colored status indicators

**Test scenarios:**
- Happy path: Patient with 5 visits shows all in timeline order
- Edge case: Patient with no visits shows empty state message
- Edge case: Very long prescription text wraps properly

**Verification:**
- Timeline renders chronologically with correct data
- New visit notes appear in timeline after appointment completion

---

- U10. **[Patient Self-Registration & Login]**

**Goal:** Allow patients to register themselves and log in to the system.

**Requirements:** R6

**Dependencies:** U1, U2

**Files:**
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/user/UserController.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/user/UserService.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/user/dto/RegisterRequest.java`
- Create: `mobile/src/screens/PatientRegisterScreen.js`
- Create: `mobile/src/screens/PatientLoginScreen.js`
- Create: `mobile/src/api/patientAuthApi.js`
- Modify: `mobile/src/App.js`
- Modify: `Clinic/src/main/resources/db/migration/V5__add_user_and_patient_fields.sql` (or new migration to add PATIENT role)

**Approach:**
- Add `PATIENT` to the role enum in User entity (requires SQL migration to alter CHECK constraint)
- Create `POST /api/auth/register` endpoint: accepts name, phone, email, password → creates User with PATIENT role AND Patient record linked by phone/email
- Create `PatientLoginScreen` similar to existing LoginScreen
- Create `PatientRegisterScreen` with registration form
- Update `App.js` to show different navigation based on role:
  - PATIENT → Patient Tabs (dashboard, my appointments, my profile)
  - DOCTOR/RECEPTIONIST → existing MainTabs
- Patient auth flow: Register → auto-login → redirect to patient dashboard

**Test scenarios:**
- Happy path: Patient registers with valid details, gets auto-logged-in
- Happy path: Patient logs in with registered credentials
- Error path: Duplicate phone/email returns validation error
- Error path: Weak password validation
- Integration: Registration creates both User and Patient records linked by phone

**Verification:**
- New patient can register end-to-end
- Login works with registered credentials
- Registered patient appears in patient list for doctors/receptionists

---

- U11. **[Patient Self-Booking with Slot Clash Detection]**

**Goal:** Allow patients to book appointments with real-time clash detection and alternative slot suggestions.

**Requirements:** R7, R10

**Dependencies:** U10

**Files:**
- Create: `mobile/src/screens/PatientBookingScreen.js`
- Create: `mobile/src/screens/PatientAppointmentsScreen.js`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/appointment/AppointmentController.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/appointment/AppointmentService.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/schedule/ScheduleController.java`
- Modify: `mobile/src/api/appointmentApi.js`

**Approach:**
- Backend: Enhance clash detection to also validate against doctor_availability (ensure booking falls within available slots)
- Backend: Enhance `/api/schedule/suggest` endpoint to return better alternative slots near the requested time
- Backend: `POST /api/appointments/patient-book` endpoint specifically for patient self-booking (auto-sets patientId from JWT)
- Frontend: `PatientBookingScreen` shows:
  - Doctor selection (list of active doctors)
  - Date picker
  - Visual slot grid showing available (green), booked (red/gray with "Already Booked" label), and selected (blue) slots
  - If user taps a booked slot → alert: "This slot is already booked. Would you like to see available alternatives?" → shows nearby free slots
  - Confirm booking button
- Frontend: `PatientAppointmentsScreen` shows patient's upcoming and past appointments

**Test scenarios:**
- Happy path: Patient books an available slot successfully
- Error path: Patient taps booked slot → alert shown with alternative suggestions
- Error path: Booking outside doctor's availability → error message
- Edge case: Two patients try to book the same slot simultaneously (pessimistic lock or retry)
- Happy path: Patient views their upcoming appointments
- Happy path: Patient cancels their own booking

**Verification:**
- Patient can complete full booking flow without staff mediation
- Booked slots are visually distinct and not selectable
- Clash shows helpful alert with alternatives
- Appointment appears in doctor's schedule

---

- U12. **[Role-Based Frontend Navigation & Permissions]**

**Goal:** Implement role-gated navigation and feature visibility across the app.

**Requirements:** R1

**Dependencies:** U1, U2

**Files:**
- Modify: `mobile/src/App.js`
- Modify: `mobile/src/screens/PatientDetailScreen.js`
- Modify: `mobile/src/screens/AppointmentDetailScreen.js`

**Approach:**
- Create a `usePermission()` hook that provides boolean checks like `can('edit_doctor')`, `can('book_appointment')`, `can('view_all_patients')`
- Define role-permission mapping: `DOCTOR` has all permissions, `RECEPTIONIST` has patient management + appointment booking, `PATIENT` has self-booking + own appointments view
- Update `App.js` to show three navigation modes:
  1. PATIENT → PatientTabs (Dashboard, My Appointments, My Profile)
  2. DOCTOR → existing MainTabs + "My Patients" tab
  3. RECEPTIONIST → existing MainTabs without Doctors tab
- Hide UI actions that the role doesn't permit (e.g., patient can't see delete buttons)

**Test scenarios:**
- Happy path: DOCTOR sees all tabs including Doctors tab
- Happy path: RECEPTIONIST sees Patients, Calendar, Appointments but not Doctors tab
- Happy path: PATIENT sees only their own dashboard and appointments
- Error path: Direct navigation to unauthorized screen redirects

**Verification:**
- Navigation shows correct tabs per role
- Unauthorized UI elements are hidden

---

## System-Wide Impact

- **Interaction graph:** JwtAuthFilter intercepts all `/api/**` requests. All controllers need token-aware behavior for user identification. Appointment flow now creates reminders on confirmation. Visit notes flow creates PatientVisit records.
- **Error propagation:** JWT validation errors return 401. Twilio failures return error but don't block the main operation. Booking clash returns specific error with alternatives.
- **State lifecycle risks:** Two patients booking same slot simultaneously — use `@Version` optimistic locking on appointments or database-level unique constraint on (doctor_id, appointment_date, start_time).
- **API surface parity:** All existing endpoints remain functional but now require authentication. Frontend API client wrapper automatically adds auth headers.
- **Unchanged invariants:** Existing patient CRUD, doctor CRUD, and appointment management flows remain unchanged — only enhanced with auth and new features.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Twilio API keys in config | Store in environment variables, not committed to repo |
| Patient self-booking race condition | Optimistic locking on appointment table |
| Migration of existing patient history | Keep legacy `medical_history` field, new data uses `patient_visits` table |
| JWT token expiry UX | Auto-refresh token on 401, or use refresh tokens |
| WhatsApp number verification | Requires Twilio WhatsApp-enabled number and template approval |

---

## Sources & References

- **Twilio SMS API:** https://www.twilio.com/docs/sms
- **Twilio WhatsApp API:** https://www.twilio.com/docs/whatsapp
- **Spring Security JWT:** https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html
- **Existing auth module:** `Clinic/src/main/java/com/Clinc_Flow/Clinic/user/`
- **Existing appointment module:** `Clinic/src/main/java/com/Clinc_Flow/Clinic/appointment/`
- **Existing reminder module:** `Clinic/src/main/java/com/Clinc_Flow/Clinic/reminder/`
