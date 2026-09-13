# Domain connection

Prepared 13 September 2026. No DNS records have been changed. Both hostnames are pending validation. Google sign-in already authorizes both.

Current nameservers: dns1.registrar-servers.com and dns2.registrar-servers.com. Current apex A: 139.84.233.151. Email forwarding MX records exist and must remain unchanged. Provider branding alone does not establish account access.

Have Andile grant DNS access or apply these records himself. Confirm apex versus www before cutover. Capture the full current DNS zone first; this lookup is not a complete backup. Keep the old site until HTTPS, routes and redirects are verified. Add validation TXT records first; replace the website routing records only at the agreed cutover. Preserve mail and unrelated records.

| Type | Name | Value |
| --- | --- | --- |
| TXT | _openai-site-verification.andilembele.com | openai-site-verification=rPtuURY_cPE3m8tX2rkfCsE4LJJN3CFyUl5WPGOtW04 |
| TXT | _cf-custom-hostname.andilembele.com | 47dd45e5-c8d6-4b77-b65f-d91e940a034f |
| TXT | _openai-site-verification.www.andilembele.com | openai-site-verification=5UuE3PX-WyfFcMglCBYjhsneNikrU19EiXwKcv58sS8 |
| TXT | _cf-custom-hostname.www.andilembele.com | 36aee3d4-2519-4ff0-bdc1-4b6c49fc009b |
| A | andilembele.com | 162.159.143.30 |
| A | andilembele.com | 172.66.3.26 |
| CNAME | www.andilembele.com | custom-domains.chatgpt.site. |

After the DNS changes, refresh validation in Sites, verify TLS and both hostnames, configure the preferred-host redirect using the supported hosting controls, update canonical/social URLs, and check email forwarding. Do not claim the domain is live before these checks.
