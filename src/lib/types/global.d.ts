// biome-ignore lint/correctness/noUnusedVariables: shut it cunt
interface GlobalState {
    authenticated: boolean;
    currentPage: string;
    os: string;
    read(path: FILES): Promise<void>;
    write(path: FILES, contents: string): Promise<void>;
    get_os(): Promise<string>;
    reset(): void;
}