package com.Clinc_Flow.Clinic.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierRepository supplierRepository;

    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(supplierRepository.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Supplier>> getActiveSuppliers() {
        return ResponseEntity.ok(supplierRepository.findByStatus("ACTIVE"));
    }

    @PostMapping
    public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier) {
        if (supplier.getStatus() == null) {
            supplier.setStatus("ACTIVE");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierRepository.save(supplier));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @RequestBody Supplier details) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
        supplier.setName(details.getName());
        supplier.setContactPerson(details.getContactPerson());
        supplier.setPhone(details.getPhone());
        supplier.setEmail(details.getEmail());
        supplier.setAddress(details.getAddress());
        supplier.setGstNumber(details.getGstNumber());
        if (details.getStatus() != null) {
            supplier.setStatus(details.getStatus());
        }
        return ResponseEntity.ok(supplierRepository.save(supplier));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
        supplierRepository.delete(supplier);
        return ResponseEntity.noContent().build();
    }
}
