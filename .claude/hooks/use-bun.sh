#!/bin/bash

# Read input from stdin
input_data=$(cat)

# Parse JSON using jq (assumes jq is available)
tool=$(echo "$input_data" | jq -r '.tool_name // empty')
command=$(echo "$input_data" | jq -r '.tool_input.command // empty')

# Check if this is a Bash tool call
if [[ "$tool" != "Bash" ]]; then
    # Not a Bash command, allow it to proceed
    echo '{"decision": "approve"}'
    exit 0
fi

# List of prohibited package managers (now only npm and yarn, bun is allowed)
prohibited_managers=("npm" "yarn" "pnpm")

# Check if the command contains any prohibited package manager
for manager in "${prohibited_managers[@]}"; do
    # Use word boundaries to avoid false positives (e.g., "bun" containing "npm")
    if [[ "$command" =~ (^|[[:space:]])$manager($|[[:space:]]) ]]; then
        # Replace the prohibited manager with bun
        modified_command=$(echo "$command" | sed "s/\b$manager\b/bun/g")
        
        # Create response JSON
        response=$(jq -n \
            --arg original "$command" \
            --arg suggested "$modified_command" \
            --arg manager "$manager" \
            '{
                decision: "block",
                reason: ($manager + " commands are not allowed. Use bun instead.)
            }')
        
        echo "$response"
        exit 0
    fi
done

# Allow commands without prohibited package managers to proceed
echo '{"decision": "approve"}'
exit 0
