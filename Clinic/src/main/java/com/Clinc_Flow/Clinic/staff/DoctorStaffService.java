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

    @Transactional(readOnly = true)
    public List<StaffResponse> getMyStaff(Long doctorUserId) {
        return doctorStaffRepository.findByDoctorUserId(doctorUserId).stream()
                .map(ds -> {
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
                    });
                    return response;
                })
                .toList();
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
        String username = request.getPhone() != null ? request.getPhone() :
                "staff" + System.currentTimeMillis();

        if (userRepository.findByUsername(username).isPresent()) {
            username = "staff" + System.currentTimeMillis();
        }

        User newUser = User.builder()
                .name(request.getFullName())
                .username(username)
                .password(passwordEncoder.encode("staff123"))
                .role(User.Role.RECEPTIONIST)
                .build();
        newUser = userRepository.save(newUser);

        DoctorStaff ds = DoctorStaff.builder()
                .doctorUserId(doctorUserId)
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
                .isActive(true)
                .build();
        staffDetailsRepository.save(details);

        StaffResponse response = StaffResponse.builder()
                .id(ds.getId())
                .staffUserId(newUser.getId())
                .staffName(newUser.getName())
                .staffUsername(newUser.getUsername())
                .permissions(List.of())
                .createdAt(ds.getCreatedAt())
                .phone(details.getPhone())
                .age(details.getAge())
                .email(details.getEmail())
                .address(details.getAddress())
                .roleTitle(details.getRoleTitle())
                .aadharNumber(details.getAadharNumber())
                .panNumber(details.getPanNumber())
                .bankAccountNo(details.getBankAccountNo())
                .bankName(details.getBankName())
                .ifscCode(details.getIfscCode())
                .emergencyContact(details.getEmergencyContact())
                .notes(details.getNotes())
                .isActive(details.getIsActive())
                .build();
        return response;
    }

    @Transactional
    public void removeStaff(Long doctorUserId, Long staffId) {
        DoctorStaff ds = doctorStaffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff record not found"));

        if (!ds.getDoctorUserId().equals(doctorUserId)) {
            throw new IllegalArgumentException("You can only remove your own staff");
        }

        staffDetailsRepository.deleteByDoctorStaffId(ds.getId());
        staffPermissionRepository.deleteByDoctorStaffId(ds.getId());
        doctorStaffRepository.delete(ds);
    }

    @Transactional(readOnly = true)
    public List<String> getStaffPermissions(Long doctorUserId, Long staffId) {
        DoctorStaff ds = doctorStaffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff record not found"));

        if (!ds.getDoctorUserId().equals(doctorUserId)) {
            throw new IllegalArgumentException("You can only view permissions of your own staff");
        }

        return staffPermissionRepository.findByDoctorStaffId(ds.getId()).stream()
                .map(sp -> sp.getPermission().name())
                .toList();
    }

    @Transactional
    public List<String> updateStaffPermissions(Long doctorUserId, Long staffId, List<String> permissions) {
        DoctorStaff ds = doctorStaffRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff record not found"));

        if (!ds.getDoctorUserId().equals(doctorUserId)) {
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
