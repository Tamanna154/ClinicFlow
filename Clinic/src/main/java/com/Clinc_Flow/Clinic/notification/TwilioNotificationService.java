package com.Clinc_Flow.Clinic.notification;

import com.twilio.type.PhoneNumber;
import com.twilio.rest.api.v2010.account.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TwilioNotificationService implements NotificationService {

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;

    @Override
    public void sendSms(String to, String message) {
        try {
            Message.creator(
                new PhoneNumber(to),
                new PhoneNumber(twilioPhoneNumber),
                message
            ).create();
            log.info("SMS sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", to, e.getMessage());
            throw e;
        }
    }

    @Override
    public void sendWhatsApp(String to, String message) {
        try {
            Message.creator(
                new PhoneNumber("whatsapp:" + to),
                new PhoneNumber("whatsapp:" + twilioPhoneNumber),
                message
            ).create();
            log.info("WhatsApp sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send WhatsApp to {}: {}", to, e.getMessage());
            throw e;
        }
    }
}
