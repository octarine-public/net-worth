import "./translations"

import {
	DOTAGameState,
	DOTAGameUIState,
	EventsSDK,
	GameRules,
	GameState,
	GUIInfo,
	Input,
	InputEventSDK,
	PlayerCustomData,
	Rectangle,
	Team,
	VMouseKeys
} from "github.com/octarine-public/wrapper/index"

import { KeyMode } from "./enums/KeyMode"
import { PlayerGUI } from "./gui/player"
import { TeamGUI } from "./gui/team"
import { MenuManager } from "./menu"

new (class CNetWorth {
	private readonly menu = new MenuManager()
	private readonly players: PlayerCustomData[] = []

	private readonly teamGUI = new TeamGUI()
	private readonly playerGUI = new PlayerGUI(this.menu)

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
		return GameRules?.GameState ?? DOTAGameState.DOTA_GAMERULES_STATE_INIT
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
		if (!Input.IsScoreboardOpen) {
			return false
		}
		return this.shouldPosition(GUIInfo.Scoreboard.Background)
	}

	private get isShopPosition() {
		if (!Input.IsShopOpen) {
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
		// if toggle key is not assigned (setting to "None")
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
		if (!this.state || !this.isInGame || this.isPostGame || this.isDisconnect) {
			return
		}

		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return
		}

		let dire = 0
		let radiant = 0
		const position = new Rectangle()
		const enabledPlayers: number[] = []

		const orderByPlayers = this.players.orderBy(x => this.calculateBy(x))

		this.playerGUI.UpdateSetPosition(position)

		for (let index = orderByPlayers.length - 1; index > -1; index--) {
			const player = orderByPlayers[index],
				itemCosts = this.calculateBy(player)
			// for Team GUI
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
			if (this.canDrawPlayerGUI) {
				this.playerGUI.Draw(
					player,
					enabledPlayers,
					position,
					this.menu.OnlyItems.value ? itemCosts : undefined
				)
			}
		}

		this.playerGUI.CalculateBottomSize(enabledPlayers, position)
		this.playerGUI.UpdatePositionAfter()

		// Team GUI
		const isObserver = GameState.LocalTeam === Team.Observer
		if (this.isShowCase || this.isStrategyTime || isObserver) {
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
		if (!this.shouldInput(key)) {
			return true
		}
		return this.playerGUI.MouseKeyUp()
	}

	public MouseKeyDown(key: VMouseKeys) {
		if (!this.shouldInput(key)) {
			return true
		}
		return this.playerGUI.MouseKeyDown()
	}

	public GameChanged() {
		this.teamGUI.GameChanged()
		this.playerGUI.GameChanged()
	}

	private shouldInput(key: VMouseKeys) {
		if (!this.state || this.isPostGame || key !== VMouseKeys.MK_LBUTTON) {
			return false
		}
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return false
		}
		return true
	}

	private shouldPosition(...positions: Rectangle[]) {
		return positions.some(position => this.isContainsPanel(position))
	}

	private isContainsPanel(position: Rectangle) {
		return position.Contains(this.playerGUI.TotalPosition.pos1)
	}

	private calculateBy(player: PlayerCustomData) {
		return player.Hero === undefined || !this.menu.OnlyItems.value
			? player.NetWorth
			: player.ItemsGold
	}
})()
