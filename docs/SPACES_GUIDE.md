# 🏢 Spaces Guide - Complete Visual Documentation

## 📋 Table of Contents
1. [What is a Space?](#what-is-a-space)
2. [Visual Representation](#visual-representation)
3. [When to Use Spaces](#when-to-use-spaces)
4. [How to Use Spaces](#how-to-use-spaces)
5. [Common Use Cases](#common-use-cases)
6. [Best Practices](#best-practices)

---

## What is a Space?

A **Space** is a high-level organizational container in Scrumpty that represents a **department, product area, or major business unit**. Spaces help you organize your work hierarchically and provide clear separation between different areas of your organization.

### Key Characteristics:
- **Unique Identifier**: Each space has a short key (2-10 characters, e.g., "ENG", "MKT", "HR")
- **Work Item Prefixing**: The space key prefixes all work items created within it (e.g., "ENG-123")
- **Project Container**: Spaces contain multiple projects
- **Team Assignment**: Teams can be assigned to work within specific spaces

---

## Visual Representation

### Organizational Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        WORKSPACE                            │
│                    (Your Organization)                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌───────▼────────┐
│  SPACE: ENG    │   │  SPACE: MKT     │   │  SPACE: HR     │
│  (Engineering) │   │  (Marketing)    │   │  (Human Res.)  │
└───────┬────────┘   └────────┬────────┘   └───────┬────────┘
        │                     │                     │
    ┌───┴───┐             ┌───┴───┐             ┌───┴───┐
    │       │             │       │             │       │
┌───▼───┐ ┌─▼────┐    ┌───▼───┐ ┌─▼────┐    ┌───▼───┐ ┌─▼────┐
│Project│ │Project│   │Project│ │Project│   │Project│ │Project│
│  A    │ │  B   │    │  X    │ │  Y   │    │  M    │ │  N   │
└───┬───┘ └──┬───┘    └───┬───┘ └──┬───┘    └───┬───┘ └──┬───┘
    │        │            │        │            │        │
  Tasks    Tasks        Tasks    Tasks        Tasks    Tasks
```

### Space Structure Example

```
WORKSPACE: Acme Corp
│
├── 🏢 SPACE: ENG (Engineering)
│   ├── 📁 Project: Mobile App (ENG-APP)
│   │   ├── 📋 Task: ENG-APP-1
│   │   ├── 📋 Task: ENG-APP-2
│   │   └── 📋 Task: ENG-APP-3
│   │
│   ├── 📁 Project: Backend API (ENG-API)
│   │   ├── 📋 Task: ENG-API-1
│   │   └── 📋 Task: ENG-API-2
│   │
│   └── 📁 Project: Infrastructure (ENG-INFRA)
│       └── 📋 Task: ENG-INFRA-1
│
├── 🏢 SPACE: MKT (Marketing)
│   ├── 📁 Project: Q1 Campaign (MKT-Q1)
│   │   ├── 📋 Task: MKT-Q1-1
│   │   └── 📋 Task: MKT-Q1-2
│   │
│   └── 📁 Project: Brand Refresh (MKT-BRAND)
│       └── 📋 Task: MKT-BRAND-1
│
└── 🏢 SPACE: HR (Human Resources)
    └── 📁 Project: Onboarding (HR-ONB)
        ├── 📋 Task: HR-ONB-1
        └── 📋 Task: HR-ONB-2
```

---

## When to Use Spaces

### ✅ Use Spaces When:

1. **Multiple Departments**: Your organization has distinct departments (Engineering, Marketing, Sales, HR)
2. **Product Lines**: You manage multiple product lines or business units
3. **Large Teams**: You have large teams that need clear separation of work
4. **Different Workflows**: Different areas of work require different processes or workflows
5. **Separate Reporting**: You need to track metrics and progress separately by area
6. **Access Control**: You want to control who can see/access different areas of work

### ❌ Don't Use Spaces When:

1. **Small Team**: You're a small team working on a single product (use Projects directly)
2. **Single Department**: Your entire organization works in one area
3. **Temporary Work**: For short-term or one-off initiatives (use Projects instead)

---

## How to Use Spaces

### Step 1: Access Spaces
1. Navigate to your workspace
2. Click on **"Spaces"** in the sidebar navigation
3. View all existing spaces in your workspace

### Step 2: Create a New Space

```
┌──────────────────────────────────────┐
│   Create a new Space                 │
├──────────────────────────────────────┤
│                                      │
│  Space Name *                     [?]│
│  ┌────────────────────────────────┐ │
│  │ Engineering                    │ │
│  └────────────────────────────────┘ │
│  A descriptive name for your space  │
│                                      │
│  Space Key *                      [?]│
│  ┌────────────────────────────────┐ │
│  │ ENG                            │ │
│  └────────────────────────────────┘ │
│  Used as prefix (e.g., ENG-PROJ-1)  │
│                                      │
│  Description (Optional)              │
│  ┌────────────────────────────────┐ │
│  │ All engineering projects       │ │
│  └────────────────────────────────┘ │
│                                      │
│  [ Cancel ]        [ Create Space ] │
└──────────────────────────────────────┘
```

### Step 3: Configure Space Settings
- Set space admins
- Configure default workflows
- Set up teams assigned to the space
- Define space-level permissions

### Step 4: Create Projects Within Space
1. Go to the space detail page
2. Click "Create Project"
3. Projects automatically inherit the space key prefix

---

## Common Use Cases

### 1. **Department-Based Organization**

**Scenario**: Large company with multiple departments

```
Workspace: TechCorp
├── SPACE: ENG - Engineering Department
├── SPACE: MKT - Marketing Department  
├── SPACE: SALES - Sales Department
├── SPACE: HR - Human Resources
└── SPACE: FIN - Finance Department
```

**Benefits**:
- Clear departmental boundaries
- Easy reporting by department
- Separate workflows per department

---

### 2. **Product-Based Organization**

**Scenario**: Company with multiple product lines

```
Workspace: SaaSCo
├── SPACE: CRM - CRM Product
├── SPACE: ERP - ERP Product
├── SPACE: ECOM - E-commerce Platform
└── SPACE: MOBILE - Mobile Apps
```

**Benefits**:
- Product-centric organization
- Independent product roadmaps
- Cross-functional teams per product

---

### 3. **Client-Based Organization**

**Scenario**: Agency managing multiple clients

```
Workspace: Digital Agency
├── SPACE: ACME - Acme Corp Client
├── SPACE: GLOBEX - Globex Inc Client
├── SPACE: INITECH - Initech Client
└── SPACE: INTERNAL - Internal Projects
```

**Benefits**:
- Clear client separation
- Easy client-specific reporting
- Isolated permissions per client

---

### 4. **Hybrid Organization**

**Scenario**: Mix of internal departments and product lines

```
Workspace: MegaCorp
├── SPACE: PROD-A - Product A (cross-functional)
├── SPACE: PROD-B - Product B (cross-functional)
├── SPACE: IT - IT Infrastructure
├── SPACE: HR - Human Resources
└── SPACE: LEGAL - Legal Department
```

---

## Best Practices

### ✨ Naming Conventions

**Space Names** (Descriptive):
- ✅ Engineering
- ✅ Marketing & Communications
- ✅ Customer Success
- ❌ Team 1
- ❌ Project Group

**Space Keys** (Short & Memorable):
- ✅ ENG (Engineering)
- ✅ MKT (Marketing)
- ✅ CS (Customer Success)
- ✅ INFRA (Infrastructure)
- ❌ ENGRNG (Too long)
- ❌ A1 (Not descriptive)

### 📊 Organization Tips

1. **Keep it Flat**: Don't create too many spaces (5-15 is usually ideal)
2. **Clear Boundaries**: Ensure each space has a clear, distinct purpose
3. **Consistent Keys**: Use consistent key patterns (all 2-4 chars, or all descriptive)
4. **Document Purpose**: Add descriptions to help team members understand each space

### 🔐 Permissions & Access

1. **Space Admins**: Assign 1-2 admins per space
2. **Team Access**: Grant teams access to relevant spaces only
3. **Cross-Space Work**: Use work item links for cross-space dependencies

### 📈 Scaling Guidelines

| Organization Size | Recommended Spaces |
|-------------------|-------------------|
| 1-10 people       | 0-2 spaces        |
| 10-50 people      | 2-5 spaces        |
| 50-200 people     | 5-10 spaces       |
| 200+ people       | 10-20 spaces      |

---

## Real-World Examples

### Example 1: Software Company

```
WORKSPACE: CloudTech Inc.
│
├── SPACE: ENG (Engineering)
│   ├── Backend Services
│   ├── Frontend Applications
│   └── Mobile Development
│
├── SPACE: PROD (Product)
│   ├── Product Roadmap
│   ├── Feature Specifications
│   └── User Research
│
├── SPACE: DESIGN (Design)
│   ├── UI/UX Projects
│   ├── Brand Assets
│   └── Design System
│
├── SPACE: QA (Quality Assurance)
│   ├── Test Plans
│   ├── Automation
│   └── Bug Tracking
│
└── SPACE: DEVOPS (DevOps)
    ├── Infrastructure
    ├── CI/CD Pipelines
    └── Security
```

### Example 2: Marketing Agency

```
WORKSPACE: Creative Solutions
│
├── SPACE: CLIENT-A (Client: Acme Corp)
│   ├── Website Redesign
│   ├── Social Media Campaign
│   └── Content Creation
│
├── SPACE: CLIENT-B (Client: TechStart)
│   ├── Brand Strategy
│   └── Launch Campaign
│
└── SPACE: INTERNAL (Internal Work)
    ├── Business Development
    ├── Training & Development
    └── Operations
```

---

## Quick Reference

### When You Need a Space

| Indicator | Use Space? |
|-----------|-----------|
| Working across multiple departments | ✅ Yes |
| Managing multiple product lines | ✅ Yes |
| Need separate reporting by area | ✅ Yes |
| Different workflows per area | ✅ Yes |
| 50+ team members | ✅ Likely Yes |
| Single small team | ❌ No |
| Single product focus | ❌ Probably No |
| Temporary project | ❌ No |

### Space vs Project vs Task

```
SPACE     → High-level organizational unit (Department/Product)
  ↓
PROJECT   → Specific initiative or deliverable
  ↓
TASK      → Individual work item
```

**Example Flow**:
- SPACE: ENG (Engineering Department)
  - PROJECT: Mobile App Redesign
    - TASK: Design new login screen
    - TASK: Implement authentication
    - TASK: Add biometric support

---

## Getting Started Checklist

- [ ] Identify your organizational structure
- [ ] Determine if you need spaces (see "When to Use Spaces")
- [ ] Plan your space keys (2-10 characters, memorable)
- [ ] Create your first space
- [ ] Set space admins and permissions
- [ ] Create projects within the space
- [ ] Train team members on the structure
- [ ] Review and adjust as needed

---

## Support & Questions

If you have questions about organizing your workspace with spaces:
1. Review this guide
2. Check existing spaces in your workspace for examples
3. Consult with workspace admins
4. Start simple and evolve your structure over time

Remember: **Spaces are flexible!** You can always adjust your structure as your organization grows and evolves.
