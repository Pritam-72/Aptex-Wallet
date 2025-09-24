#[test_only]
module aptos_contract::wallet_tests {
    use std::string::{Self, String};
    use std::vector;
    use std::option;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_contract::wallet_system;

    // Test addresses
    const ADMIN_ADDR: address = @0x1;
    const USER1_ADDR: address = @0x2;
    const USER2_ADDR: address = @0x3;
    const USER3_ADDR: address = @0x4;
    const COMPANY_ADDR: address = @0x5;

    // Helper function to create test accounts
    fun setup_test_accounts(): (signer, signer, signer, signer, signer) {
        let admin = account::create_account_for_test(ADMIN_ADDR);
        let user1 = account::create_account_for_test(USER1_ADDR);
        let user2 = account::create_account_for_test(USER2_ADDR);
        let user3 = account::create_account_for_test(USER3_ADDR);
        let company = account::create_account_for_test(COMPANY_ADDR);
        
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&admin);
        
        (admin, user1, user2, user3, company)
    }

    // Helper function to initialize coins for testing
    fun setup_coins_and_fund_accounts(admin: &signer, user1: &signer, user2: &signer, user3: &signer, company: &signer) {
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(admin);
        
        // Register and fund accounts with AptosCoin
        coin::register<AptosCoin>(user1);
        coin::register<AptosCoin>(user2);
        coin::register<AptosCoin>(user3);
        coin::register<AptosCoin>(company);
        
        // Mint some coins for testing
        aptos_coin::mint(admin, USER1_ADDR, 10000);
        aptos_coin::mint(admin, USER2_ADDR, 10000);
        aptos_coin::mint(admin, USER3_ADDR, 10000);
        aptos_coin::mint(admin, COMPANY_ADDR, 10000);
        
        // Destroy capabilities to clean up
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test]
    fun test_initialize_wallet_system() {
        let (admin, _, _, _, _) = setup_test_accounts();
        
        // Initialize the wallet system
        wallet_system::initialize(&admin);
        
        // Verify initialization by trying to register a wallet ID
        // If initialization failed, this would abort
        let wallet_id = string::utf8(b"test_wallet");
        wallet_system::register_wallet_id(&admin, ADMIN_ADDR, wallet_id);
        
        // Verify wallet ID was registered
        let retrieved_addr = wallet_system::get_address_by_wallet_id(ADMIN_ADDR, wallet_id);
        assert!(option::is_some(&retrieved_addr), 1);
        assert!(*option::borrow(&retrieved_addr) == ADMIN_ADDR, 2);
    }

    #[test]
    fun test_register_wallet_id() {
        let (admin, user1, user2, _, _) = setup_test_accounts();
        
        // Initialize the system
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let wallet_id2 = string::utf8(b"user2_wallet");
        
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        
        // Verify mappings
        let addr1 = wallet_system::get_address_by_wallet_id(ADMIN_ADDR, wallet_id1);
        let addr2 = wallet_system::get_address_by_wallet_id(ADMIN_ADDR, wallet_id2);
        
        assert!(option::is_some(&addr1), 1);
        assert!(option::is_some(&addr2), 2);
        assert!(*option::borrow(&addr1) == USER1_ADDR, 3);
        assert!(*option::borrow(&addr2) == USER2_ADDR, 4);
        
        // Test reverse mapping
        let retrieved_wallet1 = wallet_system::get_wallet_id_by_address(ADMIN_ADDR, USER1_ADDR);
        assert!(option::is_some(&retrieved_wallet1), 5);
        assert!(*option::borrow(&retrieved_wallet1) == wallet_id1, 6);
    }

    #[test]
    #[expected_failure(abort_code = 524289, location = aptos_contract::wallet_system)] // E_WALLET_ID_ALREADY_EXISTS
    fun test_register_duplicate_wallet_id() {
        let (admin, user1, user2, _, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        let wallet_id = string::utf8(b"duplicate_wallet");
        
        // Register wallet ID for user1
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id);
        
        // Try to register same wallet ID for user2 - should fail
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id);
    }

    #[test]
    fun test_register_upi_id() {
        let (admin, user1, user2, _, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs first
        let wallet_id1 = string::utf8(b"user1_wallet");
        let wallet_id2 = string::utf8(b"user2_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        
        // Register UPI IDs
        let upi_id1 = string::utf8(b"user1@upi");
        let upi_id2 = string::utf8(b"user2@upi");
        
        wallet_system::register_upi_id(&user1, ADMIN_ADDR, upi_id1);
        wallet_system::register_upi_id(&user2, ADMIN_ADDR, upi_id2);
        
        // Verify mappings
        let addr1 = wallet_system::get_address_by_upi_id(ADMIN_ADDR, upi_id1);
        let addr2 = wallet_system::get_address_by_upi_id(ADMIN_ADDR, upi_id2);
        
        assert!(option::is_some(&addr1), 1);
        assert!(option::is_some(&addr2), 2);
        assert!(*option::borrow(&addr1) == USER1_ADDR, 3);
        assert!(*option::borrow(&addr2) == USER2_ADDR, 4);
    }

    #[test]
    fun test_create_payment_request() {
        let (admin, user1, user2, _, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let wallet_id2 = string::utf8(b"user2_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        
        // Create payment request
        let amount = 1000u64;
        let description = string::utf8(b"Test payment");
        wallet_system::create_payment_request(&user1, ADMIN_ADDR, wallet_id2, amount, description);
        
        // Verify payment request was created
        let user2_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER2_ADDR);
        assert!(vector::length(&user2_requests) == 1, 1);
        
        let request_id = *vector::borrow(&user2_requests, 0);
        let request = wallet_system::get_payment_request(ADMIN_ADDR, request_id);
        assert!(option::is_some(&request), 2);
        
        // Note: We can't directly access struct fields in tests, but we can verify the request exists
        // In a real test environment, you might need additional view functions to get specific fields
    }

    #[test]
    fun test_pay_request() {
        let (admin, user1, user2, _, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let wallet_id2 = string::utf8(b"user2_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        
        // Create payment request
        let amount = 1000u64;
        let description = string::utf8(b"Test payment");
        wallet_system::create_payment_request(&user1, ADMIN_ADDR, wallet_id2, amount, description);
        
        // Get the request ID
        let user2_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER2_ADDR);
        let request_id = *vector::borrow(&user2_requests, 0);
        
        // Pay the request
        wallet_system::pay_request(&user2, ADMIN_ADDR, request_id);
        
        // Verify request was paid
        let request = wallet_system::get_payment_request(ADMIN_ADDR, request_id);
        assert!(option::is_some(&request), 1);
    }

    #[test]
    fun test_reject_request() {
        let (admin, user1, user2, _, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let wallet_id2 = string::utf8(b"user2_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        
        // Create payment request
        let amount = 1000u64;
        let description = string::utf8(b"Test payment");
        wallet_system::create_payment_request(&user1, ADMIN_ADDR, wallet_id2, amount, description);
        
        // Get the request ID
        let user2_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER2_ADDR);
        let request_id = *vector::borrow(&user2_requests, 0);
        
        // Reject the request
        wallet_system::reject_request(&user2, ADMIN_ADDR, request_id);
        
        // Verify request still exists (rejection doesn't delete it)
        let request = wallet_system::get_payment_request(ADMIN_ADDR, request_id);
        assert!(option::is_some(&request), 1);
    }

    #[test]
    fun test_create_split_bill() {
        let (admin, user1, user2, user3, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let wallet_id2 = string::utf8(b"user2_wallet");
        let wallet_id3 = string::utf8(b"user3_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        wallet_system::register_wallet_id(&user3, ADMIN_ADDR, wallet_id3);
        
        // Create split bill
        let total_amount = 3000u64;
        let description = string::utf8(b"Dinner bill");
        
        let participant_wallet_ids = vector::empty<String>();
        vector::push_back(&mut participant_wallet_ids, wallet_id2);
        vector::push_back(&mut participant_wallet_ids, wallet_id3);
        
        let participant_amounts = vector::empty<u64>();
        vector::push_back(&mut participant_amounts, 1500u64);
        vector::push_back(&mut participant_amounts, 1500u64);
        
        wallet_system::create_split_bill(
            &user1,
            ADMIN_ADDR,
            total_amount,
            description,
            participant_wallet_ids,
            participant_amounts
        );
        
        // Verify split bill was created
        let user1_splits = wallet_system::get_user_split_bills(ADMIN_ADDR, USER1_ADDR);
        assert!(vector::length(&user1_splits) == 1, 1);
        
        let split_id = *vector::borrow(&user1_splits, 0);
        let split_bill = wallet_system::get_split_bill(ADMIN_ADDR, split_id);
        assert!(option::is_some(&split_bill), 2);
        
        // Verify participants also have the split bill
        let user2_splits = wallet_system::get_user_split_bills(ADMIN_ADDR, USER2_ADDR);
        let user3_splits = wallet_system::get_user_split_bills(ADMIN_ADDR, USER3_ADDR);
        assert!(vector::length(&user2_splits) == 1, 3);
        assert!(vector::length(&user3_splits) == 1, 4);
        
        // Verify payment requests were created
        let user2_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER2_ADDR);
        let user3_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER3_ADDR);
        assert!(vector::length(&user2_requests) == 1, 5);
        assert!(vector::length(&user3_requests) == 1, 6);
    }

    #[test]
    #[expected_failure(abort_code = 65551, location = aptos_contract::wallet_system)] // E_INVALID_SPLIT_DATA
    fun test_create_split_bill_invalid_amounts() {
        let (admin, user1, user2, user3, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let wallet_id2 = string::utf8(b"user2_wallet");
        let wallet_id3 = string::utf8(b"user3_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        wallet_system::register_wallet_id(&user3, ADMIN_ADDR, wallet_id3);
        
        // Create split bill with mismatched amounts
        let total_amount = 3000u64;
        let description = string::utf8(b"Invalid bill");
        
        let participant_wallet_ids = vector::empty<String>();
        vector::push_back(&mut participant_wallet_ids, wallet_id2);
        vector::push_back(&mut participant_wallet_ids, wallet_id3);
        
        let participant_amounts = vector::empty<u64>();
        vector::push_back(&mut participant_amounts, 1000u64); // Total: 2500, but bill is 3000
        vector::push_back(&mut participant_amounts, 1500u64);
        
        wallet_system::create_split_bill(
            &user1,
            ADMIN_ADDR,
            total_amount,
            description,
            participant_wallet_ids,
            participant_amounts
        );
    }

    #[test]
    fun test_create_emi_agreement() {
        let (admin, user1, _, _, company) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let company_wallet_id = string::utf8(b"company_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&company, ADMIN_ADDR, company_wallet_id);
        
        // Create EMI agreement
        let total_amount = 12000u64;
        let monthly_installment = 1000u64;
        let total_months = 12u64;
        let description = string::utf8(b"Phone EMI");
        
        wallet_system::create_emi_agreement(
            &user1,
            ADMIN_ADDR,
            company_wallet_id,
            total_amount,
            monthly_installment,
            total_months,
            description
        );
        
        // Verify EMI was created
        let user_emis = wallet_system::get_user_emis(ADMIN_ADDR, USER1_ADDR);
        assert!(vector::length(&user_emis) == 1, 1);
        
        let company_emis = wallet_system::get_company_emis(ADMIN_ADDR, COMPANY_ADDR);
        assert!(vector::length(&company_emis) == 1, 2);
        
        let emi_id = *vector::borrow(&user_emis, 0);
        let emi = wallet_system::get_emi_agreement(ADMIN_ADDR, emi_id);
        assert!(option::is_some(&emi), 3);
    }

    #[test]
    #[expected_failure(abort_code = 65544, location = aptos_contract::wallet_system)] // E_INVALID_AMOUNT
    fun test_create_emi_agreement_invalid_calculation() {
        let (admin, user1, _, _, company) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let company_wallet_id = string::utf8(b"company_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&company, ADMIN_ADDR, company_wallet_id);
        
        // Create EMI with invalid calculation
        let total_amount = 12000u64;
        let monthly_installment = 1100u64; // 1100 * 12 = 13200, not 12000
        let total_months = 12u64;
        let description = string::utf8(b"Invalid EMI");
        
        wallet_system::create_emi_agreement(
            &user1,
            ADMIN_ADDR,
            company_wallet_id,
            total_amount,
            monthly_installment,
            total_months,
            description
        );
    }

    #[test]
    fun test_collect_emi_payment_success() {
        let (admin, user1, _, _, company) = setup_test_accounts();
        
        // Setup coins and fund accounts
        setup_coins_and_fund_accounts(&admin, &user1, &account::create_account_for_test(@0x999), &account::create_account_for_test(@0x998), &company);
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let company_wallet_id = string::utf8(b"company_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&company, ADMIN_ADDR, company_wallet_id);
        
        // Create EMI agreement
        let total_amount = 12000u64;
        let monthly_installment = 1000u64;
        let total_months = 12u64;
        let description = string::utf8(b"Phone EMI");
        
        wallet_system::create_emi_agreement(
            &user1,
            ADMIN_ADDR,
            company_wallet_id,
            total_amount,
            monthly_installment,
            total_months,
            description
        );
        
        // Fast forward time by 30 days
        timestamp::fast_forward_seconds(2629746); // 30.44 days in seconds
        
        // Get EMI ID
        let user_emis = wallet_system::get_user_emis(ADMIN_ADDR, USER1_ADDR);
        let emi_id = *vector::borrow(&user_emis, 0);
        
        // Collect EMI payment
        wallet_system::collect_emi_payment(&company, ADMIN_ADDR, emi_id);
        
        // Verify EMI was updated
        let emi = wallet_system::get_emi_agreement(ADMIN_ADDR, emi_id);
        assert!(option::is_some(&emi), 1);
    }

    #[test]
    fun test_collect_emi_payment_insufficient_balance() {
        let (admin, user1, _, _, company) = setup_test_accounts();
        
        // Setup coins but don't fund user1 sufficiently
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&admin);
        coin::register<AptosCoin>(&user1);
        coin::register<AptosCoin>(&company);
        aptos_coin::mint(&admin, USER1_ADDR, 500); // Only 500, need 1000
        
        // Destroy capabilities
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let company_wallet_id = string::utf8(b"company_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&company, ADMIN_ADDR, company_wallet_id);
        
        // Create EMI agreement
        let total_amount = 12000u64;
        let monthly_installment = 1000u64;
        let total_months = 12u64;
        let description = string::utf8(b"Phone EMI");
        
        wallet_system::create_emi_agreement(
            &user1,
            ADMIN_ADDR,
            company_wallet_id,
            total_amount,
            monthly_installment,
            total_months,
            description
        );
        
        // Fast forward time by 30 days
        timestamp::fast_forward_seconds(2629746);
        
        // Get EMI ID
        let user_emis = wallet_system::get_user_emis(ADMIN_ADDR, USER1_ADDR);
        let emi_id = *vector::borrow(&user_emis, 0);
        
        // Try to collect EMI payment - should not abort but emit failure event
        wallet_system::collect_emi_payment(&company, ADMIN_ADDR, emi_id);
        
        // EMI should still exist and be active
        let emi = wallet_system::get_emi_agreement(ADMIN_ADDR, emi_id);
        assert!(option::is_some(&emi), 1);
    }

    #[test]
    #[expected_failure(abort_code = 196624, location = aptos_contract::wallet_system)] // E_EMI_NOT_DUE
    fun test_collect_emi_payment_too_early() {
        let (admin, user1, _, _, company) = setup_test_accounts();
        
        setup_coins_and_fund_accounts(&admin, &user1, &account::create_account_for_test(@0x999), &account::create_account_for_test(@0x998), &company);
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let company_wallet_id = string::utf8(b"company_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&company, ADMIN_ADDR, company_wallet_id);
        
        // Create EMI agreement
        let total_amount = 12000u64;
        let monthly_installment = 1000u64;
        let total_months = 12u64;
        let description = string::utf8(b"Phone EMI");
        
        wallet_system::create_emi_agreement(
            &user1,
            ADMIN_ADDR,
            company_wallet_id,
            total_amount,
            monthly_installment,
            total_months,
            description
        );
        
        // Try to collect payment immediately (too early)
        let user_emis = wallet_system::get_user_emis(ADMIN_ADDR, USER1_ADDR);
        let emi_id = *vector::borrow(&user_emis, 0);
        
        wallet_system::collect_emi_payment(&company, ADMIN_ADDR, emi_id);
    }

    #[test]
    #[expected_failure(abort_code = 327687, location = aptos_contract::wallet_system)] // E_NOT_AUTHORIZED
    fun test_collect_emi_payment_unauthorized() {
        let (admin, user1, user2, _, company) = setup_test_accounts();
        
        setup_coins_and_fund_accounts(&admin, &user1, &user2, &account::create_account_for_test(@0x998), &company);
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let wallet_id2 = string::utf8(b"user2_wallet");
        let company_wallet_id = string::utf8(b"company_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        wallet_system::register_wallet_id(&company, ADMIN_ADDR, company_wallet_id);
        
        // Create EMI agreement
        let total_amount = 12000u64;
        let monthly_installment = 1000u64;
        let total_months = 12u64;
        let description = string::utf8(b"Phone EMI");
        
        wallet_system::create_emi_agreement(
            &user1,
            ADMIN_ADDR,
            company_wallet_id,
            total_amount,
            monthly_installment,
            total_months,
            description
        );
        
        // Fast forward time
        timestamp::fast_forward_seconds(2629746);
        
        // Get EMI ID
        let user_emis = wallet_system::get_user_emis(ADMIN_ADDR, USER1_ADDR);
        let emi_id = *vector::borrow(&user_emis, 0);
        
        // Try to collect payment as wrong user (user2 instead of company)
        wallet_system::collect_emi_payment(&user2, ADMIN_ADDR, emi_id);
    }

    #[test]
    fun test_multiple_emi_payments() {
        let (admin, user1, _, _, company) = setup_test_accounts();
        
        setup_coins_and_fund_accounts(&admin, &user1, &account::create_account_for_test(@0x999), &account::create_account_for_test(@0x998), &company);
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let company_wallet_id = string::utf8(b"company_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&company, ADMIN_ADDR, company_wallet_id);
        
        // Create EMI agreement for 3 months
        let total_amount = 3000u64;
        let monthly_installment = 1000u64;
        let total_months = 3u64;
        let description = string::utf8(b"Short EMI");
        
        wallet_system::create_emi_agreement(
            &user1,
            ADMIN_ADDR,
            company_wallet_id,
            total_amount,
            monthly_installment,
            total_months,
            description
        );
        
        let user_emis = wallet_system::get_user_emis(ADMIN_ADDR, USER1_ADDR);
        let emi_id = *vector::borrow(&user_emis, 0);
        
        // Make first payment
        timestamp::fast_forward_seconds(2629746);
        wallet_system::collect_emi_payment(&company, ADMIN_ADDR, emi_id);
        
        // Make second payment
        timestamp::fast_forward_seconds(2629746);
        wallet_system::collect_emi_payment(&company, ADMIN_ADDR, emi_id);
        
        // Make final payment
        timestamp::fast_forward_seconds(2629746);
        wallet_system::collect_emi_payment(&company, ADMIN_ADDR, emi_id);
        
        // EMI should be completed now
        let emi = wallet_system::get_emi_agreement(ADMIN_ADDR, emi_id);
        assert!(option::is_some(&emi), 1);
    }

    #[test]
    fun test_view_functions() {
        let (admin, user1, _user2, _, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet and UPI IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let upi_id1 = string::utf8(b"user1@upi");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_upi_id(&user1, ADMIN_ADDR, upi_id1);
        
        // Test all view functions
        let addr_by_wallet = wallet_system::get_address_by_wallet_id(ADMIN_ADDR, wallet_id1);
        let addr_by_upi = wallet_system::get_address_by_upi_id(ADMIN_ADDR, upi_id1);
        let wallet_by_addr = wallet_system::get_wallet_id_by_address(ADMIN_ADDR, USER1_ADDR);
        let upi_by_addr = wallet_system::get_upi_id_by_address(ADMIN_ADDR, USER1_ADDR);
        
        assert!(option::is_some(&addr_by_wallet), 1);
        assert!(option::is_some(&addr_by_upi), 2);
        assert!(option::is_some(&wallet_by_addr), 3);
        assert!(option::is_some(&upi_by_addr), 4);
        
        assert!(*option::borrow(&addr_by_wallet) == USER1_ADDR, 5);
        assert!(*option::borrow(&addr_by_upi) == USER1_ADDR, 6);
        assert!(*option::borrow(&wallet_by_addr) == wallet_id1, 7);
        assert!(*option::borrow(&upi_by_addr) == upi_id1, 8);
        
        // Test non-existent lookups
        let nonexistent_wallet = string::utf8(b"nonexistent");
        let addr_nonexistent = wallet_system::get_address_by_wallet_id(ADMIN_ADDR, nonexistent_wallet);
        assert!(option::is_none(&addr_nonexistent), 9);
        
        // Test empty user lists
        let empty_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER2_ADDR);
        let empty_splits = wallet_system::get_user_split_bills(ADMIN_ADDR, USER2_ADDR);
        let empty_emis = wallet_system::get_user_emis(ADMIN_ADDR, USER2_ADDR);
        
        assert!(vector::length(&empty_requests) == 0, 10);
        assert!(vector::length(&empty_splits) == 0, 11);
        assert!(vector::length(&empty_emis) == 0, 12);
    }

    #[test]
    fun test_complex_split_bill_scenario() {
        let (admin, user1, user2, user3, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"alice_wallet");
        let wallet_id2 = string::utf8(b"bob_wallet");
        let wallet_id3 = string::utf8(b"charlie_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        wallet_system::register_wallet_id(&user3, ADMIN_ADDR, wallet_id3);
        
        // Create unequal split bill - Alice pays for dinner, Bob owes 800, Charlie owes 1200
        let total_amount = 2000u64;
        let description = string::utf8(b"Fancy dinner at restaurant");
        
        let participant_wallet_ids = vector::empty<String>();
        vector::push_back(&mut participant_wallet_ids, wallet_id2); // Bob
        vector::push_back(&mut participant_wallet_ids, wallet_id3); // Charlie
        
        let participant_amounts = vector::empty<u64>();
        vector::push_back(&mut participant_amounts, 800u64);  // Bob's share
        vector::push_back(&mut participant_amounts, 1200u64); // Charlie's share
        
        wallet_system::create_split_bill(
            &user1, // Alice creates the split
            ADMIN_ADDR,
            total_amount,
            description,
            participant_wallet_ids,
            participant_amounts
        );
        
        // Verify split bill creation
        let alice_splits = wallet_system::get_user_split_bills(ADMIN_ADDR, USER1_ADDR);
        let bob_splits = wallet_system::get_user_split_bills(ADMIN_ADDR, USER2_ADDR);
        let charlie_splits = wallet_system::get_user_split_bills(ADMIN_ADDR, USER3_ADDR);
        
        assert!(vector::length(&alice_splits) == 1, 1);
        assert!(vector::length(&bob_splits) == 1, 2);
        assert!(vector::length(&charlie_splits) == 1, 3);
        
        // Verify payment requests were created
        let bob_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER2_ADDR);
        let charlie_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER3_ADDR);
        assert!(vector::length(&bob_requests) == 1, 4);
        assert!(vector::length(&charlie_requests) == 1, 5);
        
        // Bob pays his share
        let bob_request_id = *vector::borrow(&bob_requests, 0);
        wallet_system::pay_request(&user2, ADMIN_ADDR, bob_request_id);
        
        // Charlie rejects his share
        let charlie_request_id = *vector::borrow(&charlie_requests, 0);
        wallet_system::reject_request(&user3, ADMIN_ADDR, charlie_request_id);
        
        // Verify requests still exist but have different statuses
        let bob_request = wallet_system::get_payment_request(ADMIN_ADDR, bob_request_id);
        let charlie_request = wallet_system::get_payment_request(ADMIN_ADDR, charlie_request_id);
        assert!(option::is_some(&bob_request), 6);
        assert!(option::is_some(&charlie_request), 7);
    }

    #[test]
    fun test_edge_cases() {
        let (admin, user1, user2, _, _) = setup_test_accounts();
        
        wallet_system::initialize(&admin);
        
        // Register wallet IDs
        let wallet_id1 = string::utf8(b"user1_wallet");
        let wallet_id2 = string::utf8(b"user2_wallet");
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        
        // Test minimum amounts
        wallet_system::create_payment_request(&user1, ADMIN_ADDR, wallet_id2, 1u64, string::utf8(b"Minimum payment"));
        
        // Test large amounts
        let large_amount = 18446744073709551615u64; // Max u64
        wallet_system::create_payment_request(&user1, ADMIN_ADDR, wallet_id2, large_amount, string::utf8(b"Large payment"));
        
        // Test empty description
        wallet_system::create_payment_request(&user1, ADMIN_ADDR, wallet_id2, 100u64, string::utf8(b""));
        
        // Test long description
        let long_desc = string::utf8(b"This is a very long description that tests the system's ability to handle lengthy strings without issues and ensures proper storage and retrieval");
        wallet_system::create_payment_request(&user1, ADMIN_ADDR, wallet_id2, 100u64, long_desc);
        
        // Verify all requests were created
        let user2_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER2_ADDR);
        assert!(vector::length(&user2_requests) == 4, 1);
    }

    #[test]
    fun test_integration_scenario() {
        let (admin, user1, user2, user3, company) = setup_test_accounts();
        setup_coins_and_fund_accounts(&admin, &user1, &user2, &user3, &company);
        
        wallet_system::initialize(&admin);
        
        // Register all users
        let wallet_id1 = string::utf8(b"alice");
        let wallet_id2 = string::utf8(b"bob");
        let wallet_id3 = string::utf8(b"charlie");
        let company_wallet = string::utf8(b"techcorp");
        let upi_id1 = string::utf8(b"alice@bank");
        
        wallet_system::register_wallet_id(&user1, ADMIN_ADDR, wallet_id1);
        wallet_system::register_wallet_id(&user2, ADMIN_ADDR, wallet_id2);
        wallet_system::register_wallet_id(&user3, ADMIN_ADDR, wallet_id3);
        wallet_system::register_wallet_id(&company, ADMIN_ADDR, company_wallet);
        wallet_system::register_upi_id(&user1, ADMIN_ADDR, upi_id1);
        
        // Scenario 1: Alice creates a split bill for lunch
        let lunch_participants = vector::empty<String>();
        vector::push_back(&mut lunch_participants, wallet_id2);
        vector::push_back(&mut lunch_participants, wallet_id3);
        
        let lunch_amounts = vector::empty<u64>();
        vector::push_back(&mut lunch_amounts, 250u64);
        vector::push_back(&mut lunch_amounts, 250u64);
        
        wallet_system::create_split_bill(
            &user1,
            ADMIN_ADDR,
            500u64,
            string::utf8(b"Team lunch"),
            lunch_participants,
            lunch_amounts
        );
        
        // Scenario 2: Alice takes an EMI from TechCorp
        wallet_system::create_emi_agreement(
            &user1,
            ADMIN_ADDR,
            company_wallet,
            6000u64,
            500u64,
            12u64,
            string::utf8(b"Laptop purchase")
        );
        
        // Scenario 3: Bob creates a personal payment request to Alice
        wallet_system::create_payment_request(
            &user2,
            ADMIN_ADDR,
            wallet_id1,
            100u64,
            string::utf8(b"Coffee money")
        );
        
        // Fast forward and make EMI payment
        timestamp::fast_forward_seconds(2629746);
        let alice_emis = wallet_system::get_user_emis(ADMIN_ADDR, USER1_ADDR);
        let emi_id = *vector::borrow(&alice_emis, 0);
        wallet_system::collect_emi_payment(&company, ADMIN_ADDR, emi_id);
        
        // Verify final state
        let alice_requests = wallet_system::get_user_payment_requests(ADMIN_ADDR, USER1_ADDR);
        let alice_splits = wallet_system::get_user_split_bills(ADMIN_ADDR, USER1_ADDR);
        let alice_emis_final = wallet_system::get_user_emis(ADMIN_ADDR, USER1_ADDR);
        
        assert!(vector::length(&alice_requests) == 1, 1); // Coffee money request
        assert!(vector::length(&alice_splits) == 1, 2);   // Lunch split
        assert!(vector::length(&alice_emis_final) == 1, 3); // Laptop EMI
        
        // Verify company has the EMI
        let company_emis = wallet_system::get_company_emis(ADMIN_ADDR, COMPANY_ADDR);
        assert!(vector::length(&company_emis) == 1, 4);
    }
}