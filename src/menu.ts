import { NetWorthIcons } from "./icons"

/** Rows of the team totals card, named as they were before the card and its rows were renamed. */
const TeamsOldName = "Between teams"
const DifferenceOldName = "Show only difference"

export class TotalNetWorthMenu {
	public readonly State: Menu.Toggle
	public readonly Difference: Menu.Toggle
	public readonly Opacity: Menu.Slider
	public readonly TextColor: Menu.ColorPicker
	public readonly Tree: Menu.Node

	constructor(tree: Menu.Node) {
		this.Tree = tree.AddNode(
			"Team totals",
			NetWorthIcons.Teams,
			"Net worth of Radiant and Dire\nbeside the gold in the top bar"
		)
		this.Tree.SortNodes = false
		// the card's own switch rides its header
		this.State = this.Tree.AddToggle(
			"State",
			true,
			undefined,
			-1,
			NetWorthIcons.State
		)
		this.Tree.HeaderControl = this.State
		this.Difference = this.Tree.AddToggle(
			"Only difference",
			true,
			"One badge with the gap between the teams\ninstead of a total for each",
			-1,
			NetWorthIcons.Difference
		)
		// the game fades its plate to 87%, but blends its HUD in linear light, where that reads
		// lighter than the same alpha does here; 68 lands the panel's plate on the game's look
		this.Opacity = this.Tree.AddSlider(
			"Plate opacity",
			68,
			0,
			100,
			0,
			"How dark the plate behind the sum is drawn"
		)
		this.Opacity.IconPath = NetWorthIcons.Opacity
		// the game's own gold: `.GoldDiscrete { color: #ddc05a }`
		this.TextColor = this.Tree.AddColorPicker("Text color", new Color(221, 192, 90))
		this.TextColor.IconPath = NetWorthIcons.TextColor
	}
}

export class MenuManager {
	public IsToggled = true
	public readonly State: Menu.Toggle
	public readonly Ally: Menu.Toggle
	public readonly Enemy: Menu.Toggle
	public readonly Local: Menu.Toggle
	public readonly OnlyItems: Menu.Toggle
	public readonly SortWithinTeam: Menu.Toggle
	public readonly Bar: Menu.Toggle
	public readonly PlayerColors: Menu.Toggle
	public readonly ValueColor: Menu.ColorPicker
	/** Whether the rows are folded up under the header; a click on the title flips it. */
	public readonly Collapsed: Menu.Toggle

	public readonly ModeKey: Menu.Dropdown
	public readonly ToggleKey: Menu.KeyBind

	public readonly Tree: Menu.Node
	public readonly Total: TotalNetWorthMenu
	public readonly Overlay: MenuSDK.OverlayMenu

	private readonly entries = Menu.AddEntry("Visual")

	constructor() {
		this.Tree = this.entries.AddNode(
			"Net worth",
			NetWorthIcons.NetWorth,
			"Net worth of the heroes in a panel\nand of the teams beside the top bar"
		)
		this.Tree.SortNodes = false
		// a config saved before the team card and its rows were renamed keeps its values
		MenuSDK.AddConfigMigration(raw =>
			migrateNetWorth(MenuSDK.ConfigSubtreeOf(raw, this.Tree.entry))
		)
		migrateNetWorth(this.Tree.entry.stored)

		// the script's own switch rides the top bar beside the breadcrumb and gates the page
		this.State = this.Tree.AddToggle(
			"State",
			true,
			undefined,
			-1,
			NetWorthIcons.State
		)
		this.Tree.HeaderControl = this.State
		this.Tree.Gate = this.State
		this.Ally = this.Tree.AddToggle(
			"Allies",
			false,
			"Show allied heroes in the panel",
			-1,
			NetWorthIcons.Allies
		)
		this.Enemy = this.Tree.AddToggle(
			"Enemies",
			false,
			"Show enemy heroes in the panel",
			-1,
			NetWorthIcons.Enemies
		)
		this.Local = this.Tree.AddToggle(
			"Your net worth",
			false,
			"Show your own hero among the allies",
			-1,
			NetWorthIcons.Self
		)
		this.Local.IsHidden = true
		this.OnlyItems = this.Tree.AddToggle(
			"Only items",
			true,
			"Count the cost of the items alone,\nwithout the gold the hero is holding",
			-1,
			NetWorthIcons.OnlyItems
		)
		// the sort button on the panel's header flips this, the way the game's own does
		this.SortWithinTeam = this.Tree.AddToggle(
			"Sort within team",
			false,
			"Radiant above Dire, each team\nfrom the richest hero down",
			-1,
			NetWorthIcons.SortWithinTeam
		)
		this.Bar = this.Tree.AddToggle(
			"Bar",
			true,
			"A bar behind each value,\nas long as its share of the richest hero's",
			-1,
			NetWorthIcons.Bar
		)
		this.PlayerColors = this.Tree.AddToggle(
			"Player colors",
			false,
			"Color the strip beside the portrait\nin its player's color instead of the team's",
			-1,
			NetWorthIcons.PlayerColors
		)
		// the gold the game's stats panel writes its net worth in
		this.ValueColor = this.Tree.AddColorPicker("Value color", new Color(242, 195, 30))
		this.ValueColor.IconPath = NetWorthIcons.ValueColor
		// kept off the page: the panel's own title is where this is flipped, and it only
		// lives here so the fold survives a restart the way the panel's place does
		this.Collapsed = this.Tree.AddToggle("Collapsed", false)
		this.Collapsed.IsHidden = true

		const treeBinds = this.Tree.AddNode("Hotkeys", NetWorthIcons.Hotkeys)
		treeBinds.SortNodes = false
		this.ToggleKey = treeBinds.AddKeybind("Key", "None", "Key turn on/off panel")
		this.ToggleKey.IconPath = NetWorthIcons.Key
		this.ModeKey = treeBinds.AddDropdown(
			"Key mode",
			["Hold key", "Toggled"],
			1,
			"Key mode turn on/off panel"
		)
		this.ModeKey.IconPath = NetWorthIcons.KeyMode

		this.Overlay = new MenuSDK.OverlayMenu(this.Tree, 0, 309)
		this.Total = new TotalNetWorthMenu(this.Tree)
		this.Ally.OnValue(call => (this.Local.IsHidden = !call.value))
		this.State.OnValue(call => this.Overlay.SetHidden(!call.value))
		this.Overlay.SetHidden(!this.State.value)
		this.ToggleKey.OnRelease(() => (this.IsToggled = !this.IsToggled))
	}

	public get IsOpen(): boolean {
		return MenuSDK.MenuManager.IsOpen && this.Tree.IsOpen
	}
}

/**
 * Carries the team card saved under its old name, and its difference row under its old one, over
 * to the names they have now. Idempotent, as a migration must be: a config already saved in the
 * new shape passes through untouched.
 */
function migrateNetWorth(stored: Nullable<MenuSDK.ConfigObject>): void {
	if (stored === undefined) {
		return
	}
	MenuSDK.RenameStoredRow(stored, TeamsOldName, "Team totals")
	const teams = stored["Team totals"]
	if (typeof teams === "object" && teams !== null && !Array.isArray(teams)) {
		MenuSDK.RenameStoredRow(
			teams as MenuSDK.ConfigObject,
			DifferenceOldName,
			"Only difference"
		)
	}
}
