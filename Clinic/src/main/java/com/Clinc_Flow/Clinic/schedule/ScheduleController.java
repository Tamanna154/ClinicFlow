package com.Clinc_Flow.Clinic.schedule;

import com.Clinc_Flow.Clinic.appointment.Appointment;
import com.Clinc_Flow.Clinic.appointment.AppointmentRepository;
import com.Clinc_Flow.Clinic.doctor.Doctor;
import com.Clinc_Flow.Clinic.doctor.DoctorRepository;
import com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailability;
import com.Clinc_Flow.Clinic.doctor.availability.DoctorAvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/schedule")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class ScheduleController {

    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;

    @GetMapping
    public ResponseEntity<?> getSchedule(
            @RequestParam Long doctorId,
            @RequestParam String date,
            @RequestParam(defaultValue = "daily") String view) {

        LocalDate startDate = LocalDate.parse(date);
        LocalDate endDate;
        switch (view.toLowerCase()) {
            case "weekly":  endDate = startDate.plusDays(6); break;
            case "monthly": endDate = startDate.withDayOfMonth(startDate.lengthOfMonth()); break;
            default:        endDate = startDate;
        }

        List<Map<String, Object>> days = new ArrayList<>();
        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            Map<String, Object> day = new HashMap<>();
            day.put("date", d.toString());
            day.put("dayName", d.getDayOfWeek().name());

            String dayOfWeek = d.getDayOfWeek().name();
            List<DoctorAvailability> availSlots = availabilityRepository
                    .findByDoctorIdAndDayOfWeek(doctorId, dayOfWeek)
                    .map(List::of).orElseGet(List::of);

            List<Appointment> bookings = appointmentRepository
                    .findByDoctorIdAndAppointmentDateOrderByStartTime(doctorId, d);

            List<Map<String, Object>> timeSlots = new ArrayList<>();
            for (DoctorAvailability avail : availSlots) {
                if (!avail.getIsAvailable()) continue;
                LocalTime slotStart = avail.getStartTime();
                int duration = avail.getSlotDuration() != null ? avail.getSlotDuration() : 30;
                while (slotStart.isBefore(avail.getEndTime())) {
                    LocalTime slotEnd = slotStart.plusMinutes(duration);
                    if (slotEnd.isAfter(avail.getEndTime())) break;

                    final LocalTime ss = slotStart;
                    final LocalTime se = slotEnd;

                    boolean booked = bookings.stream().anyMatch(b ->
                            !b.getStartTime().isAfter(ss) && !b.getEndTime().isBefore(se) ||
                            (b.getStartTime().isBefore(se) && b.getEndTime().isAfter(ss)));

                    Map<String, Object> slot = new HashMap<>();
                    slot.put("startTime", ss.toString());
                    slot.put("endTime", se.toString());
                    slot.put("booked", booked);
                    slot.put("slotIndex", timeSlots.size() + 1);
                    timeSlots.add(slot);
                    slotStart = slotEnd;
                }
            }

            day.put("slots", timeSlots);
            day.put("totalSlots", timeSlots.size());
            day.put("bookedSlots", timeSlots.stream().filter(s -> (boolean) s.get("booked")).count());
            days.add(day);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("doctorId", doctorId);
        result.put("view", view);
        result.put("startDate", startDate.toString());
        result.put("endDate", endDate.toString());
        result.put("days", days);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/suggest")
    public ResponseEntity<?> suggestSlot(
            @RequestParam Long doctorId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        LocalDate ld = LocalDate.parse(date);
        LocalTime st = LocalTime.parse(startTime);
        LocalTime et = LocalTime.parse(endTime);

        String dayOfWeek = ld.getDayOfWeek().name();
        List<DoctorAvailability> availSlots = availabilityRepository
                .findByDoctorIdAndDayOfWeek(doctorId, dayOfWeek)
                .map(List::of).orElseGet(List::of);

        List<Appointment> bookings = appointmentRepository
                .findByDoctorIdAndAppointmentDateOrderByStartTime(doctorId, ld);

        List<Map<String, Object>> suggestions = new ArrayList<>();
        for (int offset = -120; offset <= 120; offset += 30) {
            LocalTime suggestedStart = st.plusMinutes(offset);
            LocalTime suggestedEnd = et.plusMinutes(offset);
            if (suggestedStart.isBefore(LocalTime.of(0, 0)) || suggestedEnd.isAfter(LocalTime.of(23, 59)))
                continue;

            final LocalTime ss = suggestedStart;
            final LocalTime se = suggestedEnd;

            boolean inAvailability = availSlots.stream().anyMatch(a ->
                    a.getIsAvailable() && !ss.isBefore(a.getStartTime()) && !se.isAfter(a.getEndTime()));
            if (!inAvailability) continue;

            boolean conflicts = bookings.stream().anyMatch(b ->
                    !b.getStartTime().isAfter(ss) && !b.getEndTime().isBefore(se) ||
                    (b.getStartTime().isBefore(se) && b.getEndTime().isAfter(ss)));

            if (!conflicts) {
                Map<String, Object> slot = new HashMap<>();
                slot.put("startTime", ss.toString());
                slot.put("endTime", se.toString());
                slot.put("offset", offset);
                suggestions.add(slot);
            }
        }

        if (suggestions.isEmpty()) {
            for (int dayOffset = -1; dayOffset <= 1; dayOffset += 2) {
                LocalDate adjDate = ld.plusDays(dayOffset);
                String adjDayOfWeek = adjDate.getDayOfWeek().name();
                List<DoctorAvailability> adjAvail = availabilityRepository
                        .findByDoctorIdAndDayOfWeek(doctorId, adjDayOfWeek)
                        .map(List::of).orElseGet(List::of);
                if (adjAvail.isEmpty()) continue;

                List<Appointment> adjBookings = appointmentRepository
                        .findByDoctorIdAndAppointmentDateOrderByStartTime(doctorId, adjDate);

                for (DoctorAvailability a : adjAvail) {
                    if (!a.getIsAvailable()) continue;
                    LocalTime slotStart = a.getStartTime();
                    int duration = a.getSlotDuration() != null ? a.getSlotDuration() : 30;
                    while (slotStart.plusMinutes(duration).isBefore(a.getEndTime())
                            || slotStart.plusMinutes(duration).equals(a.getEndTime())) {
                        LocalTime slotEnd = slotStart.plusMinutes(duration);
                        final LocalTime ss = slotStart;
                        final LocalTime se = slotEnd;
                        boolean conflicts = adjBookings.stream().anyMatch(b ->
                                !b.getStartTime().isAfter(ss) && !b.getEndTime().isBefore(se) ||
                                (b.getStartTime().isBefore(se) && b.getEndTime().isAfter(ss)));
                        if (!conflicts) {
                            Map<String, Object> slot = new HashMap<>();
                            slot.put("startTime", ss.toString());
                            slot.put("endTime", se.toString());
                            slot.put("date", adjDate.toString());
                            slot.put("dayOffset", dayOffset);
                            suggestions.add(slot);
                            if (suggestions.size() >= 3) break;
                        }
                        slotStart = slotEnd;
                    }
                    if (suggestions.size() >= 3) break;
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "doctorId", doctorId, "date", date,
                "requestedStart", startTime, "requestedEnd", endTime,
                "suggestions", suggestions
        ));
    }
}
