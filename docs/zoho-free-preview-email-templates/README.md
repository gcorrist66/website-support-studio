# Website Support Studio Free Preview Email Templates

Prepared for Zoho Campaigns import/use. Do not send until the checklist below is complete.

## Live CTA

`https://www.websitesupportstudio.com/free-website-preview?utm_source=zoho&utm_medium=email&utm_campaign=wss_free_preview&utm_content={{segment}}`

CTA text: `Get My Free Website Preview`

## Logo Source

The templates reference the live WSS wordmark:

`https://www.websitesupportstudio.com/website-support-studio.svg`

Repo source:

`marketing/public/website-support-studio.svg`

Note: Some email clients have limited SVG support. The HTML includes alt text and a text brand fallback below the image. If Zoho or inbox tests show the SVG is not rendering reliably, export the same asset to PNG and update the `img src` to the hosted PNG URL before sending.

## Templates

| Email | Subject | Preview text | HTML | Plain text |
| --- | --- | --- | --- | --- |
| 1 | Want a free homepage preview for your business? | Answer a few questions and Website Support Studio will prepare a custom homepage preview. No payment or obligation. | `email-1-free-preview-offer.html` | `email-1-free-preview-offer.txt` |
| 2 | Local leads still check your website first | A clearer homepage can help customers understand what you do and how to contact you. | `email-2-local-leads-reminder.html` | `email-2-local-leads-reminder.txt` |
| 3 | What we look for when building your preview | We review your services, audience, goals, style, and current website before preparing the preview. | `email-3-what-we-look-for.html` | `email-3-what-we-look-for.txt` |
| 4 | Last call for a free website preview | If a better homepage is on your list, request your free preview before this campaign closes. | `email-4-last-call.html` | `email-4-last-call.txt` |

## Zoho Notes

- These are batch-level templates. They do not use first-name or business-name personalization.
- The CTA uses `{{segment}}` exactly as requested. Replace it with a Zoho field/segment value if the campaign builder requires Zoho-native merge syntax.
- Each HTML and plain text template includes Zoho's unsubscribe merge tag: `$[LI:UNSUBSCRIBE]$`.
- Zoho documentation says custom templates should include `$[LI:UNSUBSCRIBE]$`; otherwise Zoho may prompt for it before send.
- Sender identity, organization address, and list compliance settings should be confirmed in Zoho before scheduling.

## Final Send-Readiness Checklist

- [ ] Confirm target list/segment has permission to receive marketing emails.
- [ ] Confirm sender name and reply-to are correct for Website Support Studio.
- [ ] Confirm required business address/footer is configured in Zoho.
- [ ] Confirm `$[LI:UNSUBSCRIBE]$` renders as an unsubscribe link in a real Zoho test-list send.
- [ ] Confirm the WSS logo renders in Gmail, Outlook, Apple Mail, and mobile inbox tests.
- [ ] Confirm CTA resolves to the live landing page and preserves UTM parameters.
- [ ] Confirm `{{segment}}` is replaced or supported before launch.
- [ ] Confirm no copy implies a preview is already built.
- [ ] Confirm no campaign is sent until Gary approves final audience, timing, and content.

