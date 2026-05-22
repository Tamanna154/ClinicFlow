package com.Clinc_Flow.Clinic.patient.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientRequest {

    private String name;

    @NotBlank(message = "Phone is required")
    @Size(max = 20)
    private String phone;

    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;

    private Integer age;

    @Size(max = 10)
    private String gender;

    private String address;

    @Size(max = 5)
    private String bloodGroup;

    private String medicalHistory;

    private String allergies;

    @Size(max = 150)
    private String emergencyContactName;

    @Size(max = 20)
    private String emergencyContactPhone;

    // Fields for backward-compatibility with the old mobile app structure
    private String firstName;
    private String lastName;
    private String dateOfBirth;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String zipCode;
    private String chronicConditions;
    private String notes;

    @NotBlank(message = "Name is required")
    @Size(max = 150)
    public String getName() {
        if ((this.name == null || this.name.trim().isEmpty()) && (this.firstName != null || this.lastName != null)) {
            StringBuilder sb = new StringBuilder();
            if (this.firstName != null && !this.firstName.trim().isEmpty()) {
                sb.append(this.firstName.trim());
            }
            if (this.lastName != null && !this.lastName.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(this.lastName.trim());
            }
            if (sb.length() > 0) {
                return sb.toString();
            }
        }
        return this.name;
    }

    @Min(value = 0, message = "Age must be positive")
    @Max(value = 150, message = "Age must be <= 150")
    public Integer getAge() {
        if (this.age == null && this.dateOfBirth != null && !this.dateOfBirth.trim().isEmpty()) {
            try {
                java.time.LocalDate birthDate = java.time.LocalDate.parse(this.dateOfBirth.trim());
                java.time.LocalDate currentDate = java.time.LocalDate.now();
                return java.time.Period.between(birthDate, currentDate).getYears();
            } catch (Exception e) {
                // Ignore parsing/formatting errors
            }
        }
        return this.age;
    }

    public String getAddress() {
        if (this.address == null || this.address.trim().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            if (addressLine1 != null && !addressLine1.trim().isEmpty()) sb.append(addressLine1.trim());
            if (addressLine2 != null && !addressLine2.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(addressLine2.trim());
            }
            if (city != null && !city.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(city.trim());
            }
            if (state != null && !state.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(state.trim());
            }
            if (zipCode != null && !zipCode.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(zipCode.trim());
            }
            if (sb.length() > 0) {
                return sb.toString();
            }
        }
        return this.address;
    }

    public String getMedicalHistory() {
        if (this.medicalHistory == null || this.medicalHistory.trim().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            if (chronicConditions != null && !chronicConditions.trim().isEmpty()) {
                sb.append(chronicConditions.trim());
            }
            if (notes != null && !notes.trim().isEmpty()) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(notes.trim());
            }
            if (sb.length() > 0) {
                return sb.toString();
            }
        }
        return this.medicalHistory;
    }

    @JsonSetter("firstName")
    public void setFirstName(String firstName) {
        this.firstName = firstName;
        updateName();
    }

    @JsonSetter("lastName")
    public void setLastName(String lastName) {
        this.lastName = lastName;
        updateName();
    }

    @JsonSetter("name")
    public void setName(String name) {
        this.name = name;
        updateName();
    }

    private void updateName() {
        if (this.name == null || this.name.trim().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            if (this.firstName != null && !this.firstName.trim().isEmpty()) {
                sb.append(this.firstName.trim());
            }
            if (this.lastName != null && !this.lastName.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(this.lastName.trim());
            }
            if (sb.length() > 0) {
                this.name = sb.toString();
            }
        }
    }

    @JsonSetter("dateOfBirth")
    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
        updateAge();
    }

    @JsonSetter("age")
    public void setAge(Integer age) {
        this.age = age;
        updateAge();
    }

    private void updateAge() {
        if (this.age == null && this.dateOfBirth != null && !this.dateOfBirth.trim().isEmpty()) {
            try {
                java.time.LocalDate birthDate = java.time.LocalDate.parse(this.dateOfBirth.trim());
                java.time.LocalDate currentDate = java.time.LocalDate.now();
                this.age = java.time.Period.between(birthDate, currentDate).getYears();
            } catch (Exception e) {
                // Ignore parsing/formatting errors
            }
        }
    }

    @JsonSetter("addressLine1")
    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
        updateAddress();
    }

    @JsonSetter("addressLine2")
    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
        updateAddress();
    }

    @JsonSetter("city")
    public void setCity(String city) {
        this.city = city;
        updateAddress();
    }

    @JsonSetter("state")
    public void setState(String state) {
        this.state = state;
        updateAddress();
    }

    @JsonSetter("zipCode")
    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
        updateAddress();
    }

    @JsonSetter("address")
    public void setAddress(String address) {
        this.address = address;
        updateAddress();
    }

    private void updateAddress() {
        if (this.address == null || this.address.trim().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            if (addressLine1 != null && !addressLine1.trim().isEmpty()) sb.append(addressLine1.trim());
            if (addressLine2 != null && !addressLine2.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(addressLine2.trim());
            }
            if (city != null && !city.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(city.trim());
            }
            if (state != null && !state.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(state.trim());
            }
            if (zipCode != null && !zipCode.trim().isEmpty()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(zipCode.trim());
            }
            if (sb.length() > 0) {
                this.address = sb.toString();
            }
        }
    }

    @JsonSetter("chronicConditions")
    public void setChronicConditions(String chronicConditions) {
        this.chronicConditions = chronicConditions;
        updateMedicalHistory();
    }

    @JsonSetter("notes")
    public void setNotes(String notes) {
        this.notes = notes;
        updateMedicalHistory();
    }

    @JsonSetter("medicalHistory")
    public void setMedicalHistory(String medicalHistory) {
        this.medicalHistory = medicalHistory;
        updateMedicalHistory();
    }

    private void updateMedicalHistory() {
        if (this.medicalHistory == null || this.medicalHistory.trim().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            if (chronicConditions != null && !chronicConditions.trim().isEmpty()) {
                sb.append(chronicConditions.trim());
            }
            if (notes != null && !notes.trim().isEmpty()) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(notes.trim());
            }
            if (sb.length() > 0) {
                this.medicalHistory = sb.toString();
            }
        }
    }
}
