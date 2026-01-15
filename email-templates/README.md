# Askend Email Templates for Supabase

This directory contains email templates for the Askend application, specifically configured for Supabase Authentication.

## OTP Verification Email Template

**File:** `otp-verification-template.html`

### Overview
This email template is designed for Supabase's "Magic Link" / OTP authentication flow. When users request to reset their password via the Forgot Password screen, Supabase sends an email with a 6-digit OTP code that they can verify within the app to set a new password.

### Design Features
- **Theme Consistency:** Uses the app's signature orange gradient (#FF7E1D to #FFD464)
- **Responsive Design:** Works perfectly on desktop and mobile devices
- **Professional Layout:** Clean, modern design with clear hierarchy
- **Security Focused:** Includes security tips and validity information
- **User-Friendly:** Clear instructions and visual emphasis on the OTP code

### Supabase Template Variables
The template uses Supabase's Go template syntax:

- `{{ .Token }}` - The 6-digit OTP code (automatically provided by Supabase)
- `{{ .Email }}` - The recipient's email address (automatically provided by Supabase)
- `{{ .SiteURL }}` - Your application's site URL (optional, available if needed)
- `{{ .TokenHash }}` - The token hash (optional, available if needed)

## 🚀 Setup Instructions for Supabase

### Step 1: Access Supabase Email Templates

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Find the **Magic Link** template (or **Confirm signup** / **Reset password** depending on your flow)

### Step 2: Configure Email Template

1. In the email template editor, you'll see sections for:
   - **Subject Line**
   - **Email Body (HTML)**

2. **Set the Subject Line:**
   ```
   Askend - Password Reset OTP
   ```

3. **Paste the HTML Template:**
   - Copy the entire contents of `otp-verification-template.html`
   - Paste it into the "Email Body" field
   - The template already uses Supabase variables (`{{ .Token }}` and `{{ .Email }}`)

4. **Save Changes**

### Step 3: Test the Email Template

1. In your app's **ForgotPasswordScreen.js**, trigger the OTP flow:
   ```javascript
   const { error } = await supabase.auth.signInWithOtp({
       email: normalizedEmail(),
       options: {
           shouldCreateUser: false,
       },
   });
   ```

2. Check your email inbox for the formatted OTP email

3. Verify:
   - Email renders correctly across different clients (Gmail, Outlook, etc.)
   - OTP code is clearly visible
   - Colors match your app theme
   - Responsive design works on mobile

### Step 4: Configure SMTP (Recommended for Production)

For production, use a custom SMTP provider for better deliverability:

1. **Choose an SMTP Provider:**
   - SendGrid (Recommended)
   - Mailgun
   - AWS SES
   - Postmark
   - Resend

2. **Configure in Supabase:**
   - Go to **Project Settings** → **Auth** → **SMTP Settings**
   - Enable "Custom SMTP"
   - Enter your SMTP credentials:
     ```
     Host: smtp.sendgrid.net (example for SendGrid)
     Port: 587
     Username: apikey
     Password: <your-api-key>
     Sender Email: noreply@askend.com
     Sender Name: Askend
     ```

3. **Test SMTP Connection:**
   - Send a test email from Supabase dashboard
   - Verify delivery and formatting

## 📧 Available Supabase Variables

You can use these variables in your email template:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .Token }}` | The OTP code (6 digits) | `123456` |
| `{{ .Email }}` | User's email address | `user@example.com` |
| `{{ .SiteURL }}` | Your application URL | `https://askend.com` |
| `{{ .TokenHash }}` | Token hash for verification | `abc123...` |
| `{{ .ConfirmationURL }}` | Full confirmation URL | `https://...` |

**Note:** The template uses `{{ .Token }}` for the OTP code display.

## 🎨 Customization

To customize the template for your needs:

1. **Colors:** 
   - Update gradient colors in the `<style>` section
   - Main gradient: `#FFD464` to `#FF7E1D`
   - Modify colors throughout the template

2. **Logo:** 
   Replace the emoji icon (📧) with your actual logo:
   ```html
   <img src="https://yourdomain.com/logo.png" alt="Askend Logo" 
        style="width: 60px; height: 60px;">
   ```

3. **Social Links:** 
   Update footer social media links:
   ```html
   <a href="https://facebook.com/askend" class="social-link">Facebook</a>
   <a href="https://twitter.com/askend" class="social-link">Twitter</a>
   ```

4. **Support Email:** 
   Change `support@askend.com` to your actual support email

5. **OTP Validity:** 
   Update "Valid for 10 minutes" if you change the expiration time in Supabase settings

## 🧪 Testing

### Before Going Live:
## 📋 Quick Reference

### For Supabase Dashboard:

**Path:** Authentication → Email Templates → Magic Link

**Subject:** `Askend - Password Reset OTP`

**Template File:** `otp-verification-template.html`

**Variables Used:**
- `{{ .Token }}` - OTP Code
- `{{ .Email }}` - User's Email

### For Your ForgotPasswordScreen.js:

The current implementation already works correctly:

```javascript
const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail(),
    options: {
        shouldCreateUser: false,
    },
});
```

This will automatically trigger the email with your custom template!

---

## 📞 Support & Resources

- **Supabase Docs:** [https://supabase.com/docs/guides/auth/auth-email](https://supabase.com/docs/guides/auth/auth-email)
- **Email Template Guide:** [https://supabase.com/docs/guides/auth/auth-email-templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- **SMTP Setup:** [https://supabase.com/docs/guides/auth/auth-smtp](https://supabase.com/docs/guides/auth/auth-smtp)

---

**Last Updated:** January 15, 2026  
**Version:** 2.0 (Supabase Optimized)  
**Maintained By:** Askend Development Team  
**Template Type:** Supabase Go Template  
**Compatible With:** Supabase Auth v2+
2. **Check Email Clients:**
   - Gmail (Web and Mobile)
   - Outlook (Desktop and Web)
   - Apple Mail (iOS and macOS)
   - Yahoo Mail
   - ProtonMail

3. **Verify Functionality:**
   - OTP code displays correctly
   - All links work properly
   - Images load (if you added any)
   - Responsive design on mobile

4. **Email Testing Tools:**
   - [Litmus](https://litmus.com/) - Email testing platform
   - [Email on Acid](https://www.emailonacid.com/) - Preview across clients
   - [Mail Tester](https://www.mail-tester.com/) - Check spam score

### Testing Checklist:
- [ ] Subject line displays correctly
- [ ] OTP code is prominent and readable
- [ ] All text is legible on light and dark backgrounds
- [ ] Template is responsive on mobile devices
- [ ] No broken images or links
- [ ] Footer information is accurate
- [ ] Security tips are clear
- [ ] Validity period is correct

## 🔒 Security Best Practices

### Supabase Auth Configuration:

1. **OTP Expiration:**
   - Go to **Auth Settings** → **Email** → **OTP Expiry**
   - Recommended: 600 seconds (10 minutes)

2. **Rate Limiting:**
   - Enable rate limiting for auth endpoints
   - Settings → Auth → Rate Limits
   - Limit OTP requests per email/IP

3. **Email Template Security:**
   - Never include sensitive data in emails
   - Use HTTPS for all asset URLs
   - Avoid inline JavaScript (most email clients block it)

4. **User Education:**
   - Include security tips in the email (already in template)
   - Warn users never to share OTP codes
   - Indicate expiration time clearly

### Additional Security Notes:

- OTP codes are single-use only (handled by Supabase)
- Codes expire after 10 minutes (configurable)
- Failed verification attempts are tracked
- Consider implementing account lockout after multiple failures
- Monitor authentication logs in Supabase dashboard

## 🔧 Troubleshooting

### Common Issues:

**Issue: Email not sending**
- Check SMTP settings are correct
- Verify sender email is authenticated
- Check Supabase logs for errors

**Issue: OTP code not displaying**
- Ensure you're using `{{ .Token }}` not `{{.Token}}` (spaces matter)
- Check template is saved in correct format (HTML)

**Issue: Email looks broken**
- Validate HTML syntax
- Test in multiple email clients
- Check inline CSS is properly formatted

**Issue: Users not receiving emails**
- Check spam/junk folders
- Verify email address is correct
- Confirm SMTP provider settings
- Check sender reputation

**Issue: Template not updating**
- Clear browser cache
- Save template and refresh
- Check correct template type is selected (Magic Link vs. Reset Password)

## 📱 Email Client Compatibility

This template has been designed to work with:

✅ Gmail (Web & Mobile)  
✅ Outlook (2010, 2013, 2016, 365, Web)  
✅ Apple Mail (iOS & macOS)  
✅ Yahoo Mail  
✅ ProtonMail  
✅ Thunderbird  
✅ Samsung Email  
✅ Gmail App (iOS & Android)  

**Note:** Some advanced CSS features may not render in older Outlook versions, but the email remains functional and readable.

## 🔄 Maintenance

### Regular Updates:

1. **Annual:**
   - Update copyright year
   - Review security recommendations
   - Test across latest email client versions

2. **As Needed:**
   - Update support contact information
   - Refresh branding/colors if app design changes
   - Add new features or information

3. **Version Control:**
   - Keep template versioned in your repository
   - Document changes in git commits
   - Test thoroughly before deploying updates

---

**Last Updated:** January 15, 2026
**Version:** 1.0
**Maintained By:** Askend Development Team
