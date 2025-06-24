This includes the Chainlink Function for UntilThen and some utils for debuggina and deployment.


# Setup project

```bash
  npm install
  cp .env.example .env
```

Note: pnpm does not work with bcrypto

# Upload secrets

```bash
  node utils/createSecrets.js
```

# Simulate function

## Install Deno

```bash
  curl -fsSL https://deno.land/install.sh | sh
```

## Run

```bash
  node utils/simulate.js
```

# Update function code in consumer

```bash
  node utils/updateSource.js
```

