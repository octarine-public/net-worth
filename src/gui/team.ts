import { TotalNetWorthMenu } from "../menu"

/**
 * The game's own discrete gold display, as `dota_hud_top_bar.vcss_c` lays it out: a 64×18 plate
 * hung 40 under the top edge, 4 in from either end of a 210-wide strip centred on the top bar,
 * with its bottom corners taken off by 3. Inside, a 7-wide arrow, the sum in bold 14 and a
 * 12-wide coin dimmed to 70%, spaced 1 / 2 / 2 apart. Panorama units at 1080p, scaled the way
 * the SDK scales the rest of the top bar.
 */
const STRIP_W = 210
const STRIP_TOP = 40
const PLATE_W = 64
const PLATE_H = 18
/**
 * Room under the row. The game's plate is 18 tall with the row sitting low in it; here the row
 * keeps its height and the plate grows by this much below it, so the sum and coins do not sit
 * on the rounded bottom edge.
 */
const PLATE_PAD_BOTTOM = 3
const PLATE_MARGIN = 4
const PLATE_RADIUS = 3
const ARROW = 7
const ARROW_GAP = 1
const FONT = 14
const LABEL_GAP = 2
const COIN = 12
const COIN_GAP = 2
const COIN_PATH = `${PathData.ImagePath}/hud/reborn/gold_small_psd.vtex_c`
/** `brightness: 0.7` on the coin, as a tint: the same darkening without a filter pass. */
const COIN_TINT = "#b3b3b3"
/**
 * `text-shadow: 0px 1px 2px 3.0 #000000` in the game: a 2-wide blur drawn three times over,
 * which is as good as solid, hung a pixel down. Here that is a 1-wide rim with a 1-wide fade
 * at the same offset; a plain offset shadow was too thin to read at this size.
 */
const LABEL_SHADOW = "glow(1px 1px 0px 1px #000000)"
/**
 * `font-family: monospaceNumbersFont; font-weight: bold` in the game: RadianceM for the digits
 * and, since that face carries nothing else, Radiance for the sign and the k. RmlUi has no such
 * list - a glyph the face lacks comes from the menu's fallback, thin Roboto - so the sum is set
 * in Radiance throughout, from the game's own install, in the bold cut the game names.
 */
const LABEL_FONT_FILE = "panorama/fonts/radiance-bold.otf"
const LABEL_FAMILY = "Radiance"
const LABEL_WEIGHT = 700
/**
 * How far under the plate's middle the sum is set. The game lays its label out from the top of
 * the plate with the face's own leading above the glyphs, which lands them lower than a
 * centred line box does here.
 */
const LABEL_DROP = 2
/**
 * The plate's gradient: `#151616` at the edges, `#252727` at 30% down. The game fades the edges
 * to 0.87 and the band to 0.67, so the band keeps 0.77 of the edge alpha; the menu's slider sets
 * the edge and the band follows.
 */
const PLATE_INK = "#151616"
const PLATE_BAND_INK = "#252727"
const PLATE_BAND = 0.77

class TeamSide {
	public root: Nullable<HTMLElement>
	public fill: Nullable<HTMLElement>
	public row: Nullable<HTMLElement>
	public label: Nullable<HTMLElement>
	public arrow: Nullable<HTMLElementImage>
	public gold: Nullable<HTMLElementImage>

	public readonly attachRoot = (element: Nullable<HTMLElement | null>) => {
		this.root = element ?? undefined
	}
	public readonly attachFill = (element: Nullable<HTMLElement | null>) => {
		this.fill = element ?? undefined
	}
	public readonly attachRow = (element: Nullable<HTMLElement | null>) => {
		this.row = element ?? undefined
	}
	public readonly attachLabel = (element: Nullable<HTMLElement | null>) => {
		this.label = element ?? undefined
	}
	public readonly attachArrow = (element: Nullable<HTMLElement | null>) => {
		this.arrow = (element ?? undefined) as Nullable<HTMLElementImage>
	}
	public readonly attachGold = (element: Nullable<HTMLElement | null>) => {
		this.gold = (element ?? undefined) as Nullable<HTMLElementImage>
	}
}

export class TeamGUI {
	private readonly radiant = new TeamSide()
	private readonly dire = new TeamSide()
	private fill = ""
	private fillOpacity = -1
	/** The game's face for the sum, or nothing where the host cannot load it. */
	private readonly family: Nullable<string>

	constructor() {
		this.family = loadLabelFont()
		MenuSDK.RegisterPanel(
			"net-worth-team",
			() => this.render(),
			MenuSDK.EPanelLayer.Screen
		)
	}

	protected get GUIReady() {
		return GUIInfo !== undefined && GUIInfo.TopBar !== undefined
	}

	public Draw(menu: TotalNetWorthMenu, radiant: number, dire: number): void {
		if (!menu.State.value || !this.GUIReady) {
			this.Hide()
			return
		}
		const color = MenuSDK.CssColor(menu.TextColor.SelectedColor)
		const fill = this.fillFor(menu.Opacity.value)
		if (!menu.Difference.value) {
			this.side(this.radiant, Team.Radiant, radiant, color, fill)
			this.side(this.dire, Team.Dire, dire, color, fill)
			return
		}
		const distinction = radiant - dire
		const team = distinction > 0 ? Team.Radiant : Team.Dire
		this.side(
			team === Team.Radiant ? this.radiant : this.dire,
			team,
			Math.abs(distinction),
			color,
			fill
		)
		this.hideSide(team === Team.Radiant ? this.dire : this.radiant)
	}

	public Hide(): void {
		this.hideSide(this.radiant)
		this.hideSide(this.dire)
	}

	public GameChanged(): void {
		this.Hide()
	}

	private side(
		side: TeamSide,
		team: Team,
		sum: number,
		color: string,
		fill: string
	): void {
		const root = side.root
		if (root === undefined) {
			return
		}
		const topBar = GUIInfo.TopBar.TopBar
		if (topBar === undefined) {
			this.hideSide(side)
			return
		}
		const stripW = GUIInfo.ScaleWidth(STRIP_W)
		const stripX = topBar.x + Math.round((topBar.Width - stripW) / 2)
		const margin = GUIInfo.ScaleWidth(PLATE_MARGIN)
		const width = GUIInfo.ScaleWidth(PLATE_W)
		const radius = GUIInfo.ScaleHeight(PLATE_RADIUS)
		MenuSDK.WritePx(
			root,
			"left",
			team === Team.Dire ? stripX + stripW - margin - width : stripX + margin
		)
		MenuSDK.WritePx(root, "top", topBar.y + GUIInfo.ScaleHeight(STRIP_TOP))
		MenuSDK.WritePx(root, "width", width)
		MenuSDK.WritePx(root, "height", GUIInfo.ScaleHeight(PLATE_H + PLATE_PAD_BOTTOM))
		MenuSDK.WritePx(root, "border-bottom-left-radius", radius)
		MenuSDK.WritePx(root, "border-bottom-right-radius", radius)
		if (side.fill !== undefined) {
			MenuSDK.WriteStyle(side.fill, "decorator", fill)
		}
		if (side.row !== undefined) {
			MenuSDK.WritePx(side.row, "height", GUIInfo.ScaleHeight(PLATE_H))
		}
		const label = side.label
		if (label !== undefined) {
			MenuSDK.WritePx(label, "font-size", GUIInfo.ScaleHeight(FONT))
			MenuSDK.WritePx(label, "margin-left", GUIInfo.ScaleWidth(LABEL_GAP))
			MenuSDK.WritePx(label, "top", GUIInfo.ScaleHeight(LABEL_DROP))
			MenuSDK.WriteStyle(label, "color", color)
			MenuSDK.WriteText(label, this.serializeSum(sum))
		}
		this.icon(
			side.arrow,
			GUIInfo.ScaleHeight(ARROW),
			GUIInfo.ScaleWidth(ARROW_GAP),
			this.arrowPath(team)
		)
		this.icon(
			side.gold,
			GUIInfo.ScaleHeight(COIN),
			GUIInfo.ScaleWidth(COIN_GAP),
			COIN_PATH
		)
		MenuSDK.WriteShown(root, true, "block")
	}

	private hideSide(side: TeamSide): void {
		const root = side.root
		if (root !== undefined) {
			MenuSDK.WriteShown(root, false)
		}
	}

	private icon(
		image: Nullable<HTMLElementImage>,
		size: number,
		gap: number,
		path: string
	): void {
		if (image === undefined) {
			return
		}
		MenuSDK.WritePx(image, "width", size)
		MenuSDK.WritePx(image, "height", size)
		MenuSDK.WritePx(image, "margin-left", gap)
		MenuSDK.WriteSizedArt(image, MenuSDK.ResolveAsset(path), size, size)
	}

	private arrowPath(team: Team): string {
		return GameState.LocalTeam === team
			? ImageData.Icons.arrow_gold_dif
			: ImageData.Icons.arrow_plus_stats_red
	}

	/** The plate's gradient at the menu's opacity, rebuilt only when the slider moves. */
	private fillFor(opacity: number): string {
		if (opacity !== this.fillOpacity) {
			this.fillOpacity = opacity
			const edge = PLATE_INK + hexAlpha(opacity / 100)
			const band = PLATE_BAND_INK + hexAlpha((opacity / 100) * PLATE_BAND)
			this.fill = `linear-gradient(to bottom, ${edge} 0%, ${band} 30%, ${edge} 100%)`
		}
		return this.fill
	}

	private serializeSum(sum: number): string {
		const total = Math.min(sum / 1000, 99)
		const moduleSum = (total * 100) % 50
		const minTotal = Math.max(Math.floor(total), 1)
		return (
			(moduleSum === 0
				? minTotal
				: moduleSum > 30
					? "<" + minTotal
					: ">" + minTotal) + "k"
		)
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
			this.block(this.radiant),
			this.block(this.dire)
		)
	}

	/**
	 * The plate: the root clips to its rounded bottom corners and a layer under the contents
	 * carries the gradient, so the fill is cut by the corners whatever the decorator makes of a
	 * border radius. Every length is written at draw time in screen pixels, scaled off the top bar
	 * like the game's own; only what never moves - the coin's tint, the label's weight and shadow -
	 * lives in the tree.
	 */
	private block(side: TeamSide): React.ReactElement {
		return React.createElement(
			"div",
			{
				ref: side.attachRoot,
				style: {
					position: "absolute",
					display: "none",
					overflow: "hidden",
					zIndex: 0,
					pointerEvents: "none"
				}
			},
			React.createElement("div", {
				ref: side.attachFill,
				style: {
					position: "absolute",
					left: 0,
					top: 0,
					width: "100%",
					height: "100%",
					zIndex: -1,
					pointerEvents: "none"
				}
			}),
			React.createElement(
				"div",
				{
					ref: side.attachRow,
					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
						whiteSpace: "nowrap"
					}
				},
				React.createElement("img", { ref: side.attachArrow }),
				React.createElement("div", {
					ref: side.attachLabel,
					style: {
						position: "relative",
						fontFamily: this.family,
						fontWeight: LABEL_WEIGHT,
						fontEffect: LABEL_SHADOW
					}
				}),
				React.createElement("img", {
					ref: side.attachGold,
					style: { imageColor: COIN_TINT }
				})
			)
		)
	}
}

function loadLabelFont(): Nullable<string> {
	return typeof LoadFont === "function" &&
		LoadFont(LABEL_FONT_FILE, false, LABEL_WEIGHT)
		? LABEL_FAMILY
		: undefined
}

function hexAlpha(alpha: number): string {
	return Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
		.toString(16)
		.padStart(2, "0")
}
