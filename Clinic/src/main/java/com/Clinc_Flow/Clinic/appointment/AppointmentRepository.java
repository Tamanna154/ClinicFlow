package com.Clinc_Flow.Clinic.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(Long doctorId);

    List<Appointment> findByPatientIdOrderByAppointmentDateDescStartTimeDesc(Long patientId);

    List<Appointment> findByAppointmentDateOrderByStartTime(LocalDate date);

    List<Appointment> findByDoctorIdAndAppointmentDateOrderByStartTime(Long doctorId, LocalDate date);

    List<Appointment> findByStatus(String status);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
            Long doctorId, LocalDate date, LocalTime endTime, LocalTime startTime);

    long countByDoctorIdAndAppointmentDateAndStatusNot(
            Long doctorId, LocalDate date, String status);
}
