import "./translations"

import {
	DOTAGameState,
	DOTAGameUIState,
	EventsSDK,
	GameRules,
	GameState,
	InputEventSDK,
	PlayerCustomData,
	Team,
	UIPanelManager,
	VMouseKeys
} from "github.com/octarine-public/wrapper/index"

import { PlayerGUI, PlayerNetworthPanel } from "./gui/player"
import { TeamGUI } from "./gui/team"
import { MenuManager } from "./menu"

new (class CNetWorth {
	private readonly menu = new MenuManager()
	private readonly players: PlayerCustomData[] = []

	private readonly teamGUI = new TeamGUI()
	private readonly playerGUI = new PlayerGUI(this.menu)
	private readonly panel = new PlayerNetworthPanel(this.menu, this.players)

	constructor() {
		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("GameEnded", this.GameChanged.bind(this))
		EventsSDK.on("GameStarted", this.GameChanged.bind(this))
		InputEventSDK.on("MouseKeyUp", this.MouseKeyUp.bind(this))
		InputEventSDK.on("MouseKeyDown", this.MouseKeyDown.bind(this))
		EventsSDK.on("WindowSizeChanged", this.WindowSizeChanged.bind(this))
		EventsSDK.on("PlayerCustomDataUpdated", this.PlayerCustomDataUpdated.bind(this))
		EventsSDK.on("MenuConfigChanged", this.MenuConfigChanged.bind(this))

		EventsSDK.on("GameEnded", this.GameEnded.bind(this))
		EventsSDK.on("GameStarted", this.GameStarted.bind(this))

		this.menu.Size.OnValue(() => this.panel.OnChangeMenu())
		this.menu.Position.X.OnValue(() => this.panel.OnChangeMenu())
		this.menu.Position.Y.OnValue(() => this.panel.OnChangeMenu())
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
	public Draw() {
		if (!this.state || !this.isInGame || this.isPostGame || this.isDisconnect) {
			return
		}
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return
		}
		let dire = 0
		let radiant = 0
		const orderByPlayers = this.players.orderBy(x => this.calculateBy(x))
		for (let i = orderByPlayers.length - 1; i > -1; i--) {
			const player = orderByPlayers[i]
			if (player.Hero === undefined) {
				continue
			}
			const itemCosts = this.calculateBy(player)
			// for Team GUI
			switch (player.Team) {
				case Team.Dire:
					dire += itemCosts
					break
				case Team.Radiant:
					radiant += itemCosts
					break
			}
		}
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
	protected GameStarted() {
		UIPanelManager.Register(this.panel)
	}
	protected GameEnded() {
		UIPanelManager.Unregister(this.panel)
	}
	protected WindowSizeChanged() {
		this.playerGUI.WindowSizeChanged()
	}
	protected MenuConfigChanged(obj: { [key: string]: any }) {
		this.playerGUI.MenuConfigChanged(obj)
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
	private calculateBy(player: PlayerCustomData) {
		return player.Hero === undefined || !this.menu.OnlyItems.value
			? player.NetWorth
			: player.ItemsGold
	}
})()
