# Firebase Spark 무료 배포 가이드

## 결론과 권장 구조

현재 킵장부는 **MySQL + Node/tRPC 서버 + Manus OAuth** 구조이므로, Firebase Hosting에 그대로 올리면 화면 파일만 배포되고 장부 API와 로그인은 동작하지 않습니다. Firebase의 무료 Spark 플랜에서 비용 없이 운영하려면 서버를 유지하지 않는 구조로 바꿔야 합니다. 즉, **Firebase Hosting + Firebase Authentication + Cloud Firestore** 조합으로 전환하는 방식을 권장합니다.

| 현재 구성 | Firebase 전환 대상 | 전환 이유 |
|---|---|---|
| React 클라이언트 | Firebase Hosting | Vite 결과물인 정적 웹 파일을 CDN으로 배포합니다. |
| Manus OAuth | Firebase Authentication | 이메일/비밀번호 또는 Google 로그인으로 직원 접근을 제한합니다. |
| MySQL + Drizzle | Cloud Firestore | 킵 항목·직원·반출 이력을 브라우저에서 안전 규칙과 함께 저장합니다. |
| Express/tRPC 서버 | 제거 | Spark 플랜은 Cloud Functions를 사용할 수 없으므로, 이 앱의 단순 CRUD는 Firestore SDK로 대체합니다. |

Firebase Spark 플랜은 결제 수단 없이 시작할 수 있으며, 대부분의 Authentication 옵션과 Hosting·Cloud Firestore의 무료 할당량을 제공합니다. Cloud Firestore의 무료 일일 기준은 읽기 50,000회, 쓰기 20,000회, 삭제 20,000회이며 저장 공간은 1 GiB입니다. 이 규모는 소수 직원이 사용하는 단일 매장 킵장부의 초기 운영에 적합합니다. 반면 무료 할당량을 초과한 해당 서비스는 다음 달까지 중단될 수 있으므로, 목록 화면에서 무제한 실시간 구독이나 불필요한 재조회는 피해야 합니다.[1][2]

> **중요:** Firebase App Hosting, Cloud Functions, Cloud Run은 Spark 무료 운영의 기본 경로가 아닙니다. 이 킵장부는 정적 Hosting과 브라우저 Firebase SDK만 사용하도록 전환해야 결제 계정 없이 운영하기 쉽습니다.[1]

## Firebase 콘솔에서 먼저 만들 항목

Firebase Console에서 새 프로젝트를 만들고 **Spark** 플랜을 유지합니다. 이후 Web App을 등록해 Firebase 구성 객체를 발급받고, Authentication에서 `이메일/비밀번호`를 활성화합니다. Google 로그인을 쓸 경우 Google 제공업체도 활성화합니다. Hosting과 Firestore Database는 모두 같은 Firebase 프로젝트에서 생성합니다. Hosting 배포 후 `PROJECT_ID.web.app` 및 `PROJECT_ID.firebaseapp.com` 도메인이 제공됩니다.[2][4]

| 콘솔 메뉴 | 생성·설정할 항목 | 이 앱에서의 용도 |
|---|---|---|
| Project settings → Your apps | Web App | 브라우저 Firebase SDK 구성 값 확보 |
| Authentication → Sign-in method | Email/Password | 매장 직원 로그인 |
| Firestore Database | Native mode 데이터베이스 1개 | 직원·킵 항목·반출 이력 저장 |
| Hosting | 사이트 초기화 | 정적 Vite 빌드 결과 배포 |

## Firestore 데이터 모델

Firestore는 관계형 테이블 대신 컬렉션과 문서를 사용합니다. 반출 이력은 킵 항목의 하위 컬렉션으로 두면, 특정 병의 반출 내역을 효율적으로 읽을 수 있습니다.

| 경로 | 주요 필드 | 사용 목적 |
|---|---|---|
| `employees/{employeeId}` | `name`, `isActive`, `createdAt`, `updatedAt` | 작성자·반출 담당자 선택 목록 |
| `keepEntries/{entryId}` | `keptOn`, `liquorName`, `liquorNameLower`, `remainingPercent`, `authorEmployeeId`, `authorName`, `createdAt`, `updatedAt` | 킵 장부 목록과 필터 |
| `keepEntries/{entryId}/withdrawals/{withdrawalId}` | `customerName`, `employeeId`, `employeeName`, `withdrawnAt` | 킵 항목별 반출 이력 |

`keptOn`은 현재 형식과 동일하게 `YYYY-MM-DD` 문자열로 저장합니다. `liquorNameLower`는 소문자 검색을 위한 보조 필드입니다. Firestore는 임의 문자열의 포함 검색을 제공하지 않으므로, 초기 버전에서는 불러온 장부 항목에 대해 클라이언트에서 주종 검색을 적용하고, 항목 수가 커질 때만 별도 검색 서비스 또는 접두어 토큰 모델을 검토합니다.

## Firebase CLI 설치와 초기화

로컬 또는 Claude Code 터미널에서 아래 순서로 실행합니다. Firebase CLI 초기화는 `firebase.json`과 `.firebaserc`를 만듭니다.[2]

```bash
git clone https://github.com/jhyun860-source/keep-ledger.git
cd keep-ledger
corepack enable
pnpm install --frozen-lockfile

npm install -g firebase-tools
firebase login
firebase init firestore
firebase init hosting
```

초기화 과정에서는 만든 Firebase 프로젝트를 선택하고, Hosting의 공개 디렉터리를 **`dist/public`**으로 지정합니다. 이 프로젝트는 Wouter 기반 단일 페이지 앱이므로 SPA rewrite를 사용합니다. 제공된 Hosting·Firestore 설정 템플릿과 프로젝트 별칭 템플릿을 루트로 복사한 뒤, `.firebaserc`의 `YOUR_FIREBASE_PROJECT_ID`를 실제 Firebase 프로젝트 ID로 바꿉니다.

```bash
cp firebase/firebase.json.template firebase.json
cp firebase/.firebaserc.template .firebaserc
# .firebaserc의 YOUR_FIREBASE_PROJECT_ID를 실제 ID로 교체
pnpm run build
firebase deploy --only hosting,firestore
```

## 클라이언트 Firebase 설정값

Firebase Web App 구성 객체의 값은 브라우저 앱 구성 식별자이며, 서비스 계정 비밀키가 아닙니다. 그래도 팀 운영 방식에 맞춰 Vite 환경 변수로 관리하고, 서비스 계정 JSON이나 실제 비밀번호는 절대로 Git에 올리지 않습니다.

| Vite 환경 변수 | Firebase Console의 대응 값 |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Claude Code가 구현할 초기화 파일은 `client/src/lib/firebase.ts`입니다. 이 파일에서 `initializeApp`, `getAuth`, `getFirestore`를 한 번만 초기화하고 내보냅니다. 로그인 화면은 `signInWithEmailAndPassword`, 현재 사용자 관찰은 `onAuthStateChanged`, 로그아웃은 `signOut`으로 대체합니다.[4]

## 보안 규칙과 인덱스

`firebase/firestore.rules`와 `firebase/firestore.indexes.json` 템플릿을 함께 제공합니다. 모든 읽기·쓰기 요청에 Firebase Authentication 로그인을 요구하며, 잔량은 0~100 정수로 제한합니다. 규칙은 서버 권한의 대체물이므로, 테스트 모드의 공개 규칙을 운영에 사용하면 안 됩니다. Firestore Security Rules는 문서 경로와 조건을 조합해 접근을 제어합니다.[5]

기본 템플릿은 현재 앱과 같이 로그인한 모든 매장 직원이 직원 목록을 관리하는 운영 모델입니다. 직원별 관리자 권한을 나누려면 후속 단계에서 `users/{uid}` 역할 문서 또는 Firebase custom claims를 추가해야 합니다.

## 기존 데이터 이관

현재 앱에 실사용 데이터가 없으면 이관은 필요하지 않습니다. 데이터가 있다면 MySQL을 바로 Firestore에 연결하지 말고, **한 번만 실행하는 로컬 이관 스크립트**로 옮깁니다.

1. 기존 데이터베이스를 백업하고 `employees`, `keepEntries`, `withdrawals`를 CSV 또는 JSON으로 내보냅니다.
2. Firebase Console에서 Firestore를 만든 뒤, 로컬에서만 Google 서비스 계정 또는 Firebase Admin 자격 증명을 설정합니다.
3. 직원 문서를 먼저 만들고, 기존 숫자 ID와 새 Firestore 문서 ID의 매핑을 보관합니다.
4. 킵 항목 문서를 만든 뒤, 각 `withdrawals` 레코드를 해당 킵 항목의 하위 컬렉션에 배치합니다.
5. 앱에서 직원 목록·킵 목록·반출 이력 수량을 대조한 뒤 기존 데이터베이스를 읽기 전용으로 보관합니다.

Firebase Admin 서비스 계정 JSON은 절대로 웹 브라우저, 저장소, Firebase Hosting에 넣지 않습니다.

## Claude Code 실행 지시

`FIREBASE_CLAUDE_PROMPT.md` 내용을 새 작업에 그대로 제공하세요. 이 문서는 UI를 유지한 채 Firebase SDK로 교체할 파일, 제거할 서버 의존성, 검증 항목을 구체적으로 지시합니다.

## 참고 문서

[1]: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans "Firebase pricing plans"
[2]: https://firebase.google.com/docs/hosting/quickstart "Get started with Firebase Hosting"
[3]: https://firebase.google.com/docs/firestore/quotas "Cloud Firestore usage and limits"
[4]: https://firebase.google.com/docs/auth/web/start "Get started with Firebase Authentication on Websites"
[5]: https://firebase.google.com/docs/firestore/security/get-started "Get started with Cloud Firestore Security Rules"
