/**
 * What a player's items are worth: the server's net worth less the gold in hand where the
 * server sends it, the SDK's count of the items otherwise - an enemy's gold never reaches us.
 */
export function ItemsWorth(player: PlayerCustomData): number {
	return player.DataTeamPlayer === undefined
		? player.ItemsGold
		: Math.max(player.NetWorth - player.ReliableGold - player.UnreliableGold, 0)
}
