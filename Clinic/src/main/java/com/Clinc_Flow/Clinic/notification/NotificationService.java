package com.Clinc_Flow.Clinic.notification;

public interface NotificationService {
    void sendSms(String to, String message);
    void sendWhatsApp(String to, String message);
}
