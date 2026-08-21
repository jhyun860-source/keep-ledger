# Claude Code용 Firebase 전환 프롬프트

아래 지시를 Claude Code의 새 작업에 전달하세요.

```text
이 저장소는 VELLUM Keep Ledger 바 운영 앱이다. 먼저 AGENTS.md와 FIREBASE_SETUP.md를 읽어라.

목표는 Firebase Spark 무료 플랜에서 서버리스로 실행되는 React 앱으로 전환하는 것이다. 현재의 premium VELLUM UI와 모든 사용자 흐름(직원 목록 관리, 킵 항목 등록·필터, 반출 기록·이력)을 유지한다.

반드시 다음을 수행한다.
1. 새 브랜치 firebase-migration에서 작업한다.
2. firebase JavaScript SDK를 추가하고 client/src/lib/firebase.ts에서 Firebase App, Authentication, Firestore를 초기화한다. VITE_FIREBASE_* 환경 변수를 사용한다.
3. Manus OAuth 의존성, useAuth 기반 로그인, tRPC/Express CRUD 호출을 Firebase Authentication과 Firestore SDK 호출로 교체한다.
4. employees, keepEntries, keepEntries/{id}/withdrawals 컬렉션 구조를 FIREBASE_SETUP.md와 동일하게 구현한다.
5. 남은 술 잔량은 0~100 정수로 검증하고, 반출 시 손님명과 담당 직원을 모두 필수로 한다.
6. 직원 선택은 활성 직원 목록에서만 하도록 유지하고, 제거는 isActive=false로 처리한다.
7. 날짜·작성자 필터는 Firestore 쿼리로 처리하고, 주종 포함 검색은 초기에는 불러온 결과에서 클라이언트 필터로 처리한다. 요청이 늘면 Firestore 읽기 수를 고려해 페이지 크기를 제한한다.
8. firebase/firestore.rules와 firebase/firestore.indexes.json을 적용한다. 테스트 모드의 공개 규칙을 사용하지 않는다.
9. Firebase Hosting용 dist/public SPA 빌드와 firebase.json을 구성한다. Cloud Functions, App Hosting, Cloud Run은 사용하지 않는다.
10. Firestore/Auth Emulator로 로그인·직원 추가·킵 등록·반출 기록을 확인하고, pnpm run verify를 통과시킨다.

완료 시 변경 파일 목록, Firebase Console에서 사용자가 직접 넣어야 하는 VITE_FIREBASE_* 구성 값 목록, 실행한 검증 명령, firebase deploy --only hosting,firestore 명령을 보고한다. 실제 Firebase 프로젝트 ID, 사용자 비밀번호, 서비스 계정 키를 코드나 저장소에 쓰지 않는다.
```
