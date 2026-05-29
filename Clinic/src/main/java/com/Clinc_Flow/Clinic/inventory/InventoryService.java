package com.Clinc_Flow.Clinic.inventory;

import com.Clinc_Flow.Clinic.exception.ResourceNotFoundException;
import com.Clinc_Flow.Clinic.inventory.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final StockTransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public List<InventoryResponse> findAll(String stockType, Boolean archived) {
        List<InventoryItem> items;
        if (Boolean.TRUE.equals(archived)) {
            items = inventoryRepository.findByArchivedTrue();
        } else if (stockType != null && !stockType.isEmpty()) {
            items = inventoryRepository.findByStockTypeAndArchivedFalse(stockType);
        } else {
            items = inventoryRepository.findByArchivedFalse();
        }
        return items.stream().map(InventoryResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public InventoryResponse findById(Long id) {
        InventoryItem item = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", id));
        return InventoryResponse.fromEntity(item);
    }

    @Transactional
    public InventoryResponse create(InventoryRequest request, Long userId) {
        InventoryItem item = InventoryItem.builder()
                .itemName(request.getItemName())
                .stockType(request.getStockType())
                .category(request.getCategory())
                .quantity(BigDecimal.ZERO)
                .minimumThreshold(request.getMinimumThreshold() != null ? request.getMinimumThreshold() : BigDecimal.valueOf(5))
                .unitType(request.getUnitType())
                .purchasePrice(request.getPurchasePrice())
                .sellingPrice(request.getSellingPrice())
                .supplierName(request.getSupplierName())
                .batchNumber(request.getBatchNumber())
                .expiryDate(request.getExpiryDate())
                .description(request.getDescription())
                .archived(false)
                .createdById(userId)
                .build();
        return InventoryResponse.fromEntity(inventoryRepository.save(item));
    }

    @Transactional
    public InventoryResponse update(Long id, InventoryRequest request) {
        InventoryItem item = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", id));
        item.setItemName(request.getItemName());
        item.setStockType(request.getStockType());
        item.setCategory(request.getCategory());
        item.setUnitType(request.getUnitType());
        item.setPurchasePrice(request.getPurchasePrice());
        item.setSellingPrice(request.getSellingPrice());
        item.setSupplierName(request.getSupplierName());
        item.setBatchNumber(request.getBatchNumber());
        item.setExpiryDate(request.getExpiryDate());
        item.setDescription(request.getDescription());
        if (request.getMinimumThreshold() != null) {
            item.setMinimumThreshold(request.getMinimumThreshold());
        }
        return InventoryResponse.fromEntity(inventoryRepository.save(item));
    }

    @Transactional
    public InventoryResponse adjustStock(Long id, StockAdjustRequest request, Long userId) {
        InventoryItem item = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", id));

        if (item.getArchived()) {
            throw new IllegalArgumentException("Cannot adjust stock for archived item");
        }

        BigDecimal previousQty = item.getQuantity();
        BigDecimal change = request.getQuantity();
        BigDecimal newQty;

        String type = request.getTransactionType().toUpperCase();
        switch (type) {
            case "STOCK_ADDED":
                newQty = previousQty.add(change);
                break;
            case "STOCK_USED":
            case "MEDICINE_DISPENSED":
            case "MANUAL_ADJUSTMENT":
            case "EXPIRED_REMOVED":
                newQty = previousQty.subtract(change);
                if (newQty.compareTo(BigDecimal.ZERO) < 0) {
                    throw new IllegalArgumentException("Insufficient stock. Available: " + previousQty);
                }
                break;
            default:
                throw new IllegalArgumentException("Invalid transaction type: " + type);
        }

        item.setQuantity(newQty);
        inventoryRepository.save(item);

        StockTransaction txn = StockTransaction.builder()
                .item(item)
                .quantityChanged(change)
                .transactionType(type)
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .performedById(userId)
                .notes(request.getNotes())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .build();
        transactionRepository.save(txn);

        return InventoryResponse.fromEntity(item);
    }

    @Transactional
    public InventoryResponse archive(Long id) {
        InventoryItem item = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", id));
        item.setArchived(true);
        return InventoryResponse.fromEntity(inventoryRepository.save(item));
    }

    @Transactional
    public InventoryResponse restore(Long id) {
        InventoryItem item = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryItem", id));
        item.setArchived(false);
        return InventoryResponse.fromEntity(inventoryRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getLowStock() {
        return inventoryRepository.findLowStockItems().stream()
                .map(InventoryResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getExpiryAlerts() {
        LocalDate today = LocalDate.now();
        List<InventoryItem> expired = inventoryRepository.findExpiredItems(today);
        List<InventoryItem> nearExpiry = inventoryRepository.findNearExpiryItems(today, today.plusDays(30));
        Set<Long> seen = new HashSet<>();
        List<InventoryItem> all = new ArrayList<>();
        for (InventoryItem i : expired) { if (seen.add(i.getId())) all.add(i); }
        for (InventoryItem i : nearExpiry) { if (seen.add(i.getId())) all.add(i); }
        return all.stream().map(InventoryResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return findAll(null, false);
        }
        return inventoryRepository.search(query.trim()).stream()
                .map(InventoryResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<StockTransactionResponse> getTransactions(Long itemId) {
        if (itemId != null) {
            if (!inventoryRepository.existsById(itemId)) {
                throw new ResourceNotFoundException("InventoryItem", itemId);
            }
            return transactionRepository.findByItemIdOrderByCreatedAtDesc(itemId).stream()
                    .map(StockTransactionResponse::fromEntity).toList();
        }
        OffsetDateTime since = OffsetDateTime.now().minusDays(90);
        return transactionRepository.findRecentTransactions(since).stream()
                .map(StockTransactionResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new LinkedHashMap<>();

        long totalItems = inventoryRepository.countByArchivedFalse();
        long lowStockCount = inventoryRepository.findLowStockItems().size();
        long expiredCount = transactionRepository.findByTransactionTypeOrderByCreatedAtDesc("EXPIRED_REMOVED").size();
        long internalCount = inventoryRepository.countByStockTypeAndArchivedFalse("INTERNAL");
        long externalCount = inventoryRepository.countByStockTypeAndArchivedFalse("EXTERNAL");

        Map<String, Long> summary = new LinkedHashMap<>();
        summary.put("totalItems", totalItems);
        summary.put("lowStockCount", lowStockCount);
        summary.put("expiredCount", expiredCount);
        summary.put("internalCount", internalCount);
        summary.put("externalCount", externalCount);
        analytics.put("summary", summary);

        List<Object[]> consumed = transactionRepository.findMostConsumedItems();
        List<Map<String, Object>> mostConsumed = new ArrayList<>();
        for (Object[] row : consumed) {
            Long itemId = (Long) row[0];
            BigDecimal totalUsed = (BigDecimal) row[1];
            inventoryRepository.findById(itemId).ifPresent(item -> {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("itemId", item.getId());
                entry.put("itemName", item.getItemName());
                entry.put("totalUsed", totalUsed);
                mostConsumed.add(entry);
            });
        }
        analytics.put("mostConsumed", mostConsumed);
        analytics.put("totalInventoryValue", inventoryRepository.findByArchivedFalse().stream()
                .filter(i -> i.getPurchasePrice() != null)
                .mapToDouble(i -> i.getQuantity().multiply(i.getPurchasePrice()).doubleValue())
                .sum());

        return analytics;
    }
}
