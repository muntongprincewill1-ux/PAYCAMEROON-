# PayCameroon Core Activity Diagrams

This document outlines the core activity flows within the PayCameroon system, detailing the step-by-step processes for the most critical user journeys.

## 1. User Registration & KYC Approval Flow

This activity diagram illustrates how a new user registers, submits their KYC documents, and how the Compliance team processes the application.

```mermaid
stateDiagram-v2
    [*] --> DownloadApp
    DownloadApp --> RegisterAccount: Enter Phone & PIN
    RegisterAccount --> OTPVerification: Verify Phone Number
    OTPVerification --> AccountCreated: Basic Access Granted
    
    AccountCreated --> SubmitKYC: Upload ID & Selfie
    SubmitKYC --> PendingReview: Status = Pending
    
    state ComplianceReview {
        PendingReview --> InspectDocuments: Compliance Officer checks ID
        InspectDocuments --> Decision
        Decision --> Approved: Documents Valid
        Decision --> Rejected: Documents Invalid/Fraudulent
    }
    
    Approved --> UpgradedAccount: Higher Transaction Limits
    Rejected --> RequestResubmission: Notification sent to User
    RequestResubmission --> SubmitKYC
    
    UpgradedAccount --> [*]
```

## 2. Cash-In (Deposit) Flow via Agent

This diagram details the physical-to-digital flow when a user visits an Agent to deposit cash into their PayCameroon wallet.

```mermaid
stateDiagram-v2
    [*] --> VisitAgent
    VisitAgent --> ProvideDetails: User gives Cash & PayCam ID
    ProvideDetails --> AgentInitiatesDeposit: Agent enters amount
    
    state SystemValidation {
        AgentInitiatesDeposit --> CheckAgentFloat: System checks Agent's e-money
        CheckAgentFloat --> SufficientFloat
        CheckAgentFloat --> InsufficientFloat: Agent needs to Request Float
    }
    
    SufficientFloat --> ConfirmTransaction: Agent confirms via PIN
    ConfirmTransaction --> ProcessTransfer: System debits Agent, credits User
    
    ProcessTransfer --> CalculateCommission: System calculates Agent fee
    CalculateCommission --> CreditAgentCommission: Add fee to Agent's Commission Wallet
    CreditAgentCommission --> NotifyUser: "Deposit Successful"
    NotifyUser --> NotifyAgent: "Transaction Complete"
    
    NotifyAgent --> [*]
    InsufficientFloat --> [*]: Transaction Failed
```

## 3. Peer-to-Peer (P2P) Transfer Flow

The standard process of one user sending money to another user.

```mermaid
stateDiagram-v2
    [*] --> InitiateTransfer: Sender enters Recipient ID/Phone
    InitiateTransfer --> EnterAmount
    EnterAmount --> SystemCheckBalance
    
    SystemCheckBalance --> SufficientFunds
    SystemCheckBalance --> InsufficientFunds
    
    InsufficientFunds --> [*]: Show Error
    
    SufficientFunds --> EnterPIN: Sender authorizes
    EnterPIN --> AMLCheck: System scans for anomalies
    
    state AML_Gateway {
        AMLCheck --> Clear: Pattern normal
        AMLCheck --> Flagged: High velocity/amount
    }
    
    Flagged --> BlockTransaction: Alert Compliance
    BlockTransaction --> [*]: Transaction Held
    
    Clear --> ExecuteTransfer
    ExecuteTransfer --> DebitSender
    ExecuteTransfer --> CreditRecipient
    
    DebitSender --> SendNotifications
    CreditRecipient --> SendNotifications
    
    SendNotifications --> [*]
```

## 4. Merchant Payment & Revenue Withdrawal Flow

How a user pays a merchant, and how the merchant cashes out their earnings.

```mermaid
stateDiagram-v2
    [*] --> UserScansQR: Or enters Merchant ID
    UserScansQR --> EnterPaymentAmount
    EnterPaymentAmount --> ConfirmPayment
    ConfirmPayment --> ProcessPayment: Deduct from User, Add to Merchant
    ProcessPayment --> MerchantReceivesFunds
    
    MerchantReceivesFunds --> RequestWithdrawal: Merchant wants cash in Bank/MoMo
    RequestWithdrawal --> PendingFinanceApproval
    
    state FinanceApproval {
        PendingFinanceApproval --> ReviewWithdrawal: Finance Admin checks balance
        ReviewWithdrawal --> Approve
        ReviewWithdrawal --> Reject
    }
    
    Reject --> ReturnFundsToMerchant
    ReturnFundsToMerchant --> [*]
    
    Approve --> DeductWithdrawalFee: Apply system tax/fee
    DeductWithdrawalFee --> CreditPlatformRevenue
    CreditPlatformRevenue --> TransferToBank: External API / Manual Wire
    TransferToBank --> MarkAsCompleted
    
    MarkAsCompleted --> [*]
```

## Description of the Core Activities

1. **KYC Flow**: Ensures regulatory compliance by forcing users to submit documents, which are manually reviewed by a Compliance Officer before lifting account restrictions.
2. **Cash-In Flow**: The critical link between physical cash and digital money. It involves the Agent's digital float, the user's receiving wallet, and the automated calculation and distribution of the Agent's commission.
3. **P2P Flow**: Highlights the seamless transfer of funds, but crucially includes the automated **AML (Anti-Money Laundering) Check** that intercepts the transaction if AI heuristics detect fraud.
4. **Merchant Flow**: Shows the end-to-end lifecycle of commercial money, from a user paying via QR code to the merchant requesting a corporate withdrawal, which requires Finance Admin approval and applies system taxes/fees.
