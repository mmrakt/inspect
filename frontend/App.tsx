import { useState } from "react";
import { FileList } from "@features/file-manager/components/file-list";
import { Layout } from "@shared/components/Layout";

function App() {
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPath, setCurrentPath] = useState(".");

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
				onPathChange={setCurrentPath}
			/>
		</Layout>
	);
}

export default App;
