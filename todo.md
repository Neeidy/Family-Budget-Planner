# Viyana Budget Planner - TODO

## Restored from ZIP (original project)

- [x] Project scaffolded with web-db-user template
- [x] Database tables created: users, budgetData, familyBudget
- [x] drizzle/schema.ts with all tables (users, budgetData, familyBudget)
- [x] server/db.ts with all query helpers
- [x] server/routers.ts with familyBudget tRPC procedures (no auth required)
- [x] All client pages copied: Home, Incomes, Expenses, Debts, Savings, AnnualPayments, Analytics, BudgetLimits, GoalPlanning, MonthArchive, PaymentTracking, Installments, Settings, MyBudget, SpouseBudget
- [x] DashboardLayout with sidebar navigation
- [x] BudgetContext with full CRUD operations
- [x] PersonContext for person selection (Yiğit/Arzu)
- [x] useCloudSync hook for real-time sync via familyBudget tRPC
- [x] useMonthlyArchive hook for month archive
- [x] useBudgetData hook with all data types
- [x] ThemeContext with dark/light toggle
- [x] GlobalSearch component
- [x] MobileBottomNav component
- [x] PorsukCat mascot component
- [x] PersonSelectScreen onboarding
- [x] All shadcn/ui components present
- [x] Recharts used for analytics charts
- [x] index.html updated with Turkish title and PWA meta tags
- [x] storageProxy.ts TypeScript error fixed

## Pending

- [x] Write vitest tests for familyBudget router procedures (6 tests passing)
- [x] Verify all pages render without errors in browser (Home, Analytics, Installments, Settings confirmed)

## Dalga 1 — Aile Şifresi Auth

- [x] bcryptjs ve @types/bcryptjs bağımlılıklarını ekle
- [x] server/auth/familyAuth.ts oluştur (verifyPassword, signFamilySession, verifyFamilySession)
- [x] server/_core/env.ts'e familyPasswordHash ve familyCookieSecret ekle
- [x] server/_core/index.ts'e bootstrap validation ekle (ENV eksikse exit 1)
- [x] server/familyAuthRouter.ts oluştur (login, logout, me)
- [x] server/_core/context.ts'e family context ekle
- [x] server/_core/trpc.ts'e requireFamily middleware ve familyProtectedProcedure ekle
- [x] server/routers.ts'te familyBudget prosedürlerini familyProtectedProcedure'e geçir
- [x] client/src/pages/Login.tsx oluştur
- [x] client/src/App.tsx'te auth gate ekle
- [x] client/src/contexts/PersonContext.tsx'i familyAuth.me'ye bağla
- [x] client/src/components/DashboardLayout.tsx'te logout güncelle
- [x] scripts/hash-family-password.ts oluştur
- [x] server/familyAuth.test.ts oluştur ve testleri geçir (14 test geçiyor)
- [x] FAMILY_PASSWORD_HASH ve FAMILY_COOKIE_SECRET secrets ekle

## Şifreyi Değiştir Özelliği

- [x] server/familyAuthRouter.ts'e changePassword tRPC procedure ekle (mevcut şifre doğrulama + yeni hash kaydetme)
- [x] Ayarlar sayfasına Şifreyi Değiştir bölümü ekle (mevcut şifre, yeni şifre, onay alanları)
- [x] server/familyAuth.changePassword.test.ts yaz (4 test - toplam 26 test geçiyor)

## Dalga 2 — Veri Bütünlüğü + DoS Koruması

- [x] helmet ve express-rate-limit bağımlılıklarını ekle
- [x] server/_core/index.ts: trust proxy, helmet, body limit 200kb, trpcLimiter, loginLimiter
- [x] server/routers.ts: jsonArrayString helper + tüm save alanlarını doğrula
- [x] server/routers.ts: familyBudget.save'e expectedUpdatedAt input ekle + CONFLICT hatası
- [x] server/db.ts: saveFamilyBudget optimistic locking desteği
- [x] client/src/hooks/useCloudSync.ts: expectedUpdatedAt state + conflict toast + invalidate
- [x] server/familyBudget.test.ts: 5 yeni test (geçersiz JSON, 100KB+, conflict, ok, ilk save) — toplam 32 test geçiyor

## Dalga 3 — Yedek Geçmişi (History Snapshot)

- [x] drizzle/schema.ts: familyBudgetHistory tablosu ekle
- [x] Migration SQL oluştur ve çalıştır
- [x] server/db.ts: saveSnapshot, listFamilyBudgetHistory, getFamilyBudgetSnapshot fonksiyonları
- [x] server/db.ts: saveFamilyBudget'a savedBy parametresi ekle
- [x] server/routers.ts: history sub-router (list, get, restore)
- [x] server/routers.ts: familyBudget.save'e savedBy geçirme
- [x] client/src/pages/Settings.tsx: Yedek Geçmişi section (liste, görüntüle modal, geri yükle confirm)
- [x] server/familyBudgetHistory.test.ts: 5 test (kayıt artışı, 30 limit, restore, farklı familyId null, CONFLICT)
- [x] pnpm test yeşil — 37 test geçiyor (4 test dosyası)
