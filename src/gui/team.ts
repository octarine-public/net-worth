import { TotalNetWorthMenu } from "../menu"

const RADIUS = 6
const ICON_GAP = 3

class TeamSide {
	public root: Nullable<HTMLElement>
	public label: Nullable<HTMLElement>
	public arrow: Nullable<HTMLElementImage>
	public gold: Nullable<HTMLElementImage>

	public readonly attachRoot = (element: Nullable<HTMLElement | null>) => {
		this.root = element ?? undefined
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

	constructor() {
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
		const color = MenuSDK.WithThemeScope(
			MenuSDK.PanelScope(MenuSDK.EPanelLayer.Screen),
			() =>
				MenuSDK.CssColor(MenuSDK.HudColors.readable(menu.TextColor.SelectedColor))
		)
		if (!menu.Difference.value) {
			this.side(this.radiant, Team.Radiant, radiant, color)
			this.side(this.dire, Team.Dire, dire, color)
			return
		}
		const distinction = radiant - dire
		const team = distinction > 0 ? Team.Radiant : Team.Dire
		this.side(
			team === Team.Radiant ? this.radiant : this.dire,
			team,
			Math.abs(distinction),
			color
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

	private side(side: TeamSide, team: Team, sum: number, color: string): void {
		const root = side.root
		if (root === undefined) {
			return
		}
		const rect =
			team === Team.Dire
				? GUIInfo.TopBar.DireSpectatorGoldDisplay
				: GUIInfo.TopBar.RadiantSpectatorGoldDisplay
		MenuSDK.WritePx(root, "left", rect.x)
		MenuSDK.WritePx(root, "top", rect.y)
		MenuSDK.WritePx(root, "width", rect.Width)
		MenuSDK.WritePx(root, "height", rect.Height)
		const label = side.label
		if (label !== undefined) {
			MenuSDK.WritePx(label, "font-size", Math.round(rect.Height / 2))
			MenuSDK.WriteStyle(label, "color", color)
			MenuSDK.WriteText(label, this.serializeSum(sum))
		}
		this.icon(side.arrow, Math.round(rect.Height / 3), this.arrowPath(team))
		this.icon(side.gold, Math.round(rect.Height / 2))
		MenuSDK.WriteShown(root, true, "block")
	}

	private hideSide(side: TeamSide): void {
		const root = side.root
		if (root !== undefined) {
			MenuSDK.WriteShown(root, false)
		}
	}

	private icon(image: Nullable<HTMLElementImage>, size: number, path?: string): void {
		if (image === undefined) {
			return
		}
		MenuSDK.WritePx(image, "width", size)
		MenuSDK.WritePx(image, "height", size)
		if (path === undefined) {
			return
		}
		const source = MenuSDK.ResolveAsset(path)
		if (image.src !== source) {
			image.src = source
		}
	}

	private arrowPath(team: Team): string {
		return GameState.LocalTeam === team
			? ImageData.Icons.arrow_gold_dif
			: ImageData.Icons.arrow_plus_stats_red
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

	private block(side: TeamSide): React.ReactElement {
		return React.createElement(
			"div",
			{
				ref: side.attachRoot,
				style: {
					position: "absolute",
					display: "none",
					zIndex: 0,
					pointerEvents: "none",
					backdropFilter: MenuSDK.Tokens.GlassBlur,
					...MenuSDK.SdfRoundedTheme(RADIUS, "GlassBgPanel", 1, "GlassBorder")
				}
			},
			React.createElement(MenuSDK.GlowLayer, {
				radius: RADIUS,
				fill: MenuSDK.HexOf(MenuSDK.Tokens.GlassBgPanel)
			}),
			React.createElement(
				"div",
				{
					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
						height: "100%",
						whiteSpace: "nowrap"
					}
				},
				React.createElement("img", {
					ref: side.attachArrow,
					style: { marginRight: ICON_GAP }
				}),
				React.createElement("div", {
					ref: side.attachLabel,
					style: { fontWeight: MenuSDK.HudBold }
				}),
				React.createElement("img", {
					ref: side.attachGold,
					src: MenuSDK.ResolveAsset(ImageData.Icons.gold_large),
					style: { marginLeft: ICON_GAP }
				})
			)
		)
	}
}
