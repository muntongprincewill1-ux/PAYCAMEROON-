# PayCameroon Comprehensive Activity Diagrams

This document provides a complete set of activity diagrams detailing every functional workflow within the PayCameroon system. It maps the end-to-end journey of transactions, approvals, and system interactions across all user roles.

## 1. Authentication & Profile Management Flow

Describes the process of user registration, login, and managing personal settings (Password, PIN, Language).

```mermaid
stateDiagram-v2
    [*] --> OpenApp
    OpenApp --> CheckAuth: Is User Logged In?
    
    CheckAuth --> Login: No (Existing User)
    CheckAuth --> Register: No (New User)
    CheckAuth --> Dashboard: Yes
    
    Register --> EnterDetails: Phone, Password, Role
    EnterDetails --> VerifyOTP
    VerifyOTP --> SetupPIN
    SetupPIN --> Dashboard
    
    Login --> EnterCredentials
    EnterCredentials --> Dashboard: Success
    EnterCredentials --> Login: Failure
    
    Dashboard --> Settings: User navigates to Settings
    
    state Settings {
        UpdatePassword --> SaveChanges
        UpdatePIN --> SaveChanges
        ChangeLanguage --> ApplyUIUpdate
    }
    
    SaveChanges --> Dashboard
    ApplyUIUpdate --> Dashboard
```

## 2. KYC Submission & Compliance Review Flow

Describes how users submit compliance documents and how the Compliance Officer processes them.

```mermaid
stateDiagram-v2
    [*] --> UserDashboard
    UserDashboard --> SubmitKYC: User uploads ID & Details
    SubmitKYC --> StatusPending: DB updated to 'Pending'
    
    StatusPending --> ComplianceDashboard: Officer views queue
    ComplianceDashboard --> ReviewApplication
    
    state ReviewApplication {
        CheckDocs --> Approve
        CheckDocs --> Reject
    }
    
    Approve --> UpdateUserLimits: KYC = true
    UpdateUserLimits --> NotifyUser: "KYC Approved"
    
    Reject --> FlagReason: Add rejection note
    FlagReason --> NotifyUser: "KYC Rejected, Please Resubmit"
    
    NotifyUser --> [*]
```

## 3. Peer-to-Peer (P2P) Transfer & AML Flow

Describes the process of sending money between users, including the AI-driven Anti-Money Laundering (AML) checks.

```mermaid
stateDiagram-v2
    [*] --> InitiateTransfer: Enter PayCam ID/Phone & Amount
    InitiateTransfer --> ValidateBalance
    
    ValidateBalance --> Insufficient: Show Error
    Insufficient --> [*]
    
    ValidateBalance --> EnterPIN: Balance OK
    EnterPIN --> AMLGateway: Run heuristics
    
    state AMLGateway {
        CheckPatterns --> Flagged: Suspicious Activity
        CheckPatterns --> Cleared: Normal Activity
    }
    
    Flagged --> BlockTx: Hold Funds
    BlockTx --> GenerateAlert: Send to Compliance Dashboard
    GenerateAlert --> [*]: Await Manual Review
    
    Cleared --> DeductSender
    DeductSender --> CreditRecipient
    CreditRecipient --> CalculatePlatformFee
    CalculatePlatformFee --> CreditRevenueWallet
    CreditRevenueWallet --> SendNotifications
    
    SendNotifications --> [*]
```

## 4. Cash-In (Deposit) Flow via Agent or MoMo

Describes how a user adds funds to their digital wallet via an Agent or external Mobile Money provider.

```mermaid
stateDiagram-v2
    [*] --> SelectDepositMethod
    
    SelectDepositMethod --> ViaMoMo
    SelectDepositMethod --> ViaAgent
    
    ViaMoMo --> EnterMoMoDetails: Phone & Amount
    EnterMoMoDetails --> ExternalGateway: Trigger MoMo Prompt
    ExternalGateway --> UserApprovesMoMoPIN
    UserApprovesMoMoPIN --> CreditUserWallet
    
    ViaAgent --> GiveCashToAgent
    GiveCashToAgent --> AgentEntersDeposit: Agent inputs User ID & Amount
    AgentEntersDeposit --> CheckAgentFloat
    
    CheckAgentFloat --> InsufficientFloat: Transaction Fails
    CheckAgentFloat --> ConfirmWithPIN: Balance OK
    
    ConfirmWithPIN --> DeductAgentFloat
    DeductAgentFloat --> CreditUserWallet
    CreditUserWallet --> DistributeCommissions: Agent gets % cut
    
    DistributeCommissions --> SendNotifications
    CreditUserWallet --> SendNotifications
    SendNotifications --> [*]
```

## 5. Cash-Out (Withdrawal) Flow via Agent/Merchant

Describes how a user converts digital funds into physical cash through an Agent or Merchant.

```mermaid
stateDiagram-v2
    [*] --> UserInitiatesWithdrawal
    UserInitiatesWithdrawal --> ScanAgentQR: Or enter Agent/Merchant ID
    ScanAgentQR --> EnterAmountAndPIN
    
    EnterAmountAndPIN --> ValidateUserBalance
    ValidateUserBalance --> Insufficient: Fails
    
    ValidateUserBalance --> DeductUserWallet: Balance OK
    DeductUserWallet --> CalculateFees: Determine Agent/Merchant Commission
    CalculateFees --> CreditAgentWallet: Add principal + commission
    CreditAgentWallet --> HandOverCash: Agent/Merchant gives physical cash
    
    HandOverCash --> SendNotifications
    SendNotifications --> [*]
```

## 6. Merchant Payment & Revenue Withdrawal Flow

Describes how merchants receive payments and request bank/MoMo withdrawals requiring Finance approval.

```mermaid
stateDiagram-v2
    [*] --> UserScansMerchantQR
    UserScansMerchantQR --> EnterAmountAndPIN
    EnterAmountAndPIN --> ProcessPayment
    ProcessPayment --> DeductUser
    DeductUser --> CreditMerchant
    
    CreditMerchant --> MerchantDashboard: Balance Updates
    MerchantDashboard --> RequestWithdrawal: Merchant wants cash out
    RequestWithdrawal --> StatusPending: Withdrawal added to queue
    
    StatusPending --> FinanceDashboard: Admin reviews request
    FinanceDashboard --> AdminDecision
    
    state AdminDecision {
        ApproveWithdrawal --> ProcessExternalWire: Bank/MoMo transfer
        RejectWithdrawal --> RefundMerchantWallet
    }
    
    ProcessExternalWire --> DeductPlatformTax: If applicable
    DeductPlatformTax --> MarkAsComplete
    
    MarkAsComplete --> SendNotifications
    RefundMerchantWallet --> SendNotifications
    
    SendNotifications --> [*]
```

## 7. Agent Float Request & B2B Transfer Flow

Describes how Agents request digital float from the Treasury and how they can send float to other Agents/Merchants.

```mermaid
stateDiagram-v2
    [*] --> AgentDashboard
    
    AgentDashboard --> RequestFloat: Needs liquidity
    RequestFloat --> EnterBankDepositDetails: Proof of payment
    EnterBankDepositDetails --> StatusPending: Queued for Finance
    
    StatusPending --> FinanceAdminReview: Finance Dashboard
    FinanceAdminReview --> AdminDecision
    
    state AdminDecision {
        ApproveFloat --> DeductTreasuryWallet
        DeductTreasuryWallet --> CreditAgentWallet
        RejectFloat --> DiscardRequest
    }
    
    AgentDashboard --> SendFloatToPeer: B2B Transfer
    SendFloatToPeer --> EnterPeerIDAndAmount: Agent/Merchant ID
    EnterPeerIDAndAmount --> ValidateAgentBalance
    ValidateAgentBalance --> DeductSenderAgent
    DeductSenderAgent --> CreditRecipientPeer
    
    CreditAgentWallet --> NotifyUsers
    DiscardRequest --> NotifyUsers
    CreditRecipientPeer --> NotifyUsers
    
    NotifyUsers --> [*]
```

## 8. Store & Utility Services Flow

Describes purchasing eSIMs, swapping networks, or paying utility bills.

```mermaid
stateDiagram-v2
    [*] --> OpenStore
    OpenStore --> SelectService
    
    SelectService --> BuyeSIM
    SelectService --> SwapeSIM
    SelectService --> PayBills
    
    BuyeSIM --> SelectPlan: Data/Calls
    SwapeSIM --> SelectNetwork: MTN/Orange
    PayBills --> EnterBillDetails: ENEO/CDE
    
    SelectPlan --> ConfirmAndPIN
    SelectNetwork --> ConfirmAndPIN
    EnterBillDetails --> ConfirmAndPIN
    
    ConfirmAndPIN --> ValidateBalance
    ValidateBalance --> ExecuteService: Call API
    ExecuteService --> GenerateAsset: QR Code generated for eSIM
    GenerateAsset --> DeductWallet
    DeductWallet --> SendNotifications
    
    SendNotifications --> [*]
```

## 9. Support & PayChat System Flow

Describes how users/agents/merchants interact with support.

```mermaid
stateDiagram-v2
    [*] --> OpenPayChat
    OpenPayChat --> StartConversation: Send Message
    StartConversation --> TicketCreated: Assigned 'Open'
    
    TicketCreated --> SupportDashboard: Rep views queue
    SupportDashboard --> ReadMessage
    
    ReadMessage --> Investigate: Rep searches User/Tx History
    Investigate --> SendReply
    
    SendReply --> UserReceivesReply
    UserReceivesReply --> ConversationContinues
    ConversationContinues --> ResolveTicket: Issue fixed
    
    ResolveTicket --> TicketClosed
    TicketClosed --> [*]
```

## 10. Super Admin System Configuration Flow

Describes how the Super Admin manages global platform variables.

```mermaid
stateDiagram-v2
    [*] --> AdminDashboard
    AdminDashboard --> NavigateToSettings
    
    NavigateToSettings --> UpdateFees: Change % limits
    NavigateToSettings --> UpdateCommissions: Modify Agent/Merchant splits
    NavigateToSettings --> UpdateBranding: Change Logo/Text
    
    UpdateFees --> SaveToDatabase
    UpdateCommissions --> SaveToDatabase
    UpdateBranding --> SaveToDatabase
    
    SaveToDatabase --> SystemBroadcast: Update cached settings
    SystemBroadcast --> AllUsers: New fees/branding applied globally
    
    AllUsers --> [*]
```
