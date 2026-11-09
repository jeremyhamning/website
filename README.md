# website

Personal site. React + TypeScript, built with Vite.

## Run

```sh
npm install
npm run dev      # local dev server with hot reload
npm run build    # typecheck + production build into dist/
```

## Layout

- `src/App.tsx` — page content (edit the text here)
- `src/Name.tsx` — the name, rendered letter-by-letter (groundwork for pong)
- `src/Sun.tsx` — striped retro sun
- `src/styles.css` — colors, fonts, layout (palette tokens at the top)

## Deploy

Every push to `main` builds an arm64 Docker image (Caddy serving `dist/`), pushes it to
private GHCR as `ghcr.io/jeremyhamning/website:<git-sha>`, then tells the EC2 instance
(via AWS SSM, no SSH) to pull and restart it. See `.github/workflows/deploy.yml`.

- **Roll back:** Actions → Deploy → Run workflow → enter a previous commit SHA as `tag`.
- **Test locally:** `docker build -t website . && docker run --rm -e SITE_DOMAIN=localhost -p 8443:443 website`,
  then open https://localhost:8443 (self-signed cert, so accept the browser warning).
- **HTTPS:** Caddy gets Let's Encrypt certs for `jeremyhamning.com` automatically and redirects
  `www` to the bare domain. Needs DNS pointing at the Elastic IP and ports 80 + 443 open.

### One-time setup

**1. EC2 instance (Ubuntu, arm64)**

```sh
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo mkdir -p /opt/website
# copy deploy/compose.yaml from this repo to /opt/website/compose.yaml
# log in to GHCR as root with a GitHub *classic* PAT that has only `read:packages`:
sudo docker login ghcr.io -u jeremyhamning
```

The PAT is stored in `/root/.docker/config.json`. When it expires, deploys fail on
`docker compose pull` until you create a new one and log in again.

**2. AWS IAM**

- Attach an instance profile with `AmazonSSMManagedInstanceCore` so the SSM agent registers
  (check under Systems Manager → Fleet Manager).
- IAM → Identity providers → add OpenID Connect provider
  `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
- Create a role (e.g. `website-deploy`) with this trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:jeremyhamning@1897987/website@1414850072:environment:production"
      }
    }
  }]
}
```

  The `sub` uses GitHub's immutable subject format (`owner@ownerId/repo@repoId`), which this
  repo has enabled. Check the current prefix with
  `curl -s https://api.github.com/repos/jeremyhamning/website/actions/oidc/customization/sub`.

  and this permissions policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ec2:<REGION>:<ACCOUNT_ID>:instance/<INSTANCE_ID>",
        "arn:aws:ssm:<REGION>::document/AWS-RunShellScript"
      ]
    },
    { "Effect": "Allow", "Action": "ssm:GetCommandInvocation", "Resource": "*" }
  ]
}
```

**3. Security group:** inbound 80 and 443 (TCP, plus UDP 443 for HTTP/3). Port 22 isn't
needed for deploys; remove it or restrict it to your IP.

**4. GitHub repo settings**

- Settings → Environments → create `production`.
- Settings → Variables → Actions: `AWS_REGION`, `AWS_ROLE_ARN`, `EC2_INSTANCE_ID`.
- After the first successful push, open the `website` package (your profile → Packages)
  and make sure it's linked to this repo and stays private.

## TODO

- [ ] **Move host patching to AWS SSM Patch Manager.** The instance currently patches itself
  with Ubuntu's `unattended-upgrades`, with automatic reboots at 04:00 UTC
  (`/etc/apt/apt.conf.d/52unattended-reboot`). Patch Manager would add a compliance
  dashboard and AWS-side scheduling. Steps:
  - Confirm Patch Manager supports this Ubuntu release (26.04 support may lag).
  - Systems Manager → Quick Setup → Patch Manager → create a patch policy for this instance
    (e.g. weekly, `AWS-UbuntuDefaultPatchBaseline`, reboot if needed).
  - Disable unattended-upgrades' automatic installs so the two don't fight over the apt lock.
