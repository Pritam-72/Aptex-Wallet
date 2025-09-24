#[test_only]
module aptos_contract::wallet_tests {
    use std::string;
    use std::vector;
    use std::option;
    use aptos_framework::account;
    use aptos_contract::wallet_system;

    #[test(admin = @0x123, alice = @0x456, bob = @0x789, charlie = @0x101)]
    public fun test_complete_wallet_flow(
        admin: &signer,
        alice: &signer,
        bob: &signer,
        charlie: &signer
    ) {
        // Initialize the wallet system
        wallet_system::initialize(admin);
        let admin_addr = signer::address_of(admin);
        let alice_addr = signer::address_of(alice);
        let bob_addr = signer::address_of(bob);
        let charlie_addr = signer::address_of(charlie);

        // Test 1: Register wallet IDs
        wallet_system::register_wallet_id(alice, admin_addr, string::utf8(b"alice-wallet"));
        wallet_system::register_wallet_id(bob, admin_addr, string::utf8(b"bob-wallet"));
        wallet_system::register_wallet_id(charlie, admin_addr, string::utf8(b"charlie-wallet"));

        // Test 2: Register UPI IDs
        wallet_system::register_upi_id(alice, admin_addr, string::utf8(b"alice123@upi"));
        wallet_system::register_upi_id(bob, admin_addr, string::utf8(b"bob456@upi"));

        // Verify wallet ID mappings
        let alice_addr_from_wallet = wallet_system::get_address_by_wallet_id(
            admin_addr, 
            string::utf8(b"alice-wallet")
        );
        assert!(option::is_some(&alice_addr_from_wallet), 1);
        assert!(*option::borrow(&alice_addr_from_wallet) == alice_addr, 2);

        // Verify UPI ID mappings
        let alice_addr_from_upi = wallet_system::get_address_by_upi_id(
            admin_addr, 
            string::utf8(b"alice123@upi")
        );
        assert!(option::is_some(&alice_addr_from_upi), 3);
        assert!(*option::borrow(&alice_addr_from_upi) == alice_addr, 4);

        // Test 3: Create payment request
        wallet_system::create_payment_request(
            alice,
            admin_addr,
            string::utf8(b"bob-wallet"),
            1000000, // 1 APT in octas
            string::utf8(b"Lunch money")
        );

        // Verify payment request was created
        let bob_requests = wallet_system::get_user_payment_requests(admin_addr, bob_addr);
        assert!(vector::length(&bob_requests) == 1, 5);

        let request_id = *vector::borrow(&bob_requests, 0);
        let request = wallet_system::get_payment_request(admin_addr, request_id);
        assert!(option::is_some(&request), 6);
        
        let req_details = *option::borrow(&request);
        assert!(req_details.from == alice_addr, 7);
        assert!(req_details.to == bob_addr, 8);
        assert!(req_details.amount == 1000000, 9);

        // Test 4: Pay the request
        wallet_system::pay_request(bob, admin_addr, request_id);

        // Verify payment was processed
        let updated_request = wallet_system::get_payment_request(admin_addr, request_id);
        let updated_req_details = *option::borrow(&updated_request);
        assert!(updated_req_details.status == 1, 10); // STATUS_PAID

        // Test 5: Create split bill
        let participants = vector::empty<string::String>();
        vector::push_back(&mut participants, string::utf8(b"bob-wallet"));
        vector::push_back(&mut participants, string::utf8(b"charlie-wallet"));

        wallet_system::create_split_bill(
            alice,
            admin_addr,
            3000000, // 3 APT total
            string::utf8(b"Dinner at restaurant"),
            participants
        );

        // Verify split bill was created
        let alice_splits = wallet_system::get_user_split_bills(admin_addr, alice_addr);
        assert!(vector::length(&alice_splits) == 1, 11);

        let split_id = *vector::borrow(&alice_splits, 0);
        let split_bill = wallet_system::get_split_bill(admin_addr, split_id);
        assert!(option::is_some(&split_bill), 12);

        let split_details = *option::borrow(&split_bill);
        assert!(split_details.creator == alice_addr, 13);
        assert!(split_details.total_amount == 3000000, 14);
        assert!(split_details.amount_per_person == 1000000, 15); // 3 APT / 3 people

        // Verify payment requests were created for split bill participants
        let bob_new_requests = wallet_system::get_user_payment_requests(admin_addr, bob_addr);
        let charlie_requests = wallet_system::get_user_payment_requests(admin_addr, charlie_addr);
        
        // Bob should have 2 requests now (1 paid + 1 from split)
        assert!(vector::length(&bob_new_requests) == 2, 16);
        // Charlie should have 1 request from split
        assert!(vector::length(&charlie_requests) == 1, 17);
    }

    #[test(admin = @0x123, alice = @0x456)]
    #[expected_failure(abort_code = 0x80001)]
    public fun test_duplicate_wallet_id(admin: &signer, alice: &signer) {
        wallet_system::initialize(admin);
        let admin_addr = signer::address_of(admin);
        
        wallet_system::register_wallet_id(alice, admin_addr, string::utf8(b"test-wallet"));
        // This should fail
        wallet_system::register_wallet_id(alice, admin_addr, string::utf8(b"test-wallet"));
    }

    #[test(admin = @0x123, alice = @0x456)]
    #[expected_failure(abort_code = 0x80002)]
    public fun test_duplicate_upi_id(admin: &signer, alice: &signer) {
        wallet_system::initialize(admin);
        let admin_addr = signer::address_of(admin);
        
        wallet_system::register_upi_id(alice, admin_addr, string::utf8(b"test@upi"));
        // This should fail
        wallet_system::register_upi_id(alice, admin_addr, string::utf8(b"test@upi"));
    }

    #[test(admin = @0x123, alice = @0x456, bob = @0x789)]
    public fun test_reject_payment_request(admin: &signer, alice: &signer, bob: &signer) {
        wallet_system::initialize(admin);
        let admin_addr = signer::address_of(admin);
        
        // Register users
        wallet_system::register_wallet_id(alice, admin_addr, string::utf8(b"alice-wallet"));
        wallet_system::register_wallet_id(bob, admin_addr, string::utf8(b"bob-wallet"));
        
        // Create payment request
        wallet_system::create_payment_request(
            alice,
            admin_addr,
            string::utf8(b"bob-wallet"),
            500000,
            string::utf8(b"Coffee money")
        );
        
        let bob_addr = signer::address_of(bob);
        let bob_requests = wallet_system::get_user_payment_requests(admin_addr, bob_addr);
        let request_id = *vector::borrow(&bob_requests, 0);
        
        // Reject the request
        wallet_system::reject_request(bob, admin_addr, request_id);
        
        // Verify request was rejected
        let request = wallet_system::get_payment_request(admin_addr, request_id);
        let req_details = *option::borrow(&request);
        assert!(req_details.status == 2, 1); // STATUS_REJECTED
    }
}