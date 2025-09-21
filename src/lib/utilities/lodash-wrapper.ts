import { debounce, throttle } from 'lodash-es';
export function asyncDebounce<T, R>(
    func: (arg: T) => Promise<R>,
    wait: number
): (arg: T) => Promise<R> {
    const debounced = debounce(
        (resolve: (value: R) => void, reject: (reason: any) => void, arg: T) => {
            func(arg)
                .then(resolve)
                .catch(reject);
        },
        wait
    );

    return (arg: T): Promise<R> => {
        return new Promise((resolve, reject) => {
            debounced(resolve, reject, arg);
        });
    };
}
export function asyncThrottle<T, R>(
    func: (arg: T) => Promise<R>,
    wait: number
): (arg: T) => Promise<R> {
    const throttled = throttle(
        (resolve: (value: R) => void, reject: (reason: any) => void, arg: T) => {
            func(arg)
                .then(resolve)
                .catch(reject);
        },
        wait
    );

    return (arg: T): Promise<R> => {
        return new Promise((resolve, reject) => {
            throttled(resolve, reject, arg);
        });
    };
}