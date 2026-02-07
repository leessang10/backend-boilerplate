# 목적

NestJS로 **프로덕션급 서버 보일러플레이트**를 생성한다. `nest new`로 초기화 후, 아래 요구사항을 모두 포함해 **바로 개발/운영 가능한 형태**로 구성한다.

---

# 기술 스택/전제

* Framework: **NestJS (TypeScript)**
* DB: **PostgreSQL**
* Cache: **Redis**
* Package manager: **pnpm** (가능하면)
* Runtime: Node LTS
* ORM: **Prisma** (고정)
* Container: Docker + docker-compose
* 배포: **Kubernetes Rolling Update** 기반 무중단 배포

---

# 프로젝트 목표 (요구 기능 목록)

아래 항목을 **모두 구현/구성**하고, 각 기능은 최소한의 예제 엔드포인트/샘플 코드까지 포함한다.

## 1) API 기본

* REST API 구조 (Controller/Service/DTO/Validation)
* OpenAPI(Swagger) 문서 자동화
* API 버저닝: URI(`/v1`) 또는 Header 기반 중 택1
* CORS 설정 (환경별 허용 Origin)
* 공통 응답 포맷(성공/실패) + 공통 에러코드 체계
* 글로벌 예외 처리(Global Exception Filter) + Validation Pipe
* Request ID(트레이스 ID) 생성/전파

## 2) 인증/인가/보안

* 인증 방식: **JWT Access/Refresh** 기본 + 토큰 로테이션(선택)
* 비밀번호 해싱(bcrypt/argon2 중 택1)
* Role 기반 인가(Guard + Decorator)
* 보안 헤더(Helmet)
* Rate limiting(예: Throttler)
* CSRF는 REST API 기준 필요 시 옵션으로
* 입력 검증(class-validator/class-transformer)
* 민감정보 마스킹(로그/응답)

## 3) DB (PostgreSQL)

* 마이그레이션/스키마 관리
* 트랜잭션 처리 패턴
* N+1 방지/성능 고려 패턴(서비스 레이어)
* Soft delete(선택) 또는 status 기반 아카이브 규칙
* 샘플 도메인 1개(예: User) CRUD + 페이징/정렬/필터

## 4) 캐싱 (Redis)

* CacheModule 구성 (TTL/네임스페이스/키 전략)
* 캐시 무효화 패턴
* 분산락(필요시) 또는 idempotency 키(선택)

## 5) 메시지큐/이벤트

* 메시지큐: **BullMQ (Redis 기반)** (고정)
* 비동기 작업(Queue Processor) 샘플 1개
* 도메인 이벤트 패턴(이벤트 발행/구독) + Nest 이벤트 또는 CQRS 선택

## 6) 스케줄링

* Cron/Interval 스케줄 예제
* 작업 중복 실행 방지(락/플래그) 고려

## 7) 로깅/트레이싱

* 로거: pino 또는 winston 중 택1
* 구조적 로그(JSON), 레벨, 환경별 포맷
* HTTP 요청/응답 로깅(민감정보 마스킹)
* (선택) OpenTelemetry tracing 연동 훅

## 8) 메트릭스/모니터링

* Prometheus metrics 엔드포인트(`/metrics`) 제공
* 기본 메트릭: request count/latency, error rate
* 헬스체크: `/health` (DB/Redis/Queue)
* (선택) Grafana 대시보드 템플릿 or 설명 문서

## 9) 파일 업로드/스트리밍

* 파일 업로드: Multer 기반 + 사이즈/확장자 제한
* 저장소: 로컬 저장(개발) + S3(선택) 확장 포인트
* 스트리밍: 파일 다운로드 스트리밍 또는 SSE 샘플 1개

## 10) 소켓/실시간

* WebSocket Gateway 구성
* 인증 적용(JWT) + 룸/브로드캐스트 샘플

## 11) 암/복호화

* 대칭키/비대칭키 중 택1로 샘플 제공
* 환경변수 기반 키 관리(개발/운영 분리)
* 사용자 데이터 일부 암호화(예: phone/email 중 택1) 예시

## 12) CI/CD + 무중단 배포

* GitHub Actions 기준으로 파이프라인 작성

  * lint/test/build
  * docker image build/push
  * deploy(예: SSH 원격/쿠버네티스/EC2 중 하나 선택)
* 무중단 배포 전략 문서화

  * **Kubernetes Rolling Update** (readiness/liveness, maxUnavailable/maxSurge, PDB 포함)
* 마이그레이션 실행 순서/롤백 전략 문서화

---

# 추가로 포함하면 좋은 것(추천)

아래 항목도 가능하면 함께 포함한다.

* **환경변수 검증**(zod 또는 joi)
* **Feature flag**(간단한 토글 구조)
* **Idempotency**(결제/요청 재시도 대비)
* **RBAC 외 ABAC**(필요시)
* **Request/Response 스키마 테스트**(contract test는 선택)
* **API Rate limit / IP allowlist**(운영 옵션)
* **Audit log**(누가/언제/무엇을 변경했는지)
* **데이터 시드/로컬 개발 편의**(seed 스크립트, admin 계정 생성)

---

# 운영 필수 보강 항목 (상세 요구)

아래 항목은 실제 운영 환경을 기준으로 **반드시 구현**한다.

## A) 환경변수 스키마 검증

* zod 또는 joi 기반 환경변수 스키마 정의
* 서버 부팅 시 환경변수 검증 실패 시 즉시 종료
* `.env.example` 제공 및 필수/선택 변수 명시
* 환경 분리: local / dev / stage / prod

## B) Request ID / Trace ID 전파

* 모든 요청에 대해 Request ID 생성 (없으면 생성, 있으면 전달)
* HTTP → Service → DB/Queue/Event 전 구간 전파
* 로그에 requestId 필수 포함
* (선택) OpenTelemetry trace/span 연동 포인트 제공

## C) Audit Log

* 대상: 생성/수정/삭제(CUD) + 인증/권한 변경
* 필드 예시:

  * actorId, actorType
  * action (CREATE/UPDATE/DELETE/LOGIN 등)
  * targetType, targetId
  * before, after (JSON)
  * requestId, ip, userAgent
  * createdAt
* DB 저장 + 필요 시 비동기 큐 처리

## D) Idempotency 키

* 헤더 기반 Idempotency-Key 지원
* POST/PUT/PATCH 요청에 적용
* Redis 기반 처리:

  * 요청 해시 저장
  * 중복 요청 시 이전 응답 반환
* TTL 정책 명시

## E) Feature Flag

* 기능 단위 토글 시스템
* 저장소: DB 또는 Redis
* 런타임 변경 가능(서버 재시작 불필요)
* 사용 예:

  * API 차단
  * 특정 사용자/롤 대상 기능 활성화

## F) 커넥션/타임아웃/리트라이 표준화

* PostgreSQL:

  * pool size, idle timeout, connection timeout 명시
* Redis:

  * reconnect 전략, max retries, backoff
* Queue:

  * 실패 재시도 횟수, DLQ 전략
* 공통 설정 모듈로 일원화

## G) 보안 기본값

* Helmet 기본 보안 헤더 활성화
* Rate limiting (IP/사용자 기준)
* 입력 검증: DTO + ValidationPipe (whitelist, forbidNonWhitelisted)
* 민감정보 마스킹:

  * password, token, authorization, personal data
  * 로그/에러 응답 공통 적용

---

# 산출물(필수)

1. 디렉터리 구조 제안
2. 각 모듈(인증/유저/헬스/메트릭스/파일/소켓/큐 등) 최소 구현
3. `docker-compose.yml` (postgres, redis, (선택) queue broker)
4. `.env.example` + 환경변수 스키마 검증 코드
5. Swagger 설정 및 보안 적용
6. 공통 응답/에러코드/예외필터/인터셉터/가드/데코레이터
7. CI/CD 워크플로우 파일
8. README: 로컬 실행, 테스트, 배포, 마이그레이션, 운영 가이드

---

# 구현 가이드(제약)

* **코드는 실행 가능한 수준**으로 작성한다(빌드/런 성공).
* 가능한 한 **의존성 최소화**.
* 모든 보안 관련 기본값은 안전한 방향(secure by default).
* 예시 엔드포인트는 최소 3개 제공:

  * `POST /v1/auth/login`
  * `GET /v1/users/me`
  * `GET /health`, `GET /metrics`

---

# 체크리스트(완료 기준)

* [x] `pnpm i` 후 `pnpm start:dev` 정상 구동
* [ ] docker-compose로 postgres/redis 기동
* [ ] 마이그레이션/시드 수행 가능
* [ ] 인증/인가/예외/응답 포맷 동작
* [ ] 캐싱/큐/스케줄/웹소켓/파일업로드 샘플 동작
* [ ] `/health`에서 DB/Redis/Queue 상태 확인
* [ ] `/metrics`에서 Prometheus 지표 노출
* [ ] CI 워크플로우 lint/test/build 통과

---

# 출력 형식 요구

* 최종 결과는 **코드 변경사항/파일 목록** 중심으로 제시한다.
* 각 파일은 경로와 함께 제시한다.
* 실행 명령어를 마지막에 정리한다.
