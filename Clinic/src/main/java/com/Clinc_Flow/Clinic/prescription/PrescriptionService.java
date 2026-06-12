package com.Clinc_Flow.Clinic.prescription;

import com.Clinc_Flow.Clinic.billing.Bill;
import com.Clinc_Flow.Clinic.billing.BillItem;
import com.Clinc_Flow.Clinic.billing.BillRepository;
import com.Clinc_Flow.Clinic.consultation.Consultation;
import com.Clinc_Flow.Clinic.consultation.ConsultationRepository;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.income.IncomeRecord;
import com.Clinc_Flow.Clinic.income.IncomeRecordRepository;
import com.Clinc_Flow.Clinic.inventory.InventoryItem;
import com.Clinc_Flow.Clinic.inventory.InventoryRepository;
import com.Clinc_Flow.Clinic.inventory.StockTransaction;
import com.Clinc_Flow.Clinic.inventory.StockTransactionRepository;
import com.Clinc_Flow.Clinic.patient.Patient;
import com.Clinc_Flow.Clinic.patient.PatientRepository;
import com.Clinc_Flow.Clinic.prescription.dto.PrescriptionRequest;
import com.Clinc_Flow.Clinic.prescription.dto.PrescriptionRequest.MedicineEntry;
import com.Clinc_Flow.Clinic.prescription.dto.PrescriptionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final ConsultationRepository consultationRepository;
    private final InventoryRepository inventoryRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final BillRepository billRepository;
    private final IncomeRecordRepository incomeRecordRepository;
    private final PatientRepository patientRepository;

    private long scriptCounter = 0;

    @Transactional
    public PrescriptionResponse create(Long consultationId, PrescriptionRequest request, Long userId) {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation", consultationId));

        String scriptNumber = generateScriptNumber();

        Prescription prescription = Prescription.builder()
                .consultation(consultation)
                .patientId(request.getPatientId() != null ? request.getPatientId() : consultation.getPatientId())
                .doctorId(request.getDoctorId() != null ? request.getDoctorId() : consultation.getDoctorId())
                .symptoms(request.getSymptoms())
                .diagnosis(request.getDiagnosis())
                .doctorNotes(request.getDoctorNotes())
                .bloodPressure(request.getBloodPressure())
                .pulseRate(request.getPulseRate())
                .weight(request.getWeight())
                .height(request.getHeight())
                .temperature(request.getTemperature())
                .oxygenLevel(request.getOxygenLevel())
                .followUpDate(request.getFollowUpDate())
                .followUpNotes(request.getFollowUpNotes())
                .prescriptionNumber(scriptNumber)
                .status("ACTIVE")
                .build();

        List<PrescriptionMedicine> medicineList = new ArrayList<>();
        if (request.getMedicines() != null) {
            for (MedicineEntry entry : request.getMedicines()) {
                medicineList.add(PrescriptionMedicine.builder()
                        .medicineName(entry.getMedicineName())
                        .dosage(entry.getDosage())
                        .frequency(entry.getFrequency())
                        .duration(entry.getDuration())
                        .quantity(entry.getQuantity())
                        .instructions(entry.getInstructions())
                        .inventoryItemId(entry.getInventoryItemId())
                        .build());
            }
        }
        for (PrescriptionMedicine pm : medicineList) {
            prescription.addMedicine(pm);
        }
        prescription = prescriptionRepository.save(prescription);

        BigDecimal billSubtotal = BigDecimal.ZERO;
        List<BillItem> billItems = new ArrayList<>();
        Long patientId = prescription.getPatientId();

        List<MedicineEntry> meds = request.getMedicines();
        if (meds == null) meds = List.of();
        for (MedicineEntry entry : meds) {
            if (entry.getInventoryItemId() == null) continue;

            InventoryItem item = inventoryRepository.findById(entry.getInventoryItemId()).orElse(null);
            if (item == null || Boolean.TRUE.equals(item.getArchived())) continue;

            BigDecimal qty = entry.getQuantity() != null ? BigDecimal.valueOf(entry.getQuantity()) : BigDecimal.ONE;

            if (item.getQuantity().compareTo(qty) < 0) continue;

            BigDecimal prev = item.getQuantity();
            BigDecimal next = prev.subtract(qty);
            item.setQuantity(next);
            inventoryRepository.save(item);

            stockTransactionRepository.save(StockTransaction.builder()
                    .item(item)
                    .quantityChanged(qty)
                    .transactionType("MEDICINE_DISPENSED")
                    .previousQuantity(prev)
                    .newQuantity(next)
                    .performedById(userId)
                    .notes("Prescription: " + scriptNumber)
                    .referenceType("PRESCRIPTION")
                    .referenceId(prescription.getId())
                    .build());

            if ("EXTERNAL".equals(item.getStockType()) && item.getSellingPrice() != null) {
                BigDecimal lineTotal = item.getSellingPrice().multiply(qty).setScale(2, RoundingMode.HALF_UP);
                billSubtotal = billSubtotal.add(lineTotal);
                billItems.add(BillItem.builder()
                        .inventoryItemId(item.getId())
                        .itemName(item.getItemName())
                        .quantity(qty)
                        .sellingPrice(item.getSellingPrice())
                        .lineTotal(lineTotal)
                        .build());
            }
        }

        if (Boolean.TRUE.equals(request.getGenerateBill()) && !billItems.isEmpty()) {
            String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH";
            Patient patient = patientRepository.findById(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient", patientId));

            Bill bill = Bill.builder()
                    .billNumber("RX-" + scriptNumber)
                    .patientId(patientId)
                    .createdBy(userId)
                    .subtotal(billSubtotal)
                    .discount(BigDecimal.ZERO)
                    .tax(BigDecimal.ZERO)
                    .totalAmount(billSubtotal)
                    .paymentStatus("PAID")
                    .paymentMethod(paymentMethod)
                    .billDate(OffsetDateTime.now())
                    .build();

            for (BillItem bi : billItems) {
                bill.addBillItem(bi);
            }
            bill = billRepository.save(bill);

            incomeRecordRepository.save(IncomeRecord.builder()
                    .incomeType("MEDICINE_SALE")
                    .referenceId(bill.getId())
                    .amount(billSubtotal)
                    .paymentMethod(paymentMethod)
                    .receivedBy(userId)
                    .description("Prescription bill - " + scriptNumber)
                    .build());
        }

        return PrescriptionResponse.fromEntity(prescription);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAll() {
        return prescriptionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(PrescriptionResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getByConsultation(Long consultationId) {
        Prescription p = prescriptionRepository.findByConsultationId(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", consultationId));
        return PrescriptionResponse.fromEntity(p);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getById(Long id) {
        return PrescriptionResponse.fromEntity(prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", id)));
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(PrescriptionResponse::fromEntity).toList();
    }

    private synchronized String generateScriptNumber() {
        scriptCounter++;
        return "RX-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%04d", scriptCounter);
    }
}
