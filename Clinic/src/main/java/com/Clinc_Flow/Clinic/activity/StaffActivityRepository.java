package com.Clinc_Flow.Clinic.activity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface StaffActivityRepository extends JpaRepository<StaffActivity, Long> {
    List<StaffActivity> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<StaffActivity> findByActivityTypeOrderByCreatedAtDesc(String activityType);
    List<StaffActivity> findByCreatedAtBetweenOrderByCreatedAtDesc(OffsetDateTime start, OffsetDateTime end);
    List<StaffActivity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
