=== Product Based SSO ===
Contributors: BdAddons
Tags: sso, single sign-on, cross-domain, authentication, rest api
Requires at least: 6.0
Tested up to: 7.0
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://gnu.org/licenses/gpl-2.0.html

A secure cross-domain single sign-on solution that enables users to switch between distinct WordPress sites using short-lived, device-bound tokens.

== Description ==

Product Based SSO provides a secure and seamless way to authenticate users across multiple independent WordPress installations (defined as "products"). When a user switches to a connected site, they are automatically logged in using a highly secure, short-lived token without requiring manual credentials or explicit interactions.

The plugin treats each site as an individual environment utilizing dedicated encryption keys and strict data validation layers via the WP REST API.

= Core Architectural Highlights =
* **Secure Web Keys:** Unique secrets generated per product environment by the administrator, utilized to cryptographically sign tokens.
* **Short-Lived Authorization Tokens:** Outbound `auth_key` parameters are bound by a rigid 30-second expiry window to safeguard against replay attacks.
* **Cryptographic Device Binding:** Every single token structure incorporates user-specific parameters, such as device fingerprints, IP addresses, and user-agents. Tokens are immediately rejected if a mismatch is detected.
* **Automatic Database Pruning:** Automated cleanup tasks dynamically purge expired keys from the tracking tables, keeping your database thin and fast.
* **React-Powered Settings Interface:** A streamlined, interactive settings hub built with a modern React UI using native WordPress components.

== Installation ==

1. Upload the entire `product-based-sso` directory to your network or site's `/wp-content/plugins/` folder.
2. Activate the plugin via the 'Plugins' menu page in your WordPress dashboard.
3. Access the 'Product SSO' configuration panel in the admin sidebar menu to establish database tables and generate your site's unique Web Key.
4. Exchange Web Keys with your other designated remote sites to register them as trusted products.

== FAQ ==

= How are auth tokens protected from being intercepted? =
Every single sign-on generation action creates a Base64-encoded token containing a stable payload signed with an HMAC SHA-256 signature using the target product's unique `web_key`. Additionally, the plugin strictly mandates HTTPS connections for routing operations.

= What happens if a device fingerprint shifts mid-transit? =
If a user attempts to utilize a link where the browser signature, screen specifications, or IP addresses change across products, the validation engine drops the lifecycle authentication routine instantly and surfaces an explicit validation error.

= How do expired keys get cleaned out? =
The tracking engine performs an on-the-fly cleanup query on incoming authorization operations to drop rows where `expires_at < NOW()`, preventing bloated tables without depending on massive background resource queues.

== Screenshots ==

1. The React-driven Product Management interface dashboard where admins input and track remote environments.
2. The user-facing Product Switcher navigation list detailing interconnected network systems.

== Changelog ==

= 1.0.0 =
* Initial release.
* Implemented HMAC SHA-256 token verification and creation pipelines.
* Integrated strict 30-second expiration checks and automatic device fingerprint tracking profiles.
* Added the React-powered administration interface utilizing `@wordpress/scripts`.