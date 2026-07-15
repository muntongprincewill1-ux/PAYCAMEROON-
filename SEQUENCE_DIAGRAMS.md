# PayCameroon System Sequence Diagrams

This document outlines the sequential flow of messages, data, and logic across the platform's actors and backend services for key operational workflows.

## 1. User Registration & KYC Approval Sequence

This sequence details how a user registers and gets their KYC documents verified by the Compliance team.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Mobile/Web App
    participant AuthAPI as Auth Service
    participant KYCAPI as KYC Service
    participant DB as Database
    actor Compliance as Compliance Admin

    User->>Frontend: Enter Phone, Details & PIN
    Frontend->>AuthAPI: POST /api/auth/register
    AuthAPI->>DB: Create User (kycVerified: false)
    AuthAPI-->>Frontend: 201 Created + JWT Token
    Frontend-->>User: Show Dashboard (Limited Limits)

    User->>Frontend: Upload ID Document & Selfie
    Frontend->>KYCAPI: POST /api/kyc/submit (multipart/form-data)
    KYCAPI->>DB: Save KYC Application (status: 'pending')
    KYCAPI-->>Frontend: 200 OK
    Frontend-->>User: "Documents Under Review"

    Compliance->>Frontend: Open Compliance Dashboard
    Frontend->>KYCAPI: GET /api/kyc/pending
    KYCAPI-->>Frontend: Return list of pending KYCs
    Frontend-->>Compliance: Display KYC Applications

    Compliance->>Frontend: Click "Approve" for User
    Frontend->>KYCAPI: POST /api/kyc/approve { userId }
    KYCAPI->>DB: Update User (kycVerified: true)
    KYCAPI->>DB: Update KYC Application (status: 'approved')
    KYCAPI-->>Frontend: 200 OK
    
    KYCAPI-->>User: Push Notification "KYC Approved"
```

## 2. Peer-to-Peer (P2P) Transfer with AML Checking

This sequence illustrates a transfer between two users, highlighting the intervention of the AI-driven AML (Anti-Money Laundering) engine.

```mermaid
sequenceDiagram
    autonumber
    actor Sender
    participant App as Sender App
    participant TxAPI as Transaction API
    participant AML as AML/AI Engine
    participant DB as Ledger Database
    actor Recipient

    Sender->>App: Enter Recipient ID, Amount & PIN
    App->>TxAPI: POST /api/transactions/transfer
    TxAPI->>DB: Verify PIN & Check Sender Balance
    
    alt Insufficient Balance / Invalid PIN
        DB-->>TxAPI: Error
        TxAPI-->>App: 400 Bad Request
    else Valid Request
        TxAPI->>AML: Analyze Transfer (Velocity, Amount, History)
        
        alt Flagged by AML
            AML-->>TxAPI: Status = 'flagged', Severity = 'High'
            TxAPI->>DB: Log AMLAlert & Hold Transaction
            TxAPI-->>App: 403 "Transaction under review by Compliance"
        else Cleared by AML
            AML-->>TxAPI: Status = 'cleared'
            
            TxAPI->>DB: BEGIN TRANSACTION
            TxAPI->>DB: Debit Sender Balance (Amount + Fee)
            TxAPI->>DB: Credit Recipient Balance (Amount)
            TxAPI->>DB: Credit Revenue Wallet (Fee)
            TxAPI->>DB: Save Transaction Record (status: 'completed')
            TxAPI->>DB: COMMIT TRANSACTION
            
            TxAPI-->>App: 200 Success
            App-->>Sender: Show Transfer Receipt
            
            TxAPI-->>Recipient: Push Notification "You received funds!"
        end
    end
```

## 3. Agent Cash-In (Deposit) Sequence

The process of converting physical cash into digital e-money via an Agent.

```mermaid
sequenceDiagram
    autonumber
    actor User
    actor Agent
    participant AgentApp as Agent Dashboard
    participant TxAPI as Transaction API
    participant DB as Ledger Database

    User->>Agent: Hand over Physical Cash & provide PayCam ID
    Agent->>AgentApp: Enter User ID & Cash Amount & PIN
    AgentApp->>TxAPI: POST /api/agent/cash-in
    
    TxAPI->>DB: Verify Agent PIN & Check Agent Float Balance
    
    alt Insufficient Agent Float
        DB-->>TxAPI: Error: Low Balance
        TxAPI-->>AgentApp: 400 "Insufficient Float. Request Float from Treasury"
    else Sufficient Float
        TxAPI->>DB: BEGIN TRANSACTION
        TxAPI->>DB: Debit Agent Wallet (Amount)
        TxAPI->>DB: Credit User Wallet (Amount)
        
        Note right of TxAPI: Calculate Agent Commission
        TxAPI->>DB: Credit Agent Wallet (Commission Cut)
        TxAPI->>DB: Save Transaction (type: 'cash_in', status: 'completed')
        TxAPI->>DB: COMMIT TRANSACTION
        
        TxAPI-->>AgentApp: 200 Success
        AgentApp-->>Agent: Display Receipt & New Balance
        
        TxAPI-->>User: Push Notification "Deposit Successful via Agent"
    end
```

## 4. Merchant Revenue Withdrawal Sequence

The workflow for a Merchant withdrawing their digital revenue into a physical corporate bank account, requiring Finance approval.

```mermaid
sequenceDiagram
    autonumber
    actor Merchant
    participant MerchApp as Merchant Dashboard
    participant FinAPI as Finance API
    participant DB as Database
    participant BankAPI as External Banking Gateway
    actor Finance as Finance Admin

    Merchant->>MerchApp: Request Withdrawal to Bank (Amount)
    MerchApp->>FinAPI: POST /api/merchant/withdraw
    FinAPI->>DB: Check Merchant Balance
    FinAPI->>DB: Create ApprovalRequest (status: 'pending')
    FinAPI->>DB: Hold/Freeze Requested Amount
    FinAPI-->>MerchApp: 200 OK "Pending Finance Approval"

    Finance->>FinAPI: GET /api/finance/pending-requests
    FinAPI-->>Finance: Return list of withdrawal requests
    
    Finance->>FinAPI: POST /api/finance/approve-withdrawal { requestId }
    FinAPI->>DB: Debit Merchant Balance (Amount held)
    
    Note right of FinAPI: Process External Transfer
    FinAPI->>BankAPI: Trigger Wire Transfer to Merchant's Bank
    
    alt Bank API Success
        BankAPI-->>FinAPI: 200 OK (Wire confirmed)
        FinAPI->>DB: Update ApprovalRequest (status: 'approved')
        FinAPI->>DB: Log Audit (Finance Admin approved)
        FinAPI-->>Merchant: Push Notification "Withdrawal Approved & Processed"
    else Bank API Failure
        BankAPI-->>FinAPI: 500 Error
        FinAPI->>DB: Unfreeze Merchant Amount
        FinAPI->>DB: Update ApprovalRequest (status: 'failed')
        FinAPI-->>Finance: 500 "Bank API Error, transaction reversed"
    end
```

## 5. PayChat Support Ticket Sequence

How a user interacts with a customer support representative within the app.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as User App
    participant ChatAPI as PayChat API
    participant DB as Database
    actor Support as Support Rep

    User->>App: Open PayChat, type "I need help with a transaction"
    App->>ChatAPI: POST /api/chat/ticket/new
    ChatAPI->>DB: Create SupportTicket (status: 'open')
    ChatAPI->>DB: Save ChatMessage
    ChatAPI-->>App: 200 OK (Ticket Created)

    Support->>ChatAPI: GET /api/chat/tickets?status=open
    ChatAPI-->>Support: List of open tickets
    
    Support->>ChatAPI: POST /api/chat/ticket/assign { ticketId }
    ChatAPI->>DB: Update SupportTicket (assignedTo: Support.ID, status: 'in_progress')
    
    Support->>ChatAPI: POST /api/chat/message { text: "How can I help?" }
    ChatAPI->>DB: Save ChatMessage
    ChatAPI-->>User: Push Notification "New message from Support"
    
    User->>App: Replies with transaction ID
    App->>ChatAPI: POST /api/chat/message { text: "TXN-12345" }
    ChatAPI->>DB: Save ChatMessage
    
    Support->>DB: Read Transaction DB to investigate TXN-12345
    DB-->>Support: Transaction Details
    
    Support->>ChatAPI: POST /api/chat/ticket/close { ticketId }
    ChatAPI->>DB: Update SupportTicket (status: 'closed')
    ChatAPI-->>User: Push Notification "Your support ticket was resolved"
```
