/** Root the loader mounts this package at: a spelled-out repository path does not resolve. */
const iconsPath = `${__OCT_PACKAGE_ROOT__}/scripts_files/net-worth/icons`

/** Glyphs of the net worth menu: the page, its sections and the rows inside. */
export const NetWorthIcons = {
	NetWorth: ImageData.Icons.chat_arrow_grow,
	// sections
	Hotkeys: Menu.Icons.Keyboard,
	Teams: `${iconsPath}/coins.svg`,
	// rows
	State: Menu.Icons.Power,
	Allies: `${iconsPath}/allies.svg`,
	Enemies: `${iconsPath}/enemies.svg`,
	Self: `${iconsPath}/self.svg`,
	OnlyItems: Menu.Icons.ItemList,
	SortWithinTeam: Menu.Icons.ListSplit,
	ValueColor: Menu.Icons.Palette,
	Key: Menu.Icons.Keyboard,
	KeyMode: Menu.Icons.ToggleLeft,
	Difference: Menu.Icons.ArrowUpDown,
	Opacity: Menu.Icons.PlateRaised,
	TextColor: Menu.Icons.Baseline
} as const
