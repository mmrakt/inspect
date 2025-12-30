import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@shared/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@shared/components/ui/select";
import { type ThemeMode, useTheme } from "@shared/hooks/use-theme";

interface SettingsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
	const { mode, setThemeMode } = useTheme();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
					<DialogDescription>
						Customize your application preferences
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<label htmlFor="theme" className="text-sm font-medium">
							Theme
						</label>
						<Select
							value={mode}
							onValueChange={(value) => setThemeMode(value as ThemeMode)}
						>
							<SelectTrigger id="theme">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="light">Light</SelectItem>
								<SelectItem value="dark">Dark</SelectItem>
								<SelectItem value="system">System</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
