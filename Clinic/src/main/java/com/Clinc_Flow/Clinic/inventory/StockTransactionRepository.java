package com.Clinc_Flow.Clinic.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    List<StockTransaction> findByItemIdOrderByCreatedAtDesc(Long itemId);

    List<StockTransaction> findByTransactionTypeOrderByCreatedAtDesc(String transactionType);

    @Query("SELECT t FROM StockTransaction t WHERE t.createdAt >= :since ORDER BY t.createdAt DESC")
    List<StockTransaction> findRecentTransactions(OffsetDateTime since);

    @Query("SELECT t.item.id, SUM(t.quantityChanged) FROM StockTransaction t WHERE t.transactionType IN ('STOCK_USED', 'MEDICINE_DISPENSED') GROUP BY t.item.id ORDER BY SUM(t.quantityChanged) DESC")
    List<Object[]> findMostConsumedItems();
}
