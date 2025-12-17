# 🎯 Drug Wizard Access Guide

## Problem Solved
The old "Add New Stock Item" modal was too simplistic. Now there's a clear distinction between:
- **Adding a completely new drug** → Use the Drug Wizard
- **Adding stock for existing drugs** → Use the simple modal

## 🚀 How to Access the Drug Wizard

### 1️⃣ From Dashboard (FEATURED)
**Location**: Pharmacy Dashboard → Quick Actions (First Card)

```
┌─────────────────────────────────────┐
│  ✨ NEW                             │
│  Add New Drug                       │
│  Complete drug wizard               │
│  [Blue gradient card with border]   │
└─────────────────────────────────────┘
```

**Visual**: Blue gradient card with sparkle icon and "NEW" badge

---

### 2️⃣ From Sidebar Navigation
**Location**: Sidebar → Drug Formulary → Add New Drug

```
📊 Pharmacy
├── 🏠 Dashboard
├── 📋 Prescriptions
├── 🔍 Drug Formulary
│   ├── Browse Drugs
│   └── ✨ Add New Drug  ← HERE
├── 📦 Inventory
└── 📊 Reports
```

---

### 3️⃣ From Formulary Page
**Location**: Pharmacy → Formulary → Header Button

```
┌────────────────────────────────────────┐
│  Drug Formulary                        │
│  Search and browse medications         │
│                                        │
│  [+ Add New Drug] ← Blue button       │
└────────────────────────────────────────┘
```

---

### 4️⃣ From Inventory Page
**Location**: Pharmacy → Inventory → Header Button

```
┌────────────────────────────────────────┐
│  Pharmacy Inventory                    │
│  Manage drug stock levels              │
│                                        │
│  [✨ Add New Drug] ← Primary button   │
│  [+ Add Stock] ← For existing drugs   │
│  [📦 Create GRN]                       │
└────────────────────────────────────────┘
```

**Note**: The "Add Stock" button opens a simple modal for existing drugs only.

---

### 5️⃣ From Add Stock Modal
**Location**: Inventory → Add Stock Modal → Link

When users click "Add Stock" and realize they need to create a new drug:

```
┌─────────────────────────────────────┐
│  Add Stock for Existing Drug        │
│                                     │
│  Select an existing drug from the   │
│  formulary to add stock.            │
│  Create a new drug instead →        │
│                                     │
│  [Drug Dropdown]                    │
└─────────────────────────────────────┘
```

---

## 🎨 Visual Hierarchy

### Primary Actions (Blue)
- ✨ Add New Drug (Dashboard featured card)
- Add New Drug button (Formulary)
- ✨ Add New Drug button (Inventory)

### Secondary Actions (Teal/Green)
- + Add Stock (Inventory - for existing drugs)
- 📦 Create GRN (Inventory)

---

## 📱 User Flow

### Scenario 1: Adding a Brand New Drug
```
Dashboard → Quick Actions → "Add New Drug" 
    ↓
Drug Wizard (4 steps)
    ↓
Complete & Save
    ↓
Redirect to Formulary
```

### Scenario 2: Adding Stock for Existing Drug
```
Inventory → "Add Stock" button
    ↓
Modal opens with drug dropdown
    ↓
Select existing drug → Fill details → Save
```

### Scenario 3: User Confusion (Handled!)
```
Inventory → "Add Stock" button
    ↓
Modal opens
    ↓
User realizes: "This drug doesn't exist yet"
    ↓
Clicks "Create a new drug instead →"
    ↓
Redirected to Drug Wizard
```

---

## ✅ What Changed

### Before
- ❌ Only one "Add New Stock" button
- ❌ Confusing for new drugs vs existing drugs
- ❌ Simple modal couldn't capture all drug details

### After
- ✅ Clear distinction: "Add New Drug" vs "Add Stock"
- ✅ Featured card on dashboard with "NEW" badge
- ✅ Multiple access points for discoverability
- ✅ Comprehensive wizard for complete drug data
- ✅ Helper link in modal for confused users

---

## 🎯 Key Features

1. **Dashboard Featured Card**: Blue gradient with sparkle icon
2. **Sidebar Navigation**: Under Drug Formulary submenu
3. **Formulary Button**: Prominent blue button in header
4. **Inventory Distinction**: Separate buttons for new drugs vs stock
5. **Modal Helper**: Link to wizard from stock modal

---

## 🔗 Direct URL
`/pharmacy/drugs/create`

Users can bookmark this URL for quick access!
