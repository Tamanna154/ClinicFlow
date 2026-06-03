package com.Clinc_Flow.Clinic.compensation;

import com.Clinc_Flow.Clinic.compensation.dto.*;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.staff.DoctorStaff;
import com.Clinc_Flow.Clinic.staff.DoctorStaffRepository;
import com.Clinc_Flow.Clinic.staff.StaffDetails;
import com.Clinc_Flow.Clinic.staff.StaffDetailsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StaffCompensationService {

    private final StaffCompensationRepository compensationRepository;
    private final DoctorStaffRepository doctorStaffRepository;
    private final StaffDetailsRepository staffDetailsRepository;

    @Transactional(readOnly = true)
    public StaffCompensationResponse getCompensation(Long doctorStaffId) {
        StaffCompensation comp = compensationRepository.findByDoctorStaffId(doctorStaffId)
                .orElseThrow(() -> new ResourceNotFoundException("StaffCompensation", doctorStaffId));
        StaffCompensationResponse resp = StaffCompensationResponse.fromEntity(comp);
        enrichWithStaffName(resp, doctorStaffId);
        return resp;
    }

    @Transactional
    public StaffCompensationResponse createOrUpdate(Long doctorStaffId, StaffCompensationRequest request) {
        if (!doctorStaffRepository.existsById(doctorStaffId)) {
            throw new ResourceNotFoundException("DoctorStaff", doctorStaffId);
        }
        StaffCompensation comp = compensationRepository.findByDoctorStaffId(doctorStaffId)
                .orElse(StaffCompensation.builder().doctorStaffId(doctorStaffId).build());

        comp.setFixedSalary(request.getFixedSalary());
        comp.setIncentivePercent(request.getIncentivePercent());
        comp.setPerformanceBonus(request.getPerformanceBonus());
        if (comp.getIsActive() == null) comp.setIsActive(true);

        StaffCompensationResponse resp = StaffCompensationResponse.fromEntity(compensationRepository.save(comp));
        enrichWithStaffName(resp, doctorStaffId);
        return resp;
    }

    private void enrichWithStaffName(StaffCompensationResponse resp, Long doctorStaffId) {
        staffDetailsRepository.findByDoctorStaffId(doctorStaffId)
                .ifPresent(d -> resp.setStaffName(d.getFullName()));
    }
}
