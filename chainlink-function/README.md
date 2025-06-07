
# Setup project
npm install # pnpm does not work with bcrypto

# Upload secrets
node utils/createSecrets.js

# Simulate function
## Install Deno
curl -fsSL https://deno.land/install.sh | sh

## Run
node utils/simulate.js

# Update function code in consumer
node utils/updateSource.js

