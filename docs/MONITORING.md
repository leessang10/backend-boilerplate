# 서버 모니터링 시스템 가이드

NestJS 백엔드 보일러플레이트의 Grafana & Prometheus 모니터링 시스템 사용 가이드입니다.

## 목차

- [개요](#개요)
- [시작하기](#시작하기)
- [접속 정보](#접속-정보)
- [메트릭 목록](#메트릭-목록)
- [대시보드 설명](#대시보드-설명)
- [커스텀 메트릭 추가](#커스텀-메트릭-추가)
- [알림 설정](#알림-설정)
- [문제 해결](#문제-해결)

## 개요

이 프로젝트는 다음 모니터링 스택을 사용합니다:

- **Prometheus**: 시계열 데이터베이스 및 메트릭 수집기
- **Grafana**: 시각화 및 대시보드 플랫폼
- **@willsoto/nestjs-prometheus**: NestJS용 Prometheus 통합 라이브러리

### 아키텍처

```
┌─────────────────┐
│  NestJS App     │ ──── /metrics 엔드포인트 노출
│  (Port 3000)    │
└─────────────────┘
         │
         │ Scrapes every 10s
         ▼
┌─────────────────┐
│  Prometheus     │ ──── 메트릭 저장 및 쿼리
│  (Port 9090)    │
└─────────────────┘
         │
         │ PromQL 쿼리
         ▼
┌─────────────────┐
│  Grafana        │ ──── 시각화 대시보드
│  (Port 3001)    │
└─────────────────┘
```

## 시작하기

### 1. Docker Compose로 전체 스택 실행

```bash
# 모든 서비스 시작 (PostgreSQL, Redis, Prometheus, Grafana)
docker-compose up -d

# 특정 서비스만 시작
docker-compose up -d prometheus grafana
```

### 2. 애플리케이션 시작

```bash
# 개발 모드
pnpm start:dev

# 프로덕션 모드
pnpm build
pnpm start:prod
```

### 3. 메트릭 확인

NestJS 애플리케이션이 실행되면 `/metrics` 엔드포인트에서 Prometheus 형식의 메트릭을 확인할 수 있습니다:

```bash
curl http://localhost:3000/metrics
```

## 접속 정보

### Prometheus UI

- **URL**: http://localhost:9090
- **주요 기능**:
  - Targets 상태 확인: http://localhost:9090/targets
  - PromQL 쿼리 실행
  - 메트릭 탐색

### Grafana Dashboard

- **URL**: http://localhost:3001
- **초기 로그인 정보**:
  - Username: `admin`
  - Password: `admin`
- **자동 프로비저닝**:
  - Prometheus 데이터소스 자동 연결
  - "NestJS Backend Boilerplate" 대시보드 자동 로드

### Bull Board (Queue 모니터링)

- **URL**: http://localhost:3000/admin/queues
- **기능**: BullMQ 작업 큐 상태 실시간 모니터링

## 메트릭 목록

### 1. HTTP 메트릭

#### `http_requests_total` (Counter)
총 HTTP 요청 수

**레이블**:
- `method`: HTTP 메서드 (GET, POST, PUT, DELETE 등)
- `route`: API 경로
- `status`: HTTP 상태 코드

**사용 예시**:
```promql
# 분당 요청 수
rate(http_requests_total[1m])

# 상태 코드별 요청 비율
sum by (status) (rate(http_requests_total[5m]))

# 5xx 에러율
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```

#### `http_request_duration_seconds` (Histogram)
HTTP 요청 처리 시간

**레이블**:
- `method`: HTTP 메서드
- `route`: API 경로
- `status`: HTTP 상태 코드

**버킷**: [0.1, 0.5, 1, 2, 5] 초

**사용 예시**:
```promql
# 95번째 백분위수 응답 시간
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 50번째 백분위수 응답 시간 (중간값)
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# 평균 응답 시간
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

### 2. 인증 메트릭

#### `users_registered_total` (Counter)
총 사용자 등록 수

**사용 예시**:
```promql
# 시간당 신규 가입자 수
increase(users_registered_total[1h])
```

#### `login_attempts_total` (Counter)
로그인 시도 수

**레이블**:
- `status`: success 또는 failed

**사용 예시**:
```promql
# 로그인 실패율
rate(login_attempts_total{status="failed"}[5m]) / rate(login_attempts_total[5m]) * 100
```

### 3. Queue 메트릭

#### `queue_jobs_total` (Counter)
총 큐 작업 수

**레이블**:
- `queue`: 큐 이름 (email, notification 등)
- `status`: completed, failed 등

#### `queue_jobs_completed_total` (Counter)
성공적으로 완료된 큐 작업 수

**레이블**:
- `queue`: 큐 이름

**사용 예시**:
```promql
# 분당 처리된 이메일 작업 수
rate(queue_jobs_completed_total{queue="email"}[1m])
```

#### `queue_jobs_failed_total` (Counter)
실패한 큐 작업 수

**레이블**:
- `queue`: 큐 이름

**사용 예시**:
```promql
# 작업 실패율
rate(queue_jobs_failed_total[5m]) / (rate(queue_jobs_completed_total[5m]) + rate(queue_jobs_failed_total[5m])) * 100
```

### 4. WebSocket 메트릭

#### `websocket_connections_total` (Gauge)
현재 활성 WebSocket 연결 수

**레이블**:
- `gateway`: WebSocket 게이트웨이 이름

**사용 예시**:
```promql
# 현재 활성 연결 수
websocket_connections_total

# 최근 5분간 최대 동시 접속자 수
max_over_time(websocket_connections_total[5m])
```

### 5. 기본 Node.js 메트릭

Prometheus의 기본 메트릭이 자동으로 수집됩니다:

- `process_cpu_user_seconds_total`: CPU 사용 시간
- `process_resident_memory_bytes`: 메모리 사용량
- `nodejs_eventloop_lag_seconds`: 이벤트 루프 지연
- `nodejs_heap_size_total_bytes`: 힙 메모리 크기
- `nodejs_heap_size_used_bytes`: 사용 중인 힙 메모리

## 대시보드 설명

### NestJS Backend Boilerplate Dashboard

자동으로 프로비저닝된 대시보드는 다음 패널들을 포함합니다:

#### 1. HTTP Request Rate (요청 속도)
- **타입**: Time Series
- **설명**: 초당 HTTP 요청 수를 메서드, 경로, 상태 코드별로 표시
- **쿼리**: `rate(http_requests_total[5m])`

#### 2. HTTP Request Duration (응답 시간)
- **타입**: Time Series
- **설명**: P95와 P50 백분위수 응답 시간
- **쿼리**:
  - P95: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
  - P50: `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))`

#### 3. Total Requests (총 요청 수)
- **타입**: Gauge
- **설명**: 최근 5분간 총 요청 수
- **쿼리**: `sum(increase(http_requests_total[5m]))`

#### 4. HTTP Status Codes Distribution (상태 코드 분포)
- **타입**: Pie Chart
- **설명**: HTTP 상태 코드별 요청 비율
- **쿼리**: `sum by (status) (increase(http_requests_total[5m]))`

#### 5. Active WebSocket Connections (활성 WebSocket 연결)
- **타입**: Gauge
- **설명**: 현재 활성 WebSocket 연결 수
- **쿼리**: `websocket_connections_total`

#### 6. Total Queue Jobs (총 큐 작업)
- **타입**: Gauge
- **설명**: 처리된 총 큐 작업 수
- **쿼리**: `queue_jobs_total`

#### 7. Error Rate (에러율)
- **타입**: Time Series
- **설명**: 5xx 응답 비율
- **쿼리**: `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100`

#### 8. Queue Job Processing Rate (큐 작업 처리 속도)
- **타입**: Time Series (Stacked)
- **설명**: 큐별 성공/실패 작업 처리 속도
- **쿼리**:
  - Completed: `rate(queue_jobs_completed_total[5m])`
  - Failed: `rate(queue_jobs_failed_total[5m])`

### 대시보드 설정

- **자동 새로고침**: 10초마다
- **시간 범위**: 최근 1시간 (조정 가능)
- **다크 테마**: 기본값

## 커스텀 메트릭 추가

### 1. 메트릭 정의

`src/modules/metrics/metrics.module.ts`에서 새 메트릭을 등록:

```typescript
import { makeCounterProvider, makeGaugeProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

// Counter 메트릭
makeCounterProvider({
  name: 'my_custom_counter',
  help: 'Description of my counter',
  labelNames: ['label1', 'label2'],
}),

// Gauge 메트릭
makeGaugeProvider({
  name: 'my_custom_gauge',
  help: 'Description of my gauge',
  labelNames: ['label1'],
}),

// Histogram 메트릭
makeHistogramProvider({
  name: 'my_custom_histogram',
  help: 'Description of my histogram',
  labelNames: ['label1'],
  buckets: [0.1, 0.5, 1, 2, 5],
}),
```

### 2. 메트릭 사용

서비스나 컨트롤러에서 메트릭 사용:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MyService {
  constructor(
    @InjectMetric('my_custom_counter')
    private readonly myCounter: Counter<string>,

    @InjectMetric('my_custom_gauge')
    private readonly myGauge: Gauge<string>,

    @InjectMetric('my_custom_histogram')
    private readonly myHistogram: Histogram<string>,
  ) {}

  myMethod() {
    // Counter 증가
    this.myCounter.inc({ label1: 'value1', label2: 'value2' });

    // Gauge 설정
    this.myGauge.set({ label1: 'value1' }, 42);

    // Histogram 관찰
    const start = Date.now();
    // ... some operation ...
    const duration = (Date.now() - start) / 1000;
    this.myHistogram.observe({ label1: 'value1' }, duration);
  }
}
```

### 3. 메트릭 타입 선택 가이드

- **Counter**: 증가만 하는 값 (요청 수, 에러 수, 완료된 작업 수)
- **Gauge**: 증가/감소 가능한 값 (현재 연결 수, 메모리 사용량, 큐 크기)
- **Histogram**: 값의 분포 측정 (응답 시간, 요청 크기)
- **Summary**: Histogram과 유사하지만 클라이언트 측에서 백분위수 계산

## 알림 설정

### Grafana Alerting

Grafana에서 알림을 설정하려면:

1. **알림 채널 설정**
   - Configuration > Notification channels
   - Slack, Email, PagerDuty 등 지원

2. **알림 규칙 생성**
   - 대시보드 패널 > Edit > Alert 탭
   - 조건 설정 예시:
     ```
     WHEN avg() OF query(A, 5m, now) IS ABOVE 100
     ```

3. **알림 예시**

#### 높은 에러율 알림
```
Name: High Error Rate
Query: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
Condition: WHEN avg() IS ABOVE 5
For: 5m
Message: Error rate is above 5% for the last 5 minutes
```

#### 느린 응답 시간 알림
```
Name: Slow Response Time
Query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
Condition: WHEN avg() IS ABOVE 2
For: 5m
Message: P95 response time is above 2 seconds
```

#### 큐 작업 실패 알림
```
Name: Queue Job Failures
Query: rate(queue_jobs_failed_total[5m])
Condition: WHEN avg() IS ABOVE 0.1
For: 5m
Message: Queue jobs are failing at a high rate
```

### Prometheus Alertmanager (선택사항)

고급 알림 기능을 위해 Alertmanager를 추가할 수 있습니다:

1. **docker-compose.yml에 Alertmanager 추가**:
```yaml
alertmanager:
  image: prom/alertmanager:latest
  ports:
    - '9093:9093'
  volumes:
    - ./alertmanager/config.yml:/etc/alertmanager/config.yml
```

2. **알림 규칙 파일 생성** (`prometheus/alerts.yml`):
```yaml
groups:
  - name: backend_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"
```

## 문제 해결

### 1. Prometheus가 NestJS 앱을 스크랩하지 못함

**증상**: Prometheus Targets 페이지에서 NestJS 앱이 "Down" 상태

**해결 방법**:

1. NestJS 앱이 실행 중인지 확인:
   ```bash
   curl http://localhost:3000/metrics
   ```

2. Docker에서 실행 중이라면 `prometheus.yml`에서 타겟을 확인:
   - Mac/Windows: `host.docker.internal:3000`
   - Linux: `172.17.0.1:3000` 또는 host network 모드 사용

3. Prometheus 로그 확인:
   ```bash
   docker-compose logs prometheus
   ```

### 2. Grafana 대시보드가 데이터를 표시하지 않음

**해결 방법**:

1. 데이터소스 연결 확인:
   - Configuration > Data Sources > Prometheus
   - "Test" 버튼 클릭

2. Prometheus에서 직접 쿼리 테스트:
   - http://localhost:9090
   - 쿼리: `http_requests_total`

3. 시간 범위 확인:
   - 대시보드 우측 상단의 시간 범위를 "Last 1 hour"로 설정

### 3. 메트릭이 수집되지 않음

**해결 방법**:

1. 메트릭이 등록되었는지 확인:
   ```bash
   curl http://localhost:3000/metrics | grep my_metric_name
   ```

2. 모듈이 올바르게 import되었는지 확인:
   - MetricsModule이 app.module.ts에 import되어 있는지
   - 메트릭을 사용하는 모듈이 MetricsModule을 import했는지

3. 타입스크립트 import 에러 확인:
   - `import type { Counter } from 'prom-client'` 사용

### 4. WebSocket 연결 메트릭이 정확하지 않음

**해결 방법**:

1. Gauge 메트릭 사용 확인 (Counter가 아님)
2. handleConnection과 handleDisconnect에서 inc/dec 호출 확인
3. 앱 재시작 시 Gauge를 0으로 리셋

### 5. Docker 컨테이너 권한 문제

**증상**: Grafana 또는 Prometheus 볼륨 마운트 오류

**해결 방법**:
```bash
# 디렉토리 권한 수정
sudo chown -R 472:472 grafana/
sudo chown -R 65534:65534 prometheus/

# 또는 Docker Compose 재시작
docker-compose down -v
docker-compose up -d
```

## 프로덕션 고려사항

### 1. 데이터 보존

Prometheus의 기본 보존 기간은 15일입니다. 변경하려면:

```yaml
# docker-compose.yml
prometheus:
  command:
    - '--storage.tsdb.retention.time=30d'
```

### 2. 보안

- Grafana 기본 비밀번호 변경
- Prometheus `/metrics` 엔드포인트 인증 추가
- 방화벽으로 모니터링 포트 보호

### 3. 성능

- 메트릭 카디널리티 관리 (레이블 수 제한)
- 불필요한 메트릭 비활성화
- Prometheus 스토리지 모니터링

### 4. 고가용성

- Prometheus HA 구성 (Thanos 사용)
- Grafana HA 구성 (외부 DB 사용)
- 메트릭 장기 저장소 (S3, GCS)

## 참고 자료

- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [Grafana 공식 문서](https://grafana.com/docs/)
- [PromQL 쿼리 가이드](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [@willsoto/nestjs-prometheus](https://github.com/willsoto/nestjs-prometheus)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

## 다음 단계

1. **커스텀 대시보드 생성**: 비즈니스 로직에 맞는 대시보드 추가
2. **알림 설정**: 중요 메트릭에 대한 알림 구성
3. **APM 통합**: 상세한 추적을 위해 Jaeger나 Zipkin 추가
4. **로그 집계**: ELK Stack이나 Loki 연동 고려
5. **SLO/SLI 정의**: 서비스 수준 목표 및 지표 설정
