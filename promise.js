const defer = (func) => queueMicrotask(() => func());
const callable = obj => Boolean(obj) && typeof obj === 'function';
const thenable = obj => Boolean(obj) && callable(obj.then);

const PromiseState = {
    fulfilled: 'fulfilled',
    rejected: 'rejected',
    pending: 'pending',
};

class MyPromise {
    constructor(handler) {
        if (!callable(handler)) {
            throw new Error('Handler is not callable');
        }
        
        this.state = PromiseState.pending;
        this.result = undefined;
        this._resolveQueue = [];
        this._rejectQueue = [];

        try {
            handler(this._resolve, this._reject);
        } catch (e) {
            this._reject(e);
        }
    }

    then = (resolveCallback, rejectCallback) => {
        if (resolveCallback && !callable(resolveCallback)) {
            throw new Error('Resolve argument is not callable');
        }

        if (rejectCallback && !callable(rejectCallback)) {
            throw new Error('Reject argument is not callable');
        }

        return new MyPromise((resolve, reject) => {
            this._resolveQueue.push((resolution) => {
                try {
                    const res = resolveCallback ? resolveCallback(resolution) : resolution;
                    resolve(res);
                } catch (e) {
                    reject(e);
                }
            });

            this._rejectQueue.push((reason) => {
                try {
                    if (rejectCallback) {
                        resolve(rejectCallback(reason));
                    } else {
                        reject(reason);
                    }
                } catch (e) {
                    reject(e);
                }
            });

            this._executeQueue();
        });
    }

    catch = (rejectCallback) => {
        return this.then(undefined, rejectCallback);
    }

    finally = (finallyCallback) => {
        if (!callable(finallyCallback)) {
            throw new Error('Finally argument is not callable');
        }

        const resolveCallback = (resolution) => {
            finallyCallback();
            return resolution;
        };

        const rejectCallback = (reason) => {
            finallyCallback();
            throw reason;
        };
        
        return this.then(resolveCallback, rejectCallback);
    }

    _resolve = (resolution) => {
        const handler = () => {
            if (this.state !== PromiseState.pending) {
                return;
            }

            if (thenable(resolution)) {
                resolution.then(this._resolve, this._reject);
            } else {
                this._fulfillPromise(resolution);
            }
            
            this._executeQueue();
        };

        defer(handler);
    }

    _reject = (reason) => {
        const handler = () => {
            if (this.state !== PromiseState.pending) {
                return;
            }

            this._rejectPromise(reason);
            this._executeQueue();
        };

        defer(handler);
    }

    _executeQueue() {
        if (this.state === PromiseState.pending) {
            return;
        }

        if (this.state === PromiseState.fulfilled) {
            while (this._resolveQueue.length) {
                const resolveCallback = this._resolveQueue.shift();
    
                try {
                    resolveCallback(this.result);
                } catch (e) {
                    this._reject(e);
                }
            }

            return;
        }

        while (this._rejectQueue.length) {
            const rejectCallback = this._rejectQueue.shift();

            try {
                rejectCallback(this.result);
            } catch (e) {
                this._reject(e);
            }
        }
    }

    _fulfillPromise = (result) => {
        this.state = PromiseState.fulfilled;
        this.result = result;
    }

    _rejectPromise = (reason) => {
        this.state = PromiseState.rejected;
        this.result = reason;
    }
}

