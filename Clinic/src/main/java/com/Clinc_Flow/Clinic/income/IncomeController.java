package com.Clinc_Flow.Clinic.income;

import com.Clinc_Flow.Clinic.income.dto.IncomeResponse;
import com.Clinc_Flow.Clinic.income.dto.IncomeSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/income")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class IncomeController {

    private final IncomeService incomeService;

    @GetMapping
    public ResponseEntity<List<IncomeResponse>> getAllIncome() {
        return ResponseEntity.ok(incomeService.getAllIncome());
    }

    @GetMapping("/today")
    public ResponseEntity<IncomeSummaryResponse> getTodayIncome() {
        return ResponseEntity.ok(incomeService.getSummary());
    }

    @GetMapping("/monthly")
    public ResponseEntity<IncomeSummaryResponse> getMonthlyIncome() {
        return ResponseEntity.ok(incomeService.getSummary());
    }

    @GetMapping("/yearly")
    public ResponseEntity<IncomeSummaryResponse> getYearlyIncome() {
        return ResponseEntity.ok(incomeService.getSummary());
    }

    @GetMapping("/summary")
    public ResponseEntity<IncomeSummaryResponse> getIncomeSummary() {
        return ResponseEntity.ok(incomeService.getSummary());
    }

    @GetMapping("/type/{incomeType}")
    public ResponseEntity<List<IncomeResponse>> getIncomeByType(@PathVariable String incomeType) {
        return ResponseEntity.ok(incomeService.getIncomeByType(incomeType));
    }
}
