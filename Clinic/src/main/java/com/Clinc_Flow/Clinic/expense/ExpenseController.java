package com.Clinc_Flow.Clinic.expense;

import com.Clinc_Flow.Clinic.config.JwtUserDetails;
import com.Clinc_Flow.Clinic.expense.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody ExpenseRequest request) {
        JwtUserDetails user = (JwtUserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.createExpense(request, user.userId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<List<ExpenseResponse>> getAllExpenses() {
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }

    @GetMapping("/profit")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<ProfitResponse> getProfitReport() {
        return ResponseEntity.ok(expenseService.getProfitReport());
    }
}
