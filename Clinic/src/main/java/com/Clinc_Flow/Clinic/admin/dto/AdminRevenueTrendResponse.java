package com.Clinc_Flow.Clinic.admin.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRevenueTrendResponse {
    private int month;
    private int year;
    private BigDecimal revenue;
    private BigDecimal expense;
}
