package app.healthfamily.apiController.healthrecord;

import app.healthfamily.apiController.ApiResponse;
import app.healthfamily.domain.healthrecord.BodyMeasurement;
import app.healthfamily.domain.healthrecord.BodyMeasurementRecord;
import app.healthfamily.domain.healthrecord.BodyTemperature;
import app.healthfamily.domain.healthrecord.TemperatureRecord;
import app.healthfamily.domain.healthrecord.VaccinationRecord;
import app.healthfamily.domain.healthrecord.VaccinationSchedule;
import app.healthfamily.domain.shared.AppZone;
import app.healthfamily.usecase.crud.MemberScopedCrudUseCase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 体温・体格・ワクチンのエンドポイント。
 *
 * <p>値の妥当性は値オブジェクトが持つ。ここは組み立てと表示形への変換だけを担う。
 * 判定結果（発熱の段階・BMI・通知要否）は保存せず、その都度算出して返す。
 * 保存すると規則を変えたときに古い判定が残るため。
 */
@RestController
public class HealthRecordController {

    private final MemberScopedCrudUseCase<TemperatureRecord> temperatures;
    private final MemberScopedCrudUseCase<BodyMeasurementRecord> measurements;
    private final MemberScopedCrudUseCase<VaccinationRecord> vaccinations;
    private final AppZone zone;

    public HealthRecordController(
            MemberScopedCrudUseCase<TemperatureRecord> temperatures,
            MemberScopedCrudUseCase<BodyMeasurementRecord> measurements,
            MemberScopedCrudUseCase<VaccinationRecord> vaccinations,
            AppZone zone) {
        this.temperatures = temperatures;
        this.measurements = measurements;
        this.vaccinations = vaccinations;
        this.zone = zone;
    }

    // --- 体温 ---------------------------------------------------------------

    @GetMapping("/api/temperature-records")
    public ApiResponse<List<TemperatureView>> listTemperatures(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(
                temperatures.list(jwt.getSubject()).stream().map(TemperatureView::of).toList());
    }

    @PostMapping("/api/temperature-records")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TemperatureView> createTemperature(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody TemperatureRequest request) {
        var record =
                new TemperatureRecord(
                        UUID.randomUUID().toString(),
                        jwt.getSubject(),
                        request.memberId(),
                        BodyTemperature.of(request.temperature()),
                        request.measuredAt(),
                        request.notes());
        return ApiResponse.ok(TemperatureView.of(temperatures.create(jwt.getSubject(), record)));
    }

    @DeleteMapping("/api/temperature-records/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTemperature(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        temperatures.delete(jwt.getSubject(), id);
    }

    // --- 体格 ---------------------------------------------------------------

    @GetMapping("/api/body-measurements")
    public ApiResponse<List<MeasurementView>> listMeasurements(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(
                measurements.list(jwt.getSubject()).stream().map(MeasurementView::of).toList());
    }

    @PostMapping("/api/body-measurements")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MeasurementView> createMeasurement(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody MeasurementRequest request) {
        var record =
                new BodyMeasurementRecord(
                        UUID.randomUUID().toString(),
                        jwt.getSubject(),
                        request.memberId(),
                        BodyMeasurement.of(request.weight(), request.height()),
                        request.recordedAt(),
                        request.notes());
        return ApiResponse.ok(MeasurementView.of(measurements.create(jwt.getSubject(), record)));
    }

    @DeleteMapping("/api/body-measurements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMeasurement(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        measurements.delete(jwt.getSubject(), id);
    }

    // --- ワクチン -------------------------------------------------------------

    @GetMapping("/api/vaccinations")
    public ApiResponse<List<VaccinationView>> listVaccinations(@AuthenticationPrincipal Jwt jwt) {
        LocalDate today = zone.today();
        return ApiResponse.ok(
                vaccinations.list(jwt.getSubject()).stream().map(v -> VaccinationView.of(v, today)).toList());
    }

    @PostMapping("/api/vaccinations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<VaccinationView> createVaccination(
            @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody VaccinationRequest request) {
        var record =
                new VaccinationRecord(
                        UUID.randomUUID().toString(),
                        jwt.getSubject(),
                        request.memberId(),
                        request.vaccineName(),
                        VaccinationSchedule.of(
                                toDate(request.vaccinatedAt()), toDate(request.nextScheduledDate())),
                        request.notes());
        return ApiResponse.ok(
                VaccinationView.of(vaccinations.create(jwt.getSubject(), record), zone.today()));
    }

    @DeleteMapping("/api/vaccinations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVaccination(@AuthenticationPrincipal Jwt jwt, @PathVariable String id) {
        vaccinations.delete(jwt.getSubject(), id);
    }

    private static LocalDate toDate(Instant instant) {
        return instant == null ? null : instant.atZone(java.time.ZoneOffset.UTC).toLocalDate();
    }

    // --- 入出力の形 -----------------------------------------------------------

    public record TemperatureRequest(
            @NotBlank String memberId,
            double temperature,
            Instant measuredAt,
            @Size(max = 2000) String notes) {}

    public record TemperatureView(
            String id, String memberId, double temperature, String feverLevel, Instant measuredAt,
            String notes) {

        static TemperatureView of(TemperatureRecord r) {
            return new TemperatureView(
                    r.id(),
                    r.memberId(),
                    r.temperature().value(),
                    r.feverLevel().name(),
                    r.measuredAt(),
                    r.notes());
        }
    }

    public record MeasurementRequest(
            @NotBlank String memberId,
            Double weight,
            Double height,
            Instant recordedAt,
            @Size(max = 2000) String notes) {}

    public record MeasurementView(
            String id, String memberId, Double weight, Double height, Double bmi, Instant recordedAt,
            String notes) {

        static MeasurementView of(BodyMeasurementRecord r) {
            return new MeasurementView(
                    r.id(),
                    r.memberId(),
                    r.measurement().weightKg(),
                    r.measurement().heightCm(),
                    r.bmi().orElse(null),
                    r.recordedAt(),
                    r.notes());
        }
    }

    public record VaccinationRequest(
            @NotBlank String memberId,
            @NotBlank @Size(max = 200) String vaccineName,
            Instant vaccinatedAt,
            Instant nextScheduledDate,
            @Size(max = 2000) String notes) {}

    public record VaccinationView(
            String id,
            String memberId,
            String vaccineName,
            LocalDate vaccinatedAt,
            LocalDate nextScheduledDate,
            Long daysUntilNext,
            boolean needsReminder,
            boolean overdue,
            String notes) {

        static VaccinationView of(VaccinationRecord r, LocalDate today) {
            var schedule = r.schedule();
            return new VaccinationView(
                    r.id(),
                    r.memberId(),
                    r.vaccineName(),
                    schedule.vaccinatedAt(),
                    schedule.nextScheduledDate(),
                    schedule.daysUntilNext(today).orElse(null),
                    schedule.needsReminderOn(today),
                    schedule.isOverdueOn(today),
                    r.notes());
        }
    }
}
