# 세션 관리 가이드

## 개요
껀덕지 프로젝트는 멀티 디바이스/브라우저 환경에서 안정적인 세션 관리를 위해 다음과 같은 기능을 제공합니다.

## 주요 기능

### 1. 로그인 시 자동 세션 정리
로그인할 때 기존 세션을 완전히 정리하고 새로운 세션으로 시작합니다.

```typescript
// src/lib/auth.ts
await signIn(email, password);
// ✅ 기존 세션 완전 정리
// ✅ 새로운 세션 생성
// ✅ 사용자 정보 캐싱
```

### 2. 로그아웃 시 완전한 정리
로그아웃 시 모든 스토리지를 완전히 정리합니다.

```typescript
await signOut();
// ✅ Supabase 로그아웃
// ✅ localStorage 정리
// ✅ sessionStorage 정리
// ✅ IndexedDB 정리
// ✅ 쿠키 정리
```

### 3. 멀티 탭/브라우저 동기화
한 탭에서 로그아웃하면 다른 모든 탭도 자동으로 로그아웃됩니다.

```typescript
// AuthContext에서 자동으로 처리
// storage 이벤트 리스닝으로 구현
```

### 4. 페이지 포커스 시 세션 재검증
탭을 전환한 후 돌아오면 자동으로 세션을 재검증합니다.

```typescript
// visibilitychange 이벤트로 자동 처리
// 세션 충돌 감지 시 자동 로그아웃
```

## 사용 방법

### 기본 인증 플로우

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginPage() {
  const { signIn, signOut } = useAuth();

  // 로그인
  await signIn('user@example.com', 'password');
  // ✅ 자동으로 세션 정리 및 새 세션 생성

  // 로그아웃
  await signOut();
  // ✅ 완전한 세션 정리
}
```

### 세션 검증 (선택적)

```typescript
import { validateSession, healthCheckSession } from '@/lib/session-manager';

// 간단한 세션 유효성 검증
const isValid = await validateSession();

// 종합적인 세션 건강 체크
const { healthy, message } = await healthCheckSession();
if (!healthy) {
  console.log(message);
  // 재로그인 필요
}
```

### 세션 디버깅 (개발 환경)

```typescript
import { debugSession } from '@/lib/session-manager';

// 개발 환경에서만 동작
await debugSession();
// 콘솔에 상세한 세션 정보 출력
```

## 세션 충돌 해결

### 문제: 여러 디바이스에서 로그인 후 세션 충돌

**해결 방법:**
1. 로그인할 때마다 기존 세션이 자동으로 정리됩니다
2. `scope: "global"` 옵션으로 모든 디바이스에서 이전 세션을 무효화합니다

### 문제: 탭을 여러 개 열었을 때 로그아웃 동기화

**해결 방법:**
1. `storage` 이벤트 리스너가 자동으로 다른 탭의 로그아웃을 감지합니다
2. 감지되면 현재 탭도 자동으로 로그아웃됩니다

### 문제: 시크릿 모드와 일반 모드 간 세션 충돌

**해결 방법:**
1. 각 브라우저 컨텍스트는 독립적인 스토리지를 가집니다
2. 로그인 시 해당 컨텍스트의 세션만 정리하고 새로 생성합니다

## 스토리지 정리 범위

### localStorage
- `auth_user` - 캐시된 사용자 정보
- `user-store` - Zustand 사용자 스토어
- `kkondeokji-auth-token` - Supabase 인증 토큰
- `sb-*-auth-token` - Supabase 프로젝트별 토큰
- 모든 `supabase`, `sb-`, `auth` 관련 키

### sessionStorage
- 전체 정리

### Cookies
- `sb-access-token`
- `sb-refresh-token`
- `supabase-auth-token`

### IndexedDB
- Supabase 관련 데이터베이스

## 보안 고려사항

### PKCE 플로우 사용
```typescript
// src/lib/supabase.ts
flowType: "pkce" // PKCE 플로우로 보안 강화
```

### 토큰 자동 갱신
```typescript
autoRefreshToken: true // 토큰 만료 전 자동 갱신
```

### 세션 만료 처리
- 만료된 세션은 자동으로 감지되어 로그인 페이지로 리디렉션됩니다

## 트러블슈팅

### 로그인 후 즉시 로그아웃되는 경우
1. 브라우저 개발자 도구 콘솔 확인
2. `debugSession()` 실행하여 세션 상태 확인
3. localStorage가 비활성화되어 있지 않은지 확인

### 다른 탭에서 로그인 상태가 유지되지 않는 경우
1. localStorage 공유가 정상적으로 작동하는지 확인
2. 같은 도메인/포트를 사용하는지 확인
3. 시크릿 모드는 별도의 스토리지를 사용함을 인지

### Supabase RLS 권한 오류
1. Supabase 대시보드에서 RLS 정책 확인
2. 중복된 permissive 정책이 있는지 확인
3. 성능 문제가 있다면 정책 통합 고려

## 참고 파일

- `src/lib/supabase.ts` - Supabase 클라이언트 설정
- `src/lib/auth.ts` - 인증 함수 (로그인, 로그아웃, 회원가입)
- `src/contexts/AuthContext.tsx` - 인증 컨텍스트 및 상태 관리
- `src/lib/session-manager.ts` - 세션 관리 유틸리티
- `src/shared/store/userStore.ts` - 사용자 상태 스토어

## 업데이트 로그

### 2025-10-09
- ✅ 로그인/회원가입 시 자동 세션 정리 추가
- ✅ 강화된 스토리지 정리 함수 구현
- ✅ 멀티 탭 세션 동기화 추가
- ✅ 페이지 포커스 시 세션 재검증 추가
- ✅ PKCE 플로우 적용
- ✅ IndexedDB 정리 로직 추가
- ✅ 세션 관리 유틸리티 생성

