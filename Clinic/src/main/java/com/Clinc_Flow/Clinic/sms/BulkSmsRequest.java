package com.Clinc_Flow.Clinic.sms;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BulkSmsRequest {
    private List<String> phoneNumbers;
    private String message;
}
