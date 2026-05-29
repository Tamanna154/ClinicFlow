package com.Clinc_Flow.Clinic.patient.dto;

import com.Clinc_Flow.Clinic.patient.Patient;
import lombok.*;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private Integer age;
    private String gender;
    private String address;
    private String bloodGroup;
    private String medicalHistory;
    private String allergies;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private Boolean archived;
    private Long assignedDoctorId;
    private String createdByType;
    private Long createdById;
    private String createdByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Backward compatibility fields for old mobile app
    public String getFirstName() {
        if (name == null || name.trim().isEmpty()) return "";
        return name.split("\\s+")[0];
    }

    public String getLastName() {
        if (name == null || name.trim().isEmpty()) return "";
        String[] parts = name.split("\\s+", 2);
        return parts.length > 1 ? parts[1] : "";
    }

    public String getDateOfBirth() {
        int birthYear = java.time.LocalDate.now().getYear() - (age != null ? age : 30);
        return birthYear + "-01-01";
    }

    private String[] parseAddress() {
        if (address == null || address.trim().isEmpty()) {
            return new String[]{"", "", "", "", ""};
        }
        String[] parts = address.split(",\\s*");
        String[] res = new String[]{"", "", "", "", ""};
        if (parts.length >= 5) {
            res[0] = parts[0];
            res[1] = parts[1];
            res[2] = parts[2];
            res[3] = parts[3];
            res[4] = parts[4];
        } else if (parts.length == 4) {
            res[0] = parts[0];
            res[2] = parts[1];
            res[3] = parts[2];
            res[4] = parts[3];
        } else if (parts.length == 3) {
            res[0] = parts[0];
            res[2] = parts[1];
            res[3] = parts[2];
        } else {
            res[0] = address;
        }
        return res;
    }

    public String getAddressLine1() { return parseAddress()[0]; }
    public String getAddressLine2() { return parseAddress()[1]; }
    public String getCity() { return parseAddress()[2]; }
    public String getState() { return parseAddress()[3]; }
    public String getZipCode() { return parseAddress()[4]; }

    public String getChronicConditions() {
        if (medicalHistory == null) return "";
        String[] parts = medicalHistory.split("\n", 2);
        return parts[0];
    }

    public String getNotes() {
        if (medicalHistory == null) return "";
        String[] parts = medicalHistory.split("\n", 2);
        return parts.length > 1 ? parts[1] : "";
    }

    public static PatientResponse fromEntity(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .name(patient.getName())
                .phone(patient.getPhone())
                .email(patient.getEmail())
                .age(patient.getAge())
                .gender(patient.getGender())
                .address(patient.getAddress())
                .bloodGroup(patient.getBloodGroup())
                .medicalHistory(patient.getMedicalHistory())
                .allergies(patient.getAllergies())
                .emergencyContactName(patient.getEmergencyContactName())
                .emergencyContactPhone(patient.getEmergencyContactPhone())
                .archived(patient.getArchived())
                .assignedDoctorId(patient.getAssignedDoctorId())
                .createdByType(patient.getCreatedByType())
                .createdById(patient.getCreatedById())
                .createdByName(patient.getCreatedByName())
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();
    }
}

