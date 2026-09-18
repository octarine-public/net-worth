import "./translations"

import { KeyMode } from "./enums/KeyMode"
import { PlayerGUI } from "./gui/player"
import { TeamGUI } from "./gui/team"
import { MenuManager } from "./menu"

new (class CNetWorth {
	private readonly menu = new MenuManager()
	private readonly players: PlayerCustomData[] = []
	private readonly visiblePlayers: PlayerCustomData[] = []

	private readonly teamGUI = new TeamGUI()
	private readonly playerGUI = new PlayerGUI(this.menu)

	private readonly byNetWorth = (a: PlayerCustomData, b: PlayerCustomData) =>
		this.calculateBy(b) - this.calculateBy(a)
	/** Radiant above Dire, the way the game's stats panel groups its rows, richest first within. */
	private readonly byTeamNetWorth = (a: PlayerCustomData, b: PlayerCustomData) =>
		a.Team - b.Team || this.byNetWorth(a, b)

	constructor() {
		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("GameEnded", this.GameChanged.bind(this))
		EventsSDK.on("GameStarted", this.GameChanged.bind(this))
		InputEventSDK.on("MouseKeyUp", this.MouseKeyUp.bind(this))
		InputEventSDK.on("MouseKeyDown", this.MouseKeyDown.bind(this))
		EventsSDK.on("PlayerCustomDataUpdated", this.PlayerCustomDataUpdated.bind(this))
	}

	private get state() {
		return this.menu.State.value
	}
	private get gameState() {
		return Dota2SDK.GameRules?.GameState ?? DOTAGameState.DOTA_GAMERULES_STATE_INIT
	}

	private get isPostGame() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
	}
	private get isDisconnect() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_DISCONNECT
	}
	private get isInGame() {
		return (
			this.gameState >= DOTAGameState.DOTA_GAMERULES_STATE_PRE_GAME &&
			this.gameState <= DOTAGameState.DOTA_GAMERULES_STATE_GAME_IN_PROGRESS
		)
	}
	private get isStrategyTime() {
		return (
			this.gameState <= DOTAGameState.DOTA_GAMERULES_STATE_STRATEGY_TIME ||
			this.gameState >= DOTAGameState.DOTA_GAMERULES_STATE_DISCONNECT
		)
	}
	private get isShowCase() {
		return this.gameState === DOTAGameState.DOTA_GAMERULES_STATE_TEAM_SHOWCASE
	}
	private get isScoreboardPosition() {
		if (!InputManager.IsScoreboardOpen) {
			return false
		}
		return this.shouldPosition(GUIInfo.Scoreboard.Background)
	}
	private get isShopPosition() {
		if (!InputManager.IsShopOpen) {
			return false
		}
		return this.shouldPosition(
			GUIInfo.OpenShopMini.Items,
			GUIInfo.OpenShopMini.Header,
			GUIInfo.OpenShopMini.GuideFlyout,
			GUIInfo.OpenShopMini.ItemCombines,
			GUIInfo.OpenShopMini.PinnedItems,
			GUIInfo.OpenShopLarge.Items,
			GUIInfo.OpenShopLarge.Header,
			GUIInfo.OpenShopLarge.GuideFlyout,
			GUIInfo.OpenShopLarge.PinnedItems,
			GUIInfo.OpenShopLarge.ItemCombines
		)
	}
	private get isToggleKeyMode() {
		const menu = this.menu
		const toggleKey = menu.ToggleKey
		if (toggleKey.assignedKey < 0) {
			return false
		}
		const keyModeID = menu.ModeKey.SelectedID
		return (
			(keyModeID === KeyMode.Toggled && !menu.IsToggled) ||
			(keyModeID === KeyMode.Pressed && !toggleKey.isPressed)
		)
	}
	private get canDrawPlayerGUI() {
		return !this.isShopPosition && !this.isScoreboardPosition && !this.isToggleKeyMode
	}
	public Draw() {
		if (!this.state) {
			this.playerGUI.Reset()
			this.teamGUI.Hide()
			return
		}
		if (
			!this.isInGame ||
			this.isPostGame ||
			this.isDisconnect ||
			GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
		) {
			this.teamGUI.Hide()
			if (this.menu.IsOpen) {
				this.playerGUI.DrawPreview()
			} else {
				this.playerGUI.Reset()
			}
			return
		}

		let dire = 0
		let radiant = 0
		const visible = this.visiblePlayers
		visible.length = 0

		for (const player of this.players) {
			if (player.Hero === undefined) {
				continue
			}
			const itemCosts = this.calculateBy(player)
			switch (player.Team) {
				case Team.Dire:
					dire += itemCosts
					break
				case Team.Radiant:
					radiant += itemCosts
					break
			}
			if (player.IsAbandoned || player.IsDisconnected) {
				continue
			}
			if (this.isHiddenPlayer(player)) {
				continue
			}
			visible.push(player)
		}
		visible.sort(
			this.menu.SortWithinTeam.value ? this.byTeamNetWorth : this.byNetWorth
		)

		if (!this.canDrawPlayerGUI) {
			this.playerGUI.Reset()
		} else if (visible.length > 0) {
			this.playerGUI.Draw(visible)
		} else if (this.menu.IsOpen) {
			this.playerGUI.DrawPreview()
		} else {
			this.playerGUI.Reset()
		}

		const isObserver = GameState.LocalTeam === Team.Observer
		if (this.isShowCase || this.isStrategyTime || isObserver) {
			this.teamGUI.Hide()
			return
		}

		this.teamGUI.Draw(this.menu.Total, radiant, dire)
	}
	public PlayerCustomDataUpdated(entity: PlayerCustomData) {
		if (!entity.IsValid || entity.IsSpectator) {
			this.players.remove(entity)
			return
		}
		if (!this.players.some(x => x.PlayerID === entity.PlayerID)) {
			this.players.push(entity)
		}
	}
	public MouseKeyUp(key: VMouseKeys) {
		if (!this.state) {
			return true
		}
		return this.playerGUI.MouseKeyUp(key)
	}
	public MouseKeyDown(key: VMouseKeys) {
		if (!this.state) {
			return true
		}
		return this.playerGUI.MouseKeyDown(key)
	}
	public GameChanged() {
		this.teamGUI.GameChanged()
		this.playerGUI.GameChanged()
	}
	private isHiddenPlayer(player: PlayerCustomData) {
		const menu = this.menu
		if (!menu.Local.value && player.IsLocalPlayer) {
			return true
		}
		return player.IsEnemy() ? !menu.Enemy.value : !menu.Ally.value
	}
	private shouldPosition(...positions: Rectangle[]) {
		const position = this.menu.Overlay.Position
		return positions.some(rect => rect.Contains(position))
	}
	private calculateBy(player: PlayerCustomData) {
		return player.Hero === undefined || !this.menu.OnlyItems.value
			? player.NetWorth
			: player.ItemsGold
	}
})()
