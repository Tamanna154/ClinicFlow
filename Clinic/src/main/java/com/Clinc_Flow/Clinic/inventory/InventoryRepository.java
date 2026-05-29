package com.Clinc_Flow.Clinic.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByArchivedFalse();

    List<InventoryItem> findByArchivedTrue();

    List<InventoryItem> findByStockTypeAndArchivedFalse(String stockType);

    List<InventoryItem> findByItemNameContainingIgnoreCaseAndArchivedFalse(String name);

    List<InventoryItem> findByCategoryContainingIgnoreCaseAndArchivedFalse(String category);

    @Query("SELECT i FROM InventoryItem i WHERE i.archived = false AND i.quantity <= i.minimumThreshold")
    List<InventoryItem> findLowStockItems();

    @Query("SELECT i FROM InventoryItem i WHERE i.archived = false AND i.expiryDate IS NOT NULL AND i.expiryDate <= :date")
    List<InventoryItem> findExpiredItems(LocalDate date);

    @Query("SELECT i FROM InventoryItem i WHERE i.archived = false AND i.expiryDate IS NOT NULL AND i.expiryDate > :today AND i.expiryDate <= :threshold")
    List<InventoryItem> findNearExpiryItems(LocalDate today, LocalDate threshold);

    @Query("SELECT i FROM InventoryItem i WHERE i.archived = false AND (LOWER(i.itemName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(i.category) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(i.supplierName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<InventoryItem> search(String query);

    long countByArchivedFalse();

    long countByStockTypeAndArchivedFalse(String stockType);
}
