package com.Clinc_Flow.Clinic.activity;

import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.user.User;
import com.Clinc_Flow.Clinic.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffActivityService {

    private final StaffActivityRepository activityRepository;
    private final UserRepository userRepository;

    @Transactional
    public StaffActivity createActivity(Long userId, String activityType, String description,
                                        Long referenceId, String referenceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        StaffActivity activity = StaffActivity.builder()
                .userId(userId)
                .userName(user.getName())
                .activityType(activityType)
                .description(description)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();

        return activityRepository.save(activity);
    }

    @Transactional(readOnly = true)
    public List<StaffActivity> getLatestUpdates(int limit) {
        return activityRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public List<StaffActivity> getByUser(Long userId) {
        return activityRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<StaffActivity> getByDateRange(OffsetDateTime start, OffsetDateTime end) {
        return activityRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
    }

    @Transactional(readOnly = true)
    public List<StaffActivity> getPendingTasks() {
        return activityRepository.findByActivityTypeOrderByCreatedAtDesc("PATIENT_FOLLOWUP");
    }
}
