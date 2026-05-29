package com.Clinc_Flow.Clinic.inventory;

import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import com.Clinc_Flow.Clinic.inventory.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getAllInventory(
            @RequestParam(required = false) String stockType,
            @RequestParam(required = false) Boolean archived) {
        return ResponseEntity.ok(inventoryService.findAll(stockType, archived));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryResponse> getInventoryItem(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<InventoryResponse> createItem(@Valid @RequestBody InventoryRequest request) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        InventoryResponse response = inventoryService.create(request, user.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<InventoryResponse> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody InventoryRequest request) {
        return ResponseEntity.ok(inventoryService.update(id, request));
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<InventoryResponse> adjustStock(
            @PathVariable Long id,
            @Valid @RequestBody StockAdjustRequest request) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return ResponseEntity.ok(inventoryService.adjustStock(id, request, user.userId()));
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<InventoryResponse> archiveItem(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.archive(id));
    }

    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<InventoryResponse> restoreItem(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.restore(id));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryResponse>> getLowStock() {
        return ResponseEntity.ok(inventoryService.getLowStock());
    }

    @GetMapping("/expiry-alerts")
    public ResponseEntity<List<InventoryResponse>> getExpiryAlerts() {
        return ResponseEntity.ok(inventoryService.getExpiryAlerts());
    }

    @GetMapping("/search")
    public ResponseEntity<List<InventoryResponse>> search(@RequestParam String q) {
        return ResponseEntity.ok(inventoryService.search(q));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<StockTransactionResponse>> getTransactions(
            @RequestParam(required = false) Long itemId) {
        return ResponseEntity.ok(inventoryService.getTransactions(itemId));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        return ResponseEntity.ok(inventoryService.getAnalytics());
    }
}
