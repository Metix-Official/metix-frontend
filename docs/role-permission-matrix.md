# METIX — Role & Access Control Matrix Documentation

Document Version: 1.0.0  
Last Updated: 2026-09-01  
Source of Truth: Laravel Backend API (`d:\metix-api`)

---

## 1. Overview

Metix implements a strict Role-Based Access Control (RBAC) architecture where **Laravel Backend serves as the single source of truth**. The Next.js frontend enforces UX route protection, navigation visibility, and permission guards.

### Defined Roles

| Role Key | Name | Description |
| :--- | :--- | :--- |
| `OWNER` | Platform Super Admin | Full access to platform management, user management, withdrawal approvals, platform audit logs, and global analytics. |
| `EO` | Event Organizer | Access to organizer dashboard, event CRUD, ticket types & quotas, offline POS sales, scanner management, wristband printing, and sales reports. |
| `BUYER` | Pembeli Tiket (Customer) | Access to event browsing, ticket reservations, checkout, order history, ticket management, ticket transfers, and profile settings. |
| `SCANNER` | Staff Scanner | Access restricted exclusively to assigned event QR check-in scanning and check-in history. |

---

## 2. Feature & Route Access Matrix

| Feature / Area | Frontend Route | Backend Endpoint Scope | OWNER | EO | BUYER | SCANNER |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Public Portal** | `/`, `/events/*` | `/v1/public/events` | ✅ | ✅ | ✅ | ✅ |
| **Owner Dashboard** | `/dashboard` (Owner view) | `/v1/owner/dashboard` | ✅ | ❌ | ❌ | ❌ |
| **User & Account Management** | `/dashboard/users` | `/v1/owner/organizers/*` | ✅ | ❌ | ❌ | ❌ |
| **Withdrawal Approvals** | `/dashboard/withdrawals` | `/v1/owner/organizers/{profile}/approve` | ✅ | ❌ | ❌ | ❌ |
| **EO Dashboard** | `/dashboard` (EO view) | `/v1/organizer/dashboard` | ❌ | ✅ | ❌ | ❌ |
| **My Events Management** | `/dashboard/events` | `/v1/organizer/events/*` | ❌ | ✅ | ❌ | ❌ |
| **Ticket & Quota Config** | `/dashboard/tickets` | `/v1/organizer/events/{event}/ticket-types` | ❌ | ✅ | ❌ | ❌ |
| **Offline POS Cashier** | `/dashboard/pos` | `/v1/organizer/events/*` | ❌ | ✅ | ❌ | ❌ |
| **Scanner Staff Management** | `/dashboard/admins` | `/v1/organizer/team` | ❌ | ✅ | ❌ | ❌ |
| **Wristband Printing** | `/dashboard/wristbands` | `/v1/organizer/events/*` | ❌ | ✅ | ❌ | ❌ |
| **EO Sales Reports** | `/dashboard/reports` | `/v1/organizer/dashboard` | ❌ | ✅ | ❌ | ❌ |
| **Buyer Dashboard** | `/dashboard` (Buyer view) | `/v1/buyer/dashboard` | ❌ | ❌ | ✅ | ❌ |
| **My Orders & Tickets** | `/dashboard/tickets`, `/dashboard/transfers` | `/v1/orders`, `/v1/tickets` | ❌ | ❌ | ✅ | ❌ |
| **Scanner Dashboard** | `/dashboard/checkin` | `/v1/scanner/dashboard` | ❌ | ❌ | ❌ | ✅ |
| **QR Check-In Scanner** | `/dashboard/checkin` | `/v1/scanner/events/{event}/scan` | ❌ | ❌ | ❌ | ✅ |
| **Profile & Settings** | `/dashboard/profile`, `/dashboard/settings` | `/v1/auth/me` | ✅ | ✅ | ✅ | ✅ |

---

## 3. Security & Access Control Flow

```text
               HTTP Request from Frontend
                           │
                           ▼
                  Laravel Sanctum Auth
                           │
             ┌─────────────┴─────────────┐
             │                           │
     Token Invalid (401)        Token Valid (200)
             │                           │
             ▼                           ▼
     Redirect to Login           RoleMiddleware Check
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                 Role Mismatch (403)             Role Authorized (200)
                         │                               │
                         ▼                               ▼
               Access Denied Screen             Serve API Data
```

---

## 4. Error Handling Protocol

- **HTTP 401 Unauthorized**: Clears `metix_token` and `metix_user` from `localStorage` and redirects user to `/login` / public homepage.
- **HTTP 403 Forbidden**: Displays the centralized `403 Access Denied` UI in `DashboardLayout.tsx` without logging out the user or clearing session state.
