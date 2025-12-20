# Complete User Flow: Registration to All Features

**Document Version:** 1.0  
**Based on PRD:** v3.0  
**Date:** December 6, 2025

---

## 🎯 Overview

This document outlines the complete user journey from initial registration through all available features in the Finance Journey Map application. The flow is designed to be intuitive, progressive, and engaging for Gen Z users.

---

## 📋 Table of Contents

1. [Phase 1: Authentication & Onboarding](#phase-1-authentication--onboarding)
2. [Phase 2: Initial Dashboard Experience](#phase-2-initial-dashboard-experience)
3. [Phase 3: Core Features](#phase-3-core-features)
4. [Phase 4: Advanced Features](#phase-4-advanced-features)
5. [Phase 5: Ongoing Engagement](#phase-5-ongoing-engagement)
6. [Feature Access Matrix](#feature-access-matrix)

---

## Phase 1: Authentication & Onboarding

### Step 1.1: Registration

**Entry Point:** Landing Page → "Sign Up" button

**User Actions:**

1. User clicks "Sign Up" or "Get Started"
2. Redirected to `/register` page
3. Fills registration form:
   - Email address
   - Password (with strength indicator)
   - Confirm password
4. Submits form

**System Actions:**

- Validates email format
- Validates password strength
- Checks if email already exists
- Creates user account in `Users` table
- Generates JWT token
- Sets up default categories (5 income + 10 expense categories)

**Success State:**

- User receives success message
- JWT token stored in secure cookie/localStorage
- Redirected to onboarding flow

**Error States:**

- "Email already exists" → Prompt to login
- "Weak password" → Show password requirements
- Network error → Retry option

---

### Step 1.2: Financial Profile Onboarding

**Entry Point:** Post-registration redirect

**User Actions:**

1. Presented with welcome screen: "Let's set up your financial profile!"
2. Fills onboarding form (Feature Module A):
   - **Monthly Income** (required)
     - Input: Numeric field with currency selector
     - Validation: Must be > 0, max 999,999,999
   - **Current Savings** (required)
     - Input: Numeric field
     - Validation: Must be ≥ 0
   - **Primary Goal** (required)
     - Input: Select card/radio buttons
     - Options: Emergency Fund, Gadget, Travel, Investing
   - **Risk Profile** (required)
     - Input: Select or 3-question quiz
     - Options: Conservative, Moderate, Aggressive
3. Clicks "Complete Profile"

**System Actions:**

- Validates all inputs
- Calculates `user_archetype` based on savings percentage:
  - Savings < 10% of income → **"The Starter"**
  - Savings 10-30% → **"The Builder"**
  - Savings > 30% → **"The Master"**
- Creates `Financial_Profile` record
- Awards Quest Q_001: "First Steps" (100 Coins)
- Initializes empty `Goals` table entry (if goal selected)
- Sets up default transaction categories

**Success State:**

- Archetype badge displayed: "You're a Starter! 🚀"
- Quest completion animation
- Redirected to Dashboard

**Skip Option:**

- "Skip for now" → Can complete later from Settings

---

## Phase 2: Initial Dashboard Experience

### Step 2.1: First Dashboard View

**Entry Point:** Post-onboarding redirect

**User Sees:**

- Welcome message: "👋 Welcome back, [Name]!"
- **Empty State Dashboard** (no transactions yet):
  - Summary Cards (all showing ₹0):
    - Current Balance: ₹0
    - This Month Income: ₹0
    - This Month Expenses: ₹0
    - Savings Rate: N/A
  - Financial Health Score: 50/100 (base score)
  - Empty chart placeholders with helpful messages:
    - "Start tracking to see your income vs expenses"
    - "Add transactions to see spending breakdown"
  - Quick Insight: "Add your first transaction to get started!"
  - Recent Transactions: "No transactions yet. Tap + to add your first one!"
  - Floating Action Button (FAB): **"+ Add Transaction"**

**User Actions:**

- Can explore empty dashboard
- Can navigate to other sections (if accessible)
- Primary CTA: Add first transaction

---

## Phase 3: Core Features

### Step 3.1: Adding First Transaction

**Entry Point:** Dashboard FAB or "Add Transaction" button

**User Actions:**

1. Taps "+ Add Transaction" FAB
2. Transaction form appears (modal or new page):
   - **Type Toggle:** Income / Expense (default: Expense)
   - **Amount:** Numeric input with currency
   - **Category:** Dropdown with icons
     - If Income: Shows 5 income categories (Salary, Freelance, etc.)
     - If Expense: Shows 10 expense categories (Food, Transport, etc.)
   - **Description:** Optional text field
   - **Date:** Date picker (default: today)
   - **Recurring:** Toggle switch (optional)
     - If enabled: Shows frequency selector (daily/weekly/monthly/yearly)
3. Fills form and taps "Save"

**System Actions:**

- Validates amount > 0
- Validates category selection
- Validates date (not future, not > 1 year past)
- Creates transaction in `Transactions` table
- Updates dashboard summary cards in real-time
- Triggers toast notification: "Transaction added! ✓"
- Awards Quest Q_002 if first simulation run (optional)

**Success State:**

- Form closes
- Dashboard refreshes with new data
- Transaction appears in Recent Transactions widget
- Charts update (if data available)

**User Can:**

- Add another transaction immediately
- View transaction list
- Return to dashboard

---

### Step 3.2: Viewing Transaction List

**Entry Point:**

- Dashboard → "View All" link in Recent Transactions widget
- Navigation menu → "Transactions"

**User Sees:**

- Transaction list page with:
  - **Filter Bar:**
    - Date range picker
    - Type filter (All/Income/Expense)
    - Category dropdown
    - Amount range slider
    - Search bar (by description)
  - **Sort Options:** Date (default), Amount, Category
  - **Transaction Cards:**
    - Icon (category)
    - Description or category name
    - Amount (green for income, red for expense)
    - Date
    - Swipe left to reveal delete button

**User Actions:**

- Scroll to load more (infinite scroll, 20 per page)
- Tap transaction card → Edit form
- Swipe left → Delete with confirmation
- Use filters/search to find specific transactions
- Pull to refresh

**System Actions:**

- Loads transactions paginated (20 per page)
- Applies filters/search in real-time (< 300ms)
- Handles infinite scroll
- Soft deletes (marks `deleted_at` timestamp)

---

### Step 3.3: Editing/Deleting Transactions

**Edit Flow:**

1. User taps transaction card
2. Edit form opens (pre-filled)
3. User modifies fields
4. Taps "Save"
5. Transaction updated, dashboard refreshes

**Delete Flow:**

1. User swipes left on transaction
2. Delete button appears (with haptic feedback)
3. Confirmation dialog: "Delete this transaction?"
4. User confirms
5. Transaction soft-deleted (can restore within 30 days)

**Restore Flow:**

1. User navigates to deleted transactions (future feature)
2. Taps "Restore" on deleted transaction
3. Transaction restored, appears in list again

---

### Step 3.4: Dashboard with Data

**After Adding Transactions, User Sees:**

**Summary Cards (Top):**

- **Current Balance:** Calculated from all transactions
  - Green if positive, Red if negative
- **This Month Income:** Sum of income transactions this month
- **This Month Expenses:** Sum of expense transactions this month
- **Savings Rate:** `((Income - Expenses) / Income) * 100`
  - Color: Green (>20%), Yellow (10-20%), Red (<10%)

**Charts Section:**

1. **Income vs Expenses Chart** (Bar/Line)

   - Shows income (green) and expenses (red) over time
   - Time filters: Week, Month, 3 Months, 6 Months, Year, Custom
   - Interactive: Tap bar to see breakdown

2. **Expense Breakdown** (Donut Chart)

   - Top 5 categories + "Others"
   - Center shows total amount
   - Tap segment to see category details

3. **Spending Trend** (Area Chart)

   - Cumulative spending over current month
   - Daily breakdown on hover/tap
   - Reference line for budget (if set)

4. **Category Comparison** (Horizontal Bar)

   - All categories sorted by amount
   - Optional: Compare current vs previous month

5. **Financial Health Score** (Gauge)
   - 0-100 score displayed as radial gauge
   - Color zones: Red (0-40), Yellow (41-70), Green (71-100)
   - Calculation includes:
     - Savings rate
     - Goal progress
     - Overspend penalties
     - Streak bonuses

**Quick Insights Widget:**

- AI-generated tips:
  - "You spent 30% more on Food this week"
  - "Great job! You've saved ₹5,000 more than last month"
  - "Tip: Reducing Coffee spending by 20% could save you ₹2,400/year"

**Recent Transactions:**

- Last 5 transactions
- "View All" link

---

## Phase 4: Advanced Features

### Step 4.1: Financial Goal Tracker

**Entry Point:**

- Dashboard → "Set a Goal" button
- Navigation → "Goals"

**User Actions:**

1. Taps "Create Goal" or "Set Goal"
2. Goal creation form:
   - **Goal Name:** Text input (e.g., "New iPhone")
   - **Target Amount:** Numeric input
   - **Current Amount:** Pre-filled from `current_savings` or manual
   - **Deadline:** Date picker
   - **Monthly Contribution:** Calculated or manual input
3. Saves goal

**System Actions:**

- Creates goal in `Goals` table
- Calculates:
  - **Daily Safe-to-Spend:** `(Income - Fixed_Expenses - Goal_Contribution) / 30`
  - **Projected Completion Date:** `Current_Date + ((Goal_Amount - Current_Saved) / Monthly_Contribution)`
- Updates Journey Map (if goal is primary)

**User Sees:**

- Goal card showing:
  - Progress bar (current/target)
  - Days remaining
  - Monthly contribution needed
  - Projected completion date
- Warning if monthly contribution = 0: "Goal Unreachable"
- "Goal Achieved" button when current ≥ target

**Goal Updates:**

- User can manually update `current_amount` via "Add Progress" button
- System can auto-update from transactions (future enhancement)

---

### Step 4.2: Journey Map Visualizer

**Entry Point:**

- Dashboard → "View Journey Map" button
- Navigation → "Journey"

**User Sees:**

- Horizontal scrollable timeline
- **Start Point (T0):** Current date, value = `current_savings`
- **End Point (Tn):** Target date, value = `goal_target_amount`
- **3 Milestones:** Generated at 25%, 50%, 75% of goal
  - Formula: `Milestone_X = Goal_Amount * (X * 0.25)`
- Current position indicator
- Progress percentage

**User Actions:**

- Scroll horizontally to see full timeline
- Tap milestone to see details
- Tap "Update Progress" to manually add savings

**States:**

- **Empty:** "Start your journey by setting a goal."
- **Active:** Timeline with progress
- **Completed:** Confetti animation + "Level Up" modal

**Integration:**

- Updates automatically when:
  - Goal progress updated
  - Transactions added (if linked to goal)
  - Goal deadline changes

---

### Step 4.3: Decision Simulation (Time Machine)

**Entry Point:**

- Dashboard → "Try Simulation" button
- Navigation → "Time Machine"

**User Actions:**

1. Lands on simulation page
2. Sees list of expense categories with current spending (from transactions)
3. Selects a category (e.g., "Coffee & Drinks")
4. Sees slider for "Current Spend" (pre-filled from actual data)
5. Adjusts slider for "Proposed Spend"
6. Sees real-time updates (< 200ms latency):
   - **Delta:** `D = Current_Spend - Proposed_Spend`
   - **1 Year Impact:** `Impact_1Y = D * 12`
   - **Future Value (with 4% interest):** `Future_Value = Impact_1Y * (1 + 0.04)`
   - Visual chart showing projection

**System Actions:**

- Loads current spending from transactions (by category)
- Calculates projections client-side (instant feedback)
- Syncs to DB in background
- Shows warning if `Proposed_Spend > Income`: "Warning: You are entering debt."

**User Can:**

- Simulate multiple categories
- Compare scenarios
- Save favorite simulations (future enhancement)
- Export simulation results (future enhancement)

**Quest Integration:**

- Awards Quest Q_002: "Reality Check" (50 Coins) on first simulation run

---

## Phase 5: Ongoing Engagement

### Step 5.1: Gamification & Quests

**Entry Point:**

- Dashboard → "Quests" badge/icon
- Navigation → "Quests"

**User Sees:**

- Quest list with status:
  - **Active:** Available to complete
  - **Completed:** Shows reward earned
  - **Expired:** Past deadline

**Quest Types:**

**One-Time Quests:**

- Q_001: "First Steps" (Complete Profile) - 100 Coins ✅ (completed during onboarding)
- Q_002: "Reality Check" (Run one Simulation) - 50 Coins
- Q_003: "Goal Setter" (Create first goal) - 75 Coins
- Q_004: "Transaction Master" (Add 10 transactions) - 100 Coins

**Recurring Habits:**

- Daily Check-in:
  - User taps "Check-in" button
  - System checks: `last_check_in == yesterday?`
  - If yes: Increment `streak_count`
  - If no: Reset `streak_count = 1`
  - Reward: 10 Coins per check-in
  - Bonus: 50 Coins for 7-day streak

**Quest Rewards:**

- Coins displayed in header/navigation
- Can be used for:
  - Unlocking premium features (future)
  - Customization options (future)
  - Leaderboard ranking (future)

---

### Step 5.2: Daily Check-in Flow

**Entry Point:**

- Dashboard → "Check-in" button (prominent)
- Notification reminder (if enabled)

**User Actions:**

1. Taps "Check-in" button
2. Sees check-in animation
3. Streak counter updates
4. Reward notification: "You earned 10 Coins! 🔥"

**System Actions:**

- Records check-in timestamp
- Updates streak counter
- Awards coins
- Updates Financial Health Score (+5 for 7-day streak)

---

### Step 5.3: Recurring Transactions

**Entry Point:**

- Add Transaction form → "Recurring" toggle

**User Actions:**

1. When adding transaction, enables "Recurring" toggle
2. Selects frequency: Daily, Weekly, Monthly, Yearly
3. Optionally sets end date
4. Saves transaction

**System Actions:**

- Creates base transaction
- Creates entry in `Recurring_Transactions` table
- Schedules automatic creation of future transactions
- User can edit/delete recurring pattern anytime

**User Sees:**

- Recurring transactions marked with 🔄 icon
- Can view all recurring patterns in Settings
- Can pause/resume recurring transactions

---

## Feature Access Matrix

| Feature                     | Requires Onboarding? | Requires Transactions? | Requires Goal? | Notes                                     |
| --------------------------- | -------------------- | ---------------------- | -------------- | ----------------------------------------- |
| **Dashboard**               | ✅ Yes               | ❌ No                  | ❌ No          | Shows empty states if no data             |
| **Add Transaction**         | ✅ Yes               | ❌ No                  | ❌ No          | Available immediately after onboarding    |
| **Transaction List**        | ✅ Yes               | ❌ No                  | ❌ No          | Shows empty state if none                 |
| **Edit/Delete Transaction** | ✅ Yes               | ✅ Yes                 | ❌ No          | Only if transactions exist                |
| **Dashboard Charts**        | ✅ Yes               | ✅ Yes                 | ❌ No          | Requires transaction data                 |
| **Financial Health Score**  | ✅ Yes               | ❌ No                  | ❌ No          | Base score 50, improves with data         |
| **Goal Tracker**            | ✅ Yes               | ❌ No                  | ❌ No          | Can create goals anytime                  |
| **Journey Map**             | ✅ Yes               | ❌ No                  | ✅ Yes         | Requires active goal                      |
| **Time Machine Simulation** | ✅ Yes               | ✅ Yes (recommended)   | ❌ No          | Can use default values if no transactions |
| **Quests**                  | ✅ Yes               | ❌ No                  | ❌ No          | Some quests require specific actions      |
| **Daily Check-in**          | ✅ Yes               | ❌ No                  | ❌ No          | Available immediately                     |

---

## User Flow Diagram (Simplified)

```
┌─────────────┐
│  Landing    │
│    Page     │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐
│  Register   │─────▶│   Login     │
└──────┬──────┘      └──────┬──────┘
       │                    │
       └──────────┬──────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   Onboarding    │
         │ (Financial Profile)│
         └────────┬─────────┘
                  │
                  ▼
         ┌─────────────────┐
         │    Dashboard    │◀────┐
         │  (Empty State)   │     │
         └────────┬─────────┘     │
                  │               │
        ┌─────────┴─────────┐     │
        │                   │     │
        ▼                   ▼     │
┌───────────────┐   ┌──────────────┐
│ Add Transaction│   │  View Goals  │
└───────┬───────┘   └──────┬───────┘
        │                  │
        ▼                  ▼
┌───────────────┐   ┌──────────────┐
│Transaction List│   │ Journey Map │
└───────┬───────┘   └──────┬───────┘
        │                  │
        └─────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Dashboard      │
         │ (With Data)     │
         └────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌──────────────┐
│ Time Machine  │   │   Quests     │
│  Simulation   │   │  & Check-in  │
└───────────────┘   └──────────────┘
```

---

## Key User Journeys

### Journey 1: First-Time User (Complete Flow)

1. Register → Onboard → See Empty Dashboard → Add First Transaction → View Updated Dashboard → Explore Features

### Journey 2: Daily Active User

1. Login → Dashboard → Check-in → Review Charts → Add Transactions → View Goals Progress

### Journey 3: Goal-Focused User

1. Login → Dashboard → Create Goal → View Journey Map → Run Simulations → Track Progress

### Journey 4: Analytics-Focused User

1. Login → Dashboard → Review Charts → Filter Transactions → Analyze Spending → Adjust Budgets

---

## Navigation Structure

```
Main Navigation:
├── 🏠 Dashboard (Home)
├── 💰 Transactions
│   ├── All Transactions
│   ├── Add Transaction
│   └── Categories
├── 🎯 Goals
│   ├── My Goals
│   └── Journey Map
├── 🔮 Time Machine (Simulation)
├── 🏆 Quests
└── ⚙️ Settings
    ├── Profile
    ├── Financial Profile
    ├── Notifications
    └── About
```

---

## Empty States & Onboarding Hints

**Dashboard Empty State:**

- "Start tracking your finances! Add your first transaction."
- Shows example of what charts will look like
- Highlights FAB button

**Transaction List Empty State:**

- "No transactions yet. Tap + to add your first one!"
- Shows example transaction card

**Goals Empty State:**

- "Set your first financial goal to start your journey!"
- Shows example goal card

**Journey Map Empty State:**

- "Start your journey by setting a goal."
- Shows example timeline

---

## Error Handling & Edge Cases

**No Internet Connection:**

- Show offline indicator
- Queue transactions for sync when online
- Cache dashboard data

**Invalid Data:**

- Show inline validation errors
- Prevent submission until valid
- Provide helpful error messages

**Slow Loading:**

- Show skeleton loaders
- Progressive data loading
- Optimistic UI updates

**Zero/Null Values:**

- Handle division by zero in calculations
- Show "N/A" for undefined metrics
- Provide default values where appropriate

---

## Success Metrics Per Phase

**Phase 1 (Onboarding):**

- Registration completion rate
- Onboarding form completion time
- Profile completion rate

**Phase 2 (Initial Dashboard):**

- Time to first transaction
- First transaction completion rate

**Phase 3 (Core Features):**

- Transactions added per week
- Transaction list usage
- Dashboard engagement time

**Phase 4 (Advanced Features):**

- Goal creation rate
- Journey Map views
- Simulation usage

**Phase 5 (Ongoing Engagement):**

- Daily active users
- Check-in streak length
- Quest completion rate
- User retention (Day 7, Day 30)

---

This user flow ensures a smooth, progressive experience that guides users from registration through all features while maintaining engagement and providing value at each step.
