package com.Clinc_Flow.Clinic.doctor.availability.dto;

import com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailability;
import lombok.*;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilityResponse {

    private Long id;
    private Long doctorId;
    private String doctorName;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer slotDuration;
    private Boolean isAvailable;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static AvailabilityResponse fromEntity(DoctorAvailability availability) {
        return AvailabilityResponse.builder()
                .id(availability.getId())
                .doctorId(availability.getDoctor().getId())
                .doctorName(availability.getDoctor().getName())
                .dayOfWeek(availability.getDayOfWeek())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .slotDuration(availability.getSlotDuration())
                .isAvailable(availability.getIsAvailable())
                .createdAt(availability.getCreatedAt())
                .updatedAt(availability.getUpdatedAt())
                .build();
    }
}
