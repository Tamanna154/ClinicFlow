package com.Clinc_Flow.Clinic.activity;

import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class StaffActivityController {

    private final StaffActivityService activityService;

    @PostMapping
    public ResponseEntity<StaffActivity> createActivity(@RequestBody Map<String, Object> body) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String activityType = (String) body.get("activityType");
        String description = (String) body.get("description");
        Long referenceId = body.get("referenceId") != null ? Long.valueOf(body.get("referenceId").toString()) : null;
        String referenceType = (String) body.get("referenceType");

        StaffActivity activity = activityService.createActivity(user.userId(), activityType, description, referenceId, referenceType);
        return ResponseEntity.status(HttpStatus.CREATED).body(activity);
    }

    @GetMapping
    public ResponseEntity<List<StaffActivity>> getActivities(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) OffsetDateTime startDate,
            @RequestParam(required = false) OffsetDateTime endDate,
            @RequestParam(defaultValue = "20") int limit) {
        if (userId != null) {
            return ResponseEntity.ok(activityService.getByUser(userId));
        }
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(activityService.getByDateRange(startDate, endDate));
        }
        return ResponseEntity.ok(activityService.getLatestUpdates(limit));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<StaffActivity>> getPendingTasks() {
        return ResponseEntity.ok(activityService.getPendingTasks());
    }
}
