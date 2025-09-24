module aptos_contract::wallet_system {
    use std::signer;
    use std::error;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_WALLET_ID_ALREADY_EXISTS: u64 = 1;
    const E_UPI_ID_ALREADY_EXISTS: u64 = 2;
    const E_WALLET_ID_NOT_FOUND: u64 = 3;
    const E_UPI_ID_NOT_FOUND: u64 = 4;
    const E_PAYMENT_REQUEST_NOT_FOUND: u64 = 5;
    const E_SPLIT_BILL_NOT_FOUND: u64 = 6;
    const E_NOT_AUTHORIZED: u64 = 7;
    const E_INVALID_AMOUNT: u64 = 8;
    const E_WALLET_NOT_INITIALIZED: u64 = 9;
    const E_EMI_NOT_FOUND: u64 = 10;
    const E_EMI_ALREADY_EXISTS: u64 = 11;
    const E_EMI_COMPLETED: u64 = 12;
    const E_EMI_PAYMENT_TOO_EARLY: u64 = 13;
    const E_INSUFFICIENT_BALANCE: u64 = 14;
    const E_INVALID_SPLIT_DATA: u64 = 15;
    const E_EMI_NOT_DUE: u64 = 16;

    /// Payment request status
    const STATUS_PENDING: u8 = 0;
    const STATUS_PAID: u8 = 1;
    const STATUS_REJECTED: u8 = 2;

    /// EMI status
    const EMI_STATUS_ACTIVE: u8 = 0;
    const EMI_STATUS_COMPLETED: u8 = 1;
    const EMI_STATUS_DEFAULTED: u8 = 2;

    /// Time constants (in microseconds)
    const SECONDS_IN_MONTH: u64 = 2629746000000; // 30.44 days in microseconds

    /// Individual payment request
    struct PaymentRequest has store, drop, copy {
        id: u64,
        from: address,           
        to: address,             
        amount: u64,             
        description: String,     
        status: u8,              
        created_at: u64,         
        paid_at: Option<u64>,    
    }

    /// Custom split entry for split bills
    struct SplitEntry has store, drop, copy {
        participant: address,
        amount: u64,
    }

    /// Split bill structure with custom amounts
    struct SplitBill has store, drop, copy {
        id: u64,
        creator: address,        
        total_amount: u64,       
        description: String,     
        split_entries: vector<SplitEntry>, // Custom amounts for each participant
        created_at: u64,         
        payment_requests: vector<u64>, 
    }

    /// EMI Agreement structure
    struct EmiAgreement has store, drop, copy {
        id: u64,
        user: address,           // User who will pay EMI
        company: address,        // Company receiving payments
        total_amount: u64,       // Total EMI amount
        monthly_installment: u64, // Amount to pay each month
        total_months: u64,       // Number of months
        months_paid: u64,        // How many months already paid
        start_date: u64,         // When EMI starts (timestamp)
        last_payment_date: Option<u64>, // Last successful payment
        status: u8,              // Active, Completed, Defaulted
        description: String,     // What the EMI is for
    }

    /// Main wallet registry resource
    struct WalletRegistry has key {
        // Existing mappings
        wallet_id_to_address: Table<String, address>,
        address_to_wallet_id: Table<address, String>,
        upi_id_to_address: Table<String, address>,
        address_to_upi_id: Table<address, String>,
        
        // Payment requests
        payment_requests: Table<u64, PaymentRequest>,
        user_payment_requests: Table<address, vector<u64>>,
        user_sent_requests: Table<address, vector<u64>>,
        
        // Split bills
        split_bills: Table<u64, SplitBill>,
        user_split_bills: Table<address, vector<u64>>,
        
        // EMI system
        emi_agreements: Table<u64, EmiAgreement>,
        user_emis: Table<address, vector<u64>>,        // EMIs user is paying
        company_emis: Table<address, vector<u64>>,     // EMIs company is receiving
        
        // Counters
        next_request_id: u64,
        next_split_id: u64,
        next_emi_id: u64,
    }

    /// Events
    #[event]
    struct WalletIdRegisteredEvent has drop, store {
        user: address,
        wallet_id: String,
        timestamp: u64,
    }

    #[event]
    struct UpiIdRegisteredEvent has drop, store {
        user: address,
        upi_id: String,
        timestamp: u64,
    }

    #[event]
    struct PaymentRequestCreatedEvent has drop, store {
        request_id: u64,
        from: address,
        to: address,
        amount: u64,
        description: String,
        timestamp: u64,
    }

    #[event]
    struct PaymentRequestPaidEvent has drop, store {
        request_id: u64,
        from: address,
        to: address,
        amount: u64,
        timestamp: u64,
    }

    #[event]
    struct SplitBillCreatedEvent has drop, store {
        split_id: u64,
        creator: address,
        total_amount: u64,
        participants_count: u64,
        timestamp: u64,
    }

    #[event]
    struct EmiAgreementCreatedEvent has drop, store {
        emi_id: u64,
        user: address,
        company: address,
        total_amount: u64,
        monthly_installment: u64,
        total_months: u64,
        timestamp: u64,
    }

    #[event]
    struct EmiPaymentSuccessEvent has drop, store {
        emi_id: u64,
        user: address,
        company: address,
        amount_paid: u64,
        months_remaining: u64,
        timestamp: u64,
    }

    #[event]
    struct EmiPaymentFailedEvent has drop, store {
        emi_id: u64,
        user: address,
        company: address,
        required_amount: u64,
        user_balance: u64,
        reason: String,
        timestamp: u64,
    }

    #[event]
    struct EmiCompletedEvent has drop, store {
        emi_id: u64,
        user: address,
        company: address,
        total_amount_paid: u64,
        timestamp: u64,
    }

    /// Initialize the wallet system
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        assert!(!exists<WalletRegistry>(admin_addr), error::already_exists(E_WALLET_NOT_INITIALIZED));
        
        let registry = WalletRegistry {
            wallet_id_to_address: table::new(),
            address_to_wallet_id: table::new(),
            upi_id_to_address: table::new(),
            address_to_upi_id: table::new(),
            payment_requests: table::new(),
            user_payment_requests: table::new(),
            user_sent_requests: table::new(),
            split_bills: table::new(),
            user_split_bills: table::new(),
            emi_agreements: table::new(),
            user_emis: table::new(),
            company_emis: table::new(),
            next_request_id: 1,
            next_split_id: 1,
            next_emi_id: 1,
        };
        
        move_to(admin, registry);
    }

    /// Register a wallet ID for a user
    public entry fun register_wallet_id(
        user: &signer, 
        admin_addr: address,
        wallet_id: String
    ) acquires WalletRegistry {
        let user_addr = signer::address_of(user);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(!table::contains(&registry.wallet_id_to_address, wallet_id), 
                error::already_exists(E_WALLET_ID_ALREADY_EXISTS));
        
        table::add(&mut registry.wallet_id_to_address, wallet_id, user_addr);
        table::add(&mut registry.address_to_wallet_id, user_addr, wallet_id);
        
        if (!table::contains(&registry.user_payment_requests, user_addr)) {
            table::add(&mut registry.user_payment_requests, user_addr, vector::empty());
        };
        if (!table::contains(&registry.user_sent_requests, user_addr)) {
            table::add(&mut registry.user_sent_requests, user_addr, vector::empty());
        };
        if (!table::contains(&registry.user_split_bills, user_addr)) {
            table::add(&mut registry.user_split_bills, user_addr, vector::empty());
        };
        if (!table::contains(&registry.user_emis, user_addr)) {
            table::add(&mut registry.user_emis, user_addr, vector::empty());
        };
        if (!table::contains(&registry.company_emis, user_addr)) {
            table::add(&mut registry.company_emis, user_addr, vector::empty());
        };
        
        event::emit(WalletIdRegisteredEvent {
            user: user_addr,
            wallet_id,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Register a UPI ID for a user
    public entry fun register_upi_id(
        user: &signer,
        admin_addr: address,
        upi_id: String
    ) acquires WalletRegistry {
        let user_addr = signer::address_of(user);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(!table::contains(&registry.upi_id_to_address, upi_id), 
                error::already_exists(E_UPI_ID_ALREADY_EXISTS));
        
        table::add(&mut registry.upi_id_to_address, upi_id, user_addr);
        table::add(&mut registry.address_to_upi_id, user_addr, upi_id);
        
        event::emit(UpiIdRegisteredEvent {
            user: user_addr,
            upi_id,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Create a payment request
    public entry fun create_payment_request(
        requester: &signer,
        admin_addr: address,
        to_wallet_id: String,
        amount: u64,
        description: String
    ) acquires WalletRegistry {
        let requester_addr = signer::address_of(requester);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        assert!(table::contains(&registry.wallet_id_to_address, to_wallet_id), 
                error::not_found(E_WALLET_ID_NOT_FOUND));
        let recipient_addr = *table::borrow(&registry.wallet_id_to_address, to_wallet_id);
        
        let request_id = registry.next_request_id;
        let payment_request = PaymentRequest {
            id: request_id,
            from: requester_addr,
            to: recipient_addr,
            amount,
            description,
            status: STATUS_PENDING,
            created_at: timestamp::now_microseconds(),
            paid_at: option::none(),
        };
        
        table::add(&mut registry.payment_requests, request_id, payment_request);
        
        let recipient_requests = table::borrow_mut(&mut registry.user_payment_requests, recipient_addr);
        vector::push_back(recipient_requests, request_id);
        
        let requester_requests = table::borrow_mut(&mut registry.user_sent_requests, requester_addr);
        vector::push_back(requester_requests, request_id);
        
        registry.next_request_id = registry.next_request_id + 1;
        
        event::emit(PaymentRequestCreatedEvent {
            request_id,
            from: requester_addr,
            to: recipient_addr,
            amount,
            description,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Pay a payment request
    public entry fun pay_request(
        payer: &signer,
        admin_addr: address,
        request_id: u64
    ) acquires WalletRegistry {
        let payer_addr = signer::address_of(payer);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(table::contains(&registry.payment_requests, request_id), 
                error::not_found(E_PAYMENT_REQUEST_NOT_FOUND));
        
        let request = table::borrow_mut(&mut registry.payment_requests, request_id);
        
        assert!(request.to == payer_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(request.status == STATUS_PENDING, error::invalid_state(E_PAYMENT_REQUEST_NOT_FOUND));
        
        request.status = STATUS_PAID;
        request.paid_at = option::some(timestamp::now_microseconds());
        
        event::emit(PaymentRequestPaidEvent {
            request_id,
            from: request.from,
            to: payer_addr,
            amount: request.amount,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Reject a payment request
    public entry fun reject_request(
        user: &signer,
        admin_addr: address,
        request_id: u64
    ) acquires WalletRegistry {
        let user_addr = signer::address_of(user);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(table::contains(&registry.payment_requests, request_id), 
                error::not_found(E_PAYMENT_REQUEST_NOT_FOUND));
        
        let request = table::borrow_mut(&mut registry.payment_requests, request_id);
        
        assert!(request.to == user_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(request.status == STATUS_PENDING, error::invalid_state(E_PAYMENT_REQUEST_NOT_FOUND));
        
        request.status = STATUS_REJECTED;
    }

    /// Create a split bill with custom amounts
    public entry fun create_split_bill(
        creator: &signer,
        admin_addr: address,
        total_amount: u64,
        description: String,
        participant_wallet_ids: vector<String>,
        participant_amounts: vector<u64>
    ) acquires WalletRegistry {
        let creator_addr = signer::address_of(creator);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(total_amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        let participants_len = vector::length(&participant_wallet_ids);
        let amounts_len = vector::length(&participant_amounts);
        
        // Validate that we have matching wallet IDs and amounts
        assert!(participants_len == amounts_len, error::invalid_argument(E_INVALID_SPLIT_DATA));
        assert!(participants_len > 0, error::invalid_argument(E_INVALID_SPLIT_DATA));
        
        // Convert wallet IDs to addresses and create split entries
        let split_entries = vector::empty<SplitEntry>();
        let total_split_amount = 0u64;
        
        let i = 0;
        while (i < participants_len) {
            let wallet_id = vector::borrow(&participant_wallet_ids, i);
            let amount = *vector::borrow(&participant_amounts, i);
            
            assert!(table::contains(&registry.wallet_id_to_address, *wallet_id), 
                    error::not_found(E_WALLET_ID_NOT_FOUND));
            let participant_addr = *table::borrow(&registry.wallet_id_to_address, *wallet_id);
            
            assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
            total_split_amount = total_split_amount + amount;
            
            let split_entry = SplitEntry {
                participant: participant_addr,
                amount,
            };
            vector::push_back(&mut split_entries, split_entry);
            i = i + 1;
        };
        
        // Validate that split amounts equal total amount
        assert!(total_split_amount == total_amount, error::invalid_argument(E_INVALID_SPLIT_DATA));
        
        let split_id = registry.next_split_id;
        let split_bill = SplitBill {
            id: split_id,
            creator: creator_addr,
            total_amount,
            description,
            split_entries,
            created_at: timestamp::now_microseconds(),
            payment_requests: vector::empty(),
        };
        
        // Create payment requests for each participant
        let request_ids = vector::empty<u64>();
        i = 0;
        while (i < participants_len) {
            let split_entry = vector::borrow(&split_entries, i);
            
            let request_id = registry.next_request_id;
            let payment_request = PaymentRequest {
                id: request_id,
                from: creator_addr,
                to: split_entry.participant,
                amount: split_entry.amount,
                description,
                status: STATUS_PENDING,
                created_at: timestamp::now_microseconds(),
                paid_at: option::none(),
            };
            
            table::add(&mut registry.payment_requests, request_id, payment_request);
            vector::push_back(&mut request_ids, request_id);
            
            // Add to participant's received requests
            if (!table::contains(&registry.user_payment_requests, split_entry.participant)) {
                table::add(&mut registry.user_payment_requests, split_entry.participant, vector::empty());
            };
            let participant_requests = table::borrow_mut(&mut registry.user_payment_requests, split_entry.participant);
            vector::push_back(participant_requests, request_id);
            
            registry.next_request_id = registry.next_request_id + 1;
            i = i + 1;
        };
        
        // Update split bill with request IDs
        let split_bill_mut = &mut split_bill;
        split_bill_mut.payment_requests = request_ids;
        
        table::add(&mut registry.split_bills, split_id, split_bill);
        
        // Add to creator's split bills
        if (!table::contains(&registry.user_split_bills, creator_addr)) {
            table::add(&mut registry.user_split_bills, creator_addr, vector::empty());
        };
        let creator_splits = table::borrow_mut(&mut registry.user_split_bills, creator_addr);
        vector::push_back(creator_splits, split_id);
        
        // Add to all participants' split bills
        i = 0;
        while (i < participants_len) {
            let split_entry = vector::borrow(&split_entries, i);
            if (!table::contains(&registry.user_split_bills, split_entry.participant)) {
                table::add(&mut registry.user_split_bills, split_entry.participant, vector::empty());
            };
            let user_splits = table::borrow_mut(&mut registry.user_split_bills, split_entry.participant);
            vector::push_back(user_splits, split_id);
            i = i + 1;
        };
        
        // Add to creator's sent requests
        let creator_requests = table::borrow_mut(&mut registry.user_sent_requests, creator_addr);
        i = 0;
        let req_len = vector::length(&request_ids);
        while (i < req_len) {
            vector::push_back(creator_requests, *vector::borrow(&request_ids, i));
            i = i + 1;
        };
        
        registry.next_split_id = registry.next_split_id + 1;
        
        event::emit(SplitBillCreatedEvent {
            split_id,
            creator: creator_addr,
            total_amount,
            participants_count: participants_len,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Create EMI agreement
    public entry fun create_emi_agreement(
        user: &signer,
        admin_addr: address,
        company_wallet_id: String,
        total_amount: u64,
        monthly_installment: u64,
        total_months: u64,
        description: String
    ) acquires WalletRegistry {
        let user_addr = signer::address_of(user);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(total_amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(monthly_installment > 0, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(total_months > 0, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(monthly_installment * total_months == total_amount, error::invalid_argument(E_INVALID_AMOUNT));
        
        assert!(table::contains(&registry.wallet_id_to_address, company_wallet_id), 
                error::not_found(E_WALLET_ID_NOT_FOUND));
        let company_addr = *table::borrow(&registry.wallet_id_to_address, company_wallet_id);
        
        let emi_id = registry.next_emi_id;
        let emi_agreement = EmiAgreement {
            id: emi_id,
            user: user_addr,
            company: company_addr,
            total_amount,
            monthly_installment,
            total_months,
            months_paid: 0,
            start_date: timestamp::now_microseconds(),
            last_payment_date: option::none(),
            status: EMI_STATUS_ACTIVE,
            description,
        };
        
        table::add(&mut registry.emi_agreements, emi_id, emi_agreement);
        
        // Add to user's EMIs
        let user_emis = table::borrow_mut(&mut registry.user_emis, user_addr);
        vector::push_back(user_emis, emi_id);
        
        // Add to company's EMIs
        let company_emis = table::borrow_mut(&mut registry.company_emis, company_addr);
        vector::push_back(company_emis, emi_id);
        
        registry.next_emi_id = registry.next_emi_id + 1;
        
        event::emit(EmiAgreementCreatedEvent {
            emi_id,
            user: user_addr,
            company: company_addr,
            total_amount,
            monthly_installment,
            total_months,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Collect EMI payment (called by company)
    public entry fun collect_emi_payment(
        company: &signer,
        admin_addr: address,
        emi_id: u64
    ) acquires WalletRegistry {
        let company_addr = signer::address_of(company);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        let current_time = timestamp::now_microseconds();
        
        assert!(table::contains(&registry.emi_agreements, emi_id), 
                error::not_found(E_EMI_NOT_FOUND));
        
        let emi = table::borrow_mut(&mut registry.emi_agreements, emi_id);
        
        // Verify company authorization
        assert!(emi.company == company_addr, error::permission_denied(E_NOT_AUTHORIZED));
        
        // Check if EMI is still active
        assert!(emi.status == EMI_STATUS_ACTIVE, error::invalid_state(E_EMI_COMPLETED));
        
        // Check if EMI is already completed
        assert!(emi.months_paid < emi.total_months, error::invalid_state(E_EMI_COMPLETED));
        
        // Check if enough time has passed since last payment (at least 25 days)
        if (option::is_some(&emi.last_payment_date)) {
            let last_payment = *option::borrow(&emi.last_payment_date);
            let time_since_last_payment = current_time - last_payment;
            assert!(time_since_last_payment >= (SECONDS_IN_MONTH - 432000000000), // Allow 5 days early
                   error::invalid_state(E_EMI_PAYMENT_TOO_EARLY));
        } else {
            // For first payment, check if at least 25 days have passed since start
            let time_since_start = current_time - emi.start_date;
            assert!(time_since_start >= (SECONDS_IN_MONTH - 432000000000),
                   error::invalid_state(E_EMI_NOT_DUE));
        };
        
        // Check user's balance
        let user_balance = coin::balance<AptosCoin>(emi.user);
        
        if (user_balance < emi.monthly_installment) {
            // Insufficient balance - emit failure event but don't abort
            event::emit(EmiPaymentFailedEvent {
                emi_id,
                user: emi.user,
                company: company_addr,
                required_amount: emi.monthly_installment,
                user_balance,
                reason: string::utf8(b"Insufficient balance"),
                timestamp: current_time,
            });
            return
        };
        
        // Note: In a real implementation, the actual coin transfer would be handled
        // through a separate transaction signed by the user. This function only
        // tracks the EMI status and assumes payment has been made externally.
        
        // Update EMI record
        emi.months_paid = emi.months_paid + 1;
        emi.last_payment_date = option::some(current_time);
        
        let months_remaining = emi.total_months - emi.months_paid;
        
        // Check if EMI is completed
        if (emi.months_paid == emi.total_months) {
            emi.status = EMI_STATUS_COMPLETED;
            
            event::emit(EmiCompletedEvent {
                emi_id,
                user: emi.user,
                company: company_addr,
                total_amount_paid: emi.total_amount,
                timestamp: current_time,
            });
        };
        
        event::emit(EmiPaymentSuccessEvent {
            emi_id,
            user: emi.user,
            company: company_addr,
            amount_paid: emi.monthly_installment,
            months_remaining,
            timestamp: current_time,
        });
    }

    /// View functions
    
    /// Get address by wallet ID
    #[view]
    public fun get_address_by_wallet_id(admin_addr: address, wallet_id: String): Option<address> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.wallet_id_to_address, wallet_id)) {
            option::some(*table::borrow(&registry.wallet_id_to_address, wallet_id))
        } else {
            option::none()
        }
    }

    /// Get address by UPI ID
    #[view]
    public fun get_address_by_upi_id(admin_addr: address, upi_id: String): Option<address> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.upi_id_to_address, upi_id)) {
            option::some(*table::borrow(&registry.upi_id_to_address, upi_id))
        } else {
            option::none()
        }
    }

    /// Get wallet ID by address
    #[view]
    public fun get_wallet_id_by_address(admin_addr: address, user_addr: address): Option<String> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.address_to_wallet_id, user_addr)) {
            option::some(*table::borrow(&registry.address_to_wallet_id, user_addr))
        } else {
            option::none()
        }
    }

    /// Get payment request details
    #[view]
    public fun get_payment_request(admin_addr: address, request_id: u64): Option<PaymentRequest> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.payment_requests, request_id)) {
            option::some(*table::borrow(&registry.payment_requests, request_id))
        } else {
            option::none()
        }
    }

    /// Get user's received payment requests
    #[view]
    public fun get_user_payment_requests(admin_addr: address, user_addr: address): vector<u64> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.user_payment_requests, user_addr)) {
            *table::borrow(&registry.user_payment_requests, user_addr)
        } else {
            vector::empty()
        }
    }

    /// Get user's sent payment requests
    #[view]
    public fun get_user_sent_requests(admin_addr: address, user_addr: address): vector<u64> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.user_sent_requests, user_addr)) {
            *table::borrow(&registry.user_sent_requests, user_addr)
        } else {
            vector::empty()
        }
    }

    /// Get split bill details
    #[view]
    public fun get_split_bill(admin_addr: address, split_id: u64): Option<SplitBill> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.split_bills, split_id)) {
            option::some(*table::borrow(&registry.split_bills, split_id))
        } else {
            option::none()
        }
    }

    /// Get user's split bills
    #[view]
    public fun get_user_split_bills(admin_addr: address, user_addr: address): vector<u64> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.user_split_bills, user_addr)) {
            *table::borrow(&registry.user_split_bills, user_addr)
        } else {
            vector::empty()
        }
    }

    /// Get EMI agreement details
    #[view]
    public fun get_emi_agreement(admin_addr: address, emi_id: u64): Option<EmiAgreement> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.emi_agreements, emi_id)) {
            option::some(*table::borrow(&registry.emi_agreements, emi_id))
        } else {
            option::none()
        }
    }

    /// Get user's EMI agreements (EMIs they are paying)
    #[view]
    public fun get_user_emis(admin_addr: address, user_addr: address): vector<u64> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.user_emis, user_addr)) {
            *table::borrow(&registry.user_emis, user_addr)
        } else {
            vector::empty()
        }
    }

    /// Get company's EMI agreements (EMIs they are receiving)
    #[view]
    public fun get_company_emis(admin_addr: address, company_addr: address): vector<u64> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.company_emis, company_addr)) {
            *table::borrow(&registry.company_emis, company_addr)
        } else {
            vector::empty()
        }
    }

    /// Get UPI ID by address
    #[view]
    public fun get_upi_id_by_address(admin_addr: address, user_addr: address): Option<String> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.address_to_upi_id, user_addr)) {
            option::some(*table::borrow(&registry.address_to_upi_id, user_addr))
        } else {
            option::none()
        }
    }
}