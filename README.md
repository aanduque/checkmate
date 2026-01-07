# Check Mate

> A mobile-first ADHD-focused productivity app with sprint-based planning, contextual routines, and focus sessions.

## Overview

Check Mate helps individuals with ADHD manage tasks through constraint-based productivity. Instead of endless to-do lists, users work within defined capacity limits, automatically filtered views, and structured focus periods.

### Key Features

- **Sprint-Based Planning**: Work in 1-week sprints (Sunday–Saturday) with up to 3 sprints visible at once
- **Capacity Management**: Define available points per tag per sprint to prevent overcommitment
- **Smart Routines**: Automatic task filtering based on time of day, day of week, and custom conditions
- **Focus Sessions**: Pomodoro-style work periods attached to tasks with focus level tracking
- **Gentle Skipping**: Skip tasks "for now" or "for the day" with required justifications
- **AI Task Splitting**: Break down large tasks into manageable subtasks
- **Recurring Tasks**: RRULE-based recurrence with automatic instance spawning

## Concepts

### Tasks & Points

Tasks are the core unit of work. Unlike traditional apps with a single effort estimate, Check Mate uses **points per tag**:

```
Task: "Build API endpoint"
├── #work: 5 points
├── #backend: 3 points
└── #learning: 2 points
```

Points follow the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21), where 1 point ≈ 1 hour of effort.

### Tags & Capacity

Tags categorize tasks and define capacity limits:

```
Tag: #work
├── Default Capacity: 25 points/sprint
├── Color: Blue
└── Icon: 💼

This sprint override: 20 points (vacation week)
```

### Sprints & Health

Sprints are fixed 1-week periods. The system tracks **sprint health** based on:

- Assigned points vs. available capacity
- Days remaining in sprint
- Burn rate needed to complete on time

| Status | Meaning |
|--------|---------|
| 🟢 On Track | Daily burn rate is sustainable |
| 🟡 At Risk | Burn rate exceeds sustainable by 20%+ |
| 🔴 Off Track | Burn rate exceeds sustainable by 50%+ |

### Routines

Routines are saved filters that activate automatically:

```
Routine: "Deep Work"
├── Filter: hasTag("coding") and points.total >= 3
├── Activates: Weekdays 9:00–12:00
├── Priority: 8
└── Color: Purple
```

When active, only matching tasks are shown. Users can override by manual filtering.

### Sessions

Sessions are Pomodoro-style focus periods attached to tasks:

```
Session on "Build API endpoint"
├── Started: 10:30 AM
├── Ended: 11:05 AM
├── Status: Completed
├── Focus Level: Focused
└── Notes: "Finished the auth middleware"
```

Sessions can be completed or abandoned (preserved for analytics).

### Skip Mechanics

Two skip types for flexibility without guilt:

| Skip Type | Effect | Requirement |
|-----------|--------|-------------|
| For Now | Task moves to bottom of sprint | None |
| For Day | Task hidden until tomorrow (appears at top) | Justification comment |

## Architecture

Check Mate follows Domain-Driven Design with CQRS:

```
┌─────────────────────────────────────────────────────┐
│                   Application Layer                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Commands   │  │   Queries   │  │   Ports     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────┤
│                    Domain Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Aggregates  │  │   Value     │  │  Domain     │ │
│  │ Task,Sprint │  │   Objects   │  │  Services   │ │
│  │ Tag,Routine │  │             │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────┤
│                 Infrastructure Layer                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Repositories│  │  Filtrex    │  │   rrule     │ │
│  │ (In-Memory) │  │  Adapter    │  │  Adapter    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Aggregates

| Aggregate | Responsibility |
|-----------|----------------|
| **Task** | Core work unit; owns comments, sessions, skip state |
| **Sprint** | Time-bounded container; references tasks, holds capacity overrides |
| **Tag** | Categorization with visual properties and default capacity |
| **Routine** | Filter + activation rules for contextual task visibility |

### Key Dependencies

| Library | Purpose |
|---------|---------|
| `filtrex` | Safe, sandboxed expression evaluation for routines |
| `rrule` | RFC 5545 recurrence rule parsing and occurrence calculation |

## Project Structure

```
checkmate/
├── DESIGN.md           # Domain model specification
├── DECISIONLOG.md      # Chronological design decisions
├── README.md           # This file
├── packages/
│   ├── domain/         # Entities, Value Objects, Domain Services
│   ├── application/    # Commands, Queries, Ports
│   └── infrastructure/ # Repository implementations, Adapters
└── apps/
    └── mobile/         # React Native application (future)
```

## Expression Language

Check Mate uses [Filtrex](https://github.com/joewalnes/filtrex) for task filtering and routine activation. The syntax is spreadsheet-like:

### Task Filter Examples

```
# Tasks with work tag
hasTag("work")

# High-effort active tasks
status == "active" and points.total >= 5

# Stale tasks
age > 14 and inBacklog

# Complex condition
(hasTag("work") or hasTag("urgent")) and not hasTag("blocked")
```

### Routine Activation Examples

```
# Weekday mornings
isWeekday and hour >= 9 and hour < 12

# Specific days
dayOfWeek in ["mon", "wed", "fri"]

# Time range (using minutes since midnight)
time >= 540 and time < 1080  # 9:00 AM to 6:00 PM
```

## Data Model Quick Reference

### Task

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| title | string | Task name |
| description | string? | Optional details (Markdown) |
| status | enum | active, completed, canceled |
| tagPoints | Map | Tag ID → Points allocation |
| location | union | backlog or { sprint: SprintId } |
| skipState | object? | Skip type, timestamp, return time |
| recurrence | string? | RRULE for recurring templates |
| parentId | UUID? | Links to template or AI-split source |
| externalSource | object? | For synced tasks (read-only) |

### Sprint

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| startDate | Date | Always a Sunday |
| endDate | Date | Always a Saturday |
| capacityOverrides | Map | Tag ID → Points override |
| taskIds | Set | Tasks in this sprint |

### Routine

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | string | Display name |
| icon | string | Emoji or icon name |
| color | string | Hex color |
| priority | number | 1-10, higher wins conflicts |
| taskFilterExpression | string | Filtrex filter for tasks |
| activationExpression | string | Filtrex condition for activation |

## Status

🚧 **Design Phase** — Domain model is specified, PoC implementation pending.

## Documentation

- [DESIGN.md](./DESIGN.md) — Full domain model specification
- [DECISIONLOG.md](./DECISIONLOG.md) — Design decision history

## Future Roadmap

### Near Term
- [ ] PoC implementation with in-memory adapters
- [ ] CLI for testing commands and queries
- [ ] Basic React Native UI

### Medium Term
- [ ] Local persistence (SQLite)
- [ ] Session analytics and insights
- [ ] AI task splitting integration

### Long Term
- [ ] Jira/GitHub sync (read-only)
- [ ] Google Calendar integration for capacity adjustment
- [ ] Multi-device sync

## License

TBD
