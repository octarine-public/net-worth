import {
	Color,
	ImageData,
	Menu,
	Vector2,
	VKeys
} from "github.com/octarine-public/wrapper/index"
import { Paths } from "github.com/octarine-public/wrapper/wrapper/Data/ImageData"

export class TotalNetWorthMenu {
	public readonly State: Menu.Toggle
	public readonly Difference: Menu.Toggle
	public readonly TextColor: Menu.ColorPicker
	constructor(tree: Menu.Node) {
		const menu = tree.AddNode("Between teams", `${Paths.Icons.chat_arrow_down}`)
		menu.SortNodes = false
		this.State = menu.AddToggle("State", true)
		this.Difference = menu.AddToggle("Show only difference", true)
		this.TextColor = menu.AddColorPicker("Text color", new Color(242, 195, 30))
	}

	public ResetSettings() {
		this.State.value = this.State.defaultValue
		this.Difference.value = this.Difference.defaultValue
		this.TextColor.SelectedColor.CopyFrom(this.TextColor.defaultColor)
	}
}

export class MenuManager {
	public IsToggled = true
	public readonly Reset: Menu.Button
	public readonly State: Menu.Toggle
	public readonly Ally: Menu.Toggle
	public readonly Enemy: Menu.Toggle
	public readonly Local: Menu.Toggle
	public readonly Opacity: Menu.Slider
	public readonly OnlyItems: Menu.Toggle

	public readonly ModeKey: Menu.Dropdown
	public readonly ToggleKey: Menu.KeyBind
	public readonly TouchKeyPanel: Menu.KeyBind

	public readonly Size: Menu.Slider
	public readonly Total: TotalNetWorthMenu

	public readonly Position: {
		readonly node: Menu.Node
		readonly X: Menu.Slider
		readonly Y: Menu.Slider
		Vector: Vector2
	}
	public readonly OutlinedText: Menu.Toggle
	constructor() {
		const entries = Menu.AddEntry("Visual")
		const menu = entries.AddNode("Net worth", `${Paths.Icons.chat_arrow_grow}`)
		menu.SortNodes = false

		this.State = menu.AddToggle("State", true)
		this.Ally = menu.AddToggle("Allies", false)
		this.Enemy = menu.AddToggle("Enemies", false)
		this.OnlyItems = menu.AddToggle("Only items", true, "Calculate only by items")
		this.Local = menu.AddToggle("Your net worth", false, "Show your own net worth")
		this.Local.IsHidden = true

		const treeBinds = menu.AddNode("Hotkeys", ImageData.Paths.Icons.icon_svg_keyboard)
		treeBinds.SortNodes = false
		this.ToggleKey = treeBinds.AddKeybind("Key", "None", "Key turn on/off panel")
		this.TouchKeyPanel = treeBinds.AddKeybind(
			"Touch panel",
			"Ctrl",
			"The button captures the panel\nfor dragging on the screen.\nIf the button is not set, the panel can only\nbe dragged using the mouse"
		)
		this.ModeKey = treeBinds.AddDropdown(
			"Key mode",
			["Hold key", "Toggled"],
			1,
			"Key mode turn on/off panel"
		)

		const settingsTree = menu.AddNode("Settings heroes", "menu/icons/settings.svg")
		settingsTree.SortNodes = false

		this.OutlinedText = settingsTree.AddToggle("Outlined text", true)
		this.Size = settingsTree.AddSlider("Size", 0, 0, 20)
		this.Opacity = settingsTree.AddSlider("Opacity", 0, 0, 70)
		this.Position = menu.AddVector2(
			"Settings heroes",
			new Vector2(0, 309),
			new Vector2(0, 0),
			new Vector2(1920, 1080)
		)
		this.Total = new TotalNetWorthMenu(menu)
		this.Reset = menu.AddButton("Reset", "Reset settings")
		this.Ally.OnValue(call => (this.Local.IsHidden = !call.value))
		this.ToggleKey.OnRelease(() => (this.IsToggled = !this.IsToggled))
	}

	public ResetSettings() {
		this.Total.ResetSettings()
		this.Size.value = this.Size.defaultValue
		this.Opacity.value = this.Opacity.defaultValue
		this.Position.X.value = this.Position.X.defaultValue
		this.Position.Y.value = this.Position.Y.defaultValue
		this.State.value = this.State.defaultValue
		this.Ally.value = this.Ally.defaultValue
		this.Local.value = this.Local.defaultValue
		this.Enemy.value = this.Enemy.defaultValue
		this.TouchKeyPanel.assignedKey = VKeys.CONTROL
		this.TouchKeyPanel.assignedKeyStr = this.TouchKeyPanel.defaultKey
		this.ToggleKey.assignedKey = -1
		this.ToggleKey.assignedKeyStr = this.ToggleKey.defaultKey
		this.ModeKey.SelectedID = this.ModeKey.defaultValue
		this.Local.IsHidden = !this.Ally.value
	}
}
