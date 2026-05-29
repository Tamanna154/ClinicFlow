package com.Clinc_Flow.Clinic.inventory;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "inventory_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(name = "stock_type", nullable = false, length = 20)
    private String stockType;

    @Column(length = 100)
    private String category;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "minimum_threshold", nullable = false)
    private BigDecimal minimumThreshold;

    @Column(name = "unit_type", length = 30)
    private String unitType;

    @Column(name = "purchase_price", precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "selling_price", precision = 10, scale = 2)
    private BigDecimal sellingPrice;

    @Column(name = "supplier_name", length = 200)
    private String supplierName;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Boolean archived;

    @Column(name = "created_by_id")
    private Long createdById;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        if (quantity == null) quantity = BigDecimal.ZERO;
        if (minimumThreshold == null) minimumThreshold = BigDecimal.valueOf(5);
        if (archived == null) archived = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
