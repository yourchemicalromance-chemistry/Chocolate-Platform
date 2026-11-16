# CHEMISTRY — CREATION BIBLE

**Product:** CHEMISTRY  
**Tagline:** Your Chemical Romance.

> Don't predict love. Create opportunities for it.

---

# 1. Purpose of the Creation Bible

The Creation Bible records how CHEMISTRY is built and, most importantly, **why important decisions are made**.

The product handoff defines the intended product and experience.

The Creation Bible records the actual development decisions, architectural principles, design decisions, implementation rules, and important changes made during development.

### Decision format

Important decisions should be documented as:

**Decision → Why → Implementation → Result**

This document is a living document and will evolve throughout development.

---

# 2. Product Foundation

CHEMISTRY is an India-first contemporary Gen-Z dating application.

CHEMISTRY is not an AI compatibility-score product.

The core philosophy is:

> **Don't predict love. Create opportunities for it.**

The product should create opportunities for people to discover relationships rather than attempting to calculate or predict love.

---

# 3. Core Product Model

## INTENT — What do I want?

### Fun Dating

For people interested in:

- Casual dating
- Flirting
- Exploring
- Meeting people without immediate commitment

### Serious Seekers

For people interested in:

- Long-term relationships
- Commitment
- Life partners
- Marriage-oriented relationships

---

# 4. DISCOVERY — How do I want to find someone?

CHEMISTRY provides three discovery modes.

## Algorithmic Recommendations

A recommendation-driven discovery experience using relevant signals.

Recommendations are not presented as destiny or fake compatibility scores.

CHEMISTRY does not use concepts such as:

> "92% compatibility"

---

## Self Search

The user controls discovery by searching and filtering profiles themselves.

---

## Kismat

Kismat is the pure-chance discovery experience.

The system selects:

**Five random eligible profiles.**

Kismat does not use:

- Compatibility ranking
- Popularity weighting
- Paid boosting

Only safety and eligibility rules apply.

### Core discovery statement

> **Algorithm finds patterns.**
>
> **Search finds preferences.**
>
> **Kismat finds the unexpected.**

---

# 5. Technology Foundation

CHEMISTRY is being built as the actual mobile application from Day 1.

We are not building a disposable web prototype.

### Technology Stack

- Expo Development Platform
- React Native
- TypeScript

### Initial Platform

Android first.

### Future Platform

iOS.

---

# 6. Development Architecture

The critical architectural principle is:

> **At the end of the frontend sprint, only the real backend should remain to be connected.**

The frontend must therefore be designed so that mock services can later be replaced by real backend services without rebuilding the screens.

### Current architecture

```text
UI
 ↓
Service Layer
 ↓
Mock Service




##### 

UI
 ↓
Same Service Layer
 ↓
Real API
 ↓
VPS Backend
 ↓
Database
Planned service layer
authService
profileService
discoveryService
searchService
matchService
messageService
kismatService
notificationService
settingsService
safetyService
7. UI Architecture Principle

CHEMISTRY uses a hierarchical UI architecture.

Screen
 ↓
Layout Containers
 ↓
Sections
 ↓
Reusable Components
 ↓
UI Primitives

A typical screen may contain:

Main screen wrapper
Header container
Content container
Sections
Reusable feature components
Bottom navigation where applicable
Container principle

A container should exist because it has a meaningful layout responsibility.

Examples:

controlling spacing
alignment
scrolling
positioning
sizing
grouping related content

We should avoid meaningless nested wrappers.

8. Component Reuse Principle

Reusable UI components should be created when a component has genuine reuse or meaningful responsibility.

Examples include:

Buttons
Inputs
Tabs
Cards
Avatars
Modals
Headers
Navigation
Drawers
Typography
Loading states
Empty states
Error states

We avoid both extremes:

Avoid

Duplicating the same UI and styling across multiple screens.

Also avoid

Creating a separate component file for every trivial <View>.

The objective is a clean, reusable component system.

9. Design System Principle

CHEMISTRY uses centralized design tokens.

The design system should provide a single source of truth for:

Colors
Typography
Spacing
Border radii
Shadows
Gradients
Animation
Buttons
Inputs
Tabs
Cards
Navigation
Interaction states

Individual screens should not independently invent visual values.

10. Visual Identity
Permanent Brand Foundation
Midnight
#100B16
Ivory
#F8F4F0
Deep Plum
#4B164C

These form the permanent CHEMISTRY brand foundation.

11. Initial Atmosphere — MOONLIGHT

The first CHEMISTRY visual atmosphere is:

MOONLIGHT

The atmosphere uses:

Midnight navy
Indigo
Electric blue
Lavender
Pink
Silver
Intended feeling

Dark + electric + mysterious + romantic

Future atmospheres may be introduced later while keeping the underlying CHEMISTRY brand recognizable.

12. Theme Implementation Decision
Decision

Visual design values are centralized inside the theme/ directory.

Why

CHEMISTRY needs strong visual consistency across the entire application.

A color, spacing value, radius, typography rule, or other visual token should not be independently reinvented on every screen.

Implementation

Screens and reusable components consume centralized theme values.

Example:

theme/
├── colors.ts
├── typography.ts
├── spacing.ts
├── radii.ts
└── ...

Theme files will be created as they become necessary.

We will not create unnecessary theme files in advance.


# 12A. Moonlight Design Token System

The initial Moonlight design system is built from centralized tokens.

## Color Tokens

Permanent CHEMISTRY brand colors:

- Midnight — `#100B16`
- Ivory — `#F8F4F0`
- Deep Plum — `#4B164C`

Moonlight atmosphere:

- Midnight navy
- Indigo
- Electric blue
- Lavender
- Pink
- Silver

## Spacing Tokens

The application uses a standardized spacing vocabulary:

- `xs` — 4
- `sm` — 8
- `md` — 16
- `lg` — 24
- `xl` — 32
- `xxl` — 48
- `xxxl` — 64

These values provide the default spatial rhythm throughout the application.

## Radius Tokens

The initial shape vocabulary is:

- `sm` — 8
- `md` — 12
- `lg` — 16
- `xl` — 24
- `pill` — 999

These are defaults for controls, cards, surfaces, modals and other UI elements.

## Typography Tokens

Typography is organized by semantic role rather than arbitrary font sizes.

Roles include:

- Display
- Heading 1
- Heading 2
- Heading 3
- Body Large
- Body
- Body Small
- Label
- Caption

The initial system deliberately does not lock the application to a specific font family. Font selection will be evaluated against actual Android rendering before becoming a permanent dependency.

## Gradient Tokens

Moonlight gradients are named by purpose:

- `background`
- `electric`
- `romance`
- `lavender`
- `silver`

Gradient definitions are centralized so individual screens do not invent their own gradient combinations.

## Design-System Rule

Screens and components consume these centralized tokens instead of independently defining visual values.

The purpose is to maintain a consistent CHEMISTRY visual language while allowing the global visual system to evolve without rewriting individual screens.


13. Development Method

CHEMISTRY will be built page-by-page.

For each page:

Define the layout.
Identify reusable components.
Create required components.
Assemble the page.
Connect mock data/services.
Test the page.
Commit the milestone to Git.
Push the milestone to GitHub.
Move to the next page.

This prevents large amounts of untested code from accumulating.

14. Version Control

Git and GitHub are part of the project from Day 1.

Repository
your-chemical-romance
GitHub organization/account
yourchemicalromance-chemistry
Development identity
Your Chemical Romance
chemicalromance2026@gmail.com
Version-control principle

Meaningful development milestones should be committed and pushed.

GitHub provides:

Source control
Development history
Backup
Rollback capability
Progress tracking
15. Current Development State

The project foundation has been created using Expo.

Current stack:

Expo
React Native
TypeScript

Git has been initialized.

The repository is using:

main

The project is connected to the CHEMISTRY GitHub repository.

The working tree was verified clean before the first GitHub push.

16. Day 1 Development Objective

Day 1 focuses on establishing the foundation rather than rushing into feature development.

Initial objectives:

Project structure
Architecture
Navigation foundation
Theme foundation
Splash
Landing

The design system must be established before large-scale screen development.

17. Current Build Philosophy

CHEMISTRY should feel like a real mobile dating application.

It should not feel like:

A technical dashboard
An AI research interface
A website pretending to be an app
A collection of static mock screens

The desired experience is:

Something might happen here.

The product should be:

Photo-first
Expressive
Fast
Human
Romantic
Playful
Contemporary
18. Mock Data Philosophy

Mock data must behave realistically.

The frontend should contain meaningful application state rather than simply navigating between static screens.

Example:

User
 ↓
Create Profile
 ↓
Select Intent
 ↓
Select Discovery
 ↓
Enter Dashboard
 ↓
Discover Profiles
 ↓
Like
 ↓
Mutual Match Simulated
 ↓
Match Screen
 ↓
Conversation
 ↓
Messages

Kismat:

Enter Kismat
 ↓
Animation
 ↓
Random Eligible Selection
 ↓
Five Profiles Revealed
 ↓
Profile View
 ↓
Like / Pass
19. Navigation Principle

Navigation is divided according to frequency and importance.

Bottom navigation

Used for things users do frequently.

Initial concept:

Home
Discover
Chats
Likes
Profile
Side menu

Used for secondary and utility functions.

Includes:

Discover
Kismat
Matches
Appearance
Settings
Safety & Privacy
Notifications
Help & Support
Log Out

Kismat remains prominent because it is a core CHEMISTRY differentiator.

20. Creation Bible Rule

Whenever an important decision is made during development, record it here.

A decision should explain:

WHAT

What was decided?

WHY

Why was it decided?

HOW

How will it be implemented?

RESULT

What effect does the decision have on the product?

This prevents CHEMISTRY from becoming a collection of disconnected implementation choices.

21. Current Status
Completed
Expo project created
React Native + TypeScript foundation created
Project directory structure created
Git initialized
Git identity configured locally
main branch established
GitHub remote configured
Initial project pushed to GitHub
theme/colors.ts created
Initial CHEMISTRY color tokens established
Creation Bible established
Currently building

Day 1 — Moonlight Design System

Next

Continue establishing the remaining design-system foundations before building the first application screens.

22. Guiding Principle

Build the experience first. Connect the backend later without rebuilding the experience.

And above everything:

Don't predict love. Create opportunities for it.