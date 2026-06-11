package com.Clinc_Flow.Clinic.staff;

import com.Clinc_Flow.Clinic.user.User;
import com.Clinc_Flow.Clinic.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorStaffService {

    private final DoctorStaffRepository doctorStaffRepository;
    private final StaffPermissionRepository staffPermissionRepository;
    private final UserRepository userRepository;
    private final StaffDetailsRepository staffDetailsRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.Clinc_Flow.Clinic.compensation.StaffCompensationRepository staffCompensationRepository;
    private final com.Clinc_Flow.Clinic.notification.NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<StaffResponse> getMyStaff(Long doctorUserId) {
        return doctorStaffRepository.findByDoctorUserId(doctorUserId).stream()
                .map(this::mapToStaffResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> getAllStaff() {
        return doctorStaffRepository.findAll().stream()
                .map(this::mapToStaffResponse)
                .toList();
    }

    private StaffResponse mapToStaffResponse(DoctorStaff ds) {
        User staffUser = userRepository.findById(ds.getStaffUserId()).orElse(null);
        List<String> perms = staffPermissionRepository.findByDoctorStaffId(ds.getId()).stream()
                .map(sp -> sp.getPermission().name())
                .toList();
        StaffResponse response = StaffResponse.builder()
                .id(ds.getId())
                .staffUserId(ds.getStaffUserId())
                .staffName(staffUser != null ? staffUser.getName() : "Unknown")
                .staffUsername(staffUser != null ? staffUser.getUsername() : "unknown")
                .permissions(perms)
                .createdAt(ds.getCreatedAt())
                .doctorUserId(ds.getDoctorUserId())
                .build();
        staffDetailsRepository.findByDoctorStaffId(ds.getId()).ifPresent(d -> {
            response.setPhone(d.getPhone());
            response.setAge(d.getAge());
            response.setEmail(d.getEmail());
            response.setAddress(d.getAddress());
            response.setRoleTitle(d.getRoleTitle());
            response.setAadharNumber(d.getAadharNumber());
            response.setPanNumber(d.getPanNumber());
            response.setBankAccountNo(d.getBankAccountNo());
            response.setBankName(d.getBankName());
            response.setIfscCode(d.getIfscCode());
            response.setEmergencyContact(d.getEmergencyContact());
            response.setIsActive(d.getIsActive());
            response.setNotes(d.getNotes());
            response.setDutyTime(d.getDutyTime());
        });
        staffCompensationRepository.findByDoctorStaffId(ds.getId()).ifPresent(c -> {
            response.setFixedSalary(c.getFixedSalary());
        });
        return response;
    }

    @Transactional
    public StaffResponse addStaff(Long doctorUserId, Long staffUserId) {
        User staffUser = userRepository.findById(staffUserId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        if (staffUser.getRole() != User.Role.RECEPTIONIST) {
            throw new IllegalArgumentException("Only RECEPTIONIST users can be added as staff");
        }

        if (doctorStaffRepository.existsByStaffUserId(staffUserId)) {
            throw new IllegalArgumentException("This staff member is already assigned to a doctor");
        }

        DoctorStaff ds = DoctorStaff.builder()
                .doctorUserId(doctorUserId)
                .staffUserId(staffUserId)
                .build();
        ds = doctorStaffRepository.save(ds);

        return StaffResponse.builder()
                .id(ds.getId())
                .staffUserId(ds.getStaffUserId())
                .staffName(staffUser.getName())
                .staffUsername(staffUser.getUsername())
                .permissions(List.of())
                .createdAt(ds.getCreatedAt())
                .build();
    }

    @Transactional
    public StaffResponse createStaffWithDetails(Long doctorUserId, CreateStaffRequest request) {
        String firstName = "staff";
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            String[] parts = request.getFullName().trim().split("\\s+");
            if (parts.length > 0) {
                firstName = parts[0];
            }
        }
        String cleanFirstName = firstName.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (cleanFirstName.isEmpty()) cleanFirstName = "staff";

        String tempUsername = "";
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            tempUsername = request.getEmail().trim();
            if (userRepository.existsByUsername(tempUsername)) {
                throw new IllegalArgumentException("A user with username " + tempUsername + " already exists");
            }
        } else {
            String baseUsername = "st" + cleanFirstName + "@gmail.com";
            String generatedUsername = baseUsername;
            int suffix = 1;
            while (userRepository.existsByUsername(generatedUsername)) {
                generatedUsername = "st" + cleanFirstName + suffix + "@gmail.com";
                suffix++;
            }
            tempUsername = generatedUsername;
        }

        String capitalizedFirstName = cleanFirstName.substring(0, 1).toUpperCase() + cleanFirstName.substring(1);
        String password = "St@" + capitalizedFirstName;

        User newUser = User.builder()
                .name(request.getFullName())
                .username(tempUsername)
                .password(passwordEncoder.encode(password))
                .role(User.Role.RECEPTIONIST)
                .email(request.getEmail())
                .phone(request.getPhone())
                .build();
        newUser = userRepository.save(newUser);

        Long assignedDocId = doctorUserId;
        if (assignedDocId == null || assignedDocId == 0) {
            assignedDocId = request.getDoctorUserId();
        }
        if (assignedDocId == null) {
            assignedDocId = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.Role.DOCTOR)
                    .map(User::getId)
                    .findFirst()
                    .orElse(1L);
        }

        DoctorStaff ds = DoctorStaff.builder()
                .doctorUserId(assignedDocId)
                .staffUserId(newUser.getId())
                .build();
        ds = doctorStaffRepository.save(ds);

        StaffDetails details = StaffDetails.builder()
                .doctorStaffId(ds.getId())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .age(request.getAge())
                .email(request.getEmail())
                .address(request.getAddress())
                .roleTitle(request.getRoleTitle() != null ? request.getRoleTitle() : "RECEPTIONIST")
                .aadharNumber(request.getAadharNumber())
                .panNumber(request.getPanNumber())
                .bankAccountNo(request.getBankAccountNo())
                .bankName(request.getBankName())
                .ifscCode(request.getIfscCode())
                .emergencyContact(request.getEmergencyContact())
                .notes(request.getNotes())
                .dutyTime(request.getDutyTime())
                .isActive(true)
                .build();
        staffDetailsRepository.save(details);

        if (request.getFixedSalary() != null) {
            com.Clinc_Flow.Clinic.compensation.StaffCompensation comp = com.Clinc_Flow.Clinic.compensation.StaffCompensation.builder()
                    .doctorStaffId(ds.getId())
                    .fixedSalary(request.getFixedSalary())
                    .isActive(true)
                    .build();
            staffCompensationRepository.save(comp);
        }

        // Send SMS to staff member
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            try {
                String smsMsg = "Welcome to ClinicFlow! Your staff login account has been created.\nUsername: " + tempUsername + "\nPassword: " + password;
                notificationService.sendSms(request.getPhone(), smsMsg);
            } catch (Exception e) {
                // Ignore to avoid blocking creation
            }
        }

        // Send SMS to Admin (7383733435)
        try {
            String adminMsg = "Admin Alert: Staff " + request.getFullName() + " created.\nUsername: " + tempUsername + "\nPassword: " + password;
            notificationService.sendSms("7383733435", adminMsg);
        } catch (Exception e) {
            // Ignore
        }

        StaffResponse response = mapToStaffResponse(ds);
        response.setTempPassword(password);
        return response;
    }

    @Transactional
    public StaffResponse updateStaffWithDetails(Long doctorUserId, Long staffId, CreateStaffRequest request, boolean isAdmin) {
        DoctorStaff ds = doctorStaffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff record not found"));

        if (!isAdmin && !ds.getDoctorUserId().equals(doctorUserId)) {
            throw new IllegalArgumentException("You can only update your own staff");
        }

        User staffUser = userRepository.findById(ds.getStaffUserId())
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));
        staffUser.setName(request.getFullName());
        if (request.getPhone() != null) staffUser.setPhone(request.getPhone());
        if (request.getEmail() != null) staffUser.setEmail(request.getEmail());
        userRepository.save(staffUser);

        StaffDetails details = staffDetailsRepository.findByDoctorStaffId(ds.getId())
                .orElseGet(() -> StaffDetails.builder().doctorStaffId(ds.getId()).build());

        details.setFullName(request.getFullName());
        details.setPhone(request.getPhone());
        details.setAge(request.getAge());
        details.setEmail(request.getEmail());
        details.setAddress(request.getAddress());
        details.setRoleTitle(request.getRoleTitle() != null ? request.getRoleTitle() : "RECEPTIONIST");
        details.setAadharNumber(request.getAadharNumber());
        details.setPanNumber(request.getPanNumber());
        details.setBankAccountNo(request.getBankAccountNo());
        details.setBankName(request.getBankName());
        details.setIfscCode(request.getIfscCode());
        details.setEmergencyContact(request.getEmergencyContact());
        details.setNotes(request.getNotes());
        details.setDutyTime(request.getDutyTime());
        staffDetailsRepository.save(details);

        if (request.getFixedSalary() != null) {
            com.Clinc_Flow.Clinic.compensation.StaffCompensation comp = staffCompensationRepository.findByDoctorStaffId(ds.getId())
                    .orElseGet(() -> com.Clinc_Flow.Clinic.compensation.StaffCompensation.builder().doctorStaffId(ds.getId()).build());
            comp.setFixedSalary(request.getFixedSalary());
            staffCompensationRepository.save(comp);
        }

        return mapToStaffResponse(ds);
    }

    @Transactional
    public void removeStaff(Long doctorUserId, Long staffId, boolean isAdmin) {
        DoctorStaff ds = doctorStaffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff record not found"));

        if (!isAdmin && !ds.getDoctorUserId().equals(doctorUserId)) {
            throw new IllegalArgumentException("You can only remove your own staff");
        }

        staffCompensationRepository.findByDoctorStaffId(ds.getId()).ifPresent(staffCompensationRepository::delete);
        staffDetailsRepository.deleteByDoctorStaffId(ds.getId());
        staffPermissionRepository.deleteByDoctorStaffId(ds.getId());
        doctorStaffRepository.delete(ds);
    }

    @Transactional(readOnly = true)
    public List<String> getStaffPermissions(Long doctorUserId, Long staffId, boolean isAdmin) {
        DoctorStaff ds = doctorStaffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff record not found"));

        if (!isAdmin && !ds.getDoctorUserId().equals(doctorUserId)) {
            throw new IllegalArgumentException("You can only view permissions of your own staff");
        }

        return staffPermissionRepository.findByDoctorStaffId(ds.getId()).stream()
                .map(sp -> sp.getPermission().name())
                .toList();
    }

    @Transactional
    public List<String> updateStaffPermissions(Long doctorUserId, Long staffId, List<String> permissions, boolean isAdmin) {
        DoctorStaff ds = doctorStaffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff record not found"));

        if (!isAdmin && !ds.getDoctorUserId().equals(doctorUserId)) {
            throw new IllegalArgumentException("You can only update permissions of your own staff");
        }

        staffPermissionRepository.deleteByDoctorStaffId(ds.getId());
        staffPermissionRepository.flush();

        for (String perm : permissions) {
            try {
                Permission p = Permission.valueOf(perm);
                StaffPermission sp = StaffPermission.builder()
                        .doctorStaffId(ds.getId())
                        .permission(p)
                        .build();
                staffPermissionRepository.save(sp);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid permission: " + perm);
            }
        }

        return permissions;
    }

    @Transactional(readOnly = true)
    public List<String> getPermissionsForUser(Long userId) {
        return doctorStaffRepository.findByStaffUserId(userId)
                .map(ds -> staffPermissionRepository.findByDoctorStaffId(ds.getId()).stream()
                        .map(sp -> sp.getPermission().name())
                        .toList())
                .orElse(List.of());
    }

    @Transactional(readOnly = true)
    public String getRoleTitleForUser(Long userId) {
        return doctorStaffRepository.findByStaffUserId(userId)
                .flatMap(ds -> staffDetailsRepository.findByDoctorStaffId(ds.getId()))
                .map(StaffDetails::getRoleTitle)
                .orElse("RECEPTIONIST");
    }

    public List<String> getAllPermissions() {
        return Arrays.stream(Permission.values())
                .map(Enum::name)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean currentUserHasPermission(Long userId, String permission) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() == User.Role.DOCTOR) return true;

        if (user.getRole() == User.Role.RECEPTIONIST) {
            List<String> perms = getPermissionsForUser(userId);
            return perms.contains(permission);
        }

        return false;
    }
}
