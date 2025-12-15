import {
	Color,
	GameState,
	GUIInfo,
	Input,
	InputManager,
	Menu,
	PlayerCustomData,
	Rectangle,
	RendererSDK,
	Team,
	TextFlags,
	UIPanel,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { KeyMode } from "../enums/KeyMode"
import { MenuManager } from "../menu"

interface IConfigData {
	Visual?: {
		[key: string]: object | undefined
	}
}

export class PlayerGUI {
	public readonly TotalPosition = new Rectangle()

	private dragging = false
	private configReady = false
	private windowReady = false
	private isUnderRectangle = false
	private readonly path = "github.com/octarine-public/net-worth/scripts_files"

	private readonly draggingOffset = new Vector2()
	private readonly scaleGradientSize = new Vector2()
	private readonly scalePositionPanel = new Vector2()
	private readonly scaleUnitImageSize = new Vector2()
	private readonly redTeamColor = new Color(227, 67, 62)
	private readonly greenTeamColor = new Color(86, 179, 55)

	constructor(private readonly menu: MenuManager) {
		this.menu.Size.OnValue(() => this.updateScaleSize())
		this.menu.Position.X.OnValue(() => this.updateScalePosition())
		this.menu.Position.Y.OnValue(() => this.updateScalePosition())
	}

	public UpdateSetPosition(position: Rectangle) {
		const positionPanel = this.scalePositionPanel
		const unitImageSize = this.scaleUnitImageSize

		position.x = positionPanel.x
		position.y = positionPanel.y
		position.Width = unitImageSize.x
		position.Height = unitImageSize.y

		this.TotalPosition.pos1.CopyFrom(position.pos1)
		this.TotalPosition.pos2.CopyFrom(position.pos2)
	}

	public DrawPlayer(
		player: PlayerCustomData,
		enabledPlayers: number[],
		position: Rectangle,
		netWorthByItem?: number
	) {
		const gap = 2
		const menu = this.menu
		const ally = menu.Ally.value
		const enemy = menu.Enemy.value

		const dragging = this.dragging
		const isEnemy = player.IsEnemy()

		const hideLocal = !menu.Local.value && player.IsLocalPlayer
		if ((isEnemy && !enemy) || (!isEnemy && !ally) || hideLocal) {
			return
		}

		// player image
		let count = 0
		const texturePath = player.Hero?.TexturePath() ?? ""
		const opacity = Math.round((1 - menu.Opacity.value / 100) * 255)

		const imageRect = position.Clone()
		this.FieldRect(imageRect, Color.Black.SetA(opacity), dragging)
		imageRect.x += gap / 2
		imageRect.y += gap / 2
		imageRect.Width -= gap
		imageRect.Height -= gap
		this.Image(texturePath, imageRect, Color.White.SetA(opacity), dragging)

		// player image border left
		const leftBorder = imageRect.Clone()
		leftBorder.Width = GUIInfo.ScaleWidth(gap)
		this.FieldRect(leftBorder, player.Color.Clone().SetA(opacity), dragging)

		// player gradient border right
		const gPosition = position.Clone()
		gPosition.x += position.Width
		gPosition.Width = this.scaleGradientSize.x
		gPosition.Height = this.scaleGradientSize.y
		this.Gradient(gPosition, isEnemy, player.Team, opacity, dragging)

		this.isUnderRectangle =
			position.Contains(Input.CursorOnScreen) ||
			gPosition.Contains(Input.CursorOnScreen) ||
			gPosition.Contains(Input.CursorOnScreen)

		this.Text(gPosition, player, netWorthByItem)

		count++
		enabledPlayers.push(count)
		position.AddY(position.Height + gap / 2)
		this.TotalPosition.Height += position.Height
	}

	public UpdatePositionAfter() {
		const position = this.scalePositionPanel
		if (!this.dragging) {
			// NOTE: update full panel if added new unit's or items
			this.updateMinMaxPanelPosition(position)
			return
		}
		const wSize = RendererSDK.WindowSize
		const mousePos = Input.CursorOnScreen
		const toPosition = mousePos
			.SubtractForThis(this.draggingOffset)
			.Min(wSize.Subtract(this.TotalPosition.Size))
			.Max(0)
			.CopyTo(position)
		this.saveNewPosition(toPosition)
	}

	public MouseKeyUp() {
		if (!this.dragging || !this.windowReady || !this.configReady) {
			return true
		}
		this.dragging = false
		Menu.Base.SaveConfigASAP = true
		return true
	}

	public MouseKeyDown() {
		if (this.dragging || !this.windowReady || !this.configReady) {
			return true
		}
		const menu = this.menu.TouchKeyPanel
		const isTouch = menu.isPressed || menu.assignedKey === -1
		if (!isTouch) {
			return true
		}
		const mouse = Input.CursorOnScreen
		const recPos = this.TotalPosition
		if (!mouse.IsUnderRectangle(recPos.x, recPos.y, recPos.Width, recPos.Height)) {
			return true
		}
		this.dragging = true
		mouse.Subtract(recPos.pos1).CopyTo(this.draggingOffset)
		return false
	}

	public CalculateBottomSize(enabledPlayers: number[], position: Rectangle) {
		this.TotalPosition.Width += this.scaleGradientSize.x
		this.TotalPosition.Height -= position.Height - enabledPlayers.length
	}
	public WindowSizeChanged() {
		this.windowReady = true
		this.restartScale()
	}
	public MenuConfigChanged(obj: { [key: string]: any }) {
		const config = obj as IConfigData
		if (config.Visual === undefined) {
			return
		}
		if (config.Visual[this.menu.Tree.InternalName] !== undefined) {
			this.configReady = true
		}
	}
	public GameChanged() {
		this.dragging = false
		this.isUnderRectangle = false
		this.draggingOffset.toZero()
		this.restartScale()
	}

	protected Text(
		position: Rectangle,
		player: PlayerCustomData,
		netWorthByItem?: number
	) {
		const newPosition = position.Clone()
		const text = this.isUnderRectangle
			? this.serializePlayerName(player)
			: this.serializeNetWorth(netWorthByItem ?? player.NetWorth)
		newPosition.x += position.Height / 6
		const flags = TextFlags.Center | TextFlags.Left
		RendererSDK.TextByFlags(
			text,
			newPosition,
			Color.White,
			2.4,
			flags,
			500,
			RendererSDK.DefaultFontName,
			true,
			false,
			this.menu.OutlinedText.value
		)
	}

	protected Image(
		path: string,
		position: Rectangle,
		color = Color.White,
		grayscale?: boolean,
		round: number = -1
	) {
		RendererSDK.Image(
			path,
			position.pos1,
			round,
			position.Size,
			color,
			undefined,
			undefined,
			grayscale
		)
	}

	protected FieldRect(position: Rectangle, color = Color.White, grayscale?: boolean) {
		RendererSDK.FilledRect(
			position.pos1,
			position.Size,
			color,
			undefined,
			undefined,
			grayscale
		)
	}

	protected Gradient(
		position: Rectangle,
		isEnemy = false,
		team: Team,
		opacity: number,
		grayscale?: boolean
	) {
		opacity = Math.min(opacity, 200)
		const localTeam = GameState.LocalTeam

		const gradientColor =
			localTeam === Team.Observer
				? team === Team.Dire
					? this.redTeamColor.SetA(opacity)
					: this.greenTeamColor.SetA(opacity)
				: isEnemy
					? this.redTeamColor.SetA(opacity)
					: this.greenTeamColor.SetA(opacity)
		this.Image(
			`${this.path}/networth_gradient.svg`,
			position,
			gradientColor,
			grayscale
		)
	}

	private serializePlayerName(player: PlayerCustomData) {
		const name = player.PlayerName ?? player.NetWorth.toString()
		return name.length > 8 ? name.slice(0, 7) + "…" : name
	}

	private serializeNetWorth(netWorth: number) {
		return netWorth.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")
	}

	private updateMinMaxPanelPosition(position: Vector2) {
		if (!this.windowReady || !this.configReady) {
			return
		}
		const wSize = RendererSDK.WindowSize
		const totalSize = this.TotalPosition.Size
		const newPosition = position
			.Min(wSize.Subtract(totalSize))
			.Max(0)
			.CopyTo(position)
		this.saveNewPosition(newPosition)
	}

	private updateScaleSize() {
		const minSize = 20
		const sizeMenu = this.menu.Size.value
		const size = Math.min(Math.max(sizeMenu + minSize, minSize), minSize * 2)
		this.scaleUnitImageSize.y = this.scaleGradientSize.y = GUIInfo.ScaleHeight(size)

		this.scaleGradientSize.x = GUIInfo.ScaleWidth(size * 3)
		this.scaleUnitImageSize.x = GUIInfo.ScaleWidth(size * 1.6)
	}

	private updateScalePosition() {
		const menuPosition = this.menu.Position
		const valueX = Math.max(GUIInfo.ScaleWidth(menuPosition.X.value), 0)
		this.scalePositionPanel.x = valueX
		const valueY = Math.max(GUIInfo.ScaleHeight(menuPosition.Y.value), 0)
		this.scalePositionPanel.y = valueY
	}

	private saveNewPosition(newPosition?: Vector2) {
		const position = newPosition ?? this.scalePositionPanel
		this.menu.Position.Vector = position
			.Clone()
			.DivideScalarX(GUIInfo.GetWidthScale())
			.DivideScalarY(GUIInfo.GetHeightScale())
			.RoundForThis(1)
	}

	private restartScale() {
		this.updateScaleSize()
		this.updateScalePosition()
		this.saveNewPosition()
	}
}

export class PlayerNetworthPanel extends UIPanel {
	private lastHeroes = 0
	private readonly gap = 2
	private readonly rowSize = new Vector2()
	private readonly path = "github.com/octarine-public/net-worth/scripts_files"

	constructor(
		private readonly menu: MenuManager,
		private readonly players: PlayerCustomData[]
	) {
		super(new Rectangle())
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
	public get State() {
		return this.menu.State.value && this.ShouldDraw && !this.isToggleKeyMode
	}
	public Draw(): void {
		const { width, height } = this.layout()
		this.Position.pos2.x = this.Position.pos1.x + width
		this.Position.pos2.y = this.Position.pos1.y + height

		const position = this.Position.Clone()
		position.Width = this.rowSize.x
		position.Height = this.rowSize.y

		const players = this.players.orderBy(x => this.calculateBy(x))
		for (let i = players.length - 1; i >= 0; i--) {
			const player = players[i]
			if (!this.filterState(player)) {
				continue
			}
			this.DrawPlayer(player, position)
			position.AddY(this.rowSize.y + this.gap / 2)
		}
	}
	public MouseKeyUp(): boolean {
		if (!this.IsInGameUI) {
			return true
		}
		this.Dragging = false
		this.saveNewPosition()
		return true
	}
	public MouseKeyDown(): boolean {
		if (!this.IsInGameUI) {
			return true
		}
		const menu = this.menu.TouchKeyPanel
		const isTouch = menu.isPressed || menu.assignedKey === -1
		if (!isTouch) {
			return true
		}
		const mouse = InputManager.CursorOnScreen
		if (this.isUnderRectangle(mouse)) {
			mouse.Subtract(this.Position.pos1).CopyTo(this.DragOffset)
			this.Dragging = true
			return false
		}
		return true
	}
	public OnChangeMenu() {
		const min = 20
		const posMenu = this.menu.Position
		const sizeMenu = this.menu.Size.value
		const size = Math.min(Math.max(sizeMenu + min, min), min * 2)

		this.reSavePosition(
			GUIInfo.ScaleVector(posMenu.X.value, posMenu.Y.value),
			GUIInfo.ScaleVector(size * 1.6, size)
		)
		this.Compute()
	}
	protected DrawPlayer(player: PlayerCustomData, position: Rectangle) {
		const opacity = Math.round((1 - this.menu.Opacity.value / 100) * 255)
		this.FieldRect(position, Color.Black.SetA(opacity), this.Dragging)

		const imageRect = position.Clone()
		const textureHero = player.Hero?.TexturePath() ?? ""
		imageRect.x += this.gap / 2
		imageRect.y += this.gap / 2
		imageRect.Width -= this.gap
		imageRect.Height -= this.gap
		this.Image(textureHero, imageRect, Color.White.SetA(opacity), this.Dragging)

		const leftBorder = imageRect.Clone()
		leftBorder.Width = GUIInfo.ScaleWidth(this.gap)
		this.FieldRect(leftBorder, player.Color.Clone().SetA(opacity), this.Dragging)

		const gradient = position.Clone()
		gradient.x += position.Width
		gradient.Width = this.rowSize.x * 2
		this.drawGradient(gradient, player, opacity)

		this.drawText(gradient, player)
	}
	protected Image(
		path: string,
		position: Rectangle,
		color = Color.White,
		grayscale?: boolean,
		round: number = -1
	) {
		RendererSDK.Image(
			path,
			position.pos1,
			round,
			position.Size,
			color,
			undefined,
			undefined,
			grayscale
		)
	}
	protected FieldRect(position: Rectangle, color = Color.White, grayscale?: boolean) {
		RendererSDK.FilledRect(
			position.pos1,
			position.Size,
			color,
			undefined,
			undefined,
			grayscale
		)
	}
	private layout(): { width: number; height: number } {
		let heroes = 0
		for (let i = this.players.length - 1; i > -1; i--) {
			const player = this.players[i]
			if (!this.filterState(player)) {
				continue
			}
			heroes++
		}
		const width = this.rowSize.x * 3
		const height =
			heroes === 0
				? this.rowSize.y
				: heroes * this.rowSize.y + (heroes - 1) * this.gap
		if (this.lastHeroes !== heroes) {
			this.lastHeroes = heroes
			this.Compute()
		}
		return { width, height }
	}
	private drawText(position: Rectangle, player: PlayerCustomData) {
		const showName = this.isUnderRectangle(InputManager.CursorOnScreen, position)

		const text = showName
			? this.serializeName(player)
			: this.serializeNetworth(
					this.menu.OnlyItems.value ? player.ItemsGold : player.NetWorth
				)

		const textPos = position.Clone()
		textPos.x += position.Height / 6

		RendererSDK.TextByFlags(
			text,
			textPos,
			Color.White,
			2.4,
			TextFlags.Left | TextFlags.Center,
			500,
			RendererSDK.DefaultFontName,
			true,
			false,
			this.menu.OutlinedText.value
		)
	}
	private drawGradient(position: Rectangle, player: PlayerCustomData, opacity: number) {
		const red = new Color(227, 67, 62)
		const green = new Color(86, 179, 55)
		const localTeam = GameState.LocalTeam
		const isEnemy = player.IsEnemy()
		const color =
			localTeam === Team.Observer
				? player.Team === Team.Dire
					? red
					: green
				: isEnemy
					? red
					: green
		this.Image(
			`${this.path}/networth_gradient.svg`,
			position,
			color.SetA(Math.min(opacity, 200))
		)
	}
	private serializeName(player: PlayerCustomData) {
		const name = player.PlayerName ?? player.NetWorth.toString()
		return name.length > 8 ? name.slice(0, 7) + "…" : name
	}
	private serializeNetworth(value: number) {
		return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")
	}
	private isUnderRectangle(vec: Vector2, rect: Rectangle = this.Position) {
		return vec.IsUnderRectangle(rect.x, rect.y, rect.Width, rect.Height)
	}
	private reSavePosition(pos: Vector2, size: Vector2) {
		this.Position.pos1.CopyFrom(pos)
		this.Position.Width = size.x
		this.Position.Height = size.y
		this.rowSize.CopyFrom(size)
	}
	private saveNewPosition(newPosition?: Vector2) {
		const position = newPosition ?? this.Position.pos1
		this.menu.Position.Vector = position
			.Clone()
			.DivideScalarX(GUIInfo.GetWidthScale())
			.DivideScalarY(GUIInfo.GetHeightScale())
			.RoundForThis(1)
		Menu.Base.SaveConfigASAP = true
	}
	private calculateBy(player: PlayerCustomData) {
		return player.Hero === undefined || !this.menu.OnlyItems.value
			? player.NetWorth
			: player.ItemsGold
	}
	private filterState(player: PlayerCustomData) {
		if (!player.Hero || player.IsDisconnected || player.IsAbandoned) {
			return false
		}
		const menu = this.menu
		const ally = menu.Ally.value
		const enemy = menu.Enemy.value
		const isEnemy = player.IsEnemy()
		const hideLocal = !menu.Local.value && player.IsLocalPlayer
		if ((isEnemy && !enemy) || (!isEnemy && !ally) || hideLocal) {
			return false
		}
		return true
	}
}
