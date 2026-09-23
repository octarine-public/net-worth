import { MenuManager } from "../menu"

/**
 * The game's own stats panel, as `dota_hud_spectator_game_stats.vcss_c` lays it out. A header of
 * a 200-wide dropdown plate and 32-tall buttons spaced 4 apart, and 8 under it a row per hero:
 * a 57×32 portrait with a 3-wide team strip down its left edge, then the rest of the row shared
 * by a 10-tall bar hung 11 from the top and a bold italic 18 label drawn over it on a dark fade.
 * The game bleeds every row 20 past the panel's left edge; here a row starts at its portrait.
 * Panorama units at 1080p, scaled by the screen and the panel's own size slider.
 */
const PANEL_W = 328
const HEADER_H = 32
const HEADER_GAP = 4
const DROPDOWN_W = 200
/**
 * The HUD's own dropdown, which `hudstyles.vcss_c` restyles over the client's: no border,
 * `padding: 4px 8px`, and a label 2 in from the padding in the plate's bold italic, at 16 and
 * centred on its height.
 */
const DROPDOWN_LABEL_X = 10
const DROPDOWN_FONT = 16
/**
 * `background-size: 14px; background-position: right 24px 50%`. Panorama stands the image's
 * left edge that far in from the right, which the game's own pixels put 176 in on its 200-wide
 * plate. The label stops short of it, the way its `margin-right: 24px` keeps it off the arrow.
 */
const DROPDOWN_ARROW = 14
const DROPDOWN_ARROW_RIGHT = 24
const SORT_W = 32
const SORT_ICON = 18
const BUTTON_W = 40
/** `.SpectatorMenuIcon { background-size: 62% 56% }` of a 40×32 button. */
const BUTTON_ICON_W = 25
const BUTTON_ICON_H = 18
const PLATE_RADIUS = 3
/**
 * `#StatsDropDown` and the buttons beside it: `#252727bb`, `#313a4bcc` under the cursor and
 * `#576886aa` for the button whose panel is open. Over the dark map the game's plate reads as
 * that alpha blended plainly, the way the panel blends its own, so the values carry over as
 * they are.
 */
const PLATE = "#252727bb"
const PLATE_HOVER = "#313a4bcc"
const PLATE_ACTIVE = "#576886aa"
/**
 * `wash-color` over the icons' white art: `#8199C5`, `bluegreyTextBright` on the button whose
 * panel is open and `#e9eaec` on the sort icon under the cursor. The arrow's art is drawn in
 * `#8199C5` already and takes no wash.
 */
const ICON_TINT = "#8199c5"
const ICON_ACTIVE = "#e3eafa"
const ICON_HOVER = "#e9eaec"
/** `.HotKey { color: defaultHUDTextDim&cc }`. */
const HOTKEY_COLOR = "#535f73cc"
/** `.Name { color: defaultHUDText }`: #8199C5, which the game's own pixels read as #829AC6. */
const TITLE_COLOR = "#8199c5"

const ROWS_TOP = 8
const ROW_H = 32
const ROW_GAP = 2
const HERO_W = 57
const STRIP_W = 3
const BAR_TOP = 11
const BAR_H = 10
const BAR_RIGHT = 8
const VALUE_FONT = 18
const VALUE_PAD_TOP = 5
const VALUE_PAD_RIGHT = 20
const VALUE_PAD_BOTTOM = 2
const VALUE_PAD_LEFT = 8
/**
 * `text-shadow: 1px 1px 8px 2.0 #000000dd` in the game. RmlUi blurs far coarser than Panorama
 * does, and at this size the smear read as a halo, so the shadow keeps its offset and loses it.
 */
const VALUE_SHADOW = "shadow(1px 1px #000000dd)"
const VALUE_FILL = "linear-gradient(to right, #0b0b0bff 0%, #0b0b0b88 5%, #8aa8a800 100%)"

/** `radiantColorDim` and `direColorDim`: the strip down the portrait's edge. */
const RADIANT_STRIP = "#118428"
const DIRE_STRIP = "#a6312e"
const RADIANT_ROW =
	"linear-gradient(to right, #252727dd 0%, #12852955 30%, #25272700 100%)"
const DIRE_ROW = "linear-gradient(to right, #252727dd 0%, #a7322f55 30%, #25272700 100%)"
const RADIANT_BAR = "linear-gradient(to right, #284b12 0%, #118428cc 85%, #76d13cee 100%)"
const DIRE_BAR = "linear-gradient(to right, #5e110f 0%, #a6312ecc 85%, #f34741 100%)"

/** The strip, the row's fade and its bar: what a row is coloured with. */
interface IRowPalette {
	readonly strip: string
	readonly row: string
	readonly bar: string
}

const RADIANT_PALETTE: IRowPalette = {
	strip: RADIANT_STRIP,
	row: RADIANT_ROW,
	bar: RADIANT_BAR
}
const DIRE_PALETTE: IRowPalette = { strip: DIRE_STRIP, row: DIRE_ROW, bar: DIRE_BAR }

const ARROW_PATH = `${PathData.ImagePath}/hud/reborn/arrow_dropdown_psd.vtex_c`
const SORT_ALL_PATH = `${PathData.ImagePath}/hud/reborn/sort_all_icon_psd.vtex_c`
const SORT_TEAM_PATH = `${PathData.ImagePath}/hud/reborn/sort_team_icon_psd.vtex_c`
const GRAPH_PATH = `${PathData.ImagePath}/hud/reborn/graph_icon_psd.vtex_c`
const ITEMS_PATH = `${PathData.ImagePath}/hud/reborn/items_icon_psd.vtex_c`

/**
 * The face the game sets its HUD in, taken from the game's own install rather than shipped
 * again: the title and the values alike want its bold italic.
 */
const FONT_FAMILY = "Radiance"
const FONT_WEIGHT = 700
const FONT_FILE = "panorama/fonts/radiance-bolditalic.otf"

/** Rows enough for a match; a custom game with more grows the pool. */
const PLAYER_ROWS = 10
const UNBOUND_KEY = "None"
/** How long the rows take to fold up under the header, or to come back out. */
const FOLD_MS = MenuSDK.Duration.Reveal
/** How far the arrow turns while the rows are away: up, to say there is something to unfold. */
const ARROW_TURN = 180

const enum EHeaderButton {
	/** The title plate: a click folds the rows away or brings them back. */
	Collapse,
	Sort,
	Graph,
	Items
}

interface INetWorthRow {
	texture: string
	value: string
	/** The team's colours, which the row's fade and its bar are drawn in. */
	palette: IRowPalette
	/** The strip down the portrait's edge: the team's, or the player's own colour. */
	strip: string
	/** This row's bar as a share of the longest one, 0 to 1. */
	share: number
}

const PREVIEW_ROWS = [
	{
		texture: ImageData.GetHeroTexture("npc_dota_hero_juggernaut"),
		value: 12345,
		team: Team.Radiant,
		color: Color.PlayerColorRadiant[0]
	},
	{
		texture: ImageData.GetHeroTexture("npc_dota_hero_axe"),
		value: 9876,
		team: Team.Dire,
		color: Color.PlayerColorDire[0]
	}
] as const

const BASE_STYLE: RmlStyle = {
	position: "absolute",
	display: "block",
	pointerEvents: "none"
}

class Ref {
	public element: Nullable<HTMLElement>
	public readonly attach = (element: Nullable<HTMLElement | null>) => {
		this.element = element ?? undefined
	}
}

class ImageRef {
	public element: Nullable<HTMLElementImage>
	public readonly attach = (element: Nullable<HTMLElement | null>) => {
		this.element = (element ?? undefined) as Nullable<HTMLElementImage>
	}
}

/**
 * One hero's row. The portrait is drawn first and the strip over its left edge, the bar next
 * and the label over the bar: what the game gets from its layout order, where a later child
 * covers an earlier one.
 */
class RowView {
	public readonly root = new Ref()
	public readonly hero = new ImageRef()
	public readonly strip = new Ref()
	public readonly bar = new Ref()
	public readonly value = new Ref()

	public Render(key: string, family: Nullable<string>): React.ReactElement {
		return React.createElement(
			"div",
			{
				key,
				ref: this.root.attach,
				style: { ...BASE_STYLE, display: "none", overflow: "visible" }
			},
			React.createElement("img", { ref: this.hero.attach, style: BASE_STYLE }),
			React.createElement("div", { ref: this.strip.attach, style: BASE_STYLE }),
			React.createElement("div", { ref: this.bar.attach, style: BASE_STYLE }),
			React.createElement("div", {
				ref: this.value.attach,
				style: {
					...BASE_STYLE,
					whiteSpace: "nowrap",
					fontFamily: family,
					fontWeight: FONT_WEIGHT,
					fontStyle: "italic",
					fontEffect: VALUE_SHADOW,
					decorator: VALUE_FILL
				}
			})
		)
	}
}

class ButtonView {
	public readonly root = new Ref()
	public readonly icon = new ImageRef()
	public readonly rect = new Rectangle()

	constructor(
		public readonly kind: EHeaderButton,
		public readonly width: number,
		public readonly iconW: number,
		public readonly iconH: number
	) {}

	public Render(key: string): React.ReactElement {
		return React.createElement(
			"div",
			{ key, ref: this.root.attach, style: BASE_STYLE },
			React.createElement("img", { ref: this.icon.attach, style: BASE_STYLE })
		)
	}
}

export class PlayerGUI {
	private rowCount = 0
	private drawn = false
	private pressed: Nullable<EHeaderButton>
	/** The key the hotkey chip was last worded for, and the chip's text for it. */
	private hotkeyKey = ""
	private hotkeyText = ""
	/** Where the cursor stands this frame, or nothing while the panel does not own it. */
	private pointer: Nullable<Vector2>
	/** Where the fold was last sent, or nothing before the config has said where it stands. */
	private foldTarget: Nullable<number>
	private readonly family: Nullable<string>
	private readonly rows: INetWorthRow[] = []
	private readonly views: RowView[] = []
	/** Each player colour as CSS, worded the first time a strip is drawn in it. */
	private readonly playerStrips = new Map<number, string>()
	private readonly size = new Vector2()
	private readonly panel: MenuSDK.OverlayPanel
	private readonly root = new Ref()
	private readonly dropdown = new Ref()
	private readonly dropdownRect = new Rectangle()
	private readonly label = new Ref()
	private readonly hotkey = new Ref()
	private readonly title = new Ref()
	private readonly arrow = new ImageRef()
	private readonly buttons = [
		new ButtonView(EHeaderButton.Sort, SORT_W, SORT_ICON, SORT_ICON),
		new ButtonView(EHeaderButton.Graph, BUTTON_W, BUTTON_ICON_W, BUTTON_ICON_H),
		new ButtonView(EHeaderButton.Items, BUTTON_W, BUTTON_ICON_W, BUTTON_ICON_H)
	]
	/**
	 * How far out the rows stand, 1 for all of them and 0 for none: the root is cut to that share
	 * of its height and the rows fade with it. Read at draw time; the tween only carries it.
	 */
	private readonly fold = new MenuSDK.Tween(1, () => {
		// nothing to apply here: the layout reads the value on its next pass
	})

	private readonly drawContent = (origin: Vector2) => {
		this.drawn = true
		this.layout(origin)
	}

	constructor(private readonly menu: MenuManager) {
		this.family = loadFont()
		for (let i = 0; i < PLAYER_ROWS; i++) {
			this.views.push(new RowView())
		}
		MenuSDK.RegisterPanel(
			"net-worth-players",
			() => this.render(),
			MenuSDK.EPanelLayer.Screen
		)
		this.panel = new MenuSDK.OverlayPanel(
			menu.Overlay,
			"hud-net-worth",
			MenuSDK.EPanelLife.MenuBound
		)
	}

	public Draw(players: PlayerCustomData[]): void {
		const byPlayer = this.menu.PlayerColors.value
		let count = 0
		let longest = 0
		for (const player of players) {
			const hero = player.Hero
			if (hero === undefined) {
				continue
			}
			const value = this.valueOf(player)
			const palette = teamPalette(player.Team)
			longest = Math.max(longest, value)
			this.setRow(
				count++,
				ImageData.GetHeroTexture(hero.Name),
				value,
				palette,
				byPlayer ? this.playerStrip(player.Color) : palette.strip
			)
		}
		this.rowCount = count
		this.shareOut(longest)
		this.present()
	}

	public DrawPreview(): void {
		const byPlayer = this.menu.PlayerColors.value
		let longest = 0
		for (let i = 0; i < PREVIEW_ROWS.length; i++) {
			const row = PREVIEW_ROWS[i]
			const palette = teamPalette(row.team)
			longest = Math.max(longest, row.value)
			this.setRow(
				i,
				row.texture,
				row.value,
				palette,
				byPlayer ? this.playerStrip(row.color) : palette.strip
			)
		}
		this.rowCount = PREVIEW_ROWS.length
		this.shareOut(longest)
		this.present()
	}

	/** Header controls take their own clicks; dragging requires the main menu to be open. */
	public MouseKeyDown(key: VMouseKeys): boolean {
		if (key === VMouseKeys.MK_LBUTTON && this.panel.HandlesInput()) {
			const button = this.buttonUnderCursor()
			if (button !== undefined) {
				this.pressed = button
				return false
			}
		}
		return MenuSDK.MenuManager.IsOpen ? this.panel.MouseKeyDown(key) : true
	}

	public MouseKeyUp(key: VMouseKeys): boolean {
		if (key !== VMouseKeys.MK_LBUTTON) {
			return true
		}
		const pressed = this.pressed
		if (pressed === undefined) {
			return this.panel.MouseKeyUp()
		}
		this.pressed = undefined
		if (this.buttonUnderCursor() === pressed) {
			this.activate(pressed)
		}
		return false
	}

	public GameChanged(): void {
		this.Reset()
	}

	public Reset(): void {
		this.pressed = undefined
		this.panel.Reset()
		this.hide()
	}

	/** A Panorama unit on this screen, at the panel's own size. */
	private get unit(): number {
		return GUIInfo.ScaleHeight(1) * this.panel.Scale
	}

	private present(): void {
		if (!MenuSDK.MenuManager.IsOpen && this.panel.Dragging) {
			this.panel.MouseKeyUp()
		}
		this.grow(this.rowCount)
		const presence = this.presence()
		const unit = this.unit
		const rows = Math.max(this.rowCount, 1)
		const rowsH = ROWS_TOP + rows * ROW_H + (rows - 1) * ROW_GAP
		this.size.SetVector(
			Math.round(PANEL_W * unit),
			Math.round((HEADER_H + rowsH * presence) * unit)
		)
		this.drawn = false
		this.panel.Draw(this.size, this.drawContent)
		if (!this.drawn) {
			this.hide()
		}
	}

	/**
	 * How far out the rows stand this frame. The menu row says where they belong; the first
	 * reading after a load lands there at once, every later change eases over.
	 */
	private presence(): number {
		const target = this.menu.Collapsed.value ? 0 : 1
		if (target !== this.foldTarget) {
			if (this.foldTarget === undefined) {
				this.fold.Set(target)
			} else {
				this.fold.To(target, FOLD_MS, MenuSDK.Ease.Out)
			}
			this.foldTarget = target
		}
		return this.fold.Value
	}

	private layout(origin: Vector2): void {
		const root = this.root.element
		if (root === undefined) {
			return
		}
		const unit = this.unit
		const presence = this.fold.Value
		const valueColor = MenuSDK.CssColor(this.menu.ValueColor.SelectedColor)
		// the root is cut to the size the panel stands at, which is what folds the rows away
		MenuSDK.WritePx(root, "left", origin.x)
		MenuSDK.WritePx(root, "top", origin.y)
		MenuSDK.WritePx(root, "width", this.size.x)
		MenuSDK.WritePx(root, "height", this.size.y)
		this.layoutHeader(origin, unit, presence)
		for (let i = 0; i < this.views.length; i++) {
			const view = this.views[i]
			if (i < this.rowCount && presence > 0) {
				this.layoutRow(view, this.rows[i], i, unit, presence, valueColor)
			} else {
				hide(view.root)
			}
		}
		MenuSDK.WriteShown(root, true, "block")
	}

	private layoutHeader(origin: Vector2, unit: number, presence: number): void {
		this.pointer = this.panel.HandlesInput() ? InputManager.CursorOnScreen : undefined
		const dropdownW = Math.round(DROPDOWN_W * unit)
		const headerH = Math.round(HEADER_H * unit)
		this.dropdownRect.pos1.SetVector(origin.x, origin.y)
		this.dropdownRect.pos2.SetVector(origin.x + dropdownW, origin.y + headerH)
		const dropdown = this.dropdown.element
		if (dropdown !== undefined) {
			MenuSDK.WritePx(dropdown, "left", 0)
			MenuSDK.WritePx(dropdown, "top", 0)
			MenuSDK.WritePx(dropdown, "width", dropdownW)
			MenuSDK.WritePx(dropdown, "height", headerH)
			MenuSDK.WritePx(dropdown, "border-radius", Math.round(PLATE_RADIUS * unit))
			MenuSDK.WriteStyle(
				dropdown,
				"background-color",
				this.isHovered(this.dropdownRect) ? PLATE_HOVER : PLATE
			)
		}
		const labelX = Math.round(DROPDOWN_LABEL_X * unit)
		const arrowX = Math.round((DROPDOWN_W - DROPDOWN_ARROW_RIGHT) * unit)
		const label = this.label.element
		if (label !== undefined) {
			MenuSDK.WritePx(label, "left", labelX)
			MenuSDK.WritePx(label, "top", 0)
			MenuSDK.WritePx(label, "width", arrowX - labelX)
			MenuSDK.WritePx(label, "height", headerH)
			MenuSDK.WritePx(label, "line-height", headerH)
			MenuSDK.WritePx(label, "font-size", Math.round(DROPDOWN_FONT * unit))
		}
		this.writeTitle()
		const arrow = this.arrow.element
		if (arrow !== undefined) {
			const size = Math.round(DROPDOWN_ARROW * unit)
			MenuSDK.WritePx(arrow, "left", arrowX)
			MenuSDK.WritePx(arrow, "top", Math.round((headerH - size) / 2))
			MenuSDK.WritePx(arrow, "width", size)
			MenuSDK.WritePx(arrow, "height", size)
			MenuSDK.WriteSizedArt(arrow, MenuSDK.ResolveAsset(ARROW_PATH), size, size)
			const turn = Math.round(ARROW_TURN * (1 - presence))
			if (MenuSDK.MarkValue(arrow, "m:turn", turn)) {
				MenuSDK.WriteStyle(arrow, "transform", `rotate(${turn}deg)`)
			}
		}
		// the buttons are the panel's controls, not part of its reading: they stand only while
		// the panel's own page is open in the menu, and take no click while they are away
		const showButtons = this.menu.IsOpen
		let x = DROPDOWN_W + HEADER_GAP
		for (const button of this.buttons) {
			if (showButtons) {
				this.layoutButton(button, origin, x, unit)
			} else {
				button.rect.pos1.SetVector(0, 0)
				button.rect.pos2.SetVector(0, 0)
				hide(button.root)
			}
			x += button.width + HEADER_GAP
		}
	}

	private layoutButton(
		button: ButtonView,
		origin: Vector2,
		x: number,
		unit: number
	): void {
		const left = Math.round(x * unit)
		const width = Math.round((x + button.width) * unit) - left
		const height = Math.round(HEADER_H * unit)
		button.rect.pos1.SetVector(origin.x + left, origin.y)
		button.rect.pos2.SetVector(origin.x + left + width, origin.y + height)
		const root = button.root.element
		if (root === undefined) {
			return
		}
		// an open panel's button keeps its plate under the cursor, as the game's selector outranks
		// its `:hover` rule
		const active = this.isActive(button.kind)
		const hovered = this.isHovered(button.rect)
		MenuSDK.WritePx(root, "left", left)
		MenuSDK.WritePx(root, "top", 0)
		MenuSDK.WritePx(root, "width", width)
		MenuSDK.WritePx(root, "height", height)
		MenuSDK.WritePx(root, "border-radius", Math.round(PLATE_RADIUS * unit))
		MenuSDK.WriteStyle(
			root,
			"background-color",
			active ? PLATE_ACTIVE : hovered ? PLATE_HOVER : PLATE
		)
		const icon = button.icon.element
		if (icon === undefined) {
			return
		}
		const iconW = Math.round(button.iconW * unit)
		const iconH = Math.round(button.iconH * unit)
		MenuSDK.WritePx(icon, "left", Math.round((width - iconW) / 2))
		MenuSDK.WritePx(icon, "top", Math.round((height - iconH) / 2))
		MenuSDK.WritePx(icon, "width", iconW)
		MenuSDK.WritePx(icon, "height", iconH)
		MenuSDK.WriteStyle(
			icon,
			"image-color",
			active
				? ICON_ACTIVE
				: hovered && button.kind === EHeaderButton.Sort
					? ICON_HOVER
					: ICON_TINT
		)
		MenuSDK.WriteSizedArt(
			icon,
			MenuSDK.ResolveAsset(this.iconPath(button.kind)),
			iconW,
			iconH
		)
		MenuSDK.WriteShown(root, true, "block")
	}

	private layoutRow(
		view: RowView,
		row: INetWorthRow,
		index: number,
		unit: number,
		presence: number,
		valueColor: string
	): void {
		const root = view.root.element
		if (root === undefined) {
			return
		}
		const palette = row.palette
		const top = HEADER_H + ROWS_TOP + index * (ROW_H + ROW_GAP)
		place(root, 0, top, PANEL_W, ROW_H, unit)
		MenuSDK.WriteFmt(root, "opacity", presence, "")
		MenuSDK.WriteStyle(root, "decorator", palette.row)
		const hero = view.hero.element
		if (hero !== undefined) {
			const width = Math.round(HERO_W * unit)
			const height = Math.round(ROW_H * unit)
			place(hero, 0, 0, HERO_W, ROW_H, unit)
			MenuSDK.WriteSizedArt(hero, MenuSDK.ResolveAsset(row.texture), width, height)
		}
		const strip = view.strip.element
		if (strip !== undefined) {
			place(strip, 0, 0, STRIP_W, ROW_H, unit)
			MenuSDK.WriteStyle(strip, "background-color", row.strip)
		}
		const bar = view.bar.element
		if (bar !== undefined) {
			if (this.menu.Bar.value) {
				const width = Math.max(row.share * (PANEL_W - HERO_W) - BAR_RIGHT, 0)
				place(bar, HERO_W, BAR_TOP, width, BAR_H, unit)
				MenuSDK.WriteStyle(bar, "decorator", palette.bar)
				MenuSDK.WriteShown(bar, true, "block")
			} else {
				MenuSDK.WriteShown(bar, false)
			}
		}
		const value = view.value.element
		if (value !== undefined) {
			const lineTop = Math.round(VALUE_PAD_TOP * unit)
			const lineBottom = Math.round((ROW_H - VALUE_PAD_BOTTOM) * unit)
			MenuSDK.WritePx(value, "left", Math.round(HERO_W * unit))
			MenuSDK.WritePx(value, "top", 0)
			MenuSDK.WritePx(value, "padding-top", lineTop)
			MenuSDK.WritePx(value, "padding-right", Math.round(VALUE_PAD_RIGHT * unit))
			MenuSDK.WritePx(
				value,
				"padding-bottom",
				Math.round(ROW_H * unit) - lineBottom
			)
			MenuSDK.WritePx(value, "padding-left", Math.round(VALUE_PAD_LEFT * unit))
			MenuSDK.WritePx(value, "line-height", lineBottom - lineTop)
			MenuSDK.WritePx(value, "font-size", Math.round(VALUE_FONT * unit))
			MenuSDK.WriteStyle(value, "color", valueColor)
			MenuSDK.WriteText(value, row.value)
		}
		MenuSDK.WriteShown(root, true, "block")
	}

	/**
	 * The hotkey chip and the stat's name, the way the game's dropdown reads them. The writers
	 * gate on what the element itself last showed, so an element the document built afresh is
	 * written again rather than left blank.
	 */
	private writeTitle(): void {
		const hotkey = this.hotkey.element
		if (hotkey !== undefined) {
			const key = this.menu.ToggleKey.assignedKeyStr
			if (key !== this.hotkeyKey) {
				this.hotkeyKey = key
				this.hotkeyText = key === UNBOUND_KEY || key === "" ? "" : `(${key}) `
			}
			MenuSDK.WriteText(hotkey, this.hotkeyText)
		}
		const title = this.title.element
		if (title !== undefined) {
			MenuSDK.WriteText(title, Menu.Localization.Localize("Net worth"))
		}
	}

	private hide(): void {
		hide(this.root)
	}

	/** Rows enough for `count` heroes; a longer list than the pool asks its layer for a pass. */
	private grow(count: number): void {
		if (this.views.length >= count) {
			return
		}
		while (this.views.length < count) {
			this.views.push(new RowView())
		}
		MenuSDK.RefreshPanelLayer(MenuSDK.EPanelLayer.Screen)
	}

	private buttonUnderCursor(): Nullable<EHeaderButton> {
		const cursor = InputManager.CursorOnScreen
		if (this.dropdownRect.Contains(cursor)) {
			return EHeaderButton.Collapse
		}
		return this.buttons.find(button => button.rect.Contains(cursor))?.kind
	}

	private isHovered(rect: Rectangle): boolean {
		return this.pointer !== undefined && rect.Contains(this.pointer)
	}

	private isActive(button: EHeaderButton): boolean {
		switch (button) {
			case EHeaderButton.Graph:
				return this.menu.Total.State.value
			case EHeaderButton.Items:
				return this.menu.OnlyItems.value
			default:
				return false
		}
	}

	private iconPath(button: EHeaderButton): string {
		switch (button) {
			case EHeaderButton.Sort:
				return this.menu.SortWithinTeam.value ? SORT_TEAM_PATH : SORT_ALL_PATH
			case EHeaderButton.Graph:
				return GRAPH_PATH
			default:
				return ITEMS_PATH
		}
	}

	private activate(button: EHeaderButton): void {
		const menu = this.menu
		switch (button) {
			case EHeaderButton.Collapse:
				menu.Collapsed.value = !menu.Collapsed.value
				break
			case EHeaderButton.Sort:
				menu.SortWithinTeam.value = !menu.SortWithinTeam.value
				break
			case EHeaderButton.Graph:
				menu.Total.State.value = !menu.Total.State.value
				break
			case EHeaderButton.Items:
				menu.OnlyItems.value = !menu.OnlyItems.value
				break
		}
	}

	private setRow(
		index: number,
		texture: string,
		value: number,
		palette: IRowPalette,
		strip: string
	): void {
		let row = this.rows[index]
		if (row === undefined) {
			row = this.rows[index] = { texture: "", value: "", palette, strip, share: 0 }
		}
		row.texture = texture
		row.value = value.toString()
		row.palette = palette
		row.strip = strip
		row.share = value
	}

	private playerStrip(color: Color): string {
		let strip = this.playerStrips.get(color.data32)
		if (strip === undefined) {
			strip = MenuSDK.cssColor(color)
			this.playerStrips.set(color.data32, strip)
		}
		return strip
	}

	/** Turns the values kept in `share` into each row's share of the longest bar. */
	private shareOut(longest: number): void {
		for (let i = 0; i < this.rowCount; i++) {
			const row = this.rows[i]
			row.share = longest > 0 ? row.share / longest : 0
		}
	}

	private valueOf(player: PlayerCustomData): number {
		return this.menu.OnlyItems.value ? player.ItemsGold : player.NetWorth
	}

	private render(): React.ReactNode {
		return React.createElement(
			"div",
			{
				style: {
					position: "absolute",
					left: 0,
					top: 0,
					width: "100%",
					height: "100%",
					pointerEvents: "none"
				}
			},
			React.createElement(
				"div",
				{
					ref: this.root.attach,
					style: { ...BASE_STYLE, display: "none", overflow: "hidden" }
				},
				this.renderHeader(),
				...this.views.map((view, i) => view.Render(`row-${i}`, this.family))
			)
		)
	}

	/**
	 * The dropdown plate with the hotkey chip, the stat's name and the arrow at its right, and
	 * the buttons beside it. Only what never moves lives in the tree; every length, and every
	 * colour the cursor changes, is written at draw time.
	 */
	private renderHeader(): React.ReactElement[] {
		return [
			React.createElement(
				"div",
				{
					key: "dropdown",
					ref: this.dropdown.attach,
					style: { ...BASE_STYLE, overflow: "hidden" }
				},
				React.createElement(
					"div",
					{
						ref: this.label.attach,
						style: {
							...BASE_STYLE,
							overflow: "hidden",
							whiteSpace: "nowrap",
							fontFamily: this.family,
							fontWeight: FONT_WEIGHT,
							fontStyle: "italic",
							color: TITLE_COLOR
						}
					},
					React.createElement("span", {
						ref: this.hotkey.attach,
						style: { color: HOTKEY_COLOR }
					}),
					React.createElement("span", { ref: this.title.attach })
				),
				React.createElement("img", { ref: this.arrow.attach, style: BASE_STYLE })
			),
			...this.buttons.map(button => button.Render(`button-${button.kind}`))
		]
	}
}

/** Rounds each edge on its own, so two boxes sharing an edge land on the same screen pixel. */
function place(
	element: HTMLElement,
	x: number,
	y: number,
	width: number,
	height: number,
	unit: number
): void {
	const left = Math.round(x * unit)
	const top = Math.round(y * unit)
	MenuSDK.WritePx(element, "left", left)
	MenuSDK.WritePx(element, "top", top)
	MenuSDK.WritePx(element, "width", Math.round((x + width) * unit) - left)
	MenuSDK.WritePx(element, "height", Math.round((y + height) * unit) - top)
}

function teamPalette(team: Team): IRowPalette {
	return team === Team.Radiant ? RADIANT_PALETTE : DIRE_PALETTE
}

function hide(ref: Ref): void {
	const element = ref.element
	if (element !== undefined) {
		MenuSDK.WriteShown(element, false)
	}
}

/** The game's face, or nothing where the host cannot load it and the theme's face serves. */
function loadFont(): Nullable<string> {
	return typeof LoadFont === "function" && LoadFont(FONT_FILE, false, FONT_WEIGHT)
		? FONT_FAMILY
		: undefined
}
