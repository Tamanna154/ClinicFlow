---
title: "feat: Enable login, multi-doctor clinic support, and verify existing features"
type: feat
status: active
date: 2026-06-01
---

# Enable Login, Multi-Doctor Clinic Support, and Verify Existing Features

## Summary

Re-enable the login page by removing dev bypasses, add a Clinic entity so multiple doctors can belong to one clinic, and verify that appointment conflict detection, PDF billing, and letterpad image upload already work. The bulk of new work is the Clinic entity and multi-doctor support.

---

## Problem Frame

The app currently has dev bypasses that auto-login as doctor, no concept of a "clinic" (doctors are standalone), and the user wants: login working, multiple doctors per clinic, appointment conflicts detected, bills as PDF, and letterpad image uploads. Research shows that appointment conflicts, PDF billing, and letterpad uploads are already fully implemented. The two gaps are: (1) login is bypassed, and (2) no clinic entity exists.

---

## Requirements

- R1. Login page must work — remove dev bypasses in AuthContext.js and JwtAuthenticationFilter.java
- R2. Multiple doctors must be assignable to a single clinic — requires Clinic entity, FK on Doctor, UI updates
- R3. Appointment conflict detection at same time — ALREADY IMPLEMENTED (backend AppointmentService.create checks overlaps)
- R4. Bills should be printed or shared via PDF — ALREADY IMPLEMENTED (mobile pdfHelper.js with expo-print)
- R5. Doctors can upload letterpad images — ALREADY IMPLEMENTED (LetterheadController + LetterheadSetupScreen)

---

## Scope Boundaries

- Remove dev bypasses to enable login
- Create Clinic entity with CRUD API
- Add clinicId FK to Doctor entity
- Update Doctor UI screens to support clinic assignment
- Update DoctorFormScreen to allow selecting/creating a clinic
- Do NOT redesign the entire auth system (JWT is already solid)
- Do NOT rebuild PDF generation (already works)
- Do NOT rebuild appointment conflict detection (already works)
- Do NOT rebuild letterpad upload (already works)

### Deferred to Follow-Up Work

- Clinic-level settings (shared letterhead, shared inventory) — future iteration
- Clinic-level staff assignment — future iteration
- Multi-clinic patient assignment — future iteration

---

## Context & Research

### Relevant Code and Patterns

- `mobile/src/context/AuthContext.js` — dev bypass on lines 6-18, 21-26
- `Clinic/src/main/java/com/Clinc_Flow/Clinic/config/JwtAuthenticationFilter.java` — dev bypass on lines 44-53
- `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/Doctor.java` — entity needs clinicId FK
- `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/DoctorController.java` — CRUD endpoints
- `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/DoctorService.java` — service layer
- `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/dto/DoctorRequest.java` — request DTO needs clinicId
- `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/dto/DoctorResponse.java` — response DTO needs clinicName
- `mobile/src/screens/DoctorFormScreen.js` — needs clinic selector
- `mobile/src/screens/DoctorListScreen.js` — may need clinic filter
- `mobile/src/api/doctorApi.js` — may need clinic endpoints
- Flyway migrations in `Clinic/src/main/resources/db/migration/` — V28 will be the clinic migration
- Existing pattern: entities use `@Builder`, `@Getter/@Setter`, `@PrePersist` for timestamps

### Institutional Learnings

- All entities follow the same pattern: Entity -> Repository -> Service -> Controller -> DTOs
- Flyway migrations are numbered V1-V27, next is V28
- Frontend uses Expo with React Navigation, API calls via dedicated api modules

---

## Key Technical Decisions

- **Clinic as a simple entity**: Create a `clinics` table with id, name, address, phone, email, logoPath. Keep it minimal — doctors reference it via FK.
- **Optional FK on Doctor**: `clinic_id` is nullable on `doctors` table so existing doctors without a clinic still work.
- **Reuse existing patterns**: Follow the same Entity/Repository/Service/Controller/DTO pattern used by Doctor, Patient, etc.
- **No auth changes needed**: JWT auth already works correctly; just remove the bypasses.

---

## Open Questions

### Resolved During Planning

- Login is fully implemented on both sides — just need to remove dev bypasses
- Appointment conflicts are already detected in AppointmentService.create (lines 108-121)
- PDF billing works via mobile pdfHelper.js with expo-print
- Letterpad upload works via LetterheadController + LetterheadSetupScreen

### Deferred to Implementation

- Exact UI layout for clinic selection in DoctorFormScreen — will follow existing picker patterns

---

## Implementation Units

- U1. **Remove Dev Bypasses to Enable Login**

**Goal:** Remove the auto-login bypasses so the login screen appears and JWT auth works end-to-end.

**Requirements:** R1

**Dependencies:** None

**Files:**
- Modify: `mobile/src/context/AuthContext.js`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/config/JwtAuthenticationFilter.java`
- Modify: `mobile/App.js` (re-enable logout button)

**Approach:**
- In AuthContext.js: remove DEV_DOCTOR constant, set initial user to null, restore logout to call setUser(null)/setToken(null)/clearToken()
- In JwtAuthenticationFilter.java: remove the else block (lines 44-53) that auto-authenticates as DOCTOR — if no valid token, just pass through unauthenticated
- In App.js: restore the LogoutButton component (currently returns null)

**Test scenarios:**
- Happy path: Launching app with no token shows LoginScreen
- Happy path: Entering valid credentials logs in and navigates to role-appropriate tabs
- Happy path: Logout returns to LoginScreen
- Error path: Invalid credentials shows error alert
- Edge case: App restart with expired token shows LoginScreen

**Verification:**
- App starts on LoginScreen
- Login with valid doctor credentials navigates to MainTabs
- Login with valid receptionist credentials navigates to ReceptionistTabs
- Logout returns to LoginScreen

---

- U2. **Create Clinic Entity and Database Migration**

**Goal:** Create the clinics table and Clinic entity so doctors can be assigned to a clinic.

**Requirements:** R2

**Dependencies:** None

**Files:**
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/clinic/Clinic.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/clinic/ClinicRepository.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/clinic/ClinicService.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/clinic/ClinicController.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/clinic/dto/ClinicRequest.java`
- Create: `Clinic/src/main/java/com/Clinc_Flow/Clinic/clinic/dto/ClinicResponse.java`
- Create: `Clinic/src/main/resources/db/migration/V28__create_clinics_table.sql`
- Create: `Clinic/src/main/resources/db/migration/V29__add_clinic_id_to_doctors.sql`

**Approach:**
- Create `clinics` table with: id (BIGSERIAL PK), name (VARCHAR 150 NOT NULL), address (TEXT), phone (VARCHAR 20), email (VARCHAR 100), logo_path (VARCHAR 500), created_at, updated_at
- Create V29 migration to add `clinic_id` BIGINT FK to `doctors` table (nullable)
- Follow existing entity patterns: @Builder, @Getter/@Setter, @PrePersist timestamps
- CRUD endpoints: GET /api/clinics, GET /api/clinics/{id}, POST /api/clinics, PUT /api/clinics/{id}, DELETE /api/clinics/{id}
- Service follows existing pattern with ResourceNotFoundException

**Test scenarios:**
- Happy path: POST /api/clinics creates a clinic and returns ClinicResponse
- Happy path: GET /api/clinics returns list of all clinics
- Happy path: GET /api/clinics/{id} returns clinic with doctors
- Happy path: PUT /api/clinics/{id} updates clinic fields
- Happy path: DELETE /api/clinics/{id} removes clinic
- Error path: POST /api/clinics with missing name returns 400
- Edge case: Clinic with no doctors returns empty doctor list

**Verification:**
- Migration runs successfully (V28 creates clinics, V29 adds FK to doctors)
- CRUD API works for all endpoints
- Existing doctor endpoints still work (clinic_id is nullable)

---

- U3. **Update Doctor Entity to Support Clinic Assignment**

**Goal:** Add clinicId FK to Doctor entity and update DTOs to include clinic info.

**Requirements:** R2

**Dependencies:** U2

**Files:**
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/Doctor.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/dto/DoctorRequest.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/dto/DoctorResponse.java`
- Modify: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/DoctorService.java`

**Approach:**
- Add `clinicId` (Long, nullable) field to Doctor entity with @ManyToOne @JoinColumn
- Add `clinicId` to DoctorRequest DTO
- Add `clinicId` and `clinicName` to DoctorResponse DTO
- Update DoctorService.create and update to handle clinicId
- Add findByClinicId method to DoctorRepository

**Test scenarios:**
- Happy path: Creating a doctor with clinicId assigns them to that clinic
- Happy path: DoctorResponse includes clinicName when clinicId is set
- Happy path: Updating a doctor's clinicId reassigns them
- Edge case: Creating a doctor without clinicId works (nullable FK)
- Edge case: Deleting a clinic with assigned doctors sets their clinicId to null or blocks deletion

**Verification:**
- Doctor CRUD works with optional clinicId
- DoctorResponse includes clinic name when available
- Existing doctors without clinic still work

---

- U4. **Update Mobile UI for Clinic Support**

**Goal:** Update DoctorFormScreen to allow selecting a clinic, and DoctorListScreen to show clinic info.

**Requirements:** R2

**Dependencies:** U3

**Files:**
- Create: `mobile/src/api/clinicApi.js`
- Modify: `mobile/src/screens/DoctorFormScreen.js`
- Modify: `mobile/src/screens/DoctorListScreen.js`
- Modify: `mobile/src/screens/DoctorDetailScreen.js`

**Approach:**
- Create clinicApi.js with getAll, getById, create, update, delete functions
- Update DoctorFormScreen to add a clinic picker/dropdown (fetch clinics, allow selecting one, or creating new)
- Update DoctorListScreen to show clinic name under each doctor
- Update DoctorDetailScreen to show clinic info

**Test scenarios:**
- Happy path: DoctorFormScreen shows list of clinics to select from
- Happy path: Creating a doctor with a clinic saves correctly
- Happy path: DoctorListScreen shows clinic name under doctor name
- Happy path: DoctorDetailScreen shows assigned clinic
- Edge case: No clinics exist shows "No clinics" message with option to create one
- Edge case: Doctor with no clinic shows no clinic info (not an error)

**Verification:**
- Can create/edit a doctor and assign them to a clinic
- Doctor list shows clinic names
- Doctor detail shows clinic info

---

- U5. **Verify Existing Features Work End-to-End**

**Goal:** Confirm that appointment conflicts, PDF billing, and letterpad upload already work correctly.

**Requirements:** R3, R4, R5

**Dependencies:** U1

**Files:**
- Read: `Clinic/src/main/java/com/Clinc_Flow/Clinic/appointment/AppointmentService.java` (conflict detection)
- Read: `mobile/src/utils/pdfHelper.js` (PDF generation)
- Read: `Clinic/src/main/java/com/Clinc_Flow/Clinic/doctor/letterhead/LetterheadController.java` (upload)
- Read: `mobile/src/screens/LetterheadSetupScreen.js` (upload UI)

**Approach:**
- Review appointment creation flow to confirm conflict detection is active
- Review PDF generation to confirm bill and prescription PDFs work
- Review letterhead upload to confirm image upload works
- No code changes needed — these are verification only

**Test scenarios:**
- Appointment conflict: Booking two overlapping appointments for same doctor on same date returns error with alternatives
- PDF bill: BillDetailScreen Share/Download buttons generate PDF
- Letterpad upload: LetterheadSetupScreen allows selecting and uploading images

**Verification:**
- All three features work without code changes
- Any issues found are documented as follow-up work

---

## System-Wide Impact

- **Interaction graph:** Removing dev bypasses affects all API calls — they will now require valid JWT tokens. The login flow becomes the entry point.
- **Error propagation:** Unauthenticated requests to protected endpoints will return 401 instead of being auto-accepted.
- **State lifecycle risks:** Users currently auto-logged in will need to log in again after the change.
- **API surface parity:** New /api/clinics endpoints follow existing patterns.
- **Unchanged invariants:** All existing doctor, appointment, billing, and letterhead functionality remains unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Removing dev bypass breaks existing workflows | Test login with all three roles (DOCTOR, RECEPTIONIST, PATIENT) |
| Clinic migration may fail if doctors table has constraints | V29 adds nullable FK, no data migration needed |
| Mobile clinic picker may need new dependencies | Use existing picker patterns (horizontal scroll cards) |

---

## Sources & References

- Existing codebase patterns in `Clinic/src/main/java/com/Clinc_Flow/Clinic/`
- Flyway migration convention: V{number}__{description}.sql
- Mobile API pattern: `mobile/src/api/*.js`
- Mobile screen pattern: `mobile/src/screens/*.js`
