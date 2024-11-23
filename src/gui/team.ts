import {
	Color,
	GameState,
	GUIInfo,
	ImageData,
	Rectangle,
	RendererSDK,
	Team,
	TextFlags,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { TotalNetWorthMenu } from "../menu"

export class TeamGUI {
	protected Dire = 0
	protected Radiant = 0

	protected Team = Team.Radiant
	protected readonly BgColor = new Color(0x0, 0x0, 0x0, 0xdc)

	protected get GUIReady() {
		return GUIInfo !== undefined && GUIInfo.TopBar !== undefined
	}

	public Draw(menu: TotalNetWorthMenu, radiant: number, dire: number) {
		if (!menu.State.value || !this.GUIReady) {
			return
		}

		this.Dire = dire
		this.Radiant = radiant

		if (!menu.Difference.value) {
			this.redenderAllTeams(menu)
			return
		}

		const color = menu.TextColor.SelectedColor
		const distinction = this.Radiant - this.Dire
		const teamDistinction = distinction > 0 ? Team.Radiant : Team.Dire
		const position = this.getPosition(teamDistinction)
		this.renderComponent(position, teamDistinction, color, distinction)
	}

	public GameChanged() {
		this.Team = Team.Radiant
		this.Dire = this.Radiant = 0
	}

	private redenderAllTeams(menu: TotalNetWorthMenu) {
		const textColor = menu.TextColor.SelectedColor
		const direPosition = this.getPosition(Team.Dire)
		const radiantPosition = this.getPosition(Team.Radiant)
		this.renderComponent(direPosition, Team.Dire, textColor)
		this.renderComponent(radiantPosition, Team.Radiant, textColor)
	}

	private renderComponent(
		rec: Rectangle,
		team = Team.Radiant,
		textColor: Color,
		sum?: number
	) {
		this.renderBackground(rec)
		const position = rec.Clone()

		const iconSize = GUIInfo.ScaleVector(12, 12)
		const text = this.calcSummToStr(this.serializeSum(team, sum))
		const textPosition = RendererSDK.TextByFlags(
			text,
			position,
			textColor,
			2,
			TextFlags.Center,
			600
		)

		this.renderDiffIcon(textPosition, team)
		this.renderGoldIcon(textPosition, iconSize)
	}

	private renderDiffIcon(rec: Rectangle, team: Team) {
		const position = rec.Clone()
		const localTeam = GameState.LocalTeam
		const indentation = GUIInfo.ScaleWidth(1)
		const iconSize = GUIInfo.ScaleVector(8, 8)

		position.pos1
			.AddScalarY(indentation + iconSize.y / 4)
			.SubtractScalarX(indentation + iconSize.x)

		const imageTeam =
			localTeam === team || localTeam === Team.Observer
				? ImageData.Icons.arrow_gold_dif
				: ImageData.Icons.arrow_plus_stats_red

		RendererSDK.Image(imageTeam, position.pos1, -1, iconSize, Color.White)
	}

	private renderGoldIcon(rec: Rectangle, iconSize: Vector2) {
		const image = ImageData.Icons.gold_large
		const position = rec.Clone()
		const iconPosition = position.pos1.AddScalarX(position.pos2.x)
		RendererSDK.Image(image, iconPosition, -1, iconSize, Color.White)
	}

	private renderBackground(position: Rectangle) {
		RendererSDK.Image(
			ImageData.Icons.chat_preview_opacity_mask,
			position.pos1,
			-1,
			position.Size,
			this.BgColor,
			0,
			undefined,
			false,
			new Vector2(),
			RendererSDK.GetImageSize(ImageData.Icons.chat_preview_opacity_mask)
		)
	}

	private serializeSum(team: Team, sum?: number) {
		const convertSum = (newSum: number) => (newSum < 0 ? newSum * -1 : newSum)
		if (sum !== undefined) {
			return convertSum(sum)
		}
		sum ??= team === Team.Dire ? this.Dire : this.Radiant
		return convertSum(sum)
	}

	private calcSummToStr(sum: number) {
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

	private getPosition(team?: Team) {
		return (team ?? this.Team) === Team.Dire
			? GUIInfo.TopBar.DireSpectatorGoldDisplay.Clone()
			: GUIInfo.TopBar.RadiantSpectatorGoldDisplay.Clone()
	}
}
