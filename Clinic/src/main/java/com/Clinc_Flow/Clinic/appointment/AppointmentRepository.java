package com.Clinc_Flow.Clinic.appointment;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @EntityGraph(attributePaths = {"doctor", "patient"})
    List<Appointment> findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(Long doctorId);

    @EntityGraph(attributePaths = {"doctor", "patient"})
    List<Appointment> findByPatientIdOrderByAppointmentDateDescStartTimeDesc(Long patientId);

    @EntityGraph(attributePaths = {"doctor", "patient"})
    List<Appointment> findByAppointmentDateOrderByStartTime(LocalDate date);

    @EntityGraph(attributePaths = {"doctor", "patient"})
    List<Appointment> findByDoctorIdAndAppointmentDateOrderByStartTime(Long doctorId, LocalDate date);

    List<Appointment> findByStatus(String status);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStartTimeLessThanEqualAndEndTimeGreaterThanEqual(
            Long doctorId, LocalDate date, LocalTime endTime, LocalTime startTime);

    long countByDoctorIdAndAppointmentDateAndStatusNot(
            Long doctorId, LocalDate date, String status);

    long countByAppointmentDate(LocalDate date);

    long countByAppointmentDateAndStatus(LocalDate date, String status);

    long countByAppointmentDateAndStatusNotIn(LocalDate date, Collection<String> statuses);

    long countByAppointmentDateAfter(LocalDate date);
}
