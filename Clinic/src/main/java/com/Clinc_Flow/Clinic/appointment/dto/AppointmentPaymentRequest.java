package com.Clinc_Flow.Clinic.appointment.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentPaymentRequest {

    @NotNull(message = "Fee amount is required")
    @DecimalMin(value = "0.01", message = "Fee must be positive")
    private BigDecimal feeAmount;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    @NotBlank(message = "Payment status is required")
    private String paymentStatus;
}
