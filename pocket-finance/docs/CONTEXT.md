# Pocket Finance App

> A payment application that simplifies transactions through composable on-chain AI agents.

## Overview

Pocket Finance enables users to manage payroll, transfers, payments, invoices, and more within a seamless, interoperable financial ecosystem.

## Core Components

### Authentication
- Powered by Privy Infrastructure with Solana network integration
- Embedded wallet creation during signup
- Message signing for identity verification
- User data persistence in Supabase/MongoDB

### Application Screens

#### 1. Welcome Screen
- Prominent logo display
- Tagline: "One agent, all things payment"
- Login functionality with modal interface

#### 2. Dashboard
**Header**
- Logo
- Dark mode toggle
- Sidebar controls

**Navigation Sidebar**
- Chats (default view)
- Accounts management
- Asset tracking
  - SOL, USDC balances
  - Jupiter Swap integration
  - Swap Agent functionality
- Transaction monitoring
  - Inflow/outflow tracking
  - Pending transaction status
  - Historical records
- User controls
  - Address management
  - Logout
  - Wallet funding
  - Balance checking

#### 3. Chat Interface
- Welcome prompt
- Input system
  - Query textbox
  - AI model selector
- Quick action cards
  - Staking
  - Trading
  - Invoice creation
  - Batch payments

### AI Agent System

#### Agent Types
- **Swap Agent**: Jupiter integration for token exchanges
- **Stake Agent**: Staking operations
- **Invoice Agents**:
  - Creation
  - Payment processing
- **Payment Agents**:
  - Single transfers
  - Batch processing
  - Scheduled transactions
  - Autonomous operations

#### Interaction Flow
1. User initiates request
2. System checks requirements
3. Automatic resource management (e.g., token swaps if needed)
4. Preview generation
5. User confirmation
6. Execution

### Data Architecture

#### Database Schema
- Users
  - Wallet information
  - Authentication details
- Transactions
  - Payment records
  - Flow tracking
- Invoices
  - Generation data
  - Status tracking
- Agent Logs
  - Execution records
  - Audit trail

##### Agent Logs Table
```sql
agent_logs (
  id: uuid PRIMARY KEY,
  created_at: timestamp,
  agent_type: enum ['SWAP', 'STAKE', 'INVOICE', 'PAYMENT'],
  user_id: uuid FOREIGN KEY,
  action: string,
  status: enum ['SUCCESS', 'FAILURE'],
  details: jsonb,
  transaction_id: uuid FOREIGN KEY nullable
)
```

### Project Structure
```
pocket-finance/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── agents/           # Agent-specific components
│   ├── lib/
│   │   ├── agents/           # Agent logic
│   │   ├── blockchain/       # Blockchain interactions
│   │   ├── db/              # Database operations
│   │   └── utils/           # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── styles/              # Global styles
│   ├── types/              # TypeScript types
│   └── config/             # Configuration files
├── public/                 # Static assets
├── tests/                 # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/               # Build and deployment scripts
├── docs/                  # Documentation
└── prisma/               # Database schema and migrations
    ├── schema.prisma
    └── migrations/
```

Key Features of the Structure:
- Clear separation of concerns
- Feature-based organization
- Scalable component architecture
- Dedicated agent system organization
- Comprehensive testing structure
- Centralized configuration management

The database schema is designed for:
- Scalability
- Relationship tracking
- Comprehensive logging
- Flexible metadata storage through JSONB fields

The folder structure follows modern Next.js conventions while maintaining clear separation of concerns and scalability for the agent system.
