# Grafana 모니터링 시스템 설치 가이드

## 개요

이 문서는 NestJS 백엔드 보일러플레이트에 Grafana와 Prometheus를 연동한 서버 모니터링 시스템 구축에 대한 설치 가이드입니다.

## 구현 내용

### 1. Docker Compose 설정

**파일**: `docker-compose.yml`

추가된 서비스:
- **Prometheus** (포트 9090): 메트릭 수집 및 저장
- **Grafana** (포트 3001): 대시보드 시각화

```yaml
prometheus:
  image: prom/prometheus:latest
  ports:
    - '9090:9090'
  volumes:
    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana:latest
  ports:
    - '3001:3000'
  environment:
    - GF_SECURITY_ADMIN_USER=admin
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 2. Prometheus 설정

**파일**: `prometheus/prometheus.yml`

- NestJS 앱을 10초마다 스크랩
- 타겟: `host.docker.internal:3000/metrics`
- 추가 exporter 지원 준비 (PostgreSQL, Redis, Node)

### 3. Grafana 프로비저닝

#### 데이터소스 자동 연결
**파일**: `grafana/provisioning/datasources/datasource.yml`

- Prometheus 자동 연결
- 기본 데이터소스로 설정

#### 대시보드 자동 로드
**파일**: `grafana/provisioning/dashboards/dashboard.yml`

- 시작 시 대시보드 자동 로드
- 실시간 업데이트 지원

### 4. 사전 구성된 대시보드

**파일**: `grafana/dashboards/nestjs-app.json`

포함된 패널:
1. **HTTP Request Rate** - 초당 요청 수 (메서드, 경로, 상태별)
2. **HTTP Request Duration** - P95/P50 응답 시간
3. **Total Requests** - 최근 5분 총 요청 수
4. **Status Codes Distribution** - 상태 코드 비율 (파이 차트)
5. **WebSocket Connections** - 현재 활성 연결 수
6. **Queue Jobs** - 큐 작업 총 개수
7. **Error Rate** - 5xx 에러 비율
8. **Queue Processing Rate** - 성공/실패 작업 처리 속도

대시보드 설정:
- 자동 새로고침: 10초
- 시간 범위: 최근 1시간
- 다크 테마

### 5. 추가 메트릭 구현

#### 메트릭 모듈 업데이트
**파일**: `src/modules/metrics/metrics.module.ts`

추가된 메트릭:
- `queue_jobs_completed_total` (Counter): 성공한 큐 작업 수
- `queue_jobs_failed_total` (Counter): 실패한 큐 작업 수
- `websocket_connections_total` (Gauge): 현재 WebSocket 연결 수

#### WebSocket 메트릭
**파일**: `src/modules/websocket/websocket.gateway.ts`

- Connection 시 gauge 증가
- Disconnection 시 gauge 감소
- 실시간 활성 연결 수 추적

#### Queue 메트릭
**파일**: `src/queue/processors/email.processor.ts`

- 작업 성공 시 `queue_jobs_completed_total` 증가
- 작업 실패 시 `queue_jobs_failed_total` 증가
- 큐 이름별 레이블 추가

### 6. 모듈 의존성 업데이트

**파일**: `src/modules/websocket/websocket.module.ts`
- MetricsModule import 추가

**파일**: `src/queue/queue.module.ts`
- MetricsModule import 추가

### 7. 환경 변수

**파일**: `.env.example`

추가된 변수:
```env
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
```

### 8. 문서화

**파일**: `MONITORING.md`
- 모니터링 시스템 완전한 가이드
- 메트릭 설명 및 쿼리 예제
- 커스텀 메트릭 추가 방법
- 알림 설정 가이드
- 문제 해결 섹션
- 프로덕션 고려사항

**파일**: `README.md` 업데이트
- 모니터링 섹션 추가
- 접속 URL 추가
- Tech Stack에 Prometheus & Grafana 추가

## 디렉토리 구조

```
backend-boilerplate/
├── docker-compose.yml              # Prometheus, Grafana 서비스 추가
├── prometheus/
│   └── prometheus.yml              # Prometheus 설정
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasource.yml     # 데이터소스 자동 연결
│   │   └── dashboards/
│   │       └── dashboard.yml      # 대시보드 자동 로드
│   └── dashboards/
│       └── nestjs-app.json        # NestJS 대시보드 정의
├── src/
│   ├── modules/
│   │   ├── metrics/
│   │   │   └── metrics.module.ts  # 추가 메트릭 정의
│   │   └── websocket/
│   │       ├── websocket.gateway.ts  # WebSocket 메트릭
│   │       └── websocket.module.ts   # MetricsModule import
│   └── queue/
│       ├── processors/
│       │   └── email.processor.ts    # Queue 메트릭
│       └── queue.module.ts           # MetricsModule import
├── MONITORING.md                   # 모니터링 가이드
├── GRAFANA_SETUP.md               # 이 파일
└── README.md                      # 업데이트됨
```

## 빠른 시작

### 1. 서비스 시작

```bash
# 모든 서비스 시작
docker-compose up -d

# 또는 모니터링 서비스만 시작
docker-compose up -d prometheus grafana
```

### 2. 애플리케이션 실행

```bash
pnpm start:dev
```

### 3. 접속

- **NestJS 메트릭**: http://localhost:3000/metrics
- **Prometheus**: http://localhost:9090
  - Targets 확인: http://localhost:9090/targets
- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin`
  - 대시보드: "NestJS Backend Boilerplate"

### 4. 대시보드 확인

Grafana 로그인 후:
1. 왼쪽 메뉴 > Dashboards
2. "NestJS Backend Boilerplate" 선택
3. 실시간 메트릭 확인

## 메트릭 검증

### Prometheus에서 쿼리 테스트

http://localhost:9090에서 다음 쿼리 실행:

```promql
# HTTP 요청 수
http_requests_total

# WebSocket 연결
websocket_connections_total

# 큐 작업
queue_jobs_completed_total
queue_jobs_failed_total

# 요청 속도
rate(http_requests_total[5m])

# P95 응답 시간
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### 메트릭 엔드포인트 확인

```bash
# 모든 메트릭 확인
curl http://localhost:3000/metrics

# 특정 메트릭 검색
curl http://localhost:3000/metrics | grep websocket_connections_total
curl http://localhost:3000/metrics | grep queue_jobs
```

## 주요 기능

### 1. 실시간 모니터링
- 10초마다 자동 새로고침
- 실시간 메트릭 업데이트

### 2. 히스토리 추적
- Prometheus 데이터 보존 (기본 15일)
- 시간 범위 선택 가능

### 3. 다중 차트
- 시계열 그래프
- 게이지
- 파이 차트

### 4. 알림 (설정 가능)
- Grafana Alerting
- Prometheus Alertmanager
- 다양한 채널 지원 (Slack, Email 등)

## 커스터마이징

### 대시보드 수정

1. Grafana UI에서 대시보드 편집
2. 변경사항 저장
3. JSON 내보내기
4. `grafana/dashboards/nestjs-app.json` 업데이트

### 메트릭 추가

1. `src/modules/metrics/metrics.module.ts`에 메트릭 정의
2. 서비스/컨트롤러에서 메트릭 사용
3. Prometheus에서 쿼리 테스트
4. Grafana 대시보드에 패널 추가

자세한 내용은 [MONITORING.md](./MONITORING.md)를 참조하세요.

## 프로덕션 배포

### 보안

1. **Grafana 비밀번호 변경**:
```yaml
# docker-compose.yml
environment:
  - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
```

2. **메트릭 엔드포인트 보호**:
```typescript
// src/modules/metrics/metrics.controller.ts
@UseGuards(ApiKeyGuard)
@Get()
getMetrics() { ... }
```

3. **방화벽 설정**:
- Prometheus (9090): 내부 네트워크만 허용
- Grafana (3001): VPN 또는 인증 필요

### 성능

1. **데이터 보존 기간 설정**:
```yaml
# docker-compose.yml
prometheus:
  command:
    - '--storage.tsdb.retention.time=30d'
```

2. **스크랩 간격 조정**:
```yaml
# prometheus/prometheus.yml
scrape_configs:
  - job_name: 'nestjs-app'
    scrape_interval: 30s  # 기본 10s에서 변경
```

3. **메트릭 카디널리티 관리**:
- 불필요한 레이블 제거
- 높은 카디널리티 레이블 주의

### 고가용성

1. **Prometheus HA**:
- Thanos 사용 고려
- 장기 스토리지 (S3, GCS)

2. **Grafana HA**:
- 외부 데이터베이스 사용
- 여러 인스턴스 실행

## 문제 해결

### Prometheus가 메트릭을 수집하지 못함

```bash
# Prometheus 로그 확인
docker-compose logs prometheus

# Targets 상태 확인
# http://localhost:9090/targets

# NestJS 앱 메트릭 확인
curl http://localhost:3000/metrics
```

### Grafana 대시보드에 데이터 없음

1. 데이터소스 연결 확인:
   - Configuration > Data Sources > Prometheus
   - "Test" 버튼 클릭

2. Prometheus에서 직접 쿼리:
   - http://localhost:9090
   - 쿼리: `http_requests_total`

3. 시간 범위 확인:
   - 대시보드 우측 상단 시간 선택기

### Docker 볼륨 권한 문제

```bash
# 볼륨 삭제 및 재생성
docker-compose down -v
docker-compose up -d

# 권한 수정 (Linux)
sudo chown -R 472:472 grafana/
sudo chown -R 65534:65534 prometheus/
```

## 다음 단계

1. **알림 설정**: 중요 메트릭에 대한 알림 구성
2. **추가 대시보드**: 비즈니스 메트릭 대시보드 생성
3. **APM 통합**: Jaeger/Zipkin 추적 추가
4. **로그 집계**: ELK Stack 또는 Loki 연동
5. **SLO 정의**: 서비스 수준 목표 설정

## 참고 자료

- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [Grafana 공식 문서](https://grafana.com/docs/)
- [NestJS Prometheus](https://github.com/willsoto/nestjs-prometheus)
- [MONITORING.md](./MONITORING.md) - 상세 가이드
- [FEATURES.md](./FEATURES.md) - 전체 기능 목록
