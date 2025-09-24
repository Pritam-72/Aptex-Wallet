module aptos_contract::wallet_system {
    use std::signer;
    use std::error;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::timestamp;
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

    /// Payment request status
    const STATUS_PENDING: u8 = 0;
    const STATUS_PAID: u8 = 1;
    const STATUS_REJECTED: u8 = 2;

    /// Individual payment request
    struct PaymentRequest has store, drop, copy {
        id: u64,
        from: address,           // Who is requesting money
        to: address,             // Who should pay
        amount: u64,             // Amount requested (in smallest unit, e.g., octas for APT)
        description: String,     // Description of the request
        status: u8,              // 0: Pending, 1: Paid, 2: Rejected
        created_at: u64,         // Timestamp
        paid_at: Option<u64>,    // Timestamp when paid
    }

    /// Split bill structure
    struct SplitBill has store, drop, copy {
        id: u64,
        creator: address,        // Who created the split bill
        total_amount: u64,       // Total bill amount
        description: String,     // What the bill is for
        participants: vector<address>, // All participants including creator
        amount_per_person: u64,  // Amount each person needs to pay
        created_at: u64,         // When the split was created
        payment_requests: vector<u64>, // IDs of payment requests generated
    }

    /// Main wallet registry resource
    struct WalletRegistry has key {
        // Mappings
        wallet_id_to_address: Table<String, address>,
        address_to_wallet_id: Table<address, String>,
        upi_id_to_address: Table<String, address>,
        address_to_upi_id: Table<address, String>,
        
        // Payment requests
        payment_requests: Table<u64, PaymentRequest>,
        user_payment_requests: Table<address, vector<u64>>, // Requests received by user
        user_sent_requests: Table<address, vector<u64>>,    // Requests sent by user
        
        // Split bills
        split_bills: Table<u64, SplitBill>,
        user_split_bills: Table<address, vector<u64>>,
        
        // Counters
        next_request_id: u64,
        next_split_id: u64,
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
        amount_per_person: u64,
        timestamp: u64,
    }

    /// Initialize the wallet system (should be called once by admin)
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
            next_request_id: 1,
            next_split_id: 1,
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
        
        // Check if wallet ID already exists
        assert!(!table::contains(&registry.wallet_id_to_address, wallet_id), 
                error::already_exists(E_WALLET_ID_ALREADY_EXISTS));
        
        // Add mappings
        table::add(&mut registry.wallet_id_to_address, wallet_id, user_addr);
        table::add(&mut registry.address_to_wallet_id, user_addr, wallet_id);
        
        // Initialize user's request vectors if not exists
        if (!table::contains(&registry.user_payment_requests, user_addr)) {
            table::add(&mut registry.user_payment_requests, user_addr, vector::empty());
        };
        if (!table::contains(&registry.user_sent_requests, user_addr)) {
            table::add(&mut registry.user_sent_requests, user_addr, vector::empty());
        };
        if (!table::contains(&registry.user_split_bills, user_addr)) {
            table::add(&mut registry.user_split_bills, user_addr, vector::empty());
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
        let registry = borrow_global_mut<WalletRegistry>();
        
        // Check if UPI ID already exists
        assert!(!table::contains(&registryadmin_addr.upi_id_to_address, upi_id), 
                error::already_exists(E_UPI_ID_ALREADY_EXISTS));
        
        // Add mappings
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
        
        // Validate amount
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        // Get recipient address from wallet ID
        assert!(table::contains(&registry.wallet_id_to_address, to_wallet_id), 
                error::not_found(E_WALLET_ID_NOT_FOUND));
        let recipient_addr = *table::borrow(&registry.wallet_id_to_address, to_wallet_id);
        
        // Create payment request
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
        
        // Store the request
        table::add(&mut registry.payment_requests, request_id, payment_request);
        
        // Add to recipient's received requests
        let recipient_requests = table::borrow_mut(&mut registry.user_payment_requests, recipient_addr);
        vector::push_back(recipient_requests, request_id);
        
        // Add to requester's sent requests
        let requester_requests = table::borrow_mut(&mut registry.user_sent_requests, requester_addr);
        vector::push_back(requester_requests, request_id);
        
        // Increment counter
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
        
        // Check if request exists
        assert!(table::contains(&registry.payment_requests, request_id), 
                error::not_found(E_PAYMENT_REQUEST_NOT_FOUND));
        
        let request = table::borrow_mut(&mut registry.payment_requests, request_id);
        
        // Verify payer is the one who should pay
        assert!(request.to == payer_addr, error::permission_denied(E_NOT_AUTHORIZED));
        
        // Check if request is still pending
        assert!(request.status == STATUS_PENDING, error::invalid_state(E_PAYMENT_REQUEST_NOT_FOUND));
        
        // Update request status
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
        
        // Check if request exists
        assert!(table::contains(&registry.payment_requests, request_id), 
                error::not_found(E_PAYMENT_REQUEST_NOT_FOUND));
        
        let request = table::borrow_mut(&mut registry.payment_requests, request_id);
        
        // Verify user is the one who should pay
        assert!(request.to == user_addr, error::permission_denied(E_NOT_AUTHORIZED));
        
        // Check if request is still pending
        assert!(request.status == STATUS_PENDING, error::invalid_state(E_PAYMENT_REQUEST_NOT_FOUND));
        
        // Update request status
        request.status = STATUS_REJECTED;
    }

    /// Create a split bill
    public entry fun create_split_bill(
        creator: &signer,
        admin_addr: address,
        total_amount: u64,
        description: String,
        participant_wallet_ids: vector<String>
    ) acquires WalletRegistry {
        let creator_addr = signer::address_of(creator);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        // Validate amount
        assert!(total_amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        // Convert wallet IDs to addresses
        let participants = vector::empty<address>();
        vector::push_back(&mut participants, creator_addr); // Include creator
        
        let i = 0;
        let len = vector::length(&participant_wallet_ids);
        while (i < len) {
            let wallet_id = vector::borrow(&participant_wallet_ids, i);
            assert!(table::contains(&registry.wallet_id_to_address, *wallet_id), 
                    error::not_found(E_WALLET_ID_NOT_FOUND));
            let participant_addr = *table::borrow(&registry.wallet_id_to_address, *wallet_id);
            vector::push_back(&mut participants, participant_addr);
            i = i + 1;
        };
        
        let total_participants = vector::length(&participants);
        let amount_per_person = total_amount / total_participants;
        
        // Create split bill
        let split_id = registry.next_split_id;
        let split_bill = SplitBill {
            id: split_id,
            creator: creator_addr,
            total_amount,
            description,
            participants,
            amount_per_person,
            created_at: timestamp::now_microseconds(),
            payment_requests: vector::empty(),
        };
        
        // Create payment requests for each participant (except creator)
        let request_ids = vector::empty<u64>();
        i = 1; // Start from 1 to skip creator
        while (i < total_participants) {
            let participant = *vector::borrow(&participants, i);
            
            // Create payment request
            let request_id = registry.next_request_id;
            let payment_request = PaymentRequest {
                id: request_id,
                from: creator_addr,
                to: participant,
                amount: amount_per_person,
                description: string::utf8(b"Split bill: ") + description,
                status: STATUS_PENDING,
                created_at: timestamp::now_microseconds(),
                paid_at: option::none(),
            };
            
            // Store the request
            table::add(&mut registry.payment_requests, request_id, payment_request);
            vector::push_back(&mut request_ids, request_id);
            
            // Add to participant's received requests
            if (!table::contains(&registry.user_payment_requests, participant)) {
                table::add(&mut registry.user_payment_requests, participant, vector::empty());
            };
            let participant_requests = table::borrow_mut(&mut registry.user_payment_requests, participant);
            vector::push_back(participant_requests, request_id);
            
            // Increment request counter
            registry.next_request_id = registry.next_request_id + 1;
            i = i + 1;
        };
        
        // Update split bill with request IDs
        let split_bill_mut = &mut split_bill;
        split_bill_mut.payment_requests = request_ids;
        
        // Store split bill
        table::add(&mut registry.split_bills, split_id, split_bill);
        
        // Add to all participants' split bills
        i = 0;
        while (i < total_participants) {
            let participant = *vector::borrow(&participants, i);
            if (!table::contains(&registry.user_split_bills, participant)) {
                table::add(&mut registry.user_split_bills, participant, vector::empty());
            };
            let user_splits = table::borrow_mut(&mut registry.user_split_bills, participant);
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
        
        // Increment split counter
        registry.next_split_id = registry.next_split_id + 1;
        
        event::emit(SplitBillCreatedEvent {
            split_id,
            creator: creator_addr,
            total_amount,
            participants_count: total_participants,
            amount_per_person,
            timestamp: timestamp::now_microseconds(),
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
}