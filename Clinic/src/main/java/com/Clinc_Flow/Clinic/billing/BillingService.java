package com.Clinc_Flow.Clinic.billing;

import com.Clinc_Flow.Clinic.billing.dto.BillRequest;
import com.Clinc_Flow.Clinic.billing.dto.BillRequest.BillItemRequest;
import com.Clinc_Flow.Clinic.billing.dto.BillResponse;
import com.Clinc_Flow.Clinic.billing.dto.BillingSummaryResponse;
import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.income.IncomeRecord;
import com.Clinc_Flow.Clinic.income.IncomeRecordRepository;
import com.Clinc_Flow.Clinic.inventory.InventoryItem;
import com.Clinc_Flow.Clinic.inventory.InventoryRepository;
import com.Clinc_Flow.Clinic.inventory.StockTransaction;
import com.Clinc_Flow.Clinic.inventory.StockTransactionRepository;
import com.Clinc_Flow.Clinic.patient.Patient;
import com.Clinc_Flow.Clinic.patient.PatientRepository;
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
public class BillingService {

    private final BillRepository billRepository;
    private final InventoryRepository inventoryRepository;
    private final StockTransactionRepository transactionRepository;
    private final IncomeRecordRepository incomeRecordRepository;
    private final PatientRepository patientRepository;

    private long billCounter = 0;

    @Transactional
    public BillResponse createBill(BillRequest request, Long userId) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", request.getPatientId()));

        String billNumber = generateBillNumber();

        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        BigDecimal tax = request.getTax() != null ? request.getTax() : BigDecimal.ZERO;

        // Validate all items first
        for (BillItemRequest itemReq : request.getItems()) {
            InventoryItem item = inventoryRepository.findById(itemReq.getInventoryItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", itemReq.getInventoryItemId()));

            if (!"EXTERNAL".equals(item.getStockType())) {
                throw new IllegalArgumentException("Cannot bill internal stock item: " + item.getItemName());
            }
            if (item.getArchived()) {
                throw new IllegalArgumentException("Item is archived: " + item.getItemName());
            }
            if (item.getSellingPrice() == null) {
                throw new IllegalArgumentException("No selling price set for item: " + item.getItemName());
            }
            BigDecimal qty = itemReq.getQuantity();
            if (item.getQuantity().compareTo(qty) < 0) {
                throw new IllegalArgumentException("Insufficient stock for " + item.getItemName()
                        + ". Available: " + item.getQuantity() + ", Requested: " + qty);
            }
        }

        // Create and save bill first to get ID
        Bill bill = Bill.builder()
                .billNumber(billNumber)
                .patientId(patient.getId())
                .createdBy(userId)
                .subtotal(BigDecimal.ZERO)
                .discount(discount)
                .tax(tax)
                .totalAmount(BigDecimal.ZERO)
                .paymentStatus(request.getPaymentStatus())
                .paymentMethod(request.getPaymentMethod())
                .billDate(OffsetDateTime.now())
                .build();
        bill = billRepository.save(bill);

        List<BillItem> billItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        // Process items after validation passes
        for (BillItemRequest itemReq : request.getItems()) {
            InventoryItem item = inventoryRepository.findById(itemReq.getInventoryItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", itemReq.getInventoryItemId()));
            BigDecimal quantity = itemReq.getQuantity();
            BigDecimal sellingPrice = item.getSellingPrice();
            BigDecimal lineTotal = sellingPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);

            BigDecimal previousQty = item.getQuantity();
            BigDecimal newQty = previousQty.subtract(quantity);
            item.setQuantity(newQty);
            inventoryRepository.save(item);

            StockTransaction txn = StockTransaction.builder()
                    .item(item)
                    .quantityChanged(quantity)
                    .transactionType("MEDICINE_DISPENSED")
                    .previousQuantity(previousQty)
                    .newQuantity(newQty)
                    .performedById(userId)
                    .notes("Bill sale: " + billNumber)
                    .referenceType("BILL")
                    .referenceId(bill.getId())
                    .build();
            transactionRepository.save(txn);

            BillItem billItem = BillItem.builder()
                    .inventoryItemId(item.getId())
                    .itemName(item.getItemName())
                    .quantity(quantity)
                    .sellingPrice(sellingPrice)
                    .lineTotal(lineTotal)
                    .build();
            billItems.add(billItem);
        }

        BigDecimal totalAmount = subtotal.subtract(discount).add(tax);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) totalAmount = BigDecimal.ZERO;

        bill.setSubtotal(subtotal);
        bill.setTotalAmount(totalAmount);
        for (BillItem bi : billItems) {
            bill.addBillItem(bi);
        }
        bill = billRepository.save(bill);

        if ("PAID".equalsIgnoreCase(request.getPaymentStatus())) {
            createIncomeRecord("MEDICINE_SALE", bill.getId(), totalAmount,
                    request.getPaymentMethod(), userId, "Medicine sale - Bill " + billNumber);
        }

        BillResponse response = BillResponse.fromEntity(bill);
        response.setPatientName(patient.getName());
        response.setPatientPhone(patient.getPhone());
        return response;
    }

    @Transactional(readOnly = true)
    public List<BillResponse> getAllBills() {
        List<Bill> bills = billRepository.findAllByOrderByCreatedAtDesc();
        return bills.stream().map(bill -> {
            BillResponse response = BillResponse.fromEntity(bill);
            patientRepository.findById(bill.getPatientId()).ifPresent(p -> {
                response.setPatientName(p.getName());
                response.setPatientPhone(p.getPhone());
            });
            return response;
        }).toList();
    }

    @Transactional(readOnly = true)
    public BillResponse getBillById(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", id));
        BillResponse response = BillResponse.fromEntity(bill);
        patientRepository.findById(bill.getPatientId()).ifPresent(p -> {
            response.setPatientName(p.getName());
            response.setPatientPhone(p.getPhone());
        });
        return response;
    }

    @Transactional
    public BillResponse updatePaymentStatus(Long billId, String paymentStatus, String paymentMethod) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", billId));
        bill.setPaymentStatus(paymentStatus);
        if (paymentMethod != null) {
            bill.setPaymentMethod(paymentMethod);
        }
        bill = billRepository.save(bill);

        if ("PAID".equalsIgnoreCase(paymentStatus)) {
            createIncomeRecord("MEDICINE_SALE", bill.getId(), bill.getTotalAmount(),
                    bill.getPaymentMethod(), null, "Payment received - Bill " + bill.getBillNumber());
        }

        BillResponse response = BillResponse.fromEntity(bill);
        patientRepository.findById(bill.getPatientId()).ifPresent(p -> {
            response.setPatientName(p.getName());
            response.setPatientPhone(p.getPhone());
        });
        return response;
    }

    @Transactional(readOnly = true)
    public BillingSummaryResponse getSummary() {
        long totalBills = billRepository.count();
        long paidBills = billRepository.countByPaymentStatus("PAID");
        long pendingBills = billRepository.countByPaymentStatus("PENDING");
        BigDecimal totalRevenue = billRepository.totalPaidRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        return BillingSummaryResponse.builder()
                .totalBills(totalBills)
                .paidBills(paidBills)
                .pendingBills(pendingBills)
                .totalRevenue(totalRevenue)
                .build();
    }

    private void createIncomeRecord(String incomeType, Long referenceId, BigDecimal amount,
                                     String paymentMethod, Long receivedBy, String description) {
        IncomeRecord record = IncomeRecord.builder()
                .incomeType(incomeType)
                .referenceId(referenceId)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .receivedBy(receivedBy)
                .description(description)
                .build();
        incomeRecordRepository.save(record);
    }

    private synchronized String generateBillNumber() {
        billCounter++;
        return "BILL-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%04d", billCounter);
    }
}
