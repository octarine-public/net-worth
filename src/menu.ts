export class TotalNetWorthMenu {
	public readonly State: Menu.Toggle
	public readonly Difference: Menu.Toggle
	public readonly TextColor: Menu.ColorPicker
	constructor(tree: Menu.Node) {
		const menu = tree.AddNode("Between teams", `${ImageData.Icons.chat_arrow_down}`)
		menu.SortNodes = false
		this.State = menu.AddToggle("State", true)
		this.Difference = menu.AddToggle("Show only difference", true)
		this.TextColor = menu.AddColorPicker("Text color", new Color(242, 195, 30))
	}
}

export class MenuManager {
	public IsToggled = true
	public readonly State: Menu.Toggle
	public readonly Ally: Menu.Toggle
	public readonly Enemy: Menu.Toggle
	public readonly Local: Menu.Toggle
	public readonly OnlyItems: Menu.Toggle

	public readonly ModeKey: Menu.Dropdown
	public readonly ToggleKey: Menu.KeyBind

	public readonly Tree: Menu.Node
	public readonly Total: TotalNetWorthMenu
	public readonly Overlay: MenuSDK.OverlayMenu

	private readonly entries = Menu.AddEntry("Visual")

	constructor() {
		this.Tree = this.entries.AddNode(
			"Net worth",
			`${ImageData.Icons.chat_arrow_grow}`
		)
		this.Tree.SortNodes = false

		this.State = this.Tree.AddToggle("State", true)
		this.Ally = this.Tree.AddToggle("Allies", false)
		this.Enemy = this.Tree.AddToggle("Enemies", false)
		this.OnlyItems = this.Tree.AddToggle(
			"Only items",
			true,
			"Calculate only by items"
		)
		this.Local = this.Tree.AddToggle(
			"Your net worth",
			false,
			"Show your own net worth"
		)
		this.Local.IsHidden = true

		const treeBinds = this.Tree.AddNode("Hotkeys", ImageData.Icons.icon_svg_keyboard)
		treeBinds.SortNodes = false
		this.ToggleKey = treeBinds.AddKeybind("Key", "None", "Key turn on/off panel")
		this.ModeKey = treeBinds.AddDropdown(
			"Key mode",
			["Hold key", "Toggled"],
			1,
			"Key mode turn on/off panel"
		)

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
