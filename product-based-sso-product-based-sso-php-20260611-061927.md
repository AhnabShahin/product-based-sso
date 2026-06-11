# Plugin Check Report

**Plugin:** Product Based SSO
**Generated at:** 2026-06-11 06:19:27


## `src/.DS_Store`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | hidden_files | Hidden files are not permitted. |  |

## `.DS_Store`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | hidden_files | Hidden files are not permitted. |  |

## `src/Controllers/SwitchController.php`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 74 | 41 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$logo'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) |
| 74 | 61 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$name'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) |
| 79 | 58 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$name'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) |
| 98 | 13 | WARNING | WordPress.Security.SafeRedirect.wp_redirect_wp_redirect | wp_redirect() found. Using wp_safe_redirect(), along with the &quot;allowed_redirect_hosts&quot; filter if needed, can help avoid any chances of malicious redirects within code. It is also important to remember to call exit() after a redirect so that no other unwanted code is executed. | [Docs](https://developer.wordpress.org/reference/functions/wp_safe_redirect/) |
| 111 | 40 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  |
| 115 | 9 | WARNING | WordPress.Security.SafeRedirect.wp_redirect_wp_redirect | wp_redirect() found. Using wp_safe_redirect(), along with the &quot;allowed_redirect_hosts&quot; filter if needed, can help avoid any chances of malicious redirects within code. It is also important to remember to call exit() after a redirect so that no other unwanted code is executed. | [Docs](https://developer.wordpress.org/reference/functions/wp_safe_redirect/) |
| 279 | 40 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;HTTP_CLIENT_IP&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  |
| 282 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;HTTP_X_FORWARDED_FOR&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  |
| 282 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.InputNotSanitized | Detected usage of a non-sanitized input variable: $_SERVER[&#039;HTTP_X_FORWARDED_FOR&#039;] |  |
| 285 | 69 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;REMOTE_ADDR&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  |

## `src/Controllers/SsoController.php`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 267 | 41 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$safeEmail'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) |
| 269 | 47 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$fromLabel'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) |
| 288 | 37 | ERROR | WordPress.Security.EscapeOutput.OutputNotEscaped | All output should be run through an escaping function (see the Security sections in the WordPress Developer Handbooks), found '$jsonToken'. | [Docs](https://developer.wordpress.org/apis/security/escaping/#escaping-functions) |
| 413 | 16 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  |
| 414 | 45 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  |
| 416 | 16 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  |
| 417 | 45 | WARNING | WordPress.Security.NonceVerification.Recommended | Processing form data without nonce verification. |  |

## `src/Repositories/AuthKeyRepository.php`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 28 | 13 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;SELECT * FROM {$table} WHERE auth_key_hash = %s AND expires_at &gt;= %s ORDER BY id DESC LIMIT 1&quot; |  |
| 33 | 16 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  |
| 33 | 16 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  |
| 33 | 23 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $sql used in $wpdb->get_row()\n$sql assigned unsafely at line 27. |  |
| 33 | 31 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $sql |  |
| 41 | 16 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  |
| 52 | 16 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  |
| 52 | 16 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  |
| 52 | 23 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table used in $wpdb-&gt;query()\n$table assigned unsafely at line 49. |  |
| 53 | 13 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;DELETE FROM {$table} WHERE expires_at &lt; %s&quot; |  |

## `src/Repositories/LogRepository.php`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 20 | 16 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  |
| 46 | 16 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  |
| 46 | 16 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  |
| 46 | 23 | ERROR | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $sql used in $wpdb->get_results()\n$sql assigned unsafely at line 42. |  |
| 46 | 50 | ERROR | WordPress.DB.PreparedSQL.NotPrepared | Use placeholders and $wpdb->prepare(); found $sql |  |
| 53 | 23 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $table used in $wpdb-&gt;query()\n$table assigned unsafely at line 52. |  |
| 53 | 29 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$table} at &quot;TRUNCATE TABLE {$table}&quot; |  |

## `readme.txt`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | ERROR | readme_mismatched_header_requires | Mismatched Requires at least: 6.0 != 5.8. "Requires at least" needs to be exactly the same with that in your main plugin file's header. | [Docs](https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/#readme-header-information) |

## `src/Traits/EncryptionTrait.php`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 20 | 0 | ERROR | wp_function_not_compatible_with_requires_wp | Function "str_starts_with()" requires WordPress 5.9.0, but your plugin minimum supported version is WordPress 5.8.0. | [Docs](https://developer.wordpress.org/reference/) |

## `src/Controllers/DashboardController.php`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 33 | 29 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  |
| 33 | 29 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  |
| 33 | 36 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $logsTable used in $wpdb-&gt;get_var()\n$logsTable assigned unsafely at line 32. |  |
| 33 | 44 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$logsTable} at &quot;SELECT COUNT(*) FROM {$logsTable}&quot; |  |
| 34 | 31 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  |
| 34 | 31 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  |
| 34 | 38 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $logsTable used in $wpdb-&gt;get_var()\n$logsTable assigned unsafely at line 32. |  |
| 35 | 13 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$logsTable} at &quot;SELECT COUNT(*) FROM {$logsTable} WHERE event_type = %s&quot; |  |
| 38 | 30 | WARNING | WordPress.DB.DirectDatabaseQuery.DirectQuery | Use of a direct database call is discouraged. |  |
| 38 | 30 | WARNING | WordPress.DB.DirectDatabaseQuery.NoCaching | Direct database call without caching detected. Consider using wp_cache_get() / wp_cache_set() or wp_cache_delete(). |  |
| 38 | 37 | WARNING | PluginCheck.Security.DirectDB.UnescapedDBParameter | Unescaped parameter $logsTable used in $wpdb-&gt;get_var()\n$logsTable assigned unsafely at line 32. |  |
| 39 | 13 | WARNING | WordPress.DB.PreparedSQL.InterpolatedNotPrepared | Use placeholders and $wpdb-&gt;prepare(); found interpolated variable {$logsTable} at &quot;SELECT COUNT(*) FROM {$logsTable} WHERE event_type != %s&quot; |  |

## `src/Controllers/ValidateController.php`

| Line | Column | Type | Code | Message | Docs |
| --- | --- | --- | --- | --- | --- |
| 189 | 19 | WARNING | WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound | Hook names invoked by a theme/plugin should start with the theme/plugin prefix. Found: &quot;wp_login&quot;. |  |
| 259 | 40 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;HTTP_CLIENT_IP&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  |
| 262 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;HTTP_X_FORWARDED_FOR&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  |
| 262 | 35 | WARNING | WordPress.Security.ValidatedSanitizedInput.InputNotSanitized | Detected usage of a non-sanitized input variable: $_SERVER[&#039;HTTP_X_FORWARDED_FOR&#039;] |  |
| 265 | 69 | WARNING | WordPress.Security.ValidatedSanitizedInput.MissingUnslash | $_SERVER[&#039;REMOTE_ADDR&#039;] not unslashed before sanitization. Use wp_unslash() or similar |  |
