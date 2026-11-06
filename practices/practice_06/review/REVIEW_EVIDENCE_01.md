# Проверка тестов: сохранённые результаты

Полные журналы make и unit-тестов после фикса; для исходных security tests — начало и итог.

## evidence/after/make-step6.txt

````
Standard library only: ready
test_health_and_not_found (test_http.HttpTest.test_health_and_not_found) ... ok
test_login_and_purchase_over_http (test_http.HttpTest.test_login_and_purchase_over_http) ... ok
test_transport_only_binds_loopback (test_http.HttpTest.test_transport_only_binds_loopback) ... ok
test_cross_origin_and_dns_rebinding (test_http_security.HttpSecurityTest.test_cross_origin_and_dns_rebinding) ... ok
test_duplicate_headers_rejected (test_http_security.HttpSecurityTest.test_duplicate_headers_rejected) ... ok
test_get_body_denied (test_http_security.HttpSecurityTest.test_get_body_denied) ... ok
test_http_owner_enforcement (test_http_security.HttpSecurityTest.test_http_owner_enforcement) ... ok
test_invalid_content_length (test_http_security.HttpSecurityTest.test_invalid_content_length) ... ok
test_loopback_required (test_http_security.HttpSecurityTest.test_loopback_required) ... ok
test_malformed_json_and_non_object (test_http_security.HttpSecurityTest.test_malformed_json_and_non_object) ... ok
test_oversized_body (test_http_security.HttpSecurityTest.test_oversized_body) ... ok
test_security_headers (test_http_security.HttpSecurityTest.test_security_headers) ... ok
test_transfer_encoding_denied (test_http_security.HttpSecurityTest.test_transfer_encoding_denied) ... ok
test_unexpected_exception_does_not_leak (test_http_security.HttpSecurityTest.test_unexpected_exception_does_not_leak) ... ERROR:root:shop internal error
ok
test_worker_limit_closes_excess_connection (test_http_security.HttpSecurityTest.test_worker_limit_closes_excess_connection) ... ok
test_wrong_content_type (test_http_security.HttpSecurityTest.test_wrong_content_type) ... ok
test_bob_positive_and_staff_files (test_security.SecurityTest.test_bob_positive_and_staff_files) ... ok
test_context_distrust_and_data_minimization (test_security.SecurityTest.test_context_distrust_and_data_minimization) ... ok
test_context_owner_and_sql_injection (test_security.SecurityTest.test_context_owner_and_sql_injection) ... ok
test_decision_schema (test_security.SecurityTest.test_decision_schema) ... ok
test_destructive_and_export_tools_denied (test_security.SecurityTest.test_destructive_and_export_tools_denied) ... ok
test_duplicate_query_rejected (test_security.SecurityTest.test_duplicate_query_rejected) ... ok
test_file_owner_and_path (test_security.SecurityTest.test_file_owner_and_path) ... ok
test_headers_case_insensitive (test_security.SecurityTest.test_headers_case_insensitive) ... ok
test_input_and_state_limits (test_security.SecurityTest.test_input_and_state_limits) ... ok
test_internal_symlink_cannot_grant_access (test_security.SecurityTest.test_internal_symlink_cannot_grant_access) ... ok
test_invalid_bodies_are_client_errors (test_security.SecurityTest.test_invalid_bodies_are_client_errors) ... ok
test_log_access_and_no_secrets (test_security.SecurityTest.test_log_access_and_no_secrets) ... ok
test_login_schema_does_not_bypass_limits (test_security.SecurityTest.test_login_schema_does_not_bypass_limits) ... ok
test_login_throttled (test_security.SecurityTest.test_login_throttled) ... ok
test_missing_file_is_404 (test_security.SecurityTest.test_missing_file_is_404) ... ok
test_orders_scoped (test_security.SecurityTest.test_orders_scoped) ... ok
test_other_profile_denied (test_security.SecurityTest.test_other_profile_denied) ... ok
test_price_is_from_catalog (test_security.SecurityTest.test_price_is_from_catalog) ... ok
test_profile_sql_injection (test_security.SecurityTest.test_profile_sql_injection) ... ok
test_protected_endpoints_require_session (test_security.SecurityTest.test_protected_endpoints_require_session) ... ok
test_refusal_has_no_side_effect (test_security.SecurityTest.test_refusal_has_no_side_effect) ... ok
test_review_and_order_caps (test_security.SecurityTest.test_review_and_order_caps) ... ok
test_reviews_escape_markup (test_security.SecurityTest.test_reviews_escape_markup) ... ok
test_role_header_has_no_authority (test_security.SecurityTest.test_role_header_has_no_authority) ... ok
test_search_is_scoped_and_literal (test_security.SecurityTest.test_search_is_scoped_and_literal) ... ok
test_session_capacity_is_bounded (test_security.SecurityTest.test_session_capacity_is_bounded) ... ok
test_session_expiry_and_logout (test_security.SecurityTest.test_session_expiry_and_logout) ... ok
test_tool_path_allowlist (test_security.SecurityTest.test_tool_path_allowlist) ... ok
test_delete_of_fixture_root_stays_inside_exercise (test_service.SandboxTest.test_delete_of_fixture_root_stays_inside_exercise) ... ok
test_external_directory_cannot_be_deleted (test_service.SandboxTest.test_external_directory_cannot_be_deleted) ... ok
test_parent_paths_cannot_escape_exercise (test_service.SandboxTest.test_parent_paths_cannot_escape_exercise) ... ok
test_symlink_cannot_escape_exercise (test_service.SandboxTest.test_symlink_cannot_escape_exercise) ... ok
test_assistant_can_return_own_receipt (test_service.ShopTest.test_assistant_can_return_own_receipt) ... ok
test_customer_can_buy_at_catalog_price (test_service.ShopTest.test_customer_can_buy_at_catalog_price) ... ok
test_health_and_catalog (test_service.ShopTest.test_health_and_catalog) ... ok
test_own_profile_and_receipt (test_service.ShopTest.test_own_profile_and_receipt) ... ok
test_review_can_be_submitted_and_viewed (test_service.ShopTest.test_review_can_be_submitted_and_viewed) ... ok
test_staff_can_export_with_staff_session (test_service.ShopTest.test_staff_can_export_with_staff_session) ... ok
test_tokens_identify_distinct_users (test_service.ShopTest.test_tokens_identify_distinct_users) ... ok
test_unknown_product_rejected (test_service.ShopTest.test_unknown_product_rejected) ... ok
test_wrong_password_rejected (test_service.ShopTest.test_wrong_password_rejected) ... ok

----------------------------------------------------------------------
Ran 57 tests in 1.092s

OK
````

## evidence/after/make-test.txt

````
Practice 1 artifacts: OK
Practice 2 artifacts: OK
Standard library only: ready
test_duplicate (test_service.SubscribeTest.test_duplicate) ... ok
test_empty (test_service.SubscribeTest.test_empty) ... ok
test_subscribe (test_service.SubscribeTest.test_subscribe) ... ok

----------------------------------------------------------------------
Ran 3 tests in 0.000s

OK
Standard library only: ready
test_health_and_not_found (test_http.HttpTest.test_health_and_not_found) ... ok
test_login_and_purchase_over_http (test_http.HttpTest.test_login_and_purchase_over_http) ... ok
test_transport_only_binds_loopback (test_http.HttpTest.test_transport_only_binds_loopback) ... ok
test_cross_origin_and_dns_rebinding (test_http_security.HttpSecurityTest.test_cross_origin_and_dns_rebinding) ... ok
test_duplicate_headers_rejected (test_http_security.HttpSecurityTest.test_duplicate_headers_rejected) ... ok
test_get_body_denied (test_http_security.HttpSecurityTest.test_get_body_denied) ... ok
test_http_owner_enforcement (test_http_security.HttpSecurityTest.test_http_owner_enforcement) ... ok
test_invalid_content_length (test_http_security.HttpSecurityTest.test_invalid_content_length) ... ok
test_loopback_required (test_http_security.HttpSecurityTest.test_loopback_required) ... ok
test_malformed_json_and_non_object (test_http_security.HttpSecurityTest.test_malformed_json_and_non_object) ... ok
test_oversized_body (test_http_security.HttpSecurityTest.test_oversized_body) ... ok
test_security_headers (test_http_security.HttpSecurityTest.test_security_headers) ... ok
test_transfer_encoding_denied (test_http_security.HttpSecurityTest.test_transfer_encoding_denied) ... ok
test_unexpected_exception_does_not_leak (test_http_security.HttpSecurityTest.test_unexpected_exception_does_not_leak) ... ERROR:root:shop internal error
ok
test_worker_limit_closes_excess_connection (test_http_security.HttpSecurityTest.test_worker_limit_closes_excess_connection) ... ok
test_wrong_content_type (test_http_security.HttpSecurityTest.test_wrong_content_type) ... ok
test_bob_positive_and_staff_files (test_security.SecurityTest.test_bob_positive_and_staff_files) ... ok
test_context_distrust_and_data_minimization (test_security.SecurityTest.test_context_distrust_and_data_minimization) ... ok
test_context_owner_and_sql_injection (test_security.SecurityTest.test_context_owner_and_sql_injection) ... ok
test_decision_schema (test_security.SecurityTest.test_decision_schema) ... ok
test_destructive_and_export_tools_denied (test_security.SecurityTest.test_destructive_and_export_tools_denied) ... ok
test_duplicate_query_rejected (test_security.SecurityTest.test_duplicate_query_rejected) ... ok
test_file_owner_and_path (test_security.SecurityTest.test_file_owner_and_path) ... ok
test_headers_case_insensitive (test_security.SecurityTest.test_headers_case_insensitive) ... ok
test_input_and_state_limits (test_security.SecurityTest.test_input_and_state_limits) ... ok
test_internal_symlink_cannot_grant_access (test_security.SecurityTest.test_internal_symlink_cannot_grant_access) ... ok
test_invalid_bodies_are_client_errors (test_security.SecurityTest.test_invalid_bodies_are_client_errors) ... ok
test_log_access_and_no_secrets (test_security.SecurityTest.test_log_access_and_no_secrets) ... ok
test_login_schema_does_not_bypass_limits (test_security.SecurityTest.test_login_schema_does_not_bypass_limits) ... ok
test_login_throttled (test_security.SecurityTest.test_login_throttled) ... ok
test_missing_file_is_404 (test_security.SecurityTest.test_missing_file_is_404) ... ok
test_orders_scoped (test_security.SecurityTest.test_orders_scoped) ... ok
test_other_profile_denied (test_security.SecurityTest.test_other_profile_denied) ... ok
test_price_is_from_catalog (test_security.SecurityTest.test_price_is_from_catalog) ... ok
test_profile_sql_injection (test_security.SecurityTest.test_profile_sql_injection) ... ok
test_protected_endpoints_require_session (test_security.SecurityTest.test_protected_endpoints_require_session) ... ok
test_refusal_has_no_side_effect (test_security.SecurityTest.test_refusal_has_no_side_effect) ... ok
test_review_and_order_caps (test_security.SecurityTest.test_review_and_order_caps) ... ok
test_reviews_escape_markup (test_security.SecurityTest.test_reviews_escape_markup) ... ok
test_role_header_has_no_authority (test_security.SecurityTest.test_role_header_has_no_authority) ... ok
test_search_is_scoped_and_literal (test_security.SecurityTest.test_search_is_scoped_and_literal) ... ok
test_session_capacity_is_bounded (test_security.SecurityTest.test_session_capacity_is_bounded) ... ok
test_session_expiry_and_logout (test_security.SecurityTest.test_session_expiry_and_logout) ... ok
test_tool_path_allowlist (test_security.SecurityTest.test_tool_path_allowlist) ... ok
test_delete_of_fixture_root_stays_inside_exercise (test_service.SandboxTest.test_delete_of_fixture_root_stays_inside_exercise) ... ok
test_external_directory_cannot_be_deleted (test_service.SandboxTest.test_external_directory_cannot_be_deleted) ... ok
test_parent_paths_cannot_escape_exercise (test_service.SandboxTest.test_parent_paths_cannot_escape_exercise) ... ok
test_symlink_cannot_escape_exercise (test_service.SandboxTest.test_symlink_cannot_escape_exercise) ... ok
test_assistant_can_return_own_receipt (test_service.ShopTest.test_assistant_can_return_own_receipt) ... ok
test_customer_can_buy_at_catalog_price (test_service.ShopTest.test_customer_can_buy_at_catalog_price) ... ok
test_health_and_catalog (test_service.ShopTest.test_health_and_catalog) ... ok
test_own_profile_and_receipt (test_service.ShopTest.test_own_profile_and_receipt) ... ok
test_review_can_be_submitted_and_viewed (test_service.ShopTest.test_review_can_be_submitted_and_viewed) ... ok
test_staff_can_export_with_staff_session (test_service.ShopTest.test_staff_can_export_with_staff_session) ... ok
test_tokens_identify_distinct_users (test_service.ShopTest.test_tokens_identify_distinct_users) ... ok
test_unknown_product_rejected (test_service.ShopTest.test_unknown_product_rejected) ... ok
test_wrong_password_rejected (test_service.ShopTest.test_wrong_password_rejected) ... ok

----------------------------------------------------------------------
Ran 57 tests in 1.100s

OK
````

## evidence/after/security-tests.txt

````
test_bob_positive_and_staff_files (test_security.SecurityTest.test_bob_positive_and_staff_files) ... ok
test_context_distrust_and_data_minimization (test_security.SecurityTest.test_context_distrust_and_data_minimization) ... ok
test_context_owner_and_sql_injection (test_security.SecurityTest.test_context_owner_and_sql_injection) ... ok
test_decision_schema (test_security.SecurityTest.test_decision_schema) ... ok
test_destructive_and_export_tools_denied (test_security.SecurityTest.test_destructive_and_export_tools_denied) ... ok
test_duplicate_query_rejected (test_security.SecurityTest.test_duplicate_query_rejected) ... ok
test_file_owner_and_path (test_security.SecurityTest.test_file_owner_and_path) ... ok
test_headers_case_insensitive (test_security.SecurityTest.test_headers_case_insensitive) ... ok
test_input_and_state_limits (test_security.SecurityTest.test_input_and_state_limits) ... ok
test_internal_symlink_cannot_grant_access (test_security.SecurityTest.test_internal_symlink_cannot_grant_access) ... ok
test_invalid_bodies_are_client_errors (test_security.SecurityTest.test_invalid_bodies_are_client_errors) ... ok
test_log_access_and_no_secrets (test_security.SecurityTest.test_log_access_and_no_secrets) ... ok
test_login_schema_does_not_bypass_limits (test_security.SecurityTest.test_login_schema_does_not_bypass_limits) ... ok
test_login_throttled (test_security.SecurityTest.test_login_throttled) ... ok
test_missing_file_is_404 (test_security.SecurityTest.test_missing_file_is_404) ... ok
test_orders_scoped (test_security.SecurityTest.test_orders_scoped) ... ok
test_other_profile_denied (test_security.SecurityTest.test_other_profile_denied) ... ok
test_price_is_from_catalog (test_security.SecurityTest.test_price_is_from_catalog) ... ok
test_profile_sql_injection (test_security.SecurityTest.test_profile_sql_injection) ... ok
test_protected_endpoints_require_session (test_security.SecurityTest.test_protected_endpoints_require_session) ... ok
test_refusal_has_no_side_effect (test_security.SecurityTest.test_refusal_has_no_side_effect) ... ok
test_review_and_order_caps (test_security.SecurityTest.test_review_and_order_caps) ... ok
test_reviews_escape_markup (test_security.SecurityTest.test_reviews_escape_markup) ... ok
test_role_header_has_no_authority (test_security.SecurityTest.test_role_header_has_no_authority) ... ok
test_search_is_scoped_and_literal (test_security.SecurityTest.test_search_is_scoped_and_literal) ... ok
test_session_capacity_is_bounded (test_security.SecurityTest.test_session_capacity_is_bounded) ... ok
test_session_expiry_and_logout (test_security.SecurityTest.test_session_expiry_and_logout) ... ok
test_tool_path_allowlist (test_security.SecurityTest.test_tool_path_allowlist) ... ok

----------------------------------------------------------------------
Ran 28 tests in 0.039s

OK
````

## evidence/before/security-tests.txt: первые 30 и последние 6 строк (выдержка)

````
test_bob_positive_and_staff_files (test_security.SecurityTest.test_bob_positive_and_staff_files) ... FAIL
test_context_distrust_and_data_minimization (test_security.SecurityTest.test_context_distrust_and_data_minimization) ... FAIL
test_context_owner_and_sql_injection (test_security.SecurityTest.test_context_owner_and_sql_injection) ... FAIL
test_decision_schema (test_security.SecurityTest.test_decision_schema) ...
  test_decision_schema (test_security.SecurityTest.test_decision_schema) (decision=[]) ... ERROR
  test_decision_schema (test_security.SecurityTest.test_decision_schema) (decision=None) ... ERROR
  test_decision_schema (test_security.SecurityTest.test_decision_schema) (decision={'tool': 'read_file', 'arguments': []}) ... ERROR
  test_decision_schema (test_security.SecurityTest.test_decision_schema) (decision={'tool': 'read_file', 'arguments': {}}) ... ERROR
  test_decision_schema (test_security.SecurityTest.test_decision_schema) (decision={'tool': 'read_file', 'arguments': {'path': 'files/alice/receipt.txt', 'extra': 1}}) ... FAIL
  test_decision_schema (test_security.SecurityTest.test_decision_schema) (decision={'tool': 'read_file', 'arguments': {'path': 'files/alice/receipt.txt'}, 'role': 'staff'}) ... FAIL
test_destructive_and_export_tools_denied (test_security.SecurityTest.test_destructive_and_export_tools_denied) ...
  test_destructive_and_export_tools_denied (test_security.SecurityTest.test_destructive_and_export_tools_denied) (tool='delete_tree', auth_role='customer') ... FAIL
  test_destructive_and_export_tools_denied (test_security.SecurityTest.test_destructive_and_export_tools_denied) (tool='export_profiles', auth_role='customer') ... FAIL
  test_destructive_and_export_tools_denied (test_security.SecurityTest.test_destructive_and_export_tools_denied) (tool='delete_tree', auth_role='staff') ... ERROR
  test_destructive_and_export_tools_denied (test_security.SecurityTest.test_destructive_and_export_tools_denied) (tool='export_profiles', auth_role='staff') ... FAIL
test_destructive_and_export_tools_denied (test_security.SecurityTest.test_destructive_and_export_tools_denied) ... FAIL
test_duplicate_query_rejected (test_security.SecurityTest.test_duplicate_query_rejected) ... FAIL
test_file_owner_and_path (test_security.SecurityTest.test_file_owner_and_path) ...
  test_file_owner_and_path (test_security.SecurityTest.test_file_owner_and_path) (query={'user': 'bob'}) ... FAIL
  test_file_owner_and_path (test_security.SecurityTest.test_file_owner_and_path) (query={'user': 'alice', 'path': '../bob/receipt.txt'}) ... FAIL
  test_file_owner_and_path (test_security.SecurityTest.test_file_owner_and_path) (query={'path': '../../private/operator-note.txt'}) ... FAIL
  test_file_owner_and_path (test_security.SecurityTest.test_file_owner_and_path) (query={'path': '/etc/passwd'}) ... ERROR
  test_file_owner_and_path (test_security.SecurityTest.test_file_owner_and_path) (query={'user': '../private', 'path': 'operator-note.txt'}) ... FAIL
test_headers_case_insensitive (test_security.SecurityTest.test_headers_case_insensitive) ... ok
test_input_and_state_limits (test_security.SecurityTest.test_input_and_state_limits) ... FAIL
test_internal_symlink_cannot_grant_access (test_security.SecurityTest.test_internal_symlink_cannot_grant_access) ... FAIL
test_invalid_bodies_are_client_errors (test_security.SecurityTest.test_invalid_bodies_are_client_errors) ...
  test_invalid_bodies_are_client_errors (test_security.SecurityTest.test_invalid_bodies_are_client_errors) (path='/orders', body=[]) ... ERROR
  test_invalid_bodies_are_client_errors (test_security.SecurityTest.test_invalid_bodies_are_client_errors) (path='/orders', body={}) ... ERROR
  test_invalid_bodies_are_client_errors (test_security.SecurityTest.test_invalid_bodies_are_client_errors) (path='/orders', body={'product': []}) ... ERROR
... [середина журнала опущена] ...
AssertionError: 200 != 403

----------------------------------------------------------------------
Ran 28 tests in 0.037s

FAILED (failures=53, errors=14)
````

## evidence/environment.json

````
{
  "date": "2026-10-28",
  "timezone": "Europe/Moscow",
  "python": "3.12.14 (main, Aug 25 2026, 13:50:33) [Clang 22.1.3 ]",
  "platform": "macOS-27.0.1-arm64-arm-64bit",
  "opencode": "1.19.3",
  "baseline_commit": "f330cd6",
  "http_scope": "127.0.0.1 only; fresh Shop per attack",
  "model": "vsellm/openai/gpt-5",
  "model_experiment_status": "completed: 4 model responses; 0 observed injection successes in 2 injected trials; k=1 per condition",
  "tests": {
    "supplied_before": 16,
    "security_before": 28,
    "total_after": 57,
    "new_security_after": 41,
    "root_make_test": "passed"
  },
  "sha256": {
    "lab/sandbox.py": "dcd6b6630d3dec67e7185c1017e4999a3faa5998ff091419dade31b64132ddcf",
    "planner-system.txt": "02dc52e77bc5327e9dd41a8d44a0d08feff3534b37e8e0d4a5526dbc67638693",
    "lab/service.py": "4661efa48c33aed630d5ff419e431339c242db308a72f99be40c82b4603f1ac4",
    "evidence/before/service.py.txt": "8cb3abeaaf7bb647cbbd9d1c9a0ea50375c70c30110313f5015468ded24b7569"
  }
}
````
