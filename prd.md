# Detailed Product Requirement Document (PRD) v4.0

**Project Name:** CashPath - Financial Journey & Gamification Platform
**Version:** 4.0 (Transaction-Driven Cashflow Analysis)
**Status:** Ready for Development
**Date:** December 2025

---

## 1. System Context & Definitions

This application is a responsive Progressive Web Application (PWA) focused on Gen Z financial literacy through transaction tracking, gamification, and intelligent cashflow analysis.

**Core Philosophy:** The system learns from user behavior rather than requiring upfront financial information. Users start by creating transactions, and the system automatically analyzes their cashflow patterns.

- **The "Journey Map":** A visual timeline representing the user's financial journey from current status to their saving goals, with auto-generated milestones.
- **The "Time Machine" (Decision Simulation):** The logic engine that projects the impact of daily spending decisions (like coffee purchases) into long-term financial outcomes.
- **Transaction Ledger:** The foundation of the system - all income and expense entries that power cashflow analysis.
- **Gamification Engine:** Daily quests, habits (check-in streaks), EXP system, and badge progression to encourage consistent financial tracking.

---

## 2. User Flow & Feature Hierarchy

### 2.1. Authentication (Required First Step)

**Objective:** Users must create an account and sign in before accessing any features.

**User Stories:**

- As a new user, I want to sign up with my email and password so I can start tracking my finances.
- As a returning user, I want to sign in securely so I can access my financial data.

**Sign Up Flow:**

1. User visits landing page → clicks "Sign Up"
2. User enters: email, password, confirm password
3. Email validation (format check)
4. Password requirements: minimum 8 characters, at least one number
5. Account creation → automatic sign-in → redirect to Dashboard

**Sign In Flow:**

1. User enters email and password
2. System validates credentials
3. JWT token issued → redirect to Dashboard

**Data Inputs & Validation Rules:**
| Field Name | Data Type | Validation Logic | UI State (Error) |
| :--- | :--- | :--- | :--- |
| `email` | String | Valid email format, unique in system | "Email already exists" or "Invalid email format" |
| `password` | String | Min 8 chars, at least one number | "Password must be at least 8 characters with a number" |
| `confirm_password` | String | Must match `password` | "Passwords do not match" |

**Acceptance Criteria:**

- Sign up completes in < 3 seconds
- Sign in completes in < 2 seconds
- Failed login attempts show clear error messages
- Password reset flow (future enhancement)

---

### 2.2. Transaction Management (CRUD) - Core Foundation

**Objective:** Allow users to record, view, edit, and delete income and expense transactions. This is the foundation that powers all other features - the system analyzes cashflow from these transactions.

**User Stories:**

- As a user, I want to add my daily expenses so I can track where my money goes.
- As a user, I want to record my income sources so I can see my total earnings.
- As a user, I want to categorize transactions so I can understand my spending patterns.
- As a user, I want to edit or delete transactions if I made a mistake.

**Key Design Decision:** No onboarding required. Users start adding transactions immediately after sign-up. The system calculates monthly income, expenses, and savings rate automatically from transaction history.

**Data Inputs & Validation Rules:**
| Field Name | Data Type | Validation Logic | UI State (Error) |
| :--- | :--- | :--- | :--- |
| `type` | Enum (String) | [income, expense] | Required radio/toggle selection |
| `amount` | Float (2 decimal) | Must be > 0. Max: 999,999,999 | "Amount must be a positive number" |
| `category_id` | UUID (FK) | Must exist in Categories table | Dropdown selection required |
| `description` | String (255 max) | Optional. Max 255 chars | "Description too long" |
| `transaction_date` | Date | Must be ≤ today. Cannot be > 1 year in past | "Invalid date selected" |
| `is_recurring` | Boolean | Default: false | Toggle switch |
| `recurring_frequency` | Enum (String) | [daily, weekly, monthly, yearly] | Required if `is_recurring` = true |

**Default Categories:**

**Income Categories:**
| Category ID | Name | Icon |
| :--- | :--- | :--- |
| `INC_001` | Salary | 💼 |
| `INC_002` | Freelance | 💻 |
| `INC_003` | Investment Returns | 📈 |
| `INC_004` | Gifts | 🎁 |
| `INC_005` | Other Income | 💰 |

**Expense Categories:**
| Category ID | Name | Icon |
| :--- | :--- | :--- |
| `EXP_001` | Food & Dining | 🍔 |
| `EXP_002` | Transportation | 🚗 |
| `EXP_003` | Shopping | 🛍️ |
| `EXP_004` | Entertainment | 🎮 |
| `EXP_005` | Bills & Utilities | 📱 |
| `EXP_006` | Health | 🏥 |
| `EXP_007` | Education | 📚 |
| `EXP_008` | Coffee & Drinks | ☕ |
| `EXP_009` | Subscriptions | 📺 |
| `EXP_010` | Other Expenses | 📦 |

**Data Structure (Transaction Object):**

```json
{
  "transaction_id": "TXN_20251206_001",
  "user_id": "USR_001",
  "type": "expense",
  "amount": 45000.0,
  "category_id": "EXP_001",
  "category_name": "Food & Dining",
  "description": "Lunch with friends",
  "transaction_date": "2025-12-06",
  "is_recurring": false,
  "recurring_frequency": null,
  "created_at": "2025-12-06T10:30:00Z",
  "updated_at": "2025-12-06T10:30:00Z"
}
```

**CRUD Operations:**

1. **Create Transaction:**

   - Quick-add FAB (Floating Action Button) on dashboard
   - Full form with all fields
   - Auto-suggest categories based on description (ML enhancement for future)
   - Default to today's date

2. **Read Transactions:**

   - List view with infinite scroll (load 20 per page)
   - Filter by: date range, category, type (income/expense), amount range
   - Sort by: date (default), amount, category
   - Search by description

3. **Update Transaction:**

   - Tap on transaction to edit
   - All fields editable except `transaction_id` and `created_at`

4. **Delete Transaction:**
   - Swipe-to-delete with confirmation dialog
   - Soft delete (mark as `deleted_at` timestamp) for data recovery

**UI States:**

- **Empty State:** "No transactions yet. Tap + to add your first one! Start tracking to unlock insights."
- **Loading State:** Skeleton loader for transaction list
- **Error State:** "Failed to load transactions. Pull to retry."

**Acceptance Criteria:**

- User can add a transaction in < 10 seconds (3 taps minimum)
- Transaction list updates in real-time after CRUD operations
- Filter and search results appear within 300ms
- Deleted transactions can be recovered within 30 days

---

### 2.3. Cashflow Analysis (Automatic)

**Objective:** System automatically analyzes user's cashflow from transaction history. No manual income/expense input required.

**Analysis Logic:**

- **Monthly Income:** Calculated from sum of all `income` transactions in the last 30 days (or average if < 30 days of data)
- **Monthly Expenses:** Calculated from sum of all `expense` transactions in the last 30 days
- **Savings Rate:** `((Monthly_Income - Monthly_Expenses) / Monthly_Income) * 100`
- **Average Daily Spending:** `Monthly_Expenses / 30`
- **Top Spending Categories:** Ranked by total amount spent in current month

**When User Has No Transactions:**

- Show empty states with encouragement to add first transaction
- Dashboard shows placeholder values: "Add transactions to see your cashflow"

**When User Has Limited Data (< 7 days):**

- Show "Building your profile..." message
- Use available data but indicate it's preliminary
- Encourage more transaction entries

**Acceptance Criteria:**

- Cashflow metrics update automatically when transactions are added/edited/deleted
- Calculations are accurate to 2 decimal places
- System handles edge cases (all income, all expenses, no transactions)

---

### 2.4. Dashboard & Analytics

**Objective:** Provide visual insights and reports on user's financial health through charts and metrics derived from transaction data.

**User Stories:**

- As a user, I want to see my total income vs expenses at a glance.
- As a user, I want to view spending breakdown by category.
- As a user, I want to see trends over time to understand my habits.
- As a user, I want to know my current balance and financial health score.

**Dashboard Components:**

#### 2.4.1. Summary Cards (Top Section)

| Card                    | Calculation                                                    | Color Coding                          |
| :---------------------- | :------------------------------------------------------------- | :------------------------------------ |
| **Current Balance**     | `Total_Income - Total_Expenses` (all time or selected period)  | Green if positive, Red if negative    |
| **This Month Income**   | Sum of `income` transactions in current month                  | Green                                 |
| **This Month Expenses** | Sum of `expense` transactions in current month                 | Red/Orange                            |
| **Savings Rate**        | `((Income - Expenses) / Income) * 100` (from transaction data) | Green > 20%, Yellow 10-20%, Red < 10% |

#### 2.4.2. Charts & Visualizations

**Chart 1: Income vs Expenses (Bar/Line Chart)**

- **Type:** Grouped bar chart or dual-axis line chart
- **X-Axis:** Time period (days/weeks/months)
- **Y-Axis:** Amount
- **Data Series:** Income (green), Expenses (red)
- **Interaction:** Tap on bar to see breakdown
- **Time Filters:** This week, This month, Last 3 months, Last 6 months, This year, Custom range

**Chart 2: Expense Breakdown (Donut/Pie Chart)**

- **Type:** Donut chart with center total
- **Data:** Top 5 expense categories + "Others"
- **Interaction:** Tap on segment to see category details
- **Labels:** Category name + percentage + amount

**Chart 3: Spending Trend (Area/Line Chart)**

- **Type:** Area chart with gradient fill
- **X-Axis:** Days of current month
- **Y-Axis:** Cumulative spending
- **Reference Line:** Budget limit (if set)
- **Interaction:** Hover/tap to see daily amount

**Chart 4: Category Comparison (Horizontal Bar Chart)**

- **Type:** Horizontal bar chart
- **Data:** All categories sorted by amount (descending)
- **Comparison:** Current month vs previous month (optional overlay)

**Chart 5: Financial Health Score (Gauge/Radial)**

- **Type:** Radial gauge or semi-circle meter
- **Range:** 0-100 score
- **Calculation:**
  ```
  Base_Score = 50
  + (Savings_Rate * 0.3)           // Max +30 points
  + (Goal_Progress * 0.2)          // Max +20 points
  - (Overspend_Penalty)            // -10 per category over budget
  + (Streak_Bonus)                 // +5 for 7-day check-in streak
  ```
- **Color Zones:** Red (0-40), Yellow (41-70), Green (71-100)

#### 2.4.3. Quick Insights (AI-Generated - Optional for MVP)

- "You spent 30% more on Food this week compared to last week."
- "Great job! You've saved ₹5,000 more than last month."
- "Tip: Reducing Coffee spending by 20% could save you ₹2,400/year."

#### 2.4.4. Recent Transactions Widget

- Show last 5 transactions
- "View All" link to full transaction list

**Dashboard Layout (Responsive PWA):**

```
┌─────────────────────────────────┐
│  👋 Welcome back, [Name]!       │
│  Financial Health: 72/100 🟢     │
├─────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐        │
│ │ Balance │ │ Savings │        │
│ │ ₹45,000 │ │  Rate   │        │
│ │   🟢    │ │  24% 🟢 │        │
│ └─────────┘ └─────────┘        │
│ ┌─────────┐ ┌─────────┐        │
│ │ Income  │ │Expenses │        │
│ │ ₹80,000 │ │ ₹35,000 │        │
│ │   🟢    │ │   🟠    │        │
│ └─────────┘ └─────────┘        │
├─────────────────────────────────┤
│   📊 Income vs Expenses         │
│   [Bar Chart Component]         │
│   [Week] [Month] [Year]         │
├─────────────────────────────────┤
│   🍩 Where's your money going?  │
│   [Donut Chart Component]       │
├─────────────────────────────────┤
│   📈 Spending Trend             │
│   [Area Chart Component]        │
├─────────────────────────────────┤
│   💡 Quick Insight              │
│   "You're on track to save..."  │
├─────────────────────────────────┤
│   📝 Recent Transactions        │
│   • ☕ Coffee - ₹250           │
│   • 🚗 Uber - ₹180             │
│   • 💼 Salary + ₹80,000        │
│   [View All →]                  │
├─────────────────────────────────┤
│         [+ Add Transaction]     │
└─────────────────────────────────┘
```

**Acceptance Criteria:**

- Dashboard loads within 2 seconds
- Charts render smoothly with animations
- Data refreshes automatically when returning to dashboard
- Empty states shown for new users with no transactions
- All charts are responsive and touch-friendly

---

### 2.5. Saving Goals with Milestones (Journey Map)

**Objective:** Help users set and achieve saving goals with auto-generated milestones that break down the journey into manageable steps.

**User Story:** As a user, I want to set a saving goal and see my progress through milestones so I stay motivated to save.

**Goal Creation:**

- User sets: goal name, target amount, target date (optional)
- System automatically generates 3-4 milestones between current savings and target
- Milestone formula: `Milestone_X = Current_Savings + (Goal_Amount - Current_Savings) * (X * 0.25)` where X = 1, 2, 3, 4

**Journey Map Visualization:**

- Horizontal scrollable timeline
- Start point: Current Date (T0), Value = current savings (from transaction balance)
- End point: Target Date (Tn), Value = goal target amount
- Milestones: Visual markers showing progress checkpoints
- Progress bar showing percentage completion

**Data Structure (Goal Object):**

```json
{
  "goal_id": "GOAL_001",
  "user_id": "USR_001",
  "name": "Emergency Fund",
  "target_amount": 100000.0,
  "current_amount": 25000.0,
  "target_date": "2026-06-01",
  "milestones": [
    {
      "milestone_id": "MIL_001",
      "target_amount": 43750.0,
      "target_date": "2026-02-01",
      "is_completed": false,
      "completed_at": null
    },
    {
      "milestone_id": "MIL_002",
      "target_amount": 62500.0,
      "target_date": "2026-04-01",
      "is_completed": false,
      "completed_at": null
    },
    {
      "milestone_id": "MIL_003",
      "target_amount": 81250.0,
      "target_date": "2026-05-15",
      "is_completed": false,
      "completed_at": null
    }
  ],
  "created_at": "2025-12-06T10:00:00Z",
  "updated_at": "2025-12-06T10:00:00Z"
}
```

**Progress Calculation:**

- `Current_Amount` = Sum of all income transactions minus all expense transactions (or manually allocated savings)
- `Progress_Percentage` = `(Current_Amount / Target_Amount) * 100`
- `Projected_Completion_Date` = Calculated based on average monthly savings rate

**UI States:**

- **Empty State:** "Start your journey by setting a saving goal."
- **Active State:** Horizontal scrollable timeline with milestones
- **Milestone Completed:** Confetti animation + "Milestone Achieved!" modal + EXP reward
- **Goal Completed:** Celebration animation + "Goal Achieved!" modal + Badge unlock

**Acceptance Criteria:**

- Goals can be created, edited, and deleted
- Milestones auto-generate when goal is created
- Progress updates automatically based on transaction balance
- Journey Map is visually engaging and motivates users

---

### 2.6. Decision Simulation (The "Time Machine")

**Objective:** A "What If" calculator allowing users to see the long-term impact of their daily spending decisions (like coffee purchases).

**User Story:** As a user, I want to see what happens if I reduce my daily coffee spending by 50% so I can understand the long-term financial impact.

**Simulation Logic:**

- **Inputs:** Category (e.g., "Coffee & Drinks"), Current Average Daily Spend, Proposed Daily Spend
- **Delta:** `D = Current_Daily_Spend - Proposed_Daily_Spend`
- **Time Machine Calculation (1 Year):** `Impact_1Y = D * 365`
- **Time Machine Calculation (5 Years):** `Impact_5Y = D * 365 * 5`
- **With Compound Interest (Optional):** `Future_Value = Impact_1Y * (1 + 0.04)^years` (Assuming 4% annual interest)

**Example Scenario:**

- User currently spends ₹200/day on coffee
- User reduces to ₹100/day
- Delta: ₹100/day
- Impact in 1 year: ₹36,500 saved
- Impact in 5 years: ₹182,500 saved
- With 4% interest over 5 years: ~₹198,000

**UI Components:**

- Category selector (pre-populated with user's expense categories)
- Current spending display (calculated from transaction history)
- Slider to adjust proposed spending
- Real-time impact calculator showing:
  - Monthly savings
  - Yearly savings
  - 5-year projection
  - Visual comparison chart

**Data Structure (Simulation Object):**

```json
{
  "simulation_id": "SIM_001",
  "user_id": "USR_001",
  "category_id": "EXP_008",
  "category_name": "Coffee & Drinks",
  "current_daily_spend": 200.0,
  "proposed_daily_spend": 100.0,
  "impact_1_year": 36500.0,
  "impact_5_years": 182500.0,
  "created_at": "2025-12-06T10:00:00Z"
}
```

**Acceptance Criteria:**

- User can select any expense category
- Current spending is auto-calculated from transaction history
- Slider updates impact calculations in real-time (< 200ms latency)
- If `Proposed_Spend` > `Current_Spend`, show warning: "This increases your spending"
- Visualizations are clear and motivating

---

### 2.7. Gamification Engine (Quests & Habits)

**Objective:** Retain users through variable rewards, daily engagement, and progress tracking.

#### 2.7.1. Daily Check-In (Habits - Streak System)

**User Story:** As a user, I want to check in daily to maintain my streak and earn EXP.

**Functionality:**

- User clicks "Check In" button (available once per day)
- System records check-in timestamp
- Streak counter logic:
  - If `last_check_in_date` = `yesterday`, increment `streak_count`
  - If `last_check_in_date` < `yesterday`, reset `streak_count` = 1
  - If `last_check_in_date` = `today`, show "Already checked in today"
- EXP Reward: 10 EXP per check-in (bonus multipliers for streaks)

**Streak Bonuses:**

- 7-day streak: +5 bonus EXP
- 30-day streak: +20 bonus EXP
- 100-day streak: +50 bonus EXP + special badge

**Data Structure (Check-In Object):**

```json
{
  "check_in_id": "CI_001",
  "user_id": "USR_001",
  "check_in_date": "2025-12-06",
  "streak_count": 5,
  "exp_earned": 10,
  "created_at": "2025-12-06T08:00:00Z"
}
```

#### 2.7.2. Daily Quests

**User Story:** As a user, I want to complete daily quests to earn EXP and track my financial habits.

**Quest Generation:**

- System generates minimum 3 daily quests per day
- Quests reset at midnight (user's timezone)
- Quests are personalized based on user's transaction history

**Quest Types:**

1. **Spending Limit Quest:**

   - "Don't spend more than ₹500 today"
   - Tracks expense transactions for the day
   - Completes automatically if condition met
   - Reward: 25 EXP

2. **Income Goal Quest:**

   - "Earn at least ₹2,000 today"
   - Tracks income transactions for the day
   - Completes automatically if condition met
   - Reward: 30 EXP

3. **Category Spending Quest:**

   - "Spend less than ₹200 on Food & Dining today"
   - Tracks specific category spending
   - Completes automatically if condition met
   - Reward: 20 EXP

4. **Transaction Count Quest:**

   - "Add at least 3 transactions today"
   - Tracks transaction creation count
   - Completes automatically if condition met
   - Reward: 15 EXP

5. **No-Spend Day Quest:**
   - "Don't make any non-essential purchases today"
   - Tracks all expense transactions
   - Completes automatically if no expenses recorded
   - Reward: 50 EXP (higher reward for difficulty)

**Quest Generation Algorithm:**

- Analyze user's average daily spending/income
- Generate quests that are challenging but achievable (10-20% variance from average)
- Ensure variety: at least one spending quest, one income quest, one behavioral quest
- Avoid duplicate quest types on the same day

**Data Structure (Quest Object):**

```json
{
  "quest_id": "Q_101",
  "user_id": "USR_001",
  "title": "No-Spend Day",
  "description": "Don't spend money on non-essentials today.",
  "quest_type": "no_spend",
  "difficulty": "Medium",
  "target_value": 0,
  "current_value": 0,
  "exp_reward": 50,
  "status": "active",
  "expiration_date": "2025-12-06T23:59:59Z",
  "completed_at": null,
  "created_at": "2025-12-06T00:00:00Z"
}
```

**Quest Completion Logic:**

- Quests check completion status automatically when transactions are added/updated
- User can manually claim completed quests (or auto-claim with notification)
- EXP is awarded immediately upon completion
- Completed quests show in "Quest History"

**UI Components:**

- Daily Quest Card showing:
  - Quest title and description
  - Progress bar (if applicable)
  - EXP reward amount
  - Time remaining
  - Completion status
- Quest completion animation with EXP gain display
- Quest history view (past 7 days)

**Acceptance Criteria:**

- Minimum 3 daily quests generated per day
- Quests auto-complete when conditions are met
- EXP is awarded immediately
- Quest progress updates in real-time
- User can view quest history

#### 2.7.3. EXP System & Badges

**User Story:** As a user, I want to earn EXP from completing quests and check-ins, and use it to unlock badges.

**EXP Earning Sources:**

- Daily check-in: 10 EXP (base)
- Daily quest completion: 15-50 EXP (varies by difficulty)
- Streak bonuses: +5 to +50 EXP
- Goal milestone completion: 100 EXP
- Goal completion: 500 EXP

**Badge System:**

- Badges are unlocked by spending EXP
- Badge tiers: Bronze (100 EXP), Silver (500 EXP), Gold (1000 EXP), Platinum (5000 EXP)
- Badge categories:
  - **Consistency:** "7-Day Streak Master", "30-Day Warrior", "100-Day Legend"
  - **Savings:** "First Goal Achieved", "Goal Crusher", "Savings Master"
  - **Tracking:** "Transaction Tracker", "Category Expert", "Analytics Pro"
  - **Quests:** "Quest Master", "Perfect Week", "Monthly Champion"

**Data Structure (User Progress Object):**

```json
{
  "user_id": "USR_001",
  "total_exp": 1250,
  "current_streak": 12,
  "longest_streak": 12,
  "badges": [
    {
      "badge_id": "BADGE_001",
      "name": "7-Day Streak Master",
      "tier": "Bronze",
      "unlocked_at": "2025-12-05T10:00:00Z",
      "exp_spent": 100
    }
  ],
  "quests_completed": 45,
  "goals_completed": 1,
  "updated_at": "2025-12-06T10:00:00Z"
}
```

**Badge Unlock Flow:**

1. User earns EXP from quests/check-ins
2. User navigates to "Badges" section
3. User sees available badges with EXP cost
4. User clicks "Unlock" → confirmation dialog
5. EXP is deducted, badge is unlocked
6. Celebration animation plays

**Acceptance Criteria:**

- EXP is accurately tracked and displayed
- Badges can be unlocked with sufficient EXP
- EXP balance updates in real-time
- Badge collection is visible in user profile

---

## 3. Technical Architecture Specifications

### 3.1. Database Schema (Relational/SQL Recommended)

**Core Tables:**

- **Users Table:** `id` (UUID), `email`, `hash_password`, `created_at`, `updated_at`
- **Sessions Table:** `id` (UUID), `user_id`, `token`, `expires_at`, `created_at`
- **Categories Table:** `category_id` (UUID), `user_id` (nullable), `name`, `type` (income/expense), `icon`, `color`, `is_default`, `created_at`
- **Transactions Table:** `transaction_id` (UUID), `user_id`, `type`, `amount`, `category_id`, `description`, `transaction_date`, `is_recurring`, `recurring_frequency`, `created_at`, `updated_at`, `deleted_at`
- **Goals Table:** `goal_id` (UUID), `user_id`, `name`, `target_amount`, `current_amount`, `target_date`, `created_at`, `updated_at`
- **Milestones Table:** `milestone_id` (UUID), `goal_id`, `target_amount`, `target_date`, `is_completed`, `completed_at`, `created_at`
- **Check_Ins Table:** `check_in_id` (UUID), `user_id`, `check_in_date`, `streak_count`, `exp_earned`, `created_at`
- **Quests Table:** `quest_id` (UUID), `user_id`, `title`, `description`, `quest_type`, `target_value`, `current_value`, `exp_reward`, `status` (active/completed/expired), `expiration_date`, `completed_at`, `created_at`
- **User_Progress Table:** `user_id` (UUID), `total_exp`, `current_streak`, `longest_streak`, `quests_completed`, `goals_completed`, `updated_at`
- **Badges Table:** `badge_id` (UUID), `name`, `description`, `tier`, `exp_cost`, `icon`, `created_at`
- **User_Badges Table:** `user_badge_id` (UUID), `user_id`, `badge_id`, `unlocked_at`, `exp_spent`
- **Simulations Table:** `simulation_id` (UUID), `user_id`, `category_id`, `current_daily_spend`, `proposed_daily_spend`, `impact_1_year`, `impact_5_years`, `created_at`

### 3.2. Database Schema Details

**Categories Table:**

```sql
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system defaults
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(10),
    color VARCHAR(7), -- Hex color code
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name, type)
);
```

**Transactions Table:**

```sql
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    category_id UUID NOT NULL REFERENCES categories(category_id),
    description VARCHAR(255),
    transaction_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(10) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP, -- Soft delete
    INDEX idx_user_date (user_id, transaction_date),
    INDEX idx_user_category (user_id, category_id),
    INDEX idx_user_type (user_id, type)
);
```

**Goals Table:**

```sql
CREATE TABLE goals (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12, 2) DEFAULT 0 CHECK (current_amount >= 0),
    target_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
);
```

**Milestones Table:**

```sql
CREATE TABLE milestones (
    milestone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(goal_id) ON DELETE CASCADE,
    target_amount DECIMAL(12, 2) NOT NULL,
    target_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_goal (goal_id)
);
```

**Check_Ins Table:**

```sql
CREATE TABLE check_ins (
    check_in_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    streak_count INTEGER NOT NULL DEFAULT 1,
    exp_earned INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, check_in_date),
    INDEX idx_user_date (user_id, check_in_date)
);
```

**Quests Table:**

```sql
CREATE TABLE quests (
    quest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    quest_type VARCHAR(50) NOT NULL, -- 'spending_limit', 'income_goal', 'category_spending', 'transaction_count', 'no_spend'
    target_value DECIMAL(12, 2),
    current_value DECIMAL(12, 2) DEFAULT 0,
    exp_reward INTEGER NOT NULL DEFAULT 15,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    expiration_date TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_status (user_id, status),
    INDEX idx_expiration (expiration_date)
);
```

**User_Progress Table:**

```sql
CREATE TABLE user_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_exp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    quests_completed INTEGER DEFAULT 0,
    goals_completed INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Badges Table:**

```sql
CREATE TABLE badges (
    badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
    exp_cost INTEGER NOT NULL,
    icon VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**User_Badges Table:**

```sql
CREATE TABLE user_badges (
    user_badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exp_spent INTEGER NOT NULL,
    UNIQUE(user_id, badge_id),
    INDEX idx_user (user_id)
);
```

**Simulations Table:**

```sql
CREATE TABLE simulations (
    simulation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(category_id),
    current_daily_spend DECIMAL(12, 2) NOT NULL,
    proposed_daily_spend DECIMAL(12, 2) NOT NULL,
    impact_1_year DECIMAL(12, 2),
    impact_5_years DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
);
```

### 3.3. API Endpoints (RESTful)

**Authentication Endpoints:**

- `POST /api/v1/auth/signup`
  - **Payload:** `{ email, password, confirm_password }`
  - **Response:** `{ user_id, email, token }`
- `POST /api/v1/auth/signin`
  - **Payload:** `{ email, password }`
  - **Response:** `{ user_id, email, token }`
- `POST /api/v1/auth/signout`
  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `{ success: true }`

**Transaction Endpoints:**

- `POST /api/v1/transactions`
  - **Payload:** `{ type, amount, category_id, description?, transaction_date, is_recurring?, recurring_frequency? }`
  - **Response:** `{ transaction_id, ...transaction_data, created_at }`
- `GET /api/v1/transactions`
  - **Query Params:** `?page=1&limit=20&type=expense&category_id=xxx&start_date=2025-01-01&end_date=2025-12-31&search=coffee&sort_by=date&sort_order=desc`
  - **Response:** `{ transactions[], total_count, page, total_pages }`
- `GET /api/v1/transactions/:id`
  - **Response:** `{ transaction_data }`
- `PUT /api/v1/transactions/:id`
  - **Payload:** `{ type?, amount?, category_id?, description?, transaction_date?, is_recurring?, recurring_frequency? }`
  - **Response:** `{ updated_transaction_data }`
- `DELETE /api/v1/transactions/:id`
  - **Response:** `{ success: true, message: "Transaction deleted" }`
- `POST /api/v1/transactions/:id/restore`
  - **Response:** `{ restored_transaction_data }`

**Category Endpoints:**

- `GET /api/v1/categories`
  - **Query Params:** `?type=expense`
  - **Response:** `{ categories[] }`
- `POST /api/v1/categories`
  - **Payload:** `{ name, type, icon?, color? }`
  - **Response:** `{ category_data }`

**Dashboard/Analytics Endpoints:**

- `GET /api/v1/dashboard/summary`
  - **Query Params:** `?period=month&start_date=2025-12-01&end_date=2025-12-31`
  - **Response:**
    ```json
    {
      "current_balance": 45000.0,
      "total_income": 80000.0,
      "total_expenses": 35000.0,
      "savings_rate": 56.25,
      "health_score": 72,
      "transaction_count": 45
    }
    ```
- `GET /api/v1/dashboard/income-vs-expenses`
  - **Query Params:** `?period=month&group_by=day` (day/week/month)
  - **Response:**
    ```json
    {
      "data": [
        { "date": "2025-12-01", "income": 0, "expenses": 1500 },
        { "date": "2025-12-02", "income": 80000, "expenses": 2300 }
      ]
    }
    ```
- `GET /api/v1/dashboard/expense-breakdown`
  - **Query Params:** `?period=month`
  - **Response:**
    ```json
    {
      "data": [
        {
          "category_id": "EXP_001",
          "category_name": "Food & Dining",
          "amount": 12000,
          "percentage": 34.28
        }
      ],
      "total": 35000
    }
    ```
- `GET /api/v1/dashboard/spending-trend`
  - **Query Params:** `?period=month`
  - **Response:**
    ```json
    {
      "data": [
        { "date": "2025-12-01", "cumulative": 1500, "daily": 1500 },
        { "date": "2025-12-02", "cumulative": 3800, "daily": 2300 }
      ],
      "budget_limit": 40000
    }
    ```

**Goal Endpoints:**

- `POST /api/v1/goals`
  - **Payload:** `{ name, target_amount, target_date? }`
  - **Response:** `{ goal_id, ...goal_data, milestones[] }`
- `GET /api/v1/goals`
  - **Response:** `{ goals[] }`
- `GET /api/v1/goals/:id`
  - **Response:** `{ goal_data, milestones[] }`
- `PUT /api/v1/goals/:id`
  - **Payload:** `{ name?, target_amount?, target_date? }`
  - **Response:** `{ updated_goal_data }`
- `DELETE /api/v1/goals/:id`
  - **Response:** `{ success: true }`
- `GET /api/v1/goals/:id/milestones`
  - **Response:** `{ milestones[] }`

**Simulation Endpoints:**

- `POST /api/v1/simulation/calculate`
  - **Payload:** `{ category_id, proposed_daily_spend }`
  - **Response:** `{ current_daily_spend, proposed_daily_spend, impact_1_year, impact_5_years }`
- `GET /api/v1/simulation/history`
  - **Response:** `{ simulations[] }`

**Gamification Endpoints:**

- `POST /api/v1/gamification/check-in`
  - **Response:** `{ check_in_id, streak_count, exp_earned, total_exp }`
- `GET /api/v1/gamification/quests`
  - **Query Params:** `?status=active`
  - **Response:** `{ quests[] }`
- `POST /api/v1/gamification/quests/:id/complete`
  - **Response:** `{ quest_data, exp_earned, total_exp }`
- `GET /api/v1/gamification/progress`
  - **Response:** `{ total_exp, current_streak, longest_streak, quests_completed, goals_completed, badges[] }`
- `GET /api/v1/gamification/badges`
  - **Response:** `{ available_badges[], unlocked_badges[] }`
- `POST /api/v1/gamification/badges/:id/unlock`
  - **Response:** `{ badge_data, exp_spent, remaining_exp }`

---

## 4. Non-Functional Requirements (NFRs)

### 4.1. Performance

- **Time-to-Interactive (TTI):** < 1.5 seconds on 4G networks
- **Simulation Calculation:** Must execute client-side (JavaScript) for instant feedback, then sync to DB in background
- **Dashboard Load:** Charts must render within 2 seconds
- **Transaction List:** Infinite scroll with < 500ms load time per page
- **Quest Generation:** Daily quests must generate within 1 second at midnight

### 4.2. Security

- **Data Privacy:** All financial data stored encrypted at rest (AES-256)
- **Auth:** JWT (JSON Web Tokens) with 15-minute expiration and Refresh Token rotation
- **Transaction Data:** User can only access their own transactions (row-level security)
- **API Rate Limiting:** 100 requests per minute per user

### 4.3. Accessibility (a11y)

- Colors used for financial health (Green/Red) must have text labels or iconography to support color-blind users
- All interactive elements must be navigable via keyboard/screen reader
- Charts must have alternative text descriptions for screen readers
- Quest and badge descriptions must be clear and descriptive

---

## 5. UI/UX Micro-Interactions

- **Slider Haptic Feedback:** When a user adjusts a budget slider in the simulation, use the device's vibration API (if mobile) to provide tactile feedback per "tick"
- **Progress Bars:** Must animate from 0 to current value (`ease-out` transition, 0.8s) on page load
- **Quest Completion:** Display modal with EXP gain animation (numbers counting up)
- **Check-In:** Button animation with streak counter update and EXP gain display
- **Transaction Added:** Quick toast notification "Transaction added! ✓" with slide-up animation
- **Chart Animations:** Charts animate on load with staggered reveals (0.3s delay between elements)
- **Pull-to-Refresh:** Dashboard and transaction list support pull-to-refresh gesture
- **Swipe Actions:** Swipe left on transaction to reveal delete button (with haptic feedback)
- **Number Animations:** Dashboard summary numbers count up from 0 to actual value on load
- **Badge Unlock:** Celebration animation with confetti and badge reveal
- **Milestone Achievement:** Journey Map milestone completion triggers confetti and progress update

---

## 6. Implementation Roadmap (Sprints)

### Sprint 1: Authentication & Foundation (Weeks 1-2)

- [Backend] Set up DB Schema (Users, Sessions)
- [Backend] Implement Auth API (signup, signin, signout)
- [Backend] Create Categories and Transactions tables
- [Frontend] Build Sign Up and Sign In pages
- [Frontend] Implement Auth context and protected routes
- [Frontend] Create Dashboard layout (static/skeleton)

### Sprint 2: Transaction Management (Weeks 3-4)

- [Full Stack] Implement Transaction CRUD API endpoints
- [Frontend] Build Add/Edit Transaction forms
- [Frontend] Build Transaction list with filters and search
- [Frontend] Implement swipe-to-delete and soft delete
- [Backend] Implement cashflow analysis logic (monthly income/expenses calculation)

### Sprint 3: Dashboard & Charts (Weeks 5-6)

- [Backend] Implement Dashboard analytics endpoints
- [Frontend] Integrate charting library (Recharts/Chart.js/Nivo)
- [Frontend] Build Summary Cards component
- [Frontend] Build Income vs Expenses chart
- [Frontend] Build Expense Breakdown donut chart
- [Frontend] Build Spending Trend chart
- [Frontend] Implement Financial Health Score gauge

### Sprint 4: Goals & Journey Map (Weeks 7-8)

- [Full Stack] Implement Goal CRUD operations
- [Backend] Implement milestone auto-generation logic
- [Frontend] Build Goal creation and management UI
- [Frontend] Build Journey Map timeline visualizer
- [Frontend] Implement milestone completion tracking
- [Backend] Connect goal progress to transaction balance

### Sprint 5: Decision Simulation (Weeks 9-10)

- [Backend] Implement Simulation API endpoints
- [Backend] Calculate current daily spending from transaction history
- [Frontend] Build Decision Simulation UI (category selector, slider, impact calculator)
- [Frontend] Implement real-time impact calculations
- [Frontend] Build visualization charts for simulation results

### Sprint 6: Gamification Engine (Weeks 11-12)

- [Backend] Implement Check-In system and streak logic
- [Backend] Implement Daily Quest generation algorithm
- [Backend] Implement Quest completion tracking
- [Backend] Implement EXP system and Badge system
- [Frontend] Build Check-In UI component
- [Frontend] Build Daily Quests UI
- [Frontend] Build Badge collection UI
- [Frontend] Implement EXP display and badge unlock flow
- [Backend] Connect quest completion to transaction events

### Sprint 7: Polish & QA (Weeks 13-14)

- [QA] Testing on low-end devices and edge-case inputs
- [UI] Micro-interactions and animations polish
- [Performance] Optimize chart rendering and data fetching
- [Accessibility] Screen reader and keyboard navigation testing
- [Backend] Optimize quest generation and cashflow calculations
- [Full Stack] End-to-end testing of all features

---

## 7. Success Metrics

| Metric                      | Target                        | Measurement            |
| :-------------------------- | :---------------------------- | :--------------------- |
| Daily Active Users (DAU)    | 1,000 by Month 3              | Analytics              |
| Avg. Transactions/User/Week | ≥ 5                           | Database query         |
| Dashboard Load Time         | < 2 seconds (P95)             | Performance monitoring |
| User Retention (Day 7)      | ≥ 40%                         | Cohort analysis        |
| Daily Check-In Rate         | ≥ 60% of DAU                  | Check-in logs          |
| Quest Completion Rate       | ≥ 50% of daily quests         | Quest completion logs  |
| Health Score Improvement    | +10 points avg. after 30 days | User data comparison   |
| Average Streak Length       | ≥ 7 days                      | Check-in streak data   |

---

## 8. Key Design Decisions

### 8.1. No Onboarding Flow

**Decision:** Remove traditional onboarding that asks for monthly income, savings, etc.

**Rationale:**

- Reduces friction for new users
- System learns from actual behavior rather than self-reported data
- More accurate cashflow analysis based on real transactions
- Users can start using the app immediately after sign-up

**Implementation:**

- Users go directly to Dashboard after sign-up
- Dashboard shows empty states encouraging first transaction
- Cashflow metrics appear as user adds transactions
- System calculates averages from transaction history

### 8.2. Transaction-Driven Analysis

**Decision:** All financial insights derive from transaction data.

**Rationale:**

- Single source of truth (transactions)
- Eliminates data inconsistency
- More accurate than manual inputs
- Enables real-time updates

**Implementation:**

- Monthly income = sum of income transactions in last 30 days
- Monthly expenses = sum of expense transactions in last 30 days
- Savings rate = calculated from income/expense ratio
- All charts and analytics pull from transaction table

### 8.3. Daily Quest System

**Decision:** Generate minimum 3 personalized daily quests per user.

**Rationale:**

- Encourages daily engagement
- Makes financial tracking fun and gamified
- Provides clear, achievable goals
- Rewards positive financial behaviors

**Implementation:**

- Quest generation runs at midnight (user timezone)
- Quests are personalized based on user's transaction patterns
- Auto-completion when conditions are met
- EXP rewards incentivize completion

### 8.4. EXP-Based Badge System

**Decision:** Users spend EXP to unlock badges (not automatic).

**Rationale:**

- Gives users agency and choice
- Creates sense of achievement and investment
- Encourages EXP accumulation
- Makes badges feel more valuable

**Implementation:**

- EXP earned from quests, check-ins, milestones
- Badges have EXP costs (Bronze: 100, Silver: 500, Gold: 1000, Platinum: 5000)
- User chooses which badges to unlock
- Unlocked badges displayed in profile

---

## 9. Future Enhancements (Post-MVP)

1. **Recurring Transaction Automation:** Auto-create transactions based on recurring patterns
2. **Budget Setting:** Allow users to set category budgets with alerts
3. **Export & Reports:** PDF/CSV export of transactions and monthly summaries
4. **Multi-Currency Support:** Support for multiple currencies
5. **Bank Integration:** Connect bank accounts for automatic transaction import
6. **AI Insights:** ML-powered spending insights and recommendations
7. **Social Features:** Share goals and achievements (opt-in)
8. **Advanced Analytics:** Predictive analytics and forecasting
9. **Mobile App:** Native iOS and Android apps
10. **Offline Mode:** Support for offline transaction entry with sync

---

### **Actionable Next Step for You:**

Would you like me to generate:

1. **Complete SQL Schema code** (for PostgreSQL) with all tables?
2. **JSON Data Contracts** for Frontend/Backend API communication?
3. **Component Structure** for the Dashboard and Transaction modules?
4. **Quest Generation Algorithm** pseudocode?
