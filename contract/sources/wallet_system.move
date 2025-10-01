module aptos_contract::wallet_system {
    use std::signer;
    use std::error;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::coin::{Self, Coin};
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
    const E_LOYALTY_NFT_ALREADY_EXISTS: u64 = 17;
    const E_COUPON_NFT_NOT_FOUND: u64 = 18;
    const E_COUPON_NFT_EXPIRED: u64 = 19;
    const E_AUTO_PAY_NOT_APPROVED: u64 = 20;

    /// Payment request status
    const STATUS_PENDING: u8 = 0;
    const STATUS_PAID: u8 = 1;
    const STATUS_REJECTED: u8 = 2;

    /// EMI status
    const EMI_STATUS_ACTIVE: u8 = 0;
    const EMI_STATUS_COMPLETED: u8 = 1;
    const EMI_STATUS_DEFAULTED: u8 = 2;

    /// Loyalty NFT tiers
    const LOYALTY_BRONZE: u8 = 0;
    const LOYALTY_SILVER: u8 = 1;
    const LOYALTY_GOLD: u8 = 2;
    const LOYALTY_PLATINUM: u8 = 3;
    const LOYALTY_DIAMOND: u8 = 4;

    /// Transaction thresholds for loyalty NFTs
    const BRONZE_THRESHOLD: u64 = 1;
    const SILVER_THRESHOLD: u64 = 10;
    const GOLD_THRESHOLD: u64 = 50;
    const PLATINUM_THRESHOLD: u64 = 100;
    const DIAMOND_THRESHOLD: u64 = 250;

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
    struct EmiAgreement has store, drop {
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
        is_auto_pay_approved: bool, // Whether user has approved auto-pay
        pre_deposited_amount: u64,  // Amount pre-deposited by user for auto-pay
    }

    /// EMI Agreement view structure (copyable for view functions)
    struct EmiAgreementView has drop, copy {
        id: u64,
        user: address,
        company: address,
        total_amount: u64,
        monthly_installment: u64,
        total_months: u64,
        months_paid: u64,
        start_date: u64,
        last_payment_date: Option<u64>,
        status: u8,
        description: String,
        is_auto_pay_approved: bool,
        pre_deposited_amount: u64,
    }

    /// Loyalty NFT structure
    struct LoyaltyNFT has key, store {
        tier: u8,                // Bronze, Silver, Gold, etc.
        transactions_count: u64, // Number of transactions when minted
        minted_at: u64,         // Timestamp when minted
        metadata: LoyaltyMetadata,
    }

    /// Loyalty NFT metadata
    struct LoyaltyMetadata has store, drop, copy {
        name: String,
        description: String,
        image_url: String,
        tier_name: String,
        attributes: vector<String>, // Additional attributes
    }

    /// Coupon NFT structure - destroyable
    struct CouponNFT has key, store {
        id: u64,
        company: address,        // Company that issued the coupon
        discount_percentage: u64, // Discount percentage
        discount_link: String,   // Link to redeem discount
        description: String,     // Coupon description
        expires_at: u64,         // Expiration timestamp
        created_at: u64,         // Creation timestamp
        metadata: CouponMetadata,
        is_redeemed: bool,       // Whether coupon has been used
    }

    /// Coupon NFT metadata
    struct CouponMetadata has store, drop, copy {
        name: String,
        description: String,
        image_url: String,
        company_name: String,
        coupon_type: String,     // "discount", "gift", "cashback", etc.
        attributes: vector<String>,
    }

    /// User statistics for loyalty tracking
    struct UserStats has store, drop, copy {
        total_transactions: u64,
        last_transaction_date: u64,
        loyalty_nfts_minted: vector<u8>, // Track which tiers have been minted
    }

    /// Coupon template for companies to create
    struct CouponTemplate has store, drop, copy {
        id: u64,
        company: address,
        discount_percentage: u64,
        discount_link: String,
        description: String,
        lifetime_hours: u64,     // How many hours the coupon is valid
        metadata: CouponMetadata,
        is_active: bool,
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
        emi_coin_store: Coin<AptosCoin>,               // Store for pre-deposited EMI funds
        
        // User statistics for loyalty system
        user_stats: Table<address, UserStats>,
        
        // Coupon system
        coupon_templates: Table<u64, CouponTemplate>,
        company_coupon_templates: Table<address, vector<u64>>,
        user_coupon_nfts: Table<address, vector<u64>>,
        
        // Counters
        next_request_id: u64,
        next_split_id: u64,
        next_emi_id: u64,
        next_coupon_template_id: u64,
        next_coupon_nft_id: u64,
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

    #[event]
    struct LoyaltyNFTMintedEvent has drop, store {
        user: address,
        tier: u8,
        tier_name: String,
        transactions_count: u64,
        timestamp: u64,
    }

    #[event]
    struct CouponNFTMintedEvent has drop, store {
        coupon_nft_id: u64,
        user: address,
        company: address,
        discount_percentage: u64,
        expires_at: u64,
        timestamp: u64,
    }

    #[event]
    struct CouponNFTRedeemedEvent has drop, store {
        coupon_nft_id: u64,
        user: address,
        company: address,
        timestamp: u64,
    }

    #[event]
    struct CouponTemplateCreatedEvent has drop, store {
        template_id: u64,
        company: address,
        discount_percentage: u64,
        lifetime_hours: u64,
        timestamp: u64,
    }

    #[event]
    struct EmiAutoPayApprovedEvent has drop, store {
        emi_id: u64,
        user: address,
        company: address,
        monthly_installment: u64,
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
            emi_coin_store: coin::zero<AptosCoin>(),
            user_stats: table::new(),
            coupon_templates: table::new(),
            company_coupon_templates: table::new(),
            user_coupon_nfts: table::new(),
            next_request_id: 1,
            next_split_id: 1,
            next_emi_id: 1,
            next_coupon_template_id: 1,
            next_coupon_nft_id: 1,
        };
        
        move_to(admin, registry);
    }

    /// Initialize if not already initialized (safe for redeployment)
    /// This function will only create WalletRegistry if it doesn't exist
    public entry fun initialize_if_needed(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Only initialize if registry doesn't exist
        if (!exists<WalletRegistry>(admin_addr)) {
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
                emi_coin_store: coin::zero<AptosCoin>(),
                user_stats: table::new(),
                coupon_templates: table::new(),
                company_coupon_templates: table::new(),
                user_coupon_nfts: table::new(),
                next_request_id: 1,
                next_split_id: 1,
                next_emi_id: 1,
                next_coupon_template_id: 1,
                next_coupon_nft_id: 1,
            };
            
            move_to(admin, registry);
        };
        // If registry already exists, do nothing (keep existing data)
    }

    /// Helper function to update user stats and check for loyalty NFT minting
    fun update_user_stats_and_check_loyalty(
        user_addr: address,
        registry: &mut WalletRegistry
    ) {
        let current_time = timestamp::now_microseconds();
        
        // Initialize or update user stats
        if (!table::contains(&registry.user_stats, user_addr)) {
            let stats = UserStats {
                total_transactions: 1,
                last_transaction_date: current_time,
                loyalty_nfts_minted: vector::empty(),
            };
            table::add(&mut registry.user_stats, user_addr, stats);
        } else {
            let stats = table::borrow_mut(&mut registry.user_stats, user_addr);
            stats.total_transactions = stats.total_transactions + 1;
            stats.last_transaction_date = current_time;
        };
        
        let stats = table::borrow(&registry.user_stats, user_addr);
        let transaction_count = stats.total_transactions;
        
        // Check for loyalty NFT minting eligibility
        let should_mint_tier: Option<u8> = option::none();
        
        if (transaction_count >= DIAMOND_THRESHOLD && 
            !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_DIAMOND)) {
            should_mint_tier = option::some(LOYALTY_DIAMOND);
        } else if (transaction_count >= PLATINUM_THRESHOLD && 
                  !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_PLATINUM)) {
            should_mint_tier = option::some(LOYALTY_PLATINUM);
        } else if (transaction_count >= GOLD_THRESHOLD && 
                  !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_GOLD)) {
            should_mint_tier = option::some(LOYALTY_GOLD);
        } else if (transaction_count >= SILVER_THRESHOLD && 
                  !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_SILVER)) {
            should_mint_tier = option::some(LOYALTY_SILVER);
        } else if (transaction_count >= BRONZE_THRESHOLD && 
                  !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_BRONZE)) {
            should_mint_tier = option::some(LOYALTY_BRONZE);
        };
        
        if (option::is_some(&should_mint_tier)) {
            let tier = *option::borrow(&should_mint_tier);
            mint_loyalty_nft_internal(user_addr, tier, transaction_count, registry);
        };
    }

    /// Internal function to mint loyalty NFT
    fun mint_loyalty_nft_internal(
        user_addr: address,
        tier: u8,
        transactions_count: u64,
        registry: &mut WalletRegistry
    ) {
        let current_time = timestamp::now_microseconds();
        let tier_name = get_tier_name(tier);
        let description = string::utf8(b"Loyalty NFT for completing ");
        string::append(&mut description, u64_to_string(transactions_count));
        string::append(&mut description, string::utf8(b" transactions"));
        
        let _metadata = LoyaltyMetadata {
            name: tier_name,
            description,
            image_url: get_tier_image_url(tier),
            tier_name,
            attributes: get_tier_attributes(tier),
        };
        
        // In a real implementation, you would create the actual NFT here
        // LoyaltyNFT {
        //     tier,
        //     transactions_count,
        //     minted_at: current_time,
        //     metadata,
        // };
        
        // Store NFT in user's account (in a real implementation, this would be handled differently)
        // For now, we'll track it in the registry
        
        // Update user stats to mark this tier as minted
        let stats = table::borrow_mut(&mut registry.user_stats, user_addr);
        vector::push_back(&mut stats.loyalty_nfts_minted, tier);
        
        event::emit(LoyaltyNFTMintedEvent {
            user: user_addr,
            tier,
            tier_name,
            transactions_count,
            timestamp: current_time,
        });
    }

    /// Helper functions for loyalty NFT metadata
    fun get_tier_name(tier: u8): String {
        if (tier == LOYALTY_BRONZE) {
            string::utf8(b"Bronze Loyalty")
        } else if (tier == LOYALTY_SILVER) {
            string::utf8(b"Silver Loyalty")
        } else if (tier == LOYALTY_GOLD) {
            string::utf8(b"Gold Loyalty")
        } else if (tier == LOYALTY_PLATINUM) {
            string::utf8(b"Platinum Loyalty")
        } else if (tier == LOYALTY_DIAMOND) {
            string::utf8(b"Diamond Loyalty")
        } else {
            string::utf8(b"Unknown Loyalty")
        }
    }

    fun get_tier_image_url(tier: u8): String {
        if (tier == LOYALTY_BRONZE) {
            string::utf8(b"https://your-nft-storage.com/bronze-loyalty.png")
        } else if (tier == LOYALTY_SILVER) {
            string::utf8(b"https://your-nft-storage.com/silver-loyalty.png")
        } else if (tier == LOYALTY_GOLD) {
            string::utf8(b"https://your-nft-storage.com/gold-loyalty.png")
        } else if (tier == LOYALTY_PLATINUM) {
            string::utf8(b"https://your-nft-storage.com/platinum-loyalty.png")
        } else if (tier == LOYALTY_DIAMOND) {
            string::utf8(b"https://your-nft-storage.com/diamond-loyalty.png")
        } else {
            string::utf8(b"https://your-nft-storage.com/default-loyalty.png")
        }
    }

    fun get_tier_attributes(tier: u8): vector<String> {
        let attributes = vector::empty<String>();
        vector::push_back(&mut attributes, string::utf8(b"type:loyalty_nft"));
        vector::push_back(&mut attributes, string::utf8(b"category:rewards"));
        
        if (tier == LOYALTY_BRONZE) {
            vector::push_back(&mut attributes, string::utf8(b"rarity:common"));
            vector::push_back(&mut attributes, string::utf8(b"tier:bronze"));
        } else if (tier == LOYALTY_SILVER) {
            vector::push_back(&mut attributes, string::utf8(b"rarity:uncommon"));
            vector::push_back(&mut attributes, string::utf8(b"tier:silver"));
        } else if (tier == LOYALTY_GOLD) {
            vector::push_back(&mut attributes, string::utf8(b"rarity:rare"));
            vector::push_back(&mut attributes, string::utf8(b"tier:gold"));
        } else if (tier == LOYALTY_PLATINUM) {
            vector::push_back(&mut attributes, string::utf8(b"rarity:epic"));
            vector::push_back(&mut attributes, string::utf8(b"tier:platinum"));
        } else if (tier == LOYALTY_DIAMOND) {
            vector::push_back(&mut attributes, string::utf8(b"rarity:legendary"));
            vector::push_back(&mut attributes, string::utf8(b"tier:diamond"));
        };
        
        attributes
    }

    /// Helper function to convert u64 to string (basic implementation)
    fun u64_to_string(num: u64): String {
        if (num == 0) {
            return string::utf8(b"0")
        };
        
        let digits = vector::empty<u8>();
        let temp = num;
        while (temp > 0) {
            let digit = ((temp % 10) as u8) + 48; // 48 is ASCII for '0'
            vector::push_back(&mut digits, digit);
            temp = temp / 10;
        };
        
        vector::reverse(&mut digits);
        string::utf8(digits)
    }

    /// Helper function to randomly mint coupon NFT
    fun maybe_mint_random_coupon_nft(user_addr: address, registry: &mut WalletRegistry) {
        // Simple random logic - in practice, you might want more sophisticated logic
        let current_time = timestamp::now_microseconds();
        let random_factor = current_time % 100; // 0-99
        
        // 20% chance to get a coupon NFT
        if (random_factor < 20) {
            // Get a random active coupon template (simplified)
            let template_count = registry.next_coupon_template_id - 1;
            if (template_count > 0) {
                let template_id = (current_time % template_count) + 1;
                if (table::contains(&registry.coupon_templates, template_id)) {
                    let template = table::borrow(&registry.coupon_templates, template_id);
                    if (template.is_active) {
                        mint_coupon_nft_internal(user_addr, template_id, registry);
                    };
                };
            };
        };
    }

    /// Internal function to mint coupon NFT from template
    fun mint_coupon_nft_internal(
        user_addr: address,
        template_id: u64,
        registry: &mut WalletRegistry
    ) {
        let template = table::borrow(&registry.coupon_templates, template_id);
        let current_time = timestamp::now_microseconds();
        let expires_at = current_time + (template.lifetime_hours * 3600000000); // Convert hours to microseconds
        
        let coupon_nft_id = registry.next_coupon_nft_id;
        
        // In a real implementation, you would create the actual NFT here
        // For now, we'll just track it in the user's coupon list
        let user_coupons = table::borrow_mut(&mut registry.user_coupon_nfts, user_addr);
        vector::push_back(user_coupons, coupon_nft_id);
        
        registry.next_coupon_nft_id = registry.next_coupon_nft_id + 1;
        
        event::emit(CouponNFTMintedEvent {
            coupon_nft_id,
            user: user_addr,
            company: template.company,
            discount_percentage: template.discount_percentage,
            expires_at,
            timestamp: current_time,
        });
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
        if (!table::contains(&registry.company_coupon_templates, user_addr)) {
            table::add(&mut registry.company_coupon_templates, user_addr, vector::empty());
        };
        if (!table::contains(&registry.user_coupon_nfts, user_addr)) {
            table::add(&mut registry.user_coupon_nfts, user_addr, vector::empty());
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
        
        // Initialize recipient's payment requests vector if it doesn't exist
        if (!table::contains(&registry.user_payment_requests, recipient_addr)) {
            table::add(&mut registry.user_payment_requests, recipient_addr, vector::empty());
        };
        let recipient_requests = table::borrow_mut(&mut registry.user_payment_requests, recipient_addr);
        vector::push_back(recipient_requests, request_id);
        
        // Initialize requester's sent requests vector if it doesn't exist
        if (!table::contains(&registry.user_sent_requests, requester_addr)) {
            table::add(&mut registry.user_sent_requests, requester_addr, vector::empty());
        };
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
        
        // Store values before updating
        let request_from = request.from;
        let request_amount = request.amount;
        
        request.status = STATUS_PAID;
        request.paid_at = option::some(timestamp::now_microseconds());
        
        // Update user stats and check for loyalty NFT
        update_user_stats_and_check_loyalty(payer_addr, registry);
        
        // Randomly mint coupon NFT (you can customize this logic)
        maybe_mint_random_coupon_nft(payer_addr, registry);
        
        event::emit(PaymentRequestPaidEvent {
            request_id,
            from: request_from,
            to: payer_addr,
            amount: request_amount,
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
            is_auto_pay_approved: false,
            pre_deposited_amount: 0,
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

    /// Approve auto-pay for EMI agreement with deposit (called by user)
    public entry fun approve_emi_auto_pay(
        user: &signer,
        admin_addr: address,
        emi_id: u64,
        deposit_amount: u64
    ) acquires WalletRegistry {
        let user_addr = signer::address_of(user);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(table::contains(&registry.emi_agreements, emi_id), 
                error::not_found(E_EMI_NOT_FOUND));
        
        let emi = table::borrow_mut(&mut registry.emi_agreements, emi_id);
        
        // Verify user authorization
        assert!(emi.user == user_addr, error::permission_denied(E_NOT_AUTHORIZED));
        
        // Check if EMI is still active
        assert!(emi.status == EMI_STATUS_ACTIVE, error::invalid_state(E_EMI_COMPLETED));
        
        // Check if auto-pay is not already approved
        assert!(!emi.is_auto_pay_approved, error::already_exists(E_EMI_ALREADY_EXISTS));
        
        // Deposit amount should be at least one month's installment
        assert!(deposit_amount >= emi.monthly_installment, error::invalid_argument(E_INVALID_AMOUNT));
        
        // Check user's balance
        let user_balance = coin::balance<AptosCoin>(user_addr);
        assert!(user_balance >= deposit_amount, error::invalid_argument(E_INSUFFICIENT_BALANCE));
        
        // Withdraw coins from user and add to the contract's store
        let deposited_coins = coin::withdraw<AptosCoin>(user, deposit_amount);
        coin::merge(&mut registry.emi_coin_store, deposited_coins);
        
        // Update EMI record
        emi.is_auto_pay_approved = true;
        emi.pre_deposited_amount = emi.pre_deposited_amount + deposit_amount;
        
        event::emit(EmiAutoPayApprovedEvent {
            emi_id,
            user: user_addr,
            company: emi.company,
            monthly_installment: emi.monthly_installment,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Add more funds to EMI auto-pay account (called by user)
    public entry fun add_emi_funds(
        user: &signer,
        admin_addr: address,
        emi_id: u64,
        amount: u64
    ) acquires WalletRegistry {
        let user_addr = signer::address_of(user);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(table::contains(&registry.emi_agreements, emi_id), 
                error::not_found(E_EMI_NOT_FOUND));
        
        let emi = table::borrow_mut(&mut registry.emi_agreements, emi_id);
        
        // Verify user authorization
        assert!(emi.user == user_addr, error::permission_denied(E_NOT_AUTHORIZED));
        
        // Check if EMI is still active
        assert!(emi.status == EMI_STATUS_ACTIVE, error::invalid_state(E_EMI_COMPLETED));
        
        // Check if auto-pay is approved
        assert!(emi.is_auto_pay_approved, error::permission_denied(E_AUTO_PAY_NOT_APPROVED));
        
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        // Check user's balance
        let user_balance = coin::balance<AptosCoin>(user_addr);
        assert!(user_balance >= amount, error::invalid_argument(E_INSUFFICIENT_BALANCE));
        
        // Withdraw coins from user and add to the contract's store
        let deposited_coins = coin::withdraw<AptosCoin>(user, amount);
        coin::merge(&mut registry.emi_coin_store, deposited_coins);
        
        // Update pre-deposited amount
        emi.pre_deposited_amount = emi.pre_deposited_amount + amount;
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
        
        // Check if auto-pay has been approved
        assert!(emi.is_auto_pay_approved, error::permission_denied(E_AUTO_PAY_NOT_APPROVED));
        
        // Check if user has sufficient pre-deposited amount
        if (emi.pre_deposited_amount < emi.monthly_installment) {
            // Insufficient pre-deposited funds - emit failure event but don't abort
            event::emit(EmiPaymentFailedEvent {
                emi_id,
                user: emi.user,
                company: company_addr,
                required_amount: emi.monthly_installment,
                user_balance: emi.pre_deposited_amount,
                reason: string::utf8(b"Insufficient pre-deposited funds for auto-pay"),
                timestamp: current_time,
            });
            return
        };
        
        // Extract coins from the contract's store and transfer to company
        let payment_coins = coin::extract(&mut registry.emi_coin_store, emi.monthly_installment);
        coin::deposit<AptosCoin>(company_addr, payment_coins);
        
        // Update pre-deposited amount
        emi.pre_deposited_amount = emi.pre_deposited_amount - emi.monthly_installment;
        
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

    /// Create coupon template (called by company)
    public entry fun create_coupon_template(
        company: &signer,
        admin_addr: address,
        discount_percentage: u64,
        discount_link: String,
        description: String,
        lifetime_hours: u64,
        company_name: String,
        coupon_type: String,
        image_url: String
    ) acquires WalletRegistry {
        let company_addr = signer::address_of(company);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(discount_percentage > 0 && discount_percentage <= 100, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(lifetime_hours > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        let template_id = registry.next_coupon_template_id;
        
        let metadata = CouponMetadata {
            name: string::utf8(b"Discount Coupon"),
            description,
            image_url,
            company_name,
            coupon_type,
            attributes: vector::empty(),
        };
        
        let template = CouponTemplate {
            id: template_id,
            company: company_addr,
            discount_percentage,
            discount_link,
            description,
            lifetime_hours,
            metadata,
            is_active: true,
        };
        
        table::add(&mut registry.coupon_templates, template_id, template);
        
        // Add to company's templates
        let company_templates = table::borrow_mut(&mut registry.company_coupon_templates, company_addr);
        vector::push_back(company_templates, template_id);
        
        registry.next_coupon_template_id = registry.next_coupon_template_id + 1;
        
        event::emit(CouponTemplateCreatedEvent {
            template_id,
            company: company_addr,
            discount_percentage,
            lifetime_hours,
            timestamp: timestamp::now_microseconds(),
        });
    }

    /// Deactivate coupon template
    public entry fun deactivate_coupon_template(
        company: &signer,
        admin_addr: address,
        template_id: u64
    ) acquires WalletRegistry {
        let company_addr = signer::address_of(company);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(table::contains(&registry.coupon_templates, template_id), 
                error::not_found(E_COUPON_NFT_NOT_FOUND));
        
        let template = table::borrow_mut(&mut registry.coupon_templates, template_id);
        assert!(template.company == company_addr, error::permission_denied(E_NOT_AUTHORIZED));
        
        template.is_active = false;
    }

    /// Manually mint coupon NFT to specific user (called by company)
    public entry fun mint_coupon_nft_to_user(
        company: &signer,
        admin_addr: address,
        user_wallet_id: String,
        template_id: u64
    ) acquires WalletRegistry {
        let company_addr = signer::address_of(company);
        let registry = borrow_global_mut<WalletRegistry>(admin_addr);
        
        assert!(table::contains(&registry.wallet_id_to_address, user_wallet_id), 
                error::not_found(E_WALLET_ID_NOT_FOUND));
        let user_addr = *table::borrow(&registry.wallet_id_to_address, user_wallet_id);
        
        assert!(table::contains(&registry.coupon_templates, template_id), 
                error::not_found(E_COUPON_NFT_NOT_FOUND));
        
        let template = table::borrow(&registry.coupon_templates, template_id);
        assert!(template.company == company_addr, error::permission_denied(E_NOT_AUTHORIZED));
        assert!(template.is_active, error::invalid_state(E_COUPON_NFT_EXPIRED));
        
        mint_coupon_nft_internal(user_addr, template_id, registry);
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
    public fun get_emi_agreement(admin_addr: address, emi_id: u64): Option<EmiAgreementView> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.emi_agreements, emi_id)) {
            let emi = table::borrow(&registry.emi_agreements, emi_id);
            let view = EmiAgreementView {
                id: emi.id,
                user: emi.user,
                company: emi.company,
                total_amount: emi.total_amount,
                monthly_installment: emi.monthly_installment,
                total_months: emi.total_months,
                months_paid: emi.months_paid,
                start_date: emi.start_date,
                last_payment_date: emi.last_payment_date,
                status: emi.status,
                description: emi.description,
                is_auto_pay_approved: emi.is_auto_pay_approved,
                pre_deposited_amount: emi.pre_deposited_amount,
            };
            option::some(view)
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

    /// Get user statistics for loyalty tracking
    #[view]
    public fun get_user_stats(admin_addr: address, user_addr: address): Option<UserStats> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.user_stats, user_addr)) {
            option::some(*table::borrow(&registry.user_stats, user_addr))
        } else {
            option::none()
        }
    }

    /// Get coupon template details
    #[view]
    public fun get_coupon_template(admin_addr: address, template_id: u64): Option<CouponTemplate> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.coupon_templates, template_id)) {
            option::some(*table::borrow(&registry.coupon_templates, template_id))
        } else {
            option::none()
        }
    }

    /// Get company's coupon templates
    #[view]
    public fun get_company_coupon_templates(admin_addr: address, company_addr: address): vector<u64> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.company_coupon_templates, company_addr)) {
            *table::borrow(&registry.company_coupon_templates, company_addr)
        } else {
            vector::empty()
        }
    }

    /// Get user's coupon NFTs
    #[view]
    public fun get_user_coupon_nfts(admin_addr: address, user_addr: address): vector<u64> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.user_coupon_nfts, user_addr)) {
            *table::borrow(&registry.user_coupon_nfts, user_addr)
        } else {
            vector::empty()
        }
    }

    /// Get user's loyalty NFT tiers that have been minted
    #[view]
    public fun get_user_loyalty_tiers(admin_addr: address, user_addr: address): vector<u8> acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (table::contains(&registry.user_stats, user_addr)) {
            let stats = table::borrow(&registry.user_stats, user_addr);
            stats.loyalty_nfts_minted
        } else {
            vector::empty()
        }
    }

    /// Check if user is eligible for specific loyalty tier
    #[view]
    public fun check_loyalty_tier_eligibility(admin_addr: address, user_addr: address, tier: u8): bool acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (!table::contains(&registry.user_stats, user_addr)) {
            return false
        };
        
        let stats = table::borrow(&registry.user_stats, user_addr);
        let transaction_count = stats.total_transactions;
        
        if (tier == LOYALTY_BRONZE && transaction_count >= BRONZE_THRESHOLD) {
            !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_BRONZE)
        } else if (tier == LOYALTY_SILVER && transaction_count >= SILVER_THRESHOLD) {
            !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_SILVER)
        } else if (tier == LOYALTY_GOLD && transaction_count >= GOLD_THRESHOLD) {
            !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_GOLD)
        } else if (tier == LOYALTY_PLATINUM && transaction_count >= PLATINUM_THRESHOLD) {
            !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_PLATINUM)
        } else if (tier == LOYALTY_DIAMOND && transaction_count >= DIAMOND_THRESHOLD) {
            !vector::contains(&stats.loyalty_nfts_minted, &LOYALTY_DIAMOND)
        } else {
            false
        }
    }

    /// Check if auto-pay is approved for an EMI
    #[view]
    public fun is_emi_auto_pay_approved(admin_addr: address, emi_id: u64): bool acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (!table::contains(&registry.emi_agreements, emi_id)) {
            return false
        };
        
        let emi = table::borrow(&registry.emi_agreements, emi_id);
        emi.is_auto_pay_approved
    }

    /// Get EMI pre-deposited amount
    #[view]
    public fun get_emi_pre_deposited_amount(admin_addr: address, emi_id: u64): u64 acquires WalletRegistry {
        let registry = borrow_global<WalletRegistry>(admin_addr);
        if (!table::contains(&registry.emi_agreements, emi_id)) {
            return 0
        };
        
        let emi = table::borrow(&registry.emi_agreements, emi_id);
        emi.pre_deposited_amount
    }
}