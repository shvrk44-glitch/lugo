# Revised Implementation Plan - Kano Mobil Operations Dashboard (Clean Enterprise SaaS)

## 0. Intake & Scope Confirmation
- **Visual Direction**: Clean Enterprise SaaS (Corporate Navy `#0f172a`, Slate Blue `#1e293b`, Crisp White `#ffffff`, Accent Blue `#2563eb`, Success `#059669`, Warning `#d97706`, Error `#dc2626` — strictly avoiding dark-gold/black palettes).
- **Module List**:
  1. Overview Dashboard (Live metrics, sales, gross margin, cash collected, receivables aging, credit exposure ratio).
  2. Accounts Management (Customer records, Fleet/Workshop/Reseller segments, credit limits, account detail modal).
  3. Orders & Invoices (Order creation, item lines, price list lookup, price overrides with reason, credit check, PDF invoice download).
  4. Payments & Receivables (Payment recording, cash/transfer/POS, reference verification, invoice allocation, DSO).
  5. Stock & Batch Traceability (Depot inventory by product/pack size, goods received with supplier batch numbers, reorder thresholds).
  6. Deliveries & Dispatch (Kano area grouping, delivery status, receiver name or failure reason).
  7. System Alerts & Friday Summary (Automated flags for credit limits, overdue invoices >30 days, quiet accounts, low stock, Friday WhatsApp summary generator).
  8. Reports & P&L (CSV export for all tables, PDF reports, monthly P&L manual entry & tracking).
- **Data Sources**:
  - Centralized Fixtures File: `/src/fixtures/kanoMobilFixtures.ts` labeled clearly with `[MOCK FIXTURE]`.
  - Data Layer / Store: `/src/data/store.ts` handling CRUD operations and `localStorage` persistence so swapping to a real backend is a single change.
  - 4-State Components: Every data-bearing module implements Loading (skeleton), Empty (informative guide), Error (retry action), and Populated states with interactive demo state toggles.

## 1. Component Tree & Architecture
- `App`
  - `Header` (Navigation, Role Switcher [CEO, Sales Lead, Depot/Dispatch, Finance, Viewer], Offline Toggle)
  - `OfflineSyncBanner` (Sync queue status)
  - Active Tab View (`OverviewDashboard`, `AccountsView`, `OrdersView`, `PaymentsView`, `StockView`, `DeliveriesView`, `AlertsView`, `ReportsView`)

## 2. Verification & Testing Plan
- 4-state simulation toggles for all data components.
- Zero banned strings (TODO, lorem, placeholder, #, any, console.log, hardcoded hex).
- Build compilation and TypeScript type check (`compile_applet`, `lint_applet`).
