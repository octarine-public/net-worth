import { MenuManager } from "../menu"

const HEADER_H = 30
const ROW_H = 26
const FONT = 13
const NAME_W = 96
const PORTRAIT_W = 32
const PORTRAIT_H = 18
const STRIPE_W = 3
const STRIPE_GAP = 5
const TEXT_GAP = 8
const BOTTOM_PAD = 4
const VALUE_RESERVE = "000 000"

interface INetWorthRow {
	texture: string
	name: string
	value: string
	color: Color
	isRed: boolean
}

const PREVIEW_ROWS = [
	{
		texture: ImageData.GetHeroTexture("npc_dota_hero_juggernaut"),
		value: "12 345",
		color: Color.PlayerColorRadiant[0],
		isRed: false
	},
	{
		texture: ImageData.GetHeroTexture("npc_dota_hero_axe"),
		value: "9 876",
		color: Color.PlayerColorDire[0],
		isRed: true
	}
] as const

export class PlayerGUI {
	private rowCount = 0
	private readonly rows: INetWorthRow[] = []
	private readonly size = new Vector2()
	private readonly box = new Rectangle()
	private readonly imagePos = new Vector2()
	private readonly imageSize = new Vector2()
	private readonly panel: MenuSDK.OverlayPanel

	private readonly drawContent = (origin: Vector2) => {
		const box = this.box
		box.pos1.CopyFrom(origin)
		box.pos2.SetVector(origin.x + this.size.x, origin.y + this.size.y)
		MenuSDK.HudCard.Frame(box)
		const headerH = MenuSDK.hudH(HEADER_H)
		const rowH = MenuSDK.hudH(ROW_H)
		MenuSDK.HudCard.Header(
			box,
			headerH,
			Menu.Localization.Localize("Net worth"),
			undefined,
			true
		)
		for (let i = 0; i < this.rowCount; i++) {
			this.row(this.rows[i], box, headerH + rowH * i, rowH)
		}
	}

	constructor(private readonly menu: MenuManager) {
		this.panel = new MenuSDK.OverlayPanel(
			menu.Overlay,
			"hud-net-worth",
			MenuSDK.EPanelLife.MenuBound
		)
	}

	public Draw(players: PlayerCustomData[]): void {
		let count = 0
		for (const player of players) {
			const hero = player.Hero
			if (hero === undefined) {
				continue
			}
			this.setRow(
				count++,
				ImageData.GetHeroTexture(hero.Name),
				player.PlayerName ?? "",
				this.serializeNetWorth(this.valueOf(player)),
				player.Color,
				this.isRed(player)
			)
		}
		this.rowCount = count
		this.render()
	}

	public DrawPreview(): void {
		for (let i = 0; i < PREVIEW_ROWS.length; i++) {
			const row = PREVIEW_ROWS[i]
			this.setRow(
				i,
				row.texture,
				Menu.Localization.Localize("Preview"),
				row.value,
				row.color,
				row.isRed
			)
		}
		this.rowCount = PREVIEW_ROWS.length
		this.render()
	}

	public MouseKeyDown(key: VMouseKeys): boolean {
		return this.panel.MouseKeyDown(key)
	}

	public MouseKeyUp(key: VMouseKeys): boolean {
		return key !== VMouseKeys.MK_LBUTTON || this.panel.MouseKeyUp()
	}

	public GameChanged(): void {
		this.panel.Reset()
	}

	public Reset(): void {
		this.panel.Reset()
	}

	private render(): void {
		MenuSDK.setHudScale(this.panel.Scale)
		let valueW = MenuSDK.HudText.Width(VALUE_RESERVE, FONT, MenuSDK.HudBold)
		for (let i = 0; i < this.rowCount; i++) {
			valueW = Math.max(
				valueW,
				MenuSDK.HudText.Width(this.rows[i].value, FONT, MenuSDK.HudBold)
			)
		}
		const width =
			MenuSDK.hudW(MenuSDK.HudCard.Pad) * 2 +
			MenuSDK.hudW(
				STRIPE_W + STRIPE_GAP + PORTRAIT_W + TEXT_GAP + NAME_W + TEXT_GAP
			) +
			valueW
		this.size.SetVector(
			Math.round(width),
			Math.round(
				MenuSDK.hudH(HEADER_H) +
					MenuSDK.hudH(ROW_H) * this.rowCount +
					MenuSDK.hudH(BOTTOM_PAD)
			)
		)
		this.panel.Draw(this.size, this.drawContent)
	}

	private row(row: INetWorthRow, box: Rectangle, offsetY: number, rowH: number): void {
		const pad = MenuSDK.hudW(MenuSDK.HudCard.Pad)
		const stripeW = MenuSDK.hudW(STRIPE_W)
		const imageW = MenuSDK.hudW(PORTRAIT_W)
		const imageH = MenuSDK.hudH(PORTRAIT_H)
		const centerY = box.y + offsetY + rowH / 2
		const top = Math.round(centerY - imageH / 2)
		MenuSDK.HudCard.Plate(
			box.x + pad,
			top,
			stripeW,
			imageH,
			stripeW / 2,
			MenuSDK.HudColors.readable(row.color),
			MenuSDK.hudAlpha()
		)
		this.imagePos.SetVector(box.x + pad + stripeW + MenuSDK.hudW(STRIPE_GAP), top)
		this.imageSize.SetVector(imageW, imageH)
		MenuSDK.HudCard.Image(
			row.texture,
			this.imagePos,
			this.imageSize,
			Color.WhiteReadonly,
			MenuSDK.hudAlpha(),
			MenuSDK.hudRadius(4)
		)
		const textX = this.imagePos.x + imageW + MenuSDK.hudW(TEXT_GAP)
		MenuSDK.HudText.Left(
			textX,
			centerY,
			MenuSDK.HudText.Clip(row.name, MenuSDK.hudW(NAME_W), FONT),
			FONT,
			MenuSDK.HudColors.title
		)
		MenuSDK.HudText.Right(
			box.pos2.x - pad,
			centerY,
			row.value,
			FONT,
			row.isRed ? MenuSDK.HudColors.kill : MenuSDK.HudColors.ok,
			MenuSDK.HudBold
		)
	}

	private setRow(
		index: number,
		texture: string,
		name: string,
		value: string,
		color: Color,
		isRed: boolean
	): void {
		let row = this.rows[index]
		if (row === undefined) {
			row = this.rows[index] = {
				texture: "",
				name: "",
				value: "",
				color: Color.White,
				isRed: false
			}
		}
		row.texture = texture
		row.name = name
		row.value = value
		row.color = color
		row.isRed = isRed
	}

	private valueOf(player: PlayerCustomData): number {
		return this.menu.OnlyItems.value ? player.ItemsGold : player.NetWorth
	}

	private isRed(player: PlayerCustomData): boolean {
		return GameState.LocalTeam === Team.Observer
			? player.Team === Team.Dire
			: player.IsEnemy()
	}

	private serializeNetWorth(netWorth: number): string {
		return netWorth.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")
	}
}
