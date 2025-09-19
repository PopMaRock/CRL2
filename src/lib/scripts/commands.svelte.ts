import { invoke } from '@tauri-apps/api/core';

export const preventDefault = <T extends Event>(fn: (e: T) => void): ((e: T) => void) => {
    return (e: T) => {
        e.preventDefault();
        fn(e);
    };
};

export enum FILES {
    GREET_FILE = 'greet.txt',
    NAME_FILE = 'name.txt'
}

export class gState {
    private _state = $state(
        {
            authenticated: true,
            currentPage: '',
            os: '',
        }
    );
    get authenticated() {
        return this._state.authenticated;
    }
    set authenticated(value: boolean) {
        this._state.authenticated = value;
    }
    get currentPage() {
        return this._state.currentPage;
    }
    set currentPage(value: string) {
       this._state.currentPage = value;
    }
    get os() {
        return this._state.os;
    }
    async get_os() {
        if(!this._state.os)
            this._state.os = await invoke<string>('get_os');
        return this._state.os;
    }
    async read(path: FILES) {
        const contentFromFile = await invoke<string>('read', { path });
        if (path === FILES.NAME_FILE) {
           // this.name = contentFromFile;
        }
    }

    async write(path: FILES, contents: string) {
        await invoke('write', { path, contents });
        if (path === FILES.NAME_FILE) {
           // this.name = contents;
        }
    }

    reset() {
        this.authenticated = false;
    }
}
