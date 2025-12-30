export interface FileMetadata {
	size: number;
	mtime: number | null;
	is_dir: boolean;
}

export interface FileEntry {
	path: string;
	name: string;
	metadata: FileMetadata;
}

export interface ContentMatch {
	line_number: number;
	line_content: string;
}

export interface SearchResult {
	path: string;
	matches: ContentMatch[];
}
