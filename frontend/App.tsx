import { FileList } from "@features/file-manager/components/file-list";
import { Layout } from "@shared/components/Layout";
import { useApp } from "./apps/hooks/use-app";

function App() {
	const {
		searchQuery,
		setSearchQuery,
		currentPath,
		setCurrentPath,
		shouldShowHidden,
	} = useApp();

	if (currentPath === null) {
		return null; // Or a global loading spinner
	}

	return (
		<Layout
			searchQuery={searchQuery}
			onSearchChange={setSearchQuery}
			currentPath={currentPath}
			onPathChange={setCurrentPath}
		>
			<FileList
				searchQuery={searchQuery}
				currentPath={currentPath}
				shouldShowHidden={shouldShowHidden}
				onPathChange={setCurrentPath}
			/>
		</Layout>
	);
}

export default App;
