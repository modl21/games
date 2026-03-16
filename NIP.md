# Sats Rattler - Custom Nostr Event Schema

## Kind 1447: Game Score Event

A regular event used to record game scores for the Sats Rattler arcade game.

### Event Structure

```json
{
  "kind": 1447,
  "content": "",
  "tags": [
    ["d", "<game-session-id>"],
    ["score", "<score-number>"],
    ["lightning", "<lightning-address>"],
    ["t", "citadel-snake"],
    ["alt", "Sats Rattler game score"]
  ]
}
```

### Tag Definitions

- `d`: Unique game session identifier (UUID) to prevent duplicate score submissions
- `score`: The numeric score achieved in the game session
- `lightning`: The player's lightning address for prize distribution
- `t`: Topic tag for filtering game scores (`citadel-snake`)
- `alt`: Human-readable description per NIP-31

### Query Patterns

```typescript
// Query all game scores
{ kinds: [1447], '#t': ['citadel-snake'], limit: 100 }

// Query scores from a specific time period (weekly leaderboard)
{ kinds: [1447], '#t': ['citadel-snake'], since: <week-start-timestamp>, until: <week-end-timestamp>, limit: 100 }
```

### Notes

- Scores are published as regular events (stored permanently)
- The leaderboard is computed client-side by filtering scores within the current week
- Weekly winners are determined by the highest score between Sunday 00:00 UTC boundaries
- Players do not need a Nostr account to play; scores are published by the app's ephemeral keypair
