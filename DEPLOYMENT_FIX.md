# Fix SSH Authentication Error in GitHub Actions

## Problem
The deployment job fails with:
```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none], no supported methods remain
```

This means the SSH private key in `VPS_SSH_KEY` secret is invalid or incorrectly formatted.

## Solution

### Step 1: Generate New SSH Key Pair

On your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions@velvena" -f ~/.ssh/velvena_deploy
```

**Important:** When prompted for passphrase, press Enter twice (leave empty). GitHub Actions needs an unencrypted key.

### Step 2: Copy Public Key to VPS

Option A - Using ssh-copy-id:
```bash
ssh-copy-id -i ~/.ssh/velvena_deploy.pub -p 22022 velvena@185.234.138.84
```

Option B - Manual copy:
```bash
# Display public key
cat ~/.ssh/velvena_deploy.pub

# SSH to your server
ssh -p 22022 velvena@185.234.138.84

# Add the public key to authorized_keys
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Update GitHub Secret

1. Display your private key:
   ```bash
   cat ~/.ssh/velvena_deploy
   ```

2. Copy the **entire output** (including BEGIN and END lines):
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   ... (many lines) ...
   -----END OPENSSH PRIVATE KEY-----
   ```

3. Go to GitHub:
   - Repository → Settings → Secrets and variables → Actions
   - Click on `VPS_SSH_KEY`
   - Update value with the private key
   - Save

### Step 4: Verify Secrets

Make sure these secrets are set in GitHub:
- `VPS_HOST`: 185.234.138.84
- `VPS_USERNAME`: velvena
- `VPS_SSH_KEY`: (the private key from step 3)
- `VPS_SSH_PORT`: 22022

### Step 5: Test SSH Connection Manually

Before triggering the GitHub Action, test locally:

```bash
ssh -i ~/.ssh/velvena_deploy -p 22022 velvena@185.234.138.84 "echo 'Connection successful'"
```

You should see `Connection successful` without password prompt.

### Step 6: Trigger Deployment

Once the manual test works:
1. Commit any pending changes
2. Push to main branch
3. GitHub Actions will automatically run
4. Or trigger manually: Repository → Actions → Deploy Velvena App → Run workflow

## Troubleshooting

### If you still get authentication errors:

1. **Check the private key format:**
   - Must start with `-----BEGIN OPENSSH PRIVATE KEY-----`
   - Must end with `-----END OPENSSH PRIVATE KEY-----`
   - No extra spaces or newlines at beginning/end

2. **Verify on the server:**
   ```bash
   ssh -p 22022 velvena@185.234.138.84
   cat ~/.ssh/authorized_keys
   ```
   Your public key should be there.

3. **Check file permissions on server:**
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

4. **Enable debug mode:**
   The workflow now has `debug: true` enabled. Check the Actions logs for detailed SSH connection info.

5. **Test with verbose SSH locally:**
   ```bash
   ssh -vvv -i ~/.ssh/velvena_deploy -p 22022 velvena@185.234.138.84
   ```
   This will show detailed connection steps.

## Common Mistakes

- ❌ Using the public key (.pub) instead of private key
- ❌ Including extra whitespace in the GitHub secret
- ❌ Password-protected SSH key
- ❌ Wrong key type (use ed25519 or rsa)
- ❌ Public key not added to server's authorized_keys
- ❌ Wrong file permissions on server

## Next Steps After Fix

Once deployment succeeds:
1. Remove `debug: true` from the workflow (optional, for cleaner logs)
2. Monitor the deployment in Actions tab
3. Verify application is running: https://app.velvena.fr
4. Check health endpoint: `curl http://localhost:4173/health.html` (from server)
