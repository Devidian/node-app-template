# SAAS
We should rewrite the backend to support any game by default by creating a generalized API that can be called from outside (not like now connecting to logparser)

Events that should be handled through this API

## GameMatch Events

|EventName|Description|Content|
|-|-|-|
|REQUIRED EVENTS|
|match_start|The Match has just started|A unique match identifier, a list of players|
|match_end|The match is over|A unique match identifier, a list of players including their scores|
|player_leave|A player leaves the match|A unique match identifier, the player that left the game|
|OPTIONAL EVENTS|
|match_abort|The match is aborted|A unique match identifier, a list of players left including their scores|
|player_join|A Player joins the match, (reconnect?)|A unique match identifier, the player that has joined|
|PLAYER STATS EVENTS|
|player_kill|
|player_hit|
|player_inventory_add|
|player_inventory_remove|


# before next release
- save accumulated player characters (per game&mode) for overall stats
- save match-interaction-log (player A killed player B, player A damaged player B on chest with Weapon A) => need to find a generic log format that might fit for all games
+ fix frontend details page (throws error currently)
- save character stats to challenge too (redundand but in this case useful for live changes)
- break websocket service into smaller parts / hooks from modules to reduce changes here
+ add `passport-jwt`
    + add `jsonwebtoken`
    - use bearer auth for protected routes

# near future
- save accumulated stats per game-mode-map
- select game server in backend and send it to all challenge members instead of hardcoding in frontend (still need to work out best way to do that)
- transaction collection for players
- challenge with money
+ add jest for tests
- add eslint

# far future
- set and change password for game servers to only allow challenge members to join
- create instance manager that can launch new game servers on demand by deploying new docker containers with logger+game